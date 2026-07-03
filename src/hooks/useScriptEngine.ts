import { useState, useCallback, useRef, useEffect } from 'react';
import { Script, ScriptStep, ScriptMood, StepLogEntry } from '../types';
import { speakText as ttsSpeak, stopSpeaking } from '../utils/ttsService';

function getAudioCtx(): AudioContext {
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new Ctx();
  return ctx;
}

export function useScriptEngine(script: Script | null) {
  const [chapterIndex, setChapterIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
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
    if (autoRef.current !== null) {
      clearTimeout(autoRef.current);
      autoRef.current = null;
    }
    stopSpeaking();
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setChapterIndex(0);
    setStepIndex(0);
    setIsPlaying(false);
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

    const ch = script.chapters[chapterIndex];
    if (stepIndex + 1 >= ch.steps.length) {
      if (chapterIndex + 1 < script.chapters.length) {
        setIsChapterTransition(true);
        setIsPlaying(false);
        setIsTask(false);
        setMood(script.chapters[chapterIndex + 1].mood);
      } else {
        setIsEnding(true);
        setIsPlaying(false);
        setIsTask(false);
      }
      return;
    }

    setStepIndex(prev => prev + 1);
  }, [script, chapterIndex, stepIndex, clearTimers]);

  const startChapter = useCallback(() => {
    setIsChapterTransition(false);
    setIsPlaying(true);
    setChapterIndex(prev => prev + 1);
    setStepIndex(0);
  }, []);

  const playStep = useCallback((step: ScriptStep) => {
    setIsPlaying(true);
    setIsTask(step.type === 'timer' || step.type === 'counter');
    if (step.mood) setMood(step.mood);

    setNarrIcon(step.icon);

    if (step.type === 'narration') {
      setNarrText(step.text || '');
      setTaskTitle('');
      setTaskDesc('');
      ensureAudio();
      ttsSpeak(step.text || '', () => advanceStep(), () => advanceStep());
    } else if (step.type === 'timer') {
      setTaskTitle(step.title || '');
      setTaskDesc(step.desc || '');
      setNarrText('');
      const total = step.duration || 10;
      setTimerRemaining(total);
      setTimerTotal(total);

      timerIconRef.current = step.icon;
      prevTimerRemaining.current = total;
      timerRef.current = window.setInterval(() => {
        setTimerRemaining(prev => {
          const next = prev - 1;
          if (next <= 0) {
            if (timerRef.current !== null) clearInterval(timerRef.current);
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
    } else if (step.type === 'counter') {
      setTaskTitle(step.title || '');
      setTaskDesc(step.desc || '');
      setNarrText('');
      setCounterValue(0);
      setCounterTarget(step.target || 5);
      counterIconRef.current = step.icon;
      prevCounterValue.current = 0;

      if (timerRef.current !== null) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        beep(1200, 0.06, 0.08, 'square');
      }, 2000);
    }
  }, [advanceStep, beep]);

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
  }, [timerRemaining, timerTotal, isPlaying, advanceStep, getCurrentStep, isEnding, isChapterTransition]);

  useEffect(() => {
    const prev = prevCounterValue.current;
    prevCounterValue.current = counterValue;
    if (prev < counterTarget && counterValue >= counterTarget && counterTarget > 0 && isPlaying && !isEnding && !isChapterTransition) {
      if (timerRef.current !== null) clearInterval(timerRef.current);
      timerRef.current = null;
      beep(1200, 0.3, 0.2);
      setStepLog(l => [...l, { type: 'counter', icon: counterIconRef.current, count: counterValue }]);
      window.setTimeout(() => advanceStep(), 600);
    }
  }, [counterValue, counterTarget, isPlaying, advanceStep, beep, getCurrentStep, isEnding, isChapterTransition]);

  return {
    chapterIndex,
    stepIndex,
    isPlaying,
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
    reset,
    getCurrentStep,
  };
}
