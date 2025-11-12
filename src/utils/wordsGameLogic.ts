import { Player, GameState, WinnerType } from '../types';

/**
 * Words Game Voting Logic
 * Implements standard mode voting logic for words game without jester role
 */

/**
 * Determines the winner(s) of the words game based on current game state and eliminations.
 * This function handles innocent and impostor win conditions only (no jester).
 * 
 * @param gameState - The current game state
 * @param players - Array of all players in the game
 * @param eliminatedPlayerIds - Array of player IDs eliminated in this round
 * @returns Object containing winners array and winner type
 */
export function checkWordsGameWinConditions(
  gameState: GameState,
  players: Player[],
  eliminatedPlayerIds: string[]
): { winners: Player[]; winnerType?: WinnerType } {
  console.log('=== WORDS GAME WINNER DETERMINATION START ===');
  console.log('Game State:', {
    phase: gameState.phase,
    playerRoles: gameState.playerRoles,
    eliminatedPlayers: gameState.eliminatedPlayers
  });
  console.log('Players:', players.map(p => ({ id: p.id, username: p.username, role: p.role })));
  console.log('Eliminated this round:', eliminatedPlayerIds);
  
  const { playerRoles } = gameState;
  
  // Get all eliminated players (including previous eliminations)
  const allEliminatedPlayerIds = [...gameState.eliminatedPlayers, ...eliminatedPlayerIds];
  console.log('All eliminated players:', allEliminatedPlayerIds);
  
  // Get active players (not eliminated, not spectators)
  const activePlayers = players.filter(p => 
    p.role !== 'spectator' && !allEliminatedPlayerIds.includes(p.id)
  );
  
  const activeImpostors = activePlayers.filter(p => playerRoles[p.id] === 'impostor');
  const activeInnocents = activePlayers.filter(p => playerRoles[p.id] === 'innocent');
  
  // Get eliminated innocents for logging
  const eliminatedInnocents = allEliminatedPlayerIds.filter(
    id => playerRoles[id] === 'innocent'
  );

  console.log('Active players:', {
    total: activePlayers.length,
    impostors: activeImpostors.length,
    innocents: activeInnocents.length,
    impostorNames: activeImpostors.map(p => p.username),
    innocentNames: activeInnocents.map(p => p.username),
    eliminatedInnocents: eliminatedInnocents.length
  });

  // Check win conditions for words game (standard mode logic)
  console.log('=== WORDS GAME STANDARD MODE WIN CHECK ===');
  console.log('Eliminated players this round:', eliminatedPlayerIds);
  console.log('Player roles:', playerRoles);
  console.log('All eliminated players (including previous):', allEliminatedPlayerIds);
  console.log('Active impostors remaining:', activeImpostors.length);
  console.log('Total impostors in game:', gameState.impostorCount);
  
  // Debug: show which specific players were eliminated and their roles
  eliminatedPlayerIds.forEach(id => {
    const player = players.find(p => p.id === id);
    console.log(`Eliminated player: ${player?.username} (${playerRoles[id]})`);
  });
  
  // Check if all impostors have been eliminated
  if (activeImpostors.length === 0) {
    // All impostors eliminated - innocents win
    console.log('✅ INNOCENT WIN: All impostors eliminated (words game)');
    return {
      winners: activeInnocents,
      winnerType: 'innocent'
    };
  } else {
    // Some impostors remain - impostors win
    console.log('✅ IMPOSTOR WIN: Impostors remain and blended in (words game)');
    const allImpostorPlayers = players.filter(p => 
      playerRoles[p.id] === 'impostor'
    );
    console.log('All impostor players:', allImpostorPlayers.map(p => p.username));
    return {
      winners: allImpostorPlayers,
      winnerType: 'impostor'
    };
  }
}

/**
 * Processes votes for words game and determines eliminations
 * Implements full standard mode voting logic with tie-breaker support (no jester)
 * 
 * @param gameState - The current game state
 * @param votes - Record of votes cast by players
 * @param players - Array of all players in the game
 * @returns Updated game state
 */
export function processWordsGameVotes(
  gameState: GameState,
  votes: Record<string, string[]>,
  players: Player[]
): GameState {
  console.log('=== WORDS GAME VOTE PROCESSING ===');
  console.log('Input votes:', votes);
  console.log('Input gameState:', {
    phase: gameState.phase,
    isTieVote: gameState.isTieVote,
    eliminatedPlayers: gameState.eliminatedPlayers,
    impostorCount: gameState.impostorCount
  });
  
  // Handle tie-breaker results first
  if (gameState.isTieVote) {
    console.log('Processing tie-breaker results for words game...');
    
    const tiedPlayerIds = new Set(gameState.tiedPlayers);
    const tieBreakerVoteCounts: { [key: string]: number } = {};
    
    // Initialize tied players with 0 votes
    gameState.tiedPlayers?.forEach(pId => tieBreakerVoteCounts[pId] = 0);

    // Count votes for only the tied players
    Object.values(votes).flat().forEach(targetId => {
      if (tiedPlayerIds.has(targetId)) {
        tieBreakerVoteCounts[targetId]++;
      }
    });

    const sortedTiedPlayers = Object.entries(tieBreakerVoteCounts).sort(([, a], [, b]) => b - a);
    
    const alreadyEliminatedCount = gameState.eliminatedPlayers.length;
    const totalNeeded = gameState.impostorCount;
    const remainingToEliminate = totalNeeded - alreadyEliminatedCount;

    // If no one voted, end the round.
    // Note: Continue tie-breaking until no ties remain, regardless of elimination count
    if (sortedTiedPlayers.length === 0) {
      const playersToEliminate = sortedTiedPlayers.slice(0, remainingToEliminate).map(([id]) => id);
      const newEliminatedPlayers = [...gameState.eliminatedPlayers, ...playersToEliminate];
      
      const { winners, winnerType } = checkWordsGameWinConditions(
        gameState,
        players,
        newEliminatedPlayers
      );

      return {
        ...gameState,
        phase: 'voteResults', // Always go to voteResults first
        eliminatedPlayers: newEliminatedPlayers,
        votes: {},
        tieBreakerVotes: [...(gameState.tieBreakerVotes || []), votes],
        winners,
        winnerType,
        isTieVote: false,
        tiedPlayers: [],
      };
    }
    
    // Check if there's a tie at the top (highest vote count)
    const highestVoteCount = sortedTiedPlayers[0][1];
    const playersWithHighestVotes = sortedTiedPlayers.filter(([, votes]) => votes === highestVoteCount);
    
    // If there's still a tie at the highest vote count, continue tie-breaking
    if (playersWithHighestVotes.length > 1) {
      console.log('Another tie detected in tie-breaker round for words game.');
      
      // Store the current tie-breaker votes before starting the next tie-breaker round
      const newTieBreakerVotes = [...(gameState.tieBreakerVotes || []), votes];
      
      return {
        ...gameState,
        phase: 'voting',
        isTieVote: true,
        tiedPlayers: playersWithHighestVotes.map(([id]) => id),
        votes: {}, // Clear votes for the next round
        tieBreakerVotes: newTieBreakerVotes, // Store current tie-breaker votes
      };
    }

    // Determine eliminations accounting for ties at the elimination boundary
    const eliminationSlots = Math.max(remainingToEliminate, 0);
    const tieBreakerLog = [...(gameState.tieBreakerVotes || []), votes];

    let eliminatedFromTieBreaker: string[] = [];
    let nextTieCandidates: string[] = [];

    if (eliminationSlots > 0 && sortedTiedPlayers.length > 0) {
      const thresholdIndex = Math.min(sortedTiedPlayers.length - 1, eliminationSlots - 1);
      const thresholdVotes = thresholdIndex >= 0 ? sortedTiedPlayers[thresholdIndex][1] : -Infinity;

      const playersAboveThreshold = sortedTiedPlayers.filter(([, voteCount]) => voteCount > thresholdVotes);
      eliminatedFromTieBreaker = playersAboveThreshold.map(([id]) => id);

      let slotsRemaining = eliminationSlots - eliminatedFromTieBreaker.length;

      if (slotsRemaining > 0) {
        const playersAtThreshold = sortedTiedPlayers.filter(([, voteCount]) => voteCount === thresholdVotes);

        if (playersAtThreshold.length <= slotsRemaining) {
          eliminatedFromTieBreaker.push(...playersAtThreshold.map(([id]) => id));
          slotsRemaining = 0;
        } else {
          nextTieCandidates = playersAtThreshold.map(([id]) => id);
        }
      }
    }

    const newEliminatedPlayers = [...gameState.eliminatedPlayers, ...eliminatedFromTieBreaker];

    if (nextTieCandidates.length > 0) {
      console.log('Tie persists after partial eliminations in words game tie-breaker. Continuing with tied players:', nextTieCandidates);
      return {
        ...gameState,
        phase: 'voting',
        eliminatedPlayers: newEliminatedPlayers,
        votes: {},
        isTieVote: true,
        tiedPlayers: nextTieCandidates,
        tieBreakerVotes: tieBreakerLog,
      };
    }

    const { winners, winnerType } = checkWordsGameWinConditions(
      gameState,
      players,
      newEliminatedPlayers
    );

    return {
      ...gameState,
      phase: 'voteResults', // Always go to voteResults first
      eliminatedPlayers: newEliminatedPlayers,
      votes: {},
      tieBreakerVotes: tieBreakerLog,
      winners,
      winnerType,
      isTieVote: false,
      tiedPlayers: [],
    };
  }

  // Calculate vote counts - include ALL players, even those with 0 votes
  const voteCounts: { [key: string]: number } = {};
  
  // Initialize all non-eliminated players with 0 votes
  players.forEach(player => {
    if (!gameState.eliminatedPlayers.includes(player.id)) {
      voteCounts[player.id] = 0;
    }
  });
  
  // Count actual votes
  Object.entries(votes).forEach(([voterId, playerVotes]) => {
    console.log(`Voter ${voterId} voted for:`, playerVotes);
    playerVotes.forEach(targetId => {
      if (Object.prototype.hasOwnProperty.call(voteCounts, targetId)) {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
      }
    });
  });

  console.log('All vote counts:', voteCounts);

  // Sort players by vote count (highest first)
  const sortedPlayers = Object.entries(voteCounts)
    .filter(([playerId]) => !gameState.eliminatedPlayers.includes(playerId))
    .sort(([, a], [, b]) => b - a);

  const impostorCount = gameState.impostorCount;
  
  console.log('WORDS GAME VOTING RESULTS:', {
    allVotes: votes,
    voteCounts: voteCounts,
    sortedPlayers: sortedPlayers.map(([id, votes]) => ({ id, votes })),
    impostorCount,
    totalPlayers: sortedPlayers.length,
    eliminatedPlayers: gameState.eliminatedPlayers
  });

  // Check if we have enough players to eliminate
  if (sortedPlayers.length < impostorCount) {
    console.log('Not enough players to eliminate in words game');
    return {
      ...gameState,
      votes,
      phase: 'discussion'
    };
  }
  
  // Get the vote count of the N-th player (where N = impostor count)
  let nthPlayerVotes = -1;
  if (sortedPlayers.length > 0) {
    nthPlayerVotes = sortedPlayers[impostorCount - 1] ? sortedPlayers[impostorCount - 1][1] : -1;
  }
  
  console.log('TIE DETECTION FOR WORDS GAME:', {
    impostorCount,
    nthPlayerIndex: impostorCount - 1,
    nthPlayerVotes,
    sortedPlayers: sortedPlayers.map(([id, votes]) => ({ id, votes }))
  });
  
  // Find all players with the same vote count as the N-th position
  const playersWithNthVotes = sortedPlayers.filter(([, votes]) => votes === nthPlayerVotes);
  
  // Check if there are players OUTSIDE the top N with the same vote count as N-th position
  const playersInTopN = sortedPlayers.slice(0, impostorCount);
  const playersOutsideTopN = sortedPlayers.slice(impostorCount);
  
  const tiedPlayersOutsideTopN = playersOutsideTopN.filter(([, votes]) => votes === nthPlayerVotes);
  
  console.log('Players with Nth position votes:', playersWithNthVotes.map(([id, votes]) => ({ id, votes })));
  console.log('Players in top N:', playersInTopN.map(([id, votes]) => ({ id, votes })));
  console.log('Players outside top N:', playersOutsideTopN.map(([id, votes]) => ({ id, votes })));
  console.log('Tied players outside top N:', tiedPlayersOutsideTopN.map(([id, votes]) => ({ id, votes })));
    
  if (tiedPlayersOutsideTopN.length > 0) {
    console.log('TIE DETECTED IN WORDS GAME - players outside top N have same votes as N-th position:', tiedPlayersOutsideTopN.map(([id, votes]) => ({ id, votes })));
    
    // CORRECT LOGIC: Eliminate players who are in top N positions (have >= Nth position votes and are in top N)
    const playersToEliminate = playersInTopN.filter(([, votes]) => votes > nthPlayerVotes);
    const alreadyEliminatedPlayers = playersToEliminate.map(([playerId]) => playerId);
    
    console.log('Players automatically eliminated (in top N with more votes):', alreadyEliminatedPlayers);
    console.log('Players in tie-breaker (all with Nth position votes):', playersWithNthVotes.map(([playerId]) => playerId));
    
    // Calculate how many players we need to eliminate total
    const totalEliminated = gameState.eliminatedPlayers.length + alreadyEliminatedPlayers.length;
    const remainingToEliminate = impostorCount - totalEliminated;
    
    console.log('Total eliminated so far:', totalEliminated, 'Remaining to eliminate:', remainingToEliminate);
    
    if (remainingToEliminate <= 0) {
      // We've already eliminated enough players, no need for tie-breaker
      console.log('Already eliminated enough players, no tie-breaker needed in words game');
      const finalEliminatedPlayers = [...gameState.eliminatedPlayers, ...alreadyEliminatedPlayers];
      
      const { winners, winnerType } = checkWordsGameWinConditions(gameState, players, finalEliminatedPlayers);
      
      if (winnerType) {
        console.log('Words game ended! Winner type:', winnerType);
        return {
          ...gameState,
          phase: 'results',
          votes: votes,
          eliminatedPlayers: finalEliminatedPlayers,
          winners,
          winnerType: winnerType || undefined,
          isTieVote: false,
          tiedPlayers: []
        };
      }

      // Game continues
      return {
        ...gameState,
        phase: 'voteResults',
        votes: votes,
        eliminatedPlayers: finalEliminatedPlayers,
        winners,
        winnerType,
        isTieVote: false,
        tiedPlayers: []
      };
    }
      
    // Update game state with automatically eliminated players
    const updatedGameState = {
      ...gameState,
      eliminatedPlayers: [...gameState.eliminatedPlayers, ...alreadyEliminatedPlayers],
      votes: votes
    };
    
    // Store original votes before starting tie-breaker
    const originalVotes = { ...votes };
    
    // Start tie-breaker vote for all players with Nth position votes - clear votes for new round
    return {
      ...updatedGameState,
      phase: 'voting',
      isTieVote: true,
      tiedPlayers: playersWithNthVotes.map(([playerId]) => playerId),
      votes: {}, // Clear all votes for tie-breaker round
      originalVotes: originalVotes, // Store original votes
    };
  } else {
    // No tie, eliminate top N players directly
    const eliminatedPlayerIds = sortedPlayers.slice(0, impostorCount).map(([playerId]) => playerId);
    
    console.log('NO TIE IN WORDS GAME - eliminating top N players:', eliminatedPlayerIds);
    
    const { winners, winnerType } = checkWordsGameWinConditions(gameState, players, eliminatedPlayerIds);
    
         // Always go to voteResults first to show vote breakdown and eliminations
         // The host will then decide whether to continue or reveal winners
         console.log('Words game vote processing complete. Game ended:', !!winnerType, 'Winner type:', winnerType);

         const result = {
           ...gameState,
           phase: 'voteResults' as const,
           votes: votes,
           originalVotes: votes, // Store original votes for vote breakdown
           eliminatedPlayers: [...gameState.eliminatedPlayers, ...eliminatedPlayerIds],
           winners,
           winnerType,
           isTieVote: false,
           tiedPlayers: [],
           previousEliminatedPlayers: gameState.eliminatedPlayers,
         };
         console.log('WORDS GAME: Returning voteResults phase:', result.phase);
         return result;
         }
       }

/**
 * Determines the winner when host finishes the game in words game mode
 * This is called when the host presses "Finish Game" button
 * 
 * @param gameState - The current game state
 * @param players - Array of all players in the game
 * @returns Object containing winners array and winner type
 */
export function determineWordsGameWinner(
  gameState: GameState,
  players: Player[]
): { winners: Player[]; winnerType?: WinnerType } {
  console.log('=== WORDS GAME FINAL WINNER DETERMINATION ===');
  
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

  // If any impostor is still alive when the host ends the game, the impostor team wins.
  if (activeImpostors.length > 0) {
    console.log('✅ IMPOSTOR WIN: Impostors were still alive when host finished words game.');
    return {
      winners: allImpostorPlayers, // The whole team wins
      winnerType: 'impostor'
    };
  } else {
    // If all impostors are eliminated, the innocent team wins.
    console.log('✅ INNOCENT WIN: All impostors were eliminated when host finished words game.');
    return {
      winners: allInnocentPlayers,
      winnerType: 'innocent'
    };
  }
}

/**
 * Helper function to check if words game should continue
 * 
 * @param gameState - The current game state
 * @param players - Array of all players in the game
 * @returns Boolean indicating if game should continue
 */
export function shouldContinueWordsGame(gameState: GameState, players: Player[]): boolean {
  const { playerRoles, eliminatedPlayers } = gameState;
  
  if (!players || players.length === 0) {
    return false; // No players
  }
  
  // Get remaining players (exclude spectators)
  const remainingPlayerIds = players
    .filter(p => p && p.id && playerRoles[p.id] !== 'spectator') // Filter out invalid players and spectators
    .map(p => p.id)
    .filter(id => !eliminatedPlayers.includes(id));
  
  // Check if we have enough players to continue
  if (remainingPlayerIds.length <= 2) {
    return false; // Too few players, game should end
  }
  
  // Check if all impostors are eliminated
  const remainingImpostors = remainingPlayerIds.filter(
    id => playerRoles[id] === 'impostor'
  );
  
  if (remainingImpostors.length === 0) {
    return false; // All impostors eliminated, game should end
  }
  
  // Game can continue
  return true;
}

/**
 * Generates bot votes specifically for words game
 * Implements standard questions game bot voting logic adapted for words game
 * 
 * @param botId - ID of the bot voting
 * @param allPlayers - Array of all players in the game
 * @param votesNeeded - Number of votes needed
 * @param personality - Bot personality type
 * @param tiedPlayers - Array of tied player IDs (for tie-breaker rounds)
 * @param gameState - Current game state
 * @returns Array of player IDs to vote for
 */
export function generateWordsGameBotVotes(
  botId: string,
  allPlayers: Player[],
  votesNeeded: number,
  personality: 'aggressive' | 'cautious' | 'random' | 'helpful',
  tiedPlayers?: string[],
  gameState?: GameState
): string[] {
  console.log(`Generating words game bot votes for ${botId}, personality: ${personality}, votesNeeded: ${votesNeeded}`);
  
  // Filter eligible players (exclude self, spectators, and eliminated players)
  let eligiblePlayers = allPlayers.filter(p => 
    p.id !== botId && 
    p.role !== 'spectator' && 
    !p.isEliminated
  );

  // If in tie-breaker mode, only allow voting for tied players
  if (tiedPlayers && Array.isArray(tiedPlayers) && tiedPlayers.length > 0) {
    console.log('Tie-breaker mode: restricting to tied players:', tiedPlayers);
    const validTiedPlayers = tiedPlayers.filter(id => id && typeof id === 'string');
    eligiblePlayers = eligiblePlayers.filter(p => validTiedPlayers.includes(p.id));
  }
  
  console.log('Eligible players for bot voting:', eligiblePlayers.map(p => ({ id: p.id, username: p.username, role: p.role })));
  
  const votes: string[] = [];

  switch (personality) {
    case 'aggressive': {
      // Vote for random players but with a bias towards first players
      console.log('Aggressive bot: voting for random players');
      const shuffled = [...eligiblePlayers];
      // Fisher-Yates shuffle for true randomness
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      for (let i = 0; i < Math.min(votesNeeded, shuffled.length); i++) {
        votes.push(shuffled[i].id);
      }
      break;
    }
    
    case 'cautious': {
      // Vote for random players but avoid first player (might be host)
      console.log('Cautious bot: avoiding first player (host)');
      const cautious = eligiblePlayers.slice(1);
      // Fisher-Yates shuffle for true randomness
      for (let i = cautious.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cautious[i], cautious[j]] = [cautious[j], cautious[i]];
      }
      for (let i = 0; i < Math.min(votesNeeded, cautious.length); i++) {
        if (!votes.includes(cautious[i].id)) {
          votes.push(cautious[i].id);
        }
      }
      break;
    }
    
    case 'random': {
      // Completely random voting
      console.log('Random bot: completely random voting');
      const shuffled = [...eligiblePlayers];
      // Fisher-Yates shuffle for true randomness
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      for (let i = 0; i < Math.min(votesNeeded, shuffled.length); i++) {
        votes.push(shuffled[i].id);
      }
      break;
    }
    
    case 'helpful': {
      // For words game, try to vote for players who might be impostors
      // In words game, impostors have different words, so we can't use answer-based logic
      // Instead, use strategic voting based on game context
      console.log('Helpful bot: trying to identify impostors in words game');
      
      if (gameState && gameState.playerRoles) {
        // Strategy: Vote for players who are likely impostors based on game state
        // In words game, we can use some heuristics:
        // 1. If we're in a tie-breaker, vote strategically
        // 2. If we're in normal voting, try to identify suspicious players
        
        if (tiedPlayers && tiedPlayers.length > 0) {
          // In tie-breaker, vote for the player who seems most suspicious
          // This is a simplified approach - in reality, this would be more sophisticated
          const shuffled = [...eligiblePlayers];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          votes.push(shuffled[0].id); // Vote for first player in tie-breaker
        } else {
          // In normal voting, try to identify impostors
          // Use a combination of random selection and strategic thinking
          const suspiciousPlayers = eligiblePlayers.filter(() => {
            // Simple heuristic: players with certain characteristics might be impostors
            // In a real game, this would be based on actual game behavior
            return Math.random() < 0.4; // 40% chance of being "suspicious"
          });
          
          if (suspiciousPlayers.length > 0) {
            const shuffled = [...suspiciousPlayers];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            for (let i = 0; i < Math.min(votesNeeded, shuffled.length); i++) {
              votes.push(shuffled[i].id);
            }
          } else {
            // Fallback to random voting
            const shuffled = [...eligiblePlayers];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            for (let i = 0; i < Math.min(votesNeeded, shuffled.length); i++) {
              votes.push(shuffled[i].id);
            }
          }
        }
      } else {
        // Fallback to random voting if no game state
        const shuffled = [...eligiblePlayers];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        for (let i = 0; i < Math.min(votesNeeded, shuffled.length); i++) {
          votes.push(shuffled[i].id);
        }
      }
      break;
    }
  }

  const finalVotes = votes.slice(0, votesNeeded);
  console.log(`Bot ${botId} final votes:`, finalVotes);
  
  // Ensure we return the correct number of votes
  if (finalVotes.length < votesNeeded && eligiblePlayers.length > 0) {
    console.log(`Bot ${botId} needs more votes, filling with random players`);
    const remainingPlayers = eligiblePlayers.filter(p => !finalVotes.includes(p.id));
    const shuffled = [...remainingPlayers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    for (let i = 0; i < Math.min(votesNeeded - finalVotes.length, shuffled.length); i++) {
      finalVotes.push(shuffled[i].id);
    }
  }
  
  return finalVotes;
}
