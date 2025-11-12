import { PlayerRole } from '../types';

export function generateRoomCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code as `${number}${number}${number}${number}${number}${number}`;
}

export function generatePlayerId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function assignRoles(
  players: { id: string; role: 'spectator' | string }[], 
  impostorCount: number = 1, 
  hasJester: boolean = false
): { roles: PlayerRole[], jesterCluePlayerIds: string[] } {
  const assignments = new Map<string, PlayerRole>();
  let jesterCluePlayerIds: string[] = [];

  // 1. Preserve spectators in both randomize mode and custom packs (standard mode)
  // In randomize mode: preserve spectators (eliminated players)
  // In standard mode: preserve spectators only for custom packs (host spectators)
  const playingPlayers = players.filter(p => p.role !== 'spectator');
  const spectatorPlayers = players.filter(p => p.role === 'spectator');
  
  spectatorPlayers.forEach(p => assignments.set(p.id, 'spectator'));

  // Create a mutable array of players to assign roles from, and shuffle it
  const unassignedPlayers = [...playingPlayers].sort(() => 0.5 - Math.random());

  // 2. Assign Impostors
  for (let i = 0; i < impostorCount; i++) {
    const player = unassignedPlayers.pop();
    if (player) {
      assignments.set(player.id, 'impostor');
    }
  }

  // At this point, `unassignedPlayers` contains only non-impostors
  const nonImpostors = unassignedPlayers;

  // 3. Assign Jester and determine clue recipients (if applicable)
  if (hasJester && nonImpostors.length > 0) {
    // Determine how many players get the clue
    const clueCount = Math.max(1, Math.floor(nonImpostors.length / 2));
    
    // The nonImpostors are already shuffled, so we can slice from the start
    const clueRecipients = nonImpostors.slice(0, clueCount);
    jesterCluePlayerIds = clueRecipients.map(p => p.id);

    // From that clue group, randomly select the Jester
    const jesterIndex = Math.floor(Math.random() * clueRecipients.length);
    const jesterPlayer = clueRecipients[jesterIndex];
    assignments.set(jesterPlayer.id, 'jester');

    // All other non-impostors are Innocent
    nonImpostors.forEach(player => {
      if (player.id !== jesterPlayer.id) {
        assignments.set(player.id, 'innocent');
      }
    });

  } else {
    // No jester, all remaining players are innocent
    nonImpostors.forEach(player => {
      assignments.set(player.id, 'innocent');
    });
  }

  // 4. Create the final ordered list of roles
  const finalRoles = players.map(player => assignments.get(player.id) || 'innocent');

  return { roles: finalRoles, jesterCluePlayerIds };
}

export function getRandomImpostorCount(playerCount: number): number {
  const maxImpostors = Math.max(1, Math.floor((playerCount - 1) / 2));
  return Math.max(1, Math.floor(Math.random() * maxImpostors) + 1);
}

export function shouldShowJesterHint(nonImpostorCount: number, playerId: string, allPlayerIds: string[]): boolean {
  const hintRecipientCount = Math.floor(nonImpostorCount / 2);
  const shuffledIds = [...allPlayerIds].sort();
  return shuffledIds.slice(0, hintRecipientCount).includes(playerId);
}