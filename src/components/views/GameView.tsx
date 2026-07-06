import { useState, useCallback, useEffect, useRef } from 'react';
import { Player, PathCoord, TileType, TaskEventData, StatusEffect } from '../../types';
import { GameBoard } from '../GameBoard';
import { Dice } from '../Dice';
import { StatusPanel } from '../StatusPanel';
import { rollDice, getTrajectory } from '../../utils/gameLogic';
import { User, UserRound, ArrowLeft, Infinity, Play, Square } from 'lucide-react';

interface GameViewProps {
  players: Player[];
  boardMap: TileType[];
  pathCoords: PathCoord[];
  currentTurn: number;
  isRolling: boolean;
  onMove: (steps: number) => void;
  onCheckTile: (landingStep: number) => TaskEventData | 'win' | 'status' | null;
  onEndTurn: () => void;
  onSetRolling: (rolling: boolean) => void;
  onWin: (winnerId: number) => void;
  winnerId: number | null;
  onTaskTrigger: (data: TaskEventData) => void;
  onBack: () => void;
  onStatusTile: (targetRole: 'male' | 'female') => StatusEffect | null;
  maleActionStatus: StatusEffect | null;
  maleConditionStatus: StatusEffect | null;
  femaleActionStatus: StatusEffect | null;
  femaleConditionStatus: StatusEffect | null;
  autoMode: boolean;
  onToggleAuto: () => void;
  taskActive: boolean;
}

export function GameView({
  players,
  boardMap,
  pathCoords,
  currentTurn,
  isRolling,
  onMove,
  onCheckTile,
  onEndTurn,
  onSetRolling,
  onWin,
  onTaskTrigger,
  onBack,
  onStatusTile,
  maleActionStatus,
  maleConditionStatus,
  femaleActionStatus,
  femaleConditionStatus,
  autoMode,
  onToggleAuto,
  winnerId,
  taskActive
}: GameViewProps) {
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [statusNotification, setStatusNotification] = useState<StatusEffect | null>(null);

  const handleRoll = useCallback(() => {
    if (isRolling || isMoving || diceResult) return;

    onSetRolling(true);
    const result = rollDice();

    if (navigator.vibrate) {
      navigator.vibrate(20);
    }

    setTimeout(() => {
      setDiceResult(result);
      onSetRolling(false);
    }, 1000);
  }, [isRolling, isMoving, diceResult, onSetRolling]);

  const handleRollComplete = useCallback(() => {
    if (diceResult) {
      const trajectory = getTrajectory(players[currentTurn].step, diceResult);
      const landingStep = trajectory[trajectory.length - 1];
      setIsMoving(true);

      const moveDelayMs = 220;
      let stepIndex = 0;

      const stepOnce = () => {
        const prevPos = stepIndex === 0 ? players[currentTurn].step : trajectory[stepIndex - 1];
        const delta = trajectory[stepIndex] - prevPos;
        onMove(delta);
        stepIndex += 1;

        if (stepIndex < trajectory.length) {
          setTimeout(stepOnce, moveDelayMs);
          return;
        }

        setTimeout(() => {
          const tileCheck = onCheckTile(landingStep);

          if (tileCheck === 'win') {
            onWin(currentTurn);
            setDiceResult(null);
            setIsMoving(false);
          } else if (tileCheck === 'status') {
            const newStatus = onStatusTile(activePlayer.role);
            if (newStatus) {
              setStatusNotification(newStatus);
              setTimeout(() => {
                setStatusNotification(null);
                onEndTurn();
              }, 2200);
            } else {
              onEndTurn();
            }
            setDiceResult(null);
            setIsMoving(false);
          } else if (tileCheck) {
            onTaskTrigger(tileCheck);
            setDiceResult(null);
            setIsMoving(false);
          } else {
            onEndTurn();
            setDiceResult(null);
            setIsMoving(false);
          }
        }, moveDelayMs);
      };

      setTimeout(stepOnce, moveDelayMs);
    }
  }, [diceResult, players, currentTurn, onMove, onCheckTile, onWin, onTaskTrigger, onEndTurn, onStatusTile]);

  const autoRollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoRollTimerRef.current) {
      clearTimeout(autoRollTimerRef.current);
      autoRollTimerRef.current = null;
    }

    if (autoMode && winnerId === null && !taskActive && statusNotification === null && !isRolling && !isMoving && diceResult === null) {
      const delay = 400 + Math.random() * 600;
      autoRollTimerRef.current = setTimeout(() => {
        handleRoll();
      }, delay);
    }

    return () => {
      if (autoRollTimerRef.current) {
        clearTimeout(autoRollTimerRef.current);
      }
    };
  }, [autoMode, isRolling, isMoving, diceResult, handleRoll, winnerId, taskActive, statusNotification]);

  const activePlayer = players[currentTurn];
  const turnNumber = Math.floor(Math.max(...players.map(p => p.step)) / 4) + 1;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-60" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 flex flex-col h-full max-w-[430px] mx-auto w-full">
        <header className="pt-12 pb-2 px-4 flex items-center gap-2 shrink-0">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center ios-btn border border-white/5 shrink-0"
          >
            <ArrowLeft className="text-white" size={20} />
          </button>
          <button
            onClick={onToggleAuto}
            className={`w-10 h-10 rounded-full flex items-center justify-center ios-btn border shrink-0 transition-colors ${
              autoMode
                ? 'bg-[#30D158] border-[#30D158]/50 text-white'
                : 'bg-white/10 border-white/5 text-white/60'
            }`}
            title={autoMode ? '关闭自动模式' : '开启自动模式'}
          >
            {autoMode ? <Square size={16} /> : <Play size={16} />}
          </button>
          <div className="flex-1 flex justify-center">
            <div className="p-1.5 bg-[#1C1C1E] rounded-full flex items-center gap-2 border border-white/10">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
                  currentTurn === 0
                    ? 'bg-[#0A84FF] text-white shadow-lg shadow-blue-900/50'
                    : 'text-[#0A84FF] opacity-60'
                }`}
              >
                <User size={14} />
                <span className="text-xs font-bold">{players[0].name}</span>
              </div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">
                Turn {turnNumber}
              </div>
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
                  currentTurn === 1
                    ? 'bg-[#FF375F] text-white shadow-lg shadow-pink-900/50'
                    : 'text-[#FF375F] opacity-60'
                }`}
              >
                <span className="text-xs font-bold">{players[1].name}</span>
                <UserRound size={14} />
              </div>
            </div>
          </div>
          <div className="w-10" />
        </header>

        <div className="flex-1 flex items-center justify-center px-4">
          <GameBoard
            boardMap={boardMap}
            pathCoords={pathCoords}
            players={players}
            currentTurn={currentTurn}
          />
        </div>

        <div className="h-[260px] w-full ios-glass rounded-t-[32px] flex flex-col pt-6 pb-8 px-4 border-t border-white/10 shadow-2xl shrink-0">
          <div className="flex items-start gap-2 mb-3">
            <StatusPanel
              label={players[0].name}
              role="male"
              actionStatus={maleActionStatus}
              conditionStatus={maleConditionStatus}
              color="text-[#0A84FF]"
            />
            <div className="flex-1 flex flex-col items-center gap-1 pt-1">
              <div
                className={`text-[11px] font-medium text-center ${
                  currentTurn === 0 ? 'text-[#0A84FF]' : 'text-[#FF375F]'
                }`}
              >
                {players[currentTurn].name}回合
              </div>
              <div className="text-[10px] text-gray-500">点击骰子</div>
            </div>
            <StatusPanel
              label={players[1].name}
              role="female"
              actionStatus={femaleActionStatus}
              conditionStatus={femaleConditionStatus}
              color="text-[#FF375F]"
            />
          </div>
          <div className="flex justify-center">
            <div onClick={handleRoll}>
              <Dice
                isRolling={isRolling}
                result={diceResult}
                onRollComplete={handleRollComplete}
              />
            </div>
          </div>
        </div>

        {statusNotification && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative bg-[#1C1C1E] border border-[#30D158]/30 rounded-2xl p-6 max-w-sm w-full flex flex-col items-center shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-[#30D158]/20 flex items-center justify-center mb-4">
                <Infinity className="text-[#30D158]" size={28} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">状态变化</h3>
              <p className="text-xs text-gray-400 mb-4 text-center">
                {statusNotification.target === 'both'
                  ? `${players[0].name}和${players[1].name}进入新状态`
                  : statusNotification.target === 'male'
                    ? `${players[0].name}进入新状态`
                    : `${players[1].name}进入新状态`}
              </p>
              <div className="bg-[#2C2C2E] rounded-xl px-4 py-3 w-full border border-white/5">
                <p className="text-sm text-white text-center leading-relaxed">
                  {statusNotification.description}
                </p>
              </div>
              <p className="text-[10px] text-gray-500 mt-3">
                来自「{statusNotification.sourceThemeName}」
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
