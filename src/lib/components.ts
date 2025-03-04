import { Types, defineComponent } from 'bitecs'

// Position and movement related components
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32
})

export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32
})

export const Knockback = defineComponent({
  force: Types.f32,
  duration: Types.f32,
  remaining: Types.f32
})

// Monster attributes
export const Health = defineComponent({
  current: Types.i16,
  max: Types.i16
})

export const Attack = defineComponent({
  damage: Types.i16,
  range: Types.f32,
  cooldown: Types.f32,
  timer: Types.f32
})

export const Defense = defineComponent({
  value: Types.i16
})

// Monster type and merge mechanics
export const Monster = defineComponent({
  type: Types.ui8,
  level: Types.ui8
})

export const Mergeable = defineComponent({
  canMerge: Types.ui8 // 0 = false, 1 = true
})

// Collision detection
export const Collider = defineComponent({
  radius: Types.f32,
  isTrigger: Types.ui8 // 0 = false, 1 = true
})

export const Overlap = defineComponent({
  entity: Types.eid,
  duration: Types.f32
})

// AI and targeting
export const AI = defineComponent({
  state: Types.ui8, // 0 = idle, 1 = chase, 2 = attack, 3 = flee
  targetEntity: Types.eid,
  detectionRange: Types.f32,
  decisionTimer: Types.f32
})

// Visual representation (for rendering layer to use)
export const Sprite = defineComponent({
  typeId: Types.ui8,
  animationFrame: Types.ui8,
  scale: Types.f32,
  rotation: Types.f32,
  opacity: Types.f32
})

// Tags for entity categorization
export const PlayerControlled = defineComponent({})
export const Enemy = defineComponent({})
export const Item = defineComponent({
  type: Types.ui8
})
export const Projectile = defineComponent({
  sourceEntity: Types.eid,
  lifetime: Types.f32
})

// Game state tracking
export const Score = defineComponent({
  value: Types.i32
})

export const Timer = defineComponent({
  value: Types.f32
})

// Special effects
export const StatusEffect = defineComponent({
  type: Types.ui8, // 0 = none, 1 = poison, 2 = stun, 3 = speed boost, etc.
  duration: Types.f32,
  strength: Types.f32
})
