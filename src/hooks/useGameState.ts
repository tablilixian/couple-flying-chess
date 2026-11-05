import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameMode, GameState, Player, TaskEventData, Theme, StatusEffect, PlayerStatusSlots } from '../types';
import { loadFromStorage, saveToStorage, removeFromStorage } from '../utils/localStorage';
import {
  THEME_KEYS,
  SESSION_KEYS,
  LEGACY_STATE_KEYS,
  PLAYER_NAMES_KEYS,
} from '../utils/storageKeys';
import { generateSpiralPath, generateBoardMap, calculateNewPosition } from '../utils/gameLogic';
import { COUPLE_DEFAULT_THEMES, NORMAL_DEFAULT_THEMES } from '../data/themes';
import { buildStatus, buildOpeningStatus, applyStatusToSlots } from '../utils/statusLogic';
import { personalizeTask, parseTaskTags } from '../utils/personalizeTask';

const RECENT_TASKS_LIMIT = 10;

const INITIAL_PLAYERS: Record<GameMode, Player[]> = {
  couple: [
    { id: 0, name: '男方', color: '#0A84FF', role: 'male', step: 0, themeId: null },
    { id: 1, name: '女方', color: '#FF375F', role: 'female', step: 0, themeId: null }
  ],
  normal: [
    { id: 0, name: '玩家 A', color: '#0A84FF', role: 'male', step: 0, themeId: null },
    { id: 1, name: '玩家 B', color: '#30D158', role: 'female', step: 0, themeId: null }
  ]
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function emptyStatusSlots(): PlayerStatusSlots {
  return { action: null, condition: null };
}

function normalizeStatusSlots(input: unknown): PlayerStatusSlots {
  if (!isRecord(input)) return emptyStatusSlots();
  const action = input.action;
  const condition = input.condition;
  return {
    action: isRecord(action) ? action as unknown as StatusEffect : null,
    condition: isRecord(condition) ? condition as unknown as StatusEffect : null
  };
}

function isThemeAllowedForRole(theme: Theme, role: Player['role']) {
  return theme.audience === 'common' || theme.audience === role;
}

function normalizePlayers(input: unknown, mode: GameMode): Player[] {
  const incoming = Array.isArray(input) ? input : [];
  const initialPlayers = INITIAL_PLAYERS[mode];

  return initialPlayers.map(base => {
    const found = incoming.find(
      p => isRecord(p) && typeof p.id === 'number' && p.id === base.id
    );
    const record = isRecord(found) ? found : {};
    const roleValue = record.role;
    const themeIdValue = record.themeId;

    return {
      id: base.id,
      name: typeof record.name === 'string' ? record.name : base.name,
      color: typeof record.color === 'string' ? record.color : base.color,
      role: roleValue === 'male' || roleValue === 'female' ? roleValue : base.role,
      step: typeof record.step === 'number' ? record.step : 0,
      themeId: typeof themeIdValue === 'string' || themeIdValue === null ? themeIdValue : null
    };
  });
}

function normalizeOneTheme(raw: unknown, mode: GameMode): Theme {
  const record = isRecord(raw) ? raw : {};
  const tasksValue = record.tasks;
  const tasks = Array.isArray(tasksValue)
    ? tasksValue
        .map(x => (typeof x === 'string' ? x.trim() : ''))
        .filter((x): x is string => x.length > 0)
    : [];

  const audienceValue = record.audience;
  const actionStatesValue = record.actionStates;
  const conditionStatesValue = record.conditionStates;

  return {
    id: typeof record.id === 'string' ? record.id : `theme_${Date.now()}`,
    name: typeof record.name === 'string' ? record.name : '未命名主题',
    desc: typeof record.desc === 'string' ? record.desc : '',
    mode: (record.mode === 'couple' || record.mode === 'normal' ? record.mode : mode) as GameMode,
    audience:
      audienceValue === 'common' || audienceValue === 'male' || audienceValue === 'female'
        ? audienceValue
        : 'common',
    tasks,
    actionStates: Array.isArray(actionStatesValue)
      ? actionStatesValue.map(x => (typeof x === 'string' ? x.trim() : '')).filter(x => x.length > 0)
      : undefined,
    conditionStates: Array.isArray(conditionStatesValue)
      ? conditionStatesValue.map(x => (typeof x === 'string' ? x.trim() : '')).filter(x => x.length > 0)
      : undefined,
    baseTasks: Array.isArray(record.baseTasks)
      ? record.baseTasks.map(x => (typeof x === 'string' ? x.trim() : '')).filter(x => x.length > 0)
      : undefined
  } satisfies Theme;
}

/**
 * 内置主题任务列表的三方合并。
 *
 * @param codeBaseline 当前代码版本的任务列表
 * @param userBase     用户上次看到的那版代码任务列表（存储里的 baseTasks）
 * @param userTasks    用户当前保存的任务列表
 *
 * 只有三方才能区分「用户删掉的」和「代码新增的」：
 *  - 用户保留的 = userBase ∩ userTasks
 *  - 代码新增的 = codeBaseline - userBase   → 随版本更新下发
 *  - 用户新增的 = userTasks - userBase      → 保留
 *  - 用户删除的 = userBase - userTasks      → 不复活
 */
export function mergeThemeTasks(
  codeBaseline: string[],
  userBase: string[],
  userTasks: string[]
): string[] {
  const userBaseSet = new Set(userBase);
  const userTasksSet = new Set(userTasks);

  const kept = userBase.filter(t => userTasksSet.has(t));
  const codeAdded = codeBaseline.filter(t => !userBaseSet.has(t));
  const userAdded = userTasks.filter(t => !userBaseSet.has(t));

  const merged: string[] = [];
  const seen = new Set<string>();
  for (const t of [...kept, ...codeAdded, ...userAdded]) {
    if (seen.has(t)) continue;
    seen.add(t);
    merged.push(t);
  }
  return merged;
}

export function normalizeThemes(input: unknown, mode: GameMode): Theme[] {
  const incoming = Array.isArray(input) ? input : [];
  const defaultThemes = mode === 'couple' ? COUPLE_DEFAULT_THEMES : NORMAL_DEFAULT_THEMES;

  if (incoming.length === 0) {
    return defaultThemes;
  }

  const defaultIds = new Set(defaultThemes.map(t => t.id));
  const result: Theme[] = [];
  const seenIds = new Set<string>();

  const cleanTasks = (v: unknown): string[] | null =>
    Array.isArray(v)
      ? v.map(x => (typeof x === 'string' ? x.trim() : '')).filter((x): x is string => x.length > 0)
      : null;

  for (const t of incoming) {
    const record = isRecord(t) ? t : {};
    const id = typeof record.id === 'string' ? record.id : '';
    if (!id || seenIds.has(id)) continue;

    if (defaultIds.has(id)) {
      // 内置主题：以代码为基线三方合并，保留用户的改动
      const dt = defaultThemes.find(x => x.id === id)!;
      const storedTasks = cleanTasks(record.tasks);
      const storedBase = cleanTasks(record.baseTasks);

      let tasks: string[];
      if (storedTasks === null) {
        // 用户从未碰过这个主题 → 直接用代码版本
        tasks = dt.tasks;
      } else if (storedBase === null) {
        // 迁移路径：老版本没有基线快照，先原样保留用户列表，
        // 本次读档后 baseTasks 会被写成当前代码基线，之后即可正常合并
        tasks = storedTasks;
      } else {
        tasks = mergeThemeTasks(dt.tasks, storedBase, storedTasks);
      }

      const merged = normalizeOneTheme(
        {
          ...record,
          // 用户可见字段以存储为准（改名 / 描述 / 适用范围），缺字段时回落代码版本
          id: dt.id,
          name: typeof record.name === 'string' ? record.name : dt.name,
          desc: typeof record.desc === 'string' ? record.desc : dt.desc,
          audience:
            record.audience === 'common' || record.audience === 'male' || record.audience === 'female'
              ? record.audience
              : dt.audience,
          mode: dt.mode,
          // 状态池不可由用户编辑，始终取代码版本
          actionStates: dt.actionStates,
          conditionStates: dt.conditionStates,
          // 基线快照推进到当前代码版本，供下次读档做差量合并
          baseTasks: dt.tasks,
          tasks,
        },
        mode
      );
      result.push(merged);
    } else {
      result.push(normalizeOneTheme(t, mode));
    }
    seenIds.add(id);
  }

  for (const dt of defaultThemes) {
    if (!seenIds.has(dt.id)) {
      result.push(normalizeOneTheme(dt, mode));
      seenIds.add(dt.id);
    }
  }

  return result;
}

export function normalizeGameState(saved: unknown, mode: GameMode): GameState | null {
  if (!isRecord(saved)) return null;
  const themes = normalizeThemes(saved.themes, mode);
  return normalizeSession(saved, themes, mode);
}

/**
 * 归一化「会话切片」——即不含 themes 的那部分状态。
 * 拆开是为了让 themes 与会话分键存储：themes 体量大（全部任务文案），
 * 但很少变化；会话体量小但每次操作都变。
 */
export function normalizeSession(sessionInput: unknown, themes: Theme[], mode: GameMode): GameState | null {
  if (!isRecord(sessionInput)) return null;
  const s = sessionInput;

  const savedMode = s.mode;
  const actualMode = (savedMode === 'couple' || savedMode === 'normal') ? savedMode : mode;

  if (actualMode !== mode) return null;

  const players = normalizePlayers(s.players, mode).map(p => {
    if (p.themeId === null) return p;
    const theme = themes.find(t => t.id === p.themeId);
    if (!theme) return { ...p, themeId: null };
    if (!isThemeAllowedForRole(theme, p.role)) return { ...p, themeId: null };
    return p;
  });

  return {
    view: s.view === 'home' || s.view === 'game' || s.view === 'themes' ? s.view : 'home',
    turn: s.turn === 0 || s.turn === 1 ? s.turn : 0,
    players,
    themes,
    boardMap: Array.isArray(s.boardMap) ? s.boardMap : generateBoardMap(),
    pathCoords: Array.isArray(s.pathCoords) ? s.pathCoords : generateSpiralPath(),
    isRolling: !!s.isRolling,
    mode,
    maleStatus: normalizeStatusSlots(s.maleStatus),
    femaleStatus: normalizeStatusSlots(s.femaleStatus),
    recentTasks: Array.isArray(s.recentTasks)
      ? s.recentTasks.filter((x): x is string => typeof x === 'string')
      : []
  };
}

/** 会话切片里不含 themes —— themes 单独存一个键 */
export type GameSessionSlice = Omit<GameState, 'themes'>;

function stripThemes(state: GameState): GameSessionSlice {
  const { themes: _themes, ...rest } = state;
  return rest;
}

/** 从持久层读出来的原始切片 */
export interface PersistedState {
  themes: Theme[] | null;
  session: GameSessionSlice | null;
  /** 是否命中旧版单键状态（需要迁移） */
  legacy: boolean;
}

/**
 * 读取持久化状态。
 * 优先读拆分后的两个新键；两者都没有时回退到旧版单键，并标记 legacy。
 */
export function readPersistedState(mode: GameMode): PersistedState {
  const savedThemes = loadFromStorage<Theme[] | null>(THEME_KEYS[mode], null);
  const savedSession = loadFromStorage<GameSessionSlice | null>(SESSION_KEYS[mode], null);

  if (savedThemes || savedSession) {
    return { themes: savedThemes, session: savedSession, legacy: false };
  }

  const legacy = loadFromStorage<GameState | null>(LEGACY_STATE_KEYS[mode], null);
  if (!legacy) return { themes: null, session: null, legacy: false };

  return {
    themes: legacy.themes ?? null,
    session: stripThemes(legacy),
    legacy: true,
  };
}

/**
 * 执行旧键 → 新键迁移：写入拆分后的两个键，然后删掉旧键。
 * 幂等：迁移后旧键不存在，重复调用不会重复写入。
 */
export function migrateLegacyState(mode: GameMode, persisted: PersistedState): void {
  if (!persisted.legacy) return;
  saveToStorage(THEME_KEYS[mode], persisted.themes ?? []);
  saveToStorage(SESSION_KEYS[mode], persisted.session);
  removeFromStorage(LEGACY_STATE_KEYS[mode]);
}

function createThemeId(existingIds: Set<string>) {
  const base =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? (crypto as Crypto).randomUUID()
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

  let id = `user_${base}`;
  while (existingIds.has(id)) {
    id = `user_${base}_${Math.random().toString(36).slice(2, 6)}`;
  }
  return id;
}

export function useGameState(mode: GameMode) {
  const themeKey = THEME_KEYS[mode];
  const sessionKey = SESSION_KEYS[mode];

  /** 旧版单键状态需要在挂载后迁移到拆分后的两个键 */
  const migrationRef = useRef<PersistedState | null>(null);

  const [state, setState] = useState<GameState>(() => {
    const persisted = readPersistedState(mode);
    const savedNames = loadFromStorage<string[] | null>(PLAYER_NAMES_KEYS[mode], null);

    if (persisted.legacy) {
      migrationRef.current = persisted;
    }

    const themes = normalizeThemes(persisted.themes, mode);
    const normalized = persisted.session ? normalizeSession(persisted.session, themes, mode) : null;

    if (normalized) {
      if (savedNames) {
        normalized.players = normalized.players.map((p, i) => ({
          ...p,
          name: savedNames[i] || p.name
        }));
      }
      return normalized;
    }

    const players = INITIAL_PLAYERS[mode].map((p, i) => ({
      ...p,
      name: savedNames?.[i] || p.name
    }));

    return {
      view: 'home',
      turn: 0,
      players,
      themes,
      boardMap: generateBoardMap(),
      pathCoords: generateSpiralPath(),
      isRolling: false,
      mode,
      maleStatus: emptyStatusSlots(),
      femaleStatus: emptyStatusSlots(),
      recentTasks: []
    };
  });

  // 旧键迁移：写入新键后删除旧键，避免两处数据长期不一致
  useEffect(() => {
    const migration = migrationRef.current;
    if (!migration) return;
    migrationRef.current = null;
    migrateLegacyState(mode, migration);
  }, [mode]);

  /**
   * 主题单独一个键，而且只在主题真正变化时才写。
   * 引用比较足够：改主题的 setState 一定产生新的 themes 数组引用，
   * 而改玩家 / 回合 / 掷骰的 setState 会保留原引用。
   */
  const writtenThemesRef = useRef<Theme[] | null>(null);
  useEffect(() => {
    if (writtenThemesRef.current === state.themes) return;
    writtenThemesRef.current = state.themes;
    saveToStorage(themeKey, state.themes);
  }, [state.themes, themeKey]);

  /** 会话切片体积小；useMemo 保证只有相关字段变化时才会产生新引用 */
  const sessionSlice = useMemo<GameSessionSlice>(() => ({
    view: state.view,
    turn: state.turn,
    players: state.players,
    boardMap: state.boardMap,
    pathCoords: state.pathCoords,
    isRolling: state.isRolling,
    mode: state.mode,
    maleStatus: state.maleStatus,
    femaleStatus: state.femaleStatus,
    recentTasks: state.recentTasks
  }), [
    state.view,
    state.turn,
    state.players,
    state.boardMap,
    state.pathCoords,
    state.isRolling,
    state.mode,
    state.maleStatus,
    state.femaleStatus,
    state.recentTasks
  ]);

  useEffect(() => {
    saveToStorage(sessionKey, sessionSlice);
  }, [sessionKey, sessionSlice]);

  const switchView = useCallback((view: GameState['view']) => {
    setState(prev => ({ ...prev, view }));
  }, []);

  const setPlayerName = useCallback((playerId: number, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setState(prev => {
      const nextPlayers = prev.players.map(p =>
        p.id === playerId ? { ...p, name: trimmed } : p
      );
      saveToStorage(PLAYER_NAMES_KEYS[prev.mode], nextPlayers.map(p => p.name));
      return { ...prev, players: nextPlayers };
    });
  }, []);

  const selectTheme = useCallback((playerId: number, themeId: string) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? { ...p, themeId } : p
      )
    }));
  }, []);

  const createTheme = useCallback((input: { name: string; desc?: string; audience: Theme['audience'] }) => {
    const name = input.name.trim();
    const desc = (input.desc || '').trim();
    if (!name) return null;
    if (state.themes.some(t => t.name === name)) return null;

    // id 必须在 setState 之前生成，否则调用方拿到的永远是 null
    const id = createThemeId(new Set(state.themes.map(t => t.id)));

    setState(prev => ({
      ...prev,
      themes: [
        ...prev.themes,
        {
          id,
          name,
          desc,
          mode: prev.mode,
          audience: input.audience,
          tasks: []
        }
      ]
    }));

    return id;
  }, [state.themes]);

  const updateThemeMeta = useCallback((themeId: string, patch: Partial<Pick<Theme, 'name' | 'desc' | 'audience'>>) => {
    setState(prev => ({
      ...prev,
      themes: prev.themes.map(t => {
        if (t.id !== themeId) return t;
        const nextName = typeof patch.name === 'string' ? patch.name.trim() : t.name;
        if (nextName && nextName !== t.name && prev.themes.some(other => other.id !== themeId && other.name === nextName)) {
          return t;
        }
        const nextDesc = typeof patch.desc === 'string' ? patch.desc.trim() : t.desc;
        const nextAudience = patch.audience || t.audience;

        return {
          ...t,
          name: nextName || t.name,
          desc: nextDesc,
          audience: nextAudience
        };
      })
    }));
  }, []);

  const addThemeTask = useCallback((themeId: string, taskText: string) => {
    const trimmed = taskText.trim();
    if (!trimmed) return;

    setState(prev => ({
      ...prev,
      themes: prev.themes.map(t => {
        if (t.id !== themeId) return t;
        if (t.tasks.includes(trimmed)) return t;
        return { ...t, tasks: [...t.tasks, trimmed] };
      })
    }));
  }, []);

  const removeThemeTask = useCallback((themeId: string, index: number) => {
    setState(prev => ({
      ...prev,
      themes: prev.themes.map(t => {
        if (t.id !== themeId) return t;
        if (index < 0 || index >= t.tasks.length) return t;
        return { ...t, tasks: t.tasks.filter((_, i) => i !== index) };
      })
    }));
  }, []);

  const importThemeTasks = useCallback((themeId: string, tasks: string[], mode: 'append' | 'replace' = 'append') => {
    const cleaned = tasks
      .map(t => (typeof t === 'string' ? t.trim() : ''))
      .filter(t => t.length > 0);

    if (cleaned.length === 0) return;

    setState(prev => ({
      ...prev,
      themes: prev.themes.map(t => {
        if (t.id !== themeId) return t;
        const base = mode === 'replace' ? [] : t.tasks;
        const seen = new Set<string>();
        const merged: string[] = [];

        for (const item of [...base, ...cleaned]) {
          if (seen.has(item)) continue;
          seen.add(item);
          merged.push(item);
        }

        return { ...t, tasks: merged };
      })
    }));
  }, []);

  const startGame = useCallback(() => {
    for (const player of state.players) {
      if (!player.themeId) return false;
      const theme = state.themes.find(t => t.id === player.themeId);
      if (!theme) return false;
      if (!isThemeAllowedForRole(theme, player.role)) return false;
      if (theme.tasks.length === 0) return false;
    }

    const maleOpening = buildOpeningStatus('male', mode);
    const femaleOpening = buildOpeningStatus('female', mode);

    setState(prev => ({
      ...prev,
      view: 'game',
      turn: Math.random() < 0.5 ? 0 : 1,
      maleStatus: maleOpening ? applyStatusToSlots(prev.maleStatus, maleOpening) : prev.maleStatus,
      femaleStatus: femaleOpening ? applyStatusToSlots(prev.femaleStatus, femaleOpening) : prev.femaleStatus,
      recentTasks: []
    }));
    return true;
  }, [state.players, state.themes, mode]);

  const movePlayer = useCallback((steps: number) => {
    setState(prev => {
      const activePlayer = prev.players[prev.turn];
      const newStep = calculateNewPosition(activePlayer.step, steps);

      return {
        ...prev,
        players: prev.players.map(p =>
          p.id === activePlayer.id ? { ...p, step: newStep } : p
        )
      };
    });
  }, []);

  const endTurn = useCallback(() => {
    setState(prev => ({
      ...prev,
      turn: prev.turn === 0 ? 1 : 0,
      isRolling: false
    }));
  }, []);

  const setIsRolling = useCallback((rolling: boolean) => {
    setState(prev => ({ ...prev, isRolling: rolling }));
  }, []);

  const recordRecentTask = useCallback((taskText: string) => {
    setState(prev => {
      if (prev.recentTasks.includes(taskText)) return prev;
      return { ...prev, recentTasks: [...prev.recentTasks, taskText].slice(-RECENT_TASKS_LIMIT) };
    });
  }, []);

  const checkTile = useCallback((landingStep: number): TaskEventData | 'win' | 'status' | null => {
    const activePlayer = state.players[state.turn];
    const opponent = state.players[state.turn === 0 ? 1 : 0];

    const pickTaskForRole = (
      theme: Theme | undefined,
      executorRole: Player['role'],
      eventType: 'lucky' | 'trap' | 'collision',
      recentTasks: string[]
    ): string => {
      if (!theme || theme.tasks.length === 0) return '';

      const roleFromTags = (tags: ReturnType<typeof parseTaskTags>['tags']): 'male' | 'female' | 'both' => {
        if (tags.includes('M')) return 'male';
        if (tags.includes('F')) return 'female';
        return 'both';
      };

      const eligible = theme.tasks.filter(t => {
        const { tags } = parseTaskTags(t);
        const roleTag = roleFromTags(tags);
        if (roleTag === 'male' && executorRole !== 'male') return false;
        if (roleTag === 'female' && executorRole !== 'female') return false;
        if (eventType === 'trap' && tags.includes('R')) return false;
        if (eventType === 'lucky' && tags.includes('H')) return false;
        if (eventType === 'collision' && (tags.includes('R') || tags.includes('H'))) return false;
        return true;
      });

      let pool = eligible.length > 0 ? eligible : theme.tasks;

      if (eventType === 'trap') {
        const hard = pool.filter(t => parseTaskTags(t).tags.includes('H'));
        if (hard.length > 0) pool = hard;
      } else if (eventType === 'lucky') {
        const reward = pool.filter(t => parseTaskTags(t).tags.includes('R'));
        if (reward.length > 0) pool = reward;
      }

      const fresh = pool.filter(t => !recentTasks.includes(t));
      const pickFrom = fresh.length > 0 ? fresh : pool;
      return pickFrom[Math.floor(Math.random() * pickFrom.length)] || '';
    };

    if (landingStep === 48) {
      return 'win';
    }

    if (landingStep !== 0 && landingStep === opponent.step) {
      const theme = state.themes.find(t => t.id === activePlayer.themeId);
      const rawTask = pickTaskForRole(theme, opponent.role, 'collision', state.recentTasks);
      if (rawTask) recordRecentTask(rawTask);

      return {
        type: 'collision',
        initiatorPlayerId: activePlayer.id,
        executorPlayerId: opponent.id,
        title: '亲密追尾',
        subtitle: `任务来自「${theme?.name || ''}」`,
        icon: 'handshake',
        color: 'text-yellow-400',
        task: personalizeTask(rawTask, opponent, activePlayer),
        taskSourceId: activePlayer.themeId || ''
      };
    }

    const tileType = state.boardMap[landingStep];

    if (tileType === 'lucky') {
      const theme = state.themes.find(t => t.id === activePlayer.themeId);
      const rawTask = pickTaskForRole(theme, opponent.role, 'lucky', state.recentTasks);
      if (rawTask) recordRecentTask(rawTask);

      return {
        type: 'lucky',
        initiatorPlayerId: activePlayer.id,
        executorPlayerId: opponent.id,
        title: '幸运时刻',
        subtitle: `任务来自「${theme?.name || ''}」`,
        icon: 'favorite',
        color: 'text-[#FF375F]',
        task: personalizeTask(rawTask, opponent, activePlayer),
        taskSourceId: activePlayer.themeId || ''
      };
    }

    if (tileType === 'trap') {
      const theme = state.themes.find(t => t.id === opponent.themeId);
      const rawTask = pickTaskForRole(theme, activePlayer.role, 'trap', state.recentTasks);
      if (rawTask) recordRecentTask(rawTask);

      return {
        type: 'trap',
        initiatorPlayerId: activePlayer.id,
        executorPlayerId: activePlayer.id,
        title: '意外陷阱',
        subtitle: `任务来自「${theme?.name || ''}」`,
        icon: 'lock',
        color: 'text-[#BF5AF2]',
        task: personalizeTask(rawTask, activePlayer, opponent),
        taskSourceId: opponent.themeId || ''
      };
    }

    if (tileType === 'status') {
      return 'status';
    }

    return null;
  }, [state.players, state.turn, state.themes, state.boardMap, state.recentTasks, recordRecentTask]);

  const resolveTask = useCallback((task: TaskEventData, outcome: 'accept' | 'reject') => {
    setState(prev => {
      let nextPlayers = prev.players;

      if (outcome === 'reject') {
        const backSteps = Math.floor(Math.random() * 3) + 1;
        nextPlayers = prev.players.map(p => {
          if (p.id !== task.executorPlayerId) return p;

          if (task.type === 'collision') {
            return { ...p, step: 0 };
          }

          return { ...p, step: Math.max(0, p.step - backSteps) };
        });
      }

      return {
        ...prev,
        players: nextPlayers,
        turn: prev.turn === 0 ? 1 : 0,
        isRolling: false
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      view: 'home',
      turn: 0,
      players: prev.players.map(p => ({ ...p, step: 0 })),
      boardMap: generateBoardMap(),
      pathCoords: generateSpiralPath(),
      isRolling: false,
      maleStatus: emptyStatusSlots(),
      femaleStatus: emptyStatusSlots(),
      recentTasks: []
    }));
  }, []);

  const applyStatusTile = useCallback((targetRole: 'male' | 'female', activeThemeId: string): StatusEffect | null => {
    const theme = state.themes.find(t => t.id === activeThemeId);
    const slot: 'action' | 'condition' = Math.random() < 0.5 ? 'action' : 'condition';
    const newStatus = buildStatus(theme, slot, targetRole, mode);
    if (!newStatus) return null;

    const statusKey = targetRole === 'male' ? 'maleStatus' : 'femaleStatus';

    setState(prev => {
      if (newStatus.target === 'both') {
        return {
          ...prev,
          maleStatus: applyStatusToSlots(prev.maleStatus, { ...newStatus, id: newStatus.id + '_m' }),
          femaleStatus: applyStatusToSlots(prev.femaleStatus, { ...newStatus, id: newStatus.id + '_f' })
        };
      }

      return { ...prev, [statusKey]: applyStatusToSlots(prev[statusKey], newStatus) };
    });

    return newStatus;
  }, [state.themes, mode]);

  return {
    state,
    switchView,
    setPlayerName,
    selectTheme,
    createTheme,
    updateThemeMeta,
    addThemeTask,
    removeThemeTask,
    importThemeTasks,
    startGame,
    movePlayer,
    endTurn,
    setIsRolling,
    checkTile,
    resolveTask,
    resetGame,
    applyStatusTile
  };
}
