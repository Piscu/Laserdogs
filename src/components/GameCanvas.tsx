import React, { useEffect, useRef, useCallback } from 'react';
import { Player, RoomState, LaserProjectile, CoverObstacle } from '../types/game.ts';
import {
  drawArenaBackground,
  drawObstacles,
  drawPowerUps,
  drawProjectiles,
  drawCyberDog,
  ParticleManager
} from '../utils/canvasRenderer.ts';

interface GameCanvasProps {
  roomState: RoomState;
  myPlayerId: string | null;
  inputRef: React.MutableRefObject<{
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    angle: number;
    isShieldActive: boolean;
  }>;
  particleManager: ParticleManager;
  onShootLaser: (angle: number) => void;
  onDash: (angle: number) => void;
  onDeployBarrier: (x: number, y: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  roomState,
  myPlayerId,
  inputRef,
  particleManager,
  onShootLaser,
  onDash,
  onDeployBarrier
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef({ x: 1000, y: 700 });
  const mousePosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const isMouseDownRef = useRef(false);
  const lastShootRef = useRef(0);

  // Handle keydown & keyup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW', 'w', 'W'].includes(e.code)) inputRef.current.up = true;
      if (['ArrowDown', 'KeyS', 's', 'S'].includes(e.code)) inputRef.current.down = true;
      if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(e.code)) inputRef.current.left = true;
      if (['ArrowRight', 'KeyD', 'd', 'D'].includes(e.code)) inputRef.current.right = true;

      // Frontal shield
      if (e.code === 'Space') {
        inputRef.current.isShieldActive = true;
      }

      // Tactical Barrier deploy
      if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
        const myP = myPlayerId ? roomState.players[myPlayerId] : null;
        if (myP) {
          onDeployBarrier(myP.x, myP.y);
        }
      }

      // Tactical Dash
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        onDash(inputRef.current.angle);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW', 'w', 'W'].includes(e.code)) inputRef.current.up = false;
      if (['ArrowDown', 'KeyS', 's', 'S'].includes(e.code)) inputRef.current.down = false;
      if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(e.code)) inputRef.current.left = false;
      if (['ArrowRight', 'KeyD', 'd', 'D'].includes(e.code)) inputRef.current.right = false;

      if (e.code === 'Space') {
        inputRef.current.isShieldActive = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [inputRef, myPlayerId, roomState.players, onDeployBarrier, onDash]);

  // Handle mouse events
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    mousePosRef.current = { x: e.clientX, y: e.clientY };

    // Update aim angle relative to screen center (where player is centered)
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    inputRef.current.angle = angle;
  }, [inputRef]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      // Left click = Shoot mouth laser
      isMouseDownRef.current = true;
      onShootLaser(inputRef.current.angle);
      lastShootRef.current = Date.now();
    } else if (e.button === 2) {
      // Right click = Hold front shield
      inputRef.current.isShieldActive = true;
    }
  }, [inputRef, onShootLaser]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      isMouseDownRef.current = false;
    } else if (e.button === 2) {
      inputRef.current.isShieldActive = false;
    }
  }, [inputRef]);

  // Continuous shooting if mouse is held down
  useEffect(() => {
    const shootInterval = setInterval(() => {
      if (isMouseDownRef.current) {
        onShootLaser(inputRef.current.angle);
      }
    }, 120);

    return () => clearInterval(shootInterval);
  }, [inputRef, onShootLaser]);

  // Main Render Loop (60fps requestAnimationFrame)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = (time: number) => {
      // Adjust canvas resolution to match window
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const viewW = canvas.width;
      const viewH = canvas.height;

      // Find my player to center camera smoothly
      const myP = myPlayerId ? roomState.players[myPlayerId] : null;
      if (myP) {
        const targetCamX = myP.x;
        const targetCamY = myP.y;
        cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.15;
        cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.15;
      }

      // Camera boundaries
      const camX = Math.max(viewW / 2, Math.min(roomState.arena.width - viewW / 2, cameraRef.current.x));
      const camY = Math.max(viewH / 2, Math.min(roomState.arena.height - viewH / 2, cameraRef.current.y));

      ctx.clearRect(0, 0, viewW, viewH);

      // Save and translate to world space
      ctx.save();
      ctx.translate(viewW / 2 - camX, viewH / 2 - camY);

      // 1. Draw Arena Floor & Cyberpunk Grid
      drawArenaBackground(ctx, roomState.arena.width, roomState.arena.height, time);

      // 2. Draw Obstacles (Pillars, Barricades, Plasma Crates, Stations)
      drawObstacles(ctx, roomState.obstacles, time);

      // 3. Draw Spawnable Power-Ups
      drawPowerUps(ctx, roomState.powerUps || [], time);

      // 4. Draw Laser Projectiles
      drawProjectiles(ctx, roomState.projectiles);

      // 4. Draw Particles (Sparks, Deflections, Explosions)
      particleManager.updateAndDraw(ctx);

      // 5. Draw Cyber Dogs
      // Draw other players first
      for (const id in roomState.players) {
        if (id !== myPlayerId) {
          drawCyberDog(ctx, roomState.players[id], false, time);
        }
      }
      // Draw my player on top
      if (myP) {
        drawCyberDog(ctx, myP, true, time);
      }

      ctx.restore();

      // Draw custom Cyberpunk crosshair at mouse position
      const mx = mousePosRef.current.x;
      const my = mousePosRef.current.y;
      ctx.save();
      ctx.strokeStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.5;

      // Reticle circle
      ctx.beginPath();
      ctx.arc(mx, my, 12, 0, Math.PI * 2);
      ctx.stroke();

      // Cross ticks
      ctx.beginPath();
      ctx.moveTo(mx - 18, my);
      ctx.lineTo(mx - 6, my);
      ctx.moveTo(mx + 6, my);
      ctx.lineTo(mx + 18, my);
      ctx.moveTo(mx, my - 18);
      ctx.lineTo(mx, my - 6);
      ctx.moveTo(mx, my + 6);
      ctx.lineTo(mx, my + 18);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(mx, my, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [roomState, myPlayerId, particleManager]);

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
    />
  );
};
