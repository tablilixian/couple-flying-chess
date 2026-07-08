import { useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { Scenario, ISActor } from '../../types';
import { X, ChevronRight } from 'lucide-react';
import { saveToStorage, loadFromStorage, removeFromStorage } from '../../utils/localStorage';

interface ImmersiveGameViewProps {
  scenario: Scenario;
  roleAssignment: [string, string];
  startActIdx?: number;
  onEnd: () => void;
}

const NAME_COLORS = ['#0A84FF', '#FF375F'] as const;
const PROGRESS_KEY_PREFIX = 'immersive-progress';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replacePlaceholders(text: string, actor: ISActor, names: [string, string]): string {
  const actorIdx = actor === 'both' ? -1 : actor;
  const partnerIdx = actor === 0 ? 1 : actor === 1 ? 0 : -1;
  return text
    .replaceAll('{actor}', actorIdx >= 0 ? names[actorIdx] : '你们')
    .replaceAll('{partner}', partnerIdx >= 0 ? names[partnerIdx] : '对方')
    .replaceAll('{0}', names[0])
    .replaceAll('{1}', names[1]);
}

function highlightNames(text: string, names: [string, string]): ReactNode[] {
  if (!text) return [];
  const parts = text.split(
    new RegExp(`(${names.map(n => escapeRegex(n)).join('|')})`, 'g')
  );
  return parts.map((part, i) => {
    if (part === names[0]) return <span key={i} style={{ color: NAME_COLORS[0] }}>{part}</span>;
    if (part === names[1]) return <span key={i} style={{ color: NAME_COLORS[1] }}>{part}</span>;
    return part;
  });
}

function getProgressKey(scenarioId: string) {
  return `${PROGRESS_KEY_PREFIX}-${scenarioId}`;
}

export function ImmersiveGameView({ scenario, roleAssignment, startActIdx = 0, onEnd }: ImmersiveGameViewProps) {
  const [currentActIdx, setCurrentActIdx] = useState(startActIdx);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [showActIntro, setShowActIntro] = useState(true);
  const [showEnding, setShowEnding] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [savedProgress, setSavedProgress] = useState<{ currentActIdx: number; currentStepIdx: number } | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

  const clearProgress = useCallback(() => {
    removeFromStorage(getProgressKey(scenario.id));
  }, [scenario.id]);

  useEffect(() => {
    if (startActIdx > 0) return;
    const saved = loadFromStorage<{ currentActIdx: number; currentStepIdx: number } | null>(
      getProgressKey(scenario.id), null
    );
    if (saved) {
      setSavedProgress(saved);
      setShowResume(true);
    }
  }, [scenario.id, startActIdx]);

  const currentAct = scenario.acts[currentActIdx];
  const currentStep = currentAct?.steps[currentStepIdx];

  const totalSteps = scenario.acts.reduce((acc, act) => acc + act.steps.length, 0);
  const completedSoFar = scenario.acts
    .slice(0, currentActIdx)
    .reduce((acc, act) => acc + act.steps.length, 0) + currentStepIdx;

  const names = roleAssignment;

  const getActorLabel = useCallback((actor: ISActor) => {
    if (actor === 'both') return '👥 双方';
    return `${scenario.roleEmojis[actor]} ${names[actor]}`;
  }, [scenario, names]);

  const getStepActionLabel = useCallback((type: string) => {
    switch (type) {
      case 'command': return '执行指令';
      case 'question': return '回答问题';
      case 'action': return '完成挑战';
      default: return '继续';
    }
  }, []);

  const processedText = useMemo((): ReactNode[] => {
    if (!currentStep) return [];
    const raw = replacePlaceholders(currentStep.text, currentStep.actor, names);
    return highlightNames(raw, names);
  }, [currentStep, names]);

  const processedNote = useMemo((): ReactNode[] | undefined => {
    if (!currentStep?.note) return undefined;
    const raw = replacePlaceholders(currentStep.note, currentStep.actor, names);
    return highlightNames(raw, names);
  }, [currentStep, names]);

  const processedSuggestions = useMemo((): string[] | undefined => {
    if (!currentStep?.suggestions) return undefined;
    return currentStep.suggestions.map(s => replacePlaceholders(s, currentStep.actor, names));
  }, [currentStep, names]);

  const handleToggleSuggestion = (idx: number) => {
    setSelectedSuggestions(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const saveProgressAt = useCallback((actIdx: number, stepIdx: number) => {
    saveToStorage(getProgressKey(scenario.id), { currentActIdx: actIdx, currentStepIdx: stepIdx });
  }, [scenario.id]);

  const handleNext = () => {
    if (!currentAct) return;
    setSelectedSuggestions(new Set());

    const nextStepIdx = currentStepIdx + 1;
    if (nextStepIdx < currentAct.steps.length) {
      setCurrentStepIdx(nextStepIdx);
      saveProgressAt(currentActIdx, nextStepIdx);
      return;
    }

    const nextActIdx = currentActIdx + 1;
    if (nextActIdx < scenario.acts.length) {
      setCurrentActIdx(nextActIdx);
      setCurrentStepIdx(0);
      setShowActIntro(true);
      saveProgressAt(nextActIdx, 0);
      return;
    }

    clearProgress();
    setShowEnding(true);
  };

  const canGoBack = currentActIdx > 0 || currentStepIdx > 0;

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
      saveProgressAt(currentActIdx, currentStepIdx - 1);
      setSelectedSuggestions(new Set());
    } else if (currentActIdx > 0) {
      const prevAct = scenario.acts[currentActIdx - 1];
      setCurrentActIdx(currentActIdx - 1);
      setCurrentStepIdx(prevAct.steps.length - 1);
      setShowActIntro(false);
      saveProgressAt(currentActIdx - 1, prevAct.steps.length - 1);
      setSelectedSuggestions(new Set());
    }
  };

  const handleResume = (saved: { currentActIdx: number; currentStepIdx: number }) => {
    setCurrentActIdx(saved.currentActIdx);
    setCurrentStepIdx(saved.currentStepIdx);
    setShowActIntro(false);
    setShowResume(false);
  };

  const handleRestart = () => {
    clearProgress();
    setCurrentActIdx(startActIdx);
    setCurrentStepIdx(0);
    setShowActIntro(true);
    setShowResume(false);
  };

  const handleQuit = () => {
    saveProgressAt(currentActIdx, currentStepIdx);
    onEnd();
  };

  if (showResume && savedProgress) {
    const actLabel = `第 ${savedProgress.currentActIdx + 1} 幕`;
    const stepLabel = `步骤 ${savedProgress.currentStepIdx + 1}`;
    const totalLabel = `共 ${scenario.acts.length} 幕`;
    return (
      <div className="h-full flex flex-col items-center justify-center px-6" style={{ background: '#0d0d1a' }}>
        <span className="text-6xl mb-6">{scenario.emoji}</span>
        <h2 className="text-white text-2xl font-bold mb-2">继续旅程？</h2>
        <p className="text-gray-500 text-center text-sm leading-relaxed mb-2 max-w-xs">
          上次进行到 <span className="text-gray-300 font-semibold">{actLabel}</span> 的 <span className="text-gray-300 font-semibold">{stepLabel}</span>
        </p>
        <p className="text-gray-600 text-center text-xs mb-8 max-w-xs">{scenario.title} · {totalLabel}</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => handleResume(savedProgress)}
            className="w-full py-3.5 rounded-full bg-pink-500 text-white font-bold text-sm hover:bg-pink-400 active:scale-[0.97] transition-all shadow-lg shadow-pink-500/30"
          >
            继续上次进度
          </button>
          <button
            onClick={handleRestart}
            className="w-full py-3.5 rounded-full bg-white/[0.06] text-white font-bold text-sm hover:bg-white/[0.10] active:scale-[0.97] transition-all"
          >
            重新开始
          </button>
          <button
            onClick={handleQuit}
            className="w-full py-3 rounded-full bg-transparent text-gray-500 text-xs hover:text-gray-400 active:scale-[0.97] transition-all"
          >
            返回大厅
          </button>
        </div>
      </div>
    );
  }

  if (showEnding) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6" style={{ background: '#0d0d1a' }}>
        <span className="text-6xl mb-6">{scenario.emoji}</span>
        <h2 className="text-white text-2xl font-bold mb-2">旅程完成</h2>
        <p className="text-gray-500 text-center text-sm leading-relaxed mb-8 max-w-xs">
          你们共同完成了「{scenario.title}」的全部旅程。
          希望这段经历让你们更加亲密。
        </p>
        <div className="flex gap-3">
          <button
            onClick={onEnd}
            className="px-6 py-3 rounded-full bg-pink-500 text-white font-bold text-sm hover:bg-pink-400 active:scale-[0.97] transition-all"
          >
            返回大厅
          </button>
        </div>
      </div>
    );
  }

  if (showActIntro && currentAct) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6" style={{ background: '#0d0d1a' }}>
        <div className="text-center max-w-sm">
          <div className="text-xs text-gray-500 mb-3 uppercase tracking-widest">
            第 {currentActIdx + 1} 幕 · 共 {scenario.acts.length} 幕
          </div>
          <div className="w-16 h-0.5 bg-pink-500/50 mx-auto mb-6" />
          <h2 className="text-white text-2xl font-bold mb-3">{currentAct.title}</h2>
          {currentAct.desc && (
            <p className="text-gray-400 text-sm leading-relaxed">{currentAct.desc}</p>
          )}
          <div className="text-gray-600 text-xs mt-6">
            {currentAct.steps.length} 个步骤 · 约 {Math.ceil(scenario.estimatedMinutes / scenario.acts.length)} 分钟
          </div>
          <button
            onClick={() => setShowActIntro(false)}
            className="mt-8 px-8 py-3 rounded-full bg-pink-500 text-white font-bold text-sm hover:bg-pink-400 active:scale-[0.97] transition-all shadow-lg shadow-pink-500/30"
          >
            开始
          </button>
        </div>
      </div>
    );
  }

  if (!currentStep || !currentAct) return null;

  const isNarration = currentStep.type === 'narration';

  return (
    <div className="h-full flex flex-col" style={{ background: '#0d0d1a' }}>
      {/* Header */}
      <div className="shrink-0 px-6 pt-12 pb-3">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleQuit}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.10] text-gray-400 transition-colors"
          >
            <X size={16} />
          </button>
          <div className="text-xs text-gray-500">{completedSoFar}/{totalSteps}</div>
        </div>
        <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${(completedSoFar / totalSteps) * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500">
          <span className="text-pink-400 font-semibold">{currentAct.title}</span>
          <ChevronRight size={12} className="text-gray-600" />
          <span className="text-gray-400">步骤 {currentStepIdx + 1}/{currentAct.steps.length}</span>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-4 overflow-y-auto">
        <div className="text-center max-w-sm w-full">
          {/* Actor badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5"
            style={{
              backgroundColor: currentStep.actor === 0 ? `${NAME_COLORS[0]}15` : currentStep.actor === 1 ? `${NAME_COLORS[1]}15` : '#30D15815',
              color: currentStep.actor === 0 ? NAME_COLORS[0] : currentStep.actor === 1 ? NAME_COLORS[1] : '#30D158',
              border: `1px solid ${currentStep.actor === 0 ? `${NAME_COLORS[0]}25` : currentStep.actor === 1 ? `${NAME_COLORS[1]}25` : '#30D15825'}`,
            }}
          >
            {getActorLabel(currentStep.actor)}
          </div>

          {/* Step text */}
          <div className="text-white text-lg font-bold leading-relaxed mb-4 whitespace-pre-wrap">
            {processedText}
          </div>

          {/* Suggestions */}
          {processedSuggestions && processedSuggestions.length > 0 && (
            <div className="mb-4">
              <div className="text-gray-500 text-[11px] mb-2">备选参考（可选）：</div>
              <div className="flex flex-wrap gap-2 justify-center">
                {processedSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleToggleSuggestion(i)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-[0.95] ${
                      selectedSuggestions.has(i)
                        ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                        : 'bg-white/[0.06] text-gray-400 border border-white/[0.08] hover:bg-white/[0.10]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          {processedNote && (
            <div className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-gray-400 text-xs leading-relaxed whitespace-pre-wrap">
              💡 {processedNote}
            </div>
          )}

          {/* Type indicator */}
          <div className="text-gray-600 text-xs mt-6 uppercase tracking-widest">
            {currentStep.type === 'command' && '🫦 指令'}
            {currentStep.type === 'question' && '💬 问答'}
            {currentStep.type === 'action' && '🔥 行动'}
            {currentStep.type === 'narration' && '📖 叙述'}
            {currentStep.type === 'choice' && '⚡ 选择'}
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="shrink-0 px-8 pb-10">
        <div className="flex gap-2">
          {canGoBack && (
            <button
              onClick={handlePrev}
              className="px-4 py-3.5 rounded-full bg-white/[0.04] text-gray-400 font-bold text-sm hover:bg-white/[0.08] active:scale-[0.97] transition-all"
            >
              上一句
            </button>
          )}
          <button
            onClick={handleNext}
            className={`flex-1 py-3.5 rounded-full font-bold text-sm active:scale-[0.97] transition-all ${
              isNarration
                ? 'bg-white/[0.06] text-white hover:bg-white/[0.10]'
                : 'bg-pink-500 text-white hover:bg-pink-400 shadow-lg shadow-pink-500/30'
            }`}
          >
            {isNarration ? '继续' : `${getStepActionLabel(currentStep.type)} ✓`}
          </button>
        </div>
      </div>
    </div>
  );
}
