import { GameMode } from '../types';
import { loadRawString, saveRawString } from '../utils/localStorage';
import { PASSWORD_KEYS, NOVEL_CODE_KEY } from '../utils/storageKeys';

/**
 * 准入口令配置。
 *
 * ⚠️ 重要前提：这是一个纯前端 SPA，任何写进产物里的口令都能被浏览器读到。
 *    客户端口令门本质上是「软门槛」，真正的准入控制需要服务端。
 *    这里做的是「不再把口令连同代码公开在仓库里」，把决定权交给部署者。
 *
 * 优先级：用户本地自定义（localStorage） > 部署期环境变量（构建时注入）。
 */

const PASSWORD_STORAGE_KEYS = PASSWORD_KEYS;
const NOVEL_CODE_STORAGE_KEY = NOVEL_CODE_KEY;

function readEnv(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length >= 4 ? trimmed : null;
}

/** 部署期配置的初始口令（情侣 / 普通） */
export function getConfiguredPassword(mode: GameMode): string | null {
  const raw =
    mode === 'couple'
      ? import.meta.env.VITE_APP_COUPLE_PWD
      : import.meta.env.VITE_APP_NORMAL_PWD;
  return readEnv(raw);
}

/** 部署期配置的小说书房暗号 */
export function getConfiguredNovelCode(): string | null {
  return readEnv(import.meta.env.VITE_APP_NOVEL_CODE);
}

/** 用户自己设置的口令（localStorage），没有则返回 null —— 不再回落到源码默认值 */
export function getStoredPassword(mode: GameMode): string | null {
  const v = loadRawString(PASSWORD_STORAGE_KEYS[mode]);
  return v && v.length >= 4 ? v : null;
}

export function setStoredPassword(mode: GameMode, pwd: string): void {
  saveRawString(PASSWORD_STORAGE_KEYS[mode], pwd);
}

export function getStoredNovelCode(): string | null {
  const v = loadRawString(NOVEL_CODE_STORAGE_KEY);
  return v && v.length >= 4 ? v : null;
}

export function setStoredNovelCode(code: string): void {
  saveRawString(NOVEL_CODE_STORAGE_KEY, code);
}

/** 实际生效的口令：本地自定义优先，其次部署期配置 */
export function getEffectivePassword(mode: GameMode): string | null {
  return getStoredPassword(mode) ?? getConfiguredPassword(mode);
}

/** 实际生效的小说暗号 */
export function getEffectiveNovelCode(): string | null {
  return getStoredNovelCode() ?? getConfiguredNovelCode();
}

/** 是否存在任一可用的进入方式 */
export function hasAnyAccess(): boolean {
  return (
    getEffectivePassword('couple') !== null ||
    getEffectivePassword('normal') !== null ||
    getEffectiveNovelCode() !== null
  );
}

/**
 * 是否处于「首次使用」状态：没有任何部署期配置，也没有用户自定义口令。
 * 此时门禁应引导用户先设置一个本地口令，而不是放行任何固定默认值。
 */
export function needsInitialSetup(): boolean {
  return !hasAnyAccess();
}
