import { Player, GameState, PlayerRole, WinnerType } from '../types';
import { assignRoles, getRandomImpostorCount } from './gameUtils';

export function initializeGame(
  players: Player[],
  impostorCount: number | 'randomize',
  hasJester: boolean,
  gameMode: 'questions' | 'words',
  isRandomizeMode: boolean,
  customContent?: string[],
  selectedPackType?: string | null
): GameState {
  const actualImpostorCount = impostorCount === 'randomize' 
    ? getRandomImpostorCount(players.length)
    : impostorCount;

  const { roles, jesterCluePlayerIds } = assignRoles(players, actualImpostorCount, hasJester, isRandomizeMode);
  const playerRoles: Record<string, PlayerRole> = {};
  
  const updatedPlayers = players.map((player, index) => {
    const role = roles[index];
    playerRoles[player.id] = role;
    return { ...player, role };
  });

  // Generate content based on game mode
  let currentQuestion: string | undefined;
  let currentImpostorQuestion: string | undefined;
  let currentWord: string | undefined;

  if (gameMode === 'questions') {
    if (customContent && Array.isArray(customContent) && customContent.length >= 2) {
      currentQuestion = customContent[0];
      currentImpostorQuestion = customContent[1];
    } else {
      // Use the selected pack type for questions, fallback to 'normal' if not specified
      const packType = selectedPackType || 'normal';
      currentQuestion = getRandomQuestion(packType);
      currentImpostorQuestion = getRandomImpostorQuestion(packType);
    }
  } else {
    if (customContent && Array.isArray(customContent) && customContent.length >= 1) {
      currentWord = customContent[0];
    } else {
      // Use the selected pack type for words, fallback to 'celebrities' if not specified
      const packType = selectedPackType || 'celebrities';
      currentWord = getRandomWord(packType);
    }
  }

  // For word games, select a starting player once and persist it
  const startingPlayer = gameMode === 'words' ? selectRandomStartingPlayer(updatedPlayers) : null;
  const turnOrder = gameMode === 'words' && startingPlayer ? getTurnOrder(updatedPlayers, startingPlayer) : [];

  return {
    phase: 'questions',
    players: updatedPlayers,
    currentRound: 1,
    maxRounds: 5, // Increased maxRounds
    impostorCount: actualImpostorCount,
    hasJester,
    isRandomizeMode, // Use the parameter here
    hostId: players.find(p => p.isHost)?.id || '',
    roomCode: '',
    gameMode,
    currentQuestion: currentQuestion || '',
    currentImpostorQuestion: currentImpostorQuestion || '',
    currentWord: currentWord || '',
    currentImpostorWord: '',
    playerAnswers: {},
    submittedAnswers: {}, // Initialize empty submitted answers tracking
    votes: {},
    eliminatedPlayers: [],
    winners: [],
    winnerType: undefined,
    playerRoles,
    originalPlayerRoles: { ...playerRoles }, // Store original roles before any eliminations
    continueCount: 0, // Initialize continue count for randomize mode
    selectedPack: null, // Will be set by the caller
    selectedPackType: null, // Will be set by the caller
    jesterCluePlayers: jesterCluePlayerIds,
    startingPlayer,
    turnOrder,
    currentTurnPlayer: startingPlayer, // Set current turn to starting player
    selectedQuestionPack: null, // Will be set by the caller
    isTieVote: false,
    tiedPlayers: []
  };
}

export function processAnswers(gameState: GameState, answers: Record<string, string>): GameState {
  return {
    ...gameState,
    playerAnswers: answers,
    phase: 'discussion'
  };
}

// Helper function to check if game should continue in Randomize mode
export function shouldContinueGame(gameState: GameState, players: Player[]): boolean {
  const { playerRoles, isRandomizeMode, eliminatedPlayers } = gameState;
  
  if (!isRandomizeMode || !players || players.length === 0) {
    return false; // Standard mode doesn't use this logic or no players
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
  
  // Check if jester is still alive (jester win takes priority)
  const remainingJester = remainingPlayerIds.find(
    id => playerRoles[id] === 'jester'
  );
  
  if (!remainingJester) {
    return false; // Jester eliminated, game should end
  }
  
  // Game can continue
  return true;
}

// Win condition checking function
export function checkWinConditions(
  gameState: GameState,
  players: Player[],
  eliminatedPlayerIds: string[]
): { winners: Player[]; winnerType?: WinnerType } {
  console.log('=== WINNER DETERMINATION START ===');
  console.log('Game State:', {
    phase: gameState.phase,
    playerRoles: gameState.playerRoles,
    isRandomizeMode: gameState.isRandomizeMode,
    eliminatedPlayers: gameState.eliminatedPlayers
  });
  console.log('Players:', players.map(p => ({ id: p.id, username: p.username, role: p.role })));
  console.log('Eliminated this round:', eliminatedPlayerIds);
  
  const { playerRoles, isRandomizeMode } = gameState;
  
  // PRIORITY 1: Check if jester was eliminated - jester wins immediately (NOT in Randomize mode)
  // Note: Jester is automatically disabled in Randomize mode
  if (!isRandomizeMode) {
    const eliminatedJester = eliminatedPlayerIds.find(
      playerId => playerRoles[playerId] === 'jester'
    );
    
    if (eliminatedJester) {
      const jesterPlayer = players.find(p => p.id === eliminatedJester);
      console.log('✅ JESTER WIN: Jester was eliminated');
      return {
        winners: jesterPlayer ? [jesterPlayer] : [],
        winnerType: 'jester'
      };
    }
  }

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

  // PRIORITY 2: In standard mode, check win conditions based on remaining impostors
  if (!isRandomizeMode) {
    console.log('=== STANDARD MODE WIN CHECK ===');
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
      console.log('✅ INNOCENT WIN: All impostors eliminated (standard mode)');
      return {
        winners: activeInnocents,
        winnerType: 'innocent'
      };
    } else {
      // Some impostors remain - impostors win
      console.log('✅ IMPOSTOR WIN: Impostors remain and blended in (standard mode)');
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


  // PRIORITY 3: Randomize mode - Check auto-end conditions but don't declare winners yet
  // The game continues until host explicitly ends it, but we need to check if it should auto-end
  if (isRandomizeMode) {
    console.log('=== RANDOMIZE MODE AUTO-END CHECK ===');
    
    // Check if too few players remain (≤2 players) - game should auto-end
    if (activePlayers.length <= 2) {
      console.log('✅ RANDOMIZE AUTO-END: Too few players remaining (≤2)');
      // In randomize mode, if ≤2 players remain, impostors win
      const allImpostorPlayers = players.filter(p => playerRoles[p.id] === 'impostor');
      return {
        winners: allImpostorPlayers,
        winnerType: 'impostor'
      };
    }
    
    // Check if all impostors are eliminated - game should auto-end
    if (activeImpostors.length === 0) {
      console.log('✅ RANDOMIZE AUTO-END: All impostors eliminated');
      return {
        winners: activeInnocents,
        winnerType: 'innocent'
      };
    }
    
    // Check if jester was eliminated (shouldn't happen in randomize mode, but just in case)
    const eliminatedJester = eliminatedPlayerIds.find(
      playerId => playerRoles[playerId] === 'jester'
    );
    
    if (eliminatedJester) {
      const jesterPlayer = players.find(p => p.id === eliminatedJester);
      console.log('✅ RANDOMIZE AUTO-END: Jester was eliminated');
      return {
        winners: jesterPlayer ? [jesterPlayer] : [],
        winnerType: 'jester'
      };
    }
    
    console.log('Randomize mode: Game continues, no auto-end condition met');
    return { winners: [] }; // No automatic win condition, game continues
  }

  // PRIORITY 4: Check if too few players remain - impostors win
  if (activePlayers.length <= 2) {
    console.log('✅ IMPOSTOR WIN: Too few players remaining');
    return {
      winners: activeImpostors,
      winnerType: 'impostor'
    };
  }

  // If we reach here, no win condition was met
  console.log('No win condition met - game continues');
  return { winners: [] };
}

export function processVotes(
  gameState: GameState,
  votes: Record<string, string[]>,
  players: Player[]
): GameState {
  // Count votes for each player
  const voteCounts: Record<string, number> = {};
  
  Object.values(votes).forEach(playerVotes => {
    playerVotes.forEach(votedPlayerId => {
      voteCounts[votedPlayerId] = (voteCounts[votedPlayerId] || 0) + 1;
    });
  });

  // If no votes cast, return to discussion
  if (Object.keys(voteCounts).length === 0) {
    return {
      ...gameState,
      votes,
      phase: 'discussion'
    };
  }

  // Find players with most votes
  const voteValues = Object.values(voteCounts);
  const maxVotes = Math.max(...voteValues);
  const eliminatedPlayerIds = Object.keys(voteCounts).filter(
    playerId => voteCounts[playerId] === maxVotes
  );

  // Check win conditions
  const { winners, winnerType } = checkWinConditions(
    gameState,
    players,
    eliminatedPlayerIds
  );

  if (winners.length > 0) {
    return {
      ...gameState,
      phase: 'results',
      eliminatedPlayers: [...gameState.eliminatedPlayers, ...eliminatedPlayerIds],
      winners,
      winnerType,
      votes
    };
  }

  // Game continues - add eliminated players and return to discussion
  return {
    ...gameState,
    eliminatedPlayers: [...gameState.eliminatedPlayers, ...eliminatedPlayerIds],
    votes,
    phase: 'discussion',
    currentRound: gameState.currentRound + 1 // Increment round
  };
}

// Content generation functions
export function getRandomQuestion(pack: string): string {
  const questions = {
    normal: [
      "What's your favorite hobby?",
      "Where would you like to travel?",
      "What's your favorite food?",
      "What do you do on weekends?",
      "What's your dream job?",
      "What's your favorite movie genre?",
      "What's your favorite season?",
      "What's your favorite color?"
    ],
    party: [
      "What's the weirdest thing you've ever eaten?",
      "What's your most embarrassing moment?",
      "What's your hidden talent?",
      "What's your guilty pleasure?",
      "What's the craziest thing on your bucket list?",
      "What's your worst habit?",
      "What's your favorite party game?",
      "What's your go-to karaoke song?"
    ],
    spicy: [
      "What's your biggest fear in relationships?",
      "What's the most rebellious thing you've done?",
      "What's your most controversial opinion?",
      "What's something you've never told anyone?",
      "What's your biggest regret?",
      "What's your most awkward dating experience?",
      "What's something you judge people for?",
      "What's your biggest insecurity?"
    ],
    custom: [
      "What's your favorite hobby?",
      "Where would you like to travel?",
      "What's your favorite food?"
    ]
  };

  const packQuestions = questions[pack as keyof typeof questions] || questions.normal;
  
  // Ensure we have questions in the pack
  if (!packQuestions || packQuestions.length === 0) {
    console.warn(`No questions found for pack: ${pack}, using normal pack`);
    return questions.normal[Math.floor(Math.random() * questions.normal.length)];
  }
  
  return packQuestions[Math.floor(Math.random() * packQuestions.length)];
}

export function getRandomImpostorQuestion(pack: string): string {
  const impostorQuestions = {
    normal: [
      "What's your least favorite hobby?",
      "Where would you never want to travel?",
      "What's your least favorite food?",
      "What do you hate doing on weekends?",
      "What's your worst nightmare job?",
      "What's your least favorite movie genre?",
      "What's your least favorite season?",
      "What's your least favorite color?"
    ],
    party: [
      "What's the most normal thing you've ever eaten?",
      "What's your least embarrassing moment?",
      "What's your most obvious talent?",
      "What's your least guilty pleasure?",
      "What's the most boring thing on your bucket list?",
      "What's your best habit?",
      "What's your least favorite party game?",
      "What's your worst karaoke song?"
    ],
    spicy: [
      "What's your smallest fear in relationships?",
      "What's the least rebellious thing you've done?",
      "What's your most popular opinion?",
      "What's something everyone knows about you?",
      "What's your smallest regret?",
      "What's your best dating experience?",
      "What's something you never judge people for?",
      "What's your biggest confidence?"
    ],
    custom: [
      "What's your least favorite hobby?",
      "Where would you never want to travel?",
      "What's your least favorite food?"
    ]
  };

  const packQuestions = impostorQuestions[pack as keyof typeof impostorQuestions] || impostorQuestions.normal;
  
  // Ensure we have questions in the pack
  if (!packQuestions || packQuestions.length === 0) {
    console.warn(`No impostor questions found for pack: ${pack}, using normal pack`);
    return impostorQuestions.normal[Math.floor(Math.random() * impostorQuestions.normal.length)];
  }
  
  return packQuestions[Math.floor(Math.random() * packQuestions.length)];
}

export function getRandomWord(pack: string): string {
  const words = {
    celebrities: [
      "Taylor Swift", "Elon Musk", "Oprah Winfrey", "Leonardo DiCaprio",
      "Beyoncé", "Tom Hanks", "Jennifer Lawrence", "Ryan Reynolds",
      "Lady Gaga", "The Rock", "Emma Stone", "Chris Hemsworth"
    ],
    characters: [
      "Harry Potter", "Sherlock Holmes", "Batman", "Spider-Man",
      "Elsa", "Mickey Mouse", "Pikachu", "Mario",
      "Wonder Woman", "Iron Man", "Darth Vader", "Yoda"
    ],
    objects: [
      "Coffee Mug", "Smartphone", "Pillow", "Toothbrush",
      "Car Keys", "Sunglasses", "Backpack", "Headphones",
      "Water Bottle", "Laptop", "Shoes", "Watch"
    ],
    spicy: [
      "Handcuffs", "Whipped Cream", "Massage Oil", "Silk Ties",
      "Candles", "Chocolate", "Wine", "Rose Petals",
      "Blindfold", "Feather", "Ice Cubes", "Strawberries"
    ],
    custom: [
      "Custom Word 1", "Custom Word 2", "Custom Word 3"
    ]
  };

  const packWords = words[pack as keyof typeof words] || words.objects;
  
  // Ensure we have words in the pack
  if (!packWords || packWords.length === 0) {
    console.warn(`No words found for pack: ${pack}, using objects pack`);
    return words.objects[Math.floor(Math.random() * words.objects.length)];
  }
  
  return packWords[Math.floor(Math.random() * packWords.length)];
}

export function getQuestionForRole(
  role: 'innocent' | 'impostor' | 'jester',
  gameMode: 'questions' | 'words',
  innocentQuestion?: string,
  impostorQuestion?: string
): string | undefined {
  if (gameMode === 'words') return undefined;
  
  if (role === 'impostor' && impostorQuestion) {
    return impostorQuestion;
  }
  
  if (role === 'jester') {
    // Jester gets the same question as innocents
    return innocentQuestion;
  }
  
  // Innocent players get the innocent question
  return innocentQuestion;
}

export function getWordForRole(
  role: 'innocent' | 'impostor' | 'jester',
  currentWord?: string
): string | undefined {
  if (role === 'impostor') {
    return "You are the Impasta";
  }
  
  if (role === 'jester') {
    // Jester gets the same word as innocents
    return currentWord;
  }
  
  // Innocent players get the word
  return currentWord;
}

// Random starting player selection algorithm
export function selectRandomStartingPlayer(players: Player[]): Player | null {
  if (players.length === 0) {
    return null;
  }
  
  // Filter out eliminated players (if any)
  const activePlayers = players.filter(player => player.isConnected);
  
  if (activePlayers.length === 0) {
    return null;
  }
  
  // Select a random player from active players
  const randomIndex = Math.floor(Math.random() * activePlayers.length);
  return activePlayers[randomIndex];
}

// Get turn order (clockwise around player circle)
export function getTurnOrder(players: Player[], startingPlayer: Player): Player[] {
  if (players.length === 0 || !startingPlayer) {
    return [];
  }
  
  // Find the index of the starting player
  const startingIndex = players.findIndex(player => player.id === startingPlayer.id);
  
  if (startingIndex === -1) {
    return [];
  }
  
  // Create turn order starting from the starting player, going clockwise
  const turnOrder: Player[] = [];
  
  for (let i = 0; i < players.length; i++) {
    const playerIndex = (startingIndex + i) % players.length;
    turnOrder.push(players[playerIndex]);
  }
  
  return turnOrder;
}

// Get next player in turn order
export function getNextPlayer(currentPlayer: Player, turnOrder: Player[]): Player | null {
  if (turnOrder.length === 0) {
    return null;
  }
  
  const currentIndex = turnOrder.findIndex(player => player.id === currentPlayer.id);
  
  if (currentIndex === -1) {
    return null;
  }
  
  // Get the next player (wrap around to beginning if at end)
  const nextIndex = (currentIndex + 1) % turnOrder.length;
  return turnOrder[nextIndex];
}

// Advance to next turn in the discussion
export function advanceTurn(gameState: GameState): GameState {
  if (gameState.gameMode !== 'words' || !gameState.currentTurnPlayer || !gameState.turnOrder.length) {
    return gameState;
  }
  
  const nextPlayer = getNextPlayer(gameState.currentTurnPlayer, gameState.turnOrder);
  
  return {
    ...gameState,
    currentTurnPlayer: nextPlayer
  };
}

// Reset turn to starting player (for new discussion round)
export function resetTurnToStart(gameState: GameState): GameState {
  if (gameState.gameMode !== 'words' || !gameState.startingPlayer || !gameState.turnOrder.length) {
    return gameState;
  }
  
  return {
    ...gameState,
    currentTurnPlayer: gameState.startingPlayer
  };
}

/**
 * Determines the winner(s) of the game based on current game state and eliminations.
 * This function handles all win conditions including jester, innocent, impostor, and tie scenarios.
 * 
 * @param gameState - The current game state
 * @param players - Array of all players in the game
 * @param eliminatedPlayerIds - Array of player IDs eliminated in this round
 * @returns Object containing winners array and winner type
 */
export function determineWinner(
  gameState: GameState,
  players: Player[],
  eliminatedPlayerIds: string[]
): { winners: Player[]; winnerType?: WinnerType } {
  return checkWinConditions(gameState, players, eliminatedPlayerIds);
}

