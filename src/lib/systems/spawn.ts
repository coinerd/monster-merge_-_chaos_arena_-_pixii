import { System } from '../types'
import { addEntity, addComponent } from 'bitecs'
import { Position, Velocity, Monster, Health, Enemy, AI, Collider, Mergeable, Attack } from '../components'
import { Subject } from 'rxjs'

export const spawnSystem = (
  arenaWidth: number, 
  arenaHeight: number, 
  baseSpawnInterval: number,
  monsterTypes: number,
  events$: Subject<any>
): System => {
  // Spawn timer
  let spawnTimer = baseSpawnInterval
  
  return (world: any, delta: number) => {
    // Update spawn timer
    spawnTimer -= delta
    
    // Spawn new enemy if timer expired
    if (spawnTimer <= 0) {
      // Reset timer (random between base interval and 2x base interval)
      spawnTimer = baseSpawnInterval + Math.random() * baseSpawnInterval
      
      // Determine spawn position (edge of arena)
      let x, y
      const side = Math.floor(Math.random() * 4)
      
      switch (side) {
        case 0: // Top
          x = Math.random() * arenaWidth
          y = 0
          break
        case 1: // Right
          x = arenaWidth
          y = Math.random() * arenaHeight
          break
        case 2: // Bottom
          x = Math.random() * arenaWidth
          y = arenaHeight
          break
        case 3: // Left
          x = 0
          y = Math.random() * arenaHeight
          break
      }
      
      // Create enemy entity
      const entity = addEntity(world)
      
      // Determine monster type and level
      const monsterType = Math.floor(Math.random() * monsterTypes)
      const monsterLevel = Math.min(3, 1 + Math.floor(world.time / 60)) // Level increases over time
      
      // Add components
      addComponent(world, Position, entity)
      Position.x[entity] = x
      Position.y[entity] = y
      
      addComponent(world, Velocity, entity)
      Velocity.x[entity] = 0
      Velocity.y[entity] = 0
      
      addComponent(world, Monster, entity)
      Monster.type[entity] = monsterType
      Monster.level[entity] = monsterLevel
      
      addComponent(world, Health, entity)
      Health.max[entity] = 50 * monsterLevel
      Health.current[entity] = Health.max[entity]
      
      addComponent(world, Enemy, entity)
      
      addComponent(world, AI, entity)
      AI.state[entity] = 0 // IDLE
      AI.targetEntity[entity] = -1
      AI.detectionRange[entity] = 300
      AI.decisionTimer[entity] = 1
      
      addComponent(world, Collider, entity)
      Collider.radius[entity] = 20 + (monsterLevel * 5)
      Collider.isTrigger[entity] = 0
      
      addComponent(world, Mergeable, entity)
      
      addComponent(world, Attack, entity)
      Attack.damage[entity] = 10 * monsterLevel
      Attack.range[entity] = 30
      Attack.cooldown[entity] = 1
      Attack.timer[entity] = 0
      
      // Emit spawn event
      world.events.push({
        type: 'MONSTER_SPAWNED',
        data: {
          entity,
          type: monsterType,
          level: monsterLevel,
          position: { x, y },
          isPlayerControlled: false
        }
      })
    }
    
    return world
  }
}
