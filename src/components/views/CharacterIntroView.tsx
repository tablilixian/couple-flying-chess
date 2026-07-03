import { Script } from '../../types';

interface CharacterIntroViewProps {
  script: Script;
  onStart: () => void;
  onBack: () => void;
}

export function CharacterIntroView({ script, onStart, onBack }: CharacterIntroViewProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Ambient */}
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full"
          style={{
            background: `radial-gradient(ellipse at 30% 30%, #FF375F20 0%, transparent 60%),
                        radial-gradient(ellipse at 70% 70%, #BF5AF210 0%, transparent 50%)`
          }}
        />
      </div>

      <div className="relative z-10 flex items-center gap-3 px-6 pt-14 pb-2">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.10] active:bg-white/[0.14] transition-colors text-white text-lg"
        >
          ‹
        </button>
        <h2 className="text-white text-lg font-bold">{script.emoji} {script.title}</h2>
      </div>

      <div className="relative z-10 flex-1 px-6 pb-8 overflow-y-auto">
        <p className="text-sm text-gray-400 leading-relaxed mb-6 mt-2">{script.desc}</p>

        {/* Characters */}
        <div className="space-y-4">
          {script.characters.map(char => (
            <div key={char.role}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 flex gap-4">
              <div className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: `${char.color}18` }}>
                {char.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold tracking-widest uppercase"
                  style={{ color: char.color }}>
                  {char.role === 'male' ? '🎭 男方' : '🎭 女方'}
                </div>
                <h3 className="text-white text-xl font-bold mt-0.5">{char.name}</h3>
                <div className="text-sm text-gray-400">{char.title}</div>
                <div className="mt-3 pt-3 border-t border-white/[0.06] text-sm text-gray-400 leading-relaxed">
                  {char.bio}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          className="w-full mt-6 py-4 rounded-xl font-semibold text-base text-white transition-all active:scale-[0.98]"
          style={{ background: '#FF375F' }}
          onMouseEnter={e => e.currentTarget.style.background = '#e02e52'}
          onMouseLeave={e => e.currentTarget.style.background = '#FF375F'}
        >
          🎧 戴上耳机，开始沉浸体验
        </button>
      </div>
    </div>
  );
}
