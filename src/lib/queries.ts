import { defineQuery, hasComponent } from 'bitecs'
import { 
  Position, 
  Velocity, 
  Health, 
  Attack, 
  Monster, 
  Mergeable, 
  Collider, 
  Overlap, 
  PlayerControlled, 
  Enemy, 
  AI,
  Knockback
} from './components'

// Query for entities with position and velocity
export const movableQuery = defineQuery([Position, Velocity])

// Query for entities with knockback component
export const knockbackQuery = defineQuery([Knockback])

// Query for entities with position and velocity (for movement system)
export const movingEntityQuery = defineQuery([Position, Velocity])

// Query for entities with position and collider
export const colliderQuery = defineQuery([Position, Collider])

// Query for entities with overlap component
export const overlapQuery = defineQuery([Overlap])

// Query for entities with attack component
export const attackerQuery = defineQuery([Attack, Position])

// Query for entities with health component
export const damageableQuery = defineQuery([Health])

// Query for entities with mergeable component and overlap
export const mergeableOverlapQuery = defineQuery([Mergeable, Overlap, Monster])

// Query for entities with AI component
export const aiQuery = defineQuery([AI, Position, Velocity])

// Query for player controlled entities
export const playerQuery = defineQuery([PlayerControlled])

// Query for enemy entities
export const enemyQuery = defineQuery([Enemy])

// Query for monster entities
export const monsterQuery = defineQuery([Monster])

// Query for monster entities of a specific type
export const monsterTypeQuery = (type: number) => (world: any) => {
  const monsters = monsterQuery(world)
  return monsters.filter(entity => Monster.type[entity] === type)
}

// Query for monster entities of a specific level
export const monsterLevelQuery = (level: number) => (world: any) => {
  const monsters = monsterQuery(world)
  return monsters.filter(entity => Monster.level[entity] === level)
}

// Query for monster entities of a specific type and level
export const monsterTypeLevelQuery = (type: number, level: number) => (world: any) => {
  const monsters = monsterQuery(world)
  return monsters.filter(entity => 
    Monster.type[entity] === type && 
    Monster.level[entity] === level
  )
}
