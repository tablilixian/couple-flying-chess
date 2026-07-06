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
export type AppSubview = 'hub' | 'flying-home' | 'flying-game' | 'script-select' | 'script-intro' | 'script-game' | 'script-ending';

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
