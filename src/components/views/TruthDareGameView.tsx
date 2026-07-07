import { useState, useCallback, useEffect, useRef } from 'react';
import { TDDifficulty, TDTheme, TDQuestion, TDPenalty, TDPlayer, TD_THEMES, GameMode } from '../../types';
import { pickQuestion, pickPenalty, DIFFICULTIES } from '../../data/truthDare';
import { ArrowLeft, Heart, Sparkles, AlertTriangle, RotateCcw } from 'lucide-react';

interface TruthDareGameViewProps {
  mode: GameMode;
  names: [string, string];
  difficulty: TDDifficulty;
  themes: TDTheme[];
  onBack: () => void;
}

type Phase = 'choice' | 'display' | 'penalty' | 'transition';

export function TruthDareGameView({ mode, names, difficulty, themes, onBack }: TruthDareGameViewProps) {
  const [currentPlayer, setCurrentPlayer] = useState<0 | 1>(0);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<Phase>('choice');
  const [currentQuestion, setCurrentQuestion] = useState<TDQuestion | null>(null);
  const [currentPenalty, setCurrentPenalty] = useState<TDPenalty | null>(null);
  const [stats, setStats] = useState<[TDPlayer, TDPlayer]>([
    { name: names[0], truthCount: 0, dareCount: 0, penaltyCount: 0 },
    { name: names[1], truthCount: 0, dareCount: 0, penaltyCount: 0 },
  ]);
  const [transitionText, setTransitionText] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPenaltyFlipped, setIsPenaltyFlipped] = useState(false);
  const flipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const diffConfig = DIFFICULTIES.find(d => d.key === difficulty)!;
  const playerColors: [string, string] = mode === 'couple' ? ['#0A84FF', '#FF375F'] : ['#5E5CE6', '#FF9F0A'];
  const playerIcons: [string, string] = mode === 'couple' ? ['♂', '♀'] : ['A', 'B'];
  // couple 模式用男/女 target,normal 模式不区分 target
  const playerRoles: ['male' | 'female', 'male' | 'female'] = mode === 'couple' ? ['male', 'female'] : ['male', 'female'];

  const switchToNextPlayer = useCallback(() => {
    setPhase('transition');
    const next = currentPlayer === 0 ? 1 : 0;
    const nextRound = next === 0 ? round + 1 : round;
    setTransitionText(`${names[currentPlayer]} 已完成`);
    setTimeout(() => {
      setCurrentPlayer(next);
      setRound(nextRound);
      setPhase('choice');
      setCurrentQuestion(null);
      setCurrentPenalty(null);
      setIsFlipped(false);
      setIsPenaltyFlipped(false);
    }, 1500);
  }, [currentPlayer, round, names]);

  const handleChoice = useCallback((type: 'truth' | 'dare') => {
    const question = pickQuestion(type, difficulty, themes, currentPlayer, playerRoles, mode);
    if (!question) return;
    setCurrentQuestion(question);
    setPhase('display');
    setIsFlipped(false);

    const statsKey = type === 'truth' ? 'truthCount' : 'dareCount';
    setStats(prev => {
      const next = [...prev] as [TDPlayer, TDPlayer];
      next[currentPlayer] = { ...next[currentPlayer], [statsKey]: next[currentPlayer][statsKey] + 1 };
      return next;
    });
  }, [difficulty, themes, currentPlayer, playerRoles, mode]);

  const handleComplete = useCallback(() => {
    switchToNextPlayer();
  }, [switchToNextPlayer]);

  const handlePenalty = useCallback(() => {
    const penalty = pickPenalty(difficulty, mode);
    if (!penalty) return;
    setCurrentPenalty(penalty);
    setPhase('penalty');
    setIsPenaltyFlipped(false);
    setStats(prev => {
      const next = [...prev] as [TDPlayer, TDPlayer];
      next[currentPlayer] = { ...next[currentPlayer], penaltyCount: next[currentPlayer].penaltyCount + 1 };
      return next;
    });
  }, [difficulty, currentPlayer]);

  const handlePenaltyComplete = useCallback(() => {
    switchToNextPlayer();
  }, [switchToNextPlayer]);

  useEffect(() => {
    if (phase === 'display' && !isFlipped) {
      flipTimerRef.current = setTimeout(() => {
        setIsFlipped(true);
      }, 100);
    }
    if (phase === 'penalty' && !isPenaltyFlipped) {
      flipTimerRef.current = setTimeout(() => {
        setIsPenaltyFlipped(true);
      }, 100);
    }
    return () => {
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    };
  }, [phase, isFlipped, isPenaltyFlipped]);

  if (phase === 'transition') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${playerColors[currentPlayer]}22` }}>
            <Sparkles className="text-[#30D158]" size={32} />
          </div>
          <div className="text-white text-xl font-bold">{transitionText}</div>
          <div className="text-gray-500 text-sm mt-2">准备下一回合...</div>
        </div>
      </div>
    );
  }

  if (phase === 'display' && currentQuestion) {
    const isTruth = currentQuestion.type === 'truth';
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center px-6">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
        <div className="relative w-full max-w-sm h-[420px] perspective-1000">
          <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
            <div className="flip-card-front bg-[#1C1C1E] border border-white/10 p-6 flex flex-col items-center justify-center shadow-2xl">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                {isTruth
                  ? <Heart className="text-[#FF375F]" size={36} />
                  : <Sparkles className="text-[#FF9F0A]" size={36} />}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {isTruth ? '真心话' : '大冒险'}
              </h3>
              <p className="text-sm text-gray-500 uppercase tracking-widest">
                {isTruth ? '说出你的答案' : '接受挑战吧'}
              </p>
            </div>
            <div className="flip-card-back bg-[#1C1C1E] border border-white/10 p-6 shadow-2xl flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 mb-4">
                  {(() => {
                    const themeCfg = TD_THEMES.find(t => t.key === currentQuestion.theme);
                    return (
                      <div className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: `${themeCfg?.color || '#666'}22`, color: themeCfg?.color || '#666' }}>
                        {themeCfg?.label || currentQuestion.theme}
                      </div>
                    );
                  })()}
                  <div className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: `${diffConfig.color}22`, color: diffConfig.color }}>
                    {diffConfig.label}
                  </div>
                </div>
                <div className="text-white text-lg font-medium text-center leading-relaxed px-2">
                  {currentQuestion.text}
                </div>
              </div>
              <div className="flex gap-3 mt-auto shrink-0">
                <button
                  onClick={handlePenalty}
                  className="flex-1 h-12 rounded-full bg-[#3A3A3C] text-[#FF453A] font-bold text-sm ios-btn border border-transparent hover:border-[#FF453A]/30 transition-colors"
                >
                  接受惩罚
                </button>
                <button
                  onClick={handleComplete}
                  className="flex-1 h-12 rounded-full bg-white text-black font-bold text-sm ios-btn shadow-lg transition-colors"
                >
                  已完成
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'penalty' && currentPenalty) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center px-6">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
        <div className="relative w-full max-w-sm h-[420px] perspective-1000">
          <div className={`flip-card-inner ${isPenaltyFlipped ? 'flipped' : ''}`}>
            <div className="flip-card-front bg-[#1C1C1E] border border-white/10 p-6 flex flex-col items-center justify-center shadow-2xl">
              <div className="w-20 h-20 rounded-full bg-[#FF453A]/10 flex items-center justify-center mb-6 animate-pulse">
                <AlertTriangle className="text-[#FF453A]" size={36} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">惩罚</h3>
              <p className="text-sm text-gray-500 uppercase tracking-widest">
                {names[currentPlayer]}，准备好接受惩罚
              </p>
            </div>
            <div className="flip-card-back bg-[#1C1C1E] border border-white/10 p-6 shadow-2xl flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-fit mb-4 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: '#FF453A22', color: '#FF453A' }}>
                  惩罚 · {diffConfig.label}
                </div>
                <div className="text-white text-lg font-medium text-center leading-relaxed px-2">
                  {currentPenalty.text}
                </div>
              </div>
              <button
                onClick={handlePenaltyComplete}
                className="w-full h-12 rounded-full bg-[#FF453A] text-white font-bold text-sm ios-btn shadow-lg transition-colors shrink-0"
              >
                接受惩罚
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentStats = stats[currentPlayer];

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
          <div className="flex-1 flex justify-center">
            <div className="p-1.5 bg-[#1C1C1E] rounded-full flex items-center gap-2 border border-white/10">
              {([0, 1] as const).map(i => (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
                    currentPlayer === i
                      ? 'text-white shadow-lg'
                      : 'opacity-40'
                  }`}
                  style={{
                    backgroundColor: currentPlayer === i ? `${playerColors[i]}33` : 'transparent',
                    color: currentPlayer === i ? playerColors[i] : '#6B7280',
                  }}
                >
                  <span className="text-xs font-bold">{names[i]}</span>
                </div>
              ))}
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">
                Round {round}
              </div>
            </div>
          </div>
          <div className="w-10" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
          {/* Current player indicator */}
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3"
              style={{ backgroundColor: `${playerColors[currentPlayer]}22`, color: playerColors[currentPlayer] }}
            >
              {playerIcons[currentPlayer]}
            </div>
            <div className="text-white text-xl font-bold">{names[currentPlayer]}</div>
            <div className="text-gray-500 text-xs mt-1">选择一种挑战类型</div>
          </div>

          {/* Choice buttons */}
          <div className="flex gap-4 w-full max-w-sm">
            <button
              onClick={() => handleChoice('truth')}
              className="flex-1 aspect-square bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 ios-btn transition-all duration-200 hover:bg-white/10 active:bg-white/[0.12]"
            >
              <Heart className="text-[#FF375F]" size={40} />
              <span className="text-white font-bold text-lg">真心话</span>
              <span className="text-gray-500 text-xs">说出你的答案</span>
            </button>
            <button
              onClick={() => handleChoice('dare')}
              className="flex-1 aspect-square bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 ios-btn transition-all duration-200 hover:bg-white/10 active:bg-white/[0.12]"
            >
              <Sparkles className="text-[#FF9F0A]" size={40} />
              <span className="text-white font-bold text-lg">大冒险</span>
              <span className="text-gray-500 text-xs">接受挑战吧</span>
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 bg-white/5 rounded-full px-4 py-2 border border-white/5">
            <div className="flex items-center gap-1.5">
              <Heart size={14} className="text-[#FF375F]" />
              <span className="text-gray-400 text-xs">{currentStats.truthCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#FF9F0A]" />
              <span className="text-gray-400 text-xs">{currentStats.dareCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-[#FF453A]" />
              <span className="text-gray-400 text-xs">{currentStats.penaltyCount}</span>
            </div>
          </div>
        </div>

        {/* Difficulty indicator */}
        <div className="shrink-0 pb-8 flex justify-center">
          <div className="text-[10px] text-gray-500 flex items-center gap-2">
            <span>当前难度</span>
            <span className="font-semibold" style={{ color: diffConfig.color }}>{diffConfig.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
