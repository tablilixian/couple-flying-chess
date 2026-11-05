import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { describeStorageError, subscribeStorageErrors, StorageError } from '../utils/storageStatus';

/**
 * 存储失败提示条。
 * 此前 localStorage 写失败只有控制台报错，用户看到的现象是
 * 「改了没反应 / 刷新就丢」，完全无法自查。这里把失败显式呈现出来。
 */
export function StorageErrorToast() {
  const [error, setError] = useState<StorageError | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return subscribeStorageErrors(err => {
      setError(err);
      setVisible(true);
    });
  }, []);

  // 同一条错误 6 秒后自动收起，但保留可再次展开的提示
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), 6000);
    return () => window.clearTimeout(timer);
  }, [visible, error]);

  if (!error) return null;

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF453A]/20 border border-[#FF453A]/40 text-[11px] text-[#FF453A]"
      >
        <AlertTriangle size={12} />
        存储异常
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-[400px]">
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#1C1C1E]/95 border border-[#FF453A]/40 backdrop-blur-md shadow-xl">
        <AlertTriangle size={14} className="text-[#FF453A] mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-[#FF453A]">数据没能保存</div>
          <div className="text-[11px] text-gray-300 mt-0.5 leading-relaxed">
            {describeStorageError(error)}
          </div>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="p-0.5 rounded-full text-gray-500 hover:text-white transition-colors shrink-0"
          aria-label="关闭"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
