import { GameMode, Script } from '../../types';
import { BUILTIN_SCRIPTS } from '../../data/scripts';

interface ScriptSelectViewProps {
  mode: GameMode;
  onSelect: (script: Script) => void;
  onBack: () => void;
}

const COVER_GRADIENTS: Record<string, string> = {
  'coffee-shop': 'linear-gradient(135deg, #FF375F, #BF5AF2)',
  'attic-mystery': 'linear-gradient(135deg, #0A84FF, #30D158)',
};

const MODE_LABEL: Record<string, string> = {
  couple: '💕 情侣剧场',
  normal: '👨‍👩‍👧‍👦 亲子剧场',
};

export function ScriptSelectView({ mode, onSelect, onBack }: ScriptSelectViewProps) {
  const scripts = BUILTIN_SCRIPTS.filter(s => s.mode === mode);

  return (
    <div className="h-full flex flex-col">
      {/* Ambient background */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full"
          style={{
            background: `radial-gradient(ellipse at 30% 30%, #FF375F18 0%, transparent 60%),
                        radial-gradient(ellipse at 70% 70%, #BF5AF210 0%, transparent 50%)`
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-6 pt-14 pb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.10] active:bg-white/[0.14] transition-colors text-white text-lg"
        >
          ‹
        </button>
        <div>
          <h2 className="text-white text-xl font-bold">🎧 选择剧本</h2>
          <div className="text-xs text-gray-500 mt-0.5">{MODE_LABEL[mode]}</div>
        </div>
      </div>

      {/* List */}
      <div className="relative z-10 flex-1 px-6 pb-8 overflow-y-auto space-y-3">
        {scripts.map(script => (
          <button
            key={script.id}
            onClick={() => onSelect(script)}
            className="w-full flex gap-4 p-4 bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12]
                       border border-white/[0.08] rounded-2xl transition-all text-left"
          >
            <div
              className="w-[72px] h-[96px] rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: COVER_GRADIENTS[script.id] || 'linear-gradient(135deg, #FF375F, #BF5AF2)' }}
            >
              {script.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-base">{script.title}</h3>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {script.tags.map((tag, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex gap-3 mt-2 text-xs text-gray-500">
                <span>⏱ {script.duration}min</span>
                <span>🎭 2人</span>
                <span>🏆 {script.endings}结局</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
