import React, { useEffect } from 'react';
import { Player, RoomState, DOG_BREEDS } from '../types/game.ts';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Award, Skull, Crosshair } from 'lucide-react';

interface GameOverModalProps {
  roomState: RoomState;
  myPlayerId: string | null;
  isHost: boolean;
  onRestart: () => void;
  onLeave: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  roomState,
  myPlayerId,
  isHost,
  onRestart,
  onLeave
}) => {
  const winner = roomState.winner;
  const isMeWinner = winner && winner.id === myPlayerId;
  const winnerBreed = winner ? DOG_BREEDS[winner.breed] : null;

  useEffect(() => {
    // Cyberpunk neon confetti burst!
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#00f3ff', '#a855f7', '#ec4899', '#f59e0b', '#10b981']
    });
  }, []);

  const playersList = Object.values(roomState.players).sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900/95 border-2 border-cyan-400 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)] relative overflow-hidden font-['Chakra_Petch']">
        {/* Glow corner decorations */}
        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-cyan-400 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-cyan-400 pointer-events-none" />

        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-mono uppercase tracking-widest">
            <Trophy className="w-4 h-4 text-amber-400" />
            ¡COMBATE FINALIZADO!
          </div>

          <h2 className="font-['Orbitron'] text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-300 to-fuchsia-400">
            {isMeWinner ? '¡VICTORIA CANINA!' : 'FIN DE LA PARTIDA'}
          </h2>

          {winner && winnerBreed && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.15)] flex items-center justify-center gap-4">
              <span className="text-5xl">{winnerBreed.avatarIcon}</span>
              <div className="text-left">
                <div className="text-xs font-mono text-amber-400 font-bold uppercase">
                  🏆 CAMPEÓN DEL LASER TAG
                </div>
                <div className="font-['Orbitron'] text-xl font-black text-white">
                  {winner.name}
                </div>
                <div className="text-xs font-mono text-slate-300">
                  {winnerBreed.name} — <span className="text-amber-300 font-bold">{winner.score} Bajas</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Podium Leaderboard Table */}
        <div className="space-y-2 mb-6">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider px-2 flex justify-between">
            <span>Posición y Perro Cyborg</span>
            <span>Bajas / Muertes</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {playersList.map((p, idx) => {
              const isMe = p.id === myPlayerId;
              const breed = DOG_BREEDS[p.breed];
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono transition-all ${
                    idx === 0
                      ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                      : isMe
                      ? 'bg-cyan-950/40 border-cyan-400/60 text-cyan-200'
                      : 'bg-slate-950/50 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold w-4 text-center">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                    </span>
                    <span className="text-lg">{breed?.avatarIcon}</span>
                    <div>
                      <div className="font-bold text-white truncate max-w-[150px]">
                        {p.name} {isMe && '(Tú)'}
                      </div>
                      <div className="text-[10px] text-slate-400">{breed?.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <Crosshair className="w-3.5 h-3.5" /> {p.score}
                    </span>
                    <span className="flex items-center gap-1 text-rose-400">
                      <Skull className="w-3.5 h-3.5" /> {p.deaths}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLeave}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Volver al Menú</span>
          </button>

          {isHost ? (
            <button
              type="button"
              onClick={onRestart}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-['Orbitron'] font-black text-xs tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>REVANCHA (OTRA RONDA)</span>
            </button>
          ) : (
            <div className="flex-1 text-center text-xs font-mono text-slate-400 py-3 bg-slate-950/60 rounded-xl border border-slate-800">
              Esperando al anfitrión...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
