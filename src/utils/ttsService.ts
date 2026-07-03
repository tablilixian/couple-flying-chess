export interface TTSConfig {
  voice: string;
  rate: number;
  pitch: number;
}

const DEFAULT_CONFIG: TTSConfig = {
  voice: 'zh-CN-XiaoxiaoNeural',
  rate: 0,
  pitch: 0,
};

let currentConfig: TTSConfig = { ...DEFAULT_CONFIG };

export function setTTSConfig(config: Partial<TTSConfig>) {
  currentConfig = { ...currentConfig, ...config };
}

export function getTTSConfig(): TTSConfig {
  return { ...currentConfig };
}

let currentAudio: HTMLAudioElement | null = null;
let speakGen = 0;

function stopCurrentAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
}

let manifestMap: Map<string, string> | null = null;
let manifestPromise: Promise<void> | null = null;

function audioUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${path.replace(/^\//, '')}`;
}

async function ensureManifest(): Promise<Map<string, string>> {
  if (manifestMap) return manifestMap;
  if (!manifestPromise) {
    manifestPromise = (async () => {
      try {
        const res = await fetch(audioUrl('audio/manifest.json'));
        if (!res.ok) throw new Error('manifest not found');
        const data: Array<{ text: string; file: string }> = await res.json();
        const map = new Map<string, string>();
        for (const entry of data) {
          map.set(entry.text, entry.file);
        }
        manifestMap = map;
      } catch {
        manifestMap = new Map();
      }
    })();
  }
  await manifestPromise;
  return manifestMap!;
}

function getAudioUrl(filename: string): string {
  return audioUrl(`audio/${filename}`);
}

export async function speakText(
  text: string,
  onEnd?: () => void,
  onError?: (err: string) => void
): Promise<void> {
  const gen = ++speakGen;

  stopCurrentAudio();

  if (!text) {
    onEnd?.();
    return;
  }

  const manifest = await ensureManifest();

  if (gen !== speakGen) return;

  stopCurrentAudio();

  const filename = manifest.get(text);

  if (filename) {
    const url = getAudioUrl(filename);
    const audio = new Audio(url);

    let completed = false;

    const finish = (fallback = false) => {
      if (completed) return;
      completed = true;
      stopCurrentAudio();
      if (fallback) {
        speakBrowserFallback(text, onEnd, onError);
      } else {
        onEnd?.();
      }
    };

    currentAudio = audio;

    audio.addEventListener('ended', () => finish(false), { once: true });
    audio.addEventListener('error', () => finish(true), { once: true });

    try {
      await audio.play();
    } catch {
      finish(true);
    }
  } else {
    speakBrowserFallback(text, onEnd, onError);
  }
}

function speakBrowserFallback(
  text: string,
  onEnd?: () => void,
  onError?: (err: string) => void
): void {
  try {
    const plain = text.replace(/<br\s*\/?>/gi, '，').replace(/<[^>]*>/g, '');
    if (!('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => {
      onError?.('浏览器语音合成失败');
      onEnd?.();
    };
    window.speechSynthesis.speak(utterance);
  } catch {
    onEnd?.();
  }
}

export function stopSpeaking(): void {
  speakGen++;
  stopCurrentAudio();
  try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
}
