export type DogBreedId = 'shiba' | 'doberman' | 'corgi' | 'pitbull' | 'husky';

export interface DogBreedInfo {
  id: DogBreedId;
  name: string;
  codename: string;
  role: string;
  lore: string;
  laserType: string;
  laserColor: string;
  glowColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  speed: number;
  maxShield: number;
  laserDamage: number;
  fireCooldownMs: number;
  laserSpeed: number;
  specialAbility: string;
  avatarIcon: string;
}

export const DOG_BREEDS: Record<DogBreedId, DogBreedInfo> = {
  shiba: {
    id: 'shiba',
    name: 'Shiba-01',
    codename: 'KABOSU-CYBER',
    role: 'Asaltante Táctico',
    lore: 'Mejorado con implantes de ciber-reflejo y un cañón de fotones en la mandíbula superior.',
    laserType: 'Rayo de Fotones Neón',
    laserColor: '#f59e0b',
    glowColor: '#fbbf24',
    primaryColor: '#f59e0b',
    secondaryColor: '#1e293b',
    accentColor: '#38bdf8',
    speed: 5.2,
    maxShield: 100,
    laserDamage: 25,
    fireCooldownMs: 250,
    laserSpeed: 14,
    specialAbility: 'Impulso Fótico (Dash rápido)',
    avatarIcon: '🐕'
  },
  doberman: {
    id: 'doberman',
    name: 'Doberman-X',
    codename: 'NIGHTFANG',
    role: 'Francotirador de Élite',
    lore: 'Cuerpo aerodinámico de fibra de carbono. Su ladrido proyecta un rayo de alta perforación.',
    laserType: 'Láser Cuántico Perforante',
    laserColor: '#ef4444',
    glowColor: '#f87171',
    primaryColor: '#dc2626',
    secondaryColor: '#0f172a',
    accentColor: '#fb7185',
    speed: 4.8,
    maxShield: 80,
    laserDamage: 40,
    fireCooldownMs: 450,
    laserSpeed: 19,
    specialAbility: 'Visor Térmico de Largo Alcance',
    avatarIcon: '🦮'
  },
  corgi: {
    id: 'corgi',
    name: 'Corgi-Mech',
    codename: 'STUBBY-DEFENDER',
    role: 'Tanque Baluarte',
    lore: 'Chasis bajo y pesado recubierto de titanio. Escupe plasma denso y despliega barreras extra.',
    laserType: 'Saliva de Plasma Pesado',
    laserColor: '#10b981',
    glowColor: '#34d399',
    primaryColor: '#059669',
    secondaryColor: '#064e3b',
    accentColor: '#6ee7b7',
    speed: 4.2,
    maxShield: 140,
    laserDamage: 20,
    fireCooldownMs: 220,
    laserSpeed: 12,
    specialAbility: 'Baluarte de Nanobots (+Escudo)',
    avatarIcon: '🐶'
  },
  pitbull: {
    id: 'pitbull',
    name: 'Pitbull-Titan',
    codename: 'BRUTUS-9',
    role: 'Demoledor Pesado',
    lore: 'Mandíbula hidráulica de 4000 PSI capaz de concentrar haces de plasma de choque explosivo.',
    laserType: 'Cañón Láser Explosivo',
    laserColor: '#a855f7',
    glowColor: '#c084fc',
    primaryColor: '#9333ea',
    secondaryColor: '#3b0764',
    accentColor: '#e879f9',
    speed: 4.5,
    maxShield: 110,
    laserDamage: 32,
    fireCooldownMs: 340,
    laserSpeed: 13,
    specialAbility: 'Armadura Reactiva Antirreflectora',
    avatarIcon: '🐕‍🦺'
  },
  husky: {
    id: 'husky',
    name: 'Husky-Glitch',
    codename: 'FROSTBYTE',
    role: 'Hostigador Criogénico',
    lore: 'Equipado con condensadores de subcero que congelan temporalmente los escudos enemigos.',
    laserType: 'Crioláser Bipolar Rápido',
    laserColor: '#06b6d4',
    glowColor: '#22d3ee',
    primaryColor: '#0891b2',
    secondaryColor: '#164e63',
    accentColor: '#67e8f9',
    speed: 5.5,
    maxShield: 90,
    laserDamage: 18,
    fireCooldownMs: 180,
    laserSpeed: 16,
    specialAbility: 'Sobrecarga de Salto Criogénico',
    avatarIcon: '🐺'
  }
};

export type PowerUpType = 'speed_boost' | 'rapid_fire' | 'invulnerability' | 'mega_laser';

export interface PowerUpItem {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  radius: number;
  spawnedAt: number;
  durationSec: number;
  effectDurationSec: number;
  color: string;
  glowColor: string;
  label: string;
  icon: string;
}

export const POWER_UP_CONFIGS: Record<PowerUpType, {
  name: string;
  icon: string;
  color: string;
  glowColor: string;
  effectDurationSec: number;
  description: string;
}> = {
  speed_boost: {
    name: 'Turbo Pata',
    icon: '⚡',
    color: '#06b6d4',
    glowColor: '#22d3ee',
    effectDurationSec: 9,
    description: '+65% velocidad de movimiento con estela fótica'
  },
  rapid_fire: {
    name: 'Gatling Bucal',
    icon: '🔥',
    color: '#f97316',
    glowColor: '#fb923c',
    effectDurationSec: 8,
    description: 'Cadencia 3x ultrarrápida de disparos láser'
  },
  invulnerability: {
    name: 'Escudo Cuántico',
    icon: '🛡️',
    color: '#eab308',
    glowColor: '#facc15',
    effectDurationSec: 6.5,
    description: 'Inmunidad total a daños láser con barrera prismática'
  },
  mega_laser: {
    name: 'Mega Haz Plasma',
    icon: '💥',
    color: '#ec4899',
    glowColor: '#f472b6',
    effectDurationSec: 8,
    description: 'Doble de daño láser y proyectiles densos'
  }
};

export interface Player {
  id: string;
  name: string;
  breed: DogBreedId;
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  health: number; // 0 - 100
  shield: number; // 0 - maxShield
  maxShield: number;
  isShieldActive: boolean; // personal reflector shield deployed
  shieldEnergy: number; // 0 - 100
  score: number;
  deaths: number;
  kills: number;
  isAlive: boolean;
  respawnCountdown: number;
  isReady: boolean;
  isBot: boolean;
  deployableBarriersLeft: number;
  lastShootTime: number;
  laserColor: string;
  dashCooldown: number;
  barkMouthOpenTime: number; // timestamp when dog barked to open jaw
  activePowerUps: Partial<Record<PowerUpType, number>>; // type -> expiresAt timestamp
}

export type ObstacleType = 
  | 'neon_pillar' 
  | 'cyber_barrier' 
  | 'plasma_crate' 
  | 'deployable_shield_barrier'
  | 'shield_recharge_station';

export interface CoverObstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
  health: number;
  maxHealth: number;
  isDestructible: boolean;
  ownerId?: string;
  expiresAt?: number;
  glowColor?: string;
}

export interface LaserProjectile {
  id: string;
  shooterId: string;
  shooterBreed: DogBreedId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  damage: number;
  distanceTraveled: number;
  maxDistance: number;
  length: number;
}

export interface KillFeedEntry {
  id: string;
  killerId: string;
  killerName: string;
  killerBreed: DogBreedId;
  victimId: string;
  victimName: string;
  victimBreed: DogBreedId;
  timestamp: number;
}

export interface ArenaSettings {
  width: number;
  height: number;
  maxScore: number;
  matchDurationSec: number;
}

export interface RoomState {
  code: string;
  hostId: string;
  status: 'lobby' | 'playing' | 'game_over';
  arena: ArenaSettings;
  players: Record<string, Player>;
  projectiles: LaserProjectile[];
  obstacles: CoverObstacle[];
  powerUps: PowerUpItem[];
  timeRemainingSec: number;
  winner: Player | null;
  killFeed: KillFeedEntry[];
}

export type ClientMessage =
  | { type: 'join_room'; roomCode: string; playerName: string; breed: DogBreedId }
  | { type: 'create_room'; roomCode?: string; playerName: string; breed: DogBreedId; maxScore?: number }
  | { type: 'set_ready'; isReady: boolean }
  | { type: 'set_breed'; breed: DogBreedId }
  | { type: 'start_game' }
  | { type: 'add_bot'; breed?: DogBreedId }
  | { type: 'remove_bot'; botId: string }
  | { type: 'input'; up: boolean; down: boolean; left: boolean; right: boolean; angle: number; isShieldActive: boolean }
  | { type: 'shoot'; angle: number }
  | { type: 'dash'; angle: number }
  | { type: 'deploy_barrier'; x: number; y: number }
  | { type: 'restart_game' };

export type ServerMessage =
  | { type: 'room_state'; state: RoomState }
  | { type: 'joined_success'; playerId: string; roomCode: string; isHost: boolean }
  | { type: 'laser_fired'; projectileId: string; shooterId: string; x: number; y: number; angle: number; color: string }
  | { type: 'hit_effect'; x: number; y: number; color: string; hitType: 'shield' | 'body' | 'cover' | 'invulnerable' }
  | { type: 'powerup_collected'; playerId: string; playerName: string; powerUpType: PowerUpType; effectDurationSec: number; x: number; y: number; color: string }
  | { type: 'error'; message: string };
