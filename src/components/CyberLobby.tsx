import React, { useState } from 'react';
import { DogBreedId, DOG_BREEDS, RoomState, Player } from '../types/game.ts';
import { DogSelector } from './DogSelector.tsx';
import { soundEngine } from '../utils/audio.ts';
import {
  Users,
  Copy,
  Check,
  Bot,
  Play,
  Volume2,
  VolumeX,
  Music,
  Radio,
  ArrowRight,
  ShieldCheck,
  Award
} from 'lucide-react';

interface CyberLobbyProps {
  roomState: RoomState | null;
  myPlayerId: string | null;
  currentRoomCode: string | null;
  isHost: boolean;
  isInGame: boolean;
  errorMessage: string | null;
  onCreateRoom: (playerName: string, breed: DogBreedId, customCode?: string) => void;
  onJoinRoom: (roomCode: string, playerName: string, breed: DogBreedId) => void;
  onSetReady: (isReady: boolean) => void;
  onSetBreed: (breed: DogBreedId) => void;
  onStartGame: () => void;
  onAddBot: () => void;
  onRemoveBot: (botId: string) => void;
  onLeaveRoom: () => void;
}

export const CyberLobby: React.FC<CyberLobbyProps> = ({
  roomState,
  myPlayerId,
  currentRoomCode,
  isHost,
  isInGame,
  errorMessage,
  onCreateRoom,
  onJoinRoom,
  onSetReady,
  onSetBreed,
  onStartGame,
  onAddBot,
  onRemoveBot,
  onLeaveRoom
}) => {
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('cyberbark_name') || `CyberHound_${Math.floor(100 + Math.random() * 900)}`;
  });
  const [selectedBreed, setSelectedBreed] = useState<DogBreedId>('shiba');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [customCreateCode, setCustomCreateCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted);
  const [isBgmActive, setIsBgmActive] = useState(soundEngine.bgmActive);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  const myPlayer: Player | null = (roomState && myPlayerId) ? roomState.players[myPlayerId] || null : null;

  const handleNameChange = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('cyberbark_name', name);
  };

  const handleCopyCode = () => {
    if (currentRoomCode) {
      navigator.clipboard.writeText(currentRoomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleToggleMute = () => {
    soundEngine.isMuted = !soundEngine.isMuted;
    setIsMuted(soundEngine.isMuted);
  };

  const handleToggleBgm = () => {
    const active = soundEngine.toggleBGM();
    setIsBgmActive(active);
  };

  // If already connected inside a room lobby
  if (isInGame && roomState) {
    const playersList = Object.values(roomState.players);
    const allReady = playersList.length > 0 && playersList.every(p => p.isReady || p.isBot);

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Cyberpunk grid background glow */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-4xl relative z-10 flex flex-col gap-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-cyan-500/30 p-4 rounded-2xl backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-pulse">🐕⚡</span>
              <div>
                <h1 className="font-['Orbitron'] text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                  SALA DE COMBATE #{currentRoomCode}
                </h1>
                <p className="text-xs text-slate-400 font-mono">
                  Laser Tag Cyberpunk Canino en Tiempo Real
                </p>
              </div>
            </div>

            {/* 4-digit code action button & audio toggles */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-900/80 text-xs font-mono font-bold tracking-widest transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)]"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? '¡CÓDIGO COPIADO!' : `CÓDIGO: ${currentRoomCode}`}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleBgm}
                className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                  isBgmActive ? 'bg-cyan-600/30 border-cyan-400 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title="Música Synthwave"
              >
                <Music className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleToggleMute}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs transition-colors cursor-pointer"
                title="Efectos de Sonido"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              </button>
            </div>
          </div>

          {/* Dog Breed Customizer in Lobby */}
          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <h2 className="text-sm font-['Orbitron'] font-bold text-cyan-400 tracking-wider mb-3 flex items-center gap-2">
              <Radio className="w-4 h-4" /> SELECCIONA TU CYBER-PERRO
            </h2>
            <DogSelector
              selectedBreed={myPlayer?.breed || selectedBreed}
              onSelectBreed={(breed) => {
                setSelectedBreed(breed);
                onSetBreed(breed);
              }}
            />
          </div>

          {/* Connected Players & Combat Drones List */}
          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-['Orbitron'] font-bold text-slate-200 tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" /> PERROS CONECTADOS ({playersList.length}/8)
              </h2>

              {isHost && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onAddBot}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/80 text-xs font-mono font-semibold transition-all cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5" /> + Añadir Bot de Práctica
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {playersList.map((player) => {
                const breedInfo = DOG_BREEDS[player.breed] || DOG_BREEDS.shiba;
                const isMe = player.id === myPlayerId;
                const isRoomHost = player.id === roomState.hostId;

                return (
                  <div
                    key={player.id}
                    className={`p-3 rounded-xl border flex flex-col justify-between gap-2 transition-all ${
                      isMe
                        ? 'bg-cyan-950/30 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{breedInfo.avatarIcon}</span>
                      <div className="flex items-center gap-1">
                        {isRoomHost && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            HOST
                          </span>
                        )}
                        {player.isBot && isHost && (
                          <button
                            type="button"
                            onClick={() => onRemoveBot(player.id)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 font-mono underline cursor-pointer ml-1"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="font-['Orbitron'] font-bold text-xs text-white truncate flex items-center gap-1">
                        {player.name} {isMe && '(Tú)'}
                      </div>
                      <div className="text-[11px] font-mono text-cyan-400">
                        {breedInfo.name}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono border-t border-slate-800/80 pt-1.5 mt-1">
                      <span className="text-slate-400">Estado:</span>
                      <span className={player.isReady || player.isBot ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                        {player.isReady || player.isBot ? 'LISTO' : 'PREPARANDO'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Match Settings & Launch Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onLeaveRoom}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
              >
                Salir al Menú
              </button>
              <div className="text-xs font-mono text-slate-400 hidden sm:block">
                Modo: <span className="text-cyan-400">Laser Tag Todos contra Todos</span> (Meta: {roomState.arena.maxScore} Bajas)
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Ready / Start Buttons */}
              {!isHost && (
                <button
                  type="button"
                  onClick={() => onSetReady(!myPlayer?.isReady)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-['Orbitron'] font-bold tracking-wider transition-all cursor-pointer ${
                    myPlayer?.isReady
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{myPlayer?.isReady ? '¡ESTOY LISTO!' : 'MARCAR LISTO'}</span>
                </button>
              )}

              {isHost && (
                <button
                  type="button"
                  onClick={onStartGame}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-['Orbitron'] font-black tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.5)] transform hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>INICIAR COMBATE LÁSER</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Menu / Lobby Join & Create Screen
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Cyberpunk grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0284c715_1px,transparent_1px),linear-gradient(to_bottom,#0284c715_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 flex flex-col gap-6">
        {/* Title & Cyber Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono tracking-widest uppercase mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            Laser Tag Multiplayer Cyberpunk
          </div>
          <h1 className="font-['Orbitron'] text-3xl sm:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-fuchsia-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            CYBERBARK
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-['Chakra_Petch'] max-w-lg mx-auto">
            Perros cibernéticos de combate que escupen rayos láser bucales, despliegan barreras de plasma y luchan en salas de 4 dígitos.
          </p>
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-xs font-mono text-rose-200 text-center animate-shake">
            {errorMessage}
          </div>
        )}

        {/* Main Card */}
        <div className="bg-slate-900/90 border border-cyan-500/30 p-5 sm:p-7 rounded-2xl backdrop-blur-md shadow-2xl space-y-6">
          {/* Player Name Input */}
          <div>
            <label className="block text-xs font-['Orbitron'] font-semibold text-cyan-300 mb-1.5">
              NOMBRE DE TU PERRO CYBORG
            </label>
            <input
              type="text"
              maxLength={16}
              value={playerName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej: CyberHound_X"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white font-mono text-sm outline-none transition-colors"
            />
          </div>

          {/* Dog Breed Selection Carousel */}
          <div>
            <label className="block text-xs font-['Orbitron'] font-semibold text-cyan-300 mb-2">
              SELECCIONA TU MODELO DE PERRO
            </label>
            <DogSelector
              selectedBreed={selectedBreed}
              onSelectBreed={setSelectedBreed}
            />
          </div>

          {/* Tabs: Create Room vs Join with 4-Digit Code */}
          <div className="pt-2">
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`py-2 text-xs font-['Orbitron'] font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'create'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                CREAR SALA
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('join')}
                className={`py-2 text-xs font-['Orbitron'] font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'join'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                UNIRSE CON CÓDIGO (4 DÍGITOS)
              </button>
            </div>

            {activeTab === 'create' ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Código de 4 cifras opcional (vacío para generar uno automático)
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={customCreateCode}
                      onChange={(e) => setCustomCreateCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ej: 7744"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-center font-mono text-lg tracking-widest text-cyan-300 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onCreateRoom(playerName, selectedBreed, customCreateCode || undefined)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-['Orbitron'] font-black tracking-wider text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer flex items-center justify-center gap-2 transform hover:scale-[1.01]"
                >
                  <span>CREAR SALA DE LASER TAG</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-2 text-center">
                    INTRODUCE EL CÓDIGO DE 4 DÍGITOS DE LA SALA
                  </label>
                  <div className="flex justify-center">
                    <input
                      type="text"
                      maxLength={4}
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="____"
                      className="w-48 py-3 text-center text-3xl font-['Orbitron'] font-black tracking-[0.5em] text-cyan-400 bg-slate-950 border-2 border-cyan-500/50 rounded-xl focus:border-cyan-300 focus:shadow-[0_0_15px_rgba(6,182,212,0.5)] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={joinCodeInput.length !== 4}
                  onClick={() => onJoinRoom(joinCodeInput, playerName, selectedBreed)}
                  className={`w-full py-3 rounded-xl font-['Orbitron'] font-black tracking-wider text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    joinCodeInput.length === 4
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] transform hover:scale-[1.01]'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>ENTRAR A LA SALA #{joinCodeInput || '----'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feature Highlights & Controls Guide */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono text-slate-400">
          <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-center gap-2.5">
            <span className="text-xl">🔫</span>
            <div>
              <div className="text-cyan-300 font-bold">Láser Bucal</div>
              <div>Apunta con el hocico y escupe pulsos de plasma</div>
            </div>
          </div>

          <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-center gap-2.5">
            <span className="text-xl">🛡️</span>
            <div>
              <div className="text-cyan-300 font-bold">Coberturas & Barreras</div>
              <div>Muros reflectores y escudos de plasma desplegables</div>
            </div>
          </div>

          <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-center gap-2.5">
            <span className="text-xl">⚡</span>
            <div>
              <div className="text-amber-300 font-bold">Power-ups Tácticos</div>
              <div>Turbo Pata, Gatling, Escudo Cuántico e Inmunidad</div>
            </div>
          </div>

          <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-center gap-2.5">
            <span className="text-xl">🤖</span>
            <div>
              <div className="text-cyan-300 font-bold">Bots de Práctica</div>
              <div>Combate en solitario o multijugador en tiempo real</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
