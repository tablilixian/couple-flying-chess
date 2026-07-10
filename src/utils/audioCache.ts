/**
 * 音频本地缓存工具 (IndexedDB)
 * 首次播放从远端拉取 mp3 并缓存到 IndexedDB，后续直接从本地读取
 */

const DB_NAME = 'radio-audio-cache';
const STORE_NAME = 'audio-blobs';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** 从缓存获取音频 Blob URL，未命中返回 null */
export async function getCachedAudio(key: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result instanceof Blob) {
          resolve(URL.createObjectURL(req.result));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** 从远端拉取音频并缓存，返回 Blob URL */
export async function fetchAndCacheAudio(url: string, key: string): Promise<string> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const blob = await resp.blob();

  // 写入缓存（不阻塞返回）
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(blob, key);
    tx.oncomplete = () => db.close();
  } catch {
    // 缓存写入失败不影响播放
  }

  return URL.createObjectURL(blob);
}

/** 获取缓存状态 */
export async function getCacheInfo(): Promise<{ count: number; size: number }> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAllKeys();
      req.onsuccess = () => {
        const keys = req.result || [];
        // 估算大小需要读取所有 blob
        const sizeReq = store.getAll();
        sizeReq.onsuccess = () => {
          const blobs = sizeReq.result || [];
          const size = blobs.reduce((sum: number, b: unknown) => {
            return sum + (b instanceof Blob ? b.size : 0);
          }, 0);
          resolve({ count: keys.length, size });
        };
        sizeReq.onerror = () => resolve({ count: keys.length, size: 0 });
      };
      req.onerror = () => resolve({ count: 0, size: 0 });
    });
  } catch {
    return { count: 0, size: 0 };
  }
}

/** 清理全部缓存 */
export async function clearAudioCache(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
    });
  } catch {
    // ignore
  }
}
