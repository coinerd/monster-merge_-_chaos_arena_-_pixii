// Export state management components
export { useGameStore } from './gameState';
export type { GameState, Monster } from './gameState';

export { eventBus } from './eventBus';
export type { GameEvents } from './eventBus';

export { 
  initGameLogic, 
  getGameState, 
  getGameInstance 
} from './gameLogic';
