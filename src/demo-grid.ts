import './style.css';
import * as PIXI from 'pixi.js';
import { createGame } from './lib';
import { PixiRenderer, MonsterGrid, MonsterType } from './lib/rendering';
import { initGameLogic, eventBus, useGameStore } from './lib/state';

// Debug flag
const DEBUG = true;

// Debug logging function
function debug(...args) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}

// Store references to DOM elements we create
const createdElements = new Set<HTMLElement>();

// Store event listeners for cleanup
const eventListeners: Array<{element: HTMLElement | Window, type: string, handler: EventListenerOrEventListenerObject}> = [];

// Store subscriptions for cleanup
const subscriptions: Array<{unsubscribe: () => void}> = [];

// Store PIXI resources for cleanup
let pixiRenderer: PixiRenderer | null = null;
let monsterGrid: MonsterGrid | null = null;
let gameInstance: any = null;

// Flag to prevent multiple initializations
let isInitialized = false;

// Initialize demo
function initializeDemo() {
  // Prevent multiple initializations
  if (isInitialized) {
    debug('Demo already initialized, skipping');
    return;
  }
  
  isInitialized = true;
  debug('Initializing demo');
  
  // Create app container
  const appContainer = document.querySelector<HTMLDivElement>('#app');
  if (!appContainer) {
    console.error('App container not found!');
    return;
  }
  
  appContainer.innerHTML = `
    <h2>Monster Grid Demo</h2>
    <p>This demo shows the 5x5 monster grid with shop functionality.</p>
  `;
  debug('App container initialized');

  // Create game container
  const gameContainer = document.createElement('div');
  gameContainer.className = 'game-container';
  gameContainer.style.position = 'relative';
  gameContainer.style.width = '800px';
  gameContainer.style.height = '600px';
  gameContainer.style.margin = '0 auto';
  gameContainer.style.overflow = 'hidden';
  gameContainer.style.border = '1px solid #666'; // Add border to see container
  gameContainer.style.backgroundColor = '#333'; // Add background color
  appContainer.appendChild(gameContainer);
  createdElements.add(gameContainer);
  debug('Game container created and added to DOM');

  // Add debug info for asset paths
  if (DEBUG) {
    console.log('Current base URL:', window.location.href);
    console.log('Expected monster assets path:', new URL('/monsters/fire.svg', window.location.href).href);
    
    // Check if assets exist
    fetch('/monsters/fire.svg')
      .then(response => {
        if (response.ok) {
          console.log('✅ Fire monster SVG found!');
        } else {
          console.error('❌ Fire monster SVG not found!', response.status);
        }
      })
      .catch(error => console.error('❌ Error checking fire monster SVG:', error));
  }

  // Create game instance
  gameInstance = createGame({
    arenaWidth: 800,
    arenaHeight: 600,
    baseSpawnInterval: 3,
    monsterTypes: 4,
    maxLevel: 10,
    initialPlayerMonsters: 0 // Start with no monsters
  });
  debug('Game instance created');

  // Create notification system
  function showNotification(message: string, type: 'info' | 'success' | 'error' = 'info') {
    debug('Showing notification:', message, type);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style notification
    notification.style.position = 'absolute';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.color = 'white';
    notification.style.fontFamily = 'Arial, sans-serif';
    notification.style.zIndex = '1000';
    
    // Set background color based on type
    switch (type) {
      case 'info':
        notification.style.backgroundColor = 'rgba(33, 150, 243, 0.9)';
        break;
      case 'success':
        notification.style.backgroundColor = 'rgba(76, 175, 80, 0.9)';
        break;
      case 'error':
        notification.style.backgroundColor = 'rgba(244, 67, 54, 0.9)';
        break;
    }
    
    // Add to container
    gameContainer.appendChild(notification);
    createdElements.add(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s ease';
      
      // Remove from DOM after fade out
      setTimeout(() => {
        if (notification.parentNode === gameContainer) {
          try {
            gameContainer.removeChild(notification);
            createdElements.delete(notification);
          } catch (error) {
            console.error('Error removing notification:', error);
          }
        }
      }, 500);
    }, 3000);
  }

  // Add CSS for notifications
  const style = document.createElement('style');
  style.textContent = `
    .notification {
      opacity: 1;
      transition: opacity 0.5s ease;
    }
  `;
  document.head.appendChild(style);
  createdElements.add(style);

  // Add game controls
  const controlsContainer = document.createElement('div');
  controlsContainer.style.marginTop = '20px';
  controlsContainer.style.textAlign = 'center';
  appContainer.appendChild(controlsContainer);
  createdElements.add(controlsContainer);

  // Start button
  const startButton = document.createElement('button');
  startButton.textContent = 'Start Game';
  startButton.style.padding = '10px 20px';
  startButton.style.marginRight = '10px';
  startButton.style.cursor = 'pointer';
  controlsContainer.appendChild(startButton);
  createdElements.add(startButton);

  // Reset button
  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset Game';
  resetButton.style.padding = '10px 20px';
  resetButton.style.cursor = 'pointer';
  controlsContainer.appendChild(resetButton);
  createdElements.add(resetButton);

  // Add asset check button
  const assetCheckButton = document.createElement('button');
  assetCheckButton.textContent = 'Check Assets';
  assetCheckButton.style.padding = '10px 20px';
  assetCheckButton.style.marginLeft = '10px';
  assetCheckButton.style.backgroundColor = '#9c27b0';
  assetCheckButton.style.color = 'white';
  assetCheckButton.style.cursor = 'pointer';
  
  const assetCheckHandler = () => {
    // Check if monster assets exist
    debug('Checking monster assets...');
    
    const monsterTypes = ['fire', 'water', 'earth', 'air'];
    
    monsterTypes.forEach(type => {
      const path = `/monsters/${type}.svg`;
      fetch(path)
        .then(response => {
          if (response.ok) {
            console.log(`✅ ${type} monster SVG found at ${path}`);
            showNotification(`${type} monster SVG found!`, 'success');
          } else {
            console.error(`❌ ${type} monster SVG not found at ${path}`, response.status);
            showNotification(`${type} monster SVG not found!`, 'error');
          }
        })
        .catch(error => {
          console.error(`❌ Error checking ${type} monster SVG:`, error);
          showNotification(`Error checking ${type} monster SVG`, 'error');
        });
    });
  };
  
  assetCheckButton.addEventListener('click', assetCheckHandler);
  eventListeners.push({ element: assetCheckButton, type: 'click', handler: assetCheckHandler });
  
  controlsContainer.appendChild(assetCheckButton);
  createdElements.add(assetCheckButton);

  // Add debug button
  if (DEBUG) {
    const debugButton = document.createElement('button');
    debugButton.textContent = 'Debug Grid';
    debugButton.style.padding = '10px 20px';
    debugButton.style.marginLeft = '10px';
    debugButton.style.backgroundColor = '#ff5722';
    debugButton.style.color = 'white';
    debugButton.style.cursor = 'pointer';
    
    const debugHandler = () => {
      // Force recreate grid
      debug('Forcing grid recreation');
      createMonsterGrid();
      showNotification('Grid recreated', 'info');
    };
    
    debugButton.addEventListener('click', debugHandler);
    eventListeners.push({ element: debugButton, type: 'click', handler: debugHandler });
    
    controlsContainer.appendChild(debugButton);
    createdElements.add(debugButton);
  }

  // Add instructions
  const instructions = document.createElement('div');
  instructions.style.marginTop = '20px';
  instructions.style.textAlign = 'center';
  instructions.style.fontFamily = 'Arial, sans-serif';
  instructions.innerHTML = `
    <h3>Instructions:</h3>
    <p>1. Buy monsters from the shop on the right</p>
    <p>2. Place them on the 5x5 grid</p>
    <p>3. Monsters of the same type will merge when they collide</p>
    <p>4. Earn gold by merging monsters and defeating enemies</p>
  `;
  appContainer.appendChild(instructions);
  createdElements.add(instructions);

  // Create PixiJS renderer with antialias and transparent background
  // Create this BEFORE the monster grid
  pixiRenderer = new PixiRenderer({
    width: 800,
    height: 600,
    backgroundColor: 0x333333,
    parentElement: gameContainer,
    antialias: true,
    transparent: false
  });
  debug('PixiJS renderer created');

  // Initialize game logic with state management
  initGameLogic(gameInstance);
  debug('Game logic initialized');

  // Function to create the monster grid
  function createMonsterGrid() {
    debug('Creating monster grid...');
    
    try {
      // If we already have a grid, don't create another one
      if (monsterGrid) {
        debug('Monster grid already exists, skipping creation');
        return monsterGrid;
      }
      
      // Make sure we have a valid PIXI application
      if (!pixiRenderer || !pixiRenderer.getApp()) {
        debug('PIXI renderer or app not available, cannot create grid');
        showNotification('Error: PIXI renderer not ready', 'error');
        return null;
      }
      
      // Create monster grid
      monsterGrid = new MonsterGrid(pixiRenderer.getApp(), {
        width: 500,
        height: 500,
        rows: 5,
        cols: 5,
        cellPadding: 10
      });
      
      // Position grid
      monsterGrid.getContainer().position.set(150, 50);
      
      debug('Monster grid created and positioned');
      
      // Add debug visualization for grid
      if (DEBUG) {
        const gridDebug = document.createElement('div');
        gridDebug.style.position = 'absolute';
        gridDebug.style.top = '50px';
        gridDebug.style.left = '150px';
        gridDebug.style.width = '500px';
        gridDebug.style.height = '500px';
        gridDebug.style.border = '2px dashed green';
        gridDebug.style.pointerEvents = 'none';
        gridDebug.style.zIndex = '999';
        gameContainer.appendChild(gridDebug);
        createdElements.add(gridDebug);
        debug('Grid debug overlay added');
      }

      // Subscribe to grid events
      const gridSubscription = monsterGrid.events$.subscribe(event => {
        debug('Grid event:', event.type, event.data);
        
        switch (event.type) {
          case 'MONSTER_PLACED':
            debug('Monster placed:', event.data);
            
            // Add monster to game state
            const { item, gridX, gridY } = event.data;
            
            // Create monster in game world
            const entityId = gameInstance.createPlayerMonster(gridX, gridY, item.type);
            
            debug('Created monster entity:', entityId);
            break;
            
          case 'SHOP_BUY':
            debug('Shop buy:', event.data);
            break;
            
          case 'SHOP_NOT_ENOUGH_GOLD':
            debug('Not enough gold:', event.data);
            
            // Show notification
            showNotification('Not enough gold!', 'error');
            break;
        }
      });
      
      subscriptions.push(gridSubscription);

      // Subscribe to game events
      const gameSubscription = gameInstance.events$.subscribe(event => {
        // Handle game events
        switch (event.type) {
          case 'MONSTER_DIED':
            // If player monster died, update grid
            if (event.data.isPlayerControlled) {
              debug('Player monster died:', event.data);
            }
            break;
            
          case 'MONSTER_MERGED':
            // If player monsters merged, update grid
            if (event.data.isPlayerControlled) {
              debug('Player monsters merged:', event.data);
              
              // Add gold for successful merge
              monsterGrid?.addPlayerGold(event.data.newLevel * 5);
            }
            break;
        }
        
        // Pass event to renderer
        pixiRenderer?.handleGameEvent(event);
      });
      
      subscriptions.push(gameSubscription);

      return monsterGrid;
    } catch (error) {
      console.error('Error creating monster grid:', error);
      
      // Show error notification
      showNotification('Error creating game grid. Check console for details.', 'error');
      
      return null;
    }
  }

  // Set up button event listeners
  const startHandler = () => {
    eventBus.emit('game:start');
    showNotification('Game started!', 'success');
  };
  
  const resetHandler = () => {
    eventBus.emit('game:reset');
    
    // Reset grid gold
    if (monsterGrid) {
      monsterGrid.setPlayerGold(100);
    }
    
    showNotification('Game reset!', 'info');
  };
  
  startButton.addEventListener('click', startHandler);
  resetButton.addEventListener('click', resetHandler);
  
  eventListeners.push({ element: startButton, type: 'click', handler: startHandler });
  eventListeners.push({ element: resetButton, type: 'click', handler: resetHandler });

  // Start game
  gameInstance.start();

  // Show welcome notification
  showNotification('Welcome to Monster Merge: Chaos Arena!', 'info');

  // Use a timeout to ensure PIXI is fully initialized before creating the grid
  setTimeout(() => {
    debug('Creating monster grid after PIXI initialization');
    createMonsterGrid();
  }, 500);
}

// Initialize on module load with a slight delay to ensure DOM is ready
setTimeout(initializeDemo, 100);

// Cleanup function that will be called when switching demos
export async function cleanup() {
  debug('Cleaning up demo-grid resources');
  
  try {
    // Reset initialization flag
    isInitialized = false;
    
    // Unsubscribe from all subscriptions
    debug(`Unsubscribing from ${subscriptions.length} subscriptions`);
    subscriptions.forEach(subscription => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });
    subscriptions.length = 0;
    
    // Remove all event listeners
    debug(`Removing ${eventListeners.length} event listeners`);
    eventListeners.forEach(({ element, type, handler }) => {
      try {
        element.removeEventListener(type, handler);
      } catch (error) {
        console.error(`Error removing event listener ${type}:`, error);
      }
    });
    eventListeners.length = 0;
    
    // Destroy PIXI resources
    if (pixiRenderer) {
      debug('Destroying PIXI renderer');
      try {
        await pixiRenderer.destroy();
      } catch (error) {
        console.error('Error destroying PIXI renderer:', error);
      }
      pixiRenderer = null;
    }
    
    // Stop game instance
    if (gameInstance) {
      debug('Stopping game instance');
      try {
        gameInstance.stop();
      } catch (error) {
        console.error('Error stopping game:', error);
      }
      gameInstance = null;
    }
    
    // Reset monster grid
    monsterGrid = null;
    
    // Remove all created DOM elements
    debug(`Removing ${createdElements.size} DOM elements`);
    createdElements.forEach(element => {
      try {
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
        }
      } catch (error) {
        console.error('Error removing element:', error);
      }
    });
    createdElements.clear();
    
    debug('Cleanup complete');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}
