import { Script } from '../../types';
import { StepLogEntry } from '../../types';

interface EndingViewProps {
  script: Script;
  stepLog: StepLogEntry[];
  onReplay: () => void;
  onBackToHub: () => void;
  onBackToSelect: () => void;
}

function moodBg() {
  return 'radial-gradient(ellipse at 30% 30%, #FF375F20 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, #BF5AF215 0%, transparent 50%)';
}

export function EndingView({ script, stepLog, onReplay, onBackToHub, onBackToSelect }: EndingViewProps) {
  const timerCount = stepLog.filter(s => s.type === 'timer').length;
  const counterCount = stepLog.filter(s => s.type === 'counter').length;
  const totalDuration = script.duration;

  return (
    <div className="h-full flex flex-col relative">
      <div className="absolute inset-0 transition-all duration-1000" style={{ background: moodBg() }} />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-12 text-center">
        <div className="text-6xl mb-4 animate-bounce-in">{script.endingIcon}</div>
        <div className="text-xs font-semibold tracking-[0.2em] text-[#FF375F] mb-2">
          — 故事终章 —
        </div>
        <h2 className="text-white text-3xl font-extrabold mb-4">{script.endingTitle}</h2>
        <div className="text-gray-400 text-sm leading-relaxed max-w-[300px] mb-8"
          dangerouslySetInnerHTML={{ __html: script.endingDesc }} />

        {/* Stats */}
        <div className="w-full max-w-[300px] space-y-2 mb-8">
          <div className="flex items-center justify-between px-4 py-3 bg-white/[0.04] rounded-xl">
            <span className="text-gray-400 text-sm">📖 章节数</span>
            <span className="text-white font-semibold">{script.chapters.length} 章</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-white/[0.04] rounded-xl">
            <span className="text-gray-400 text-sm">⏱ 沉浸时长</span>
            <span className="text-white font-semibold">约 {totalDuration} 分钟</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-white/[0.04] rounded-xl">
            <span className="text-gray-400 text-sm">💕 计时任务</span>
            <span className="text-white font-semibold">{timerCount} 次</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-white/[0.04] rounded-xl">
            <span className="text-gray-400 text-sm">🔥 计次任务</span>
            <span className="text-white font-semibold">{counterCount} 次</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 w-full max-w-[300px]">
          <button
            onClick={onBackToSelect}
            className="flex-1 py-3.5 rounded-xl font-semibold text-sm text-white bg-white/[0.08] hover:bg-white/[0.12] active:bg-white/[0.16] transition-all"
          >
            📜 换个剧本
          </button>
          <button
            onClick={onBackToHub}
            className="flex-1 py-3.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.97]"
            style={{ background: '#FF375F' }}
            onMouseEnter={e => e.currentTarget.style.background = '#e02e52'}
            onMouseLeave={e => e.currentTarget.style.background = '#FF375F'}
          >
            🏠 回到首页
          </button>
        </div>
      </div>
    </div>
  );
}
