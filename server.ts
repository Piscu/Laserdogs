import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import {
  ClientMessage,
  ServerMessage,
  RoomState,
  Player,
  LaserProjectile,
  CoverObstacle,
  DogBreedId,
  DOG_BREEDS,
  KillFeedEntry,
  PowerUpItem,
  PowerUpType,
  POWER_UP_CONFIGS
} from './src/types/game.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

app.use(express.json());

// API route to inspect room info or check connectivity
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size, totalConnections: clientRooms.size });
});

app.get('/api/room/:code', (req, res) => {
  const code = req.params.code;
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ exists: false });
  }
  return res.json({
    exists: true,
    code: room.code,
    playersCount: Object.keys(room.players).length,
    status: room.status
  });
});

// Map of roomCode -> RoomInstance
const rooms = new Map<string, RoomInstance>();

// Map of WebSocket -> { playerId: string; roomCode: string }
const clientRooms = new Map<WebSocket, { playerId: string; roomCode: string }>();

function generateRoomCode(): string {
  let code = '';
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms.has(code));
  return code;
}

const SPAWN_POINTS = [
  { x: 200, y: 200 },
  { x: 1800, y: 200 },
  { x: 200, y: 1200 },
  { x: 1800, y: 1200 },
  { x: 1000, y: 250 },
  { x: 1000, y: 1150 },
  { x: 450, y: 700 },
  { x: 1550, y: 700 }
];

function createDefaultObstacles(): CoverObstacle[] {
  return [
    // Central Cyber Citadel Cover
    { id: 'c_pillar_1', x: 920, y: 620, width: 160, height: 160, type: 'neon_pillar', health: 9999, maxHealth: 9999, isDestructible: false, glowColor: '#00f3ff' },
    
    // 4 Corner Core Fortifications
    { id: 'f_nw', x: 450, y: 350, width: 220, height: 40, type: 'cyber_barrier', health: 9999, maxHealth: 9999, isDestructible: false, glowColor: '#a855f7' },
    { id: 'f_nw_v', x: 450, y: 350, width: 40, height: 220, type: 'cyber_barrier', health: 9999, maxHealth: 9999, isDestructible: false, glowColor: '#a855f7' },

    { id: 'f_ne', x: 1330, y: 350, width: 220, height: 40, type: 'cyber_barrier', health: 9999, maxHealth: 9999, isDestructible: false, glowColor: '#a855f7' },
    { id: 'f_ne_v', x: 1510, y: 350, width: 40, height: 220, type: 'cyber_barrier', health: 9999, maxHealth: 9999, isDestructible: false, glowColor: '#a855f7' },

    { id: 'f_sw', x: 450, y: 1010, width: 220, height: 40, type: 'cyber_barrier', health: 9999, maxHealth: 9999, isDestructible: false, glowColor: '#a855f7' },
    { id: 'f_sw_v', x: 450, y: 830, width: 40, height: 220, type: 'cyber_barrier', health: 9999, maxHealth: 9999, isDestructible: false, glowColor: '#a855f7' },

    { id: 'f_se', x: 1330, y: 1010, width: 220, height: 40, type: 'cyber_barrier', health: 9999, maxHealth: 9999, isDestructible: false, glowColor: '#a855f7' },
    { id: 'f_se_v', x: 1510, y: 830, width: 40, height: 220, type: 'cyber_barrier', health: 9999, maxHealth: 9999, isDestructible: false, glowColor: '#a855f7' },

    // Middle tactical cover blocks
    { id: 'bar_top', x: 850, y: 300, width: 300, height: 35, type: 'cyber_barrier', health: 9999, maxHealth: 9999, isDestructible: false, glowColor: '#00f3ff' },
    { id: 'bar_bottom', x: 850, y: 1065, width: 300, height: 35, type: 'cyber_barrier', health: 9999, maxHealth: 9999, isDestructible: false, glowColor: '#00f3ff' },
    { id: 'bar_left', x: 260, y: 620, width: 40, height: 160, type: 'cyber_barrier', health: 9999, maxHealth: 9999, isDestructible: false, glowColor: '#00f3ff' },
    { id: 'bar_right', x: 1700, y: 620, width: 40, height: 160, type: 'cyber_barrier', health: 9999, maxHealth: 9999, isDestructible: false, glowColor: '#00f3ff' },

    // Destructible Neon Plasma Crates (Provide cover, but break under heavy laser fire)
    { id: 'crate_1', x: 740, y: 550, width: 60, height: 60, type: 'plasma_crate', health: 120, maxHealth: 120, isDestructible: true, glowColor: '#f43f5e' },
    { id: 'crate_2', x: 1200, y: 550, width: 60, height: 60, type: 'plasma_crate', health: 120, maxHealth: 120, isDestructible: true, glowColor: '#f43f5e' },
    { id: 'crate_3', x: 740, y: 790, width: 60, height: 60, type: 'plasma_crate', health: 120, maxHealth: 120, isDestructible: true, glowColor: '#f43f5e' },
    { id: 'crate_4', x: 1200, y: 790, width: 60, height: 60, type: 'plasma_crate', health: 120, maxHealth: 120, isDestructible: true, glowColor: '#f43f5e' },
    { id: 'crate_5', x: 340, y: 480, width: 60, height: 60, type: 'plasma_crate', health: 120, maxHealth: 120, isDestructible: true, glowColor: '#f43f5e' },
    { id: 'crate_6', x: 1600, y: 480, width: 60, height: 60, type: 'plasma_crate', health: 120, maxHealth: 120, isDestructible: true, glowColor: '#f43f5e' },
    { id: 'crate_7', x: 340, y: 860, width: 60, height: 60, type: 'plasma_crate', health: 120, maxHealth: 120, isDestructible: true, glowColor: '#f43f5e' },
    { id: 'crate_8', x: 1600, y: 860, width: 60, height: 60, type: 'plasma_crate', health: 120, maxHealth: 120, isDestructible: true, glowColor: '#f43f5e' },

    // Shield Recharge Pods (Strategic tactical zones)
    { id: 'station_1', x: 150, y: 700, width: 80, height: 80, type: 'shield_recharge_station', health: 9999, maxHealth: 9999, isDestructible: false, glowColor: '#10b981' },
    { id: 'station_2', x: 1770, y: 700, width: 80, height: 80, type: 'shield_recharge_station', health: 9999, maxHealth: 9999, isDestructible: false, glowColor: '#10b981' },
  ];
}

class RoomInstance {
  public code: string;
  public hostId: string;
  public status: 'lobby' | 'playing' | 'game_over' = 'lobby';
  public arena = {
    width: 2000,
    height: 1400,
    maxScore: 10,
    matchDurationSec: 180
  };
  public players: Record<string, Player> = {};
  public projectiles: LaserProjectile[] = [];
  public obstacles: CoverObstacle[] = [];
  public powerUps: PowerUpItem[] = [];
  public timeRemainingSec: number = 180;
  public winner: Player | null = null;
  public killFeed: KillFeedEntry[] = [];
  public timerInterval: NodeJS.Timeout | null = null;
  public tickInterval: NodeJS.Timeout | null = null;
  public sockets: Map<string, WebSocket> = new Map();
  public botInputTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastTickTime = Date.now();
  private lastPowerUpSpawnTime = Date.now();

  constructor(code: string, hostId: string) {
    this.code = code;
    this.hostId = hostId;
    this.obstacles = createDefaultObstacles();
    this.startLoop();
  }

  public addPlayer(id: string, name: string, breed: DogBreedId, ws: WebSocket, isHost: boolean): Player {
    const breedInfo = DOG_BREEDS[breed] || DOG_BREEDS.shiba;
    const spawn = SPAWN_POINTS[Object.keys(this.players).length % SPAWN_POINTS.length];
    const player: Player = {
      id,
      name,
      breed,
      x: spawn.x + (Math.random() * 60 - 30),
      y: spawn.y + (Math.random() * 60 - 30),
      angle: 0,
      vx: 0,
      vy: 0,
      health: 100,
      shield: breedInfo.maxShield,
      maxShield: breedInfo.maxShield,
      isShieldActive: false,
      shieldEnergy: 100,
      score: 0,
      deaths: 0,
      kills: 0,
      isAlive: true,
      respawnCountdown: 0,
      isReady: isHost, // host ready by default
      isBot: false,
      deployableBarriersLeft: breed === 'corgi' ? 3 : 2,
      lastShootTime: 0,
      laserColor: breedInfo.laserColor,
      dashCooldown: 0,
      barkMouthOpenTime: 0,
      activePowerUps: {}
    };

    this.players[id] = player;
    this.sockets.set(id, ws);
    this.broadcastState();
    return player;
  }

  public addBot(breed: DogBreedId = 'shiba'): Player {
    const botId = `bot_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const botNames = ['Cyber-Rex', 'Mecha-Akira', 'Nano-Kuro', 'Volt-Bolt', 'Giga-Fang', 'Glitch-Bork'];
    const botName = `${botNames[Math.floor(Math.random() * botNames.length)]} [BOT]`;
    const breedInfo = DOG_BREEDS[breed] || DOG_BREEDS.shiba;
    const spawn = SPAWN_POINTS[Object.keys(this.players).length % SPAWN_POINTS.length];

    const bot: Player = {
      id: botId,
      name: botName,
      breed,
      x: spawn.x + (Math.random() * 80 - 40),
      y: spawn.y + (Math.random() * 80 - 40),
      angle: Math.random() * Math.PI * 2,
      vx: 0,
      vy: 0,
      health: 100,
      shield: breedInfo.maxShield,
      maxShield: breedInfo.maxShield,
      isShieldActive: false,
      shieldEnergy: 100,
      score: 0,
      deaths: 0,
      kills: 0,
      isAlive: true,
      respawnCountdown: 0,
      isReady: true,
      isBot: true,
      deployableBarriersLeft: 2,
      lastShootTime: 0,
      laserColor: breedInfo.laserColor,
      dashCooldown: 0,
      barkMouthOpenTime: 0,
      activePowerUps: {}
    };

    this.players[botId] = bot;
    this.broadcastState();
    return bot;
  }

  public spawnPowerUp(): PowerUpItem | null {
    if (this.powerUps.length >= 4) return null;

    const candidateSpawns = [
      { x: 1000, y: 700 }, // Center Arena
      { x: 620, y: 220 },
      { x: 1380, y: 220 },
      { x: 620, y: 1180 },
      { x: 1380, y: 1180 },
      { x: 300, y: 700 },
      { x: 1700, y: 700 },
      { x: 1000, y: 440 },
      { x: 1000, y: 960 },
      { x: 740, y: 350 },
      { x: 1260, y: 350 },
      { x: 740, y: 1050 },
      { x: 1260, y: 1050 }
    ];

    // Pick spawn point not occupied by an existing powerup
    const available = candidateSpawns.filter(sp => {
      return !this.powerUps.some(pw => Math.hypot(pw.x - sp.x, pw.y - sp.y) < 70);
    });

    if (available.length === 0) return null;
    const pos = available[Math.floor(Math.random() * available.length)];

    const types: PowerUpType[] = ['speed_boost', 'rapid_fire', 'invulnerability', 'mega_laser'];
    const type = types[Math.floor(Math.random() * types.length)];
    const config = POWER_UP_CONFIGS[type];

    const powerUp: PowerUpItem = {
      id: `pw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      x: pos.x,
      y: pos.y,
      radius: 20,
      spawnedAt: Date.now(),
      durationSec: 25, // stays 25 seconds in arena
      effectDurationSec: config.effectDurationSec,
      color: config.color,
      glowColor: config.glowColor,
      label: config.name,
      icon: config.icon
    };

    this.powerUps.push(powerUp);
    return powerUp;
  }

  public removeBot(botId: string) {
    if (this.players[botId] && this.players[botId].isBot) {
      delete this.players[botId];
      this.broadcastState();
    }
  }

  public removePlayer(id: string) {
    delete this.players[id];
    this.sockets.delete(id);
    if (this.hostId === id) {
      // Reassign host to next human player
      const remainingHuman = Object.values(this.players).find(p => !p.isBot);
      if (remainingHuman) {
        this.hostId = remainingHuman.id;
      }
    }
    this.broadcastState();
  }

  public startGame() {
    this.status = 'playing';
    this.timeRemainingSec = this.arena.matchDurationSec;
    this.winner = null;
    this.projectiles = [];
    this.obstacles = createDefaultObstacles();
    this.powerUps = [];
    this.killFeed = [];
    this.lastPowerUpSpawnTime = Date.now();

    // Reset scores & players
    let idx = 0;
    for (const id in this.players) {
      const p = this.players[id];
      const breedInfo = DOG_BREEDS[p.breed] || DOG_BREEDS.shiba;
      const spawn = SPAWN_POINTS[idx % SPAWN_POINTS.length];
      p.x = spawn.x;
      p.y = spawn.y;
      p.health = 100;
      p.shield = breedInfo.maxShield;
      p.maxShield = breedInfo.maxShield;
      p.score = 0;
      p.kills = 0;
      p.deaths = 0;
      p.isAlive = true;
      p.respawnCountdown = 0;
      p.deployableBarriersLeft = p.breed === 'corgi' ? 3 : 2;
      p.shieldEnergy = 100;
      p.isShieldActive = false;
      p.activePowerUps = {};
      idx++;
    }

    // Spawn 2 initial power-ups in arena
    this.spawnPowerUp();
    this.spawnPowerUp();

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.status === 'playing') {
        this.timeRemainingSec--;
        if (this.timeRemainingSec <= 0) {
          this.endGame();
        }
      }
    }, 1000);

    this.broadcastState();
  }

  public endGame(winnerOverride?: Player) {
    this.status = 'game_over';
    if (this.timerInterval) clearInterval(this.timerInterval);

    if (winnerOverride) {
      this.winner = winnerOverride;
    } else {
      // Find top scorer
      let top: Player | null = null;
      for (const id in this.players) {
        const p = this.players[id];
        if (!top || p.score > top.score) {
          top = p;
        }
      }
      this.winner = top;
    }

    this.broadcastState();
  }

  public restartGame() {
    this.status = 'lobby';
    this.winner = null;
    this.projectiles = [];
    this.obstacles = createDefaultObstacles();
    this.powerUps = [];
    for (const id in this.players) {
      this.players[id].isReady = (id === this.hostId);
      this.players[id].health = 100;
      this.players[id].shield = this.players[id].maxShield;
      this.players[id].isAlive = true;
      this.players[id].activePowerUps = {};
    }
    this.broadcastState();
  }

  public handleInput(playerId: string, input: { up: boolean; down: boolean; left: boolean; right: boolean; angle: number; isShieldActive: boolean }) {
    const player = this.players[playerId];
    if (!player || !player.isAlive || this.status !== 'playing') return;

    player.angle = input.angle;
    const breedInfo = DOG_BREEDS[player.breed] || DOG_BREEDS.shiba;
    let speed = breedInfo.speed;

    // Power-up: Speed Boost
    if (player.activePowerUps.speed_boost && player.activePowerUps.speed_boost > Date.now()) {
      speed *= 1.65;
    }

    let dx = 0;
    let dy = 0;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;

    if (dx !== 0 && dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx = (dx / len) * speed;
      dy = (dy / len) * speed;
    } else {
      dx *= speed;
      dy *= speed;
    }

    // Shielding slows down movement by 40%
    if (input.isShieldActive && player.shieldEnergy > 5) {
      player.isShieldActive = true;
      dx *= 0.6;
      dy *= 0.6;
    } else {
      player.isShieldActive = false;
    }

    player.vx = dx;
    player.vy = dy;
  }

  public shootLaser(playerId: string, angle: number) {
    const player = this.players[playerId];
    if (!player || !player.isAlive || this.status !== 'playing') return;

    const breedInfo = DOG_BREEDS[player.breed] || DOG_BREEDS.shiba;
    const now = Date.now();

    // Power-up: Rapid Fire (3x cadence)
    let fireCooldown = breedInfo.fireCooldownMs;
    if (player.activePowerUps.rapid_fire && player.activePowerUps.rapid_fire > now) {
      fireCooldown *= 0.32;
    }

    if (now - player.lastShootTime < fireCooldown) return;

    player.lastShootTime = now;
    player.barkMouthOpenTime = now; // dog opens cyber jaw to bark laser!

    // Canine head offset: mouth is in front of dog's body center (radius ~24, snout offset ~30)
    const mouthDist = 32;
    const mouthX = player.x + Math.cos(angle) * mouthDist;
    const mouthY = player.y + Math.sin(angle) * mouthDist;

    const projId = `proj_${Date.now()}_${Math.random()}`;
    const laserSpeed = breedInfo.laserSpeed;
    const vx = Math.cos(angle) * laserSpeed;
    const vy = Math.sin(angle) * laserSpeed;

    // Power-up: Mega Laser
    let laserDamage = breedInfo.laserDamage;
    let laserColor = breedInfo.laserColor;
    let laserLength = 28;
    if (player.activePowerUps.mega_laser && player.activePowerUps.mega_laser > now) {
      laserDamage *= 2;
      laserLength = 48;
      laserColor = '#ec4899';
    }

    const projectile: LaserProjectile = {
      id: projId,
      shooterId: player.id,
      shooterBreed: player.breed,
      x: mouthX,
      y: mouthY,
      vx,
      vy,
      color: laserColor,
      damage: laserDamage,
      distanceTraveled: 0,
      maxDistance: 950,
      length: laserLength
    };

    this.projectiles.push(projectile);

    this.broadcast({
      type: 'laser_fired',
      projectileId: projId,
      shooterId: player.id,
      x: mouthX,
      y: mouthY,
      angle,
      color: laserColor
    });
  }

  public dash(playerId: string, angle: number) {
    const player = this.players[playerId];
    if (!player || !player.isAlive || this.status !== 'playing') return;
    const now = Date.now();
    if (now - player.dashCooldown < 2500) return; // 2.5s cooldown

    player.dashCooldown = now;
    const dashDistance = 140;
    const targetX = player.x + Math.cos(angle) * dashDistance;
    const targetY = player.y + Math.sin(angle) * dashDistance;

    // Check collision along dash
    if (!this.checkObstacleCollision(targetX, targetY, 22)) {
      player.x = Math.max(30, Math.min(this.arena.width - 30, targetX));
      player.y = Math.max(30, Math.min(this.arena.height - 30, targetY));
    }
  }

  public deployBarrier(playerId: string, x: number, y: number) {
    const player = this.players[playerId];
    if (!player || !player.isAlive || this.status !== 'playing') return;
    if (player.deployableBarriersLeft <= 0) return;

    player.deployableBarriersLeft--;

    // Deploy tactical shield barrier in front of player
    const barrierId = `barrier_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const angle = player.angle;
    const offsetDist = 55;
    const barrierX = player.x + Math.cos(angle) * offsetDist;
    const barrierY = player.y + Math.sin(angle) * offsetDist;

    // 100px wide, 24px deep barrier aligned to player direction
    const isMoreHorizontal = Math.abs(Math.sin(angle)) > Math.abs(Math.cos(angle));
    const width = isMoreHorizontal ? 110 : 26;
    const height = isMoreHorizontal ? 26 : 110;

    const barrier: CoverObstacle = {
      id: barrierId,
      x: Math.max(20, Math.min(this.arena.width - 120, barrierX - width / 2)),
      y: Math.max(20, Math.min(this.arena.height - 120, barrierY - height / 2)),
      width,
      height,
      type: 'deployable_shield_barrier',
      health: 150,
      maxHealth: 150,
      isDestructible: true,
      ownerId: player.id,
      expiresAt: Date.now() + 25000, // lasts 25 seconds
      glowColor: player.laserColor
    };

    this.obstacles.push(barrier);
    this.broadcast({
      type: 'hit_effect',
      x: barrier.x + width / 2,
      y: barrier.y + height / 2,
      color: player.laserColor,
      hitType: 'cover'
    });
  }

  private checkObstacleCollision(x: number, y: number, radius: number): boolean {
    for (const obs of this.obstacles) {
      if (obs.type === 'shield_recharge_station') continue; // passable
      // Circle vs AABB
      const closestX = Math.max(obs.x, Math.min(x, obs.x + obs.width));
      const closestY = Math.max(obs.y, Math.min(y, obs.y + obs.height));
      const distX = x - closestX;
      const distY = y - closestY;
      if (distX * distX + distY * distY < radius * radius) {
        return true;
      }
    }
    return false;
  }

  private startLoop() {
    this.tickInterval = setInterval(() => {
      this.tick();
    }, 1000 / 30);
  }

  private updateBots() {
    if (this.status !== 'playing') return;

    for (const id in this.players) {
      const bot = this.players[id];
      if (!bot.isBot || !bot.isAlive) continue;

      // Find closest alive opponent
      let closestOpponent: Player | null = null;
      let minDist = Infinity;
      for (const oppId in this.players) {
        if (oppId === bot.id) continue;
        const opp = this.players[oppId];
        if (!opp.isAlive) continue;
        const dist = Math.hypot(opp.x - bot.x, opp.y - bot.y);
        if (dist < minDist) {
          minDist = dist;
          closestOpponent = opp;
        }
      }

      // Check if there is a nearby power-up to grab!
      let closestPowerUp: PowerUpItem | null = null;
      let minPwDist = Infinity;
      for (const pw of this.powerUps) {
        const pwDist = Math.hypot(pw.x - bot.x, pw.y - bot.y);
        if (pwDist < minPwDist && pwDist < 350) {
          minPwDist = pwDist;
          closestPowerUp = pw;
        }
      }

      if (closestPowerUp && (bot.health < 80 || minPwDist < 180 || !closestOpponent)) {
        // Steer towards power-up
        const dx = closestPowerUp.x - bot.x;
        const dy = closestPowerUp.y - bot.y;
        const angle = Math.atan2(dy, dx);
        bot.angle = angle;
        const breedInfo = DOG_BREEDS[bot.breed] || DOG_BREEDS.shiba;
        bot.vx = Math.cos(angle) * breedInfo.speed * 0.9;
        bot.vy = Math.sin(angle) * breedInfo.speed * 0.9;
      } else if (closestOpponent) {
        const dx = closestOpponent.x - bot.x;
        const dy = closestOpponent.y - bot.y;
        const angle = Math.atan2(dy, dx);
        bot.angle = angle;

        // Move towards opponent if far, keep tactical distance (300-450)
        let moveDx = 0;
        let moveDy = 0;
        const breedInfo = DOG_BREEDS[bot.breed] || DOG_BREEDS.shiba;

        if (minDist > 380) {
          moveDx = Math.cos(angle) * breedInfo.speed * 0.85;
          moveDy = Math.sin(angle) * breedInfo.speed * 0.85;
        } else if (minDist < 180) {
          // Back up a bit
          moveDx = -Math.cos(angle) * breedInfo.speed * 0.8;
          moveDy = -Math.sin(angle) * breedInfo.speed * 0.8;
        } else {
          // Strafe tangentially
          moveDx = -Math.sin(angle) * breedInfo.speed * 0.7;
          moveDy = Math.cos(angle) * breedInfo.speed * 0.7;
        }

        bot.vx = moveDx;
        bot.vy = moveDy;

        // Shoot laser if within range and cooldown ready
        if (minDist < 750 && Math.random() < 0.15) {
          // Add slight inaccuracy
          const spreadAngle = angle + (Math.random() - 0.5) * 0.2;
          this.shootLaser(bot.id, spreadAngle);
        }

        // Deploy barrier if low health
        if (bot.health < 40 && bot.deployableBarriersLeft > 0 && Math.random() < 0.05) {
          this.deployBarrier(bot.id, bot.x, bot.y);
        }

        // Activate shield if incoming projectile nearby
        const incoming = this.projectiles.some(proj => {
          if (proj.shooterId === bot.id) return false;
          return Math.hypot(proj.x - bot.x, proj.y - bot.y) < 160;
        });
        bot.isShieldActive = incoming && bot.shieldEnergy > 20;
      }
    }
  }

  private tick() {
    const now = Date.now();
    const dt = Math.min((now - this.lastTickTime) / 1000, 0.1);
    this.lastTickTime = now;

    if (this.status !== 'playing') {
      this.broadcastState();
      return;
    }

    // Periodic Power-Up Spawn (every 12 seconds, max 4 items)
    if (now - this.lastPowerUpSpawnTime > 12000) {
      this.lastPowerUpSpawnTime = now;
      this.spawnPowerUp();
    }

    // Despawn expired ground power-ups
    this.powerUps = this.powerUps.filter(pw => now - pw.spawnedAt < pw.durationSec * 1000);

    this.updateBots();

    // Clean expired barriers
    this.obstacles = this.obstacles.filter(obs => {
      if (obs.expiresAt && obs.expiresAt < now) return false;
      return true;
    });

    // Clean expired player powerups
    for (const id in this.players) {
      const p = this.players[id];
      if (p.activePowerUps) {
        for (const key in p.activePowerUps) {
          const type = key as PowerUpType;
          if (p.activePowerUps[type] && p.activePowerUps[type]! <= now) {
            delete p.activePowerUps[type];
          }
        }
      }
    }

    // 1. Move Players & Resolve Collisions
    for (const id in this.players) {
      const p = this.players[id];

      // Handle Respawn
      if (!p.isAlive) {
        p.respawnCountdown -= dt;
        if (p.respawnCountdown <= 0) {
          p.isAlive = true;
          const spawn = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
          p.x = spawn.x + (Math.random() * 40 - 20);
          p.y = spawn.y + (Math.random() * 40 - 20);
          p.health = 100;
          p.shield = p.maxShield;
          p.shieldEnergy = 100;
          p.isShieldActive = false;
          p.activePowerUps = {};
        }
        continue;
      }

      // Check Collection of Ground Power-ups
      for (let i = this.powerUps.length - 1; i >= 0; i--) {
        const pw = this.powerUps[i];
        const dist = Math.hypot(p.x - pw.x, p.y - pw.y);
        if (dist <= 22 + pw.radius) {
          // Collected!
          p.activePowerUps[pw.type] = now + pw.effectDurationSec * 1000;
          if (pw.type === 'invulnerability') {
            p.shield = Math.min(p.maxShield, p.shield + 25);
          }

          this.broadcast({
            type: 'powerup_collected',
            playerId: p.id,
            playerName: p.name,
            powerUpType: pw.type,
            effectDurationSec: pw.effectDurationSec,
            x: pw.x,
            y: pw.y,
            color: pw.color
          });

          this.powerUps.splice(i, 1);
        }
      }

      // Check if in shield recharge station
      let inRecharge = false;
      for (const obs of this.obstacles) {
        if (obs.type === 'shield_recharge_station') {
          if (
            p.x >= obs.x &&
            p.x <= obs.x + obs.width &&
            p.y >= obs.y &&
            p.y <= obs.y + obs.height
          ) {
            inRecharge = true;
            break;
          }
        }
      }

      // Shield energy handling
      if (p.isShieldActive) {
        p.shieldEnergy = Math.max(0, p.shieldEnergy - 25 * dt);
        if (p.shieldEnergy <= 0) {
          p.isShieldActive = false;
        }
      } else {
        const rechargeRate = inRecharge ? 40 : 15;
        p.shieldEnergy = Math.min(100, p.shieldEnergy + rechargeRate * dt);
        // Passive shield HP regeneration if not hit recently
        if (inRecharge && p.shield < p.maxShield) {
          p.shield = Math.min(p.maxShield, p.shield + 20 * dt);
        }
      }

      // Player Movement + Obstacle Sliding
      const nextX = p.x + p.vx;
      const nextY = p.y + p.vy;
      const radius = 22;

      // X Movement
      let canMoveX = true;
      if (nextX - radius < 0 || nextX + radius > this.arena.width) canMoveX = false;
      if (canMoveX && this.checkObstacleCollision(nextX, p.y, radius)) canMoveX = false;
      if (canMoveX) p.x = nextX;

      // Y Movement
      let canMoveY = true;
      if (nextY - radius < 0 || nextY + radius > this.arena.height) canMoveY = false;
      if (canMoveY && this.checkObstacleCollision(p.x, nextY, radius)) canMoveY = false;
      if (canMoveY) p.y = nextY;
    }

    // 2. Move Projectiles & Check Collisions
    const remainingProjectiles: LaserProjectile[] = [];

    for (const proj of this.projectiles) {
      proj.x += proj.vx;
      proj.y += proj.vy;
      const stepDist = Math.hypot(proj.vx, proj.vy);
      proj.distanceTraveled += stepDist;

      // Bounds check
      if (
        proj.x < 0 ||
        proj.x > this.arena.width ||
        proj.y < 0 ||
        proj.y > this.arena.height ||
        proj.distanceTraveled >= proj.maxDistance
      ) {
        continue;
      }

      // Obstacle collision
      let hitObstacle = false;
      for (let i = 0; i < this.obstacles.length; i++) {
        const obs = this.obstacles[i];
        if (obs.type === 'shield_recharge_station') continue; // lasers fly over floor pads

        if (
          proj.x >= obs.x &&
          proj.x <= obs.x + obs.width &&
          proj.y >= obs.y &&
          proj.y <= obs.y + obs.height
        ) {
          hitObstacle = true;
          this.broadcast({
            type: 'hit_effect',
            x: proj.x,
            y: proj.y,
            color: obs.glowColor || proj.color,
            hitType: 'cover'
          });

          // Destructible cover damage
          if (obs.isDestructible) {
            obs.health -= proj.damage;
            if (obs.health <= 0) {
              this.obstacles.splice(i, 1);
            }
          }
          break;
        }
      }

      if (hitObstacle) continue;

      // Player collision
      let hitPlayer = false;
      for (const id in this.players) {
        const player = this.players[id];
        if (id === proj.shooterId || !player.isAlive) continue;

        const dist = Math.hypot(player.x - proj.x, player.y - proj.y);
        const playerRadius = 24;

        if (dist <= playerRadius) {
          hitPlayer = true;

          // Power-up: Invulnerability - deflects all damage
          if (player.activePowerUps.invulnerability && player.activePowerUps.invulnerability > now) {
            this.broadcast({
              type: 'hit_effect',
              x: proj.x,
              y: proj.y,
              color: '#facc15',
              hitType: 'invulnerable'
            });
            break;
          }

          // Check if player has active shield facing the laser
          const angleToLaser = Math.atan2(proj.y - player.y, proj.x - player.x);
          let angleDiff = Math.abs(player.angle - angleToLaser);
          if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

          // If shield active and laser is hitting from front arc (within ~80 degrees)
          if (player.isShieldActive && angleDiff < 1.4) {
            this.broadcast({
              type: 'hit_effect',
              x: proj.x,
              y: proj.y,
              color: '#38bdf8',
              hitType: 'shield'
            });
            // Drain shield energy instead of HP
            player.shieldEnergy = Math.max(0, player.shieldEnergy - 20);
            if (player.shieldEnergy <= 0) player.isShieldActive = false;
            break;
          }

          // Otherwise, hit dog! Shield absorbs first, then HP
          let dmg = proj.damage;
          if (player.shield > 0) {
            this.broadcast({
              type: 'hit_effect',
              x: proj.x,
              y: proj.y,
              color: player.laserColor,
              hitType: 'shield'
            });
            if (player.shield >= dmg) {
              player.shield -= dmg;
              dmg = 0;
            } else {
              dmg -= player.shield;
              player.shield = 0;
            }
          }

          if (dmg > 0) {
            player.health -= dmg;
            this.broadcast({
              type: 'hit_effect',
              x: proj.x,
              y: proj.y,
              color: '#ef4444',
              hitType: 'body'
            });
          }

          // Check K.O.
          if (player.health <= 0) {
            player.health = 0;
            player.isAlive = false;
            player.respawnCountdown = 3.5; // 3.5s respawn
            player.deaths++;

            const killer = this.players[proj.shooterId];
            if (killer) {
              killer.kills++;
              killer.score += 1;

              const entry: KillFeedEntry = {
                id: `kf_${Date.now()}_${Math.random()}`,
                killerId: killer.id,
                killerName: killer.name,
                killerBreed: killer.breed,
                victimId: player.id,
                victimName: player.name,
                victimBreed: player.breed,
                timestamp: Date.now()
              };

              this.killFeed.unshift(entry);
              if (this.killFeed.length > 5) this.killFeed.pop();

              if (killer.score >= this.arena.maxScore) {
                this.endGame(killer);
              }
            }
          }

          break;
        }
      }

      if (!hitPlayer) {
        remainingProjectiles.push(proj);
      }
    }

    this.projectiles = remainingProjectiles;
    this.broadcastState();
  }

  public broadcast(msg: ServerMessage) {
    const raw = JSON.stringify(msg);
    for (const ws of this.sockets.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(raw);
      }
    }
  }

  public broadcastState() {
    const state: RoomState = {
      code: this.code,
      hostId: this.hostId,
      status: this.status,
      arena: this.arena,
      players: this.players,
      projectiles: this.projectiles,
      obstacles: this.obstacles,
      powerUps: this.powerUps,
      timeRemainingSec: this.timeRemainingSec,
      winner: this.winner,
      killFeed: this.killFeed
    };

    this.broadcast({
      type: 'room_state',
      state
    });
  }

  public cleanup() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.tickInterval) clearInterval(this.tickInterval);
  }
}

// WebSocket Connection handling
wss.on('connection', (ws: WebSocket) => {
  const playerId = `p_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  ws.on('message', (data: string) => {
    try {
      const msg: ClientMessage = JSON.parse(data.toString());

      if (msg.type === 'create_room') {
        let code = (msg.roomCode && /^\d{4}$/.test(msg.roomCode)) ? msg.roomCode : generateRoomCode();
        if (rooms.has(code)) {
          // If code already taken, pick a fresh 4-digit code
          code = generateRoomCode();
        }

        const room = new RoomInstance(code, playerId);
        if (msg.maxScore) room.arena.maxScore = msg.maxScore;
        rooms.set(code, room);

        const player = room.addPlayer(playerId, msg.playerName || 'CyberHound', msg.breed || 'shiba', ws, true);
        clientRooms.set(ws, { playerId, roomCode: code });

        ws.send(JSON.stringify({
          type: 'joined_success',
          playerId,
          roomCode: code,
          isHost: true
        }));
      } else if (msg.type === 'join_room') {
        const code = msg.roomCode.trim();
        const room = rooms.get(code);

        if (!room) {
          ws.send(JSON.stringify({
            type: 'error',
            message: `Sala #${code} no encontrada. Verifica el código de 4 cifras o crea una nueva.`
          }));
          return;
        }

        if (Object.keys(room.players).length >= 8) {
          ws.send(JSON.stringify({
            type: 'error',
            message: `La sala #${code} está llena (máximo 8 perros).`
          }));
          return;
        }

        room.addPlayer(playerId, msg.playerName || 'CyberHound', msg.breed || 'shiba', ws, false);
        clientRooms.set(ws, { playerId, roomCode: code });

        ws.send(JSON.stringify({
          type: 'joined_success',
          playerId,
          roomCode: code,
          isHost: room.hostId === playerId
        }));
      } else {
        // In-room commands
        const clientInfo = clientRooms.get(ws);
        if (!clientInfo) return;
        const room = rooms.get(clientInfo.roomCode);
        if (!room) return;

        switch (msg.type) {
          case 'set_ready': {
            const p = room.players[playerId];
            if (p) {
              p.isReady = msg.isReady;
              room.broadcastState();
            }
            break;
          }
          case 'set_breed': {
            const p = room.players[playerId];
            if (p && room.status === 'lobby') {
              p.breed = msg.breed;
              const breedInfo = DOG_BREEDS[msg.breed];
              p.laserColor = breedInfo.laserColor;
              p.maxShield = breedInfo.maxShield;
              p.shield = breedInfo.maxShield;
              room.broadcastState();
            }
            break;
          }
          case 'start_game': {
            if (room.hostId === playerId) {
              room.startGame();
            }
            break;
          }
          case 'add_bot': {
            if (room.hostId === playerId) {
              const breeds: DogBreedId[] = ['shiba', 'doberman', 'corgi', 'pitbull', 'husky'];
              const chosenBreed = msg.breed || breeds[Math.floor(Math.random() * breeds.length)];
              room.addBot(chosenBreed);
            }
            break;
          }
          case 'remove_bot': {
            if (room.hostId === playerId) {
              room.removeBot(msg.botId);
            }
            break;
          }
          case 'input': {
            room.handleInput(playerId, msg);
            break;
          }
          case 'shoot': {
            room.shootLaser(playerId, msg.angle);
            break;
          }
          case 'dash': {
            room.dash(playerId, msg.angle);
            break;
          }
          case 'deploy_barrier': {
            room.deployBarrier(playerId, msg.x, msg.y);
            break;
          }
          case 'restart_game': {
            if (room.hostId === playerId) {
              room.restartGame();
            }
            break;
          }
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    const clientInfo = clientRooms.get(ws);
    if (clientInfo) {
      const room = rooms.get(clientInfo.roomCode);
      if (room) {
        room.removePlayer(clientInfo.playerId);
        // If room is empty of human players, clean it up
        const hasHumans = Object.values(room.players).some(p => !p.isBot);
        if (!hasHumans) {
          room.cleanup();
          rooms.delete(clientInfo.roomCode);
        }
      }
      clientRooms.delete(ws);
    }
  });
});

// Vite or Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[CyberBark] Laser Tag Server running on port ${PORT}`);
  });
}

startServer();
