import { Player, GameState } from '../types';
import { RoomPlayerRow, RoomRow } from '../services/roomService';

/**
 * Convert RoomPlayerRow to Player
 */
export function roomPlayerToPlayer(
  roomPlayer: RoomPlayerRow,
  gameState?: GameState
): Player {
  const playerFromState = gameState?.players.find(p => p.id === roomPlayer.player_id);
  
  return {
    id: roomPlayer.player_id,
    username: roomPlayer.username,
    avatar: roomPlayer.avatar || undefined,
    isHost: roomPlayer.is_host,
    role: playerFromState?.role || 'innocent',
    isConnected: roomPlayer.is_connected,
    answer: playerFromState?.answer || '',
    hasVoted: playerFromState?.hasVoted || false,
    hasSubmittedAnswer: playerFromState?.hasSubmittedAnswer || false,
    hasSeenRole: playerFromState?.hasSeenRole || false,
    isEliminated: playerFromState?.isEliminated || false,
    isBot: roomPlayer.is_bot,
  };
}

/**
 * Convert Player to RoomPlayerRow (for inserts/updates)
 */
export function playerToRoomPlayer(
  player: Player,
  roomId: string
): Omit<RoomPlayerRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    room_id: roomId,
    player_id: player.id,
    username: player.username,
    avatar: player.avatar || null,
    is_host: player.isHost,
    is_bot: player.isBot || false,
    is_connected: player.isConnected,
  };
}

/**
 * Convert RoomRow to partial GameState
 */
export function roomToGameState(room: RoomRow): Partial<GameState> {
  return {
    roomCode: room.code,
    hostId: room.host_id,
    gameMode: room.game_mode,
    impostorCount: room.impostor_count,
    hasJester: room.has_jester,
    isRandomizeMode: room.is_randomize_mode,
    selectedPack: room.selected_pack,
  };
}

