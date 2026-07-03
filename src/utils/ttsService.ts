let currentAudio: HTMLAudioElement | null = null;
let currentAudioId = 0;
let speakGen = 0;

function stopCurrentAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
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
    const audio = new Audio(url);
    const audioId = ++currentAudioId;

    let completed = false;

    const finish = () => {
      if (completed) return;
      completed = true;
      if (currentAudioId !== audioId) return;
      currentAudio = null;
      onEnd?.();
    };

    currentAudio = audio;

    audio.addEventListener('ended', () => finish(), { once: true });
    audio.addEventListener('error', () => {
      if (currentAudioId !== audioId) return;
      currentAudio = null;
      onUnavailable?.();
    }, { once: true });

    try {
      await audio.play();
    } catch {
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
