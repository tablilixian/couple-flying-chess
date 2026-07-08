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
export type AppSubview = 'hub' | 'flying-home' | 'flying-game' | 'script-select' | 'script-intro' | 'script-game' | 'script-ending' | 'truth-dare-home' | 'truth-dare-game' | 'immersive-select' | 'immersive-game';

export type TDDifficulty = 'soft' | 'hot' | 'hard' | 'extreme';

export type TDTheme = 'sweet' | 'spicy' | 'confession' | 'roleplay' | 'kinky' | 'bdsm' | 'taboo' | 'dirtytalk' | 'slutwife' | 'swing' | 'exposure';

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

export interface ThemeConfig {
  key: TDTheme;
  label: string;
  desc: string;
  color: string;
}

export const COUPLE_THEMES: ThemeConfig[] = [
  { key: 'sweet',      label: '甜蜜',     desc: '温馨浪漫，适合热身',   color: '#FF9F0A' },
  { key: 'spicy',      label: '火辣',     desc: '暧昧升温，脸红心跳',   color: '#FF375F' },
  { key: 'confession', label: '坦白局',   desc: '深层对话，灵魂拷问',   color: '#BF5AF2' },
  { key: 'roleplay',   label: '角色扮演', desc: '代入角色，玩出新花样', color: '#5E5CE6' },
  { key: 'kinky',      label: '调教',     desc: '主导与顺从，探索边界', color: '#FF6482' },
  { key: 'bdsm',       label: '束缚',     desc: '禁忌游戏，深度体验',   color: '#FF453A' },
  { key: 'taboo',      label: '禁忌',     desc: '大胆突破，解锁幻想',   color: '#8E8E93' },
  { key: 'dirtytalk',  label: '脏话',     desc: '言语挑逗，粗口刺激',     color: '#FF6B35' },
  { key: 'slutwife',   label: '淫荡妻子', desc: '暴露幻想，多P想象',       color: '#FF2D55' },
  { key: 'swing',      label: '交换',     desc: '伴侣共享，换偶幻想',       color: '#FF6482' },
  { key: 'exposure',   label: '户外露出', desc: '公共场合暴露体验',         color: '#00C853' },
];

export const NORMAL_THEMES: ThemeConfig[] = [
  { key: 'sweet',      label: '甜蜜',     desc: '温馨浪漫，适合热身',   color: '#FF9F0A' },
  { key: 'confession', label: '坦白局',   desc: '深层对话，灵魂拷问',   color: '#BF5AF2' },
  { key: 'roleplay',   label: '角色扮演', desc: '代入角色，玩出新花样', color: '#5E5CE6' },
];

// 通用查找表（包含所有不重复的主题）
export const TD_THEMES: ThemeConfig[] = COUPLE_THEMES;

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

// ===== 沉浸剧场 Types =====

export type ISActor = 0 | 1 | 'both';

export type ISStepType = 'command' | 'question' | 'action' | 'narration' | 'choice';

export interface ISStep {
  type: ISStepType;
  text: string;
  actor: ISActor;
  note?: string;
  options?: { label: string; nextStep?: number }[];
  suggestions?: string[];
}

export interface ISAct {
  title: string;
  desc?: string;
  steps: ISStep[];
}

export type Act = ISAct;

export interface Scenario {
  id: string;
  mode: GameMode;
  title: string;
  emoji: string;
  desc: string;
  roles: [string, string];
  roleEmojis: [string, string];
  difficulty: TDDifficulty;
  estimatedMinutes: number;
  acts: ISAct[];
  definitions?: { term: string; meaning: string }[];
}
