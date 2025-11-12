import { GameState, Player, WinnerType } from '../types';
import { 
  processRandomizeVotes, 
  checkRandomizeAutoEnd,
  updateGameStateAfterRandomizeElimination
} from './randomizeGameLogic';
import { processWordsGameVotes } from './wordsGameLogic';

type ScreenSetter = (screen: string) => void;
type StateSetter = (state: GameState | ((prev: GameState) => GameState)) => void;

export function processVotingResults(
  allVotes: Record<string, string[]>,
  gameState: GameState,
  setGameState: StateSetter,
  setCurrentScreen: ScreenSetter,
  determineWinnerFn: (gameState: GameState, players: Player[], eliminatedPlayers: string[]) => { winners: Player[]; winnerType?: WinnerType }
) {
  
  // Use words game logic for words game mode
  if (gameState.gameMode === 'words') {
    const updatedGameState = processWordsGameVotes(gameState, allVotes, gameState.players);
    
    if (updatedGameState.winners && updatedGameState.winners.length > 0) {
      // Game ended - show results
      setGameState(prev => ({
        ...prev,
        ...updatedGameState,
        players: prev.players.map(p => 
          updatedGameState.eliminatedPlayers.includes(p.id) ? { ...p, isEliminated: true } : p
        ),
        currentScreen: 'results'
      }));
      setCurrentScreen('results');
    } else {
      // Game continues - show vote results
      setGameState(prev => ({
        ...prev,
        ...updatedGameState,
        players: prev.players.map(p => 
          updatedGameState.eliminatedPlayers.includes(p.id) ? { ...p, isEliminated: true } : p
        ),
        currentScreen: 'voteResults'
      }));
      setCurrentScreen('voteResults');
    }
    return;
  }

  // TIE-BREAKER RESULT LOGIC FOR NORMAL MODE
  if (gameState.isTieVote && !gameState.isRandomizeMode) {
    const tiedPlayerIds = new Set(gameState.tiedPlayers);
    const tieBreakerVoteCounts: { [key: string]: number } = {};

    // Initialize tied players with 0 votes
    gameState.tiedPlayers?.forEach(pId => tieBreakerVoteCounts[pId] = 0);

    // Count votes for only the tied players (ignore votes from eliminated players)
    Object.entries(allVotes).forEach(([voterId, voterChoices]) => {
      if (gameState.eliminatedPlayers.includes(voterId)) {
        return;
      }

      voterChoices.forEach(targetId => {
        if (tiedPlayerIds.has(targetId)) {
          tieBreakerVoteCounts[targetId]++;
        }
      });
    });

    const sortedTiedPlayers = Object.entries(tieBreakerVoteCounts).sort(([, a], [, b]) => b - a);
    
    const alreadyEliminatedCount = gameState.eliminatedPlayers.length;
    const totalNeeded = gameState.impostorCount;
    const remainingToEliminate = totalNeeded - alreadyEliminatedCount;

    // If we don't have enough players to eliminate, or no one voted, end the round.
    if (sortedTiedPlayers.length === 0) {
      const playersToEliminate = sortedTiedPlayers.slice(0, remainingToEliminate).map(([id]) => id);
      const newEliminatedPlayers = [...gameState.eliminatedPlayers, ...playersToEliminate];
      const updatedPlayers = gameState.players.map(p => 
        newEliminatedPlayers.includes(p.id) ? { ...p, isEliminated: true } : p
      );
      const { winners, winnerType } = determineWinnerFn(gameState, updatedPlayers, newEliminatedPlayers);

      const newTieBreakerVotes = [...(gameState.tieBreakerVotes || []), allVotes];
      
      setGameState(prev => ({
        ...prev,
        phase: 'voteResults',
        currentScreen: 'voteResults', // CRITICAL: Set currentScreen in gameState for syncing
        eliminatedPlayers: newEliminatedPlayers,
        votes: {},
        tieBreakerVotes: newTieBreakerVotes,
        winners,
        winnerType,
        isTieVote: false,
        tiedPlayers: [],
      }));
      setCurrentScreen('voteResults');
      return;
    }
    
    // Check if there's a tie at the top (highest vote count)
    const highestVoteCount = sortedTiedPlayers[0][1];
    const playersWithHighestVotes = sortedTiedPlayers.filter(([, votes]) => votes === highestVoteCount);
    
    // If there's still a tie at the highest vote count, continue tie-breaking
    if (playersWithHighestVotes.length > 1) {
      const newTieBreakerVotes = [...(gameState.tieBreakerVotes || []), allVotes];
      
      setGameState(prev => ({
        ...prev,
        isTieVote: true,
        tiedPlayers: playersWithHighestVotes.map(([id]) => id),
        votes: {},
        tieBreakerVotes: newTieBreakerVotes,
        currentScreen: 'voting', // CRITICAL: Set currentScreen in gameState for syncing
      }));
      setCurrentScreen('voting');
      return;
    }

    const uniqueIds = (ids: string[]) => Array.from(new Set(ids));

    const eliminationSlots = Math.max(remainingToEliminate, 0);
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

    let newEliminatedPlayers = uniqueIds([...gameState.eliminatedPlayers, ...eliminatedFromTieBreaker]);

    if (nextTieCandidates.length > 0) {
      const stillNeeded = Math.max(totalNeeded - newEliminatedPlayers.length, 0);

      if (stillNeeded <= 0) {
        nextTieCandidates = [];
      } else if (nextTieCandidates.length <= stillNeeded) {
        eliminatedFromTieBreaker = uniqueIds([...eliminatedFromTieBreaker, ...nextTieCandidates]);
        newEliminatedPlayers = uniqueIds([...newEliminatedPlayers, ...nextTieCandidates]);
        nextTieCandidates = [];
      }
    }

    const updatedPlayers = gameState.players.map(p => 
      newEliminatedPlayers.includes(p.id) ? { ...p, isEliminated: true } : p
    );
    const newTieBreakerVotes = [...(gameState.tieBreakerVotes || []), allVotes];

    if (nextTieCandidates.length > 0) {
      setGameState(prev => ({
        ...prev,
        players: updatedPlayers,
        eliminatedPlayers: uniqueIds(newEliminatedPlayers),
        votes: {},
        tieBreakerVotes: newTieBreakerVotes,
        isTieVote: true,
        tiedPlayers: nextTieCandidates,
        currentScreen: 'voting', // CRITICAL: Set currentScreen in gameState for syncing
      }));
      setCurrentScreen('voting');
      return;
    }

    const { winners, winnerType } = determineWinnerFn(gameState, updatedPlayers, newEliminatedPlayers);

    setGameState(prev => ({
      ...prev,
      phase: 'voteResults',
      currentScreen: 'voteResults', // CRITICAL: Set currentScreen in gameState for syncing
      players: updatedPlayers,
      eliminatedPlayers: uniqueIds(newEliminatedPlayers),
      votes: {},
      tieBreakerVotes: newTieBreakerVotes,
      winners,
      winnerType,
      isTieVote: false,
      tiedPlayers: [],
    }));
    setCurrentScreen('voteResults');
    return;
  }

  // Calculate vote counts - include ALL players, even those with 0 votes
  const voteCounts: { [key: string]: number } = {};
  
  // Initialize all non-eliminated players with 0 votes
  gameState.players.forEach(player => {
    if (!gameState.eliminatedPlayers.includes(player.id)) {
      voteCounts[player.id] = 0;
    }
  });
  
  // Count actual votes
  Object.entries(allVotes).forEach(([voterId, playerVotes]) => {
    playerVotes.forEach(targetId => {
      if (Object.prototype.hasOwnProperty.call(voteCounts, targetId)) {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
      }
    });
  });

  // Sort players by vote count (highest first)
  const sortedPlayers = Object.entries(voteCounts)
    .filter(([playerId]) => !gameState.eliminatedPlayers.includes(playerId))
    .sort(([, a], [, b]) => b - a);

  const impostorCount = gameState.impostorCount;

  // Check if we have enough players to eliminate
  if (sortedPlayers.length < impostorCount) {
    return;
  }

  // RANDOMIZE MODE - Use separated logic
  if (gameState.isRandomizeMode) {
    const wasTieBreakerRound = gameState.isTieVote;
    
    const { isTie, tiedPlayers, eliminatedPlayerIds, shouldContinue } = processRandomizeVotes(
      gameState, 
      allVotes, 
      gameState.players
    );

    if (isTie) {
      let updatedTieBreakerVotes;
      
      if (!wasTieBreakerRound) {
        updatedTieBreakerVotes = undefined;
      } else {
        const existingLogs = gameState.tieBreakerVotes || [];
        const votesSnapshot = JSON.parse(JSON.stringify(allVotes));
        const serialized = JSON.stringify(votesSnapshot);
        
        const originalSerialized = gameState.originalVotes ? JSON.stringify(gameState.originalVotes) : null;
        const matchesOriginal = originalSerialized && serialized === originalSerialized;
        const alreadyLogged = existingLogs.some(log => JSON.stringify(log) === serialized);
        
        if (matchesOriginal || alreadyLogged) {
          updatedTieBreakerVotes = existingLogs;
        } else {
          updatedTieBreakerVotes = [...existingLogs, votesSnapshot];
        }
      }

      setGameState(prev => ({
        ...prev,
        phase: 'voting',
        currentScreen: 'voting', // CRITICAL: Set currentScreen in gameState for syncing
        isTieVote: true,
        tiedPlayers,
        votes: {},
        originalVotes: prev.originalVotes || JSON.parse(JSON.stringify(allVotes)),
        tieBreakerVotes: updatedTieBreakerVotes,
      }));
      setCurrentScreen('voting');
      return;
    }

    if (shouldContinue && eliminatedPlayerIds.length > 0) {
      const { winners, winnerType } = checkRandomizeAutoEnd(
        gameState, 
        gameState.players, 
        eliminatedPlayerIds
      );
      
      const tempGameState = {
        ...gameState,
        eliminatedPlayers: [...gameState.eliminatedPlayers, ...eliminatedPlayerIds]
      };
      const remainingPlayers = gameState.players.filter(p => 
        !tempGameState.eliminatedPlayers.includes(p.id) && 
        gameState.playerRoles[p.id] !== 'spectator'
      );
      
      if (remainingPlayers.length <= 1) {
        const gameStateUpdates = updateGameStateAfterRandomizeElimination(gameState, eliminatedPlayerIds, allVotes, wasTieBreakerRound);
        
        setGameState(prev => ({
          ...prev,
          ...gameStateUpdates,
          phase: 'results',
          currentScreen: 'results', // CRITICAL: Set currentScreen in gameState for syncing
          winners: winners.length > 0 ? winners : [],
          winnerType,
        }));
        setCurrentScreen('results');
      } else {
        const gameStateUpdates = updateGameStateAfterRandomizeElimination(gameState, eliminatedPlayerIds, allVotes, wasTieBreakerRound);
        
        setGameState(prev => ({
          ...prev,
          ...gameStateUpdates,
          currentScreen: 'voteResults', // CRITICAL: Set currentScreen in gameState for syncing
        }));
        setCurrentScreen('voteResults');
      }
    }
    return;
  }
  
  // Get the vote count of the N-th player (where N = impostor count)
  let nthPlayerVotes = -1;
  if (sortedPlayers.length > 0) {
    nthPlayerVotes = sortedPlayers[impostorCount - 1] ? sortedPlayers[impostorCount - 1][1] : -1;
  }
  
  // Find all players with the same vote count as the N-th position
  const playersWithNthVotes = sortedPlayers.filter(([, votes]) => votes === nthPlayerVotes);
  
  // Check if there are players OUTSIDE the top N with the same vote count as N-th position
  const playersInTopN = sortedPlayers.slice(0, impostorCount);
  const playersOutsideTopN = sortedPlayers.slice(impostorCount);
  
  const tiedPlayersOutsideTopN = playersOutsideTopN.filter(([, votes]) => votes === nthPlayerVotes);
    
  if (tiedPlayersOutsideTopN.length > 0) {
    // Eliminate players who are in top N positions (have >= Nth position votes and are in top N)
    const playersToEliminate = playersInTopN.filter(([, votes]) => votes > nthPlayerVotes);
    const alreadyEliminatedPlayers = playersToEliminate.map(([playerId]) => playerId);
    
    const totalEliminated = gameState.eliminatedPlayers.length + alreadyEliminatedPlayers.length;
    const remainingToEliminate = impostorCount - totalEliminated;
    
    if (remainingToEliminate <= 0) {
      const finalEliminatedPlayers = [...gameState.eliminatedPlayers, ...alreadyEliminatedPlayers];
      
      const { winners, winnerType } = determineWinnerFn(gameState, gameState.players, finalEliminatedPlayers);
      
      if (winnerType) {
        setGameState({
          ...gameState,
          phase: 'results',
          currentScreen: 'results', // CRITICAL: Set currentScreen in gameState for syncing
          votes: allVotes,
          eliminatedPlayers: finalEliminatedPlayers,
          winners,
          winnerType: winnerType || undefined,
          isTieVote: false,
          tiedPlayers: []
        });
        setCurrentScreen('results');
        return;
      }

      setGameState({
        ...gameState,
        phase: 'voteResults',
        currentScreen: 'voteResults', // CRITICAL: Set currentScreen in gameState for syncing
        votes: allVotes,
        eliminatedPlayers: finalEliminatedPlayers,
        winners,
        winnerType,
        isTieVote: false,
        tiedPlayers: []
      });
      setCurrentScreen('voteResults');
      return;
    }
      
    const updatedGameState = {
      ...gameState,
      eliminatedPlayers: [...gameState.eliminatedPlayers, ...alreadyEliminatedPlayers],
      votes: allVotes
    };
    
    const originalVotes = { ...allVotes };
    
    setGameState({
      ...updatedGameState,
      phase: 'voting',
      currentScreen: 'voting', // CRITICAL: Set currentScreen in gameState for syncing
      isTieVote: true,
      tiedPlayers: playersWithNthVotes.map(([playerId]) => playerId),
      votes: {},
      originalVotes: originalVotes,
    });
    setCurrentScreen('voting');
  } else {
    // No tie, eliminate top N players directly
    const eliminatedPlayerIds = sortedPlayers.slice(0, impostorCount).map(([playerId]) => playerId);
    
    const { winners, winnerType } = determineWinnerFn(gameState, gameState.players, eliminatedPlayerIds);
    
    // Check if game has ended
    if (winnerType) {
      setGameState(prev => {
        const newEliminatedPlayers = [...prev.eliminatedPlayers, ...eliminatedPlayerIds];
        const updatedPlayers = prev.players.map(p => 
          newEliminatedPlayers.includes(p.id) ? { ...p, isEliminated: true } : p
        );
        
        return {
          ...prev,
          phase: 'voteResults',
          currentScreen: 'voteResults', // CRITICAL: Set currentScreen in gameState for syncing
          players: updatedPlayers,
          votes: allVotes,
          originalVotes: allVotes,
          eliminatedPlayers: newEliminatedPlayers,
          previousEliminatedPlayers: prev.eliminatedPlayers,
          winners,
          winnerType: winnerType || undefined,
          isTieVote: false,
          tiedPlayers: []
        };
      });
      setCurrentScreen('voteResults');
      return;
    }

    // Game continues - show vote results
    // NOTE: For questions game standard mode, this should never happen (game always ends after one vote)
    // But keeping this for safety
    setGameState(prev => {
      const newEliminatedPlayers = [...prev.eliminatedPlayers, ...eliminatedPlayerIds];
      const updatedPlayers = prev.players.map(p => 
        newEliminatedPlayers.includes(p.id) ? { ...p, isEliminated: true } : p
      );

      return {
        ...prev,
        phase: 'voteResults',
        currentScreen: 'voteResults', // CRITICAL: Set currentScreen in gameState for syncing
        players: updatedPlayers,
        votes: allVotes,
        originalVotes: allVotes,
        eliminatedPlayers: newEliminatedPlayers,
        winners,
        winnerType,
        isTieVote: false,
        tiedPlayers: [],
        previousEliminatedPlayers: prev.eliminatedPlayers,
      };
    });
    setCurrentScreen('voteResults');
  }
}

