import { describe, it, expect } from 'vitest';
import {
  mergeThemeTasks,
  normalizeGameState,
  normalizeThemes,
} from '../hooks/useGameState';
import { COUPLE_DEFAULT_THEMES, NORMAL_DEFAULT_THEMES } from '../data/themes';
import { buildOpeningStatus, buildStatus, isStatusEnabled } from '../utils/statusLogic';

// ─────────────────────────────────────────────────────────────
// P0-1 内置主题持久化
// 回归用例：早期实现读档时命中内置 id 就整份用代码默认值覆盖，
// 导致用户对内置主题的改名 / 删卡 / AI 导入全部丢失。
// ─────────────────────────────────────────────────────────────

describe('mergeThemeTasks · 内置主题任务列表三方合并', () => {
  // codeBaseline = 当前代码版本；userBase = 用户上次看到的代码版本；userTasks = 用户当前列表
  it('保留用户新增的任务', () => {
    const merged = mergeThemeTasks(['A', 'B', 'C'], ['A', 'B', 'C'], ['A', 'B', 'C', '用户加的']);
    expect(merged).toContain('用户加的');
    expect(merged).toHaveLength(4);
  });

  it('保留用户删除的任务（不复活）', () => {
    const merged = mergeThemeTasks(['A', 'B', 'C'], ['A', 'B', 'C'], ['A', 'C']);
    expect(merged).not.toContain('B');
    expect(merged).toEqual(['A', 'C']);
  });

  it('代码版本新增的任务会随更新下发', () => {
    // 代码从 [A,B,C] 变成 [A,B,C,D]，用户没动过
    const merged = mergeThemeTasks(['A', 'B', 'C', 'D'], ['A', 'B', 'C'], ['A', 'B', 'C']);
    expect(merged).toContain('D');
  });

  it('同时处理用户新增、用户删除与代码新增', () => {
    const merged = mergeThemeTasks(['A', 'B', 'C', 'D'], ['A', 'B', 'C'], ['A', 'C', '用户加的']);
    expect(merged).toContain('D');
    expect(merged).toContain('用户加的');
    expect(merged).not.toContain('B');
  });

  it('用户删掉的代码新增项不会复活', () => {
    // D 是上一轮随代码更新下发的，用户这轮把它删了
    const merged = mergeThemeTasks(['A', 'B', 'C', 'D'], ['A', 'B', 'C', 'D'], ['A', 'C']);
    expect(merged).not.toContain('D');
  });

  it('结果不产生重复项', () => {
    const merged = mergeThemeTasks(['A', 'B', 'C', 'D'], ['A', 'B', 'C'], ['A', 'C', 'D', 'D']);
    expect(merged).toHaveLength(new Set(merged).size);
  });

  it('存储为空数组时视为用户清空，全部剔除', () => {
    const merged = mergeThemeTasks(['A', 'B', 'C'], ['A', 'B', 'C'], []);
    expect(merged).toEqual([]);
  });
});

describe('normalizeThemes · 内置主题的用户改动不再丢失', () => {
  it('内置主题改名后读档仍保留新名字', () => {
    const target = COUPLE_DEFAULT_THEMES.find(t => t.id === 'warmup')!;
    const stored = [{ ...target, name: '我的专属升温包' }];

    const result = normalizeThemes(stored, 'couple');
    const after = result.find(t => t.id === 'warmup');

    expect(after).toBeDefined();
    expect(after!.name).toBe('我的专属升温包');
  });

  it('内置主题手动新增 + AI 导入的任务在读档后仍然存在', () => {
    const target = COUPLE_DEFAULT_THEMES.find(t => t.id === 'warmup')!;
    const added = ['【手加第1条】', '【手加第2条】'];
    const aiImported = Array.from({ length: 20 }, (_, i) => `【AI导入第${i + 1}条】`);
    const stored = [{ ...target, tasks: [...target.tasks, ...added, ...aiImported] }];

    const result = normalizeThemes(stored, 'couple');
    const after = result.find(t => t.id === 'warmup')!;

    expect(after.tasks.length).toBe(target.tasks.length + added.length + aiImported.length);
    for (const t of [...added, ...aiImported]) {
      expect(after.tasks).toContain(t);
    }
  });

  it('内置主题删除的任务在读档后不会复活（有基线快照的正常路径）', () => {
    const target = COUPLE_DEFAULT_THEMES.find(t => t.id === 'warmup')!;
    const removed = target.tasks[0];
    // 正常路径：存档里带 baseTasks（用户上次看到的代码版本）
    const stored = [{ ...target, baseTasks: target.tasks, tasks: target.tasks.slice(1) }];

    const result = normalizeThemes(stored, 'couple');
    const after = result.find(t => t.id === 'warmup')!;

    expect(after.tasks).not.toContain(removed);
  });

  it('连续两次刷新后用户改动依然保留（真实使用路径）', () => {
    const target = COUPLE_DEFAULT_THEMES.find(t => t.id === 'warmup')!;
    const removed = target.tasks[0];
    const added = '【手加第1条】';

    // 第一次读档（老版本数据，无 baseTasks → 迁移路径）
    const first = normalizeThemes(
      [{ ...target, tasks: target.tasks.filter(t => t !== removed).concat(added) }],
      'couple'
    );
    const firstTheme = first.find(t => t.id === 'warmup')!;
    expect(firstTheme.tasks).toContain(added);
    // 迁移路径以代码为准：老存档里分不清「用户删的」和「代码加的」，
    // 只能保证代码新增的题下发（见下面那条用例）。
    expect(firstTheme.tasks).toContain(removed);

    // 第一次读档已经把 baseTasks 写成当前代码基线，落盘后再次读档
    const second = normalizeThemes([firstTheme], 'couple');
    const secondTheme = second.find(t => t.id === 'warmup')!;

    expect(secondTheme.tasks).toContain(added);
    expect(secondTheme.tasks.length).toBe(firstTheme.tasks.length);
  });

  it('老存档（没有基线快照）也要拿到代码新增的任务，且不能被当成用户删除', () => {
    // 复现路径：用户是老玩家，存档里只有 tasks、没有 baseTasks（迁移路径）。
    // 代码这时给内置包加了新题。
    const target = COUPLE_DEFAULT_THEMES.find(t => t.id === 'warmup')!;
    const oldBaseline = target.tasks.slice(0, -1); // 用户当初看到的那一版
    const newTask = target.tasks[target.tasks.length - 1]; // 代码新增的那条

    // 第一次读档：老存档没有 baseTasks
    const first = normalizeThemes([{ ...target, tasks: oldBaseline }], 'couple');
    const firstTheme = first.find(t => t.id === 'warmup')!;

    // 关键：代码新增的题必须已经出现在用户列表里
    expect(firstTheme.tasks, '第一次读档就应该拿到代码新增的题').toContain(newTask);

    // 落盘后再读一次（baseTasks 此时已是新基线），新增的题不能被误判成「用户删除」
    const second = normalizeThemes([firstTheme], 'couple');
    const secondTheme = second.find(t => t.id === 'warmup')!;
    expect(secondTheme.tasks, '第二次读档新增的题不能消失').toContain(newTask);
  });

  it('老存档里用户自己加的题同样保留（迁移路径不吞用户内容）', () => {
    const target = COUPLE_DEFAULT_THEMES.find(t => t.id === 'warmup')!;
    const added = '【老存档里手加的】';
    const stored = [{ ...target, tasks: target.tasks.slice(0, -1).concat(added) }];

    const result = normalizeThemes(stored, 'couple');
    const after = result.find(t => t.id === 'warmup')!;

    expect(after.tasks).toContain(added);
  });

  it('内置主题读档后 baseTasks 推进到当前代码基线', () => {
    const target = COUPLE_DEFAULT_THEMES.find(t => t.id === 'warmup')!;
    const result = normalizeThemes([{ ...target }], 'couple');
    const after = result.find(t => t.id === 'warmup')!;

    expect(after.baseTasks).toEqual(target.tasks);
  });

  it('老存档（没有基线快照）也要拿到代码新增的任务，且不能被当成用户删除', () => {
    // 复现路径：用户是老玩家，存档里只有 tasks、没有 baseTasks（迁移路径）。
    // 代码这时给内置包加了新题。
    const target = COUPLE_DEFAULT_THEMES.find(t => t.id === 'warmup')!;
    const oldBaseline = target.tasks.slice(0, -1); // 用户当初看到的那一版
    const newTask = target.tasks[target.tasks.length - 1]; // 代码新增的那条

    // 第一次读档：老存档没有 baseTasks
    const first = normalizeThemes([{ ...target, tasks: oldBaseline }], 'couple');
    const firstTheme = first.find(t => t.id === 'warmup')!;

    // 关键：代码新增的题必须已经出现在用户列表里
    expect(firstTheme.tasks, '第一次读档就应该拿到代码新增的题').toContain(newTask);

    // 落盘后再读一次（baseTasks 此时已是新基线），新增的题不能被误判成「用户删除」
    const second = normalizeThemes([firstTheme], 'couple');
    const secondTheme = second.find(t => t.id === 'warmup')!;
    expect(secondTheme.tasks, '第二次读档新增的题不能消失').toContain(newTask);
  });

  it('用户自建主题的读写行为不变', () => {
    const custom = {
      id: 'user_abc',
      name: '我的包',
      desc: '',
      mode: 'couple' as const,
      audience: 'common' as const,
      tasks: ['我建的第1条', '我建的第2条'],
    };

    const result = normalizeThemes([custom], 'couple');
    const after = result.find(t => t.id === 'user_abc');

    expect(after).toBeDefined();
    expect(after!.tasks).toEqual(['我建的第1条', '我建的第2条']);
  });

  it('存储为空时回落到全部内置主题', () => {
    const result = normalizeThemes([], 'couple');
    expect(result.length).toBe(COUPLE_DEFAULT_THEMES.length);
    expect(result.every(t => t.mode === 'couple')).toBe(true);
  });

  it('普通模式只装载普通内置主题', () => {
    const result = normalizeThemes([], 'normal');
    expect(result.length).toBe(NORMAL_DEFAULT_THEMES.length);
    expect(result.every(t => t.mode === 'normal')).toBe(true);
  });
});

describe('normalizeGameState · 读档容错', () => {
  it('非对象输入返回 null（走默认初始态）', () => {
    expect(normalizeGameState(null, 'couple')).toBeNull();
    expect(normalizeGameState('garbage', 'couple')).toBeNull();
    expect(normalizeGameState([], 'couple')).toBeNull();
  });

  it('模式不匹配时拒绝读档，避免两种模式串档', () => {
    const saved = { mode: 'couple', players: [], themes: [], view: 'game' };
    expect(normalizeGameState(saved, 'normal')).toBeNull();
  });

  it('损坏的 tasks 字段被过滤为合法字符串数组', () => {
    const saved = {
      mode: 'couple',
      view: 'home',
      turn: 0,
      players: [],
      themes: [{ id: 'x', name: 'X', tasks: ['ok', 123, null, '  ', 'fine'] }],
    };
    const state = normalizeGameState(saved, 'couple');
    expect(state).not.toBeNull();
    expect(state!.themes.find(t => t.id === 'x')!.tasks).toEqual(['ok', 'fine']);
  });

  it('指向已删除主题的玩家会被解除绑定而不是崩掉', () => {
    const saved = {
      mode: 'couple',
      view: 'home',
      turn: 0,
      players: [
        { id: 0, name: 'A', color: '#000', role: 'male', step: 0, themeId: 'ghost-theme' },
        { id: 1, name: 'B', color: '#fff', role: 'female', step: 0, themeId: null },
      ],
      themes: [],
    };
    const state = normalizeGameState(saved, 'couple');
    expect(state).not.toBeNull();
    expect(state!.players[0].themeId).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// P0-2 状态系统按模式隔离
// 普通模式（朋友局/聚会局）不得出现任何成人状态。
// ─────────────────────────────────────────────────────────────

describe('状态系统 · mode 隔离', () => {
  it('isStatusEnabled 只对情侣模式为真', () => {
    expect(isStatusEnabled('couple')).toBe(true);
    expect(isStatusEnabled('normal')).toBe(false);
  });

  it('普通模式不生成开局状态', () => {
    expect(buildOpeningStatus('male', 'normal')).toBeNull();
    expect(buildOpeningStatus('female', 'normal')).toBeNull();
  });

  it('情侣模式正常生成开局状态', () => {
    const s = buildOpeningStatus('male', 'couple');
    expect(s).not.toBeNull();
    expect(s!.slot).toBe('action');
    expect(s!.description.length).toBeGreaterThan(0);
  });

  it('普通模式落状态格时返回 null（空操作）', () => {
    const theme = NORMAL_DEFAULT_THEMES[0];
    expect(buildStatus(theme, 'action', 'male', 'normal')).toBeNull();
    expect(buildStatus(theme, 'condition', 'female', 'normal')).toBeNull();
  });

  it('普通模式主题没有专属状态池时也不会回落到成人保底池', () => {
    const normalTheme = NORMAL_DEFAULT_THEMES[0];
    expect(normalTheme.actionStates).toBeUndefined();
    // 有状态池模式才会产出状态，普通模式一律 null
    expect(buildStatus(normalTheme, 'action', 'male', 'normal')).toBeNull();
  });

  it('情侣模式落状态格能产出状态，且带来源主题名', () => {
    const theme = COUPLE_DEFAULT_THEMES.find(t => t.id === 'warmup')!;
    const s = buildStatus(theme, 'action', 'male', 'couple');
    expect(s).not.toBeNull();
    expect(s!.sourceThemeName).toBe(theme.name);
  });
});
