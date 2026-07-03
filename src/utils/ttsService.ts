let currentAudio: HTMLAudioElement | null = null;
let currentAudioId = 0;
let speakGen = 0;
let currentObjectUrl: string | null = null;

const CACHE_NAME = 'tts-audio-cache';

function stopCurrentAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
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

async function getCachedPlayUrl(url: string): Promise<string> {
  if (!('caches' in window)) return url;
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url);
    if (cached) {
      return URL.createObjectURL(await cached.blob());
    }
    const response = await fetch(url);
    if (!response.ok) return url;
    const cacheClone = response.clone();
    await cache.put(url, cacheClone);
    return URL.createObjectURL(await response.blob());
  } catch {
    return url;
  }
}

export async function clearAudioCache(): Promise<void> {
  stopCurrentAudio();
  if ('caches' in window) {
    try {
      await caches.delete(CACHE_NAME);
    } catch { /* ignore */ }
  }
}

export async function speakText(
  text: string,
  onEnd?: () => void,
  onUnavailable?: () => void
): Promise<void> {
  const gen = ++speakGen;

  stopCurrentAudio();

  if (!text) {
    onEnd?.();
    return;
  }

  const manifest = await ensureManifest();

  if (gen !== speakGen) return;

  const filename = manifest.get(text);

  if (filename) {
    const url = getAudioUrl(filename);
    const playUrl = await getCachedPlayUrl(url);
    if (gen !== speakGen) {
      if (playUrl !== url) URL.revokeObjectURL(playUrl);
      return;
    }
    if (playUrl !== url) {
      currentObjectUrl = playUrl;
    }
    const audio = new Audio(playUrl);
    const audioId = ++currentAudioId;

    let completed = false;

    const cleanupUrl = () => {
      if (playUrl !== url) {
        URL.revokeObjectURL(playUrl);
        if (currentObjectUrl === playUrl) currentObjectUrl = null;
      }
    };

    const finish = () => {
      if (completed) return;
      completed = true;
      cleanupUrl();
      if (currentAudioId !== audioId) return;
      currentAudio = null;
      onEnd?.();
    };

    currentAudio = audio;

    audio.addEventListener('ended', finish, { once: true });
    audio.addEventListener('error', () => {
      cleanupUrl();
      if (currentAudioId !== audioId) return;
      currentAudio = null;
      onUnavailable?.();
    }, { once: true });

    try {
      await audio.play();
    } catch {
      cleanupUrl();
      if (currentAudioId !== audioId) return;
      currentAudio = null;
      onUnavailable?.();
    }
  } else {
    onUnavailable?.();
  }
}

export function stopSpeaking(): void {
  speakGen++;
  stopCurrentAudio();
}
