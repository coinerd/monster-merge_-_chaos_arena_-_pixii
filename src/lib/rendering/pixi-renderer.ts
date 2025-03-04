import * as PIXI from 'pixi.js';
import { GameEvent } from '../game';
import { MonsterSprites } from './monster-sprites';
import { EffectsManager } from './effects';
import { UIManager } from './ui-manager';
import { Subject } from 'rxjs';

// Debug flag
const DEBUG = true;

// Debug logging function
function debug(...args: any[]) {
  if (DEBUG) {
    console.log('[PIXI-RENDERER]', ...args);
  }
}

export interface RendererOptions {
  width: number;
  height: number;
  backgroundColor?: number;
  parentElement?: HTMLElement;
  antialias?: boolean;
  transparent?: boolean;
}

export interface RendererEvent {
  type: string;
  data: any;
}

export class PixiRenderer {
  private app: PIXI.Application;
  private monsterSprites: MonsterSprites;
  private effectsManager: EffectsManager;
  private uiManager: UIManager;
  private entitySprites: Map<number, PIXI.DisplayObject> = new Map();
  private isDestroyed: boolean = false;
  private canvasElement: HTMLCanvasElement | null = null;
  private parentElement: HTMLElement | null = null;
  private containerDiv: HTMLDivElement | null = null;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private isRendering: boolean = false;
  
  // Observable for renderer events
  public events$ = new Subject<RendererEvent>();

  constructor(options: RendererOptions) {
    debug('Creating PixiRenderer with options:', options);
    
    // Create PIXI application with stable configuration
    this.app = new PIXI.Application({
      width: options.width,
      height: options.height,
      backgroundColor: options.backgroundColor || 0x000000,
      antialias: options.antialias || false,
      transparent: options.transparent || false,
      // Use WebGL by default, but allow fallback to canvas
      forceCanvas: false,
      powerPreference: 'high-performance',
      resolution: window.devicePixelRatio || 1,
      // Disable auto-rendering - we'll control the render loop
      autoDensity: true,
      autoStart: false
    });

    // Store reference to canvas and parent
    this.canvasElement = this.app.view as HTMLCanvasElement;
    this.parentElement = options.parentElement || null;

    // Add to parent element if provided
    if (options.parentElement && this.canvasElement) {
      try {
        // Always use container approach for better stability
        this.containerDiv = document.createElement('div');
        this.containerDiv.className = 'pixi-container';
        this.containerDiv.style.width = `${options.width}px`;
        this.containerDiv.style.height = `${options.height}px`;
        this.containerDiv.style.position = 'relative';
        
        // Apply styles to prevent flickering
        this.containerDiv.style.overflow = 'hidden';
        this.containerDiv.style.backgroundColor = '#333333';
        
        // Apply styles to canvas to prevent flickering
        this.canvasElement.style.display = 'block';
        this.canvasElement.style.position = 'absolute';
        this.canvasElement.style.top = '0';
        this.canvasElement.style.left = '0';
        
        // Add container to parent
        options.parentElement.appendChild(this.containerDiv);
        
        // Add canvas to the container
        this.containerDiv.appendChild(this.canvasElement);
        
        debug('Canvas added to container div');
      } catch (error) {
        console.error('Error adding canvas to parent:', error);
      }
    }

    // Create monster sprites
    this.monsterSprites = new MonsterSprites(this.app);

    // Create effects manager
    this.effectsManager = new EffectsManager(this.app);

    // Create UI manager
    this.uiManager = new UIManager(this.app);
    
    // Set up event listeners for canvas
    this.setupEventListeners();
    
    // Start our controlled render loop
    this.startRenderLoop();
    
    debug('PixiRenderer created successfully');
  }

  /**
   * Start the controlled render loop
   */
  private startRenderLoop(): void {
    if (this.isRendering) return;
    
    this.isRendering = true;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    
    const renderFrame = (timestamp: number) => {
      if (this.isDestroyed || !this.isRendering) return;
      
      // Calculate delta time
      const delta = timestamp - this.lastFrameTime;
      this.lastFrameTime = timestamp;
      
      // Increment frame counter
      this.frameCount++;
      
      // Log FPS every 60 frames if in debug mode
      if (DEBUG && this.frameCount % 60 === 0) {
        const fps = Math.round(1000 / delta);
        debug(`FPS: ${fps}`);
      }
      
      // Render a single frame
      this.app.render();
      
      // Request next frame
      requestAnimationFrame(renderFrame);
    };
    
    // Start the render loop
    requestAnimationFrame(renderFrame);
    debug('Render loop started');
  }

  /**
   * Stop the render loop
   */
  private stopRenderLoop(): void {
    this.isRendering = false;
    debug('Render loop stopped');
  }

  /**
   * Set up event listeners for canvas interaction
   */
  private setupEventListeners(): void {
    if (!this.canvasElement) return;
    
    // Make canvas interactive
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = new PIXI.Rectangle(0, 0, this.app.screen.width, this.app.screen.height);
    
    // Add click event listener to stage
    this.app.stage.on('pointerdown', (event) => {
      // Emit stage click event
      this.events$.next({
        type: 'STAGE_CLICK',
        data: {
          x: event.global.x,
          y: event.global.y,
          originalEvent: event
        }
      });
    });
    
    debug('Event listeners set up for canvas');
  }

  /**
   * Get the PIXI application instance
   */
  public getApp(): PIXI.Application {
    return this.app;
  }

  /**
   * Connect renderer to game world
   */
  public connectToWorld(world: any): void {
    debug('Connecting renderer to world');
    
    // Add any world-specific setup here
    // This is a placeholder for future implementation
  }

  /**
   * Resize the renderer
   */
  public resize(width: number, height: number): void {
    debug(`Resizing renderer to ${width}x${height}`);
    
    if (this.isDestroyed) return;
    
    // Resize PIXI application
    this.app.renderer.resize(width, height);
    
    // Update container size if it exists
    if (this.containerDiv) {
      this.containerDiv.style.width = `${width}px`;
      this.containerDiv.style.height = `${height}px`;
    }
    
    // Update stage hit area
    this.app.stage.hitArea = new PIXI.Rectangle(0, 0, width, height);
  }

  /**
   * Handle a game event
   */
  public handleGameEvent(event: GameEvent): void {
    if (this.isDestroyed) return;
    
    switch (event.type) {
      case 'MONSTER_ADDED':
        this.addMonsterSprite(event.data);
        break;
      case 'MONSTER_REMOVED':
        this.removeMonsterSprite(event.data.entityId);
        break;
      case 'MONSTER_MOVED':
        this.updateMonsterPosition(event.data.entityId, event.data.x, event.data.y);
        break;
      case 'MONSTER_DAMAGED':
        this.showDamageEffect(event.data.entityId, event.data.amount);
        break;
      case 'MONSTER_HEALED':
        this.showHealEffect(event.data.entityId, event.data.amount);
        break;
      case 'MONSTER_MERGED':
        this.showMergeEffect(event.data.x, event.data.y, event.data.type);
        break;
      case 'MONSTER_DIED':
        this.showDeathEffect(event.data.entityId, event.data.x, event.data.y);
        break;
    }
  }

  /**
   * Add a monster sprite
   */
  private addMonsterSprite(data: any): void {
    if (this.isDestroyed) return;
    
    const sprite = this.monsterSprites.createMonsterSprite(data.type, data.level);
    sprite.position.set(data.x, data.y);
    this.app.stage.addChild(sprite);
    this.entitySprites.set(data.entityId, sprite);
    
    // Make sprite interactive
    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';
    
    // Add click event listener
    sprite.on('pointerdown', (event) => {
      // Stop event propagation
      event.stopPropagation();
      
      // Emit entity click event
      this.events$.next({
        type: 'ENTITY_CLICK',
        data: {
          entity: data.entityId,
          x: data.x,
          y: data.y,
          originalEvent: event
        }
      });
    });
  }

  /**
   * Remove a monster sprite
   */
  private removeMonsterSprite(entityId: number): void {
    if (this.isDestroyed) return;
    
    const sprite = this.entitySprites.get(entityId);
    if (sprite) {
      try {
        this.app.stage.removeChild(sprite);
      } catch (error) {
        console.error(`Error removing sprite for entity ${entityId}:`, error);
      }
      this.entitySprites.delete(entityId);
    }
  }

  /**
   * Update a monster's position
   */
  private updateMonsterPosition(entityId: number, x: number, y: number): void {
    if (this.isDestroyed) return;
    
    const sprite = this.entitySprites.get(entityId);
    if (sprite) {
      sprite.position.set(x, y);
    }
  }

  /**
   * Show damage effect
   */
  private showDamageEffect(entityId: number, amount: number): void {
    if (this.isDestroyed) return;
    
    const sprite = this.entitySprites.get(entityId);
    if (sprite) {
      this.effectsManager.showDamageNumber(sprite.position.x, sprite.position.y, amount);
    }
  }

  /**
   * Show heal effect
   */
  private showHealEffect(entityId: number, amount: number): void {
    if (this.isDestroyed) return;
    
    const sprite = this.entitySprites.get(entityId);
    if (sprite) {
      this.effectsManager.showHealNumber(sprite.position.x, sprite.position.y, amount);
    }
  }

  /**
   * Show merge effect
   */
  private showMergeEffect(x: number, y: number, type: number): void {
    if (this.isDestroyed) return;
    
    this.effectsManager.showMergeEffect(x, y, type);
  }

  /**
   * Show death effect
   */
  private showDeathEffect(entityId: number, x: number, y: number): void {
    if (this.isDestroyed) return;
    
    this.effectsManager.showExplosion(x, y);
  }

  /**
   * Destroy the renderer and clean up resources
   */
  public async destroy(): Promise<void> {
    debug('Destroying PixiRenderer');
    
    if (this.isDestroyed) {
      debug('Renderer already destroyed, skipping');
      return;
    }
    
    // Mark as destroyed first to prevent further operations
    this.isDestroyed = true;
    
    // Stop the render loop
    this.stopRenderLoop();
    
    // Clear all entity sprites
    this.entitySprites.clear();
    
    // Complete and close event subject
    this.events$.complete();
    
    // Destroy PIXI application
    try {
      // Hide canvas first to prevent flickering
      if (this.canvasElement) {
        this.canvasElement.style.display = 'none';
      }
      
      // Wait a frame before destroying to ensure any pending operations complete
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Destroy the application with all resources
      this.app.destroy(true, { children: true, texture: true, baseTexture: true });
      
      // If we have a container div, hide it instead of removing
      if (this.containerDiv) {
        this.containerDiv.style.display = 'none';
      }
      
      // Clear references
      this.canvasElement = null;
      this.parentElement = null;
      
      debug('PixiRenderer destroyed successfully');
    } catch (error) {
      console.error('Error destroying PIXI application:', error);
    }
  }
}
