import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// node 环境没有 localStorage，先补一个内存实现
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) { return this.map.has(k) ? this.map.get(k)! : null; }
  setItem(k: string, v: string) { this.map.set(k, String(v)); }
  removeItem(k: string) { this.map.delete(k); }
  clear() { this.map.clear(); }
  key(i: number) { return Array.from(this.map.keys())[i] ?? null; }
  get length() { return this.map.size; }
}

const store = new MemoryStorage();
beforeEach(() => {
  store.clear();
  (globalThis as unknown as { localStorage: MemoryStorage }).localStorage = store;
});
afterEach(() => {
  vi.unstubAllEnvs();
});

// ─────────────────────────────────────────────────────────────
// 准入口令：一码一门。
// 核心约束：**网页上不得出现任何模式名 / 空间名**，
// 知道「还有情侣模式」这件事本身就是秘密。
// ─────────────────────────────────────────────────────────────

describe('准入口令 · 一码一门', () => {
  it('未配置时回退到内置默认口令（开箱即用）', async () => {
    const { getEffectivePassword, getEffectiveNovelCode } = await import('../config/access');
    expect(getEffectivePassword('couple')).toBe('1314');
    expect(getEffectivePassword('normal')).toBe('1234');
    expect(getEffectiveNovelCode()).toBe('9527');
  });

  it('部署期配置生效，可直接进入对应空间', async () => {
    vi.stubEnv('VITE_APP_COUPLE_PWD', '8642');
    vi.stubEnv('VITE_APP_NORMAL_PWD', '9753');
    vi.stubEnv('VITE_APP_NOVEL_CODE', '5858');
    const { getEffectivePassword, getEffectiveNovelCode } = await import('../config/access');

    expect(getEffectivePassword('couple')).toBe('8642');
    expect(getEffectivePassword('normal')).toBe('9753');
    expect(getEffectiveNovelCode()).toBe('5858');
  });

  it('用户本机自定义的口令优先于部署期配置', async () => {
    vi.stubEnv('VITE_APP_COUPLE_PWD', '8642');
    const { getStoredPassword, setStoredPassword, getEffectivePassword } = await import('../config/access');

    setStoredPassword('couple', '1234');
    expect(getStoredPassword('couple')).toBe('1234');
    expect(getEffectivePassword('couple')).toBe('1234');
  });

  it('配置项少于 4 位视为无效，回退默认口令', async () => {
    vi.stubEnv('VITE_APP_COUPLE_PWD', '12');
    const { getEffectivePassword } = await import('../config/access');
    expect(getEffectivePassword('couple')).toBe('1314');
  });

  it('书房暗号遵循同样的优先级规则', async () => {
    vi.stubEnv('VITE_APP_NOVEL_CODE', '9527');
    const { getEffectiveNovelCode, setStoredNovelCode, getStoredNovelCode } = await import('../config/access');

    expect(getEffectiveNovelCode()).toBe('9527');
    setStoredNovelCode('1122');
    expect(getStoredNovelCode()).toBe('1122');
    expect(getEffectiveNovelCode()).toBe('1122');
  });

  it('matchAccessCode：哪个口令对应哪个空间', async () => {
    const { matchAccessCode } = await import('../config/access');
    expect(matchAccessCode('1314')).toBe('couple');
    expect(matchAccessCode('1234')).toBe('normal');
    expect(matchAccessCode('9527')).toBe('novel');
  });

  it('matchAccessCode：口令错误返回 null，不泄露任何分支信息', async () => {
    const { matchAccessCode } = await import('../config/access');
    expect(matchAccessCode('0000')).toBeNull();
    expect(matchAccessCode('131')).toBeNull();
    expect(matchAccessCode('')).toBeNull();
  });

  it('本地改过口令后，matchAccessCode 跟着走', async () => {
    const { matchAccessCode, setStoredPassword } = await import('../config/access');
    setStoredPassword('couple', '5678');
    expect(matchAccessCode('5678')).toBe('couple');
    expect(matchAccessCode('1314')).toBeNull();
  });

  it('未设置过口令时 getStoredPassword 返回 null（而不是默认值）', async () => {
    const { getStoredPassword } = await import('../config/access');
    expect(getStoredPassword('couple')).toBeNull();
    expect(getStoredPassword('normal')).toBeNull();
  });
});
