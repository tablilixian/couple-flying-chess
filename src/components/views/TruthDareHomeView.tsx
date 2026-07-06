import { useState } from 'react';
import { TDDifficulty } from '../../types';
import { DIFFICULTIES, TRUTH_QUESTIONS, DARE_QUESTIONS, PENALTIES } from '../../data/truthDare';
import { ArrowLeft } from 'lucide-react';

interface TruthDareHomeViewProps {
  onStart: (names: [string, string], difficulty: TDDifficulty) => void;
  onBack: () => void;
}

export function TruthDareHomeView({ onStart, onBack }: TruthDareHomeViewProps) {
  const [names, setNames] = useState<[string, string]>(['', '']);
  const [difficulty, setDifficulty] = useState<TDDifficulty>('soft');

  const playerLabels: [string, string] = ['他', '她'];
  const playerIcons: [string, string] = ['♂', '♀'];
  const playerColors: [string, string] = ['#0A84FF', '#FF375F'];

  const canStart = names[0].trim().length > 0 && names[1].trim().length > 0;

  const truthCount = TRUTH_QUESTIONS.filter(q => q.difficulty === difficulty).length;
  const dareCount = DARE_QUESTIONS.filter(q => q.difficulty === difficulty).length;
  const penaltyCount = PENALTIES.filter(p => p.difficulty === difficulty).length;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-60" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 flex flex-col h-full max-w-[430px] mx-auto w-full">
        <header className="pt-12 pb-2 px-4 flex items-center gap-4 shrink-0">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center ios-btn border border-white/5"
          >
            <ArrowLeft className="text-white" size={20} />
          </button>
          <div className="text-white text-lg font-bold">真心话大冒险</div>
        </header>

        <div className="flex-1 px-6 flex flex-col justify-center gap-6">
          {/* Player name inputs */}
          <div className="flex gap-4">
            {([0, 1] as const).map(i => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{ backgroundColor: `${playerColors[i]}22`, color: playerColors[i] }}
                >
                  {playerIcons[i]}
                </div>
                <input
                  value={names[i]}
                  onChange={e => {
                    const next = [...names] as [string, string];
                    next[i] = e.target.value;
                    setNames(next);
                  }}
                  placeholder={playerLabels[i]}
                  className="w-full text-center bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                  maxLength={8}
                />
              </div>
            ))}
          </div>

          {/* Difficulty selector */}
          <div>
            <div className="text-gray-400 text-xs mb-3 text-center font-medium tracking-wider">
              选择难度
            </div>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.key}
                  onClick={() => setDifficulty(d.key)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ios-btn"
                  style={{
                    backgroundColor: difficulty === d.key ? `${d.color}22` : 'rgba(255,255,255,0.04)',
                    borderColor: difficulty === d.key ? d.color : 'rgba(255,255,255,0.08)',
                    color: difficulty === d.key ? d.color : '#9CA3AF',
                    borderWidth: 1,
                    borderStyle: 'solid',
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats preview */}
          <div className="text-center">
            <div className="inline-flex items-center gap-4 bg-white/5 rounded-full px-4 py-2 border border-white/5">
              <span className="text-gray-400 text-xs">
                💬 真心话 <span className="text-white">{truthCount}</span>
              </span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-400 text-xs">
                🎪 大冒险 <span className="text-white">{dareCount}</span>
              </span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-400 text-xs">
                ⚠️ 惩罚 <span className="text-white">{penaltyCount}</span>
              </span>
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={() => onStart(names, difficulty)}
            disabled={!canStart}
            className="w-full py-4 rounded-2xl text-white font-bold text-lg ios-btn transition-all duration-200"
            style={{
              backgroundColor: canStart ? '#FF375F' : '#3A3A3C',
              opacity: canStart ? 1 : 0.5,
            }}
          >
            开始挑战
          </button>
        </div>
      </div>
    </div>
  );
}
