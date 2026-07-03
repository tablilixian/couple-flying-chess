import { useState } from 'react';
import { GameMode, Player, Theme } from '../../types';
import { ChevronRight, User, UserRound } from 'lucide-react';

interface HomeViewProps {
  players: Player[];
  themes: Theme[];
  mode: GameMode;
  onSelectTheme: (playerId: number) => void;
  onSetPlayerName: (playerId: number, name: string) => void;
  onStartGame: () => void;
}

export function HomeView({ players, themes, mode, onSelectTheme, onSetPlayerName, onStartGame }: HomeViewProps) {
  const [editId, setEditId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = (playerId: number, currentName: string) => {
    setEditId(playerId);
    setEditValue(currentName);
  };

  const handleConfirmName = (playerId: number) => {
    if (editValue.trim()) {
      onSetPlayerName(playerId, editValue.trim());
    }
    setEditId(null);
  };

  return (
    <div className="flex-1 flex flex-col justify-start space-y-8 mt-6">
      <div className="text-center mb-4">
        <h2 className="text-xl text-gray-300 font-medium">配置游戏角色</h2>
        <p className="text-sm text-gray-500 mt-2">选择双方的任务主题包</p>
      </div>

      <div className="space-y-4">
        {players.map((player, idx) => {
          const theme = themes.find(t => t.id === player.themeId);
          const isMale = idx === 0;

          return (
            <div
              key={player.id}
              className="ios-card p-5 flex items-center justify-between border border-white/5"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg shrink-0"
                  style={{
                    backgroundColor: player.color,
                    boxShadow: `0 10px 15px -3px ${player.color}30`
                  }}
                >
                  {isMale && mode === 'couple' ? (
                    <User className="text-white" size={24} />
                  ) : mode === 'normal' ? (
                    <User className="text-white" size={24} />
                  ) : (
                    <UserRound className="text-white" size={24} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {editId === player.id ? (
                    <input
                      className="w-full bg-[#3A3A3C] text-white text-base font-semibold px-3 py-1.5 rounded-lg outline-none border border-white/20 focus:border-white/40"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => handleConfirmName(player.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleConfirmName(player.id);
                        if (e.key === 'Escape') setEditId(null);
                      }}
                      autoFocus
                      maxLength={10}
                    />
                  ) : (
                    <div
                      className="text-base font-semibold text-white cursor-pointer hover:text-gray-300 transition-colors"
                      onClick={() => handleStartEdit(player.id, player.name)}
                      title="点击修改名字"
                    >
                      {player.name}
                    </div>
                  )}
                  <div
                    className="text-sm font-medium text-white mt-0.5 ios-btn cursor-pointer"
                    onClick={() => onSelectTheme(player.id)}
                  >
                    {theme?.name || '未选择主题'}
                  </div>
                </div>
              </div>
              <button
                className="shrink-0 text-gray-600 hover:text-white transition-colors p-1"
                onClick={() => onSelectTheme(player.id)}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex-1" />

      <button
        className={`w-full h-14 bg-white rounded-full text-black font-semibold text-lg shadow-lg ios-btn flex items-center justify-center gap-2 mb-8`}
        onClick={onStartGame}
      >
        <span>开始游戏</span>
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
