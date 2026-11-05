import { useState, useEffect, useRef } from 'react';
import { GameMode } from '../types';
import {
  getEffectivePassword,
  getEffectiveNovelCode,
  setStoredPassword,
  needsInitialSetup,
} from '../config/access';

interface VerificationGateProps {
  onVerified: (mode: GameMode) => void;
  onEnterNovel?: () => void;
}

export function VerificationGate({ onVerified, onEnterNovel }: VerificationGateProps) {
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [setupMode, setSetupMode] = useState<GameMode | null>(null);
  const [isSetup, setIsSetup] = useState(() => needsInitialSetup());
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 首次使用 → 引导设置本地口令；否则走正常进入流程
  useEffect(() => {
    setIsSetup(needsInitialSetup());
  }, []);

  // 卸载时清掉错误重置定时器
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
      const code = newDigits.join('');

      if (isSetup && setupMode) {
        // 首次使用：把用户设置的口令存到本机，随即进入对应模式
        setStoredPassword(setupMode, code);
        onVerified(setupMode);
        return;
      }

      const novelCode = getEffectiveNovelCode();
      if (novelCode && code === novelCode && onEnterNovel) {
        onEnterNovel();
        return;
      }

      const mode = (['couple', 'normal'] as GameMode[]).find(
        m => getEffectivePassword(m) === code
      );
      if (mode) {
        onVerified(mode);
      } else {
        setError(true);
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => {
          resetTimerRef.current = null;
          setDigits([]);
          setError(false);
        }, 600);
      }
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

  const title = isSetup ? '首次使用' : '飞行棋';
  const subtitle = isSetup
    ? setupMode
      ? `为${setupMode === 'couple' ? '情侣' : '普通'}模式设置 4 位口令`
      : '选择一个模式开始'
    : '请输入密码';

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-60" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 w-full max-w-[430px]">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-light text-white tracking-[0.2em] mb-3">{title}</h1>
          <p className="text-gray-600 text-sm tracking-wider">{subtitle}</p>
        </div>

        {isSetup && !setupMode ? (
          <div className="w-full max-w-[280px] flex flex-col gap-3">
            <button
              onClick={() => setSetupMode('couple')}
              className="h-16 rounded-2xl bg-white/[0.04] text-white/90 text-lg border border-white/[0.08] hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors"
            >
              💕 情侣模式
            </button>
            <button
              onClick={() => setSetupMode('normal')}
              className="h-16 rounded-2xl bg-white/[0.04] text-white/90 text-lg border border-white/[0.08] hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors"
            >
              🎲 普通模式
            </button>
            <p className="text-xs text-gray-600 text-center mt-2 leading-relaxed">
              口令仅保存在本机浏览器，不会上传
            </p>
          </div>
        ) : (
          <>
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

            {isSetup && setupMode && (
              <button
                onClick={() => { setSetupMode(null); setDigits([]); }}
                className="mt-6 text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                ← 换一个模式
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
