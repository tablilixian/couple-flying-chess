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
