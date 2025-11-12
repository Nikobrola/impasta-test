import { useEffect, useRef, useState } from 'react';
import { GameState, Player } from '../types';
import * as roomService from '../services/roomService';
import { signInAnonymously, getCurrentUserId } from '../services/authService';
import { roomPlayerToPlayer, roomToGameState } from '../utils/supabaseUtils';

interface UseSupabaseRoomOptions {
  roomId: string | null;
  onGameStateUpdate?: (gameState: GameState) => void;
  onPlayersUpdate?: (players: Player[]) => void;
  onScreenUpdate?: (screen: string) => void;
}

export function useSupabaseRoom({ roomId, onGameStateUpdate, onPlayersUpdate, onScreenUpdate }: UseSupabaseRoomOptions) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const subscriptionsRef = useRef<Array<{ unsubscribe: () => void }>>([]);

  // Initialize authentication
  useEffect(() => {
    async function init() {
      let userId = await getCurrentUserId();
      
      if (!userId) {
        userId = await signInAnonymously();
      }
      
      setCurrentUserId(userId);
      setIsInitialized(true);
    }
    
    init();
  }, []);

  // Set up subscriptions when roomId is available
  useEffect(() => {
    if (!roomId || !isInitialized) return;

    // Subscribe to room changes
    const roomSubscription = roomService.subscribeToRoom(roomId, (room) => {
      // Handle room updates if needed
      console.log('Room updated:', room);
    });

    // Subscribe to room players changes
    const playersSubscription = roomService.subscribeToRoomPlayers(roomId, async (roomPlayers) => {
      if (onPlayersUpdate) {
        // Get current game state to preserve player roles
        const gameStateData = await roomService.getGameState(roomId);
        const currentGameState = gameStateData?.state as GameState | undefined;
        
        const players = roomPlayers.map(rp => roomPlayerToPlayer(rp, currentGameState));
        onPlayersUpdate(players);
      }
    });

    // Subscribe to game state changes
    const gameStateSubscription = roomService.subscribeToGameState(roomId, (gameStateData) => {
      if (onGameStateUpdate) {
        const gameState = gameStateData.state as GameState;
        onGameStateUpdate(gameState);
        
        // Sync screen from game state
        if (gameState.currentScreen && onScreenUpdate) {
          onScreenUpdate(gameState.currentScreen);
        }
      }
    });

    subscriptionsRef.current = [
      { unsubscribe: () => roomSubscription.unsubscribe() },
      { unsubscribe: () => playersSubscription.unsubscribe() },
      { unsubscribe: () => gameStateSubscription.unsubscribe() },
    ];

    return () => {
      subscriptionsRef.current.forEach(sub => sub.unsubscribe());
      subscriptionsRef.current = [];
    };
  }, [roomId, isInitialized, onGameStateUpdate, onPlayersUpdate, onScreenUpdate]);

  return {
    currentUserId,
    isInitialized,
  };
}

