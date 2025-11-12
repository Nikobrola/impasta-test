import { supabase } from '../lib/supabase';
import { GameMode } from '../types';

export interface RoomRow {
  id: string;
  code: string;
  host_id: string;
  game_mode: GameMode;
  impostor_count: number;
  has_jester: boolean;
  is_randomize_mode: boolean;
  selected_pack: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoomPlayerRow {
  id: string;
  room_id: string;
  player_id: string;
  username: string;
  avatar: string | null;
  is_host: boolean;
  is_bot: boolean;
  is_connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface GameStateRow {
  id: string;
  room_id: string;
  state: Record<string, unknown>; // JSONB field containing the full GameState
  created_at: string;
  updated_at: string;
}

/**
 * Create a new room
 */
export async function createRoom(
  hostId: string,
  code: string,
  gameMode: GameMode,
  impostorCount: number,
  hasJester: boolean,
  isRandomizeMode: boolean,
  selectedPack: string | null
): Promise<RoomRow | null> {
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      code,
      host_id: hostId,
      game_mode: gameMode,
      impostor_count: impostorCount,
      has_jester: hasJester,
      is_randomize_mode: isRandomizeMode,
      selected_pack: selectedPack,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating room:', error);
    return null;
  }

  return data;
}

/**
 * Get room by code
 */
export async function getRoomByCode(code: string): Promise<RoomRow | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching room:', error);
    return null;
  }

  return data;
}

/**
 * Get room by ID
 */
export async function getRoomById(roomId: string): Promise<RoomRow | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (error) {
    console.error('Error fetching room:', error);
    return null;
  }

  return data;
}

/**
 * Update room
 */
export async function updateRoom(
  roomId: string,
  updates: Partial<Omit<RoomRow, 'id' | 'created_at' | 'updated_at'>>
): Promise<RoomRow | null> {
  const { data, error } = await supabase
    .from('rooms')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', roomId)
    .select()
    .single();

  if (error) {
    console.error('Error updating room:', error);
    return null;
  }

  return data;
}

/**
 * Add a player to a room (or update if they already exist)
 * Uses UPSERT to handle re-joins gracefully
 */
export async function addPlayerToRoom(
  roomId: string,
  playerId: string,
  username: string,
  avatar: string | null,
  isHost: boolean,
  isBot: boolean = false
): Promise<RoomPlayerRow | null> {
  const { data, error } = await supabase
    .from('room_players')
    .upsert({
      room_id: roomId,
      player_id: playerId,
      username,
      avatar,
      is_host: isHost,
      is_bot: isBot,
      is_connected: true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'room_id,player_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding player to room:', error);
    return null;
  }

  return data;
}

/**
 * Get all players in a room
 */
export async function getRoomPlayers(roomId: string): Promise<RoomPlayerRow[]> {
  const { data, error } = await supabase
    .from('room_players')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching room players:', error);
    return [];
  }

  return data || [];
}

/**
 * Update a player in a room
 */
export async function updateRoomPlayer(
  roomId: string,
  playerId: string,
  updates: Partial<Omit<RoomPlayerRow, 'id' | 'room_id' | 'player_id' | 'created_at' | 'updated_at'>>
): Promise<RoomPlayerRow | null> {
  const { data, error } = await supabase
    .from('room_players')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('room_id', roomId)
    .eq('player_id', playerId)
    .select()
    .single();

  if (error) {
    console.error('Error updating room player:', error);
    return null;
  }

  return data;
}

/**
 * Remove a player from a room
 */
export async function removePlayerFromRoom(
  roomId: string,
  playerId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('room_players')
    .delete()
    .eq('room_id', roomId)
    .eq('player_id', playerId);

  if (error) {
    console.error('Error removing player from room:', error);
    return false;
  }

  return true;
}

/**
 * Save game state
 */
export async function saveGameState(
  roomId: string,
  gameState: Record<string, unknown>
): Promise<GameStateRow | null> {
  // CRITICAL FIX: Use UPSERT to avoid race conditions
  // UPSERT will INSERT if row doesn't exist, UPDATE if it does
  // This eliminates the race condition between check and insert that causes 409 Conflict errors
  console.log('💾 Upserting game state to Supabase (INSERT or UPDATE)...', {
    roomId,
    hasCurrentScreen: !!(gameState as any).currentScreen,
    currentScreen: (gameState as any).currentScreen,
    phase: (gameState as any).phase
  });
  
  // Use upsert with onConflict on room_id (which is UNIQUE)
  // If room_id exists, UPDATE; if not, INSERT
  const { data: upserted, error: upsertError } = await supabase
    .from('game_states')
    .upsert({
      room_id: roomId, // UNIQUE constraint - if exists, UPDATE; if not, INSERT
      state: gameState,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'room_id', // Conflict on room_id (UNIQUE constraint)
      ignoreDuplicates: false // Update on conflict instead of ignoring
    })
    .select()
    .single();

  if (upsertError) {
    // Handle specific error cases
    if (upsertError.code === '42501') {
      console.error('❌ RLS policy blocked upsert:', {
        errorCode: upsertError.code,
        errorMessage: upsertError.message,
        roomId,
        message: 'Check RLS policies - user must be host to INSERT, or in room_players to UPDATE'
      });
    } else if (upsertError.code === '23505') {
      // Still got duplicate key error (shouldn't happen with upsert, but handle it)
      console.error('❌ Duplicate key error even with upsert - race condition detected:', upsertError);
      // Try UPDATE as fallback
      const { data: updated, error: updateError } = await supabase
        .from('game_states')
        .update({
          state: gameState,
          updated_at: new Date().toISOString(),
        })
        .eq('room_id', roomId)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Error updating game state after upsert failure:', updateError);
        return null;
      }
      
      console.log('✅ Game state updated successfully after upsert fallback - realtime WILL trigger');
      return updated;
    } else if (upsertError.code === 'PGRST116') {
      // No rows returned (shouldn't happen with single(), but handle it)
      console.warn('⚠️ Upsert returned no rows (PGRST116) - this is unexpected');
      return null;
    } else {
      console.error('❌ Error upserting game state:', {
        error: upsertError,
        errorCode: upsertError.code,
        errorMessage: upsertError.message,
        roomId
      });
    }
    return null;
  }

  console.log('✅ Game state upserted successfully in Supabase - realtime WILL trigger', {
    currentScreen: (gameState as any).currentScreen,
    phase: (gameState as any).phase,
    playerCount: (gameState as any).players?.length,
    hasPlayerRoles: !!(gameState as any).playerRoles && Object.keys((gameState as any).playerRoles || {}).length > 0
  });
  
  return upserted;
}

/**
 * Update game state (for non-host players - uses UPDATE only, no INSERT)
 * This allows non-host players to update their submissions
 * RLS policy allows UPDATE for players in room_players
 */
export async function updateGameState(
  roomId: string,
  gameState: Record<string, unknown>
): Promise<GameStateRow | null> {
  console.log('💾 Updating game state in Supabase (UPDATE only)...', {
    roomId,
    hasCurrentScreen: !!(gameState as any).currentScreen,
    currentScreen: (gameState as any).currentScreen,
    phase: (gameState as any).phase
  });
  
  // Use UPDATE only (no INSERT) - RLS policy allows UPDATE for players in room_players
  const { data: updated, error: updateError } = await supabase
    .from('game_states')
    .update({
      state: gameState,
      updated_at: new Date().toISOString(),
    })
    .eq('room_id', roomId)
    .select()
    .single();

  if (updateError) {
    if (updateError.code === '42501') {
      console.error('❌ RLS policy blocked update:', {
        errorCode: updateError.code,
        errorMessage: updateError.message,
        roomId,
        message: 'User must be in room_players to UPDATE game state'
      });
    } else if (updateError.code === 'PGRST116') {
      // No rows found - game state doesn't exist yet
      console.warn('⚠️ Game state not found - host may not have started the game yet');
    } else {
      console.error('Error updating game state:', updateError);
    }
    return null;
  }

  return updated;
}

/**
 * Get game state for a room
 */
export async function getGameState(roomId: string): Promise<GameStateRow | null> {
  // CRITICAL FIX: Use maybeSingle() instead of single() to avoid errors when no row exists
  // This fixes the 400 Bad Request error when game state doesn't exist yet
  const { data, error } = await supabase
    .from('game_states')
    .select('*')
    .eq('room_id', roomId)
    .maybeSingle(); // Use maybeSingle() to return null instead of error when no row exists

  if (error) {
    // PGRST116 means no rows found - this is expected if game hasn't started yet
    if (error.code === 'PGRST116') {
      console.log('ℹ️ No game state found (game not started yet)');
      return null;
    }
    
    // Other errors (like RLS policy blocks) should be logged
    if (error.code === '42501' || error.code === 'PGRST301') {
      console.error('❌ RLS policy blocked game state fetch:', {
        errorCode: error.code,
        errorMessage: error.message,
        roomId,
        message: 'Check RLS SELECT policy - user must be in room_players'
      });
    } else {
      console.error('❌ Error fetching game state:', {
        error,
        errorCode: error.code,
        errorMessage: error.message,
        roomId
      });
    }
    return null;
  }

  return data;
}

/**
 * Subscribe to room changes
 */
export function subscribeToRoom(
  roomId: string,
  callback: (room: RoomRow) => void
) {
  return supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        callback(payload.new as RoomRow);
      }
    )
    .subscribe();
}

/**
 * Subscribe to room players changes
 */
export function subscribeToRoomPlayers(
  roomId: string,
  callback: (players: RoomPlayerRow[]) => void
) {
  return supabase
    .channel(`room_players:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'room_players',
        filter: `room_id=eq.${roomId}`,
      },
      async () => {
        // Fetch all players when any change occurs
        const players = await getRoomPlayers(roomId);
        callback(players);
      }
    )
    .subscribe();
}

/**
 * Subscribe to game state changes
 */
export function subscribeToGameState(
  roomId: string,
  callback: (gameState: GameStateRow) => void
) {
  const channel = supabase
    .channel(`game_state:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_states',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        console.log('Game state subscription triggered:', payload.eventType, payload);
        // For UPDATE events, use payload.new; for INSERT, also use payload.new
        if (payload.new) {
          callback(payload.new as GameStateRow);
        }
      }
    )
    .subscribe((status) => {
      console.log('Game state subscription status:', status);
    });
  
  return channel;
}

