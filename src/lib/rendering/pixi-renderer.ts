import * as PIXI from 'pixi.js'
import { Subject } from 'rxjs'
import { GameWorld } from '../types'
import { 
  Position, 
  Sprite, 
  Monster, 
  Health, 
  Collider, 
  PlayerControlled 
} from '../components'
import { monsterQuery } from '../queries'

export interface RendererConfig {
  width: number
  height: number
  backgroundColor: number
  antialias: boolean
  resolution: number
  parentElement?: HTMLElement
}

export interface RenderEvent {
  type: string
  data: any
}

// Define interfaces for extended PIXI objects
interface ExtendedSprite extends PIXI.Sprite {
  vx?: number;
  vy?: number;
}

export class PixiRenderer {
  private app: PIXI.Application | null = null
  private world: GameWorld | null = null
  private entitySprites: Map<number, PIXI.Container> = new Map()
  private textures: Map<string, PIXI.Texture> = new Map()
  private monsterColors: number[] = [
    0xFF5733, // Red
    0x33FF57, // Green
    0x3357FF, // Blue
    0xF3FF33, // Yellow
    0xFF33F3  // Purple
  ]
  private isInitialized: boolean = false
  private config: RendererConfig
  
  // Observable for renderer events
  public events$ = new Subject<RenderEvent>()
  
  constructor(config: Partial<RendererConfig> = {}) {
    // Default configuration
    const defaultConfig: RendererConfig = {
      width: 800,
      height: 600,
      backgroundColor: 0x242424,
      antialias: true,
      resolution: window.devicePixelRatio || 1
    }
    
    this.config = { ...defaultConfig, ...config }
    
    // Create PIXI Application with proper options
    try {
      this.app = new PIXI.Application({
        width: this.config.width,
        height: this.config.height,
        backgroundColor: this.config.backgroundColor,
        antialias: this.config.antialias,
        resolution: this.config.resolution,
        autoDensity: true,
        // Force Canvas renderer instead of WebGL to avoid issues
        forceCanvas: true
      })
      
      // Wait for the application to be ready before adding to DOM
      // This ensures the canvas is created
      setTimeout(() => {
        this.initializeRenderer()
      }, 100)
    } catch (error) {
      console.error('Failed to create PIXI Application:', error)
    }
  }
  
  /**
   * Initialize the renderer after creation
   */
  private initializeRenderer(): void {
    if (!this.app) {
      console.error('PIXI Application failed to initialize')
      return
    }
    
    try {
      // Add canvas to parent element or body
      if (this.config.parentElement && this.app.view) {
        this.config.parentElement.appendChild(this.app.view as HTMLCanvasElement)
      } else if (this.app.view) {
        document.body.appendChild(this.app.view as HTMLCanvasElement)
      }
      
      // Initialize textures
      this.initTextures()
      
      // Setup interaction
      this.setupInteraction()
      
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize renderer:', error)
    }
  }
  
  /**
   * Initialize textures for different monster types
   */
  private initTextures(): void {
    if (!this.app || !this.app.renderer) {
      console.error('Cannot initialize textures: PIXI renderer not available')
      return
    }
    
    try {
      // Create circle textures for each monster type
      for (let i = 0; i < this.monsterColors.length; i++) {
        const graphics = new PIXI.Graphics()
        graphics.beginFill(this.monsterColors[i])
        graphics.drawCircle(0, 0, 50) // Base size, will be scaled
        graphics.endFill()
        
        const texture = this.app.renderer.generateTexture(graphics)
        this.textures.set(`monster_${i}`, texture)
      }
    } catch (error) {
      console.error('Failed to generate textures:', error)
    }
  }
  
  /**
   * Setup interaction events
   */
  private setupInteraction(): void {
    if (!this.app || !this.app.stage) {
      console.error('Cannot setup interaction: PIXI stage not available')
      return
    }
    
    try {
      // Make stage interactive
      this.app.stage.eventMode = 'static'
      this.app.stage.hitArea = new PIXI.Rectangle(0, 0, this.app.screen.width, this.app.screen.height)
      
      // Handle click/tap events
      this.app.stage.on('pointerdown', (event) => {
        const position = event.global
        
        this.events$.next({
          type: 'STAGE_CLICK',
          data: {
            x: position.x,
            y: position.y,
            originalEvent: event
          }
        })
      })
    } catch (error) {
      console.error('Failed to setup interaction:', error)
    }
  }
  
  /**
   * Connect to game world
   */
  public connectToWorld(world: GameWorld): void {
    this.world = world
    
    // Ensure the renderer is initialized before starting the render loop
    const checkAndStartRender = () => {
      if (this.isInitialized && this.app) {
        // Start render loop - use add instead of addOnce to keep rendering
        if (this.app.ticker) {
          this.app.ticker.add(this.render)
        } else {
          console.warn('PIXI ticker is not available. Using requestAnimationFrame fallback.')
          // Create a fallback render loop using requestAnimationFrame if ticker is not available
          const renderLoop = () => {
            this.render()
            requestAnimationFrame(renderLoop)
          }
          requestAnimationFrame(renderLoop)
        }
      } else {
        // If not initialized yet, check again in 100ms
        setTimeout(checkAndStartRender, 100)
      }
    }
    
    checkAndStartRender()
  }
  
  /**
   * Disconnect from game world
   */
  public disconnect(): void {
    if (this.app && this.app.ticker) {
      this.app.ticker.remove(this.render)
    }
    this.world = null
  }
  
  /**
   * Render function (called each frame)
   */
  private render = (): void => {
    if (!this.world || !this.app) return
    
    // Get all monsters
    const monsters = monsterQuery(this.world)
    
    // Track existing entities to detect removed ones
    const existingEntities = new Set<number>()
    
    // Update or create sprites for each monster
    for (let i = 0; i < monsters.length; i++) {
      const entity = monsters[i]
      existingEntities.add(entity)
      
      // Get entity data
      const x = Position.x[entity]
      const y = Position.y[entity]
      const type = Monster.type[entity]
      const level = Monster.level[entity]
      const radius = Collider.radius[entity]
      const health = Health.current[entity]
      const maxHealth = Health.max[entity]
      const isPlayerControlled = this.world.playerEntities.includes(entity)
      
      // Get or create sprite container
      let container = this.entitySprites.get(entity)
      
      if (!container) {
        // Create new container for this entity
        container = new PIXI.Container()
        container.eventMode = 'static'
        container.cursor = 'pointer'
        
        // Add to stage and map
        this.app.stage.addChild(container)
        this.entitySprites.set(entity, container)
        
        // Add click handler
        container.on('pointerdown', (event) => {
          event.stopPropagation()
          this.events$.next({
            type: 'ENTITY_CLICK',
            data: {
              entity,
              x: event.global.x,
              y: event.global.y,
              originalEvent: event
            }
          })
        })
        
        // Create sprite
        const texture = this.textures.get(`monster_${type % this.monsterColors.length}`)
        if (!texture) {
          console.error(`Texture not found for monster type ${type}`)
          continue
        }
        
        const sprite = new PIXI.Sprite(texture)
        sprite.anchor.set(0.5)
        container.addChild(sprite)
        
        // Create border for player monsters
        const border = new PIXI.Graphics()
        border.name = 'border'
        container.addChild(border)
        
        // Create level text
        const levelText = new PIXI.Text(level.toString(), {
          fontFamily: 'Arial',
          fontSize: 16,
          fill: 0xFFFFFF,
          align: 'center'
        })
        levelText.name = 'levelText'
        levelText.anchor.set(0.5)
        container.addChild(levelText)
        
        // Create health bar container
        const healthBar = new PIXI.Container()
        healthBar.name = 'healthBar'
        container.addChild(healthBar)
        
        // Health bar background
        const healthBg = new PIXI.Graphics()
        healthBg.name = 'healthBg'
        healthBar.addChild(healthBg)
        
        // Health bar fill
        const healthFill = new PIXI.Graphics()
        healthFill.name = 'healthFill'
        healthBar.addChild(healthFill)
      }
      
      // Update container position
      container.position.set(x, y)
      
      // Update sprite
      const sprite = container.getChildAt(0) as PIXI.Sprite
      const texture = this.textures.get(`monster_${type % this.monsterColors.length}`)
      if (texture) {
        sprite.texture = texture
      }
      sprite.scale.set(radius / 50) // Scale based on radius (texture is 50px radius)
      
      // Update border for player monsters
      const border = container.getChildByName('border') as PIXI.Graphics
      border.clear()
      if (isPlayerControlled) {
        border.lineStyle(2, 0xFFFFFF)
        border.drawCircle(0, 0, radius)
      }
      
      // Update level text
      const levelText = container.getChildByName('levelText') as PIXI.Text
      levelText.text = level.toString()
      
      // Update health bar
      const healthBar = container.getChildByName('healthBar') as PIXI.Container
      const healthBg = healthBar.getChildByName('healthBg') as PIXI.Graphics
      const healthFill = healthBar.getChildByName('healthFill') as PIXI.Graphics
      
      const healthWidth = radius * 2
      const healthHeight = 6
      const healthX = -radius
      const healthY = -radius - 10
      
      healthBar.position.set(0, 0)
      
      // Health bar background
      healthBg.clear()
      healthBg.beginFill(0x333333)
      healthBg.drawRect(healthX, healthY, healthWidth, healthHeight)
      healthBg.endFill()
      
      // Health bar fill
      healthFill.clear()
      const healthFillWidth = (health / maxHealth) * healthWidth
      let healthColor = 0x33FF57 // Green
      if (health <= maxHealth * 0.2) {
        healthColor = 0xFF5733 // Red
      } else if (health <= maxHealth * 0.5) {
        healthColor = 0xF3FF33 // Yellow
      }
      
      healthFill.beginFill(healthColor)
      healthFill.drawRect(healthX, healthY, healthFillWidth, healthHeight)
      healthFill.endFill()
    }
    
    // Remove sprites for entities that no longer exist
    this.entitySprites.forEach((sprite, entity) => {
      if (!existingEntities.has(entity)) {
        if (this.app && this.app.stage) {
          this.app.stage.removeChild(sprite)
          sprite.destroy({ children: true })
          this.entitySprites.delete(entity)
        }
      }
    })
  }
  
  /**
   * Get canvas element
   */
  public getView(): HTMLCanvasElement | null {
    // Safely return the view, or null if not available
    if (!this.app) return null
    
    try {
      return this.app.view as HTMLCanvasElement || null
    } catch (error) {
      console.error('Failed to get canvas view:', error)
      return null
    }
  }
  
  /**
   * Resize renderer
   */
  public resize(width: number, height: number): void {
    if (!this.app || !this.app.renderer) {
      console.error('Cannot resize: PIXI renderer not available')
      return
    }
    
    try {
      this.app.renderer.resize(width, height)
      
      // Update stage hit area
      if (this.app.stage) {
        this.app.stage.hitArea = new PIXI.Rectangle(0, 0, width, height)
      }
    } catch (error) {
      console.error('Failed to resize renderer:', error)
    }
  }
  
  /**
   * Destroy renderer
   */
  public destroy(): void {
    if (!this.app) return
    
    try {
      this.app.destroy(true, { children: true, texture: true, baseTexture: true })
      this.app = null
    } catch (error) {
      console.error('Failed to destroy renderer:', error)
    }
  }
}
