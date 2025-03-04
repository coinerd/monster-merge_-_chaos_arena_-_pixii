import { createWorld, addEntity, addComponent, removeEntity } from 'bitecs';
import { Subject } from 'rxjs';
import { Position, Velocity, Monster, Health, PlayerControlled } from './components';
import { movementSystem } from './systems/movement';
import { collisionSystem } from './systems/collision';
import { combatSystem } from './systems/combat';
import { mergeSystem } from './systems/merge';
import { aiSystem } from './systems/ai';
import { spawnSystem } from './systems/spawn';
import { MonsterType } from './rendering/monster-sprites';

// Game configuration
export interface GameConfig {
  arenaWidth: number;
  arenaHeight: number;
  baseSpawnInterval: number;
  monsterTypes: number;
  maxLevel: number;
  initialPlayerMonsters: number;
}

// Default configuration
const DEFAULT_CONFIG: GameConfig = {
  arenaWidth: 800,
  arenaHeight: 600,
  baseSpawnInterval: 5,
  monsterTypes: 4,
  maxLevel: 10,
  initialPlayerMonsters: 3
};

// Game event types
export type GameEvent = 
  | { type: 'MONSTER_CREATED', data: { entity: number, type: MonsterType, position: { x: number, y: number }, isPlayerControlled: boolean } }
  | { type: 'MONSTER_MOVED', data: { entity: number, position: { x: number, y: number } } }
  | { type: 'MONSTER_DAMAGED', data: { entity: number, damage: number, currentHealth: number } }
  | { type: 'MONSTER_DIED', data: { entity: number, isPlayerControlled: boolean } }
  | { type: 'MONSTER_MERGED', data: { survivor: number, removed: number, newLevel: number, isPlayerControlled: boolean } }
  | { type: 'GAME_STARTED', data: null }
  | { type: 'GAME_STOPPED', data: null }
  | { type: 'GAME_RESET', data: null };

// Game class
export class Game {
  private world: any;
  private config: GameConfig;
  private running = false;
  private lastTime = 0;
  private systems: Array<(world: any, delta: number) => void> = [];
  
  // Event stream
  public events$ = new Subject<GameEvent>();
  
  constructor(config: Partial<GameConfig> = {}) {
    // Merge provided config with defaults
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize world
    this.initWorld();
    
    // Initialize systems
    this.initSystems();
    
    // Create initial player monsters
    this.createInitialPlayerMonsters();
  }
  
  private initWorld() {
    // Create a new world
    this.world = createWorld();
    
    // Add necessary properties to world
    this.world.delta = 0;
    this.world.time = 0;
    this.world.events = [];
    this.world.deadEntities = [];
    this.world.entitiesToRemove = [];
    this.world.playerEntities = [];
    this.world.config = {
      arenaWidth: this.config.arenaWidth,
      arenaHeight: this.config.arenaHeight
    };
  }
  
  private initSystems() {
    // Add all game systems
    this.systems = [
      movementSystem(this.config.arenaWidth, this.config.arenaHeight),
      collisionSystem(),
      combatSystem(this.events$),
      mergeSystem(this.events$, this.config.maxLevel),
      aiSystem(),
      spawnSystem(this.config.arenaWidth, this.config.arenaHeight, this.config.baseSpawnInterval, this.config.monsterTypes, this.events$)
    ];
  }
  
  private createInitialPlayerMonsters() {
    // Create initial player monsters
    for (let i = 0; i < this.config.initialPlayerMonsters; i++) {
      // Calculate position
      const x = Math.random() * (this.config.arenaWidth * 0.8) + (this.config.arenaWidth * 0.1);
      const y = Math.random() * (this.config.arenaHeight * 0.3) + (this.config.arenaHeight * 0.6);
      
      // Create monster
      this.createPlayerMonster(x, y);
    }
  }
  
  /**
   * Create a player-controlled monster
   */
  public createPlayerMonster(x: number, y: number, type?: MonsterType): number {
    // Create entity
    const entity = addEntity(this.world);
    
    // Determine monster type
    const monsterType = type !== undefined ? type : Math.floor(Math.random() * this.config.monsterTypes) as MonsterType;
    
    // Add components
    addComponent(this.world, Position, entity);
    Position.x[entity] = x;
    Position.y[entity] = y;
    
    addComponent(this.world, Velocity, entity);
    Velocity.x[entity] = 0;
    Velocity.y[entity] = 0;
    
    addComponent(this.world, Monster, entity);
    Monster.type[entity] = monsterType;
    Monster.level[entity] = 1;
    
    addComponent(this.world, Health, entity);
    Health.current[entity] = 100;
    Health.max[entity] = 100;
    
    // Mark as player controlled
    addComponent(this.world, PlayerControlled, entity);
    
    // Track player entities
    this.world.playerEntities.push(entity);
    
    // Emit event
    this.events$.next({
      type: 'MONSTER_CREATED',
      data: {
        entity,
        type: monsterType,
        position: { x, y },
        isPlayerControlled: true
      }
    });
    
    return entity;
  }
  
  /**
   * Move a player-controlled monster
   */
  public movePlayerMonster(entity: number, velocityX: number, velocityY: number): void {
    Velocity.x[entity] = velocityX;
    Velocity.y[entity] = velocityY;
    
    // Emit event
    this.events$.next({
      type: 'MONSTER_MOVED',
      data: {
        entity,
        position: { x: Position.x[entity], y: Position.y[entity] }
      }
    });
  }
  
  /**
   * Start the game loop
   */
  public start() {
    if (!this.running) {
      this.running = true;
      this.lastTime = performance.now();
      
      // Emit game started event
      this.events$.next({
        type: 'GAME_STARTED',
        data: null
      });
      
      // Start game loop
      requestAnimationFrame(this.update.bind(this));
    }
  }
  
  /**
   * Stop the game loop
   */
  public stop() {
    this.running = false;
    
    // Emit game stopped event
    this.events$.next({
      type: 'GAME_STOPPED',
      data: null
    });
  }
  
  /**
   * Reset the game
   */
  public reset() {
    // Stop the game
    this.stop();
    
    // Initialize a new world
    this.initWorld();
    
    // Reinitialize systems
    this.initSystems();
    
    // Create initial player monsters
    this.createInitialPlayerMonsters();
    
    // Emit game reset event
    this.events$.next({
      type: 'GAME_RESET',
      data: null
    });
  }
  
  /**
   * Game update loop
   */
  private update(time: number) {
    if (!this.running) return;
    
    // Calculate delta time
    const delta = (time - this.lastTime) / 1000;
    this.lastTime = time;
    
    // Update world time
    this.world.time += delta;
    
    // Run all systems
    for (const system of this.systems) {
      system(this.world, delta);
    }
    
    // Process world events
    while (this.world.events.length > 0) {
      const event = this.world.events.shift();
      this.events$.next(event);
    }
    
    // Continue loop
    requestAnimationFrame(this.update.bind(this));
  }
}

/**
 * Create a new game instance
 */
export function createGame(config?: Partial<GameConfig>): Game {
  return new Game(config);
}
