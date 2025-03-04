import { MonsterMergeGame, createGame } from './lib';
import { PixiRenderer } from './lib/rendering';
import { initGameLogic, eventBus, useGameStore } from './lib/state';

// Create a simple UI to demonstrate state management
function createUI() {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '10px';
  container.style.left = '10px';
  container.style.padding = '10px';
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  container.style.color = 'white';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.borderRadius = '5px';
  container.style.zIndex = '1000';
  
  // Create player stats display
  const playerStats = document.createElement('div');
  playerStats.id = 'player-stats';
  playerStats.innerHTML = `
    <h3>Player Stats</h3>
    <div>Health: <span id="player-health">100</span></div>
    <div>Score: <span id="player-score">0</span></div>
    <div>Game Phase: <span id="game-phase">INIT</span></div>
  `;
  container.appendChild(playerStats);
  
  // Create monster list
  const monsterList = document.createElement('div');
  monsterList.id = 'monster-list';
  monsterList.innerHTML = `
    <h3>Monsters</h3>
    <ul id="monsters"></ul>
  `;
  container.appendChild(monsterList);
  
  // Create controls
  const controls = document.createElement('div');
  controls.innerHTML = `
    <h3>Controls</h3>
    <button id="start-game">Start Game</button>
    <button id="reset-game">Reset Game</button>
    <button id="spawn-monster">Spawn Random Monster</button>
  `;
  container.appendChild(controls);
  
  document.body.appendChild(container);
  
  // Add event listeners to buttons
  document.getElementById('start-game')?.addEventListener('click', () => {
    eventBus.emit('game:start');
  });
  
  document.getElementById('reset-game')?.addEventListener('click', () => {
    eventBus.emit('game:reset');
  });
  
  document.getElementById('spawn-monster')?.addEventListener('click', () => {
    const x = Math.random() * 800;
    const y = Math.random() * 600;
    const type = Math.floor(Math.random() * 4);
    eventBus.emit('ui:spawn_monster', { type, x, y });
  });
}

// Update UI based on state changes
function setupStateListeners() {
  // Subscribe to state changes
  useGameStore.subscribe(
    (state) => state.player,
    (player) => {
      document.getElementById('player-health')!.textContent = player.health.toString();
      document.getElementById('player-score')!.textContent = player.score.toString();
    }
  );
  
  useGameStore.subscribe(
    (state) => state.gamePhase,
    (gamePhase) => {
      document.getElementById('game-phase')!.textContent = gamePhase;
    }
  );
  
  useGameStore.subscribe(
    (state) => state.monsters,
    (monsters) => {
      const monstersList = document.getElementById('monsters')!;
      monstersList.innerHTML = '';
      
      monsters.forEach(monster => {
        const li = document.createElement('li');
        li.textContent = `${monster.id} - Type: ${monster.type}, Level: ${monster.level}, Health: ${monster.health}/${monster.maxHealth}`;
        monstersList.appendChild(li);
      });
    }
  );
  
  // Subscribe to events for one-off effects
  eventBus.on('monster:merge', ({ source, target, result }) => {
    console.log(`Merged monsters ${source} and ${target} into level ${result.level} monster`);
  });
  
  eventBus.on('effect:explosion', ({ x, y, scale }) => {
    console.log(`Explosion effect at (${x}, ${y}) with scale ${scale}`);
  });
}

// Initialize the demo
async function initDemo() {
  // Create UI
  createUI();
  
  // Create game instance
  const game = createGame({
    arenaWidth: 800,
    arenaHeight: 600,
    baseSpawnInterval: 3,
    monsterTypes: 4,
    maxLevel: 10,
    initialPlayerMonsters: 2
  });
  
  // Create renderer
  const renderer = new PixiRenderer({
    width: 800,
    height: 600,
    backgroundColor: 0x1a1a1a
  });
  
  // Initialize game logic with state management
  initGameLogic(game);
  
  // Set up state listeners
  setupStateListeners();
  
  // Mount renderer to DOM
  const gameContainer = document.getElementById('app');
  if (gameContainer) {
    renderer.mount(gameContainer);
  }
  
  // Connect renderer to game
  game.events$.subscribe(event => {
    renderer.handleGameEvent(event);
  });
  
  // Start the game when ready
  console.log('Game initialized. Click "Start Game" to begin.');
}

// Run the demo
document.addEventListener('DOMContentLoaded', initDemo);
