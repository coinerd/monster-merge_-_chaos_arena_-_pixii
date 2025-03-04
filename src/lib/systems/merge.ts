import { System } from '../types'
import { mergeableOverlapQuery } from '../queries'
import { Monster, Position, Health, Overlap } from '../components'
import { removeEntity } from 'bitecs'
import { Subject } from 'rxjs'

export const mergeSystem = (events$: Subject<any>, maxLevel: number): System => (world: any, delta: number) => {
  const mergeables = mergeableOverlapQuery(world)
  
  // Process mergeable entities
  for (let i = 0; i < mergeables.length; i++) {
    const entityA = mergeables[i]
    const entityB = Overlap.entity[entityA]
    
    // Skip if already processed
    if (world.entitiesToRemove.includes(entityA) || world.entitiesToRemove.includes(entityB)) {
      continue
    }
    
    // Check if both entities are the same type and level
    if (Monster.type[entityA] === Monster.type[entityB] && 
        Monster.level[entityA] === Monster.level[entityB] &&
        Monster.level[entityA] < maxLevel) {
      
      // Determine which entity to keep (survivor) and which to remove
      const survivor = entityA
      const removed = entityB
      
      // Increase level of survivor
      Monster.level[survivor] += 1
      
      // Increase health of survivor
      Health.max[survivor] *= 1.5
      Health.current[survivor] = Health.max[survivor]
      
      // Add removed entity to removal list
      world.entitiesToRemove.push(removed)
      
      // Remove from player entities if needed
      const playerIndex = world.playerEntities.indexOf(removed)
      if (playerIndex !== -1) {
        world.playerEntities.splice(playerIndex, 1)
      }
      
      // Emit merge event
      world.events.push({
        type: 'MONSTER_MERGED',
        data: {
          survivor,
          removed,
          newLevel: Monster.level[survivor],
          isPlayerControlled: world.playerEntities.includes(survivor),
          position: {
            x: Position.x[survivor],
            y: Position.y[survivor]
          }
        }
      })
    }
  }
  
  // Remove entities marked for removal
  while (world.entitiesToRemove.length > 0) {
    const entity = world.entitiesToRemove.pop()
    removeEntity(world, entity)
  }
  
  return world
}
