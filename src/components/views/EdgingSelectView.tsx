import { useMemo, useState } from 'react';
import { ArrowLeft, Play, Plus, Trash2, Pencil, History, HeartHandshake } from 'lucide-react';
import { GameMode, EdgingFlow, EdgingSessionRecord } from '../../types';
import { PRESET_EDGING_FLOWS } from '../../data/edgingFlows';
import { loadCustomFlows, saveCustomFlows, loadEdgingSessions, loadEdgingProfile, saveEdgingProfile, formatDuration } from '../../utils/edgingStorage';
import { EdgingEditorModal } from '../modals/EdgingEditorModal';

interface EdgingSelectViewProps {
  mode: GameMode;
  onBack: () => void;
  onStart: (flow: EdgingFlow) => void;
}

const STATUS_LABEL: Record<EdgingSessionRecord['status'], string> = {
  completed: '完成',
  abandoned: '放弃',
  safeword: '安全词',
};

const STATUS_COLOR: Record<EdgingSessionRecord['status'], string> = {
  completed: 'text-green-400',
  abandoned: 'text-yellow-400',
  safeword: 'text-orange-400',
};

function flowTotal(flow: EdgingFlow): string {
  return formatDuration(flow.phases.reduce((a, p) => a + p.duration, 0));
}

export function EdgingSelectView({ mode, onBack, onStart }: EdgingSelectViewProps) {
  const accentColor = mode === 'couple' ? '#FF375F' : '#0A84FF';
  const [customFlows, setCustomFlows] = useState<EdgingFlow[]>(() => loadCustomFlows());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<EdgingFlow | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions] = useState<EdgingSessionRecord[]>(() => loadEdgingSessions());
  const [name, setName] = useState(() => loadEdgingProfile().name);

  const handleNameChange = (value: string) => {
    setName(value);
    saveEdgingProfile({ name: value.trim() });
  };

  const allFlows = useMemo(() => [...PRESET_EDGING_FLOWS, ...customFlows], [customFlows]);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (flow: EdgingFlow) => {
    setEditing(flow);
    setEditorOpen(true);
  };

  const handleSaveFlow = (flow: EdgingFlow) => {
    setCustomFlows(prev => {
      const exists = prev.some(f => f.id === flow.id);
      const next = exists ? prev.map(f => (f.id === flow.id ? flow : f)) : [...prev, flow];
      saveCustomFlows(next);
      return next;
    });
    setEditorOpen(false);
  };

  const handleDeleteFlow = (flowId: string) => {
    if (!confirm('删除该自定义流程？')) return;
    setCustomFlows(prev => {
      const next = prev.filter(f => f.id !== flowId);
      saveCustomFlows(next);
      return next;
    });
  };

  const recentSessions = sessions.slice(0, 5);

  return (
    <div className="h-screen w-screen overflow-hidden flex justify-center bg-black">
      <div className="fixed inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-60" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full max-w-[430px] h-full bg-black/20 flex flex-col">
        <header className="pt-12 pb-2 px-6 shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={20} />
              <span className="text-xs">返回</span>
            </button>
            <button
              onClick={() => setShowHistory(s => !s)}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
              title="历史记录"
            >
              <History size={18} />
              <span className="text-xs">历史</span>
            </button>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">调教节奏</h1>
          <p className="text-xs text-gray-500 mt-1">选择一套流程，跟着节拍与指令开始</p>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 pb-8 space-y-3">
          <div className="ios-card p-3">
            <div className="flex items-center gap-2 mb-2">
              <HeartHandshake size={14} className="text-pink-400 shrink-0" />
              <span className="text-xs text-gray-300">怎么称呼你？</span>
              <span className="text-[10px] text-gray-600">指令会带上你的称呼</span>
            </div>
            <input
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              maxLength={8}
              placeholder="例如：宝贝 / 小狗 / 主人叫你什么都行"
              className="w-full bg-white/[0.05] text-white text-sm px-3 py-2 rounded-lg border border-white/10 focus:outline-none"
            />
          </div>

          {showHistory ? (
            <div className="ios-card p-4">
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">最近记录</div>
              {recentSessions.length === 0 ? (
                <div className="text-sm text-gray-600 text-center py-6">还没有完成过流程</div>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map(s => (
                    <div key={s.id} className="flex items-center justify-between bg-white/[0.03] rounded-lg px-3 py-2">
                      <div>
                        <div className="text-sm text-white">{s.flowName}</div>
                        <div className="text-[10px] text-gray-500">
                          {new Date(s.startedAt).toLocaleString()} · {formatDuration(s.totalSeconds)} · 暂停{s.pausedCount}次
                        </div>
                      </div>
                      <span className={`text-xs font-medium ${STATUS_COLOR[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">选择流程</span>
                <button
                  onClick={openCreate}
                  className="flex items-center gap-1 text-xs text-white px-3 py-1.5 rounded-full"
                  style={{ background: accentColor }}
                >
                  <Plus size={13} /> 新建流程
                </button>
              </div>

              {allFlows.map((flow, idx) => {
                const isPreset = idx < PRESET_EDGING_FLOWS.length;
                const phaseCount = flow.phases.length;
                return (
                  <div key={flow.id} className="ios-card p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{flow.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold truncate">{flow.name}</span>
                          {!isPreset && (
                            <span className="text-[10px] text-white px-1.5 py-0.5 rounded-full shrink-0" style={{ background: accentColor }}>
                              自定义
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{flow.desc}</div>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-600">
                          <span>{phaseCount} 个阶段</span>
                          <span>约 {flowTotal(flow)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <button
                          onClick={() => onStart(flow)}
                          className="flex items-center gap-1.5 text-xs text-white px-3.5 py-2 rounded-full shadow-lg"
                          style={{ background: accentColor, boxShadow: `0 0 16px ${accentColor}40` }}
                        >
                          <Play size={13} className="fill-white" /> 开始
                        </button>
                        {!isPreset && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(flow)} className="text-gray-500 hover:text-white">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => handleDeleteFlow(flow.id)} className="text-gray-500 hover:text-red-400">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {editorOpen && (
        <EdgingEditorModal initial={editing} onSave={handleSaveFlow} onClose={() => setEditorOpen(false)} />
      )}
    </div>
  );
}
