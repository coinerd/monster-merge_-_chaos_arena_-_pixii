import { Game } from '../game';
import { eventBus } from './eventBus';
import { useGameStore, Monster } from './gameState';
import { v4 as uuidv4 } from 'uuid';

// Store a reference to the game instance
let gameInstance: Game | null = null;

/**
 * Initialize game logic with state management
 */
export function initGameLogic(game: Game): void {
  // Store game instance for later access
  gameInstance = game;
  
  // Get store actions
  const { 
    addMonster, 
    removeMonster, 
    updateMonster, 
    increaseScore, 
    setGamePhase,
    resetGame
  } = useGameStore.getState();
  
  // Subscribe to game events
  game.events$.subscribe(event => {
    switch (event.type) {
      case 'MONSTER_CREATED':
        // Add monster to state
        const { entity, type, position, isPlayerControlled } = event.data;
        
        const monster: Monster = {
          id: uuidv4(),
          entityId: entity,
          type,
          level: 1,
          health: 100,
          maxHealth: 100,
          position: {
            x: position.x,
            y: position.y
          },
          isPlayerControlled
        };
        
        addMonster(monster);
        break;
        
      case 'MONSTER_MOVED':
        // Update monster position
        const { entity: movedEntity, position: newPosition } = event.data;
        
        // Find monster in state
        const monsters = useGameStore.getState().monsters;
        const movedMonster = monsters.find(m => m.entityId === movedEntity);
        
        if (movedMonster) {
          updateMonster(movedMonster.id, {
            position: {
              x: newPosition.x,
              y: newPosition.y
            }
          });
        }
        break;
        
      case 'MONSTER_DAMAGED':
        // Update monster health
        const { entity: damagedEntity, damage, currentHealth } = event.data;
        
        // Find monster in state
        const allMonsters = useGameStore.getState().monsters;
        const damagedMonster = allMonsters.find(m => m.entityId === damagedEntity);
        
        if (damagedMonster) {
          updateMonster(damagedMonster.id, {
            health: currentHealth
          });
        }
        break;
        
      case 'MONSTER_DIED':
        // Remove monster from state
        const { entity: deadEntity, isPlayerControlled: wasPlayerControlled } = event.data;
        
        // Find monster in state
        const stateMonsters = useGameStore.getState().monsters;
        const deadMonster = stateMonsters.find(m => m.entityId === deadEntity);
        
        if (deadMonster) {
          removeMonster(deadMonster.id);
          
          // If it was an enemy, increase score
          if (!wasPlayerControlled) {
            increaseScore(10);
            eventBus.emit('player:score', 10);
          }
        }
        break;
        
      case 'MONSTER_MERGED':
        // Update merged monster
        const { survivor, removed, newLevel, isPlayerControlled: mergedByPlayer } = event.data;
        
        // Find monsters in state
        const currentMonsters = useGameStore.getState().monsters;
        const survivorMonster = currentMonsters.find(m => m.entityId === survivor);
        const removedMonster = currentMonsters.find(m => m.entityId === removed);
        
        if (survivorMonster && removedMonster) {
          // Update survivor
          updateMonster(survivorMonster.id, {
            level: newLevel,
            health: 100,
            maxHealth: 100
          });
          
          // Remove merged monster
          removeMonster(removedMonster.id);
          
          // If player controlled, increase score
          if (mergedByPlayer) {
            const scoreIncrease = newLevel * 5;
            increaseScore(scoreIncrease);
            eventBus.emit('player:score', scoreIncrease);
          }
        }
        break;
        
      case 'GAME_STARTED':
        setGamePhase('PLAYING');
        break;
        
      case 'GAME_STOPPED':
        setGamePhase('GAME_OVER');
        break;
        
      case 'GAME_RESET':
        resetGame();
        setGamePhase('INIT');
        break;
    }
  });
  
  // Listen for UI events
  eventBus.on('ui:spawn_monster', (data) => {
    const { type, x, y } = data;
    game.createPlayerMonster(x, y, type);
  });
  
  // Listen for game control events
  eventBus.on('game:start', () => {
    game.start();
  });
  
  eventBus.on('game:reset', () => {
    game.reset();
  });
}

/**
 * Get the current game state
 */
export function getGameState() {
  return useGameStore.getState();
}

/**
 * Get the game instance
 */
export function getGameInstance(): Game | null {
  return gameInstance;
}
