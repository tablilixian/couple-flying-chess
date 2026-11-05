import { GameMode } from '../types';
import { loadRawString, saveRawString } from '../utils/localStorage';
import { PASSWORD_KEYS, NOVEL_CODE_KEY } from '../utils/storageKeys';

/**
 * 准入口令配置。
 *
 * 设计原则（用户明确要求）：**一个密码门，对应一个 UI**。
 * 访客看到的只有一个数字键盘 —— 不出现任何模式名、空间名、按钮提示。
 * 输入哪个口令就打开哪个界面，里面显示什么按该界面的设计走。
 * 知道「情侣模式」存在这件事本身，就是秘密。
 *
 * ⚠️ 重要前提：这是一个纯前端 SPA，任何写进产物里的口令都能被浏览器读到。
 *    客户端口令门本质上是「软门槛」，真正的准入控制需要服务端。
 *    下面的默认值是为了开箱即用（与原始版本一致）；
 *    想让口令不落在公开仓库里，用 .env / GitHub Secrets 覆盖即可（见 .env.example）。
 *
 * 优先级：用户本地自定义（localStorage） > 部署期环境变量 > 内置默认值。
 */

const PASSWORD_STORAGE_KEYS = PASSWORD_KEYS;
const NOVEL_CODE_STORAGE_KEY = NOVEL_CODE_KEY;

/** 部署期未配置时的兜底口令；用 env 覆盖即可换成自己的 */
const DEFAULT_PASSWORDS: Record<GameMode, string> = {
  couple: '1314',
  normal: '1234'
};

/** 书房（小说房间）的独立口令 */
const DEFAULT_NOVEL_CODE = '9527';

/** 口令可以打开的空间 */
export type AccessSpace = GameMode | 'novel';

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
  return readEnv(raw) ?? DEFAULT_PASSWORDS[mode];
}

/** 部署期配置的小说书房暗号 */
export function getConfiguredNovelCode(): string | null {
  return readEnv(import.meta.env.VITE_APP_NOVEL_CODE) ?? DEFAULT_NOVEL_CODE;
}

/** 用户自己设置的口令（localStorage），没有则返回 null */
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

/** 实际生效的口令：本地自定义优先，其次部署期配置，最后兜底默认值 */
export function getEffectivePassword(mode: GameMode): string {
  return getStoredPassword(mode) ?? getConfiguredPassword(mode) ?? DEFAULT_PASSWORDS[mode];
}

/** 实际生效的书房暗号 */
export function getEffectiveNovelCode(): string {
  return getStoredNovelCode() ?? getConfiguredNovelCode() ?? DEFAULT_NOVEL_CODE;
}

/**
 * 口令 → 空间。门禁只认这个结果，不关心调用方怎么展示。
 * 匹配失败返回 null，由调用方给出统一的「密码错误」，不透露任何额外信息。
 */
export function matchAccessCode(code: string): AccessSpace | null {
  if (!code) return null;
  if (code === getEffectiveNovelCode()) return 'novel';
  if (code === getEffectivePassword('couple')) return 'couple';
  if (code === getEffectivePassword('normal')) return 'normal';
  return null;
}

/** 是否存在可用的进入方式（恒真，因为有兜底默认值；保留给部署自检用） */
export function hasAnyAccess(): boolean {
  return (
    getEffectivePassword('couple').length >= 4 ||
    getEffectivePassword('normal').length >= 4 ||
    getEffectiveNovelCode().length >= 4
  );
}
