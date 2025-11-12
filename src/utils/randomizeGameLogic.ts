import { Player, GameState, WinnerType } from '../types';

export function appendUniqueTieVote(
  existingVotes: Record<string, string[]>[] | undefined,
  votes: Record<string, string[]>
): Record<string, string[]>[] {
  const serialized = JSON.stringify(votes);
  const normalizedExisting = existingVotes || [];
  const lastEntry =
    normalizedExisting.length > 0
      ? JSON.stringify(normalizedExisting[normalizedExisting.length - 1])
      : null;
  if (lastEntry === serialized) {
    return normalizedExisting;
  }
  return [...normalizedExisting, JSON.parse(serialized)];
}

/**
 * Randomize Mode Game Logic
 * 
 * This file contains all logic specific to randomize mode to keep it separate
 * from standard mode logic and avoid conflicts.
 */

/**
 * Processes votes specifically for randomize mode
 * Always eliminates exactly 1 player per round
 */
export function processRandomizeVotes(
  gameState: GameState,
  allVotes: Record<string, string[]>,
  players: Player[]
): {
  isTie: boolean;
  tiedPlayers: string[];
  eliminatedPlayerIds: string[];
  shouldContinue: boolean;
} {
  console.log('=== RANDOMIZE MODE VOTE PROCESSING ===');
  console.log('Processing votes for', players.length, 'players in phase', gameState.phase);
  
  // Count votes for each player
  const voteCounts: Record<string, number> = {};
  
  Object.values(allVotes).forEach(playerVotes => {
    playerVotes.forEach(votedPlayerId => {
      voteCounts[votedPlayerId] = (voteCounts[votedPlayerId] || 0) + 1;
    });
  });

  console.log('Vote counts:', voteCounts);

  // If no votes cast, return error state
  if (Object.keys(voteCounts).length === 0) {
    return {
      isTie: false,
      tiedPlayers: [],
      eliminatedPlayerIds: [],
      shouldContinue: false
    };
  }

  // Find players with most votes
  const voteValues = Object.values(voteCounts);
  const maxVotes = Math.max(...voteValues);
  const playersWithMostVotes = Object.keys(voteCounts).filter(
    playerId => voteCounts[playerId] === maxVotes
  );

  console.log('Players with most votes:', playersWithMostVotes, 'votes:', maxVotes);

  // Check for tie
  if (playersWithMostVotes.length > 1 && maxVotes > 0) {
    console.log('TIE DETECTED in randomize mode');
    return {
      isTie: true,
      tiedPlayers: playersWithMostVotes,
      eliminatedPlayerIds: [],
      shouldContinue: false
    };
  }

  // No tie - eliminate exactly 1 player (the one with most votes)
  const eliminatedPlayerIds = maxVotes > 0 ? [playersWithMostVotes[0]] : [];
  
  console.log('RANDOMIZE ELIMINATION:', eliminatedPlayerIds);

  return {
    isTie: false,
    tiedPlayers: [],
    eliminatedPlayerIds,
    shouldContinue: true
  };
}

/**
 * Checks if randomize mode game should auto-end
 * Returns winners if auto-end condition is met, empty array otherwise
 */
export function checkRandomizeAutoEnd(
  gameState: GameState,
  players: Player[],
  eliminatedPlayerIds: string[]
): { winners: Player[]; winnerType?: WinnerType; shouldAutoEnd: boolean } {
  console.log('=== RANDOMIZE MODE AUTO-END CHECK ===');
  
  const { playerRoles, eliminatedPlayers } = gameState;
  
  // Calculate what eliminated players would be after this round
  const allEliminatedPlayerIds = [...eliminatedPlayers, ...eliminatedPlayerIds];
  
  // Get remaining players (exclude spectators and eliminated)
  const remainingPlayers = players.filter(p => 
    !allEliminatedPlayerIds.includes(p.id) && 
    playerRoles[p.id] !== 'spectator'
  );
  
  const remainingImpostors = remainingPlayers.filter(p => 
    playerRoles[p.id] === 'impostor'
  );
  
  const remainingInnocents = remainingPlayers.filter(p => 
    playerRoles[p.id] === 'innocent'
  );

  console.log('Remaining players after elimination:', {
    total: remainingPlayers.length,
    impostors: remainingImpostors.length,
    innocents: remainingInnocents.length,
    eliminatedThisRound: eliminatedPlayerIds
  });

  // Check if too few players remain (≤2 players) - impostors win
  if (remainingPlayers.length <= 2) {
    console.log('✅ RANDOMIZE AUTO-END: Too few players remaining (≤2)');
    const allImpostorPlayers = players.filter(p => playerRoles[p.id] === 'impostor');
    return {
      winners: allImpostorPlayers,
      winnerType: 'impostor',
      shouldAutoEnd: true
    };
  }
  
  // Check if all impostors are eliminated - innocents win
  if (gameState.gameMode !== 'words' && remainingImpostors.length === 0) {
    console.log('✅ RANDOMIZE AUTO-END: All impostors eliminated');
    const allInnocentPlayers = players.filter(p => playerRoles[p.id] === 'innocent');
    return {
      winners: allInnocentPlayers,
      winnerType: 'innocent',
      shouldAutoEnd: true
    };
  }
  
  // Check if jester was eliminated (shouldn't happen in randomize mode, but safety check)
  const eliminatedJester = eliminatedPlayerIds.find(
    playerId => playerRoles[playerId] === 'jester'
  );
  
  if (eliminatedJester) {
    const jesterPlayer = players.find(p => p.id === eliminatedJester);
    console.log('✅ RANDOMIZE AUTO-END: Jester was eliminated');
    return {
      winners: jesterPlayer ? [jesterPlayer] : [],
      winnerType: 'jester',
      shouldAutoEnd: true
    };
  }
  
  console.log('Randomize mode: No auto-end condition met, game continues');
  return {
    winners: [],
    shouldAutoEnd: false
  };
}

/**
 * Determines the final winner when host finishes randomize mode game
 */
export function determineRandomizeWinner(
  gameState: GameState,
  players: Player[]
): { winners: Player[]; winnerType?: WinnerType } {
  console.log('=== RANDOMIZE MODE FINAL WINNER DETERMINATION ===');
  
  const { playerRoles, eliminatedPlayers } = gameState;
  
  // Find all players for each team
  const allImpostorPlayers = players.filter(p => playerRoles[p.id] === 'impostor');
  const allInnocentPlayers = players.filter(p => playerRoles[p.id] === 'innocent');

  // Find active (not eliminated) impostors
  const activeImpostors = allImpostorPlayers.filter(p => !eliminatedPlayers.includes(p.id));

  console.log('Final state for winner determination:', {
    totalPlayers: players.length,
    eliminatedPlayerIds: eliminatedPlayers,
    playerRoles,
    activeImpostorCount: activeImpostors.length,
    allImpostorIds: allImpostorPlayers.map(p => p.id)
  });

  // If any impostor is still alive when the host ends the game, the impostor team wins
  if (activeImpostors.length > 0) {
    console.log('✅ IMPOSTOR WIN: Impostors were still alive when host finished game.');
    return {
      winners: allImpostorPlayers, // The whole team wins
      winnerType: 'impostor'
    };
  } else {
    // If all impostors are eliminated, the innocent team wins
    console.log('✅ INNOCENT WIN: All impostors were eliminated when host finished game.');
    return {
      winners: allInnocentPlayers,
      winnerType: 'innocent'
    };
  }
}

/**
 * Updates game state after randomize mode elimination
 * Converts eliminated players to spectators and updates all relevant state
 */
export function updateGameStateAfterRandomizeElimination(
  gameState: GameState,
  eliminatedPlayerIds: string[],
  allVotes: Record<string, string[]>,
  wasTieBreakerRound: boolean
): Partial<GameState> {
  console.log('=== updateGameStateAfterRandomizeElimination CALLED ===');
  console.log('wasTieBreakerRound:', wasTieBreakerRound);
  console.log('eliminatedPlayerIds:', eliminatedPlayerIds);
  console.log('Current tieBreakerVotes length:', gameState.tieBreakerVotes?.length || 0);
  const uniqueEliminatedPlayerIds = Array.from(new Set(eliminatedPlayerIds));

  const newEliminatedPlayers = [...gameState.eliminatedPlayers];
  uniqueEliminatedPlayerIds.forEach(id => {
    if (!newEliminatedPlayers.includes(id)) {
      newEliminatedPlayers.push(id);
    }
  });
  
  // Convert eliminated players to spectators and update player objects
  const updatedPlayers = gameState.players.map(p => {
    if (uniqueEliminatedPlayerIds.includes(p.id)) {
      return { ...p, isEliminated: true, role: 'spectator' as const };
    }
    return p;
  });

  // Update player roles to include spectators
  const updatedPlayerRoles = { ...gameState.playerRoles };
  uniqueEliminatedPlayerIds.forEach(id => {
    updatedPlayerRoles[id] = 'spectator';
  });

  // Store tie-breaker votes if this was a tie-breaker round
  let newTieBreakerLog = gameState.tieBreakerVotes;

  if (wasTieBreakerRound) {
    console.log('=== TIE-BREAKER ROUND COMPLETED ===');
    console.log('wasTieBreakerRound:', wasTieBreakerRound);
    console.log('Existing tieBreakerVotes before append:', gameState.tieBreakerVotes);
    console.log('Votes being stored:', allVotes);
    console.log('Game state originalVotes:', gameState.originalVotes);

    const updatedLogs = appendUniqueTieVote(gameState.tieBreakerVotes, allVotes);
    newTieBreakerLog = updatedLogs;

    console.log('Final tieBreakerVotes after append (deduped):', newTieBreakerLog);
  }

  const preservedOriginalVotes = gameState.originalVotes
    ? JSON.parse(JSON.stringify(gameState.originalVotes))
    : JSON.parse(JSON.stringify(allVotes));

  return {
    phase: 'voteResults' as const,
    votes: allVotes,
    players: updatedPlayers,
    playerRoles: updatedPlayerRoles,
    eliminatedPlayers: newEliminatedPlayers,
    previousEliminatedPlayers: gameState.eliminatedPlayers,
    isTieVote: false,
    tiedPlayers: [],
    tieBreakerVotes: newTieBreakerLog,
    originalVotes: preservedOriginalVotes,
  };
}

/**
 * Prepares game state for next randomize mode round
 */
export function prepareNextRandomizeRound(gameState: GameState): Partial<GameState> {
  console.log('RANDOMIZE: Preparing next round');
  
  return {
    phase: 'discussion' as const,
    votes: {}, // Clear votes for the new round
    isTieVote: false,
    tiedPlayers: [],
    originalVotes: undefined, // Clear vote history for the new round
    tieBreakerVotes: undefined,
    currentRound: gameState.currentRound + 1, // Increment round counter
  };
}

/**
 * Checks if randomize mode can continue (enough active players)
 */
export function canRandomizeContinue(gameState: GameState, players: Player[]): boolean {
  const activePlayers = players.filter(p => 
    !gameState.eliminatedPlayers.includes(p.id) && 
    p.role !== 'spectator'
  );
  
  const eliminatedCount = gameState.eliminatedPlayers.length;
  const hasReachedEliminationLimit = eliminatedCount >= 4;

  return activePlayers.length > 2 && !hasReachedEliminationLimit;
}
