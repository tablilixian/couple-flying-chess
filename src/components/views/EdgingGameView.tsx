import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Play, Pause, Square, ShieldCheck, RotateCcw, Heart, Music2 } from 'lucide-react';
import { GameMode, EdgingFlow, EdgingSessionPhase, EdgingSessionRecord, EdgingLine, EdgingLineKind } from '../../types';
import { EDGING_KIND_CONFIG } from '../../data/edgingFlows';
import { MetronomePendulum } from '../MetronomePendulum';
import { getAudioContext, playSound } from '../../utils/metronomeAudio';
import { speakEdging, stopEdgingVoice, VOICE_PRESETS, primeVoice, isTtsSupported } from '../../utils/edgingVoice';
import { addEdgingSession, formatDuration, loadEdgingProfile } from '../../utils/edgingStorage';

interface EdgingGameViewProps {
  mode: GameMode;
  flow: EdgingFlow;
  onExit: () => void;
}

type RunState = 'ready' | 'running' | 'paused' | 'done' | 'safeword';

function splitTokens(text: string, pops: string[]): { text: string; pop: boolean }[] {
  if (!pops || pops.length === 0) return [{ text, pop: false }];
  const escaped = pops.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const re = new RegExp(`(${escaped})`, 'g');
  return text.split(re).filter(Boolean).map(p => ({ text: p, pop: pops.includes(p) }));
}

// 解析台词里的说话人与动作提示，如「甜甜：（轻声）来吧」→ 说话人=甜甜 / 动作=（轻声） / 内容=来吧
function parseLine(text: string): { speaker: string | null; stage: string | null; content: string } {
  const speakerMatch = text.match(/^([\u4e00-\u9fa5A-Za-z]{1,8})[：:]\s*/);
  const rest = speakerMatch ? text.slice(speakerMatch[0].length) : text;
  const stageMatch = rest.match(/^[（(][^）)]*[）)]\s*/);
  const stage = stageMatch ? stageMatch[0].trim() : null;
  const content = stageMatch ? rest.slice(stageMatch[0].length) : rest;
  return { speaker: speakerMatch ? speakerMatch[1] : null, stage, content };
}

const LINE_HOLD: Record<EdgingLineKind, number> = {
  story: 2600,
  command: 2000,
  praise: 2400,
  denial: 2300,
};
const TYPE_MS = 42;

// 中文 TTS 朗读速度约为 4 字/秒（rate=1.0），按字数估算朗读所需时长
const TTS_CHARS_PER_SEC = 4;
// 读完后再额外停留的收尾时间
const TTS_TAIL_MS = 600;

function speechMsFor(text: string, kind: EdgingLineKind): number {
  if (!text) return 0;
  const rate = VOICE_PRESETS[kind].rate;
  const sec = text.length / (TTS_CHARS_PER_SEC * rate);
  return Math.ceil(sec * 1000);
}

function renderTokens(text: string, pops: string[], charCount: number, color: string) {
  const tokens = splitTokens(text, pops);
  let used = 0;
  return tokens.map((tk, i) => {
    const shownLen = Math.max(0, Math.min(charCount - used, tk.text.length));
    used += tk.text.length;
    if (shownLen <= 0) return null;
    const shown = tk.text.slice(0, shownLen);
    if (tk.pop && shownLen === tk.text.length) {
      return (
        <span
          key={i}
          className="inline-block align-baseline font-black mx-0.5"
          style={{ fontSize: '1.5em', lineHeight: 1, color, textShadow: `0 0 18px ${color}90` }}
        >
          {shown}
        </span>
      );
    }
    return <span key={i}>{shown}</span>;
  });
}

export function EdgingGameView({ mode, flow, onExit }: EdgingGameViewProps) {
  const accentColor = mode === 'couple' ? '#FF375F' : '#0A84FF';

  const [runState, setRunState] = useState<RunState>('ready');
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseRemaining, setPhaseRemaining] = useState(0);
  const [phaseTotal, setPhaseTotal] = useState(0);
  const [pausedCount, setPausedCount] = useState(0);
  const [beatCount, setBeatCount] = useState(0);
  const [doneRecord, setDoneRecord] = useState<EdgingSessionRecord | null>(null);
  const [lineIdx, setLineIdx] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);

  const startTimeRef = useRef(0);
  const endTimeRef = useRef(0);
  const phaseEndRef = useRef(0);
  const pausedCountRef = useRef(0);
  const phaseRecordRef = useRef<EdgingSessionPhase[]>([]);
  const runStateRef = useRef<RunState>('ready');
  const lineIdxRef = useRef(0);
  const charCountRef = useRef(0);
  const prevPhaseIdxRef = useRef(0);
  const subNameRef = useRef(loadEdgingProfile().name);

  const fillName = useCallback((s: string) => s.replace(/\{name\}/g, subNameRef.current.trim() || '宝贝'), []);

  useEffect(() => {
    runStateRef.current = runState;
  }, [runState]);

  const phases = flow.phases;
  const current = phases[phaseIdx];
  const kindConfig = current ? EDGING_KIND_CONFIG[current.kind] : null;
  const phaseColor = kindConfig?.color ?? accentColor;

  const handleBeat = useCallback(() => {
    playSound('wooden-fish', 0.7);
    setBeatCount(c => c + 1);
  }, []);

  const finalize = useCallback((status: EdgingSessionRecord['status']) => {
    endTimeRef.current = Date.now();
    const record: EdgingSessionRecord = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      flowId: flow.id,
      flowName: flow.name,
      startedAt: startTimeRef.current,
      endedAt: endTimeRef.current,
      status,
      totalSeconds: Math.round((endTimeRef.current - startTimeRef.current) / 1000),
      pausedCount: pausedCountRef.current,
      phases: phaseRecordRef.current,
    };
    addEdgingSession(record);
    setDoneRecord(record);
    setRunState(status === 'completed' ? 'done' : 'safeword');
  }, [flow]);

  const startPhase = useCallback((idx: number) => {
    if (idx >= phases.length) {
      finalize('completed');
      return;
    }
    const ph = phases[idx];
    setPhaseIdx(idx);
    setPhaseRemaining(ph.duration);
    setPhaseTotal(ph.duration);
    phaseEndRef.current = Date.now() + ph.duration * 1000;
  }, [phases, finalize]);

  // Phase countdown is driven by this effect: it (re)starts whenever the
  // run state or phase changes, and stops itself via the runState dep.
  useEffect(() => {
    if (runState !== 'running' || !current) return;
    const id = window.setInterval(() => {
      const rem = Math.max(0, Math.ceil((phaseEndRef.current - Date.now()) / 1000));
      setPhaseRemaining(rem);
      if (rem <= 0) {
        const completed: EdgingSessionPhase = { ...current, completed: true };
        phaseRecordRef.current = [...phaseRecordRef.current, completed];
        startPhase(phaseIdx + 1);
      }
    }, 250);
    return () => clearInterval(id);
  }, [runState, phaseIdx, current, startPhase]);

  // 阶段切换时重置台词进度
  useEffect(() => {
    if (prevPhaseIdxRef.current !== phaseIdx) {
      prevPhaseIdxRef.current = phaseIdx;
      lineIdxRef.current = 0;
      charCountRef.current = 0;
      setLineIdx(0);
      setCharCount(0);
    }
  }, [phaseIdx]);

  // 剧本台词按序投放：旁白打字机 + 指令/寸止大字弹出 + TTS 朗读
  useEffect(() => {
    if (runState !== 'running' || !current) return;
    const script =
      current.script && current.script.length > 0
        ? current.script
        : [{ kind: 'command' as EdgingLineKind, text: current.text }];
    const startIdx = Math.min(lineIdxRef.current, script.length - 1);
    lineIdxRef.current = startIdx;
    setLineIdx(startIdx);
    setCharCount(Math.min(charCountRef.current, script[startIdx].text.length));

    const timers: number[] = [];
    let active = true;

    const show = (idx: number, reset: boolean) => {
      if (!active) return;
      const line = script[idx];
      if (!line) return;
      const text = fillName(line.text);
      const { content } = parseLine(text);
      if (reset) charCountRef.current = 0;
      setLineIdx(idx);
      if (line.kind === 'story') {
        setCharCount(charCountRef.current);
        const iv = window.setInterval(() => {
          if (!active) return;
          charCountRef.current += 1;
          if (charCountRef.current >= content.length) {
            clearInterval(iv);
            charCountRef.current = content.length;
          }
          setCharCount(charCountRef.current);
        }, TYPE_MS);
        timers.push(iv as unknown as number);
      } else {
        charCountRef.current = content.length;
        setCharCount(content.length);
        if (line.tts !== false) speakEdging(content, VOICE_PRESETS[line.kind]);
        setShakeKey(k => k + 1);
      }
      const typeMs = line.kind === 'story' ? Math.min(content.length, 60) * TYPE_MS : 0;
      const isSpoken = line.kind !== 'story' && line.tts !== false;
      const speakMs = isSpoken && isTtsSupported() ? speechMsFor(content, line.kind) : 0;
      const totalMs = typeMs + Math.max(LINE_HOLD[line.kind], speakMs + TTS_TAIL_MS);
      const t = window.setTimeout(() => {
        if (!active) return;
        const next = idx + 1;
        if (next < script.length) {
          lineIdxRef.current = next;
          show(next, true);
        }
      }, totalMs);
      timers.push(t);
    };

    show(startIdx, false);

    return () => {
      active = false;
      timers.forEach(t => {
        clearTimeout(t);
        clearInterval(t);
      });
      stopEdgingVoice();
    };
  }, [runState, phaseIdx, current, fillName]);

  const handleStart = () => {
    getAudioContext();
    primeVoice();
    startTimeRef.current = Date.now();
    phaseRecordRef.current = [];
    pausedCountRef.current = 0;
    setPausedCount(0);
    setBeatCount(0);
    lineIdxRef.current = 0;
    charCountRef.current = 0;
    setLineIdx(0);
    setCharCount(0);
    startPhase(0);
    setRunState('running');
  };

  const handlePause = useCallback(() => {
    if (runStateRef.current !== 'running') return;
    pausedCountRef.current += 1;
    setPausedCount(pausedCountRef.current);
    setRunState('paused');
  }, []);

  const handleResume = () => {
    if (runStateRef.current !== 'paused' || !current) return;
    phaseEndRef.current = Date.now() + phaseRemaining * 1000;
    setRunState('running');
  };

  const handleAbandon = () => {
    if (!confirm('确定要放弃本次流程吗？\n进度将如实记录为「中途放弃」。')) return;
    finalize('abandoned');
  };

  const handleSafeWord = () => {
    finalize('safeword');
  };

  // Auto-pause when tab hidden
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && runStateRef.current === 'running') {
        handlePause();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [handlePause]);

  const phaseProgress = phaseTotal > 0 ? 1 - phaseRemaining / phaseTotal : 0;
  const pendulumRunning = runState === 'running' && (current?.bpm ?? 0) > 0;

  const script: EdgingLine[] =
    current && current.script && current.script.length > 0
      ? current.script
      : current
        ? [{ kind: 'command', text: current.text }]
        : [];
  const line = script[lineIdx] ?? null;
  const lineText = line ? fillName(line.text) : '';
  const parsedLine = line ? parseLine(lineText) : { speaker: null, stage: null, content: '' };
  const linePops = line ? (line.pop ?? []).map(fillName) : [];
  const KIND_TEXT_CLASS: Record<EdgingLineKind, string> = {
    story: 'text-lg leading-relaxed font-normal',
    command: 'text-2xl font-bold tracking-wide',
    praise: 'text-2xl font-bold tracking-wide',
    denial: 'text-2xl font-bold tracking-wide',
  };
  const lineBaseColor = !line
    ? '#fff'
    : line.kind === 'story'
      ? 'rgba(255,255,255,0.92)'
      : line.kind === 'command'
        ? '#fff'
        : phaseColor;

  // === Ready screen ===
  if (runState === 'ready') {
    return (
      <div className="h-screen w-screen overflow-hidden flex justify-center bg-black">
        <div className="relative z-10 w-full max-w-[430px] h-full flex flex-col bg-[#0d0d1a]">
          <header className="pt-12 pb-2 px-6 shrink-0 flex items-center justify-between">
            <button onClick={onExit} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft size={20} />
              <span className="text-xs">返回</span>
            </button>
          </header>
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 pb-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{flow.emoji}</div>
              <h1 className="text-2xl font-bold text-white">{flow.name}</h1>
              <p className="text-sm text-gray-500 mt-1">{flow.desc}</p>
              <p className="text-xs text-gray-600 mt-2">
                {phases.length} 个阶段 · 约 {formatDuration(phases.reduce((a, p) => a + p.duration, 0))}
              </p>
            </div>

            <div className="ios-card p-4 mb-4">
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">流程预览</div>
              <div className="space-y-1.5">
                {phases.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 w-4 text-right">{i + 1}</span>
                    <span className="text-[11px] font-medium truncate" style={{ color: EDGING_KIND_CONFIG[p.kind].color }}>
                      {p.title ?? EDGING_KIND_CONFIG[p.kind].label}
                    </span>
                    <span className="text-gray-600 w-14 tabular-nums">{p.bpm > 0 ? `${p.bpm}BPM` : '静止'}</span>
                    <span className="text-gray-600 tabular-nums">{formatDuration(p.duration)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ios-card p-4 mb-6">
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <ShieldCheck size={14} className="text-green-400 shrink-0 mt-0.5" />
                <span>全程随时可「暂停」「放弃」，遇到不适请立即使用「安全词」终止。</span>
              </div>
            </div>

            <button
              onClick={handleStart}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-semibold shadow-lg"
              style={{ background: accentColor, boxShadow: `0 0 30px ${accentColor}50` }}
            >
              <Play size={20} className="fill-white" />
              开始流程
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === Done / Safeword screens ===
  if (runState === 'done' || runState === 'safeword') {
    const doneTotal = doneRecord?.phases.length ?? 0;
    return (
      <div className="h-screen w-screen overflow-hidden flex justify-center bg-black">
        <div className="relative z-10 w-full max-w-[430px] h-full flex flex-col bg-[#0d0d1a] items-center justify-center px-8">
          <div className="text-6xl mb-4">{runState === 'done' ? '🎉' : '🛡️'}</div>
          <h1 className="text-2xl font-bold text-white text-center">
            {runState === 'done' ? '流程完成' : '安全词生效'}
          </h1>
          <p className="text-sm text-gray-500 text-center mt-2 mb-6">
            {runState === 'done'
              ? '今晚的节奏之旅到这里，好好享受这份成就感'
              : '已经立刻停下，深呼吸。任何时候不舒服都可以叫停，这很棒。'}
          </p>

          {runState === 'done' && doneRecord && (
            <div className="w-full ios-card p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">完成阶段</span>
                <span className="text-white">{doneTotal} / {phases.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">总时长</span>
                <span className="text-white">{formatDuration(doneRecord.totalSeconds)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">暂停次数</span>
                <span className="text-white">{doneRecord.pausedCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">节拍数</span>
                <span className="text-white">{beatCount}</span>
              </div>
            </div>
          )}

          {runState === 'safeword' && (
            <div className="w-full ios-card p-4 mb-6 flex items-center gap-3">
              <Heart size={18} className="text-pink-400 shrink-0" />
              <span className="text-sm text-gray-400">使用安全词不代表失败，照顾自己永远是第一位的。</span>
            </div>
          )}

          <div className="w-full flex gap-3">
            {runState === 'done' && (
              <button
                onClick={handleStart}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-white/10 text-white text-sm hover:bg-white/15 transition-colors"
              >
                <RotateCcw size={15} /> 再来一次
              </button>
            )}
            <button
              onClick={onExit}
              className="flex-1 py-3 rounded-xl text-white text-sm"
              style={{ background: accentColor }}
            >
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === Running / Paused ===
  return (
    <div className="h-screen w-screen overflow-hidden flex justify-center bg-black">
      <div className="relative z-10 w-full max-w-[430px] h-full flex flex-col bg-[#0d0d1a]">
        {/* Ambient glow */}
        <div className="absolute inset-x-0 top-0 h-64 pointer-events-none transition-colors duration-700" style={{
          background: `radial-gradient(ellipse at 50% 0%, ${phaseColor}1c 0%, transparent 70%)`,
        }} />

        <header className="pt-12 pb-2 px-6 shrink-0 relative z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={() => { if (runState === 'paused') onExit(); else handleAbandon(); }}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={20} />
              <span className="text-xs">退出</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500">
                {phaseIdx + 1} / {phases.length} 阶段
              </span>
              <button
                onClick={handleSafeWord}
                className="text-xs text-red-400 border border-red-400/40 hover:bg-red-400/10 px-3 py-1 rounded-full transition-colors"
              >
                安全词
              </button>
            </div>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">{flow.name}</h1>

          {/* Phase strip */}
          <div className="flex gap-1 mt-3">
            {phases.map((p, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-all duration-300"
                style={{
                  background: i < phaseIdx
                    ? EDGING_KIND_CONFIG[p.kind].color
                    : i === phaseIdx
                      ? `${EDGING_KIND_CONFIG[p.kind].color}cc`
                      : 'rgba(255,255,255,0.08)',
                  boxShadow: i === phaseIdx ? `0 0 8px ${EDGING_KIND_CONFIG[p.kind].color}60` : 'none',
                }}
              />
            ))}
          </div>
        </header>

        <main className="flex-1 min-h-0 flex flex-col items-center justify-center px-8 relative z-10">
          {/* Kind label */}
          {kindConfig && (
            <div
              className="text-xs font-semibold uppercase tracking-[0.3em] mb-1 transition-colors duration-700"
              style={{ color: phaseColor }}
            >
              {current?.title ?? `${kindConfig.label} · ${kindConfig.desc}`}
            </div>
          )}

          {/* BPM */}
          <div className="text-3xl font-bold text-white tabular-nums leading-none mb-4">
            {current && current.bpm > 0 ? current.bpm : '—'}
            {current && current.bpm > 0 && <span className="text-sm text-gray-500 ml-1.5">BPM</span>}
          </div>

          {/* Pendulum */}
          <div className="my-2">
            <MetronomePendulum
              bpm={runState === 'running' ? (current?.bpm ?? 0) : 0}
              running={pendulumRunning}
              accentColor={phaseColor}
              curve="sine"
              effect="pulse"
              onBeat={handleBeat}
              height={190}
            />
          </div>

          {/* Script line */}
          {line && (
            <div
              key={`l${lineIdx}-${shakeKey}`}
              className={`text-center mt-4 min-h-[110px] max-w-[340px] flex flex-col items-center justify-center gap-1.5 ${KIND_TEXT_CLASS[line.kind]} ${line.kind === 'story' ? 'animate-fadeIn' : 'animate-shake'}`}
              style={{ color: lineBaseColor, textShadow: `0 0 30px ${phaseColor}30` }}
            >
              {parsedLine.speaker && (
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.25em] px-2 py-0.5 rounded-full"
                  style={{ color: phaseColor, border: `1px solid ${phaseColor}55`, background: `${phaseColor}14` }}
                >
                  {parsedLine.speaker}
                </span>
              )}
              {parsedLine.stage && <span className="text-[11px] text-gray-500 italic">{parsedLine.stage}</span>}
              <div>{renderTokens(parsedLine.content, linePops, charCount, phaseColor)}</div>
            </div>
          )}

          {/* Countdown */}
          <div className="flex items-end gap-2 mt-6">
            <span className="text-4xl font-bold text-white tabular-nums leading-none">
              {String(Math.floor(phaseRemaining / 60)).padStart(2, '0')}:{String(phaseRemaining % 60).padStart(2, '0')}
            </span>
            {runState === 'paused' && <span className="text-xs text-gray-500 mb-1">已暂停</span>}
          </div>

          {/* Phase progress */}
          <div className="w-full max-w-[260px] h-1 bg-white/10 rounded-full overflow-hidden mt-3 transition-colors duration-700" style={{ boxShadow: `0 0 12px ${phaseColor}20` }}>
            <div className="h-full rounded-full transition-all duration-250" style={{ width: `${phaseProgress * 100}%`, background: phaseColor }} />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-5 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><Music2 size={11} /> 节拍 {beatCount}</span>
            <span>暂停 {pausedCount} 次</span>
          </div>
        </main>

        {/* Controls */}
        <div className="shrink-0 px-6 pb-10 flex items-center justify-center gap-6 relative z-10">
          {runState === 'running' ? (
            <button
              onClick={handlePause}
              className="w-16 h-16 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all"
            >
              <Pause size={22} className="fill-white" />
            </button>
          ) : (
            <button
              onClick={handleResume}
              className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all"
              style={{ background: accentColor, boxShadow: `0 0 24px ${accentColor}50` }}
            >
              <Play size={22} className="fill-white ml-0.5" />
            </button>
          )}
          {runState === 'running' && (
            <button
              onClick={handleAbandon}
              className="w-16 h-16 rounded-full flex items-center justify-center text-red-400 bg-white/5 hover:bg-red-400/10 border border-red-400/30 transition-all"
              title="放弃流程"
            >
              <Square size={20} className="fill-current" />
            </button>
          )}
        </div>

        {runState === 'paused' && (
          <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="text-sm text-gray-400 mb-4">已暂停 · 深呼吸，准备好再继续</div>
            <div className="flex gap-3">
              <button
                onClick={handleResume}
                className="px-6 py-3 rounded-xl text-white text-sm"
                style={{ background: accentColor }}
              >
                继续
              </button>
              <button
                onClick={handleAbandon}
                className="px-6 py-3 rounded-xl bg-white/10 text-gray-300 text-sm hover:bg-white/15"
              >
                放弃
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
