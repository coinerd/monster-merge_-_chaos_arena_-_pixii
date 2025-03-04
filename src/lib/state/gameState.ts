import { create } from 'zustand';
import { MonsterType } from '../rendering/monster-sprites';

// Define your game state shape
export interface GameState {
  monsters: Monster[];
  player: {
    health: number;
    score: number;
  };
  gamePhase: 'INIT' | 'PLAYING' | 'GAME_OVER';
  // Action methods to update state
  addMonster: (monster: Monster) => void;
  removeMonster: (id: string) => void;
  updateMonster: (id: string, updates: Partial<Monster>) => void;
  damagePlayer: (amount: number) => void;
  increaseScore: (amount: number) => void;
  setGamePhase: (phase: GameState['gamePhase']) => void;
  resetGame: () => void;
}

// Define a Monster type
export interface Monster {
  id: string;
  entityId: number; // Reference to the ECS entity
  type: MonsterType;
  level: number;
  health: number;
  maxHealth: number;
  position: {
    x: number;
    y: number;
  };
  isPlayerControlled: boolean;
}

// Initial state
const initialState = {
  monsters: [],
  player: { health: 100, score: 0 },
  gamePhase: 'INIT' as const,
};

// Create the store
export const useGameStore = create<GameState>((set) => ({
  ...initialState,
  
  addMonster: (monster) =>
    set((state) => ({ monsters: [...state.monsters, monster] })),
    
  removeMonster: (id) =>
    set((state) => ({
      monsters: state.monsters.filter((monster) => monster.id !== id)
    })),
    
  updateMonster: (id, updates) =>
    set((state) => ({
      monsters: state.monsters.map((monster) => 
        monster.id === id ? { ...monster, ...updates } : monster
      )
    })),
    
  damagePlayer: (amount) =>
    set((state) => {
      const newHealth = Math.max(state.player.health - amount, 0);
      return {
        player: {
          ...state.player,
          health: newHealth
        }
      };
    }),
    
  increaseScore: (amount) =>
    set((state) => ({
      player: {
        ...state.player,
        score: state.player.score + amount
      }
    })),
    
  setGamePhase: (phase) => set({ gamePhase: phase }),
  
  resetGame: () => set(initialState),
}));
