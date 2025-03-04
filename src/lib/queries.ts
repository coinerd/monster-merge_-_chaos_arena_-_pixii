import { defineQuery } from 'bitecs'
import {
  Position,
  Velocity,
  Collider,
  Monster,
  Health,
  AI,
  PlayerControlled,
  Attack,
  Knockback,
  Overlap,
  Mergeable
} from './components'

// Query for all monsters
export const monsterQuery = defineQuery([Position, Monster])

// Query for monsters with velocity
export const movementQuery = defineQuery([Position, Velocity])

// Query for entities that can move (same as movementQuery)
export const movableQuery = defineQuery([Position, Velocity])

// Query for entities with colliders
export const colliderQuery = defineQuery([Position, Collider])

// Query for entities with overlap component
export const overlapQuery = defineQuery([Overlap])

// Query for mergeable entities that are overlapping
export const mergeableOverlapQuery = defineQuery([Mergeable, Overlap])

// Query for monsters with health
export const healthQuery = defineQuery([Health])

// Query for monsters with AI
export const aiQuery = defineQuery([AI, Position, Velocity])

// Query for monsters with AI and attack capability
export const aiAttackQuery = defineQuery([AI, Position, Attack])

// Query for player controlled monsters
export const playerQuery = defineQuery([PlayerControlled])

// Query for monsters that can attack
export const attackQuery = defineQuery([Attack, Position])

// Query for entities with knockback effect
export const knockbackQuery = defineQuery([Position, Knockback])

// Query for entities that can attack
export const attackerQuery = defineQuery([Attack])

// Query for entities that can be damaged
export const damageableQuery = defineQuery([Health])
