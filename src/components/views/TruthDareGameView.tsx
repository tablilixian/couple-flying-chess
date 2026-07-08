import { useState, useCallback, useEffect, useRef } from 'react';
import { TDDifficulty, TDTheme, TDQuestion, TDPenalty, TDPlayer, TD_THEMES, GameMode } from '../../types';
import { pickQuestion, pickPenalty, DIFFICULTIES } from '../../data/truthDare';
import {
  startNewSession, addEntryToCurrentSession, finalizeCurrentSession,
  discardCurrentSession, getCurrentSession,
} from '../../utils/gameSession';
import { ArrowLeft, Heart, Sparkles, AlertTriangle, RotateCcw, XCircle, CheckCircle } from 'lucide-react';

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
  const [usedTexts, setUsedTexts] = useState<string[]>([]);
  const flipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const themeLabels = themes.map(t => TD_THEMES.find(c => c.key === t)?.label || t).join('·');
    startNewSession(mode, [
      { id: 0, name: names[0], themeName: themeLabels },
      { id: 1, name: names[1], themeName: themeLabels },
    ]);
  }, []);

  const handleBack = useCallback(() => {
    const session = getCurrentSession();
    if (session) {
      session.entries.length > 0 ? finalizeCurrentSession() : discardCurrentSession();
    }
    onBack();
  }, [onBack]);

  const diffConfig = DIFFICULTIES.find(d => d.key === difficulty)!;
  const playerColors: [string, string] = mode === 'couple' ? ['#0A84FF', '#FF375F'] : ['#5E5CE6', '#FF9F0A'];
  const playerIcons: [string, string] = mode === 'couple' ? ['♂', '♀'] : ['A', 'B'];
  const selectedThemeCfgs = themes.map(t => TD_THEMES.find(c => c.key === t)!).filter(Boolean);
  const otherPlayer = currentPlayer === 0 ? 1 : 0;
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
    const question = pickQuestion(type, difficulty, themes, currentPlayer, playerRoles, mode, usedTexts);
    if (!question) return;
    setCurrentQuestion(question);
    setPhase('display');
    setIsFlipped(false);
    setUsedTexts(prev => [...prev, question.text]);

    const statsKey = type === 'truth' ? 'truthCount' : 'dareCount';
    setStats(prev => {
      const next = [...prev] as [TDPlayer, TDPlayer];
      next[currentPlayer] = { ...next[currentPlayer], [statsKey]: next[currentPlayer][statsKey] + 1 };
      return next;
    });
    roundStartTimeRef.current = Date.now();
  }, [difficulty, themes, currentPlayer, playerRoles, mode, usedTexts]);

  const handleComplete = useCallback(() => {
    if (currentQuestion) {
      addEntryToCurrentSession({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: roundStartTimeRef.current,
        resolvedAt: Date.now(),
        duration: Math.round((Date.now() - roundStartTimeRef.current) / 1000),
        round,
        executorName: names[currentPlayer],
        task: currentQuestion.text,
        completed: true,
        type: currentQuestion.type,
      });
    }
    switchToNextPlayer();
  }, [switchToNextPlayer, currentQuestion, round, names, currentPlayer]);

  const handlePenalty = useCallback(() => {
    if (currentQuestion) {
      addEntryToCurrentSession({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: roundStartTimeRef.current,
        resolvedAt: Date.now(),
        duration: Math.round((Date.now() - roundStartTimeRef.current) / 1000),
        round,
        executorName: names[currentPlayer],
        task: currentQuestion.text,
        completed: false,
        type: currentQuestion.type,
      });
    }
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
    roundStartTimeRef.current = Date.now();
  }, [difficulty, currentPlayer, currentQuestion, round, names]);

  const handlePenaltyComplete = useCallback(() => {
    if (currentPenalty) {
      addEntryToCurrentSession({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: roundStartTimeRef.current,
        resolvedAt: Date.now(),
        duration: Math.round((Date.now() - roundStartTimeRef.current) / 1000),
        round,
        executorName: names[currentPlayer],
        task: currentPenalty.text,
        completed: true,
        type: 'penalty',
      });
    }
    switchToNextPlayer();
  }, [switchToNextPlayer, currentPenalty, round, names, currentPlayer]);

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
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center px-4">
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
            <div className="flip-card-back bg-[#1C1C1E] border border-white/10 px-2 pb-5 pt-6 shadow-2xl flex flex-col">
              <div className="flex-1 flex flex-col items-center">
                <div className="flex items-center justify-center gap-1 text-[11px] text-gray-500 mb-3">
                  <span className="font-semibold text-gray-400">Round {round}</span>
                  <span className="mx-1">·</span>
                  <span>{names[currentPlayer]} 的回合</span>
                </div>
                <div className="flex items-center gap-2 mb-4 flex-wrap justify-center">
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
                <div className="text-white text-xl font-bold text-center leading-relaxed px-2">
                  {currentQuestion.text}
                </div>
                {(() => {
                  const target = currentQuestion.target;
                  const targetIdx = target === 'both' ? currentPlayer : (target === 'male' ? playerRoles.indexOf('male') : playerRoles.indexOf('female'));
                  const targetName = names[targetIdx];
                  const targetColor = playerColors[targetIdx];
                  const label = currentQuestion.type === 'truth' ? '作答' : '完成';
                  return (
                    <div className="mt-auto mb-1 px-3 py-1.5 rounded-lg text-sm font-bold text-center"
                      style={{ backgroundColor: `${targetColor}15`, color: targetColor, borderColor: `${targetColor}30`, borderWidth: 1, borderStyle: 'solid' }}>
                      👤 由 <span className="underline decoration-dotted underline-offset-2">{targetName}</span> {label}
                    </div>
                  );
                })()}
              </div>
              <div className="flex justify-center gap-5 shrink-0">
                <button
                  onClick={handlePenalty}
                  className="w-20 h-20 rounded-full flex flex-col items-center justify-center font-bold text-base ios-btn transition-all duration-200 active:scale-[0.97] leading-tight tracking-wider"
                  style={{ backgroundColor: '#FF453A15', color: '#FF453A', borderColor: '#FF453A25', borderWidth: 1, borderStyle: 'solid' }}
                >
                  <span>接受</span>
                  <span>惩罚</span>
                </button>
                <button
                  onClick={handleComplete}
                  className="w-20 h-20 rounded-full flex flex-col items-center justify-center font-bold text-base ios-btn shadow-lg transition-all duration-200 active:scale-[0.97] leading-tight tracking-wider"
                  style={{ backgroundColor: '#30D158', color: '#000' }}
                >
                  <span>已</span>
                  <span>完成</span>
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
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center px-4">
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
              <div className="flex-1 flex flex-col items-center">
                <div className="flex items-center justify-center gap-1 text-[11px] text-gray-500 mb-3">
                  <span className="font-semibold text-gray-400">Round {round}</span>
                  <span className="mx-1">·</span>
                  <span>{names[currentPlayer]} 的惩罚</span>
                </div>
                <div className="w-fit mb-4 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: '#FF453A22', color: '#FF453A' }}>
                  惩罚 · {diffConfig.label}
                </div>
                <div className="text-white text-xl font-bold text-center leading-relaxed px-2">
                  {currentPenalty.text}
                </div>
              </div>
              <div className="mb-3 px-3 py-1.5 rounded-lg text-sm font-bold text-center"
                style={{ backgroundColor: '#FF453A15', color: '#FF453A', borderColor: '#FF453A30', borderWidth: 1, borderStyle: 'solid' }}>
                👤 由 <span className="underline decoration-dotted underline-offset-2">{names[currentPlayer]}</span> 接受惩罚
              </div>
              <button
                onClick={handlePenaltyComplete}
                className="w-full h-12 rounded-full flex items-center justify-center gap-1.5 font-bold text-sm ios-btn shadow-lg transition-all duration-200 active:scale-[0.97] shrink-0"
                style={{ backgroundColor: '#FF453A', color: '#fff' }}
              >
                <AlertTriangle size={16} />
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
            onClick={handleBack}
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

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          {/* Player card */}
          <div className="w-full max-w-sm rounded-2xl p-5 flex items-center gap-4"
            style={{ backgroundColor: `${playerColors[currentPlayer]}12`, borderColor: `${playerColors[currentPlayer]}30`, borderWidth: 1, borderStyle: 'solid' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
              style={{ backgroundColor: `${playerColors[currentPlayer]}22`, color: playerColors[currentPlayer] }}>
              {playerIcons[currentPlayer]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-lg font-bold truncate">{names[currentPlayer]} 的回合</div>
              <div className="text-gray-500 text-xs mt-0.5">Round {round} · {diffConfig.label}难度</div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {selectedThemeCfgs.slice(0, 4).map(t => (
                  <span key={t.key} className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${t.color}20`, color: t.color }}>
                    {t.label}
                  </span>
                ))}
                {selectedThemeCfgs.length > 4 && (
                  <span className="text-[10px] text-gray-500">+{selectedThemeCfgs.length - 4}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <Heart size={12} className="text-[#FF375F]" />
                <span className="text-white text-xs font-bold">{currentStats.truthCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#FF9F0A]" />
                <span className="text-white text-xs font-bold">{currentStats.dareCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-[#FF453A]" />
                <span className="text-white text-xs font-bold">{currentStats.penaltyCount}</span>
              </div>
            </div>
          </div>

          {/* Choice buttons */}
          <div className="flex gap-4 w-full max-w-sm">
            <button
              onClick={() => handleChoice('truth')}
              className="flex-1 aspect-[3/4] rounded-2xl flex flex-col items-center justify-center gap-3 ios-btn transition-all duration-200 active:scale-[0.97] border"
              style={{
                backgroundColor: '#FF375F15',
                borderColor: '#FF375F30',
              }}
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#FF375F20' }}>
                <Heart className="text-[#FF375F]" size={28} />
              </div>
              <div>
                <div className="text-white font-bold text-lg text-center">真心话</div>
                <div className="text-[#FF375F] text-xs text-center mt-0.5 opacity-70">说出你的答案</div>
              </div>
            </button>
            <button
              onClick={() => handleChoice('dare')}
              className="flex-1 aspect-[3/4] rounded-2xl flex flex-col items-center justify-center gap-3 ios-btn transition-all duration-200 active:scale-[0.97] border"
              style={{
                backgroundColor: '#FF9F0A15',
                borderColor: '#FF9F0A30',
              }}
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#FF9F0A20' }}>
                <Sparkles className="text-[#FF9F0A]" size={28} />
              </div>
              <div>
                <div className="text-white font-bold text-lg text-center">大冒险</div>
                <div className="text-[#FF9F0A] text-xs text-center mt-0.5 opacity-70">接受挑战吧</div>
              </div>
            </button>
          </div>

          {/* Other player preview */}
          <div className="w-full max-w-sm flex items-center justify-center gap-2 opacity-40">
            <div className="text-xs text-gray-500">另一玩家:</div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: `${playerColors[otherPlayer]}22`, color: playerColors[otherPlayer] }}>
                {playerIcons[otherPlayer]}
              </div>
              <span className="text-xs text-gray-400">{names[otherPlayer]}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
