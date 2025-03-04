import { createWorld, pipe } from 'bitecs'
import { Subject } from 'rxjs'

// Import systems
import { movementSystem, knockbackSystem, boundarySystem } from './systems/movement'
import { collisionSystem } from './systems/collision'
import { attackSystem, healthSystem } from './systems/combat'
import { mergeSystem } from './systems/merge'
import { aiSystem, aiAttackSystem } from './systems/ai'
import { spawnSystem, createPlayerMonster } from './systems/spawn'

// Import types
import { GameWorld, GameConfig, GameEvent } from './types'

// Default game configuration
const DEFAULT_CONFIG: GameConfig = {
  arenaWidth: 800,
  arenaHeight: 600,
  baseSpawnInterval: 3, // seconds
  monsterTypes: 5,
  maxLevel: 10,
  initialPlayerMonsters: 3
}

export class MonsterMergeGame {
  private world: GameWorld
  private pipeline: (world: GameWorld) => GameWorld
  private running: boolean = false
  private lastTime: number = 0
  
  // Observable for game events
  public events$ = new Subject<GameEvent>()
  
  constructor(config: Partial<GameConfig> = {}) {
    // Create world with custom properties
    this.world = createWorld() as GameWorld
    
    // Initialize world properties
    this.world.delta = 0
    this.world.time = 0
    this.world.events = []
    this.world.deadEntities = []
    this.world.entitiesToRemove = []
    this.world.playerEntities = []
    this.world.config = { ...DEFAULT_CONFIG, ...config }
    
    // Create system pipeline
    this.pipeline = pipe(
      // Time system (updates delta)
      (world) => {
        const now = performance.now()
        world.delta = (now - this.lastTime) / 1000 // Convert to seconds
        world.time += world.delta
        this.lastTime = now
        return world
      },
      // Game systems
      spawnSystem,
      aiSystem,
      movementSystem,
      knockbackSystem,
      collisionSystem,
      attackSystem,
      aiAttackSystem,
      mergeSystem,
      healthSystem,
      boundarySystem,
      // Event system (emits events)
      (world) => {
        // Process and emit events
        while (world.events.length > 0) {
          const event = world.events.shift()
          if (event) {
            this.events$.next(event)
          }
        }
        return world
      }
    )
  }
  
  /**
   * Initialize the game with starting entities
   */
  public init(): void {
    this.lastTime = performance.now()
    
    // Create initial player monsters
    const { arenaWidth, arenaHeight, initialPlayerMonsters } = this.world.config
    
    for (let i = 0; i < initialPlayerMonsters; i++) {
      // Position in center area
      const x = arenaWidth / 2 + (Math.random() * 100 - 50)
      const y = arenaHeight / 2 + (Math.random() * 100 - 50)
      
      // Random monster type
      const type = Math.floor(Math.random() * this.world.config.monsterTypes)
      
      // Create player monster
      createPlayerMonster(this.world, x, y, type)
    }
  }
  
  /**
   * Start the game loop
   */
  public start(): void {
    if (this.running) return
    
    this.running = true
    this.lastTime = performance.now()
    this.tick()
  }
  
  /**
   * Stop the game loop
   */
  public stop(): void {
    this.running = false
  }
  
  /**
   * Game loop tick
   */
  private tick = (): void => {
    if (!this.running) return
    
    // Run all systems
    this.pipeline(this.world)
    
    // Schedule next tick
    requestAnimationFrame(this.tick)
  }
  
  /**
   * Get current game state for rendering
   */
  public getState() {
    return {
      world: this.world,
      time: this.world.time
    }
  }
  
  /**
   * Create a new player monster
   */
  public createPlayerMonster(x: number, y: number, type: number, level: number = 1): number {
    return createPlayerMonster(this.world, x, y, type, level)
  }
  
  /**
   * Move a player monster
   */
  public movePlayerMonster(entityId: number, velocityX: number, velocityY: number): void {
    const { Velocity } = require('./components')
    
    if (Velocity.x[entityId] !== undefined) {
      Velocity.x[entityId] = velocityX
      Velocity.y[entityId] = velocityY
    }
  }
  
  /**
   * Get all entities with specific components
   */
  public getEntitiesWith(...componentQueries: any[]): number[] {
    const { defineQuery } = require('bitecs')
    const query = defineQuery(componentQueries)
    return query(this.world)
  }
}

// Export factory function
export function createGame(config?: Partial<GameConfig>): MonsterMergeGame {
  return new MonsterMergeGame(config)
}
