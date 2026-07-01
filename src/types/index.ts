export type TileType = 'blank' | 'lucky' | 'trap';

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
