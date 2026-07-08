import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Download, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { GameMode } from '../../types';
import {
  GameSession, SessionSummary,
  loadSessions, clearAllSessions, downloadSessionsAsJson, sessionToSummary
} from '../../utils/gameSession';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: GameMode;
}

type View = 'list' | 'detail';

export function HistoryModal({ isOpen, onClose, mode }: HistoryModalProps) {
  const [view, setView] = useState<View>('list');
  const [summaries, setSummaries] = useState<SessionSummary[]>([]);
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(null);

  const modeLabel = mode === 'couple' ? '情侣' : '普通';

  useEffect(() => {
    if (isOpen) {
      const sessions = loadSessions().filter(s => s.mode === mode);
      setSummaries(sessions.map(sessionToSummary));
      setView('list');
      setSelectedSession(null);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleClear = () => {
    if (window.confirm('确定要清空所有历史记录吗？')) {
      clearAllSessions();
      setSummaries([]);
    }
  };

  const openDetail = (id: string) => {
    const session = loadSessions().find(s => s.id === id);
    if (session) {
      setSelectedSession(session);
      setView('detail');
    }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const typeLabel: Record<string, string> = {
    collision: '追尾',
    lucky: '幸运',
    trap: '陷阱',
    truth: '真心话',
    dare: '大冒险',
    penalty: '惩罚',
  };

  const typeColors: Record<string, string> = {
    collision: 'text-yellow-400',
    lucky: 'text-[#FF375F]',
    trap: 'text-[#BF5AF2]',
    truth: 'text-[#FF375F]',
    dare: 'text-[#FF9F0A]',
    penalty: 'text-[#FF453A]',
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}分${s}秒`;
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm max-h-[80vh] bg-[#1C1C1E] border border-white/10 rounded-2xl flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            {view === 'detail' && (
              <button
                onClick={() => setView('list')}
                className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <h2 className="text-lg font-bold text-white">
              {view === 'list' ? `${modeLabel}模式 · 游戏历史` : '局详情'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {view === 'list' && summaries.length > 0 && (
              <>
                <button
                  onClick={handleClear}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors"
                  title="清空历史"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={downloadSessionsAsJson}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="下载 JSON"
                >
                  <Download size={16} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {view === 'list' ? renderSessionList() : renderSessionDetail()}
        </div>

        {/* Footer */}
        {view === 'list' && (
          <div className="p-3 border-t border-white/10 text-[11px] text-gray-500 text-center shrink-0">
            共 {summaries.length} 局
          </div>
        )}
      </div>
    </div>
  );

  function renderSessionList() {
    if (summaries.length === 0) {
      return (
        <div className="text-center text-gray-500 text-sm py-10">
          暂无游戏记录
        </div>
      );
    }

    return summaries.map(s => {
      const completionRate = s.totalTasks > 0 ? Math.round((s.completed / s.totalTasks) * 100) : 0;

      return (
        <div
          key={s.id}
          className="bg-[#2C2C2E] rounded-xl p-4 border border-white/5 ios-btn cursor-pointer"
          onClick={() => openDetail(s.id)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-gray-500">{formatDate(s.date)}</span>
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <Clock size={11} />
              <span>{formatDuration(s.totalDuration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-white">{s.players[0]}</span>
            <span className="text-[10px] text-gray-500">vs</span>
            <span className="text-sm font-semibold text-white">{s.players[1]}</span>
          </div>

          <div className="text-[11px] text-gray-400 mb-3">
            {s.themes[0]} · {s.themes[1]}
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-gray-400">
              <CheckCircle size={11} className="text-[#30D158]" />
              {s.completed}完成
            </span>
            <span className="flex items-center gap-1 text-gray-400">
              <XCircle size={11} className="text-[#FF453A]" />
              {s.rejected}拒绝
            </span>
            <span className="text-gray-500">{completionRate}%</span>
            <ChevronRight size={14} className="ml-auto text-gray-600" />
          </div>
        </div>
      );
    });
  }

  function renderSessionDetail() {
    if (!selectedSession) return null;
    const s = selectedSession;
    const stats = sessionToSummary(s);

    return (
      <>
        {/* Session info card */}
        <div className="bg-[#2C2C2E] rounded-xl p-4 border border-white/5 mb-3">
          <div className="text-[11px] text-gray-500 mb-2">{formatDate(s.startTime)}</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base font-bold text-white"
              style={{ color: '#0A84FF' }}>{s.players[0].name}</span>
            <span className="text-[10px] text-gray-500">vs</span>
            <span className="text-base font-bold text-white"
              style={{ color: '#FF375F' }}>{s.players[1].name}</span>
          </div>
          <div className="text-[11px] text-gray-400 mb-3">
            📦 {s.players[0].themeName} · {s.players[1].themeName}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{stats.totalTasks}</div>
              <div className="text-[10px] text-gray-500">总任务</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[#30D158]">{stats.completed}</div>
              <div className="text-[10px] text-gray-500">完成</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[#FF453A]">{stats.rejected}</div>
              <div className="text-[10px] text-gray-500">拒绝</div>
            </div>
          </div>
          {stats.totalTasks > 0 && (
            <div className="mt-2 text-[10px] text-gray-500 text-center">
              平均耗时 {formatDuration(Math.round(stats.totalDuration / stats.totalTasks))}/题 · 
              总耗时 {formatDuration(stats.totalDuration)}
            </div>
          )}
        </div>

        {/* Task list */}
        <div className="text-[11px] text-gray-500 mb-2 font-medium">
          任务记录（{s.entries.length}）
        </div>

        {s.entries.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-6">本局暂无任务记录</div>
        ) : (
          [...s.entries].reverse().map(entry => (
            <div
              key={entry.id}
              className="bg-[#2C2C2E] rounded-xl p-3 border border-white/5"
            >
              <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${typeColors[entry.type] || 'text-gray-400'}`}>
                    {typeLabel[entry.type] || entry.type}
                  </span>
                  <span>第 {entry.round} 回合</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{formatDuration(entry.duration)}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    entry.completed
                      ? 'bg-[#30D158]/20 text-[#30D158]'
                      : 'bg-[#FF453A]/20 text-[#FF453A]'
                  }`}>
                    {entry.completed ? '完成' : '拒绝'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-white leading-relaxed mb-1">{entry.task}</p>
              <div className="text-[10px] text-gray-500">
                执行者: <span className="text-gray-400">{entry.executorName}</span>
              </div>
            </div>
          ))
        )}
      </>
    );
  }
}
