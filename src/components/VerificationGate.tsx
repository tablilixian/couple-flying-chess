import { useState, useEffect, useRef } from 'react';
import { matchAccessCode, AccessSpace } from '../config/access';

interface VerificationGateProps {
  onVerified: (space: Exclude<AccessSpace, 'novel'>) => void;
  onEnterNovel?: () => void;
}

/**
 * 准入门禁。
 *
 * ⚠️ 这里刻意**不出现任何模式名 / 空间名 / 按钮文案**。
 * 访客只看到一个数字键盘：输入哪个口令，就打开对应的界面。
 * 「这个站里还有情侣模式」这件事本身必须是秘密 ——
 * 所以页面标题只有「飞行棋」，副标题只有「请输入密码」，
 * 输错也只有「密码错误」四个字，不做任何差异化提示
 * （差异化提示等于告诉访客「你刚才那个码接近了某个分支」）。
 */
export function VerificationGate({ onVerified, onEnterNovel }: VerificationGateProps) {
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 卸载时清掉错误复位定时器
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, []);

  const handleDigit = (d: string) => {
    if (digits.length >= 4) return;
    const newDigits = [...digits, d];
    setDigits(newDigits);
    setError(false);

    if (newDigits.length === 4) {
      const space = matchAccessCode(newDigits.join(''));

      if (space === 'novel') {
        if (onEnterNovel) onEnterNovel();
        return;
      }

      if (space) {
        onVerified(space);
        return;
      }

      setError(true);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        resetTimerRef.current = null;
        setDigits([]);
        setError(false);
      }, 600);
    }
  };

  const handleDelete = () => {
    setDigits(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setDigits([]);
    setError(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-60" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 w-full max-w-[430px]">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-light text-white tracking-[0.2em] mb-3">飞行棋</h1>
          <p className="text-gray-600 text-sm tracking-wider">请输入密码</p>
        </div>

        <div className="flex gap-3 mb-6">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border transition-all duration-200 ${
                error
                  ? 'border-red-500 bg-red-500/20'
                  : digits[i]
                    ? 'border-white bg-white'
                    : 'border-gray-600'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500/70 text-xs mb-4 -mt-3">密码错误</p>
        )}

        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button
              key={n}
              onClick={() => handleDigit(String(n))}
              className="h-14 rounded-xl bg-white/[0.04] text-white/80 text-xl hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors select-none"
            >
              {n}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-14 rounded-xl bg-white/[0.04] text-gray-500 text-xs hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors select-none"
          >
            清空
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-xl bg-white/[0.04] text-white/80 text-xl hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors select-none"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 rounded-xl bg-white/[0.04] text-gray-500 text-xs hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors select-none"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
