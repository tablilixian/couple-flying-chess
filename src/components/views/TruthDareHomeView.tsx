import { useState, useEffect, useMemo } from 'react';
import { TDDifficulty, TDTheme, TD_THEMES, GameMode } from '../../types';
import { DIFFICULTIES, COUPLE_QUESTIONS, NORMAL_QUESTIONS, COUPLE_PENALTIES, NORMAL_PENALTIES } from '../../data/truthDare';
import { ArrowLeft } from 'lucide-react';

interface TruthDareHomeViewProps {
  mode: GameMode;
  defaultNames: [string, string];
  onStart: (names: [string, string], difficulty: TDDifficulty, themes: TDTheme[]) => void;
  onBack: () => void;
}

export function TruthDareHomeView({ mode, defaultNames, onStart, onBack }: TruthDareHomeViewProps) {
  // 当前 mode 可用主题
  const availableThemes = useMemo(
    () => TD_THEMES.filter(t => t.modes.includes(mode)),
    [mode]
  );
  const availableThemeKeys = useMemo(
    () => availableThemes.map(t => t.key),
    [availableThemes]
  );

  const questionPool = mode === 'couple' ? COUPLE_QUESTIONS : NORMAL_QUESTIONS;
  const penaltyPool = mode === 'couple' ? COUPLE_PENALTIES : NORMAL_PENALTIES;

  const [names, setNames] = useState<[string, string]>(defaultNames);
  const [difficulty, setDifficulty] = useState<TDDifficulty>('soft');
  const [selectedThemes, setSelectedThemes] = useState<TDTheme[]>(availableThemeKeys);

  // mode 切换时,重置已选主题到当前可用主题
  useEffect(() => {
    setSelectedThemes(availableThemeKeys);
  }, [availableThemeKeys]);

  const playerLabels: [string, string] = mode === 'couple' ? ['他', '她'] : ['玩家 1', '玩家 2'];
  const playerIcons: [string, string] = mode === 'couple' ? ['♂', '♀'] : ['A', 'B'];
  const playerColors: [string, string] = mode === 'couple' ? ['#0A84FF', '#FF375F'] : ['#5E5CE6', '#FF9F0A'];

  const canStart = names[0].trim().length > 0 && names[1].trim().length > 0 && selectedThemes.length > 0;

  const toggleTheme = (theme: TDTheme) => {
    setSelectedThemes(prev =>
      prev.includes(theme) ? prev.filter(t => t !== theme) : [...prev, theme]
    );
  };

  const totalTruth = questionPool.filter(q =>
    q.type === 'truth' && q.difficulty === difficulty && selectedThemes.includes(q.theme)
  ).length;
  const totalDare = questionPool.filter(q =>
    q.type === 'dare' && q.difficulty === difficulty && selectedThemes.includes(q.theme)
  ).length;
  const totalPenalty = penaltyPool.filter(p => p.difficulty === difficulty).length;

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

        <div className="flex-1 px-6 flex flex-col justify-center gap-5 overflow-y-auto py-4">
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

          {/* Theme selector */}
          <div>
            <div className="text-gray-400 text-xs mb-3 text-center font-medium tracking-wider">
              选择主题  <span className="text-gray-600">（已选 {selectedThemes.length} 个）</span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {availableThemes.map(t => {
                const isSelected = selectedThemes.includes(t.key);
                const questionCount = questionPool.filter(q =>
                  q.difficulty === difficulty && q.theme === t.key
                ).length;
                return (
                  <button
                    key={t.key}
                    onClick={() => toggleTheme(t.key)}
                    className="px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ios-btn"
                    style={{
                      backgroundColor: isSelected ? `${t.color}22` : 'rgba(255,255,255,0.04)',
                      borderColor: isSelected ? t.color : 'rgba(255,255,255,0.08)',
                      color: isSelected ? t.color : '#6B7280',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      opacity: questionCount === 0 ? 0.3 : 1,
                    }}
                  >
                    {t.label}
                    {questionCount > 0 && (
                      <span className="ml-1 opacity-60">({questionCount})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stats preview */}
          <div className="text-center">
            <div className="inline-flex items-center gap-4 bg-white/5 rounded-full px-4 py-2 border border-white/5">
              <span className="text-gray-400 text-xs">
                💬 真心话 <span className="text-white">{totalTruth}</span>
              </span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-400 text-xs">
                🎪 大冒险 <span className="text-white">{totalDare}</span>
              </span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-400 text-xs">
                ⚠️ 惩罚 <span className="text-white">{totalPenalty}</span>
              </span>
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={() => onStart(names, difficulty, selectedThemes)}
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
