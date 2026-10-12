/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLaserGame } from './hooks/useLaserGame.ts';
import { CyberLobby } from './components/CyberLobby.tsx';
import { GameCanvas } from './components/GameCanvas.tsx';
import { GameHUD } from './components/GameHUD.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { soundEngine } from './utils/audio.ts';

export default function App() {
  const {
    roomState,
    myPlayer,
    myPlayerId,
    currentRoomCode,
    isHost,
    isInGame,
    errorMessage,
    createRoom,
    joinRoom,
    setReady,
    setBreed,
    startGame,
    addBot,
    removeBot,
    restartGame,
    shootLaser,
    dash,
    deployBarrier,
    leaveRoom,
    inputRef,
    particleManager
  } = useLaserGame();

  const [isMuted, setIsMuted] = useState(soundEngine.isMuted);
  const [isBgmActive, setIsBgmActive] = useState(soundEngine.bgmActive);

  // Check URL query param ?room=1234 on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && /^\d{4}$/.test(roomParam) && !isInGame) {
      const storedName = localStorage.getItem('cyberbark_name') || `CyberHound_${Math.floor(100 + Math.random() * 900)}`;
      joinRoom(roomParam, storedName, 'shiba');
    }
  }, [joinRoom, isInGame]);

  const handleToggleMute = () => {
    soundEngine.isMuted = !soundEngine.isMuted;
    setIsMuted(soundEngine.isMuted);
  };

  const handleToggleBgm = () => {
    const active = soundEngine.toggleBGM();
    setIsBgmActive(active);
  };

  const handleTouchShoot = () => {
    shootLaser(inputRef.current.angle);
  };

  const handleActivateShield = (active: boolean) => {
    inputRef.current.isShieldActive = active;
  };

  const handleDeployBarrier = () => {
    if (myPlayer) {
      deployBarrier(myPlayer.x, myPlayer.y);
    }
  };

  const handleDash = () => {
    dash(inputRef.current.angle);
  };

  // If not currently inside an active game (lobby or pre-join)
  const isPlaying = isInGame && roomState && roomState.status === 'playing';
  const isGameOver = isInGame && roomState && roomState.status === 'game_over';

  if (!isPlaying && !isGameOver) {
    return (
      <CyberLobby
        roomState={roomState}
        myPlayerId={myPlayerId}
        currentRoomCode={currentRoomCode}
        isHost={isHost}
        isInGame={isInGame}
        errorMessage={errorMessage}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onSetReady={setReady}
        onSetBreed={setBreed}
        onStartGame={startGame}
        onAddBot={() => addBot()}
        onRemoveBot={removeBot}
        onLeaveRoom={leaveRoom}
      />
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* 2D Canvas Arena */}
      {roomState && (
        <GameCanvas
          roomState={roomState}
          myPlayerId={myPlayerId}
          inputRef={inputRef}
          particleManager={particleManager}
          onShootLaser={shootLaser}
          onDash={dash}
          onDeployBarrier={(x, y) => deployBarrier(x, y)}
        />
      )}

      {/* Futuristic Cyberpunk HUD */}
      {roomState && (
        <GameHUD
          player={myPlayer}
          roomState={roomState}
          onDeployBarrier={handleDeployBarrier}
          onDash={handleDash}
          onActivateShield={handleActivateShield}
          onTouchShoot={handleTouchShoot}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isBgmActive={isBgmActive}
          onToggleBgm={handleToggleBgm}
        />
      )}

      {/* Game Over Victory Modal */}
      {isGameOver && roomState && (
        <GameOverModal
          roomState={roomState}
          myPlayerId={myPlayerId}
          isHost={isHost}
          onRestart={restartGame}
          onLeave={leaveRoom}
        />
      )}
    </div>
  );
}
