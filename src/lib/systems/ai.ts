import { System } from '../types'
import { aiQuery } from '../queries'
import { Position, Velocity, AI, Monster } from '../components'

export const aiSystem = (): System => (world: any, delta: number) => {
  const entities = aiQuery(world)
  
  // Process AI entities
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i]
    
    // Update decision timer
    AI.decisionTimer[entity] -= delta
    
    // Make new decision if timer expired
    if (AI.decisionTimer[entity] <= 0) {
      // Reset timer (random between 1-3 seconds)
      AI.decisionTimer[entity] = 1 + Math.random() * 2
      
      // Find closest player entity
      let closestDistance = Infinity
      let closestEntity = -1
      
      for (let j = 0; j < world.playerEntities.length; j++) {
        const playerEntity = world.playerEntities[j]
        
        // Calculate distance
        const dx = Position.x[playerEntity] - Position.x[entity]
        const dy = Position.y[playerEntity] - Position.y[entity]
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < closestDistance) {
          closestDistance = distance
          closestEntity = playerEntity
        }
      }
      
      // Set target entity
      AI.targetEntity[entity] = closestEntity
      
      // Determine AI state based on distance
      if (closestDistance < 50) {
        // Too close, flee
        AI.state[entity] = 3 // FLEE
      } else if (closestDistance < 200) {
        // Within attack range
        AI.state[entity] = 2 // ATTACK
      } else if (closestDistance < AI.detectionRange[entity]) {
        // Within detection range, chase
        AI.state[entity] = 1 // CHASE
      } else {
        // Out of range, idle
        AI.state[entity] = 0 // IDLE
      }
    }
    
    // Act based on current state
    switch (AI.state[entity]) {
      case 0: // IDLE
        // Random wandering
        if (Math.random() < 0.05) {
          Velocity.x[entity] = (Math.random() - 0.5) * 50
          Velocity.y[entity] = (Math.random() - 0.5) * 50
        }
        break
        
      case 1: // CHASE
        if (AI.targetEntity[entity] !== -1) {
          // Move towards target
          const targetEntity = AI.targetEntity[entity]
          const dx = Position.x[targetEntity] - Position.x[entity]
          const dy = Position.y[targetEntity] - Position.y[entity]
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance > 0) {
            Velocity.x[entity] = dx / distance * 75
            Velocity.y[entity] = dy / distance * 75
          }
        }
        break
        
      case 2: // ATTACK
        // Stop moving when attacking
        Velocity.x[entity] = 0
        Velocity.y[entity] = 0
        break
        
      case 3: // FLEE
        if (AI.targetEntity[entity] !== -1) {
          // Move away from target
          const targetEntity = AI.targetEntity[entity]
          const dx = Position.x[targetEntity] - Position.x[entity]
          const dy = Position.y[targetEntity] - Position.y[entity]
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance > 0) {
            Velocity.x[entity] = -dx / distance * 100
            Velocity.y[entity] = -dy / distance * 100
          }
        }
        break
    }
  }
  
  return world
}
