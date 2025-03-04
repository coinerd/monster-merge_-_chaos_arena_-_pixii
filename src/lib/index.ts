// Export all components
export * from './components';

// Export all systems
export * from './systems';

// Export game
export * from './game';

// Export types
export * from './types';

// Export queries
export * from './queries';

// Export rendering
export * from './rendering';

// Export state
export * from './state';

// Import necessary dependencies directly
import { addEntity, addComponent } from 'bitecs';
import { Position, Velocity, Monster, Health, PlayerControlled } from './components';

// Re-export createPlayerMonster for convenience
export function createPlayerMonster(world: any, x: number, y: number, type: number, level: number = 1): number {
  // This is a helper function that creates a player monster directly in the world
  // It's useful for testing and demos
  
  // Create entity
  const entity = addEntity(world);
  
  // Add components
  addComponent(world, Position, entity);
  Position.x[entity] = x;
  Position.y[entity] = y;
  
  addComponent(world, Velocity, entity);
  Velocity.x[entity] = 0;
  Velocity.y[entity] = 0;
  
  addComponent(world, Monster, entity);
  Monster.type[entity] = type;
  Monster.level[entity] = level;
  
  addComponent(world, Health, entity);
  Health.current[entity] = 100;
  Health.max[entity] = 100;
  
  // Mark as player controlled
  addComponent(world, PlayerControlled, entity);
  
  // Track player entities
  if (!world.playerEntities) {
    world.playerEntities = [];
  }
  world.playerEntities.push(entity);
  
  return entity;
}
