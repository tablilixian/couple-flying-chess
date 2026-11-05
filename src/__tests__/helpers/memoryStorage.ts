/**
 * node 环境没有 localStorage，补一个可注入失败的内存实现。
 * failOn 可指定抛错的方法，用来验证「存储失败要能被看见」。
 */
export class MemoryStorage {
  private map = new Map<string, string>();
  failOn: { get?: boolean; set?: boolean; remove?: boolean } = {};

  getItem(k: string) {
    if (this.failOn.get) throw new Error('QuotaExceededError: storage read denied');
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    if (this.failOn.set) throw new Error('QuotaExceededError: storage quota exceeded');
    this.map.set(k, String(v));
  }
  removeItem(k: string) {
    if (this.failOn.remove) throw new Error('QuotaExceededError: remove denied');
    this.map.delete(k);
  }
  clear() { this.map.clear(); }
  key(i: number) { return Array.from(this.map.keys())[i] ?? null; }
  get length() { return this.map.size; }
}

export const store = new MemoryStorage();

export function installMemoryStorage(): void {
  (globalThis as unknown as { localStorage: MemoryStorage }).localStorage = store;
}

export function resetMemoryStorage(): void {
  store.clear();
  store.failOn = {};
  installMemoryStorage();
}
