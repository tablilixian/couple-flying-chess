export type TileType = 'blank' | 'lucky' | 'trap' | 'status';

export type StatusSlot = 'action' | 'condition';

export type StatusTarget = 'male' | 'female' | 'both';

export interface StatusEffect {
  id: string;
  slot: StatusSlot;
  target: StatusTarget;
  description: string;
  tag: string;
  sourceThemeId: string;
  sourceThemeName: string;
}

export type PlayerStatusSlots = {
  action: StatusEffect | null;
  condition: StatusEffect | null;
};

export type PlayerRole = 'male' | 'female';

export type GameMode = 'couple' | 'normal';

export interface Player {
  id: number;
  name: string;
  color: string;
  role: PlayerRole;
  step: number;
  themeId: string | null;
}

export type ThemeAudience = 'common' | 'male' | 'female';

export interface Theme {
  id: string;
  name: string;
  desc: string;
  mode: GameMode;
  audience: ThemeAudience;
  tasks: string[];
  actionStates?: string[];
  conditionStates?: string[];
}

export interface PathCoord {
  r: number;
  c: number;
}

export interface GameState {
  view: 'home' | 'game' | 'themes';
  turn: number;
  players: Player[];
  themes: Theme[];
  boardMap: TileType[];
  pathCoords: PathCoord[];
  isRolling: boolean;
  mode: GameMode;
  maleStatus: PlayerStatusSlots;
  femaleStatus: PlayerStatusSlots;
}

export interface TaskEventData {
  type: 'collision' | 'lucky' | 'trap';
  initiatorPlayerId: number;
  executorPlayerId: number;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  task: string;
  taskSourceId: string;
}

// ===== Script/Story Mode Types =====

export type StepType = 'narration' | 'timer' | 'counter';
export type ScriptMood = 'sweet' | 'romantic' | 'intense' | 'calm';
export type AppSubview = 'hub' | 'flying-home' | 'flying-game' | 'script-select' | 'script-intro' | 'script-game' | 'script-ending' | 'truth-dare-home' | 'truth-dare-game';

export type TDDifficulty = 'soft' | 'hot' | 'hard' | 'extreme';

export type TDTheme = 'sweet' | 'spicy' | 'confession' | 'roleplay' | 'kinky' | 'bdsm' | 'taboo';

export type TDTarget = 'male' | 'female' | 'both';

export interface TDQuestion {
  type: 'truth' | 'dare';
  difficulty: TDDifficulty;
  theme: TDTheme;
  target: TDTarget;
  text: string;
}

export interface TDPenalty {
  difficulty: TDDifficulty;
  text: string;
}

export interface TDPlayer {
  name: string;
  truthCount: number;
  dareCount: number;
  penaltyCount: number;
}

export const TD_THEMES: { key: TDTheme; label: string; desc: string; color: string }[] = [
  { key: 'sweet', label: '甜蜜', desc: '温馨浪漫，适合热身', color: '#FF9F0A' },
  { key: 'spicy', label: '火辣', desc: '暧昧升温，脸红心跳', color: '#FF375F' },
  { key: 'confession', label: '坦白局', desc: '深层对话，灵魂拷问', color: '#BF5AF2' },
  { key: 'roleplay', label: '角色扮演', desc: '代入角色，玩出新花样', color: '#5E5CE6' },
  { key: 'kinky', label: '调教', desc: '主导与顺从，探索边界', color: '#FF6482' },
  { key: 'bdsm', label: '束缚', desc: '禁忌游戏，深度体验', color: '#FF453A' },
  { key: 'taboo', label: '禁忌', desc: '大胆突破，解锁幻想', color: '#8E8E93' },
];

export interface ScriptCharacter {
  role: 'male' | 'female';
  name: string;
  title: string;
  emoji: string;
  bio: string;
  color: string;
}

export interface ScriptStep {
  type: StepType;
  icon: string;
  text?: string;
  duration?: number;
  title?: string;
  desc?: string;
  target?: number;
  mood?: ScriptMood;
  isChapterEnd?: boolean;
}

export interface ScriptChapter {
  title: string;
  mood: ScriptMood;
  steps: ScriptStep[];
}

export interface Script {
  id: string;
  mode: 'couple' | 'normal';
  title: string;
  emoji: string;
  desc: string;
  tags: string[];
  duration: number;
  difficulty: number;
  endings: number;
  characters: [ScriptCharacter, ScriptCharacter];
  chapters: ScriptChapter[];
  endingTitle: string;
  endingDesc: string;
  endingIcon: string;
}

export interface StepLogEntry {
  type: StepType;
  icon: string;
  completed?: boolean;
  count?: number;
}

export interface ScriptGameSnapshot {
  chapterIndex: number;
  stepIndex: number;
  stepLog: StepLogEntry[];
  mood: ScriptMood;
}
