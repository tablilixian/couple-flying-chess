import { StatusEffect } from '../types';
import { Zap, Anchor } from 'lucide-react';

interface StatusPanelProps {
  label: string;
  role: 'male' | 'female';
  actionStatus: StatusEffect | null;
  conditionStatus: StatusEffect | null;
  color: string;
}

export function StatusPanel({ label, actionStatus, conditionStatus, color }: StatusPanelProps) {
  const emptyText = '--';
  return (
    <div className="flex flex-col gap-1 min-w-0 max-w-[35%]">
      <div className={`text-[10px] font-bold ${color} uppercase tracking-wider`}>
        {label}
      </div>
      <div className="flex flex-col gap-0.5">
        <div className={`flex items-start gap-1 rounded-lg px-1.5 py-1 ${
          actionStatus ? 'bg-white/10 border border-white/10' : 'bg-white/5'
        }`}>
          <Zap size={8} className={`shrink-0 mt-0.5 ${actionStatus ? 'text-yellow-400' : 'text-gray-600'}`} />
          <span className={`text-[9px] leading-snug ${actionStatus ? 'text-white' : 'text-gray-600'}`}>
            {actionStatus ? actionStatus.description : emptyText}
          </span>
        </div>
        <div className={`flex items-start gap-1 rounded-lg px-1.5 py-1 ${
          conditionStatus ? 'bg-white/10 border border-white/10' : 'bg-white/5'
        }`}>
          <Anchor size={8} className={`shrink-0 mt-0.5 ${conditionStatus ? 'text-[#30D158]' : 'text-gray-600'}`} />
          <span className={`text-[9px] leading-snug ${conditionStatus ? 'text-white' : 'text-gray-600'}`}>
            {conditionStatus ? conditionStatus.description : emptyText}
          </span>
        </div>
      </div>
    </div>
  );
}
