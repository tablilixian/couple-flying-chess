import { GameMode } from '../types';
import { loadFromStorage, saveToStorage, removeFromStorage } from './localStorage';
import { GAME_SESSIONS_KEY, PENDING_SESSION_KEY } from './storageKeys';

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

const STORAGE_KEY = GAME_SESSIONS_KEY;
const PENDING_KEY = PENDING_SESSION_KEY;
const MAX_SESSIONS = 50;

/**
 * 只返回已归档（正常结束）的对局。
 * 历史上这里会把 pending-session 直接 unshift 进列表，导致同一局同时
 * 出现在「进行中」和「历史」两处，endTime=0 的半截对局被当成已完成局展示。
 * 这里额外做一次 id 去重，防止历史里出现同一局的重复条目。
 */
export function loadSessions(): GameSession[] {
  const sessions = loadFromStorage<GameSession[]>(STORAGE_KEY, []);
  if (!Array.isArray(sessions)) return [];

  const seen = new Set<string>();
  const result: GameSession[] = [];
  for (const s of sessions) {
    if (!s || typeof s.id !== 'string' || seen.has(s.id)) continue;
    seen.add(s.id);
    result.push(s);
  }
  return result;
}

/**
 * 读取尚未归档的对局（中途退出 / 刷新页面 / 崩溃残留）。
 * 该记录不计入历史局数，由调用方决定如何提示与清理。
 */
export function loadPendingSession(): GameSession | null {
  const pending = loadFromStorage<GameSession | null>(PENDING_KEY, null);
  if (!pending || typeof pending !== 'object' || !Array.isArray(pending.entries)) return null;
  return pending;
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

  const sessions = loadSessions().filter(s => s.id !== currentSession!.id);
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

/** 丢弃残留在存储里的未归档对局（页面刷新后内存态已丢失时的清理入口） */
export function discardPendingSession(): void {
  removeFromStorage(PENDING_KEY);
}

export function clearAllSessions(): void {
  saveToStorage(STORAGE_KEY, []);
  removeFromStorage(PENDING_KEY);
}

export function downloadSessionsAsJson(): void {
  // 未归档的对局单独成键导出，避免被误读成已完成局，同时也不丢数据
  const payload = {
    exportedAt: new Date().toISOString(),
    sessions: loadSessions(),
    pendingSession: loadPendingSession(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
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
