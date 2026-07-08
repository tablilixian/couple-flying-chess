import { useState, useCallback } from 'react';
import { Scenario } from '../../types';
import { X, ChevronRight } from 'lucide-react';

interface ImmersiveGameViewProps {
  scenario: Scenario;
  roleAssignment: [string, string];
  onEnd: () => void;
}

export function ImmersiveGameView({ scenario, roleAssignment, onEnd }: ImmersiveGameViewProps) {
  const [currentActIdx, setCurrentActIdx] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [showActIntro, setShowActIntro] = useState(true);
  const [completedStepTexts, setCompletedStepTexts] = useState<string[]>([]);
  const [showEnding, setShowEnding] = useState(false);

  const currentAct = scenario.acts[currentActIdx];
  const currentStep = currentAct?.steps[currentStepIdx];

  const totalSteps = scenario.acts.reduce((acc, act) => acc + act.steps.length, 0);
  const completedSoFar = scenario.acts
    .slice(0, currentActIdx)
    .reduce((acc, act) => acc + act.steps.length, 0) + currentStepIdx;

  const getActorLabel = useCallback((actor: 0 | 1 | 'both') => {
    if (actor === 'both') return '👥 双方';
    return `${scenario.roleEmojis[actor]} ${roleAssignment[actor]}`;
  }, [scenario, roleAssignment]);

  const getStepActionLabel = useCallback((type: string) => {
    switch (type) {
      case 'command': return '执行指令';
      case 'question': return '回答问题';
      case 'action': return '完成挑战';
      default: return '继续';
    }
  }, []);

  const handleNext = () => {
    if (!currentAct) return;

    // Mark step as completed
    if (currentStep) {
      setCompletedStepTexts(prev => [...prev, currentStep.text]);
    }

    const nextStepIdx = currentStepIdx + 1;
    if (nextStepIdx < currentAct.steps.length) {
      setCurrentStepIdx(nextStepIdx);
      return;
    }

    const nextActIdx = currentActIdx + 1;
    if (nextActIdx < scenario.acts.length) {
      setCurrentActIdx(nextActIdx);
      setCurrentStepIdx(0);
      setShowActIntro(true);
      return;
    }

    setShowEnding(true);
  };

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
            onClick={onEnd}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.10] text-gray-400 transition-colors"
          >
            <X size={16} />
          </button>
          <div className="text-xs text-gray-500">{completedSoFar}/{totalSteps}</div>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${(completedSoFar / totalSteps) * 100}%` }}
          />
        </div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500">
          <span className="text-pink-400 font-semibold">
            {currentAct.title}
          </span>
          <ChevronRight size={12} className="text-gray-600" />
          <span className="text-gray-400">
            步骤 {currentStepIdx + 1}/{currentAct.steps.length}
          </span>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-4">
        <div className="text-center max-w-sm">
          {/* Actor badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5"
            style={{
              backgroundColor: currentStep.actor === 0 ? '#FF375F15' : currentStep.actor === 1 ? '#0A84FF15' : '#30D15815',
              color: currentStep.actor === 0 ? '#FF375F' : currentStep.actor === 1 ? '#0A84FF' : '#30D158',
              border: `1px solid ${currentStep.actor === 0 ? '#FF375F25' : currentStep.actor === 1 ? '#0A84FF25' : '#30D15825'}`,
            }}
          >
            {getActorLabel(currentStep.actor)}
          </div>

          {/* Step text */}
          <div className="text-white text-lg font-bold leading-relaxed mb-4">
            {currentStep.text}
          </div>

          {/* Note */}
          {currentStep.note && (
            <div className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-gray-400 text-xs leading-relaxed">
              💡 {currentStep.note}
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
        {isNarration ? (
          <button
            onClick={handleNext}
            className="w-full py-3.5 rounded-full bg-white/[0.06] text-white font-bold text-sm hover:bg-white/[0.10] active:scale-[0.97] transition-all"
          >
            继续
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full py-3.5 rounded-full bg-pink-500 text-white font-bold text-sm hover:bg-pink-400 active:scale-[0.97] transition-all shadow-lg shadow-pink-500/30"
          >
            {getStepActionLabel(currentStep.type)} ✓
          </button>
        )}
      </div>
    </div>
  );
}
