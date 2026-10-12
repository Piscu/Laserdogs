import { Player, LaserProjectile, CoverObstacle, DOG_BREEDS, DogBreedId, PowerUpItem } from '../types/game.ts';

export interface VisualParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  shape: 'circle' | 'square' | 'spark' | 'ring';
}

export class ParticleManager {
  public particles: VisualParticle[] = [];

  public addLaserSparks(x: number, y: number, color: string, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 2,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 15 + 10,
        shape: 'spark'
      });
    }
  }

  public addMuzzleFlash(x: number, y: number, angle: number, color: string) {
    for (let i = 0; i < 6; i++) {
      const spread = (Math.random() - 0.5) * 0.8;
      const speed = Math.random() * 6 + 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle + spread) * speed,
        vy: Math.sin(angle + spread) * speed,
        color,
        size: Math.random() * 4 + 2,
        alpha: 1,
        life: 0,
        maxLife: 10,
        shape: 'circle'
      });
    }
  }

  public addShieldDeflect(x: number, y: number, color: string) {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      color,
      size: 15,
      alpha: 1,
      life: 0,
      maxLife: 12,
      shape: 'ring'
    });
    this.addLaserSparks(x, y, color, 10);
  }

  public addInvulnerableSpark(x: number, y: number) {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      color: '#facc15',
      size: 20,
      alpha: 1,
      life: 0,
      maxLife: 14,
      shape: 'ring'
    });
    this.addLaserSparks(x, y, '#fde047', 12);
  }

  public addPowerUpCollect(x: number, y: number, color: string) {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      color,
      size: 26,
      alpha: 1,
      life: 0,
      maxLife: 18,
      shape: 'ring'
    });
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 4 + 2,
        alpha: 1,
        life: 0,
        maxLife: 20,
        shape: Math.random() > 0.5 ? 'spark' : 'circle'
      });
    }
  }

  public addDeathExplosion(x: number, y: number, color: string) {
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.5 ? color : '#38bdf8',
        size: Math.random() * 5 + 3,
        alpha: 1,
        life: 0,
        maxLife: 25,
        shape: Math.random() > 0.5 ? 'square' : 'circle'
      });
    }
  }

  public updateAndDraw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha = 1 - p.life / p.maxLife;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;

      if (p.shape === 'spark') {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
        ctx.lineWidth = p.size;
        ctx.stroke();
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'square') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.shape === 'ring') {
        const radius = p.size + (p.life / p.maxLife) * 20;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

export function drawArenaBackground(
  ctx: CanvasRenderingContext2D,
  arenaWidth: number,
  arenaHeight: number,
  time: number
) {
  // Dark cyber floor
  ctx.fillStyle = '#060913';
  ctx.fillRect(0, 0, arenaWidth, arenaHeight);

  // Cyberpunk grid
  ctx.strokeStyle = 'rgba(14, 165, 233, 0.08)';
  ctx.lineWidth = 1;
  const gridSize = 80;

  for (let x = 0; x <= arenaWidth; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, arenaHeight);
    ctx.stroke();
  }
  for (let y = 0; y <= arenaHeight; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(arenaWidth, y);
    ctx.stroke();
  }

  // Neon arena boundary with pulsing border
  const pulse = Math.sin(time * 0.003) * 0.2 + 0.8;
  ctx.strokeStyle = `rgba(0, 243, 255, ${pulse * 0.7})`;
  ctx.lineWidth = 6;
  ctx.shadowColor = '#00f3ff';
  ctx.shadowBlur = 16;
  ctx.strokeRect(4, 4, arenaWidth - 8, arenaHeight - 8);

  // Tactical floor markings
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(236, 72, 153, 0.15)';
  ctx.lineWidth = 2;
  // Center ring
  ctx.beginPath();
  ctx.arc(arenaWidth / 2, arenaHeight / 2, 220, 0, Math.PI * 2);
  ctx.stroke();

  // Crosshairs in center
  ctx.beginPath();
  ctx.moveTo(arenaWidth / 2 - 250, arenaHeight / 2);
  ctx.lineTo(arenaWidth / 2 + 250, arenaHeight / 2);
  ctx.moveTo(arenaWidth / 2, arenaHeight / 2 - 250);
  ctx.lineTo(arenaWidth / 2, arenaHeight / 2 + 250);
  ctx.stroke();
}

export function drawObstacles(ctx: CanvasRenderingContext2D, obstacles: CoverObstacle[], time: number) {
  for (const obs of obstacles) {
    ctx.save();

    if (obs.type === 'shield_recharge_station') {
      // Ground Recharge station
      const pulse = Math.sin(time * 0.005) * 0.25 + 0.75;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      ctx.strokeStyle = `rgba(16, 185, 129, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

      // Rotating cyber cross icon
      const cx = obs.x + obs.width / 2;
      const cy = obs.y + obs.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.002);
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 10;
      ctx.fillRect(-12, -4, 24, 8);
      ctx.fillRect(-4, -12, 8, 24);
      ctx.restore();
      continue;
    }

    if (obs.type === 'neon_pillar') {
      // Solid neon cyberpunk column
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

      // Neon outer glow border
      ctx.strokeStyle = obs.glowColor || '#00f3ff';
      ctx.lineWidth = 3;
      ctx.shadowColor = obs.glowColor || '#00f3ff';
      ctx.shadowBlur = 12;
      ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

      // Circuit lines inside
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(obs.x + 10, obs.y + 10, obs.width - 20, obs.height - 20);
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y);
      ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
      ctx.moveTo(obs.x + obs.width, obs.y);
      ctx.lineTo(obs.x, obs.y + obs.height);
      ctx.stroke();

      // Cyber crest
      ctx.fillStyle = '#00f3ff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CORE SHIELD', obs.x + obs.width / 2, obs.y + obs.height / 2 + 4);
    } else if (obs.type === 'cyber_barrier') {
      // Tactical neon barrier
      ctx.fillStyle = '#111827';
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

      ctx.strokeStyle = obs.glowColor || '#a855f7';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = obs.glowColor || '#a855f7';
      ctx.shadowBlur = 10;
      ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

      // Hazard pattern
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.lineWidth = 2;
      const step = 15;
      const maxDim = Math.max(obs.width, obs.height);
      for (let i = 0; i < maxDim; i += step) {
        ctx.beginPath();
        ctx.moveTo(obs.x + i, obs.y);
        ctx.lineTo(obs.x + i - 10, obs.y + obs.height);
        ctx.stroke();
      }
    } else if (obs.type === 'plasma_crate') {
      // Destructible plasma crate
      const hpRatio = Math.max(0, obs.health / obs.maxHealth);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

      ctx.strokeStyle = obs.glowColor || '#f43f5e';
      ctx.lineWidth = 2;
      ctx.shadowColor = obs.glowColor || '#f43f5e';
      ctx.shadowBlur = 8;
      ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

      // Warning symbol
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠', obs.x + obs.width / 2, obs.y + obs.height / 2);

      // Mini HP bar above crate
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(obs.x, obs.y - 7, obs.width, 4);
      ctx.fillStyle = hpRatio > 0.4 ? '#f43f5e' : '#fb7185';
      ctx.fillRect(obs.x, obs.y - 7, obs.width * hpRatio, 4);
    } else if (obs.type === 'deployable_shield_barrier') {
      // Player placed translucent plasma shield
      const pulse = Math.sin(time * 0.008) * 0.2 + 0.8;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

      ctx.strokeStyle = obs.glowColor || '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = obs.glowColor || '#38bdf8';
      ctx.shadowBlur = 14 * pulse;
      ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

      // Hexagon energy pattern
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SHIELD WALL', obs.x + obs.width / 2, obs.y + obs.height / 2 + 3);
    }

    ctx.restore();
  }
}

export function drawPowerUps(
  ctx: CanvasRenderingContext2D,
  powerUps: PowerUpItem[],
  time: number
) {
  for (const pw of powerUps) {
    ctx.save();
    const floatY = Math.sin(time * 0.005 + pw.x) * 4;
    ctx.translate(pw.x, pw.y + floatY);

    const pulse = Math.sin(time * 0.008) * 0.2 + 0.8;

    // 1. Ground projector ring
    ctx.strokeStyle = pw.glowColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = pw.glowColor;
    ctx.shadowBlur = 12 * pulse;
    ctx.beginPath();
    ctx.arc(0, 0, pw.radius + 6, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating tech ticks
    ctx.save();
    ctx.rotate(time * 0.003);
    ctx.strokeStyle = pw.color;
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, pw.radius + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. Translucent glowing diamond base
    ctx.fillStyle = `${pw.color}33`; // 20% alpha
    ctx.beginPath();
    const r = pw.radius;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = pw.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 3. Floating Power-up Icon
    ctx.font = 'bold 18px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.fillText(pw.icon, 0, 0);

    // 4. Cyberpunk Label underneath
    ctx.font = 'bold 9px "Orbitron", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = pw.glowColor;
    ctx.shadowBlur = 8;
    ctx.fillText(pw.label.toUpperCase(), 0, pw.radius + 18);

    ctx.restore();
  }
}

export function drawCyberDog(
  ctx: CanvasRenderingContext2D,
  player: Player,
  isCurrentPlayer: boolean,
  time: number
) {
  if (!player.isAlive) {
    // Render respawn hologram
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.globalAlpha = 0.4 + Math.sin(time * 0.01) * 0.2;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`RECONSTRUCCIÓN (${Math.ceil(player.respawnCountdown)}s)`, 0, -32);
    ctx.restore();
    return;
  }

  const breedInfo = DOG_BREEDS[player.breed] || DOG_BREEDS.shiba;
  const isBarkingLaser = Date.now() - player.barkMouthOpenTime < 160;

  ctx.save();
  ctx.translate(player.x, player.y);

  const now = Date.now();
  const hasInvuln = player.activePowerUps?.invulnerability && player.activePowerUps.invulnerability > now;
  const hasSpeed = player.activePowerUps?.speed_boost && player.activePowerUps.speed_boost > now;
  const hasRapid = player.activePowerUps?.rapid_fire && player.activePowerUps.rapid_fire > now;
  const hasMega = player.activePowerUps?.mega_laser && player.activePowerUps.mega_laser > now;

  // Power-Up: Invulnerability Golden Hexagonal Forcefield Dome (360°)
  if (hasInvuln) {
    ctx.save();
    const invPulse = Math.sin(time * 0.015) * 0.2 + 0.8;
    ctx.rotate(time * 0.004);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = 18 * invPulse;
    ctx.fillStyle = 'rgba(250, 204, 21, 0.18)';

    // Hexagon forcefield dome
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const hx = Math.cos(a) * 32;
      const hy = Math.sin(a) * 32;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    // Rotating inner tech ring
    ctx.rotate(-time * 0.008);
    ctx.strokeStyle = '#ffffff';
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Dash afterimage or Speed Boost motion streaks
  if (player.vx !== 0 || player.vy !== 0 || hasSpeed) {
    const moveAngle = Math.atan2(player.vy, player.vx);
    ctx.save();
    ctx.globalAlpha = hasSpeed ? 0.45 : 0.25;
    ctx.fillStyle = hasSpeed ? '#06b6d4' : breedInfo.laserColor;
    ctx.beginPath();
    ctx.arc(-Math.cos(moveAngle) * 16, -Math.sin(moveAngle) * 16, hasSpeed ? 22 : 18, 0, Math.PI * 2);
    ctx.fill();
    if (hasSpeed) {
      // Second trailing shadow
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(-Math.cos(moveAngle) * 28, -Math.sin(moveAngle) * 28, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Rotate to face direction
  ctx.rotate(player.angle);

  // Power-Up: Mega Laser Magenta spine plasma
  if (hasMega) {
    ctx.save();
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(16, 0);
    ctx.stroke();
    ctx.restore();
  }

  // Running paws animation
  const moving = Math.hypot(player.vx, player.vy) > 0.1;
  const legCycle = moving ? Math.sin(time * 0.018) * 6 : 0;

  // Front Left & Right Paws
  ctx.fillStyle = breedInfo.secondaryColor;
  ctx.fillRect(8 + legCycle, -18, 8, 5);
  ctx.fillRect(8 - legCycle, 13, 8, 5);

  // Back Left & Right Paws
  ctx.fillRect(-16 - legCycle, -16, 7, 5);
  ctx.fillRect(-16 + legCycle, 11, 7, 5);

  // Cyber Tail (wags when alive)
  const tailWag = Math.sin(time * 0.012) * 0.35;
  ctx.save();
  ctx.translate(-20, 0);
  ctx.rotate(tailWag);
  ctx.strokeStyle = breedInfo.primaryColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-10, -5, -16, -10);
  ctx.stroke();

  // Cyber tail tip LED
  ctx.fillStyle = breedInfo.laserColor;
  ctx.shadowColor = breedInfo.laserColor;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(-16, -10, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Main Canine Torso (Cyber Armor)
  ctx.shadowColor = breedInfo.glowColor;
  ctx.shadowBlur = isCurrentPlayer ? 14 : 8;
  ctx.fillStyle = breedInfo.primaryColor;

  ctx.beginPath();
  // Elongated dog body shape
  ctx.ellipse(-2, 0, 18, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cybernetic Spine / Energy Core
  ctx.fillStyle = breedInfo.secondaryColor;
  ctx.fillRect(-12, -4, 16, 8);
  ctx.fillStyle = breedInfo.laserColor;
  ctx.shadowBlur = 6;
  ctx.fillRect(-10, -2, 12, 4);

  // Dog Head & Cyber Visor
  ctx.translate(14, 0);

  // Dog Ears based on breed
  ctx.fillStyle = breedInfo.primaryColor;
  if (player.breed === 'doberman') {
    // Pointy tall cyber ears
    ctx.beginPath();
    ctx.moveTo(-4, -8);
    ctx.lineTo(-8, -20);
    ctx.lineTo(2, -8);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-4, 8);
    ctx.lineTo(-8, 20);
    ctx.lineTo(2, 8);
    ctx.fill();
  } else if (player.breed === 'corgi') {
    // Large rounded cute ears with neon circuits
    ctx.beginPath();
    ctx.arc(-6, -14, 7, 0, Math.PI * 2);
    ctx.arc(-6, 14, 7, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Shiba / Pitbull / Husky cyber ears
    ctx.beginPath();
    ctx.moveTo(-2, -7);
    ctx.lineTo(-6, -16);
    ctx.lineTo(4, -6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-2, 7);
    ctx.lineTo(-6, 16);
    ctx.lineTo(4, 6);
    ctx.fill();
  }

  // Head base
  ctx.fillStyle = breedInfo.primaryColor;
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();

  // Cyber Visor (Eyes)
  ctx.fillStyle = breedInfo.laserColor;
  ctx.shadowColor = breedInfo.laserColor;
  ctx.shadowBlur = 10;
  ctx.fillRect(2, -6, 5, 12);

  // Snout & Mechanized Mouth (Escupe Láser!)
  const mouthJawOpen = isBarkingLaser ? 8 : 2;

  // Upper Snout
  ctx.fillStyle = breedInfo.secondaryColor;
  ctx.fillRect(6, -4, 10, 4);

  // Lower Jaw (Opens wide when barking laser)
  ctx.fillStyle = breedInfo.secondaryColor;
  ctx.fillRect(6, mouthJawOpen - 2, 8, 3);

  // Mouth Interior Laser Glow & Muzzle Flash
  if (isBarkingLaser) {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = breedInfo.laserColor;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(14, 1, 6, 0, Math.PI * 2);
    ctx.fill();

    // Laser nozzle ring
    ctx.strokeStyle = breedInfo.laserColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(18, 1, 9, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Frontal Personal Shield (Hexagonal curved barrier when active)
  if (player.isShieldActive) {
    ctx.save();
    ctx.translate(26, 0);
    const shieldPulse = Math.sin(time * 0.02) * 0.2 + 0.8;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 18 * shieldPulse;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';

    // Curved front shield arc
    ctx.beginPath();
    ctx.arc(0, 0, 24, -Math.PI / 2.5, Math.PI / 2.5);
    ctx.stroke();

    // Electric arcs
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 22, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore(); // restore angle & position

  // Draw Overhead Name, Health & Shield Bars (unrotated)
  ctx.save();
  ctx.translate(player.x, player.y - 34);

  // Current player marker ring
  if (isCurrentPlayer) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(0, 34, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Active power-up badges above name
  const activeIcons: string[] = [];
  if (player.activePowerUps?.speed_boost && player.activePowerUps.speed_boost > now) activeIcons.push('⚡');
  if (player.activePowerUps?.rapid_fire && player.activePowerUps.rapid_fire > now) activeIcons.push('🔥');
  if (player.activePowerUps?.invulnerability && player.activePowerUps.invulnerability > now) activeIcons.push('🛡️');
  if (player.activePowerUps?.mega_laser && player.activePowerUps.mega_laser > now) activeIcons.push('💥');

  if (activeIcons.length > 0) {
    ctx.font = 'bold 12px sans-serif';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.fillText(activeIcons.join(' '), 0, -23);
  }

  // Player Name & Breed Tag
  ctx.font = 'bold 11px "Chakra Petch", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = isCurrentPlayer ? '#38bdf8' : (player.isBot ? '#cbd5e1' : '#f8fafc');
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;
  ctx.fillText(
    `${player.name} [${breedInfo.name}]`,
    0,
    -10
  );

  // Health and Shield Bars
  const barWidth = 44;
  const barHeight = 4;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(-barWidth / 2, 0, barWidth, barHeight * 2 + 1);

  // Shield Bar (cyan/blue)
  const shieldRatio = Math.max(0, player.shield / player.maxShield);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(-barWidth / 2, 0, barWidth * shieldRatio, barHeight);

  // Health Bar (green to red)
  const healthRatio = Math.max(0, player.health / 100);
  ctx.fillStyle = healthRatio > 0.4 ? '#10b981' : '#ef4444';
  ctx.fillRect(-barWidth / 2, barHeight + 1, barWidth * healthRatio, barHeight);

  ctx.restore();
}

export function drawProjectiles(ctx: CanvasRenderingContext2D, projectiles: LaserProjectile[]) {
  for (const proj of projectiles) {
    ctx.save();
    const angle = Math.atan2(proj.vy, proj.vx);
    ctx.translate(proj.x, proj.y);
    ctx.rotate(angle);

    // Laser beam core and neon bloom
    ctx.shadowColor = proj.color;
    ctx.shadowBlur = 16;

    // Outer glow beam
    ctx.strokeStyle = proj.color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-proj.length, 0);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // Hot white inner core
    ctx.shadowBlur = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-proj.length * 0.8, 0);
    ctx.lineTo(0, 0);
    ctx.stroke();

    ctx.restore();
  }
}
