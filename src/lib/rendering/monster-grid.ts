import * as PIXI from 'pixi.js';
import { Subject } from 'rxjs';
import { MonsterType, MONSTER_NAMES, MONSTER_COLORS } from './monster-sprites';
import { eventBus } from '../state/eventBus';

// Debug flag
const DEBUG = true;

// Debug logging function
function debug(...args) {
  if (DEBUG) {
    console.log('[GRID]', ...args);
  }
}

export interface GridEvent {
  type: string;
  data: any;
}

export interface GridOptions {
  width: number;
  height: number;
  rows: number;
  cols: number;
  cellPadding: number;
}

export interface MonsterShopItem {
  type: MonsterType;
  level: number;
  cost: number;
  name: string;
}

export class MonsterGrid {
  private app: PIXI.Application;
  private container: PIXI.Container;
  private gridContainer: PIXI.Container;
  private shopContainer: PIXI.Container;
  private cells: PIXI.Container[][] = [];
  private cellSize: number;
  private options: GridOptions;
  private shopItems: MonsterShopItem[] = [];
  private playerGold: number = 100; // Starting gold
  private goldText: PIXI.Text;
  private isInitialized: boolean = false;
  
  // Observable for grid events
  public events$ = new Subject<GridEvent>();
  
  // Track selected shop item
  private selectedShopItem: MonsterShopItem | null = null;
  
  constructor(app: PIXI.Application, options: Partial<GridOptions> = {}) {
    debug('Constructing MonsterGrid with options:', options);
    
    if (!app) {
      throw new Error('PIXI Application is required for MonsterGrid');
    }
    
    this.app = app;
    
    // Default options
    this.options = {
      width: 500,
      height: 500,
      rows: 5,
      cols: 5,
      cellPadding: 10,
      ...options
    };
    
    // Calculate cell size
    this.cellSize = Math.min(
      (this.options.width - (this.options.cols + 1) * this.options.cellPadding) / this.options.cols,
      (this.options.height - (this.options.rows + 1) * this.options.cellPadding) / this.options.rows
    );
    
    debug('Cell size calculated as:', this.cellSize);
    
    // Create main container
    this.container = new PIXI.Container();
    this.container.name = 'monster-grid-container';
    
    // Create grid container
    this.gridContainer = new PIXI.Container();
    this.gridContainer.name = 'grid-container';
    this.container.addChild(this.gridContainer);
    
    // Create shop container
    this.shopContainer = new PIXI.Container();
    this.shopContainer.name = 'shop-container';
    this.container.addChild(this.shopContainer);
    
    // Create gold text
    this.goldText = new PIXI.Text(`Gold: ${this.playerGold}`, {
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xFFD700,
      align: 'left'
    });
    this.container.addChild(this.goldText);
    
    // Initialize grid - only once
    this.initializeGrid();
    
    // Initialize shop - only once
    this.initializeShop();
    
    // Position containers
    this.layoutContainers();
    
    // Add to stage
    this.app.stage.addChild(this.container);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Mark as initialized
    this.isInitialized = true;
    
    debug('MonsterGrid construction complete');
    
    // Add debug visualization
    if (DEBUG) {
      this.addDebugVisualization();
    }
  }
  
  /**
   * Add debug visualization to help identify container boundaries
   */
  private addDebugVisualization(): void {
    // Add debug outline to main container
    const mainOutline = new PIXI.Graphics();
    mainOutline.lineStyle(2, 0xFF0000);
    mainOutline.drawRect(0, 0, this.options.width, this.options.height);
    this.container.addChild(mainOutline);
    
    // Add debug outline to grid container
    const gridOutline = new PIXI.Graphics();
    gridOutline.lineStyle(2, 0x00FF00);
    gridOutline.drawRect(0, 0, this.options.width, this.options.height);
    this.gridContainer.addChild(gridOutline);
    
    // Add debug outline to shop container
    const shopOutline = new PIXI.Graphics();
    shopOutline.lineStyle(2, 0x0000FF);
    shopOutline.drawRect(0, 0, 200, this.options.height);
    this.shopContainer.addChild(shopOutline);
    
    debug('Debug visualization added');
  }
  
  /**
   * Initialize the grid cells
   */
  private initializeGrid(): void {
    debug('Initializing grid');
    
    // Calculate total grid width and height
    const gridWidth = this.options.cols * this.cellSize + (this.options.cols + 1) * this.options.cellPadding;
    const gridHeight = this.options.rows * this.cellSize + (this.options.rows + 1) * this.options.cellPadding;
    
    debug('Grid dimensions:', gridWidth, 'x', gridHeight);
    
    // Create grid background
    const gridBackground = new PIXI.Graphics();
    gridBackground.beginFill(0x333333);
    gridBackground.drawRect(0, 0, gridWidth, gridHeight);
    gridBackground.endFill();
    this.gridContainer.addChild(gridBackground);
    
    // Create cells
    for (let row = 0; row < this.options.rows; row++) {
      this.cells[row] = [];
      
      for (let col = 0; col < this.options.cols; col++) {
        // Create cell container
        const cell = new PIXI.Container();
        cell.name = `cell-${row}-${col}`;
        
        // Position cell
        const x = col * (this.cellSize + this.options.cellPadding) + this.options.cellPadding;
        const y = row * (this.cellSize + this.options.cellPadding) + this.options.cellPadding;
        cell.position.set(x, y);
        
        // Create cell background
        const cellBackground = new PIXI.Graphics();
        cellBackground.beginFill(0x555555);
        cellBackground.drawRect(0, 0, this.cellSize, this.cellSize);
        cellBackground.endFill();
        cell.addChild(cellBackground);
        
        // Make cell interactive
        cellBackground.eventMode = 'static';
        cellBackground.cursor = 'pointer';
        
        // Store cell position in data
        cell.data = { row, col, occupied: false };
        
        // Add cell to grid
        this.gridContainer.addChild(cell);
        this.cells[row][col] = cell;
        
        // Add event listeners
        cellBackground.on('pointerdown', () => this.onCellClick(row, col));
        cellBackground.on('pointerover', () => this.onCellHover(row, col, true));
        cellBackground.on('pointerout', () => this.onCellHover(row, col, false));
        
        debug(`Created cell at (${row}, ${col}) with position (${x}, ${y})`);
      }
    }
    
    debug(`Created ${this.options.rows}x${this.options.cols} grid with ${this.cells.length} rows`);
  }
  
  /**
   * Initialize the monster shop
   */
  private initializeShop(): void {
    debug('Initializing shop');
    
    // Create shop background
    const shopWidth = 200;
    const shopHeight = this.options.height;
    
    const shopBackground = new PIXI.Graphics();
    shopBackground.beginFill(0x222222);
    shopBackground.drawRect(0, 0, shopWidth, shopHeight);
    shopBackground.endFill();
    this.shopContainer.addChild(shopBackground);
    
    // Create shop title
    const shopTitle = new PIXI.Text('Monster Shop', {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 0xFFFFFF,
      align: 'center'
    });
    shopTitle.position.set(shopWidth / 2 - shopTitle.width / 2, 10);
    this.shopContainer.addChild(shopTitle);
    
    // Create shop items
    this.createShopItems();
    
    // Position shop items
    this.layoutShopItems();
    
    debug('Shop initialized with', this.shopItems.length, 'items');
  }
  
  /**
   * Create shop items
   */
  private createShopItems(): void {
    debug('Creating shop items');
    
    // Clear existing items
    this.shopItems = [];
    
    // Create one item for each monster type
    Object.values(MonsterType).forEach((type, index) => {
      if (typeof type === 'number') {
        const item: MonsterShopItem = {
          type: type as MonsterType,
          level: 1,
          cost: 10 + (type as number) * 5, // Different costs for different types
          name: MONSTER_NAMES[type as number] || `Monster ${type}`
        };
        
        this.shopItems.push(item);
        debug(`Created shop item: ${item.name} (Type: ${item.type}, Cost: ${item.cost})`);
      }
    });
    
    debug('Created shop items:', this.shopItems);
  }
  
  /**
   * Layout shop items in the shop container
   */
  private layoutShopItems(): void {
    debug('Laying out shop items');
    
    // Clear existing shop item displays
    while (this.shopContainer.children.length > 1) {
      this.shopContainer.removeChildAt(1);
    }
    
    // Layout items
    const itemHeight = 80;
    const itemWidth = 180;
    const itemPadding = 10;
    
    this.shopItems.forEach((item, index) => {
      // Create item container
      const itemContainer = new PIXI.Container();
      itemContainer.name = `shop-item-${item.name}`;
      itemContainer.position.set(10, 50 + index * (itemHeight + itemPadding));
      
      // Create item background
      const itemBackground = new PIXI.Graphics();
      itemBackground.beginFill(0x444444);
      itemBackground.drawRoundedRect(0, 0, itemWidth, itemHeight, 8);
      itemBackground.endFill();
      itemContainer.addChild(itemBackground);
      
      // Create monster preview
      const monsterPreview = new PIXI.Graphics();
      monsterPreview.beginFill(MONSTER_COLORS[item.type]);
      monsterPreview.drawCircle(30, itemHeight / 2, 20);
      monsterPreview.endFill();
      
      // Add eyes to make it more visible
      monsterPreview.beginFill(0xFFFFFF);
      monsterPreview.drawCircle(30 - 8, itemHeight / 2 - 5, 5);
      monsterPreview.drawCircle(30 + 8, itemHeight / 2 - 5, 5);
      monsterPreview.endFill();
      
      monsterPreview.beginFill(0x000000);
      monsterPreview.drawCircle(30 - 8, itemHeight / 2 - 5, 2);
      monsterPreview.drawCircle(30 + 8, itemHeight / 2 - 5, 2);
      monsterPreview.endFill();
      
      // Add mouth
      monsterPreview.lineStyle(2, 0x000000);
      monsterPreview.moveTo(30 - 5, itemHeight / 2 + 5);
      monsterPreview.quadraticCurveTo(30, itemHeight / 2 + 10, 30 + 5, itemHeight / 2 + 5);
      
      itemContainer.addChild(monsterPreview);
      
      // Create monster name text
      const nameText = new PIXI.Text(item.name, {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: 0xFFFFFF,
        align: 'left'
      });
      nameText.position.set(60, 10);
      itemContainer.addChild(nameText);
      
      // Create monster type text
      const typeNames = ['Fire', 'Water', 'Earth', 'Air'];
      const typeText = new PIXI.Text(typeNames[item.type], {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xCCCCCC,
        align: 'left'
      });
      typeText.position.set(60, 30);
      itemContainer.addChild(typeText);
      
      // Create cost text
      const costText = new PIXI.Text(`Cost: ${item.cost} gold`, {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0xFFD700,
        align: 'left'
      });
      costText.position.set(60, 50);
      itemContainer.addChild(costText);
      
      // Create buy button
      const buyButton = new PIXI.Graphics();
      buyButton.beginFill(0x4CAF50);
      buyButton.drawRoundedRect(itemWidth - 60, itemHeight - 30, 50, 20, 5);
      buyButton.endFill();
      
      const buyText = new PIXI.Text('Buy', {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xFFFFFF,
        align: 'center'
      });
      buyText.position.set(itemWidth - 60 + 25 - buyText.width / 2, itemHeight - 30 + 10 - buyText.height / 2);
      
      itemContainer.addChild(buyButton);
      itemContainer.addChild(buyText);
      
      // Make button interactive
      buyButton.eventMode = 'static';
      buyButton.cursor = 'pointer';
      buyButton.on('pointerdown', () => this.onBuyItem(item));
      
      // Add item container to shop
      this.shopContainer.addChild(itemContainer);
      
      debug(`Laid out shop item: ${item.name} at position (${itemContainer.position.x}, ${itemContainer.position.y})`);
    });
    
    debug('Shop items laid out in UI');
  }
  
  /**
   * Layout the grid and shop containers
   */
  private layoutContainers(): void {
    debug('Laying out containers');
    
    // Position grid container
    this.gridContainer.position.set(0, 0);
    
    // Position shop container to the right of the grid
    this.shopContainer.position.set(this.options.width + 20, 0);
    
    // Position gold text
    this.goldText.position.set(10, this.options.height + 10);
    
    debug('Containers positioned - grid at (0,0), shop at', this.shopContainer.position);
  }
  
  /**
   * Handle cell click event
   */
  private onCellClick(row: number, col: number): void {
    const cell = this.cells[row][col];
    
    debug(`Cell clicked: (${row}, ${col})`);
    
    // Emit cell click event
    this.events$.next({
      type: 'CELL_CLICK',
      data: { row, col, cell }
    });
    
    // If we have a selected monster from the shop, place it
    if (this.selectedShopItem && !cell.data.occupied) {
      this.placeMonsterInCell(this.selectedShopItem, row, col);
      this.selectedShopItem = null;
      debug(`Placed monster in cell (${row}, ${col})`);
    }
  }
  
  /**
   * Handle cell hover event
   */
  private onCellHover(row: number, col: number, isOver: boolean): void {
    const cell = this.cells[row][col];
    const background = cell.getChildAt(0) as PIXI.Graphics;
    
    if (isOver) {
      // Highlight cell
      background.tint = 0x777777;
      
      // Emit cell hover event
      this.events$.next({
        type: 'CELL_HOVER',
        data: { row, col, cell, isOver: true }
      });
    } else {
      // Reset cell color
      background.tint = 0xFFFFFF;
      
      // Emit cell hover event
      this.events$.next({
        type: 'CELL_HOVER',
        data: { row, col, cell, isOver: false }
      });
    }
  }
  
  /**
   * Handle buy item event
   */
  private onBuyItem(item: MonsterShopItem): void {
    debug('Buy item clicked:', item);
    
    // Check if player has enough gold
    if (this.playerGold >= item.cost) {
      // Select this item
      this.selectedShopItem = item;
      
      // Emit buy event
      this.events$.next({
        type: 'SHOP_BUY',
        data: { item }
      });
      
      debug('Item selected for placement:', item.name);
    } else {
      // Emit not enough gold event
      this.events$.next({
        type: 'SHOP_NOT_ENOUGH_GOLD',
        data: { item, playerGold: this.playerGold }
      });
      
      debug('Not enough gold to buy', item.name);
    }
  }
  
  /**
   * Place a monster in a grid cell
   */
  private placeMonsterInCell(item: MonsterShopItem, row: number, col: number): void {
    const cell = this.cells[row][col];
    
    // Check if cell is already occupied
    if (cell.data.occupied) {
      debug(`Cell (${row}, ${col}) is already occupied`);
      return;
    }
    
    debug(`Placing monster ${item.name} in cell (${row}, ${col})`);
    
    // Deduct gold
    this.playerGold -= item.cost;
    this.updateGoldText();
    
    // Mark cell as occupied
    cell.data.occupied = true;
    
    // Create monster sprite
    const monsterSprite = new PIXI.Graphics();
    monsterSprite.beginFill(MONSTER_COLORS[item.type]);
    monsterSprite.drawCircle(this.cellSize / 2, this.cellSize / 2, this.cellSize / 2 - 5);
    monsterSprite.endFill();
    
    // Add eyes to make it more visible
    monsterSprite.beginFill(0xFFFFFF);
    monsterSprite.drawCircle(this.cellSize / 2 - 8, this.cellSize / 2 - 8, 5);
    monsterSprite.drawCircle(this.cellSize / 2 + 8, this.cellSize / 2 - 8, 5);
    monsterSprite.endFill();
    
    monsterSprite.beginFill(0x000000);
    monsterSprite.drawCircle(this.cellSize / 2 - 8, this.cellSize / 2 - 8, 2);
    monsterSprite.drawCircle(this.cellSize / 2 + 8, this.cellSize / 2 - 8, 2);
    monsterSprite.endFill();
    
    // Add mouth
    monsterSprite.lineStyle(2, 0x000000);
    monsterSprite.moveTo(this.cellSize / 2 - 5, this.cellSize / 2 + 5);
    monsterSprite.quadraticCurveTo(this.cellSize / 2, this.cellSize / 2 + 10, this.cellSize / 2 + 5, this.cellSize / 2 + 5);
    
    // Add monster name
    const nameText = new PIXI.Text(item.name, {
      fontFamily: 'Arial',
      fontSize: 10,
      fill: 0xFFFFFF,
      align: 'center'
    });
    nameText.position.set(
      this.cellSize / 2 - nameText.width / 2,
      this.cellSize / 2 + 15
    );
    
    // Add to cell
    cell.addChild(monsterSprite);
    cell.addChild(nameText);
    
    debug(`Added monster sprite to cell (${row}, ${col})`);
    
    // Calculate grid position
    const gridX = col * (this.cellSize + this.options.cellPadding) + this.options.cellPadding + this.cellSize / 2;
    const gridY = row * (this.cellSize + this.options.cellPadding) + this.options.cellPadding + this.cellSize / 2;
    
    debug(`Monster placed at grid position (${gridX}, ${gridY})`);
    
    // Emit monster placed event
    this.events$.next({
      type: 'MONSTER_PLACED',
      data: {
        item,
        row,
        col,
        gridX,
        gridY
      }
    });
    
    // Emit event to game system
    eventBus.emit('ui:spawn_monster', {
      type: item.type,
      x: gridX,
      y: gridY
    });
  }
  
  /**
   * Update gold text
   */
  private updateGoldText(): void {
    this.goldText.text = `Gold: ${this.playerGold}`;
    debug(`Updated gold text: ${this.goldText.text}`);
  }
  
  /**
   * Set player gold amount
   */
  public setPlayerGold(amount: number): void {
    this.playerGold = amount;
    this.updateGoldText();
    debug(`Set player gold to ${amount}`);
  }
  
  /**
   * Add gold to player
   */
  public addPlayerGold(amount: number): void {
    this.playerGold += amount;
    this.updateGoldText();
    debug(`Added ${amount} gold to player, new total: ${this.playerGold}`);
  }
  
  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for game events
    eventBus.on('player:score', (amount) => {
      // Convert score to gold (1:1 ratio for simplicity)
      this.addPlayerGold(amount);
    });
    
    debug('Event listeners set up');
  }
  
  /**
   * Get the grid container
   */
  public getContainer(): PIXI.Container {
    return this.container;
  }
  
  /**
   * Resize the grid
   */
  public resize(width: number, height: number): void {
    debug(`Resizing grid to ${width}x${height}`);
    
    // Update options
    this.options.width = width;
    this.options.height = height;
    
    // Recalculate cell size
    this.cellSize = Math.min(
      (this.options.width - (this.options.cols + 1) * this.options.cellPadding) / this.options.cols,
      (this.options.height - (this.options.rows + 1) * this.options.cellPadding) / this.options.rows
    );
    
    // Reinitialize grid
    this.gridContainer.removeChildren();
    this.initializeGrid();
    
    // Reinitialize shop
    this.shopContainer.removeChildren();
    this.initializeShop();
    
    // Reposition containers
    this.layoutContainers();
    
    debug('Grid resized');
  }
}
