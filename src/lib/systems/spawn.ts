import { System } from '../types'
import { addEntity, addComponent } from 'bitecs'
import { 
  Position, 
  Velocity, 
  Health, 
  Attack, 
  Defense, 
  Monster, 
  Mergeable, 
  Collider, 
  AI, 
  Enemy, 
  Sprite,
  PlayerControlled
} from '../components'

export const spawnSystem: System = (world) => {
  // Check if it's time to spawn new monsters
  if (!world.spawnTimer) {
    world.spawnTimer = 0
  }
  
  world.spawnTimer -= world.delta
  
  if (world.spawnTimer <= 0) {
    // Reset spawn timer with some randomness
    world.spawnTimer = world.config.baseSpawnInterval * (0.8 + Math.random() * 0.4)
    
    // Determine how many monsters to spawn
    const spawnCount = Math.floor(Math.random() * 3) + 1
    
    for (let i = 0; i < spawnCount; i++) {
      spawnMonster(world)
    }
  }
  
  return world
}

function spawnMonster(world) {
  const { arenaWidth, arenaHeight } = world.config
  
  // Create new entity
  const entity = addEntity(world)
  
  // Determine spawn position (near edges)
  let x, y
  const side = Math.floor(Math.random() * 4)
  
  switch (side) {
    case 0: // Top
      x = Math.random() * arenaWidth
      y = 20
      break
    case 1: // Right
      x = arenaWidth - 20
      y = Math.random() * arenaHeight
      break
    case 2: // Bottom
      x = Math.random() * arenaWidth
      y = arenaHeight - 20
      break
    case 3: // Left
      x = 20
      y = Math.random() * arenaHeight
      break
  }
  
  // Determine monster type and level
  const monsterType = Math.floor(Math.random() * world.config.monsterTypes)
  const monsterLevel = Math.floor(Math.random() * 3) + 1 // Level 1-3
  
  // Add components
  addComponent(world, Position, entity)
  Position.x[entity] = x
  Position.y[entity] = y
  
  addComponent(world, Velocity, entity)
  Velocity.x[entity] = 0
  Velocity.y[entity] = 0
  
  addComponent(world, Health, entity)
  Health.max[entity] = 50 * monsterLevel
  Health.current[entity] = Health.max[entity]
  
  addComponent(world, Attack, entity)
  Attack.damage[entity] = 10 * monsterLevel
  Attack.range[entity] = 30 + (monsterLevel * 5)
  Attack.cooldown[entity] = 1.5 - (monsterLevel * 0.2)
  Attack.timer[entity] = 0
  
  addComponent(world, Defense, entity)
  Defense.value[entity] = 5 * monsterLevel
  
  addComponent(world, Monster, entity)
  Monster.type[entity] = monsterType
  Monster.level[entity] = monsterLevel
  
  addComponent(world, Mergeable, entity)
  Mergeable.canMerge[entity] = 1
  
  addComponent(world, Collider, entity)
  Collider.radius[entity] = 15 + (monsterLevel * 3)
  Collider.isTrigger[entity] = 0
  
  addComponent(world, AI, entity)
  AI.state[entity] = 0 // Idle
  AI.targetEntity[entity] = 0
  AI.detectionRange[entity] = 150 + (monsterLevel * 20)
  AI.decisionTimer[entity] = Math.random() * 2
  
  addComponent(world, Enemy, entity)
  
  addComponent(world, Sprite, entity)
  Sprite.typeId[entity] = monsterType
  Sprite.animationFrame[entity] = 0
  Sprite.scale[entity] = 1 + (monsterLevel * 0.2)
  Sprite.rotation[entity] = 0
  Sprite.opacity[entity] = 1
  
  // Emit spawn event for rendering/effects
  world.events.push({
    type: 'MONSTER_SPAWNED',
    data: {
      entity,
      type: monsterType,
      level: monsterLevel,
      position: { x, y }
    }
  })
  
  return entity
}

export const createPlayerMonster = (world, x, y, type, level = 1) => {
  // Create new entity
  const entity = addEntity(world)
  
  // Add components
  addComponent(world, Position, entity)
  Position.x[entity] = x
  Position.y[entity] = y
  
  addComponent(world, Velocity, entity)
  Velocity.x[entity] = 0
  Velocity.y[entity] = 0
  
  addComponent(world, Health, entity)
  Health.max[entity] = 100 * level
  Health.current[entity] = Health.max[entity]
  
  addComponent(world, Attack, entity)
  Attack.damage[entity] = 15 * level
  Attack.range[entity] = 40 + (level * 5)
  Attack.cooldown[entity] = 1.0 - (level * 0.1)
  Attack.timer[entity] = 0
  
  addComponent(world, Defense, entity)
  Defense.value[entity] = 10 * level
  
  addComponent(world, Monster, entity)
  Monster.type[entity] = type
  Monster.level[entity] = level
  
  addComponent(world, Mergeable, entity)
  Mergeable.canMerge[entity] = 1
  
  addComponent(world, Collider, entity)
  Collider.radius[entity] = 20 + (level * 4)
  Collider.isTrigger[entity] = 0
  
  addComponent(world, Sprite, entity)
  Sprite.typeId[entity] = type
  Sprite.animationFrame[entity] = 0
  Sprite.scale[entity] = 1 + (level * 0.25)
  Sprite.rotation[entity] = 0
  Sprite.opacity[entity] = 1
  
  // Add player controlled tag
  addComponent(world, PlayerControlled, entity)
  
  // Add to player entities list
  if (!world.playerEntities) {
    world.playerEntities = []
  }
  world.playerEntities.push(entity)
  
  return entity
}
