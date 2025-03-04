import mitt from 'mitt';
import { Monster } from './gameState';

// Define event types
export type GameEvents = {
  // Monster events
  'monster:add': Monster;
  'monster:remove': string; // monster id
  'monster:damage': { id: string, amount: number };
  'monster:heal': { id: string, amount: number };
  'monster:merge': { source: string, target: string, result: Monster };
  'monster:levelup': { id: string, newLevel: number };
  
  // Player events
  'player:damage': number;
  'player:heal': number;
  'player:score': number;
  
  // Game state events
  'game:start': void;
  'game:pause': void;
  'game:resume': void;
  'game:over': void;
  'game:reset': void;
  
  // UI events
  'ui:merge_attempt': { sourceId: string, targetId: string };
  'ui:spawn_monster': { type: number, x: number, y: number };
  'ui:move_player': { entityId: number, vx: number, vy: number };
  
  // Effect events
  'effect:explosion': { x: number, y: number, scale: number };
  'effect:merge': { x: number, y: number, type: number };
};

// Create and export the event bus
export const eventBus = mitt<GameEvents>();
