import React from 'react';
import { Player, RoomState, DOG_BREEDS, POWER_UP_CONFIGS, PowerUpType } from '../types/game.ts';
import { soundEngine } from '../utils/audio.ts';
import {
  Shield,
  Heart,
  BatteryCharging,
  Zap,
  Crosshair,
  Volume2,
  VolumeX,
  Music,
  Trophy,
  Clock,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface GameHUDProps {
  player: Player | null;
  roomState: RoomState;
  onDeployBarrier: () => void;
  onDash: () => void;
  onActivateShield: (active: boolean) => void;
  onTouchShoot: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isBgmActive: boolean;
  onToggleBgm: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  roomState,
  onDeployBarrier,
  onDash,
  onActivateShield,
  onTouchShoot,
  isMuted,
  onToggleMute,
  isBgmActive,
  onToggleBgm
}) => {
  if (!player) return null;

  const breedInfo = DOG_BREEDS[player.breed] || DOG_BREEDS.shiba;

  // Find current top scorer
  const playersList = Object.values(roomState.players);
  const sortedPlayers = [...playersList].sort((a, b) => b.score - a.score);
  const leader = sortedPlayers[0];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const healthPercent = Math.max(0, Math.min(100, player.health));
  const shieldPercent = Math.max(0, Math.min(100, (player.shield / player.maxShield) * 100));
  const shieldEnergyPercent = Math.max(0, Math.min(100, player.shieldEnergy));

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-['Chakra_Petch']">
      {/* TOP HEADER: Timer, Score, Room Code */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-slate-950/85 border border-cyan-500/40 rounded-2xl backdrop-blur-md shadow-2xl pointer-events-auto">
        {/* Match Timer */}
        <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-sm font-bold border-r border-slate-800 pr-3">
          <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>{formatTime(roomState.timeRemainingSec)}</span>
        </div>

        {/* Score to Win */}
        <div className="flex items-center gap-2 border-r border-slate-800 pr-3">
          <Trophy className="w-4 h-4 text-amber-400" />
          <div className="text-xs font-mono">
            <span className="text-slate-400">Meta: </span>
            <span className="text-amber-300 font-bold">{roomState.arena.maxScore} Bajas</span>
          </div>
        </div>

        {/* Active Arena Powerups Count */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono border-r border-slate-800 pr-3">
          <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="text-slate-400">Power-ups:</span>
          <span className="text-amber-300 font-bold">{roomState.powerUps?.length || 0}</span>
        </div>

        {/* Room 4-Digit Code */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-400">SALA:</span>
          <span className="text-cyan-300 font-black tracking-widest bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
            #{roomState.code}
          </span>
        </div>

        {/* Audio Toggles */}
        <div className="flex items-center gap-1 pl-1">
          <button
            type="button"
            onClick={onToggleBgm}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isBgmActive ? 'bg-cyan-600/30 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="Música Synthwave"
          >
            <Music className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            title="Silenciar FX"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* TOP RIGHT: Kill Feed & Quick Leaderboard */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 max-w-xs pointer-events-auto">
        {/* Kill Feed events */}
        <div className="flex flex-col gap-1 items-end">
          {roomState.killFeed.slice(0, 4).map((kf) => (
            <div
              key={kf.id}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/85 border border-slate-800 rounded-lg text-[11px] font-mono shadow-md backdrop-blur-sm"
            >
              <span className="text-cyan-300 font-bold truncate max-w-[85px]">{kf.killerName}</span>
              <span className="text-rose-400 font-extrabold text-[10px]">⚡ [VAPORIZÓ]</span>
              <span className="text-slate-300 truncate max-w-[85px]">{kf.victimName}</span>
            </div>
          ))}
        </div>

        {/* Leaderboard Card */}
        <div className="bg-slate-950/85 border border-slate-800/90 rounded-xl p-2.5 backdrop-blur-md shadow-xl text-xs font-mono">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1 mb-1.5 text-[10px] uppercase font-bold">
            <span>Marcador de Combate</span>
            <span>Bajas</span>
          </div>
          <div className="space-y-1">
            {sortedPlayers.slice(0, 4).map((p, idx) => {
              const isMe = p.id === player.id;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-1.5 py-0.5 rounded text-[11px] ${
                    isMe ? 'bg-cyan-950/60 text-cyan-300 font-bold' : 'text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1 truncate max-w-[140px]">
                    <span className="text-slate-500 w-3">{idx + 1}.</span>
                    <span className="text-xs">{DOG_BREEDS[p.breed]?.avatarIcon}</span>
                    <span className="truncate">{p.name}</span>
                  </div>
                  <span className="font-bold text-amber-400">{p.score}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM LEFT: Player Cyber Status Bar & Active Power-Ups */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 pointer-events-auto">
        {/* Active Power-Ups Cards */}
        {(() => {
          const now = Date.now();
          const activeList = Object.entries(player.activePowerUps || {})
            .filter(([_, exp]) => exp && exp > now)
            .map(([type, exp]) => {
              const pType = type as PowerUpType;
              const conf = POWER_UP_CONFIGS[pType];
              const remainingMs = Math.max(0, exp! - now);
              const remainingSec = (remainingMs / 1000).toFixed(1);
              const progressPercent = Math.min(100, (remainingMs / (conf.effectDurationSec * 1000)) * 100);
              return { type: pType, conf, remainingSec, progressPercent };
            });

          if (activeList.length === 0) return null;

          return (
            <div className="flex flex-col gap-1.5 w-72 sm:w-80">
              {activeList.map((pw) => (
                <div
                  key={pw.type}
                  className="px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-lg flex flex-col gap-1 transition-all"
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderColor: pw.conf.color,
                    boxShadow: `0 0 12px ${pw.conf.glowColor}55`
                  }}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5 font-bold" style={{ color: pw.conf.glowColor }}>
                      <span className="text-base">{pw.conf.icon}</span>
                      <span className="font-['Orbitron'] tracking-wider">{pw.conf.name.toUpperCase()}</span>
                    </div>
                    <span className="font-mono font-bold text-white text-[11px]">
                      {pw.remainingSec}s
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-100"
                      style={{
                        width: `${pw.progressPercent}%`,
                        backgroundColor: pw.conf.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        <div className="bg-slate-950/90 border border-cyan-500/40 p-4 rounded-2xl backdrop-blur-md shadow-2xl w-72 sm:w-80">
          {/* Dog identity */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{breedInfo.avatarIcon}</span>
              <div>
                <div className="font-['Orbitron'] font-black text-xs text-white">
                  {player.name}
                </div>
                <div className="text-[10px] font-mono text-cyan-400">
                  {breedInfo.name} ({breedInfo.role})
                </div>
              </div>
            </div>

            {/* Score */}
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono text-slate-400">TUS BAJAS</span>
              <span className="text-base font-mono font-black text-amber-400">{player.score}</span>
            </div>
          </div>

          {/* Health Bar (Red/Green) */}
          <div className="space-y-1 mb-1.5">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> Integridad Física
              </span>
              <span className="text-white font-bold">{Math.round(player.health)} / 100</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-150"
                style={{ width: `${healthPercent}%` }}
              />
            </div>
          </div>

          {/* Shield Bar (Cyan) */}
          <div className="space-y-1 mb-1.5">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="flex items-center gap-1 text-cyan-400">
                <Shield className="w-3 h-3 text-cyan-400" /> Escudo Energético
              </span>
              <span className="text-cyan-200 font-bold">
                {Math.round(player.shield)} / {player.maxShield}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-cyan-400 transition-all duration-150"
                style={{ width: `${shieldPercent}%` }}
              />
            </div>
          </div>

          {/* Frontal Reflector Battery (Space / Right Click) */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="flex items-center gap-1 text-indigo-400">
                <BatteryCharging className="w-3 h-3 text-indigo-400" /> Batería Escudo Frontal [ESPACIO]
              </span>
              <span className="text-indigo-300 font-bold">{Math.round(player.shieldEnergy)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-100 ${
                  player.isShieldActive ? 'bg-indigo-300 animate-pulse' : 'bg-indigo-500'
                }`}
                style={{ width: `${shieldEnergyPercent}%` }}
              />
            </div>
          </div>

          {/* Deployable Cover Barriers & Tactical Abilities */}
          <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-800/80 text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Barreras [E]:</span>
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded border text-[9px] flex items-center justify-center font-bold ${
                      i < player.deployableBarriersLeft
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-700'
                    }`}
                  >
                    🛡
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onDeployBarrier}
              disabled={player.deployableBarriersLeft <= 0}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                player.deployableBarriersLeft > 0
                  ? 'bg-cyan-950 border-cyan-400 text-cyan-300 hover:bg-cyan-900'
                  : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              DESPLEGAR [E]
            </button>
          </div>
        </div>

        {/* Tactical Controls Helper Pill */}
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-950/70 border border-slate-800/80 rounded-xl text-[10px] font-mono text-slate-400 backdrop-blur-sm">
          <span><kbd className="px-1 py-0.5 bg-slate-800 text-cyan-300 rounded">WASD</kbd> Moverse</span>
          <span><kbd className="px-1 py-0.5 bg-slate-800 text-cyan-300 rounded">RATÓN</kbd> Apuntar</span>
          <span><kbd className="px-1 py-0.5 bg-slate-800 text-cyan-300 rounded">CLIC</kbd> Escupir Láser</span>
          <span><kbd className="px-1 py-0.5 bg-slate-800 text-cyan-300 rounded">ESPACIO</kbd> Escudo</span>
          <span><kbd className="px-1 py-0.5 bg-slate-800 text-cyan-300 rounded">E</kbd> Cobertura</span>
          <span><kbd className="px-1 py-0.5 bg-slate-800 text-cyan-300 rounded">SHIFT</kbd> Dash</span>
        </div>
      </div>

      {/* MOBILE / TOUCH CONTROLS (Only visible on touch devices or small screens) */}
      <div className="sm:hidden absolute bottom-4 right-4 flex flex-col gap-2 items-end pointer-events-auto">
        <div className="flex gap-2">
          {/* Tactical Dash button */}
          <button
            type="button"
            onClick={onDash}
            className="w-12 h-12 rounded-full bg-slate-900/90 border-2 border-indigo-500/80 text-indigo-300 font-bold flex items-center justify-center text-xs shadow-lg active:scale-95"
            title="Dash"
          >
            <Zap className="w-5 h-5 text-indigo-400" />
          </button>

          {/* Deploy Cover Barrier button */}
          <button
            type="button"
            onClick={onDeployBarrier}
            disabled={player.deployableBarriersLeft <= 0}
            className="w-12 h-12 rounded-full bg-slate-900/90 border-2 border-cyan-500/80 text-cyan-300 font-bold flex items-center justify-center text-xs shadow-lg active:scale-95 disabled:opacity-40"
            title="Barrera"
          >
            <Shield className="w-5 h-5 text-cyan-400" />
          </button>
        </div>

        <div className="flex gap-2">
          {/* Front Shield hold button */}
          <button
            type="button"
            onPointerDown={() => onActivateShield(true)}
            onPointerUp={() => onActivateShield(false)}
            onPointerCancel={() => onActivateShield(false)}
            className="w-14 h-14 rounded-full bg-cyan-950/90 border-2 border-cyan-400 text-cyan-300 font-bold flex flex-col items-center justify-center text-[9px] shadow-xl active:scale-95"
          >
            <Shield className="w-5 h-5" />
            <span>ESCUDO</span>
          </button>

          {/* Shoot Laser Bark Button */}
          <button
            type="button"
            onClick={onTouchShoot}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 border-2 border-amber-300 text-white font-black flex flex-col items-center justify-center text-[10px] shadow-[0_0_20px_rgba(244,63,94,0.6)] active:scale-90"
          >
            <Crosshair className="w-6 h-6 animate-pulse" />
            <span>LÁSER</span>
          </button>
        </div>
      </div>
    </div>
  );
};
