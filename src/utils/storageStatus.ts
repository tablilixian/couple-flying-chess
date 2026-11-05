/**
 * localStorage 读写失败的可见化通道。
 *
 * 背景：此前 localStorage 出错只 console.error，用户完全无感 ——
 * 表现是「我改了名字/任务，刷新就没了」，却没有任何提示，
 * 极难自查。这里把失败统一上报，由 UI 层订阅后弹出提示。
 */

export type StorageOperation = 'read' | 'write' | 'remove';

export interface StorageError {
  key: string;
  operation: StorageOperation;
  message: string;
  timestamp: number;
}

type Listener = (error: StorageError) => void;

const listeners = new Set<Listener>();
let lastError: StorageError | null = null;

/** 上报一次存储失败；同时打印到控制台，方便开发期定位 */
export function reportStorageError(error: Omit<StorageError, 'timestamp'>): void {
  lastError = { ...error, timestamp: Date.now() };
  // 控制台保留原始堆栈，UI 只展示归一化后的 message
  console.error(`[storage] ${error.operation} "${error.key}" failed:`, error.message);
  listeners.forEach(listener => {
    try {
      listener(lastError!);
    } catch {
      /* 订阅者自身的异常不能影响主流程 */
    }
  });
}

/** 订阅存储失败；返回取消订阅函数 */
export function subscribeStorageErrors(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLastStorageError(): StorageError | null {
  return lastError;
}

/** 把底层报错翻译成人话 */
export function describeStorageError(error: StorageError): string {
  const msg = error.message.toLowerCase();
  if (msg.includes('quota') || msg.includes('exceed')) {
    return '浏览器存储空间已满，本次修改没能保存。请清理浏览器数据后重试。';
  }
  if (error.operation === 'read') {
    return `读取「${error.key}」失败，已回退到默认值。`;
  }
  if (error.operation === 'remove') {
    return `清理「${error.key}」失败。`;
  }
  return `保存「${error.key}」失败，本次修改可能不会保留。`;
}
