import { World } from 'bitecs'

// System type
export type System = (world: World, delta: number) => World

// Component types
export enum ComponentType {
  Position,
  Velocity,
  Health,
  Attack,
  Defense,
  Monster,
  Mergeable,
  Collider,
  Overlap,
  Sprite,
  PlayerControlled,
  Enemy,
  AI,
  Knockback
}

// Monster types
export enum MonsterType {
  FIRE = 0,
  WATER = 1,
  EARTH = 2,
  AIR = 3
}

// AI states
export enum AIState {
  IDLE = 0,
  CHASE = 1,
  ATTACK = 2,
  FLEE = 3
}

// Game event types
export enum GameEventType {
  MONSTER_CREATED = 'MONSTER_CREATED',
  MONSTER_MOVED = 'MONSTER_MOVED',
  MONSTER_DAMAGED = 'MONSTER_DAMAGED',
  MONSTER_DIED = 'MONSTER_DIED',
  MONSTER_MERGED = 'MONSTER_MERGED',
  GAME_STARTED = 'GAME_STARTED',
  GAME_STOPPED = 'GAME_STOPPED',
  GAME_RESET = 'GAME_RESET',
  GAME_OVER = 'GAME_OVER'
}

// Extended World type with our custom properties
export interface GameWorld extends World {
  delta: number;
  time: number;
  events: any[];
  deadEntities: number[];
  entitiesToRemove: number[];
  playerEntities: number[];
  config: {
    arenaWidth: number;
    arenaHeight: number;
  };
}
