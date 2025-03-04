import { System } from '../types'
import { attackerQuery, damageableQuery, overlapQuery } from '../queries'
import { Position, Attack, Health, Overlap, Knockback } from '../components'
import { addComponent } from 'bitecs'
import { Subject } from 'rxjs'

export const combatSystem = (events$: Subject<any>): System => (world: any, delta: number) => {
  const attackers = attackerQuery(world)
  
  // Process attackers
  for (let i = 0; i < attackers.length; i++) {
    const attacker = attackers[i]
    
    // Update attack cooldown
    if (Attack.timer[attacker] > 0) {
      Attack.timer[attacker] -= delta
    }
    
    // Check if can attack
    if (Attack.timer[attacker] <= 0) {
      // Find overlapping entities
      const overlaps = overlapQuery(world)
      
      for (let j = 0; j < overlaps.length; j++) {
        const entity = overlaps[j]
        
        // Skip if not the attacker
        if (entity !== attacker) continue
        
        // Get target entity
        const target = Overlap.entity[entity]
        
        // Check if target has health
        if (Health.current[target] !== undefined) {
          // Calculate damage
          const damage = Attack.damage[attacker]
          
          // Apply damage
          Health.current[target] = Math.max(0, Health.current[target] - damage)
          
          // Reset attack timer
          Attack.timer[attacker] = Attack.cooldown[attacker]
          
          // Apply knockback
          if (!Knockback.remaining) {
            addComponent(world, Knockback, target)
          }
          
          // Calculate knockback direction
          const dx = Position.x[target] - Position.x[attacker]
          const dy = Position.y[target] - Position.y[attacker]
          const angle = Math.atan2(dy, dx)
          
          Knockback.force[target] = 200
          Knockback.direction[target] = angle
          Knockback.remaining[target] = 0.2
          
          // Emit damage event
          world.events.push({
            type: 'MONSTER_DAMAGED',
            data: {
              entity: target,
              damage,
              currentHealth: Health.current[target],
              position: {
                x: Position.x[target],
                y: Position.y[target]
              }
            }
          })
          
          // Check if target died
          if (Health.current[target] <= 0) {
            // Add to dead entities list
            world.deadEntities.push(target)
            
            // Emit death event
            world.events.push({
              type: 'MONSTER_DIED',
              data: {
                entity: target,
                isPlayerControlled: world.playerEntities.includes(target)
              }
            })
          }
          
          break
        }
      }
    }
  }
  
  // Remove dead entities
  while (world.deadEntities.length > 0) {
    const entity = world.deadEntities.pop()
    world.entitiesToRemove.push(entity)
    
    // Remove from player entities if needed
    const playerIndex = world.playerEntities.indexOf(entity)
    if (playerIndex !== -1) {
      world.playerEntities.splice(playerIndex, 1)
    }
  }
  
  return world
}
