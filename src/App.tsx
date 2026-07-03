import { useState, useRef } from 'react';
import { Settings, History } from 'lucide-react';
import { GameMode, TaskEventData, AppSubview, Script, StepLogEntry } from './types';
import { VerificationGate, getStoredPassword, setStoredPassword } from './components/VerificationGate';
import { clearAudioCache } from './utils/ttsService';
import { useGameState } from './hooks/useGameState';
import { startNewSession, addEntryToCurrentSession, finalizeCurrentSession, TaskHistoryEntry } from './utils/gameSession';
import { HomeView } from './components/views/HomeView';
import { GameView } from './components/views/GameView';
import { ThemesView } from './components/views/ThemesView';
import { ThemeSelectorModal } from './components/modals/ThemeSelectorModal';
import { TaskCardModal } from './components/modals/TaskCardModal';
import { WinModal } from './components/modals/WinModal';
import { BottomNav } from './components/BottomNav';
import { ThemeCreateModal } from './components/modals/ThemeCreateModal';
import { ThemeEditorModal } from './components/modals/ThemeEditorModal';
import { AiImportModal } from './components/modals/AiImportModal';
import { HistoryModal } from './components/modals/HistoryModal';
import { GameHubView } from './components/views/GameHubView';
import { ScriptSelectView } from './components/views/ScriptSelectView';
import { CharacterIntroView } from './components/views/CharacterIntroView';
import { ScriptGameView } from './components/views/ScriptGameView';
import { EndingView } from './components/views/EndingView';

const MODE_CONFIG: Record<GameMode, {
  title: string;
  subtitle: string;
  accentColor: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  startBg: string;
  navActiveClass: string;
}> = {
  couple: {
    title: '情侣飞行棋',
    subtitle: "Couple's Game",
    accentColor: '#FF375F',
    accentBg: 'bg-pink-500',
    accentText: 'text-pink-400',
    accentBorder: 'border-pink-400',
    startBg: 'bg-pink-500',
    navActiveClass: 'text-pink-400'
  },
  normal: {
    title: '普通飞行棋',
    subtitle: 'Party Game',
    accentColor: '#0A84FF',
    accentBg: 'bg-blue-500',
    accentText: 'text-blue-400',
    accentBorder: 'border-blue-400',
    startBg: 'bg-blue-500',
    navActiveClass: 'text-blue-400'
  }
};

function App() {
  const [verified, setVerified] = useState(false);
  const [mode, setMode] = useState<GameMode>('couple');

  if (!verified) {
    return <VerificationGate onVerified={(m) => { setMode(m); setVerified(true); }} />;
  }

  return <AppInner mode={mode} key={mode} />;
}

function AppInner({ mode }: { mode: GameMode }) {
  const {
    state,
    switchView,
    setPlayerName,
    selectTheme,
    createTheme,
    updateThemeMeta,
    addThemeTask,
    removeThemeTask,
    importThemeTasks,
    startGame,
    movePlayer,
    endTurn,
    setIsRolling,
    checkTile,
    resolveTask,
    resetGame,
    applyStatusTile,
    performActionStatus
  } = useGameState(mode);

  const [appSubview, setAppSubview] = useState<AppSubview>('hub');
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [scriptStepLog, setScriptStepLog] = useState<StepLogEntry[]>([]);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number>(0);
  const [taskData, setTaskData] = useState<TaskEventData | null>(null);
  const taskStartTimeRef = useRef(0);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [isCreateThemeModalOpen, setIsCreateThemeModalOpen] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [aiImportThemeId, setAiImportThemeId] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const config = MODE_CONFIG[mode];

  const handleNavigate = (view: AppSubview) => {
    setAppSubview(view);
  };

  // ===== Hub -> Flying Chess =====
  const handleSelectTheme = (playerId: number) => {
    setSelectedPlayerId(playerId);
    setIsThemeModalOpen(true);
  };

  const handleThemeSelect = (themeId: string) => {
    selectTheme(selectedPlayerId, themeId);
  };

  const selectedPlayer = state.players.find(p => p.id === selectedPlayerId) || state.players[0];
  const selectableThemes = state.themes.filter(
    t => t.mode === mode && (t.audience === 'common' || t.audience === selectedPlayer.role)
  );

  const handleStartFlyingGame = () => {
    const success = startGame();
    if (!success) {
      alert('请先为双方选择任务包');
      return;
    }
    const playerInfos = state.players.map(p => {
      const theme = state.themes.find(t => t.id === p.themeId);
      return { id: p.id, name: p.name, themeName: theme?.name || '未知' };
    });
    startNewSession(mode, playerInfos);
  };

  const handleTaskTrigger = (data: TaskEventData) => {
    taskStartTimeRef.current = Date.now();
    setTaskData(data);
  };

  const handleTaskAccept = () => {
    if (!taskData) return;
    const executor = state.players.find(p => p.id === taskData.executorPlayerId);
    const round = Math.floor(Math.max(...state.players.map(p => p.step)) / 4) + 1;
    const entry: TaskHistoryEntry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: taskStartTimeRef.current,
      resolvedAt: Date.now(),
      duration: Math.round((Date.now() - taskStartTimeRef.current) / 1000),
      round,
      executorName: executor?.name || '未知',
      task: taskData.task,
      completed: true,
      type: taskData.type,
    };
    addEntryToCurrentSession(entry);
    setTaskData(null);
    resolveTask(taskData, 'accept');
  };

  const handleTaskReject = () => {
    if (!taskData) return;
    const executor = state.players.find(p => p.id === taskData.executorPlayerId);
    const round = Math.floor(Math.max(...state.players.map(p => p.step)) / 4) + 1;
    const entry: TaskHistoryEntry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: taskStartTimeRef.current,
      resolvedAt: Date.now(),
      duration: Math.round((Date.now() - taskStartTimeRef.current) / 1000),
      round,
      executorName: executor?.name || '未知',
      task: taskData.task,
      completed: false,
      type: taskData.type,
    };
    addEntryToCurrentSession(entry);
    setTaskData(null);
    resolveTask(taskData, 'reject');
  };

  const handleWin = (id: number) => {
    finalizeCurrentSession();
    setWinnerId(id);
  };

  const handleBackFromGame = () => {
    if (confirm('离开游戏？进度不会保存')) {
      finalizeCurrentSession();
      resetGame();
      setAppSubview('hub');
    }
  };

  const handleOpenHistory = () => {
    setIsHistoryModalOpen(true);
  };

  const handleCloseHistory = () => {
    setIsHistoryModalOpen(false);
  };

  const handleSavePassword = () => {
    if (passwordInput.length < 4) return;
    setStoredPassword(mode, passwordInput);
    setIsPasswordModalOpen(false);
    setPasswordInput('');
  };

  // ===== Hub -> Script Flow =====
  const handleScriptSelect = (script: Script) => {
    setSelectedScript(script);
    setAppSubview('script-intro');
  };

  const handleScriptStart = () => {
    setAppSubview('script-game');
  };

  const handleScriptEnd = (stepLog: StepLogEntry[]) => {
    setScriptStepLog(stepLog);
    setAppSubview('script-ending');
  };

  const handleScriptBackToSelect = () => {
    setSelectedScript(null);
    setAppSubview('script-select');
  };

  const handleScriptBackToHub = () => {
    setSelectedScript(null);
    setAppSubview('hub');
  };

  // ===== Render =====
  // Hub view
  if (appSubview === 'hub') {
    return (
      <div className="h-screen w-screen overflow-hidden flex justify-center bg-black">
        <div className="fixed inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-60" />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>
        <div className="relative z-10 w-full max-w-[430px] h-full bg-black/20">
          <GameHubView mode={mode} onNavigate={handleNavigate} />
        </div>
        {isPasswordModalOpen && renderPasswordModal()}
      </div>
    );
  }

  // Script Select
  if (appSubview === 'script-select') {
    return (
      <div className="h-screen w-screen overflow-hidden flex justify-center bg-black">
        <div className="fixed inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-60" />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>
        <div className="relative z-10 w-full max-w-[430px] h-full bg-black/20">
          <ScriptSelectView onSelect={handleScriptSelect} onBack={() => setAppSubview('hub')} />
        </div>
      </div>
    );
  }

  // Character Intro
  if (appSubview === 'script-intro' && selectedScript) {
    return (
      <div className="h-screen w-screen overflow-hidden flex justify-center bg-black">
        <div className="fixed inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-60" />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>
        <div className="relative z-10 w-full max-w-[430px] h-full bg-black/20">
          <CharacterIntroView
            script={selectedScript}
            onStart={handleScriptStart}
            onBack={handleScriptBackToSelect}
          />
        </div>
      </div>
    );
  }

  // Script Game
  if (appSubview === 'script-game' && selectedScript) {
    return (
      <div className="h-screen w-screen overflow-hidden flex justify-center bg-black">
        <div className="relative z-10 w-full max-w-[430px] h-full"
          style={{ background: '#0d0d1a' }}>
          <ScriptGameView
            script={selectedScript}
            onEnd={handleScriptEnd}
            onBack={() => { setSelectedScript(null); setAppSubview('hub'); }}
          />
        </div>
      </div>
    );
  }

  // Script Ending
  if (appSubview === 'script-ending' && selectedScript) {
    return (
      <div className="h-screen w-screen overflow-hidden flex justify-center bg-black">
        <div className="relative z-10 w-full max-w-[430px] h-full"
          style={{ background: '#0d0d1a' }}>
          <EndingView
            script={selectedScript}
            stepLog={scriptStepLog}
            onReplay={handleScriptStart}
            onBackToHub={handleScriptBackToHub}
            onBackToSelect={handleScriptBackToSelect}
          />
        </div>
      </div>
    );
  }

  // ===== Flying Chess Flow =====
  // (default: flying-home)
  return (
    <div className="h-screen w-screen overflow-hidden flex justify-center bg-black">
      <div className="fixed inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-60" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full max-w-[430px] h-full flex flex-col bg-black/20">
        <header className="pt-12 pb-2 px-6 shrink-0 flex justify-between items-start">
          <div>
            <div className={`text-[11px] font-semibold ${config.accentText} uppercase tracking-widest mb-1`}>
              {config.subtitle}
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{config.title}</h1>
            <button
              onClick={handleOpenHistory}
              className="text-gray-400 hover:text-white transition-colors mt-1"
              title="任务历史"
            >
              <History size={20} />
            </button>
          </div>
          <div className="flex flex-col items-end gap-2 mt-1">
            <button
              onClick={() => {
                setPasswordInput(getStoredPassword(mode));
                setIsPasswordModalOpen(true);
              }}
              className="text-gray-400 hover:text-white transition-colors"
              title="修改密码"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 min-h-0 relative overflow-hidden">
          <div
            className={`absolute inset-0 flex flex-col px-6 pt-6 pb-10 transition-all duration-500 ease-in-out ${
              state.view === 'home'
                ? 'translate-x-0 opacity-100'
                : 'opacity-0 pointer-events-none -translate-x-full'
            }`}
          >
            <HomeView
              players={state.players}
              themes={state.themes}
              mode={mode}
              onSelectTheme={handleSelectTheme}
              onSetPlayerName={setPlayerName}
              onStartGame={handleStartFlyingGame}
            />
          </div>

          <div
            className={`absolute inset-0 flex flex-col min-h-0 px-6 pt-4 transition-all duration-500 ease-in-out ${
              state.view === 'themes'
                ? 'translate-x-0 opacity-100'
                : 'opacity-0 pointer-events-none translate-x-full'
            }`}
          >
            <ThemesView
              themes={state.themes}
              mode={mode}
              onCreateTheme={() => setIsCreateThemeModalOpen(true)}
              onEditTheme={themeId => setEditingThemeId(themeId)}
            />
          </div>
        </main>

        <BottomNav activeView={state.view} onNavigate={(v) => switchView(v)} mode={mode} />
      </div>

      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        themes={selectableThemes}
        selectedThemeId={selectedPlayer?.themeId || null}
        onSelect={handleThemeSelect}
        onClose={() => setIsThemeModalOpen(false)}
        mode={mode}
      />

      <TaskCardModal
        isOpen={!!taskData}
        taskData={taskData}
        players={state.players}
        onAccept={handleTaskAccept}
        onReject={handleTaskReject}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={handleCloseHistory}
      />

      <WinModal
        isOpen={!!winnerId}
        winnerName={winnerId !== null ? state.players[winnerId].name : ''}
        onRestart={() => {
          resetGame();
          setWinnerId(null);
        }}
      />

      <ThemeCreateModal
        isOpen={isCreateThemeModalOpen}
        onClose={() => setIsCreateThemeModalOpen(false)}
        onCreate={input => {
          const id = createTheme(input);
          setIsCreateThemeModalOpen(false);
          if (id) setEditingThemeId(id);
        }}
        mode={mode}
        existingNames={state.themes.map(t => t.name)}
      />

      <ThemeEditorModal
        isOpen={!!editingThemeId}
        theme={editingThemeId ? state.themes.find(t => t.id === editingThemeId) || null : null}
        onClose={() => {
          setEditingThemeId(null);
          setAiImportThemeId(null);
        }}
        onSaveMeta={(themeId, patch) => updateThemeMeta(themeId, patch)}
        onAddTask={(themeId, taskText) => addThemeTask(themeId, taskText)}
        onRemoveTask={(themeId, index) => removeThemeTask(themeId, index)}
        onOpenAiImport={themeId => setAiImportThemeId(themeId)}
      />

      <AiImportModal
        isOpen={!!aiImportThemeId}
        themeName={aiImportThemeId ? state.themes.find(t => t.id === aiImportThemeId)?.name || '' : ''}
        onClose={() => setAiImportThemeId(null)}
        onImport={(tasks, importMode) => {
          if (!aiImportThemeId) return;
          importThemeTasks(aiImportThemeId, tasks, importMode);
        }}
      />

      {state.view === 'game' && (
        <GameView
          players={state.players}
          boardMap={state.boardMap}
          pathCoords={state.pathCoords}
          currentTurn={state.turn}
          isRolling={state.isRolling}
          onMove={movePlayer}
          onCheckTile={checkTile}
          onEndTurn={endTurn}
          onSetRolling={setIsRolling}
          onWin={handleWin}
          onTaskTrigger={handleTaskTrigger}
                  onBack={handleBackFromGame}
                  onStatusTile={applyStatusTile}
          maleActionStatus={state.maleStatus.action}
          maleConditionStatus={state.maleStatus.condition}
          femaleActionStatus={state.femaleStatus.action}
          femaleConditionStatus={state.femaleStatus.condition}
        />
      )}

      {isPasswordModalOpen && renderPasswordModal()}
    </div>
  );

  function renderPasswordModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-gray-900 rounded-2xl p-6 w-[320px] border border-gray-700 shadow-xl">
          <h3 className="text-white text-lg font-semibold mb-1">修改密码</h3>
          <p className={`text-sm mb-4 ${config.accentText}`}>
            {mode === 'couple' ? '💕 情侣模式' : '🎲 普通模式'} · 请输入新的4位数字密码
          </p>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="w-full bg-gray-800 text-white text-center text-2xl tracking-[0.5em] py-3 rounded-lg border border-gray-600 focus:border-pink-400 focus:outline-none mb-4"
            placeholder="●●●●"
          />
          <div className="flex gap-3">
            <button
              onClick={() => { setIsPasswordModalOpen(false); setPasswordInput(''); }}
              className="flex-1 py-2.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSavePassword}
              disabled={passwordInput.length < 4}
              className={`flex-1 py-2.5 rounded-lg text-white hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${config.accentBg}`}
            >
              保存
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-800">
            <button
              onClick={async () => {
                if (window.confirm('确定要清除所有本地数据吗？\n包括所有主题包、任务卡、游戏进度、密码设置和缓存的语音。\n\n此操作不可撤销！')) {
                  await clearAudioCache();
                  localStorage.removeItem('couple-game-state');
                  localStorage.removeItem('normal-game-state');
                  localStorage.removeItem('couple-password');
                  localStorage.removeItem('normal-password');
                  localStorage.removeItem('couple-player-names');
                  localStorage.removeItem('normal-player-names');
                  localStorage.removeItem('game-sessions');
                  localStorage.removeItem('pending-session');
                  window.location.reload();
                }
              }}
              className="w-full py-2.5 rounded-lg bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
            >
              清除所有本地数据
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
