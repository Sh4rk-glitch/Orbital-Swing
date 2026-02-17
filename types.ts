
export interface Vector2D {
  x: number;
  y: number;
}

export interface HookPoint {
  id: string;
  x: number;
  y: number;
}

export enum ObstacleType {
  WALL = 'STATION_STRUCTURE',
  LASER = 'HAZARD'
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
}

export interface Bouncer {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LevelData {
  id: number;
  hookPoints: HookPoint[];
  finishLineX: number;
  spawnPoint: Vector2D;
  bouncers?: Bouncer[];
  obstacles?: Obstacle[];
}

export enum GameState {
  MENU = 'MENU',
  LEVEL_SELECT = 'LEVEL_SELECT',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  EDITOR = 'EDITOR'
}
