import { System } from '../types'
import { movingEntityQuery, knockbackQuery } from '../queries'
import { Position, Velocity, Knockback } from '../components'

export const movementSystem = (arenaWidth: number, arenaHeight: number): System => (world: any, delta: number) => {
  // Store delta in world for other systems to use
  world.delta = delta;
  
  // Apply velocity to position
  const movables = movingEntityQuery(world)
  
  for (let i = 0; i < movables.length; i++) {
    const entity = movables[i]
    
    // Apply velocity to position
    Position.x[entity] += Velocity.x[entity] * delta
    Position.y[entity] += Velocity.y[entity] * delta
    
    // Apply boundary constraints
    if (Position.x[entity] < 0) {
      Position.x[entity] = 0
      Velocity.x[entity] = Math.abs(Velocity.x[entity]) * 0.5 // Bounce with reduced velocity
    } else if (Position.x[entity] > arenaWidth) {
      Position.x[entity] = arenaWidth
      Velocity.x[entity] = -Math.abs(Velocity.x[entity]) * 0.5
    }
    
    if (Position.y[entity] < 0) {
      Position.y[entity] = 0
      Velocity.y[entity] = Math.abs(Velocity.y[entity]) * 0.5
    } else if (Position.y[entity] > arenaHeight) {
      Position.y[entity] = arenaHeight
      Velocity.y[entity] = -Math.abs(Velocity.y[entity]) * 0.5
    }
  }
  
  // Process knockback
  const knockbackEntities = knockbackQuery(world)
  
  for (let i = 0; i < knockbackEntities.length; i++) {
    const entity = knockbackEntities[i]
    
    if (Knockback.remaining[entity] > 0) {
      // Apply knockback force
      const force = Knockback.force[entity]
      const direction = Knockback.direction[entity]
      
      // Calculate knockback velocity
      const knockbackVelocityX = Math.cos(direction) * force
      const knockbackVelocityY = Math.sin(direction) * force
      
      // Apply to position directly
      Position.x[entity] += knockbackVelocityX * delta
      Position.y[entity] += knockbackVelocityY * delta
      
      // Reduce remaining knockback time
      Knockback.remaining[entity] -= delta
      
      // Reduce force over time
      Knockback.force[entity] *= 0.9
    }
  }
  
  return world
}
