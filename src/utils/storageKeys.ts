import { GameMode } from '../types';

/**
 * 所有 localStorage 键的唯一定义处。
 * 之前键名散落在 useGameState / access / gameSession / App 四处，
 * 「清除所有本地数据」要靠手写列表维护，很容易漏（拆分存储键时就漏过一次）。
 */

/** 主题包（含全部任务文案，体量大，很少变化） */
export const THEME_KEYS: Record<GameMode, string> = {
  couple: 'couple-game-themes',
  normal: 'normal-game-themes'
};

/** 会话切片（不含主题文案） */
export const SESSION_KEYS: Record<GameMode, string> = {
  couple: 'couple-game-session',
  normal: 'normal-game-session'
};

/** 旧版单键状态（拆分存储键之前），读取时自动迁移并删除 */
export const LEGACY_STATE_KEYS: Record<GameMode, string> = {
  couple: 'couple-game-state',
  normal: 'normal-game-state'
};

/** 玩家昵称 */
export const PLAYER_NAMES_KEYS: Record<GameMode, string> = {
  couple: 'couple-player-names',
  normal: 'normal-player-names'
};

/** 本地自定义口令 */
export const PASSWORD_KEYS: Record<GameMode, string> = {
  couple: 'couple-password',
  normal: 'normal-password'
};

export const NOVEL_CODE_KEY = 'novel-code';
export const GAME_SESSIONS_KEY = 'game-sessions';
export const PENDING_SESSION_KEY = 'pending-session';
export const METRONOME_PLAN_KEY = 'metronome-plan';

/** 沉浸剧场进度：immersive-progress-<scenarioId> */
export const IMMERSIVE_PROGRESS_PREFIX = 'immersive-progress';

const STATIC_KEYS: string[] = [
  ...Object.values(THEME_KEYS),
  ...Object.values(SESSION_KEYS),
  ...Object.values(LEGACY_STATE_KEYS),
  ...Object.values(PLAYER_NAMES_KEYS),
  ...Object.values(PASSWORD_KEYS),
  NOVEL_CODE_KEY,
  GAME_SESSIONS_KEY,
  PENDING_SESSION_KEY,
  METRONOME_PLAN_KEY,
];

/**
 * 清空本应用在 localStorage 里留下的全部数据。
 * 动态前缀键（沉浸剧场进度）按前缀扫描清理，避免新场景漏删。
 */
export function clearAllLocalData(): void {
  const dynamic: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(IMMERSIVE_PROGRESS_PREFIX)) dynamic.push(key);
  }
  [...STATIC_KEYS, ...dynamic].forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* 隐私模式下 removeItem 可能抛错，忽略即可 */
    }
  });
}
