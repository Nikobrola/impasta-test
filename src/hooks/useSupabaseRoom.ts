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

    // OPTIMIZED: Cache game state to avoid fetching on every player update (expensive on mobile)
    // Use a ref to persist across re-renders but reset when roomId changes
    let cachedGameState: GameState | undefined = undefined;

    // Subscribe to room changes
    const roomSubscription = roomService.subscribeToRoom(roomId, (room) => {
      // Handle room updates if needed
      console.log('Room updated:', room);
    });

    // Subscribe to room players changes
    // OPTIMIZED: Use cached game state instead of fetching every time
    // This significantly improves performance on mobile devices
    const playersSubscription = roomService.subscribeToRoomPlayers(roomId, (roomPlayers) => {
      if (onPlayersUpdate) {
        // Use cached game state instead of fetching every time
        // This significantly improves performance on mobile
        const players = roomPlayers.map(rp => roomPlayerToPlayer(rp, cachedGameState));
        onPlayersUpdate(players);
      }
    });

    // Subscribe to game state changes
    const gameStateSubscription = roomService.subscribeToGameState(roomId, (gameStateData) => {
      if (onGameStateUpdate) {
        const gameState = gameStateData.state as GameState;
        
        // Cache game state for use in player updates (performance optimization)
        cachedGameState = gameState;
        
        onGameStateUpdate(gameState);
        
        // Sync screen from game state
        if (gameState.currentScreen && onScreenUpdate) {
          onScreenUpdate(gameState.currentScreen);
        }
      }
    });
    
    // Initial fetch of game state to populate cache
    roomService.getGameState(roomId).then((gameStateData) => {
      if (gameStateData?.state) {
        cachedGameState = gameStateData.state as GameState;
      }
    }).catch((error) => {
      console.warn('Could not fetch initial game state for cache:', error);
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

