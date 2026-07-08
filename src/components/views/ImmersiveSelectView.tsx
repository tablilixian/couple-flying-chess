import { useState } from 'react';
import { Scenario, GameMode } from '../../types';
import { ALL_SCENARIOS } from '../../data/scenarios';

interface ImmersiveSelectViewProps {
  mode: GameMode;
  onStart: (scenario: Scenario, roleAssignment: [string, string]) => void;
  onBack: () => void;
}

function loadPlayerNames(mode: GameMode): [string, string] {
  try {
    const raw = localStorage.getItem(mode === 'couple' ? 'couple-player-names' : 'normal-player-names');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 2) return [parsed[0], parsed[1]];
    }
  } catch {}
  return mode === 'couple' ? ['男方', '女方'] : ['玩家 A', '玩家 B'];
}

export function ImmersiveSelectView({ mode, onStart, onBack }: ImmersiveSelectViewProps) {
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [roleAssignment, setRoleAssignment] = useState<[string, string]>(['', '']);

  const handleSelect = (s: Scenario) => {
    const savedNames = loadPlayerNames(mode);
    setSelected(s);
    setRoleAssignment(savedNames);
  };

  const scenarios = ALL_SCENARIOS.filter(s => s.mode === mode);

  if (selected) {
    return (
      <div className="h-full flex flex-col">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full"
            style={{
              background: `radial-gradient(ellipse at 30% 30%, #FF375F18 0%, transparent 60%),
                          radial-gradient(ellipse at 70% 70%, #BF5AF210 0%, transparent 50%)`
            }}
          />
        </div>

        <div className="relative z-10 flex items-center gap-3 px-6 pt-14 pb-4">
          <button
            onClick={() => setSelected(null)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.10] active:bg-white/[0.14] transition-colors text-white text-lg"
          >
            ‹
          </button>
          <h2 className="text-white text-xl font-bold">角色分配</h2>
        </div>

        <div className="relative z-10 flex-1 px-6 pb-8 overflow-y-auto flex flex-col items-center gap-6">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-center shrink-0">
            <span className="text-5xl mb-4 block">{selected.emoji}</span>
            <h3 className="text-white text-xl font-bold">{selected.title}</h3>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">{selected.desc}</p>
            <div className="flex gap-3 justify-center mt-4 text-xs text-gray-500">
              <span>⏱ {selected.estimatedMinutes}min</span>
              <span>🎭 {selected.roles.length}人</span>
              <span>📖 {selected.acts.length}幕</span>
            </div>
          </div>

          {/* Definitions */}
          {selected.definitions && selected.definitions.length > 0 && (
            <div className="w-full max-w-sm">
              <div className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">概念说明</div>
              <div className="flex flex-col gap-2">
                {selected.definitions.map((d, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                    <div className="text-white text-sm font-semibold mb-1">{d.term}</div>
                    <div className="text-gray-400 text-xs leading-relaxed">{d.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="w-full max-w-sm flex flex-col gap-3 shrink-0">
            {selected.roles.map((role, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3">
                <span className="text-2xl">{selected.roleEmojis[i]}</span>
                <span className="text-white font-medium flex-1">{role}</span>
                <div className="flex gap-1">
                  {loadPlayerNames(mode).map((name, j) => (
                    <button
                      key={j}
                      onClick={() => {
                        const newAssign = [...roleAssignment] as [string, string];
                        newAssign[i] = name;
                        setRoleAssignment(newAssign);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        roleAssignment[i] === name
                          ? 'bg-pink-500 text-white'
                          : 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.10]'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onStart(selected, roleAssignment)}
            className="w-full max-w-sm py-3.5 rounded-full bg-pink-500 text-white font-bold text-base hover:bg-pink-400 active:scale-[0.97] transition-all shadow-lg shadow-pink-500/30"
          >
            开始旅程
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full"
          style={{
            background: `radial-gradient(ellipse at 30% 30%, #FF375F18 0%, transparent 60%),
                        radial-gradient(ellipse at 70% 70%, #BF5AF210 0%, transparent 50%)`
          }}
        />
      </div>

      <div className="relative z-10 flex items-center gap-3 px-6 pt-14 pb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.10] active:bg-white/[0.14] transition-colors text-white text-lg"
        >
          ‹
        </button>
        <div>
          <h2 className="text-white text-xl font-bold">🎭 沉浸剧场</h2>
          <div className="text-xs text-gray-500 mt-0.5">选择剧本，开始你们的双人旅程</div>
        </div>
      </div>

      <div className="relative z-10 flex-1 px-6 pb-8 overflow-y-auto space-y-3">
        {scenarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-4xl mb-4 opacity-30">🎭</span>
            <p className="text-gray-600 text-sm">
              {mode === 'normal'
                ? '当前模式暂无剧本，请切换到情侣模式体验完整内容'
                : '暂无可用剧本'}
            </p>
          </div>
        ) : scenarios.map(s => (
          <button
            key={s.id}
            onClick={() => handleSelect(s)}
            className="w-full flex gap-4 p-4 bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12]
                       border border-white/[0.08] rounded-2xl transition-all text-left"
          >
            <div className="w-[72px] h-[96px] rounded-xl flex items-center justify-center text-3xl flex-shrink-0 bg-white/[0.06]">
              {s.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-base">{s.title}</h3>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed line-clamp-2">{s.desc}</p>
              <div className="flex gap-3 mt-2 text-xs text-gray-500">
                <span>⏱ {s.estimatedMinutes}min</span>
                <span>🎭 {s.roles.join(' / ')}</span>
                <span>📖 {s.acts.length}幕</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
