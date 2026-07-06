import { Script, ScriptStep, ScriptMood, StepLogEntry } from '../../types';
import { useScriptEngine } from '../../hooks/useScriptEngine';
import { useEffect, useRef, useCallback } from 'react';

interface ScriptGameViewProps {
  script: Script;
  onEnd: (stepLog: StepLogEntry[]) => void;
  onBack: () => void;
}

function moodBg(mood: ScriptMood): string {
  switch (mood) {
    case 'sweet': return 'radial-gradient(ellipse at 30% 30%, #FF375F20 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, #FF9F0A12 0%, transparent 50%)';
    case 'romantic': return 'radial-gradient(ellipse at 50% 40%, #FF375F28 0%, transparent 50%), radial-gradient(ellipse at 30% 70%, #BF5AF215 0%, transparent 50%)';
    case 'intense': return 'radial-gradient(ellipse at 40% 50%, #FF375F32 0%, transparent 50%), radial-gradient(ellipse at 60% 30%, #FF9F0A18 0%, transparent 50%)';
    case 'calm': return 'radial-gradient(ellipse at 30% 50%, #0A84FF18 0%, transparent 50%), radial-gradient(ellipse at 70% 40%, #30D15810 0%, transparent 50%)';
  }
}

function moodColor(mood: ScriptMood): string {
  switch (mood) {
    case 'sweet': return '#FF375F';
    case 'romantic': return '#BF5AF2';
    case 'intense': return '#FF9F0A';
    case 'calm': return '#0A84FF';
  }
}

export function ScriptGameView({ script, onEnd, onBack }: ScriptGameViewProps) {
  const engine = useScriptEngine(script);
  const skipLockRef = useRef(false);
  const metroRef = useRef<HTMLDivElement>(null);

  const handleAdvance = useCallback(() => {
    if (skipLockRef.current) return;
    skipLockRef.current = true;
    engine.advanceStep();
    setTimeout(() => { skipLockRef.current = false; }, 300);
  }, [engine]);

  useEffect(() => {
    engine.reset();
    const step = script.chapters[0].steps[0];
    engine.playStep(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (engine.isEnding) {
      onEnd(engine.stepLog);
      return;
    }
    if (engine.isChapterTransition) {
      return;
    }
  }, [engine.chapterIndex, engine.stepIndex, engine.isEnding, engine.isChapterTransition, engine.stepLog, onEnd]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (engine.isPaused) {
        if (e.code === 'Space' || e.code === 'Escape') {
          e.preventDefault();
          engine.resume();
        }
        return;
      }
      if (engine.isChapterTransition) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          engine.startChapter();
        }
        return;
      }
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          engine.pause();
          break;
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault();
          handleAdvance();
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [engine, handleAdvance]);

  const handleContinue = () => {
    engine.startChapter();
  };

  const totalSteps = script.chapters.reduce((sum, ch) => sum + ch.steps.length, 0);
  let doneSteps = 0;
  for (let i = 0; i < engine.chapterIndex; i++) doneSteps += script.chapters[i].steps.length;
  doneSteps += engine.stepIndex;
  const progressPct = totalSteps > 0 ? (doneSteps / totalSteps) * 100 : 0;

  const currentMood = script.chapters[engine.chapterIndex]?.mood || 'sweet';

  const circumference = 2 * Math.PI * 84;
  const timerPct = engine.timerTotal > 0 ? engine.timerRemaining / engine.timerTotal : 1;
  const timerOffset = circumference * (1 - timerPct);
  const isUrgent = engine.timerRemaining <= Math.ceil(engine.timerTotal * 0.2) && engine.timerTotal > 0;
  const isWarning = engine.timerRemaining <= Math.ceil(engine.timerTotal * 0.4) && engine.timerTotal > 0 && !isUrgent;
  const mc = moodColor(currentMood);

  return (
    <div className="h-full flex flex-col relative">
      <div className="absolute inset-0 transition-all duration-1000" style={{ background: moodBg(currentMood) }} />

      {/* Pause overlay */}
      {engine.isPaused && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0d0d1a]/90 backdrop-blur-sm animate-fadeIn">
          <div className="text-5xl mb-5 opacity-60">⏸️</div>
          <div className="text-white text-2xl font-bold mb-2">已暂停</div>
          <div className="text-gray-500 text-sm mb-8">休息一下，准备好了再继续</div>
          <div className="text-gray-600 text-xs mb-6">按 Space 或点击继续</div>
          <button
            onClick={engine.resume}
            className="px-10 py-3.5 rounded-xl font-semibold text-white transition-all active:scale-[0.97]"
            style={{ background: mc }}
          >
            ▶ 继续
          </button>
          <button
            onClick={onBack}
            className="mt-4 px-8 py-2.5 rounded-xl text-sm text-gray-400 bg-white/[0.06] active:bg-white/[0.1] transition-all"
          >
            退出剧本
          </button>
        </div>
      )}

      {/* Chapter transition overlay */}
      {engine.isChapterTransition && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0d0d1a]/95 backdrop-blur-md animate-fadeIn">
          <div className="text-xs font-semibold tracking-[0.2em] mb-2" style={{ color: mc }}>
            — 第 {engine.chapterIndex + 1} 章 —
          </div>
          <div className="text-white text-3xl font-extrabold mb-3">
            {script.chapters[engine.chapterIndex]?.title}
          </div>
          <div className="w-10 h-0.5 rounded-full mb-4" style={{ background: mc }} />
          <div className="text-gray-400 text-sm text-center max-w-[260px] leading-relaxed mb-6">
            故事在继续，感情在升温……
          </div>
          <div className="text-gray-600 text-xs mb-4">按 Enter 或 Space 继续</div>
          <button
            onClick={handleContinue}
            className="px-8 py-3 rounded-xl font-semibold text-white transition-all active:scale-[0.97]"
            style={{ background: mc }}
          >
            继续旅程 →
          </button>
        </div>
      )}

      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-12 pb-2 shrink-0">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] active:bg-white/[0.12] transition-all text-gray-400 hover:text-white"
            title="返回"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10.5 3L5.5 8L10.5 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06]">
            <span className="text-xs text-gray-400">🎙️ 主持人</span>
            <div className="flex gap-0.5 items-center h-3">
              <span className="w-[3px] rounded-full animate-wave" style={{ background: mc, height: '5px' }} />
              <span className="w-[3px] rounded-full animate-wave" style={{ background: mc, height: '9px', animationDelay: '0.15s' }} />
              <span className="w-[3px] rounded-full animate-wave" style={{ background: mc, height: '12px', animationDelay: '0.3s' }} />
              <span className="w-[3px] rounded-full animate-wave" style={{ background: mc, height: '9px', animationDelay: '0.45s' }} />
              <span className="w-[3px] rounded-full animate-wave" style={{ background: mc, height: '5px', animationDelay: '0.6s' }} />
            </div>
          </div>

          <button
            onClick={engine.pause}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] active:bg-white/[0.12] transition-all text-gray-400 hover:text-white"
            title="暂停 (Space)"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="1" width="3.5" height="12" rx="1" />
              <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
            </svg>
          </button>
        </div>

        {/* Chapter label */}
        <div className="text-center text-[11px] text-gray-500 tracking-widest uppercase mb-1 shrink-0">
          {script.chapters[engine.chapterIndex]?.title || ''}
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6">
          <div className="flex flex-col items-center text-center py-4 min-h-full">
            {!engine.isTask && (
              <div className="flex gap-1 items-center justify-center h-6 mb-3 shrink-0">
                {[1,2,3,4,5].map(i => (
                  <div key={i}
                    className="w-[3px] rounded-full animate-viz"
                    style={{
                      background: mc,
                      height: `${6 + i * 4}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            )}

            {engine.isTask ? (
              <>
                {(engine.getCurrentStep()?.type === 'timer') && (
                  <div className="flex flex-col items-center w-full">
                    <div className="text-4xl mb-3">{engine.narrIcon}</div>
                    <div className="text-white text-lg font-semibold mb-1">{engine.taskTitle}</div>
                    <div className="text-gray-400 text-sm mb-6 leading-relaxed max-w-[280px]"
                      dangerouslySetInnerHTML={{ __html: engine.taskDesc }} />

                    <div className="relative w-[180px] h-[180px] mb-2 shrink-0">
                      <div className="absolute inset-0 rounded-full border border-white/[0.06] animate-ping-slow" />
                      <svg width="180" height="180" className="absolute top-0 left-0 -rotate-90">
                        <circle cx="90" cy="90" r="84" fill="none"
                          stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                        <circle cx="90" cy="90" r="84" fill="none"
                          stroke={isUrgent ? '#FF375F' : isWarning ? '#FFD60A' : mc}
                          strokeWidth="4" strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={timerOffset}
                          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-5xl font-extrabold tabular-nums
                          ${isUrgent ? 'text-[#FF375F] animate-pulse' : isWarning ? 'text-[#FFD60A]' : 'text-white'}`}>
                          {engine.timerRemaining}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">秒</span>
                      </div>
                    </div>

                    <button
                      onClick={handleAdvance}
                      className="mt-4 px-6 py-2 rounded-full bg-white/[0.06] text-gray-500 text-xs border border-white/[0.06] active:bg-white/[0.12] transition-all"
                    >
                      跳过 ⏭
                    </button>
                  </div>
                )}

                {(engine.getCurrentStep()?.type === 'counter') && (
                  <div className="flex flex-col items-center w-full">
                    <div className="text-4xl mb-3">{engine.narrIcon}</div>
                    <div className="text-white text-lg font-semibold mb-1">{engine.taskTitle}</div>
                    <div className="text-gray-400 text-sm mb-6 leading-relaxed max-w-[280px]"
                      dangerouslySetInnerHTML={{ __html: engine.taskDesc }} />

                    <div className="text-6xl font-extrabold tabular-nums mb-2">
                      <span style={{ color: mc }}>{engine.counterValue}</span>
                      <span className="text-gray-500 font-normal text-4xl"> / {engine.counterTarget}</span>
                    </div>

                    <div className="w-48 h-1 bg-white/[0.06] rounded-full overflow-hidden mb-4">
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${engine.counterTarget > 0 ? (engine.counterValue / engine.counterTarget) * 100 : 0}%`,
                          background: mc
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-1 mb-4">
                      <div ref={metroRef} className="w-1 h-6 rounded-full transition-transform"
                        style={{ background: mc }} />
                      <span className="text-xs text-gray-500 ml-2">节拍器</span>
                    </div>

                    <button
                      onClick={() => {
                        if (metroRef.current) {
                          metroRef.current.style.transform = 'scaleX(2.5)';
                          setTimeout(() => { if (metroRef.current) metroRef.current.style.transform = ''; }, 100);
                        }
                        engine.handleCounterTap();
                      }}
                      className="w-48 h-16 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all active:scale-[0.95]"
                      style={{ borderColor: `${mc}33`, background: `${mc}08` }}
                    >
                      <span className="text-lg">👆</span>
                      <span className="text-sm text-gray-400">完成一次</span>
                    </button>

                    <button
                      onClick={handleAdvance}
                      className="mt-4 px-6 py-2 rounded-full bg-white/[0.06] text-gray-500 text-xs border border-white/[0.06] active:bg-white/[0.12] transition-all"
                    >
                      跳过 ⏭
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0">
                  <div className="text-5xl mb-5 transition-all duration-500 shrink-0">{engine.narrIcon}</div>
                  <div className="text-white text-xl font-medium leading-relaxed max-w-[320px]"
                    dangerouslySetInnerHTML={{ __html: engine.narrText }} />
                </div>
                <button
                  onClick={handleAdvance}
                  className="mt-6 mb-2 px-8 py-2.5 rounded-full bg-white/10 text-white/60 text-sm border border-white/10 active:bg-white/20 transition-all shrink-0"
                >
                  下一步 →
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-white/[0.06] rounded-full overflow-hidden shrink-0 mx-6 mb-4">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(progressPct, 100)}%`, background: mc }} />
        </div>
      </div>
    </div>
  );
}
