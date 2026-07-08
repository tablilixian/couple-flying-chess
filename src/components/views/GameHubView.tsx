import { AppSubview, GameMode } from '../../types';

interface GameHubViewProps {
  mode: GameMode;
  onNavigate: (view: AppSubview) => void;
}

export function GameHubView({ mode, onNavigate }: GameHubViewProps) {
  const accentColor = mode === 'couple' ? '#FF375F' : '#0A84FF';

  return (
    <div className="h-full flex flex-col relative">
      {/* Ambient gradient */}
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full"
          style={{
            background: `radial-gradient(ellipse at 30% 30%, ${accentColor}22 0%, transparent 60%),
                        radial-gradient(ellipse at 70% 70%, #BF5AF215 0%, transparent 50%)`
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center pt-16 pb-6">
        <div className="text-center">
          <div className="text-sm font-semibold tracking-widest mb-1"
            style={{ color: accentColor }}>
            {mode === 'couple' ? '💕 情侣模式' : '🎲 普通模式'}
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">游戏中心</h1>
          <p className="text-sm text-gray-500 mt-2">选择一种方式，开启今晚的二人时光</p>
        </div>
      </div>

      <div className="relative z-10 px-6 flex-1 flex flex-col gap-4 pb-8 justify-center">
        {/* Flying Chess */}
        <button
          onClick={() => onNavigate('flying-home')}
          className="w-full bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12]
                     border border-white/[0.08] rounded-2xl p-6 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">✈️</span>
            <div className="flex-1">
              <div className="text-white text-lg font-semibold">飞行棋</div>
              <div className="text-gray-500 text-sm mt-0.5">经典棋盘对战，掷骰子走步</div>
            </div>
            <span className="text-xs font-semibold text-white bg-blue-500 px-2.5 py-1 rounded-full">HOT</span>
          </div>
        </button>

        {/* Script Game */}
        <button
          onClick={() => onNavigate('script-select')}
          className="w-full bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12]
                     border border-white/[0.08] rounded-2xl p-6 transition-all text-left group"
          style={{ borderColor: `${accentColor}33` }}
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">🎧</span>
            <div className="flex-1">
              <div className="text-white text-lg font-semibold">剧本杀</div>
              <div className="text-gray-500 text-sm mt-0.5">语音主持 · 沉浸剧情体验</div>
            </div>
            <span className="text-xs font-semibold text-white px-2.5 py-1 rounded-full"
              style={{ background: accentColor }}>NEW</span>
          </div>
        </button>

        {/* Immersive Theater */}
        <button
          onClick={() => onNavigate('immersive-select')}
          className="w-full bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12]
                     border border-white/[0.08] rounded-2xl p-6 transition-all text-left group"
          style={{ borderColor: `${accentColor}33` }}
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">🎭</span>
            <div className="flex-1">
              <div className="text-white text-lg font-semibold">沉浸剧场</div>
              <div className="text-gray-500 text-sm mt-0.5">角色扮演 · 剧本沉浸 · 双人旅程</div>
            </div>
            <span className="text-xs font-semibold text-white px-2.5 py-1 rounded-full"
              style={{ background: accentColor }}>NEW</span>
          </div>
        </button>

        {/* Truth or Dare */}
        <button
          onClick={() => onNavigate('truth-dare-home')}
          className="w-full bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12]
                     border border-white/[0.08] rounded-2xl p-6 transition-all text-left group"
          style={{ borderColor: `${accentColor}33` }}
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">💬</span>
            <div className="flex-1">
              <div className="text-white text-lg font-semibold">真心话大冒险</div>
              <div className="text-gray-500 text-sm mt-0.5">轮流挑战，解锁彼此的秘密</div>
            </div>
          </div>
        </button>

        {/* Locked placeholders */}
        <div className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 text-center opacity-40">
          <div className="flex items-center justify-center gap-3">
            <span>🔒</span>
            <span className="text-gray-600 text-sm">更多游戏，敬请期待</span>
          </div>
        </div>
      </div>
    </div>
  );
}
