import { useState } from 'react';
import { EdgingFlow, EdgingPhase, EdgingPhaseKind } from '../../types';
import { EDGING_KIND_CONFIG, EDGING_KINDS } from '../../data/edgingFlows';
import { ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';

interface EdgingEditorModalProps {
  initial: EdgingFlow | null;
  onSave: (flow: EdgingFlow) => void;
  onClose: () => void;
}

const EMOJI_CHOICES = ['🌊', '⏳', '🔥', '🌙', '🌹', '🎵', '⚡', '💫'];

function createId(): string {
  const base =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? (crypto as Crypto).randomUUID()
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  return `flow_${base}`;
}

function emptyPhase(): EdgingPhase {
  return { kind: 'slow', bpm: 60, duration: 30, text: '' };
}

export function EdgingEditorModal({ initial, onSave, onClose }: EdgingEditorModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [desc, setDesc] = useState(initial?.desc ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🌊');
  const [phases, setPhases] = useState<EdgingPhase[]>(
    initial && initial.phases.length > 0 ? initial.phases.map(p => ({ ...p })) : [emptyPhase()]
  );

  const updatePhase = (idx: number, patch: Partial<EdgingPhase>) => {
    setPhases(prev => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const addPhase = () => setPhases(prev => [...prev, emptyPhase()]);
  const removePhase = (idx: number) => setPhases(prev => prev.filter((_, i) => i !== idx));
  const movePhase = (idx: number, dir: -1 | 1) => {
    setPhases(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleSave = () => {
    const validPhases = phases.filter(p => p.duration > 0 && p.text.trim().length > 0);
    if (!name.trim() || validPhases.length === 0) {
      alert('请填写流程名称，并确保至少一个阶段有文字和时长');
      return;
    }
    onSave({
      id: initial?.id ?? createId(),
      name: name.trim(),
      desc: desc.trim(),
      emoji,
      phases: validPhases,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[92vw] max-w-[400px] max-h-[88vh] bg-gray-900 rounded-2xl border border-gray-700 shadow-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-white text-lg font-semibold">
            {initial ? '编辑流程' : '新建流程'}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">阶段会自动按顺序播放，bpm 为 0 表示静止（寸止/休息）</p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 space-y-4">
          <div className="space-y-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="流程名称，如：极限挑战"
              className="w-full bg-gray-800 text-white text-sm px-3 py-2.5 rounded-lg border border-gray-700 focus:border-pink-400 focus:outline-none"
            />
            <input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="一句话介绍（可选）"
              className="w-full bg-gray-800 text-white text-sm px-3 py-2.5 rounded-lg border border-gray-700 focus:border-pink-400 focus:outline-none"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">图标：</span>
              {EMOJI_CHOICES.map(e => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                    emoji === e ? 'bg-white/15 ring-1 ring-white/30' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">阶段列表</span>
              <button
                onClick={addPhase}
                className="flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300"
              >
                <Plus size={14} /> 添加阶段
              </button>
            </div>

            {phases.map((p, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 w-4 text-right">{i + 1}</span>
                  <select
                    value={p.kind}
                    onChange={e => updatePhase(i, { kind: e.target.value as EdgingPhaseKind })}
                    className="flex-1 bg-gray-800 text-white text-xs px-2 py-1.5 rounded-lg border border-gray-700 focus:border-pink-400 focus:outline-none"
                  >
                    {EDGING_KINDS.map(k => (
                      <option key={k} value={k}>
                        {EDGING_KIND_CONFIG[k].label} · {EDGING_KIND_CONFIG[k].desc}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={p.bpm}
                    onChange={e => updatePhase(i, { bpm: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-16 bg-gray-800 text-white text-xs px-2 py-1.5 rounded-lg border border-gray-700 focus:border-pink-400 focus:outline-none"
                    title="BPM"
                  />
                  <input
                    type="number"
                    min={1}
                    value={p.duration}
                    onChange={e => updatePhase(i, { duration: Math.max(1, Number(e.target.value) || 1) })}
                    className="w-14 bg-gray-800 text-white text-xs px-2 py-1.5 rounded-lg border border-gray-700 focus:border-pink-400 focus:outline-none"
                    title="秒"
                  />
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => movePhase(i, -1)} disabled={i === 0} className="text-gray-500 hover:text-white disabled:opacity-30">
                      <ArrowUp size={12} />
                    </button>
                    <button onClick={() => movePhase(i, 1)} disabled={i === phases.length - 1} className="text-gray-500 hover:text-white disabled:opacity-30">
                      <ArrowDown size={12} />
                    </button>
                  </div>
                  <button onClick={() => removePhase(i)} className="text-gray-500 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  value={p.text}
                  onChange={e => updatePhase(i, { text: e.target.value })}
                  placeholder="当前动作提示 / 刺激文字"
                  className="w-full bg-gray-800 text-white text-xs px-2 py-1.5 rounded-lg border border-gray-700 focus:border-pink-400 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-lg bg-pink-500 text-white hover:opacity-90 transition-opacity text-sm"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
