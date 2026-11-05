import { reportStorageError } from './storageStatus';

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * 读取一个键。失败时回退到默认值，并通过 storageStatus 上报，
 * 让 UI 有机会提示用户「读到的可能是旧数据 / 默认值」。
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch (error) {
    reportStorageError({ key, operation: 'read', message: toMessage(error) });
    return defaultValue;
  }
}

/**
 * 写入一个键。返回是否写入成功 —— 配额满、隐私模式禁写等情况都会失败，
 * 调用方可以据此提示用户，而不是让数据静默丢失。
 */
export function saveToStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    reportStorageError({ key, operation: 'write', message: toMessage(error) });
    return false;
  }
}

/** 删除一个键。返回是否删除成功。 */
export function removeFromStorage(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    reportStorageError({ key, operation: 'remove', message: toMessage(error) });
    return false;
  }
}

/**
 * 读写原始字符串（不做 JSON 序列化）。
 * 口令这类「本身就是字符串」的值用它，避免 JSON.parse 把 "1234" 变成数字 1234。
 */
export function loadRawString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    reportStorageError({ key, operation: 'read', message: toMessage(error) });
    return null;
  }
}

export function saveRawString(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    reportStorageError({ key, operation: 'write', message: toMessage(error) });
    return false;
  }
}
