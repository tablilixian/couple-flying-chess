// === Metronome Audio Engine (shared) ===

export type SoundType =
  | 'wooden-fish' | 'drum' | 'bell' | 'click'
  | 'singing-bowl' | 'tick' | 'cat' | 'laser' | 'boing' | 'coin' | 'drop';

export const SOUND_CONFIG: Record<SoundType, { label: string }> = {
  'wooden-fish': { label: '木鱼' },
  'drum': { label: '鼓' },
  'bell': { label: '铃铛' },
  'click': { label: '嗒嗒' },
  'singing-bowl': { label: '颂钵' },
  'tick': { label: '机械' },
  'cat': { label: '猫叫' },
  'laser': { label: '激光' },
  'boing': { label: '弹簧' },
  'coin': { label: '硬币' },
  'drop': { label: '水滴' },
};

// 单例 AudioContext：节拍器页与调教节奏页共用，跨视图复用同一实例。
// 不要在单个视图卸载时 close —— 那会连带打断另一个视图的音频。
// 需要释放时调用 suspendAudioContext()，它只是挂起，不会销毁实例。
let audioCtx: AudioContext | null = null;
let reverbNode: ConvolverNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as typeof AudioContext);
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/** 挂起共享音频上下文（释放音频硬件占用，实例仍可复用） */
export function suspendAudioContext(): void {
  if (audioCtx && audioCtx.state === 'running') {
    void audioCtx.suspend().catch(() => { /* 忽略 */ });
  }
}

// Shared impulse-response reverb so every sound has a little "room"
function getReverb(ctx: AudioContext): ConvolverNode {
  if (reverbNode) return reverbNode;
  const len = Math.floor(ctx.sampleRate * 0.25);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  conv.connect(ctx.destination);
  reverbNode = conv;
  return conv;
}

// Short white-noise burst, the key to a realistic percussion "attack"
function playNoise(ctx: AudioContext, t: number, dur: number, vol: number, freq: number, q: number) {
  if (!noiseBuffer) {
    const len = Math.floor(ctx.sampleRate * 1);
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(bp).connect(g).connect(ctx.destination);
  src.start(t);
  src.stop(t + dur);
}

// Helper: a single decaying sine partial with optional reverb send
function tone(ctx: AudioContext, t: number, freq: number, vol: number, dur: number, reverb = 0) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g).connect(ctx.destination);
  if (reverb > 0) {
    const rs = ctx.createGain();
    rs.gain.value = reverb;
    g.connect(rs).connect(getReverb(ctx));
  }
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function playWoodenFish(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  const v = vol * 0.6;
  // Woody "tok": band-passed noise click + short pitched body
  playNoise(ctx, t, 0.04, v * 0.5, 900, 6);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(420, t);
  osc.frequency.exponentialRampToValueAtTime(180, t + 0.05);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.2);
}

function playDrum(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  const v = vol * 0.7;
  // Real kick: noise transient + pitched body dropping fast
  playNoise(ctx, t, 0.03, v * 0.4, 200, 1);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.3);
}

function playBell(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  const v = vol * 0.5;
  // Inharmonic partials => metallic bell timbre
  tone(ctx, t, 880, v, 1.1, 0.25);
  tone(ctx, t, 880 * 2.76, v * 0.4, 0.8, 0.25);
  tone(ctx, t, 880 * 5.4, v * 0.2, 0.5, 0.25);
}

function playClick(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  const v = vol * 0.5;
  // Mechanical metronome "tick": very short band-passed noise
  playNoise(ctx, t, 0.025, v * 0.8, 2500, 3);
}

// New: singing bowl — pure fundamental + long shimmer tail, great for meditation
function playSingingBowl(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  const v = vol * 0.5;
  tone(ctx, t, 220, v, 2.4, 0.5);
  tone(ctx, t + 0.01, 220 * 2.01, v * 0.35, 2.0, 0.5);
  tone(ctx, t + 0.02, 220 * 3.47, v * 0.18, 1.6, 0.5);
}

// New: mechanical tick (wood-block style) alternative
function playTick(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  const v = vol * 0.5;
  playNoise(ctx, t, 0.02, v * 0.9, 1600, 8);
  tone(ctx, t, 320, v * 0.4, 0.06, 0);
}

// --- Fun / novelty sounds ---

// Cat meow: pitch glides up then down with vibrato
function playCat(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  const v = vol * 0.4;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(520, t);
  osc.frequency.linearRampToValueAtTime(900, t + 0.12);
  osc.frequency.linearRampToValueAtTime(480, t + 0.3);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2000;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + 0.04);
  g.gain.setValueAtTime(v, t + 0.22);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
  osc.connect(lp).connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.36);
}

// Laser zap: fast downward sweep square/saw
function playLaser(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  const v = vol * 0.35;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(1800, t);
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.18);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.22);
}

// Boing: pitch wobbles (sine sweep with vibrato) – cartoon spring
function playBoing(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  const v = vol * 0.4;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.08);
  osc.frequency.exponentialRampToValueAtTime(220, t + 0.22);
  const lfo = ctx.createOscillator();
  const lfoG = ctx.createGain();
  lfo.frequency.value = 18;
  lfoG.gain.value = 40;
  lfo.connect(lfoG).connect(osc.frequency);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  osc.connect(g).connect(ctx.destination);
  lfo.start(t);
  osc.start(t);
  osc.stop(t + 0.3);
  lfo.stop(t + 0.3);
}

// Coin: two quick square blips (classic retro pickup)
function playCoin(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  const v = vol * 0.4;
  const b1 = (f: number, start: number, d: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(f, t + start);
    g.gain.setValueAtTime(v, t + start);
    g.gain.exponentialRampToValueAtTime(0.001, t + start + d);
    o.connect(g).connect(ctx.destination);
    o.start(t + start);
    o.stop(t + start + d);
  };
  b1(988, 0, 0.08);
  b1(1319, 0.08, 0.18);
}

// Water drop: pitch-up blip with a little reverb tail
function playDrop(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  const v = vol * 0.5;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(700, t);
  osc.frequency.exponentialRampToValueAtTime(1400, t + 0.08);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  osc.connect(g);
  g.connect(ctx.destination);
  const rs = ctx.createGain();
  rs.gain.value = 0.3;
  g.connect(rs).connect(getReverb(ctx));
  osc.start(t);
  osc.stop(t + 0.2);
}

export function playSound(type: SoundType, volume: number) {
  if (volume <= 0) return;
  try {
    const ctx = getAudioContext();
    switch (type) {
      case 'wooden-fish': playWoodenFish(ctx, volume); break;
      case 'drum': playDrum(ctx, volume); break;
      case 'bell': playBell(ctx, volume); break;
      case 'click': playClick(ctx, volume); break;
      case 'singing-bowl': playSingingBowl(ctx, volume); break;
      case 'tick': playTick(ctx, volume); break;
      case 'cat': playCat(ctx, volume); break;
      case 'laser': playLaser(ctx, volume); break;
      case 'boing': playBoing(ctx, volume); break;
      case 'coin': playCoin(ctx, volume); break;
      case 'drop': playDrop(ctx, volume); break;
    }
  } catch {
    // Audio context not available
  }
}
