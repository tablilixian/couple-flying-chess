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

describe('准入口令配置 · 源码不再内置固定口令', () => {
  it('没有部署期配置、也没有本地口令时，需要首次设置', async () => {
    const { needsInitialSetup, getEffectivePassword, getEffectiveNovelCode } = await import('../config/access');
    expect(needsInitialSetup()).toBe(true);
    expect(getEffectivePassword('couple')).toBeNull();
    expect(getEffectivePassword('normal')).toBeNull();
    expect(getEffectiveNovelCode()).toBeNull();
  });

  it('部署期配置生效，可直接进入对应模式', async () => {
    vi.stubEnv('VITE_APP_COUPLE_PWD', '8642');
    vi.stubEnv('VITE_APP_NORMAL_PWD', '9753');
    const { getEffectivePassword, needsInitialSetup } = await import('../config/access');

    expect(getEffectivePassword('couple')).toBe('8642');
    expect(getEffectivePassword('normal')).toBe('9753');
    expect(needsInitialSetup()).toBe(false);
  });

  it('用户本机自定义的口令优先于部署期配置', async () => {
    vi.stubEnv('VITE_APP_COUPLE_PWD', '8642');
    const { getStoredPassword, setStoredPassword, getEffectivePassword } = await import('../config/access');

    setStoredPassword('couple', '1234');
    expect(getStoredPassword('couple')).toBe('1234');
    expect(getEffectivePassword('couple')).toBe('1234');
  });

  it('配置项少于 4 位视为无效，不做半截口令', async () => {
    vi.stubEnv('VITE_APP_COUPLE_PWD', '12');
    const { getEffectivePassword } = await import('../config/access');
    expect(getEffectivePassword('couple')).toBeNull();
  });

  it('书房暗号遵循同样的优先级规则', async () => {
    vi.stubEnv('VITE_APP_NOVEL_CODE', '9527');
    const { getEffectiveNovelCode, setStoredNovelCode, getStoredNovelCode } = await import('../config/access');

    expect(getEffectiveNovelCode()).toBe('9527');
    setStoredNovelCode('1122');
    expect(getStoredNovelCode()).toBe('1122');
    expect(getEffectiveNovelCode()).toBe('1122');
  });

  it('未设置过口令时 getStoredPassword 返回 null 而不是源码默认值', async () => {
    const { getStoredPassword } = await import('../config/access');
    expect(getStoredPassword('couple')).toBeNull();
    expect(getStoredPassword('normal')).toBeNull();
  });
});
