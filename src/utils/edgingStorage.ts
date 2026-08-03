import { EdgingFlow, EdgingSessionRecord } from '../types';

const FLOWS_KEY = 'edging-flows';
const SESSIONS_KEY = 'edging-sessions';
const PROFILE_KEY = 'edging-profile';

export interface EdgingProfile {
  name: string;
}

export function loadEdgingProfile(): EdgingProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { name: '' };
    const parsed = JSON.parse(raw) as Partial<EdgingProfile>;
    return { name: typeof parsed.name === 'string' ? parsed.name : '' };
  } catch {
    return { name: '' };
  }
}

export function saveEdgingProfile(profile: EdgingProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // storage full / unavailable
  }
}

export function loadCustomFlows(): EdgingFlow[] {
  try {
    const raw = localStorage.getItem(FLOWS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as EdgingFlow[] : [];
  } catch {
    return [];
  }
}

export function saveCustomFlows(flows: EdgingFlow[]) {
  try {
    localStorage.setItem(FLOWS_KEY, JSON.stringify(flows));
  } catch {
    // storage full / unavailable
  }
}

export function loadEdgingSessions(): EdgingSessionRecord[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as EdgingSessionRecord[] : [];
  } catch {
    return [];
  }
}

export function addEdgingSession(record: EdgingSessionRecord) {
  const sessions = loadEdgingSessions();
  sessions.unshift(record);
  const trimmed = sessions.slice(0, 50);
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed));
  } catch {
    // storage full / unavailable
  }
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return rest > 0 ? `${m}m${rest}s` : `${m}m`;
}
