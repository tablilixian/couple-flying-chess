import { EdgingLineKind } from '../types';

// === TTS 语音调教 (Web Speech API) ===
// 只用 speechSynthesis 系统中文语音，零资源成本。
// 台词只在「指令/赞许/羞辱」时朗读；旁白留白给用户脑补画面。

export interface VoiceOptions {
  pitch: number;
  rate: number;
}

export const VOICE_PRESETS: Record<EdgingLineKind, VoiceOptions> = {
  story:   { pitch: 1.0, rate: 1.0 },
  command: { pitch: 1.0, rate: 0.98 },
  praise:  { pitch: 1.18, rate: 0.94 },
  denial:  { pitch: 0.85, rate: 0.82 },
};

let cachedVoice: SpeechSynthesisVoice | null = null;

function isSupported(): boolean {
  try {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  } catch {
    return false;
  }
}

export function isTtsSupported(): boolean {
  return isSupported();
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (!isSupported()) return null;
  if (cachedVoice) return cachedVoice;
  try {
    const voices = window.speechSynthesis.getVoices();
    const zh = voices.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith('zh'));
    const female =
      zh.find(v => /female|female|xiaoxiao|xiaoyi|tingting|yaoyao|meijia|sinji|huihui/i.test(v.name)) ??
      zh.find(v => /女/i.test(v.name)) ??
      null;
    cachedVoice = female ?? zh[0] ?? voices[0] ?? null;
  } catch {
    cachedVoice = null;
  }
  return cachedVoice;
}

// getVoices() 在部分浏览器首帧为空，监听 voiceschanged 补缓存
if (isSupported()) {
  try {
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoice = null;
      pickVoice();
    };
  } catch {
    // ignore
  }
}

export function speakEdging(text: string, opts?: Partial<VoiceOptions>) {
  if (!isSupported() || !text.trim()) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'zh-CN';
    const voice = pickVoice();
    if (voice) utter.voice = voice;
    utter.pitch = opts?.pitch ?? 1;
    utter.rate = opts?.rate ?? 1;
    synth.speak(utter);
  } catch {
    // 语音不可用则静默跳过
  }
}

// 在用户点击开始时预热语音通道（iOS 需要用户手势授权）
export function primeVoice() {
  if (!isSupported()) return;
  try {
    const synth = window.speechSynthesis;
    synth.resume();
    const utter = new SpeechSynthesisUtterance('');
    utter.volume = 0;
    const voice = pickVoice();
    if (voice) utter.voice = voice;
    utter.lang = 'zh-CN';
    synth.speak(utter);
  } catch {
    // ignore
  }
}

export function stopEdgingVoice() {
  if (!isSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}
