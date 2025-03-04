import * as PIXI from 'pixi.js';

export class EffectsFactory {
  private app: PIXI.Application;
  private container: PIXI.Container;
  
  constructor(app: PIXI.Application) {
    this.app = app;
    
    // Create container for effects
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    
    console.log('EffectsFactory initialized');
  }
  
  /**
   * Create explosion effect
   */
  public createExplosionEffect(x: number, y: number, color: number = 0xFFFFFF): PIXI.Container {
    const container = new PIXI.Container();
    container.position.set(x, y);
    
    // Create particles
    const particleCount = 20;
    const particles: PIXI.Graphics[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = new PIXI.Graphics();
      particle.beginFill(color);
      particle.drawCircle(0, 0, Math.random() * 3 + 1);
      particle.endFill();
      
      // Random position
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 10;
      particle.position.set(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance
      );
      
      // Store velocity
      particle.data = {
        vx: Math.cos(angle) * (Math.random() * 5 + 2),
        vy: Math.sin(angle) * (Math.random() * 5 + 2),
        alpha: 1,
        rotation: Math.random() * 0.2 - 0.1
      };
      
      container.addChild(particle);
      particles.push(particle);
    }
    
    // Add to stage
    this.container.addChild(container);
    
    // Animate particles
    let elapsed = 0;
    const animate = () => {
      elapsed += 0.01;
      
      let active = false;
      
      particles.forEach(particle => {
        // Update position
        particle.position.x += particle.data.vx;
        particle.position.y += particle.data.vy;
        
        // Apply gravity
        particle.data.vy += 0.1;
        
        // Update alpha
        particle.alpha = 1 - elapsed;
        
        // Rotate
        particle.rotation += particle.data.rotation;
        
        if (particle.alpha > 0) {
          active = true;
        }
      });
      
      if (active && elapsed < 1) {
        requestAnimationFrame(animate);
      } else {
        this.container.removeChild(container);
      }
    };
    
    animate();
    
    return container;
  }
  
  /**
   * Create merge effect
   */
  public createMergeEffect(x: number, y: number, color: number = 0xFFFFFF): PIXI.Container {
    const container = new PIXI.Container();
    container.position.set(x, y);
    
    // Create ring effect
    const ring = new PIXI.Graphics();
    ring.lineStyle(3, color);
    ring.drawCircle(0, 0, 1);
    container.addChild(ring);
    
    // Create glow
    const glow = new PIXI.Graphics();
    glow.beginFill(color, 0.3);
    glow.drawCircle(0, 0, 30);
    glow.endFill();
    glow.alpha = 0;
    container.addChild(glow);
    
    // Add to stage
    this.container.addChild(container);
    
    // Animate
    let elapsed = 0;
    const animate = () => {
      elapsed += 0.05;
      
      // Expand ring
      ring.clear();
      ring.lineStyle(3 * (1 - elapsed), color);
      ring.drawCircle(0, 0, 50 * elapsed);
      
      // Fade in/out glow
      if (elapsed < 0.5) {
        glow.alpha = elapsed * 2;
      } else {
        glow.alpha = (1 - elapsed) * 2;
      }
      
      if (elapsed < 1) {
        requestAnimationFrame(animate);
      } else {
        this.container.removeChild(container);
      }
    };
    
    animate();
    
    return container;
  }
  
  /**
   * Create spawn effect
   */
  public createSpawnEffect(x: number, y: number, color: number = 0xFFFFFF): PIXI.Container {
    const container = new PIXI.Container();
    container.position.set(x, y);
    
    // Create particles
    const particleCount = 15;
    const particles: PIXI.Graphics[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = new PIXI.Graphics();
      particle.beginFill(color);
      particle.drawCircle(0, 0, Math.random() * 3 + 1);
      particle.endFill();
      
      // Random position
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 20;
      particle.position.set(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance
      );
      
      // Store velocity
      particle.data = {
        targetX: 0,
        targetY: 0,
        speed: Math.random() * 0.1 + 0.05,
        alpha: 1
      };
      
      container.addChild(particle);
      particles.push(particle);
    }
    
    // Add to stage
    this.container.addChild(container);
    
    // Animate particles
    let elapsed = 0;
    const animate = () => {
      elapsed += 0.01;
      
      let active = false;
      
      particles.forEach(particle => {
        // Move towards center
        const dx = particle.data.targetX - particle.position.x;
        const dy = particle.data.targetY - particle.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0.5) {
          particle.position.x += dx * particle.data.speed;
          particle.position.y += dy * particle.data.speed;
          active = true;
        }
        
        // Update alpha
        particle.alpha = 1 - elapsed;
        
        if (particle.alpha > 0) {
          active = true;
        }
      });
      
      if (active && elapsed < 1) {
        requestAnimationFrame(animate);
      } else {
        this.container.removeChild(container);
      }
    };
    
    animate();
    
    return container;
  }
  
  /**
   * Create damage effect
   */
  public createDamageEffect(x: number, y: number, damage: number): PIXI.Container {
    const container = new PIXI.Container();
    container.position.set(x, y);
    
    // Create damage text
    const damageText = new PIXI.Text(`-${damage}`, {
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xFF0000,
      align: 'center',
      fontWeight: 'bold'
    });
    damageText.anchor.set(0.5);
    container.addChild(damageText);
    
    // Add to stage
    this.container.addChild(container);
    
    // Animate
    let elapsed = 0;
    const animate = () => {
      elapsed += 0.05;
      
      // Move up
      container.position.y -= 1;
      
      // Scale up slightly then down
      if (elapsed < 0.2) {
        damageText.scale.set(1 + elapsed);
      } else {
        damageText.scale.set(1.2 - (elapsed - 0.2));
      }
      
      // Fade out
      container.alpha = 1 - elapsed;
      
      if (elapsed < 1) {
        requestAnimationFrame(animate);
      } else {
        this.container.removeChild(container);
      }
    };
    
    animate();
    
    console.log(`Created damage effect at (${x}, ${y}) with damage: ${damage}`);
    return container;
  }
}

// Helper functions to create effects without needing the factory
export function createExplosionEffect(x: number, y: number): PIXI.Container {
  const container = new PIXI.Container();
  container.position.set(x, y);
  
  // Create particles
  const particleCount = 20;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = new PIXI.Graphics();
    particle.beginFill(0xFFFFFF);
    particle.drawCircle(0, 0, Math.random() * 3 + 1);
    particle.endFill();
    
    // Random position
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 10;
    particle.position.set(
      Math.cos(angle) * distance,
      Math.sin(angle) * distance
    );
    
    // Store velocity
    particle.data = {
      vx: Math.cos(angle) * (Math.random() * 5 + 2),
      vy: Math.sin(angle) * (Math.random() * 5 + 2),
      alpha: 1,
      rotation: Math.random() * 0.2 - 0.1
    };
    
    container.addChild(particle);
  }
  
  return container;
}

export function createMergeEffect(x: number, y: number): PIXI.Container {
  const container = new PIXI.Container();
  container.position.set(x, y);
  
  // Create ring effect
  const ring = new PIXI.Graphics();
  ring.lineStyle(3, 0xFFFFFF);
  ring.drawCircle(0, 0, 30);
  container.addChild(ring);
  
  return container;
}
