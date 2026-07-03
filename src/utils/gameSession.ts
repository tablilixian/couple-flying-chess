import { GameMode } from '../types';
import { loadFromStorage, saveToStorage, removeFromStorage } from './localStorage';

export interface TaskHistoryEntry {
  id: string;
  timestamp: number;
  resolvedAt: number;
  duration: number;
  round: number;
  executorName: string;
  task: string;
  completed: boolean;
  type: string;
}

export interface SessionPlayer {
  id: number;
  name: string;
  themeName: string;
}

export interface GameSession {
  id: string;
  startTime: number;
  endTime: number;
  mode: GameMode;
  players: [SessionPlayer, SessionPlayer];
  entries: TaskHistoryEntry[];
}

export interface SessionSummary {
  id: string;
  date: number;
  players: [string, string];
  themes: [string, string];
  totalTasks: number;
  completed: number;
  rejected: number;
  totalDuration: number;
  mode: GameMode;
}

const STORAGE_KEY = 'game-sessions';
const PENDING_KEY = 'pending-session';
const MAX_SESSIONS = 50;

export function loadSessions(): GameSession[] {
  const sessions = loadFromStorage<GameSession[]>(STORAGE_KEY, []);
  const pending = loadFromStorage<GameSession | null>(PENDING_KEY, null);
  if (pending && pending.entries.length > 0) {
    sessions.unshift(pending);
  }
  return sessions;
}

function saveSessions(sessions: GameSession[]): void {
  saveToStorage(STORAGE_KEY, sessions);
}

export function createSession(
  mode: GameMode,
  players: { id: number; name: string; themeName: string }[]
): GameSession {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    startTime: Date.now(),
    endTime: 0,
    mode,
    players: [players[0], players[1]],
    entries: [],
  };
}

let currentSession: GameSession | null = null;

export function startNewSession(
  mode: GameMode,
  players: { id: number; name: string; themeName: string }[]
): GameSession {
  currentSession = createSession(mode, players);
  return currentSession;
}

export function getCurrentSession(): GameSession | null {
  return currentSession;
}

export function addEntryToCurrentSession(entry: TaskHistoryEntry): void {
  if (!currentSession) return;
  currentSession.entries.push(entry);
  saveToStorage(PENDING_KEY, currentSession);
}

export function finalizeCurrentSession(): void {
  if (!currentSession) return;
  currentSession.endTime = Date.now();
  removeFromStorage(PENDING_KEY);

  const sessions = loadFromStorage<GameSession[]>(STORAGE_KEY, []);
  sessions.unshift(currentSession);
  if (sessions.length > MAX_SESSIONS) {
    sessions.length = MAX_SESSIONS;
  }
  saveSessions(sessions);
  currentSession = null;
}

export function discardCurrentSession(): void {
  removeFromStorage(PENDING_KEY);
  currentSession = null;
}

export function clearAllSessions(): void {
  saveToStorage(STORAGE_KEY, []);
  removeFromStorage(PENDING_KEY);
}

export function downloadSessionsAsJson(): void {
  const sessions = loadSessions();
  const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  a.download = `flying-chess-sessions-${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function sessionToSummary(session: GameSession): SessionSummary {
  const entries = session.entries;
  return {
    id: session.id,
    date: session.startTime,
    players: [session.players[0].name, session.players[1].name],
    themes: [session.players[0].themeName, session.players[1].themeName],
    totalTasks: entries.length,
    completed: entries.filter(e => e.completed).length,
    rejected: entries.filter(e => !e.completed).length,
    totalDuration: entries.reduce((sum, e) => sum + e.duration, 0),
    mode: session.mode,
  };
}
