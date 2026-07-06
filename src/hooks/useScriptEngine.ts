import { useState, useCallback, useRef, useEffect } from 'react';
import { Script, ScriptStep, ScriptMood, StepLogEntry } from '../types';
import { speakText as ttsSpeak, stopSpeaking } from '../utils/ttsService';

function getAudioCtx(): AudioContext {
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  return new Ctx();
}

export function useScriptEngine(script: Script | null) {
  const [chapterIndex, setChapterIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTask, setIsTask] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isChapterTransition, setIsChapterTransition] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [timerTotal, setTimerTotal] = useState(0);
  const [counterValue, setCounterValue] = useState(0);
  const [counterTarget, setCounterTarget] = useState(0);
  const [stepLog, setStepLog] = useState<StepLogEntry[]>([]);
  const [mood, setMood] = useState<ScriptMood>('sweet');
  const [narrIcon, setNarrIcon] = useState('');
  const [narrText, setNarrText] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');

  const timerRef = useRef<number | null>(null);
  const autoRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const prevTimerRemaining = useRef(0);
  const prevCounterValue = useRef(0);
  const timerIconRef = useRef('');
  const counterIconRef = useRef('');
  const stepIndexRef = useRef(stepIndex);
  const chapterIndexRef = useRef(chapterIndex);
  const advanceStepRef = useRef<() => void>(() => {});
  const playStepRef = useRef<(step: ScriptStep) => void>(() => {});
  const timerRemainingRef = useRef(0);
  const timerTotalRef = useRef(0);

  const ensureAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = getAudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const beep = useCallback((freq: number, duration: number, volume = 0.15, type: OscillatorType = 'sine') => {
    try {
      ensureAudio();
      const ctx = audioCtxRef.current!;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch { /* audio not available */ }
  }, [ensureAudio]);

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    clearTimeout(autoRef.current);
    autoRef.current = null;
    stopSpeaking();
  }, []);

  const startTimerInterval = useCallback((total: number) => {
    clearInterval(timerRef.current!);
    timerRef.current = window.setInterval(() => {
      setTimerRemaining(prev => {
        const next = prev - 1;
        timerRemainingRef.current = next;
        if (next <= 0) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        const ratio = next / total;
        if (ratio < 0.2) {
          beep(880, 0.08, 0.2);
        } else if (ratio < 0.4) {
          beep(660, 0.1, 0.12);
        } else {
          beep(440, 0.15, 0.08);
        }
        return next;
      });
    }, 1000);
  }, [beep]);

  const startMetronome = useCallback(() => {
    clearInterval(timerRef.current!);
    timerRef.current = window.setInterval(() => {
      beep(1200, 0.06, 0.08, 'square');
    }, 2000);
  }, [beep]);

  const reset = useCallback(() => {
    clearTimers();
    setChapterIndex(0);
    setStepIndex(0);
    setIsPlaying(false);
    setIsPaused(false);
    setIsTask(false);
    setIsEnding(false);
    setIsChapterTransition(false);
    setTimerRemaining(0);
    setTimerTotal(0);
    setCounterValue(0);
    setCounterTarget(0);
    setStepLog([]);
    setMood('sweet');
    setNarrIcon('');
    setNarrText('');
    setTaskTitle('');
    setTaskDesc('');
  }, [clearTimers]);

  const getCurrentStep = useCallback((): ScriptStep | null => {
    if (!script) return null;
    const ch = script.chapters[chapterIndex];
    if (!ch || stepIndex >= ch.steps.length) return null;
    return ch.steps[stepIndex];
  }, [script, chapterIndex, stepIndex]);

  const advanceStep = useCallback(() => {
    clearTimers();
    if (!script) return;

    const ci = chapterIndexRef.current;
    const si = stepIndexRef.current;
    const ch = script.chapters[ci];

    if (si + 1 >= ch.steps.length) {
      if (ci + 1 < script.chapters.length) {
        const isLastChapter = ci + 2 >= script.chapters.length;
        if (isLastChapter) {
          const nextChapter = script.chapters[ci + 1];
          setMood(nextChapter.mood);
          setChapterIndex(ci + 1);
          setStepIndex(0);
          const firstStep = nextChapter.steps[0];
          playStepRef.current(firstStep);
        } else {
          setIsChapterTransition(true);
          setIsPlaying(false);
          setIsTask(false);
          setMood(script.chapters[ci + 1].mood);
        }
      } else {
        setIsEnding(true);
        setIsPlaying(false);
        setIsTask(false);
      }
      return;
    }

    const nextStep = ch.steps[si + 1];
    setStepIndex(si + 1);
    playStepRef.current(nextStep);
  }, [script, clearTimers]);

  const startChapter = useCallback(() => {
    setIsChapterTransition(false);
    setIsPlaying(true);
    const nextChapter = chapterIndexRef.current + 1;
    if (!script || !script.chapters[nextChapter]) return;
    const firstStep = script.chapters[nextChapter].steps[0];
    setChapterIndex(nextChapter);
    setStepIndex(0);
    playStepRef.current(firstStep);
  }, [script]);

  const playStep = useCallback((step: ScriptStep) => {
    setIsPlaying(true);
    setIsPaused(false);
    setIsTask(step.type === 'timer' || step.type === 'counter');
    if (step.mood) setMood(step.mood);

    setNarrIcon(step.icon);

    if (step.type === 'narration') {
      setNarrText(step.text || '');
      setTaskTitle('');
      setTaskDesc('');
      ensureAudio();
      ttsSpeak(
        step.text || '',
        () => advanceStepRef.current(),
        () => {
          const capturedStepIndex = stepIndexRef.current;
          const capturedChapter = chapterIndexRef.current;
          const ms = step.duration || 5000;
          autoRef.current = window.setTimeout(() => {
            if (stepIndexRef.current !== capturedStepIndex || chapterIndexRef.current !== capturedChapter) return;
            advanceStepRef.current();
          }, ms);
        }
      );
    } else if (step.type === 'timer') {
      setTaskTitle(step.title || '');
      setTaskDesc(step.desc || '');
      setNarrText('');
      const total = step.duration || 10;
      timerTotalRef.current = total;
      timerRemainingRef.current = total;
      setTimerRemaining(total);
      setTimerTotal(total);

      timerIconRef.current = step.icon;
      prevTimerRemaining.current = total;
      startTimerInterval(total);
    } else if (step.type === 'counter') {
      setTaskTitle(step.title || '');
      setTaskDesc(step.desc || '');
      setNarrText('');
      setCounterValue(0);
      setCounterTarget(step.target || 5);
      counterIconRef.current = step.icon;
      prevCounterValue.current = 0;

      startMetronome();
    }
  }, [beep, startTimerInterval, startMetronome]);

  const pause = useCallback(() => {
    if (isPaused || isChapterTransition || isEnding || !isPlaying) return;
    timerRemainingRef.current = timerRemaining;
    clearTimers();
    setIsPaused(true);
    setIsPlaying(false);
  }, [isPaused, isChapterTransition, isEnding, isPlaying, timerRemaining, clearTimers]);

  const resume = useCallback(() => {
    if (!isPaused || !script) return;
    setIsPaused(false);
    setIsPlaying(true);

    const step = getCurrentStep();
    if (!step) return;

    if (step.type === 'timer') {
      const remaining = timerRemainingRef.current;
      const total = timerTotalRef.current;
      if (remaining > 0) {
        setTimerRemaining(remaining);
        startTimerInterval(total);
      } else {
        advanceStepRef.current();
      }
    } else if (step.type === 'counter') {
      startMetronome();
    } else if (step.type === 'narration') {
      playStepRef.current(step);
    }
  }, [isPaused, script, getCurrentStep, startTimerInterval, startMetronome]);

  useEffect(() => { stepIndexRef.current = stepIndex; }, [stepIndex]);
  useEffect(() => { chapterIndexRef.current = chapterIndex; }, [chapterIndex]);
  useEffect(() => { advanceStepRef.current = advanceStep; }, [advanceStep]);
  useEffect(() => { playStepRef.current = playStep; }, [playStep]);

  const handleCounterTap = useCallback(() => {
    setCounterValue(prev => prev + 1);
    beep(800, 0.08, 0.12, 'square');
  }, [beep]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  useEffect(() => {
    const prev = prevTimerRemaining.current;
    prevTimerRemaining.current = timerRemaining;
    if (prev > 0 && timerRemaining <= 0 && timerTotal > 0 && isPlaying && !isEnding && !isChapterTransition) {
      setStepLog(l => [...l, { type: 'timer', icon: timerIconRef.current, completed: true }]);
      window.setTimeout(() => advanceStep(), 600);
    }
  }, [timerRemaining, timerTotal, isPlaying, advanceStep, isEnding, isChapterTransition]);

  useEffect(() => {
    const prev = prevCounterValue.current;
    prevCounterValue.current = counterValue;
    if (prev < counterTarget && counterValue >= counterTarget && counterTarget > 0 && isPlaying && !isEnding && !isChapterTransition) {
      clearInterval(timerRef.current!);
      timerRef.current = null;
      beep(1200, 0.3, 0.2);
      setStepLog(l => [...l, { type: 'counter', icon: counterIconRef.current, count: counterValue }]);
      window.setTimeout(() => advanceStep(), 600);
    }
  }, [counterValue, counterTarget, isPlaying, advanceStep, beep, isEnding, isChapterTransition]);

  return {
    chapterIndex,
    stepIndex,
    isPlaying,
    isPaused,
    isTask,
    isEnding,
    isChapterTransition,
    timerRemaining,
    timerTotal,
    counterValue,
    counterTarget,
    stepLog,
    mood,
    narrIcon,
    narrText,
    taskTitle,
    taskDesc,
    playStep,
    advanceStep,
    startChapter,
    handleCounterTap,
    pause,
    resume,
    reset,
    getCurrentStep,
  };
}
