import { useState, useEffect, useRef, useCallback } from 'react';
import {
  RoomState,
  Player,
  DogBreedId,
  ClientMessage,
  ServerMessage
} from '../types/game.ts';
import { soundEngine } from '../utils/audio.ts';
import { ParticleManager } from '../utils/canvasRenderer.ts';

export function useLaserGame() {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInGame, setIsInGame] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const particleManagerRef = useRef<ParticleManager>(new ParticleManager());

  // Input states
  const inputRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    angle: 0,
    isShieldActive: false
  });

  const send = useCallback((msg: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const connect = useCallback((): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        resolve(socketRef.current);
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        setErrorMessage(null);
        resolve(ws);
      };

      ws.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);
          if (msg.type === 'joined_success') {
            setMyPlayerId(msg.playerId);
            setCurrentRoomCode(msg.roomCode);
            setIsHost(msg.isHost);
            setIsInGame(true);
          } else if (msg.type === 'room_state') {
            setRoomState(msg.state);
          } else if (msg.type === 'laser_fired') {
            // Muzzle flash particle & audio
            particleManagerRef.current.addMuzzleFlash(msg.x, msg.y, msg.angle, msg.color);
            soundEngine.playLaserBark();
          } else if (msg.type === 'hit_effect') {
            if (msg.hitType === 'invulnerable') {
              particleManagerRef.current.addInvulnerableSpark(msg.x, msg.y);
              soundEngine.playInvulnerableHit();
            } else if (msg.hitType === 'shield') {
              particleManagerRef.current.addShieldDeflect(msg.x, msg.y, msg.color);
              soundEngine.playShieldHit();
            } else if (msg.hitType === 'cover') {
              particleManagerRef.current.addLaserSparks(msg.x, msg.y, msg.color, 6);
              soundEngine.playCoverHit();
            } else {
              particleManagerRef.current.addDeathExplosion(msg.x, msg.y, msg.color);
              soundEngine.playDamageHit();
            }
          } else if (msg.type === 'powerup_collected') {
            particleManagerRef.current.addPowerUpCollect(msg.x, msg.y, msg.color);
            soundEngine.playPowerUpCollect(msg.powerUpType);
          } else if (msg.type === 'error') {
            setErrorMessage(msg.message);
          }
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('WS connection error:', err);
        setErrorMessage('Error al conectar con el servidor de Laser Tag.');
        reject(err);
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      socketRef.current = ws;
    });
  }, []);

  // Room actions
  const createRoom = useCallback(async (playerName: string, breed: DogBreedId, customCode?: string) => {
    try {
      await connect();
      send({
        type: 'create_room',
        roomCode: customCode,
        playerName: playerName || 'CyberPup',
        breed
      });
    } catch (e) {
      console.error(e);
    }
  }, [connect, send]);

  const joinRoom = useCallback(async (roomCode: string, playerName: string, breed: DogBreedId) => {
    try {
      await connect();
      send({
        type: 'join_room',
        roomCode,
        playerName: playerName || 'CyberPup',
        breed
      });
    } catch (e) {
      console.error(e);
    }
  }, [connect, send]);

  const setReady = useCallback((isReady: boolean) => {
    send({ type: 'set_ready', isReady });
  }, [send]);

  const setBreed = useCallback((breed: DogBreedId) => {
    send({ type: 'set_breed', breed });
  }, [send]);

  const startGame = useCallback(() => {
    send({ type: 'start_game' });
  }, [send]);

  const addBot = useCallback((breed?: DogBreedId) => {
    send({ type: 'add_bot', breed });
  }, [send]);

  const removeBot = useCallback((botId: string) => {
    send({ type: 'remove_bot', botId });
  }, [send]);

  const restartGame = useCallback(() => {
    send({ type: 'restart_game' });
  }, [send]);

  const shootLaser = useCallback((angle: number) => {
    send({ type: 'shoot', angle });
  }, [send]);

  const dash = useCallback((angle: number) => {
    send({ type: 'dash', angle });
    soundEngine.playDash();
  }, [send]);

  const deployBarrier = useCallback((x: number, y: number) => {
    send({ type: 'deploy_barrier', x, y });
    soundEngine.playDeployBarrier();
  }, [send]);

  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsInGame(false);
    setCurrentRoomCode(null);
    setRoomState(null);
    setMyPlayerId(null);
  }, []);

  // Periodic input sync to server (every 33ms ~30hz)
  useEffect(() => {
    if (!isInGame || roomState?.status !== 'playing') return;

    const interval = setInterval(() => {
      send({
        type: 'input',
        ...inputRef.current
      });
    }, 1000 / 30);

    return () => clearInterval(interval);
  }, [isInGame, roomState?.status, send]);

  const myPlayer: Player | null = (roomState && myPlayerId) ? roomState.players[myPlayerId] || null : null;

  return {
    roomState,
    myPlayer,
    myPlayerId,
    currentRoomCode,
    isHost,
    isConnected,
    isInGame,
    errorMessage,
    setErrorMessage,
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
    particleManager: particleManagerRef.current
  };
}
