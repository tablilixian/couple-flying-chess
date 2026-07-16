import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Play, Square, RotateCcw, Plus, Trash2, Volume2, VolumeX } from 'lucide-react';
import { GameMode } from '../../types';
import { saveToStorage, loadFromStorage } from '../../utils/localStorage';

// === Types ===

type EasingCurve = 'linear' | 'sine' | 'ease-in-out' | 'bounce' | 'elastic';

type SoundType = 'wooden-fish' | 'drum' | 'bell' | 'click';

interface PlanStep {
  frequency: number;
  duration: number;
}

interface MetronomeViewProps {
  mode: GameMode;
  onBack: () => void;
}

const SOUND_CONFIG: Record<SoundType, { label: string }> = {
  'wooden-fish': { label: '木鱼' },
  'drum': { label: '鼓' },
  'bell': { label: '铃铛' },
  'click': { label: '嗒嗒' },
};

const CURVE_CONFIG: Record<EasingCurve, { label: string }> = {
  'linear': { label: '匀速' },
  'sine': { label: '正弦' },
  'ease-in-out': { label: '缓入缓出' },
  'bounce': { label: '弹跳' },
  'elastic': { label: '弹性' },
};

const PRESET_PLANS: { name: string; steps: PlanStep[] }[] = [
  {
    name: '🧘 冥想节奏',
    steps: [
      { frequency: 60, duration: 600 },
      { frequency: 0, duration: 120 },
    ],
  },
  {
    name: '🥁 渐进加速',
    steps: [
      { frequency: 60, duration: 30 },
      { frequency: 80, duration: 30 },
      { frequency: 100, duration: 30 },
      { frequency: 120, duration: 30 },
      { frequency: 0, duration: 30 },
    ],
  },
  {
    name: '⚡ 间歇冲刺',
    steps: [
      { frequency: 120, duration: 20 },
      { frequency: 0, duration: 10 },
    ],
  },
  {
    name: '🌊 波浪模式',
    steps: [
      { frequency: 40, duration: 10 },
      { frequency: 60, duration: 10 },
      { frequency: 80, duration: 10 },
      { frequency: 100, duration: 10 },
      { frequency: 80, duration: 10 },
      { frequency: 60, duration: 10 },
      { frequency: 40, duration: 10 },
      { frequency: 0, duration: 10 },
    ],
  },
];

// === Sound Synthesis ===

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playWoodenFish(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  const v = vol * 0.5;

  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(1000, t);
  osc1.frequency.exponentialRampToValueAtTime(300, t + 0.06);
  gain1.gain.setValueAtTime(v, t);
  gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  osc1.connect(gain1).connect(ctx.destination);
  osc1.start(t);
  osc1.stop(t + 0.25);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1800, t);
  osc2.frequency.exponentialRampToValueAtTime(600, t + 0.04);
  gain2.gain.setValueAtTime(v * 0.4, t);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc2.connect(gain2).connect(ctx.destination);
  osc2.start(t);
  osc2.stop(t + 0.15);

  const noise = ctx.createOscillator();
  const gain3 = ctx.createGain();
  noise.type = 'triangle';
  noise.frequency.setValueAtTime(2500, t);
  noise.frequency.exponentialRampToValueAtTime(800, t + 0.03);
  gain3.gain.setValueAtTime(v * 0.2, t);
  gain3.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  noise.connect(gain3).connect(ctx.destination);
  noise.start(t);
  noise.stop(t + 0.08);
}

function playDrum(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  const v = vol * 0.5;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
  gain.gain.setValueAtTime(v, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.2);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(80, t);
  osc2.frequency.exponentialRampToValueAtTime(30, t + 0.1);
  gain2.gain.setValueAtTime(v * 0.6, t);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc2.connect(gain2).connect(ctx.destination);
  osc2.start(t);
  osc2.stop(t + 0.15);
}

function playBell(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  const v = vol * 0.4;

  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(1200, t);
  osc1.frequency.exponentialRampToValueAtTime(800, t + 0.3);
  gain1.gain.setValueAtTime(v, t);
  gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
  osc1.connect(gain1).connect(ctx.destination);
  osc1.start(t);
  osc1.stop(t + 0.8);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1800, t);
  osc2.frequency.exponentialRampToValueAtTime(1400, t + 0.2);
  gain2.gain.setValueAtTime(v * 0.3, t);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  osc2.connect(gain2).connect(ctx.destination);
  osc2.start(t);
  osc2.stop(t + 0.5);

  const osc3 = ctx.createOscillator();
  const gain3 = ctx.createGain();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(2400, t);
  osc3.frequency.exponentialRampToValueAtTime(2000, t + 0.1);
  gain3.gain.setValueAtTime(v * 0.15, t);
  gain3.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc3.connect(gain3).connect(ctx.destination);
  osc3.start(t);
  osc3.stop(t + 0.3);
}

function playClick(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  const v = vol * 0.3;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.03);
  gain.gain.setValueAtTime(v, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.05);
}

function playSound(type: SoundType, volume: number) {
  try {
    const ctx = getAudioContext();
    switch (type) {
      case 'wooden-fish': playWoodenFish(ctx, volume); break;
      case 'drum': playDrum(ctx, volume); break;
      case 'bell': playBell(ctx, volume); break;
      case 'click': playClick(ctx, volume); break;
    }
  } catch {
    // Audio context not available
  }
}

// === Easing Functions ===

function easeLinear(t: number): number {
  return t < 0.5 ? t * 2 : 2 - t * 2;
}

function easeSine(t: number): number {
  return (Math.sin(t * 2 * Math.PI - Math.PI / 2) + 1) / 2;
}

function easeInOut(t: number): number {
  return t < 0.5
    ? 2 * t * t
    : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function easeBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

function easeElastic(t: number): number {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * 2 * Math.PI / 3) + 1;
}

function getEasedPosition(t: number, curve: EasingCurve): number {
  switch (curve) {
    case 'linear': return easeLinear(t);
    case 'sine': return easeSine(t);
    case 'ease-in-out': return easeInOut(t);
    case 'bounce': return easeBounce(t);
    case 'elastic': return easeElastic(t);
  }
}

// === Helper ===

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m${s > 0 ? `${s}s` : ''}`;
}

// === Component ===

export function MetronomeView({ mode, onBack }: MetronomeViewProps) {
  const accentColor = mode === 'couple' ? '#FF375F' : '#0A84FF';
  const accentBg = mode === 'couple' ? 'bg-pink-500' : 'bg-blue-500';
  const accentText = mode === 'couple' ? 'text-pink-400' : 'text-blue-400';

  // === State ===
  const [frequency, setFrequency] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [curve, setCurve] = useState<EasingCurve>('sine');
  const [soundType, setSoundType] = useState<SoundType>('wooden-fish');
  const [count, setCount] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [planSteps, setPlanSteps] = useState<PlanStep[]>([]);
  const [planEnabled, setPlanEnabled] = useState(false);
  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const [editSteps, setEditSteps] = useState<PlanStep[]>([]);
  const [impactFlash, setImpactFlash] = useState(false);
  const [liveFreq, setLiveFreq] = useState(frequency);

  // === Refs (for animation loop) ===
  const animRef = useRef<number>(0);
  const animStartRef = useRef<number>(0);
  const prevTRef = useRef<number>(0);
  const prevStepIdxRef = useRef<number>(-1);
  const displayFreqRef = useRef(frequency);
  const beadRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const freqRef = useRef(frequency);
  const curveRef = useRef(curve);
  const soundRef = useRef(soundType);
  const volumeRef = useRef(volume);
  const planStepsRef = useRef(planSteps);
  const planEnabledRef = useRef(planEnabled);
  const isRunningRef = useRef(false);

  // Sync refs
  useEffect(() => {
    freqRef.current = frequency;
    setLiveFreq(frequency);
    displayFreqRef.current = frequency;
  }, [frequency]);
  useEffect(() => { curveRef.current = curve; }, [curve]);
  useEffect(() => { soundRef.current = soundType; }, [soundType]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { planStepsRef.current = planSteps; }, [planSteps]);
  useEffect(() => { planEnabledRef.current = planEnabled; }, [planEnabled]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

  // === LocalStorage ===
  useEffect(() => {
    const saved = loadFromStorage<{ steps: PlanStep[]; enabled: boolean }>('metronome-plan', { steps: [], enabled: false });
    setPlanSteps(saved.steps);
    planStepsRef.current = saved.steps;
    setPlanEnabled(saved.enabled);
    planEnabledRef.current = saved.enabled;
  }, []);

  const persistPlan = useCallback((steps: PlanStep[], enabled: boolean) => {
    saveToStorage('metronome-plan', { steps, enabled });
  }, []);

  // === Animation ===
  const animateRef = useRef<(ts: number) => void>();

  animateRef.current = (timestamp: number) => {
    if (!animStartRef.current) {
      animStartRef.current = timestamp;
      prevTRef.current = 0;
      prevStepIdxRef.current = -1;
    }

    const totalElapsed = (timestamp - animStartRef.current) / 1000;
    const freq = freqRef.current;
    const activePlan = planStepsRef.current;
    const planOn = planEnabledRef.current;

    let effectiveFreq = freq;
    let localTime = totalElapsed;

    if (planOn && activePlan.length > 0) {
      const totalDuration = activePlan.reduce((a, b) => a + b.duration, 0);
      if (totalDuration > 0) {
        let t = totalElapsed % totalDuration;
        let stepIdx = 0;
        for (const step of activePlan) {
          if (t < step.duration) break;
          t -= step.duration;
          stepIdx++;
        }

        if (stepIdx !== prevStepIdxRef.current) {
          prevTRef.current = 0;
          prevStepIdxRef.current = stepIdx;
        }

        effectiveFreq = activePlan[stepIdx % activePlan.length].frequency;
        localTime = t;
      }
    }

    if (effectiveFreq !== displayFreqRef.current) {
      displayFreqRef.current = effectiveFreq;
      setLiveFreq(effectiveFreq);
    }

    if (effectiveFreq > 0) {
      const cycleDuration = 60 / effectiveFreq;
      const cycleT = (localTime % cycleDuration) / cycleDuration;
      const pos = getEasedPosition(cycleT, curveRef.current);

      if (prevTRef.current > 0.8 && cycleT < 0.2) {
        playSound(soundRef.current, volumeRef.current);
        setImpactFlash(true);
        setTimeout(() => setImpactFlash(false), 120);
        setCount(c => c + 1);
      }
      prevTRef.current = cycleT;

      if (beadRef.current && trackRef.current) {
        const trackHeight = trackRef.current.offsetHeight;
        const beadSize = 44;
        const y = pos * Math.max(0, trackHeight - beadSize);
        beadRef.current.style.transform = `translateX(-50%) translateY(${-y}px)`;
      }
    } else {
      if (beadRef.current) {
        beadRef.current.style.transform = 'translateX(-50%) translateY(0px)';
      }
      prevTRef.current = 0;
    }

    animRef.current = requestAnimationFrame(animateRef.current!);
  };

  const startAnimation = useCallback(() => {
    animStartRef.current = 0;
    prevTRef.current = 0;
    prevStepIdxRef.current = -1;
    animRef.current = requestAnimationFrame(animateRef.current!);
    setIsRunning(true);
  }, []);

  const stopAnimation = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    setIsRunning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // === Handlers ===
  const handleToggle = () => {
    if (isRunning) {
      stopAnimation();
    } else {
      setCount(0);
      startAnimation();
    }
  };

  const handleReset = () => {
    setCount(0);
  };

  const handleEditPlan = () => {
    setEditSteps(planSteps.length > 0 ? [...planSteps] : []);
    setShowPlanEditor(true);
  };

  const handleSavePlan = () => {
    const filtered = editSteps.filter(s => s.duration > 0);
    setPlanSteps(filtered);
    planStepsRef.current = filtered;
    persistPlan(filtered, planEnabled);
    setShowPlanEditor(false);
  };

  const handleAddStep = () => {
    setEditSteps(prev => [...prev, { frequency: 60, duration: 5 }]);
  };

  const handleRemoveStep = (index: number) => {
    setEditSteps(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditStepFreq = (index: number, value: number) => {
    setEditSteps(prev => prev.map((s, i) => i === index ? { ...s, frequency: Math.max(0, value) } : s));
  };

  const handleEditStepDur = (index: number, value: number) => {
    setEditSteps(prev => prev.map((s, i) => i === index ? { ...s, duration: Math.max(1, value) } : s));
  };

  const handleLoadPreset = (steps: PlanStep[]) => {
    setEditSteps(steps.map(s => ({ ...s })));
  };

  const handleTogglePlan = () => {
    const next = !planEnabled;
    setPlanEnabled(next);
    planEnabledRef.current = next;
    persistPlan(planSteps, next);
  };

  // === Render ===

  return (
    <div className="h-screen w-screen overflow-hidden flex justify-center bg-black">
      <div className="fixed inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-60" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full max-w-[430px] h-full bg-black/20 flex flex-col">
        {/* Header */}
        <header className="pt-12 pb-2 px-6 shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={20} />
              <span className="text-xs">返回</span>
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-semibold uppercase tracking-widest ${accentText}`}>
                小工具
              </span>
              <button
                onClick={() => setVolume(v => v > 0 ? 0 : 0.7)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {volume > 0 ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">节拍器</h1>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <div className="flex justify-center pt-4 pb-2">
            <div className="relative flex flex-col items-center">
              {/* Ambient glow */}
              <div className="absolute" style={{
                width: 200,
                height: 200,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(ellipse at center, ${accentColor}15 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              <div ref={trackRef} className="relative" style={{ width: 28, height: 200 }}>
                {/* Cylinder body */}
                <div className="absolute inset-0" style={{
                  borderRadius: 14,
                  background: [
                    'linear-gradient(90deg,',
                    '  rgba(255,255,255,0.12) 0%,',
                    '  rgba(255,255,255,0.06) 25%,',
                    '  transparent 45%,',
                    '  rgba(0,0,0,0.15) 65%,',
                    '  rgba(0,0,0,0.3) 100%',
                    ')',
                    ',',
                    'linear-gradient(180deg,',
                    '  rgba(180,120,70,0.5) 0%,',
                    '  rgba(160,100,50,0.5) 40%,',
                    '  rgba(140,85,45,0.5) 60%,',
                    '  rgba(120,70,40,0.5) 100%',
                    ')',
                  ].join(''),
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
                }}>
                  {/* Top cap highlight */}
                  <div className="absolute top-0 left-0 right-0" style={{
                    height: 14,
                    borderRadius: '14px 14px 0 0',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.1), transparent)',
                  }} />
                  {/* Bottom cap shadow */}
                  <div className="absolute bottom-0 left-0 right-0" style={{
                    height: 14,
                    borderRadius: '0 0 14px 14px',
                    background: 'linear-gradient(0deg, rgba(0,0,0,0.2), transparent)',
                  }} />
                  {/* Center track line */}
                  <div className="absolute inset-x-0 top-4 bottom-4 mx-auto" style={{
                    width: 2,
                    background: `linear-gradient(180deg, transparent 0%, ${accentColor}30 20%, ${accentColor}30 80%, transparent 100%)`,
                    borderRadius: 1,
                  }} />
                  {/* Tick marks */}
                  <div className="absolute -left-1 top-6 w-3 h-px bg-white/10" />
                  <div className="absolute -right-1 top-6 w-3 h-px bg-white/10" />
                  <div className="absolute -left-1" style={{ top: '50%', width: 3, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                  <div className="absolute -right-1" style={{ top: '50%', width: 3, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                  <div className="absolute -left-1 bottom-6 w-3 h-px bg-white/10" />
                  <div className="absolute -right-1 bottom-6 w-3 h-px bg-white/10" />
                </div>

                {/* Top position indicator */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                </div>
                {/* Bottom position indicator */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                </div>

                {/* Bead */}
                <div
                  ref={beadRef}
                  className="absolute left-1/2"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    bottom: 0,
                    transform: 'translateX(-50%)',
                    background: 'radial-gradient(circle at 35% 30%, #FFE066, #FFB800 40%, #E89400 70%, #CC7700 100%)',
                    boxShadow: impactFlash
                      ? `0 0 40px ${accentColor}, 0 0 80px ${accentColor}60, inset 0 -3px 6px rgba(0,0,0,0.3), inset 0 3px 6px rgba(255,255,255,0.35)`
                      : `0 0 20px ${accentColor}60, 0 0 40px ${accentColor}30, inset 0 -3px 6px rgba(0,0,0,0.3), inset 0 3px 6px rgba(255,255,255,0.3)`,
                    transition: impactFlash ? 'none' : 'box-shadow 0.2s',
                  }}
                >
                  <div className="absolute" style={{
                    width: 16,
                    height: 10,
                    background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, transparent 70%)',
                    top: 8,
                    left: 8,
                    borderRadius: '50%',
                  }} />
                </div>
              </div>

              {/* Frequency display below cylinder */}
              <div className="mt-4 text-center">
                <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
                  {liveFreq}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">BPM</div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 space-y-4">
            {/* --- Frequency Slider --- */}
            <div className="ios-card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">频率</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFrequency(f => Math.max(10, f - 10))}
                    className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 text-sm"
                  >−</button>
                  <span className="text-sm font-semibold text-white w-12 text-center tabular-nums">{liveFreq}</span>
                  <button
                    onClick={() => setFrequency(f => Math.min(240, f + 10))}
                    className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 text-sm"
                  >+</button>
                </div>
              </div>
              <input
                type="range"
                min={10}
                max={240}
                step={1}
                value={frequency}
                onChange={e => setFrequency(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(90deg, ${accentColor}40 0%, ${accentColor} ${(frequency - 10) / 230 * 100}%, rgba(255,255,255,0.1) ${(frequency - 10) / 230 * 100}%)`,
                  WebkitAppearance: 'none',
                  outline: 'none',
                }}
                onMouseDown={() => { if (isRunning) stopAnimation(); }}
                onMouseUp={() => { if (!isRunning) startAnimation(); }}
              />
              <style>{`
                input[type=range]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: ${accentColor};
                  cursor: pointer;
                  box-shadow: 0 0 10px ${accentColor}60;
                  border: 2px solid rgba(255,255,255,0.2);
                }
                input[type=range]::-moz-range-thumb {
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: ${accentColor};
                  cursor: pointer;
                  border: 2px solid rgba(255,255,255,0.2);
                }
              `}</style>
            </div>

            {/* --- Curve Selector --- */}
            <div className="ios-card p-4">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3 block">滑动曲线</span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CURVE_CONFIG) as EasingCurve[]).map(key => (
                  <button
                    key={key}
                    onClick={() => setCurve(key)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      curve === key
                        ? 'text-white shadow-lg'
                        : 'text-gray-400 bg-white/5 hover:bg-white/10'
                    }`}
                    style={curve === key ? { background: accentColor, boxShadow: `0 0 12px ${accentColor}40` } : undefined}
                  >
                    {CURVE_CONFIG[key].label}
                  </button>
                ))}
              </div>
            </div>

            {/* --- Sound Selector + Volume --- */}
            <div className="ios-card p-4">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3 block">音效</span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(SOUND_CONFIG) as SoundType[]).map(key => (
                  <button
                    key={key}
                    onClick={() => {
                      setSoundType(key);
                      playSound(key, volume);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      soundType === key
                        ? 'text-white shadow-lg'
                        : 'text-gray-400 bg-white/5 hover:bg-white/10'
                    }`}
                    style={soundType === key ? { background: accentColor, boxShadow: `0 0 12px ${accentColor}40` } : undefined}
                  >
                    {SOUND_CONFIG[key].label}
                  </button>
                ))}
              </div>
            </div>

            {/* --- Count + Controls --- */}
            <div className="ios-card p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">计次</span>
                <button
                  onClick={handleReset}
                  className="text-gray-500 hover:text-white transition-colors"
                  title="重置计次"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-5xl font-bold text-white tabular-nums tracking-tight">
                  {count}
                </div>
                <button
                  onClick={handleToggle}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ios-btn ${
                    isRunning ? 'bg-white/10 hover:bg-white/15' : 'text-white shadow-lg'
                  }`}
                  style={!isRunning ? { background: accentColor, boxShadow: `0 0 24px ${accentColor}50` } : undefined}
                >
                  {isRunning ? (
                    <Square size={20} className="text-white fill-white" />
                  ) : (
                    <Play size={22} className="text-white ml-0.5" />
                  )}
                </button>
              </div>
            </div>

            {/* --- Plan Section --- */}
            <div className="ios-card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">频率计划</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEditPlan}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={handleTogglePlan}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      planEnabled ? accentBg : 'bg-gray-700'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      planEnabled ? 'translate-x-[18px]' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>

              {planSteps.length > 0 ? (
                <div className="space-y-1">
                  {planSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500 w-4 text-right">{i + 1}</span>
                      <div className="flex-1 h-5 rounded bg-white/5 flex items-center px-2">
                        <div className="flex items-center gap-2 w-full">
                          {step.frequency > 0 ? (
                            <>
                              <span className="text-white font-medium">{step.frequency}</span>
                              <span className="text-gray-500">BPM</span>
                            </>
                          ) : (
                            <span className="text-gray-400">⏸ 静止</span>
                          )}
                          <span className="ml-auto text-gray-500">{formatDuration(step.duration)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-gray-600">
                      合计 {formatDuration(planSteps.reduce((a, b) => a + b.duration, 0))} · 循环
                    </span>
                    {planEnabled && (
                      <span className="text-[10px] font-medium" style={{ color: accentColor }}>● 已启用</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-xs text-gray-600 mb-2">暂无计划步骤</p>
                  <button
                    onClick={handleEditPlan}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
                  >
                    创建计划
                  </button>
                </div>
              )}
            </div>

            <div className="h-4" />
          </div>
        </div>
      </div>

      {/* === Plan Editor Modal === */}
      {showPlanEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-[360px] max-h-[85vh] flex flex-col border border-gray-700 shadow-xl overflow-hidden">
            {/* Modal header */}
            <div className="shrink-0 px-5 pt-5 pb-3 border-b border-gray-800">
              <h3 className="text-white text-base font-semibold">编辑频率计划</h3>
              <p className="text-gray-500 text-xs mt-1">添加多个步骤，按顺序循环执行</p>
            </div>

            {/* Presets */}
            <div className="shrink-0 px-5 py-3 border-b border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">预置计划</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PRESET_PLANS.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => handleLoadPreset(preset.steps)}
                    className="text-xs px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Steps list */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-3 space-y-2">
              {editSteps.length === 0 ? (
                <p className="text-center text-gray-600 text-xs py-6">暂无步骤，点击下方添加</p>
              ) : (
                editSteps.map((step, i) => (
                  <div key={i} className="ios-card p-3 bg-gray-800/50 border border-gray-700/50">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 font-mono w-4">{i + 1}</span>
                      <div className="flex-1 flex items-center gap-1.5">
                        {step.frequency > 0 ? (
                          <>
                            <input
                              type="number"
                              min={0}
                              max={240}
                              value={step.frequency}
                              onChange={e => handleEditStepFreq(i, Math.max(0, Math.min(240, Number(e.target.value) || 0)))}
                              className="w-14 bg-gray-900 text-white text-xs text-center py-1 rounded border border-gray-700 focus:outline-none focus:border-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-[10px] text-gray-500">BPM</span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 px-2">⏸ 静止</span>
                        )}
                        <span className="text-gray-600 mx-1">·</span>
                        <input
                          type="number"
                          min={1}
                          max={3600}
                          value={step.duration}
                          onChange={e => handleEditStepDur(i, Math.max(1, Number(e.target.value) || 1))}
                          className="w-14 bg-gray-900 text-white text-xs text-center py-1 rounded border border-gray-700 focus:outline-none focus:border-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-[10px] text-gray-500">秒</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const prev = step.frequency > 0 ? 0 : 60;
                            handleEditStepFreq(i, prev);
                          }}
                          className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-[10px] text-gray-500"
                          title={step.frequency > 0 ? '设为静止' : '设为有声'}
                        >
                          {step.frequency > 0 ? '⏸' : '▶'}
                        </button>
                        <button
                          onClick={() => handleRemoveStep(i)}
                          className="w-6 h-6 rounded bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add button */}
            <div className="shrink-0 px-5 py-2">
              <button
                onClick={handleAddStep}
                className="w-full py-2 rounded-lg border border-dashed border-gray-700 text-gray-500 text-xs hover:border-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-1"
              >
                <Plus size={14} />
                添加步骤
              </button>
            </div>

            {/* Modal footer */}
            <div className="shrink-0 px-5 py-4 border-t border-gray-800 flex gap-3">
              <button
                onClick={() => setShowPlanEditor(false)}
                className="flex-1 py-2.5 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSavePlan}
                className={`flex-1 py-2.5 rounded-lg text-white text-sm hover:opacity-90 transition-colors ${accentBg}`}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
