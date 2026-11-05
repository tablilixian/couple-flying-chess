import { describe, it, expect, beforeEach, vi } from 'vitest';
import { installMemoryStorage, resetMemoryStorage, store } from './helpers/memoryStorage';

// 必须在被测模块读取 localStorage 之前装好
installMemoryStorage();

import {
  loadSessions,
  loadPendingSession,
  discardPendingSession,
  startNewSession,
  addEntryToCurrentSession,
  finalizeCurrentSession,
  clearAllSessions,
  downloadSessionsAsJson,
  TaskHistoryEntry,
  GameSession,
} from '../utils/gameSession';
import {
  loadFromStorage,
  saveToStorage,
  removeFromStorage,
  loadRawString,
  saveRawString,
} from '../utils/localStorage';
import { subscribeStorageErrors, describeStorageError } from '../utils/storageStatus';
import {
  THEME_KEYS,
  SESSION_KEYS,
  LEGACY_STATE_KEYS,
  GAME_SESSIONS_KEY,
  PENDING_SESSION_KEY,
  clearAllLocalData,
} from '../utils/storageKeys';
import { readPersistedState, migrateLegacyState, normalizeSession } from '../hooks/useGameState';
import { COUPLE_DEFAULT_THEMES } from '../data/themes';

beforeEach(() => {
  resetMemoryStorage();
});

function makeEntry(text: string): TaskHistoryEntry {
  return {
    id: `e_${text}`,
    timestamp: Date.now(),
    resolvedAt: Date.now(),
    duration: 5,
    round: 1,
    executorName: '甲',
    task: text,
    completed: true,
    type: 'truth',
  };
}

// ─────────────────────────────────────────────────────────────
// P2 pending-session 幽灵条目
// 回归用例：旧实现里 loadSessions 会把 pending-session 直接 unshift 进
// 历史列表，同一局同时出现在「进行中」和「历史」两处，
// 且 endTime=0 的半截对局被当成已完成局展示。
// ─────────────────────────────────────────────────────────────

describe('pending-session · 未归档对局不再混进历史列表', () => {
  it('loadSessions 只返回已归档对局', () => {
    startNewSession('couple', [
      { id: 0, name: '甲', themeName: 'T' },
      { id: 1, name: '乙', themeName: 'T' },
    ]);
    addEntryToCurrentSession(makeEntry('未完成的一题'));

    expect(loadSessions()).toHaveLength(0);
    expect(loadPendingSession()).not.toBeNull();
    expect(loadPendingSession()!.entries).toHaveLength(1);
  });

  it('归档后 pending 被清除，历史里只出现一次', () => {
    startNewSession('couple', [
      { id: 0, name: '甲', themeName: 'T' },
      { id: 1, name: '乙', themeName: 'T' },
    ]);
    addEntryToCurrentSession(makeEntry('一题'));
    finalizeCurrentSession();

    expect(loadSessions()).toHaveLength(1);
    expect(loadPendingSession()).toBeNull();
    expect(loadFromStorage(PENDING_SESSION_KEY, 'x')).toBe('x');
  });

  it('重复归档不会产生重复条目', () => {
    startNewSession('couple', [
      { id: 0, name: '甲', themeName: 'T' },
      { id: 1, name: '乙', themeName: 'T' },
    ]);
    addEntryToCurrentSession(makeEntry('一题'));
    finalizeCurrentSession();
    // 第二次归档应当是空操作（currentSession 已置空）
    finalizeCurrentSession();

    expect(loadSessions()).toHaveLength(1);
  });

  it('历史里已存在的重复条目会被去重', () => {
    startNewSession('couple', [
      { id: 0, name: '甲', themeName: 'T' },
      { id: 1, name: '乙', themeName: 'T' },
    ]);
    addEntryToCurrentSession(makeEntry('一题'));
    finalizeCurrentSession();

    // 模拟历史里已被写脏（同一局出现两次）
    const stored = loadFromStorage<GameSession[]>(GAME_SESSIONS_KEY, []);
    stored.unshift({ ...stored[0] });
    saveToStorage(GAME_SESSIONS_KEY, stored);

    const sessions = loadSessions();
    const ids = sessions.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('残留的 pending 对局可以被单独丢弃', () => {
    startNewSession('couple', [
      { id: 0, name: '甲', themeName: 'T' },
      { id: 1, name: '乙', themeName: 'T' },
    ]);
    addEntryToCurrentSession(makeEntry('一题'));
    discardPendingSession();

    expect(loadPendingSession()).toBeNull();
    expect(loadSessions()).toHaveLength(0);
  });

  it('导出的 JSON 把未归档对局单独成键，不会被误读成已完成局', async () => {
    startNewSession('couple', [
      { id: 0, name: '甲', themeName: 'T' },
      { id: 1, name: '乙', themeName: 'T' },
    ]);
    addEntryToCurrentSession(makeEntry('一题'));

    // node 环境没有 DOM，桩出最小可用的 document / URL
    let payload = '';
    const OriginalBlob = globalThis.Blob;
    class CapturingBlob extends OriginalBlob {
      constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        payload = String(parts?.[0] ?? '');
      }
    }
    (globalThis as unknown as { Blob: typeof Blob }).Blob = CapturingBlob;
    (globalThis as unknown as { document: unknown }).document = {
      createElement: () => ({ href: '', download: '', click: () => {} }),
    };
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:stub');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    downloadSessionsAsJson();

    (globalThis as unknown as { Blob: typeof Blob }).Blob = OriginalBlob;
    delete (globalThis as unknown as { document?: unknown }).document;

    const parsed = JSON.parse(payload);
    expect(Array.isArray(parsed.sessions)).toBe(true);
    expect(parsed.sessions).toHaveLength(0);
    expect(parsed.pendingSession).not.toBeNull();
    expect(parsed.pendingSession.entries).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────
// P3 存储读写失败可见化
// ─────────────────────────────────────────────────────────────

describe('localStorage 读写失败不再静默', () => {
  it('写入失败时上报错误事件', () => {
    const seen: string[] = [];
    const unsubscribe = subscribeStorageErrors(err => seen.push(err.operation));

    store.failOn.set = true;
    const ok = saveToStorage('some-key', { a: 1 });

    expect(ok).toBe(false);
    expect(seen).toContain('write');
    unsubscribe();
  });

  it('读取到非法 JSON 时上报错误并回退默认值', () => {
    const seen: string[] = [];
    const unsubscribe = subscribeStorageErrors(err => seen.push(err.operation));

    store.setItem('broken', '{ not json');
    const value = loadFromStorage('broken', { fallback: true });

    expect(value).toEqual({ fallback: true });
    expect(seen).toContain('read');
    unsubscribe();
  });

  it('删除失败时也上报', () => {
    const seen: string[] = [];
    const unsubscribe = subscribeStorageErrors(err => seen.push(err.operation));

    store.failOn.remove = true;
    const ok = removeFromStorage('some-key');

    expect(ok).toBe(false);
    expect(seen).toContain('remove');
    unsubscribe();
  });

  it('订阅可以取消，取消后不再收到事件', () => {
    const seen: string[] = [];
    const unsubscribe = subscribeStorageErrors(err => seen.push(err.operation));
    unsubscribe();

    store.failOn.set = true;
    saveToStorage('k', 1);

    expect(seen).toHaveLength(0);
  });

  it('配额超限的提示是人话而不是原始异常', () => {
    const message = describeStorageError({
      key: 'k',
      operation: 'write',
      message: 'QuotaExceededError: storage quota exceeded',
      timestamp: Date.now(),
    });
    expect(message).toContain('存储空间已满');
  });

  it('原始字符串存取不会把 1234 变成数字', () => {
    saveRawString('pwd', '1234');
    expect(loadRawString('pwd')).toBe('1234');
    expect(loadFromStorage('pwd', 'x')).toBe(1234 as unknown as string);
  });
});

// ─────────────────────────────────────────────────────────────
// P3 存储分键 + 旧键迁移
// ─────────────────────────────────────────────────────────────

describe('存储分键 · themes 与会话切片分开存放', () => {
  it('新键存在时不走迁移路径', () => {
    saveToStorage(THEME_KEYS.couple, COUPLE_DEFAULT_THEMES);
    saveToStorage(SESSION_KEYS.couple, { view: 'home', turn: 0, mode: 'couple' });

    const persisted = readPersistedState('couple');
    expect(persisted.legacy).toBe(false);
    expect(persisted.themes).not.toBeNull();
    expect(persisted.session).not.toBeNull();
  });

  it('只有旧键时标记为待迁移', () => {
    saveToStorage(LEGACY_STATE_KEYS.couple, {
      view: 'game',
      turn: 1,
      players: [],
      themes: COUPLE_DEFAULT_THEMES,
      boardMap: [],
      pathCoords: [],
      isRolling: false,
      mode: 'couple',
      maleStatus: { action: null, condition: null },
      femaleStatus: { action: null, condition: null },
      recentTasks: [],
    });

    const persisted = readPersistedState('couple');
    expect(persisted.legacy).toBe(true);
    expect(persisted.themes).not.toBeNull();
    expect(persisted.session).not.toBeNull();
  });

  it('迁移后写入新键并删除旧键', () => {
    saveToStorage(LEGACY_STATE_KEYS.couple, {
      view: 'game',
      turn: 1,
      players: [],
      themes: COUPLE_DEFAULT_THEMES,
      boardMap: [],
      pathCoords: [],
      isRolling: false,
      mode: 'couple',
      maleStatus: { action: null, condition: null },
      femaleStatus: { action: null, condition: null },
      recentTasks: [],
    });

    const persisted = readPersistedState('couple');
    migrateLegacyState('couple', persisted);

    expect(loadFromStorage(THEME_KEYS.couple, null)).not.toBeNull();
    expect(loadFromStorage(SESSION_KEYS.couple, null)).not.toBeNull();
    expect(loadFromStorage(LEGACY_STATE_KEYS.couple, null)).toBeNull();
  });

  it('迁移是幂等的，重复执行不会重复写', () => {
    saveToStorage(LEGACY_STATE_KEYS.couple, {
      view: 'home',
      turn: 0,
      players: [],
      themes: [],
      boardMap: [],
      pathCoords: [],
      isRolling: false,
      mode: 'couple',
      maleStatus: { action: null, condition: null },
      femaleStatus: { action: null, condition: null },
      recentTasks: [],
    });

    const first = readPersistedState('couple');
    migrateLegacyState('couple', first);

    const second = readPersistedState('couple');
    expect(second.legacy).toBe(false);
    migrateLegacyState('couple', second);
    expect(loadFromStorage(LEGACY_STATE_KEYS.couple, null)).toBeNull();
  });

  it('会话切片归一化时使用传入的 themes，不依赖切片里自带 themes', () => {
    const themes = COUPLE_DEFAULT_THEMES.slice(0, 2);
    const normalized = normalizeSession(
      {
        view: 'game',
        turn: 1,
        players: [],
        boardMap: [],
        pathCoords: [],
        isRolling: false,
        mode: 'couple',
        maleStatus: { action: null, condition: null },
        femaleStatus: { action: null, condition: null },
        recentTasks: [],
      },
      themes,
      'couple'
    );

    expect(normalized).not.toBeNull();
    expect(normalized!.themes).toBe(themes);
  });

  it('模式不匹配时拒绝归一化（避免串档）', () => {
    const normalized = normalizeSession({ mode: 'normal' }, COUPLE_DEFAULT_THEMES, 'couple');
    expect(normalized).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// P3 一键清除覆盖全部已知键
// ─────────────────────────────────────────────────────────────

describe('clearAllLocalData · 覆盖拆分后的新键与动态前缀键', () => {
  it('清掉所有已知键', () => {
    saveToStorage(THEME_KEYS.couple, []);
    saveToStorage(SESSION_KEYS.couple, {});
    saveToStorage(LEGACY_STATE_KEYS.couple, {});
    saveToStorage(GAME_SESSIONS_KEY, []);
    saveToStorage(PENDING_SESSION_KEY, null);
    saveRawString('couple-password', '1234');

    clearAllLocalData();

    expect(loadFromStorage(THEME_KEYS.couple, 'gone')).toBe('gone');
    expect(loadFromStorage(SESSION_KEYS.couple, 'gone')).toBe('gone');
    expect(loadFromStorage(GAME_SESSIONS_KEY, 'gone')).toBe('gone');
    expect(loadRawString('couple-password')).toBeNull();
  });

  it('沉浸剧场进度按前缀清理', () => {
    store.setItem('immersive-progress-hotwifeNovel', JSON.stringify({ currentActIdx: 1 }));
    store.setItem('unrelated-key', 'keep');

    clearAllLocalData();

    expect(store.getItem('immersive-progress-hotwifeNovel')).toBeNull();
    expect(store.getItem('unrelated-key')).toBe('keep');
  });

  it('clearAllSessions 同样清掉 pending', () => {
    startNewSession('couple', [
      { id: 0, name: '甲', themeName: 'T' },
      { id: 1, name: '乙', themeName: 'T' },
    ]);
    addEntryToCurrentSession(makeEntry('一题'));

    clearAllSessions();

    expect(loadSessions()).toHaveLength(0);
    expect(loadPendingSession()).toBeNull();
  });
});
