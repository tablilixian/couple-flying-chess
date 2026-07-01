import { GameMode, Theme } from '../../types';

interface ThemesViewProps {
  themes: Theme[];
  mode: GameMode;
  onCreateTheme: () => void;
  onEditTheme: (themeId: string) => void;
}

const audienceLabel: Record<Theme['audience'], string> = {
  common: '通用',
  male: '仅男方',
  female: '仅女方'
};

const MODE_STYLES: Record<GameMode, { label: string; createBg: string }> = {
  couple: { label: '💕 情侣题库', createBg: 'bg-pink-500' },
  normal: { label: '🎲 普通题库', createBg: 'bg-blue-500' }
};

export function ThemesView({ themes, mode, onCreateTheme, onEditTheme }: ThemesViewProps) {
  const styles = MODE_STYLES[mode];
  const filteredThemes = themes.filter(t => t.mode === mode);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto no-scrollbar pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">任务主题库</h2>
          <div className={`text-xs mt-1 ${mode === 'couple' ? 'text-pink-400' : 'text-blue-400'}`}>
            {styles.label}
          </div>
        </div>
        <button
          className={`h-9 px-4 rounded-full bg-white text-black text-sm font-semibold ios-btn`}
          onClick={onCreateTheme}
        >
          新建主题
        </button>
      </div>
      <div className="space-y-3">
        {filteredThemes.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-10">
            当前模式下还没有主题包，点击右上角新建
          </div>
        )}
        {filteredThemes.map(theme => (
          <div
            key={theme.id}
            className="ios-card p-4 border border-white/5 ios-btn cursor-pointer"
            onClick={() => onEditTheme(theme.id)}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-white font-semibold">{theme.name}</div>
                <div className="text-xs text-gray-500 mt-1">{theme.desc}</div>
                <div className="mt-2 inline-flex items-center gap-2">
                  <div className="bg-white/10 px-2 py-1 rounded text-[10px] text-gray-300">
                    {audienceLabel[theme.audience]}
                  </div>
                </div>
              </div>
              <div className="bg-white/10 px-2 py-1 rounded text-[10px] text-gray-300">
                {theme.tasks.length}卡
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
