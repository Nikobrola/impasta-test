import { useState, useEffect, useCallback, useRef } from 'react';
import { Player, GameState, GameMode, WordPack, GamePack, WinnerType, PlayerRole } from './types';
import { generateRoomCode } from './utils/gameUtils';
import { createBot, generateBotAnswer } from './utils/botUtils';
import { generateUUID } from './utils/uuid';
import { determineWinner, initializeGame } from './utils/gameLogic';
import { 
  processRandomizeVotes, 
  checkRandomizeAutoEnd, 
  determineRandomizeWinner,
  updateGameStateAfterRandomizeElimination,
  prepareNextRandomizeRound,
  appendUniqueTieVote
} from './utils/randomizeGameLogic';
import { processWordsGameVotes, determineWordsGameWinner } from './utils/wordsGameLogic';
import { processVotingResults } from './utils/votingUtils';
import CustomQuestionCreationScreen from './components/CustomQuestionCreationScreen';
import CustomWordCreationScreen from './components/CustomWordCreationScreen';
import { useSupabaseRoom } from './hooks/useSupabaseRoom';
import * as roomService from './services/roomService';
import { signInAnonymously, getCurrentUserId } from './services/authService';
import { playerToRoomPlayer, roomToGameState } from './utils/supabaseUtils';

// Import screens
import EnteringScreen from './components/EnteringScreen';
import HomeScreen from './components/HomeScreen';
import RoomModeScreen from './components/RoomModeScreen';
import GamePackScreen from './components/GamePackScreen';
import JoinRoomScreen from './components/JoinRoomScreen';
import LobbyScreen from './components/LobbyScreen';
import QuestionScreen from './components/QuestionScreen';
import DiscussionScreen from './components/DiscussionScreen';
import VotingScreen from './components/VotingScreen';
import VoteResultsScreen from './components/VoteResultsScreen';
import ResultsScreen from './components/ResultsScreen';
import RoleRevealModal from './components/RoleRevealModal';
import AnswerDisplayScreen from './components/AnswerDisplayScreen';

type Screen = 'entering' | 'home' | 'roomMode' | 'gamePack' | 'customQuestionCreation' | 'customWordCreation' | 'joinRoom' | 'lobby' | 'questions' | 'answers' | 'roleReveal' | 'discussion' | 'voting' | 'voteResults' | 'results';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('entering');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const gameStateUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    phase: 'lobby',
    players: [],
    currentRound: 1,
    maxRounds: 3,
    impostorCount: 1,
    hasJester: false,
    isRandomizeMode: false,
    hostId: '',
    roomCode: '',
    gameMode: 'questions',
    currentQuestion: '',
    currentImpostorQuestion: '',
    currentWord: '',
    currentImpostorWord: '',
    playerAnswers: {},
    submittedAnswers: {},
    votes: {},
    eliminatedPlayers: [],
    winners: [],
    winnerType: undefined,
    playerRoles: {},
    selectedPack: null,
    startingPlayer: null,
    turnOrder: [],
    currentTurnPlayer: null,
    selectedQuestionPack: null,
    selectedPackType: null,
    jesterCluePlayers: [],
    isTieVote: false,
    tiedPlayers: [],
    gameEndReason: undefined,
    currentVoteResult: undefined,
    tieBreakerHistory: []
  });

  // Initialize authentication
  useEffect(() => {
    async function initAuth() {
      let userId = await getCurrentUserId();
      if (!userId) {
        userId = await signInAnonymously();
      }
      setCurrentUserId(userId);
    }
    initAuth();
  }, []);

  // Save game state to Supabase when it changes (debounced)
  const saveGameStateToSupabase = useCallback(async (state: GameState) => {
    if (!roomId) return;

    // Clear existing timeout
    if (gameStateUpdateTimeoutRef.current) {
      clearTimeout(gameStateUpdateTimeoutRef.current);
    }

    // Debounce updates to avoid too many writes
    gameStateUpdateTimeoutRef.current = setTimeout(async () => {
      await roomService.saveGameState(roomId, state as unknown as Record<string, unknown>);
    }, 500);
  }, [roomId]);

  // Use Supabase room hook for real-time updates
  useSupabaseRoom({
    roomId,
    onGameStateUpdate: (updatedState) => {
      // Update game state and sync screen
      console.log('📥 Received game state update from Supabase:', {
        currentScreen: updatedState.currentScreen,
        phase: updatedState.phase,
        submittedAnswersCount: Object.keys(updatedState.submittedAnswers || {}).length,
        votesCount: Object.keys(updatedState.votes || {}).length
      });
      
      setGameState(prev => {
        // CRITICAL: Always sync screen if it's different (even if other state is same)
        // This ensures all players transition screens together
        if (updatedState.currentScreen && updatedState.currentScreen !== prev.currentScreen) {
          console.log('🔄 Syncing screen from Supabase:', {
            from: prev.currentScreen,
            to: updatedState.currentScreen,
            phase: updatedState.phase,
            prevPhase: prev.phase
          });
          setCurrentScreen(updatedState.currentScreen as Screen);
          // Always update state when screen changes (even if other fields are same)
          // This ensures the screen change persists
          return updatedState;
        } else if (!updatedState.currentScreen && prev.currentScreen) {
          console.warn('⚠️ Received update without currentScreen, keeping current screen:', prev.currentScreen);
        }
        
        // Only update if state is actually different (prevent unnecessary re-renders)
        // But if screen changed above, we already returned updatedState
        if (JSON.stringify(prev) !== JSON.stringify(updatedState)) {
          return updatedState;
        }
        return prev;
      });
    },
    onPlayersUpdate: (players) => {
      setGameState(prev => ({ ...prev, players }));
    },
    onScreenUpdate: (screen) => {
      // Sync screen from game state (only if different to avoid loops)
    setCurrentScreen(prev => {
      if (prev !== screen) {
        return screen as Screen;
      }
      return prev;
    });
    },
  });


  // Save game state when it changes (only if user is host)
  // CRITICAL: Only save when host makes explicit changes, NOT when receiving real-time syncs
  // Real-time syncs are handled by onGameStateUpdate callback
  const isSavingRef = useRef(false);
  const lastExplicitSaveRef = useRef<string>(''); // Track last state we explicitly saved
  
  useEffect(() => {
    // Only host saves game state - double check host status
    const isHost = currentUserId === gameState.hostId;
    if (!roomId || !gameState.roomCode || !isHost) {
      return;
    }
    
    // Skip if we're currently saving (set by handleAnswerSubmit, handleSubmitVotes, etc.)
    if (isSavingRef.current) {
      return;
    }
    
    // Skip if this is the same state we just saved (prevents loops)
    const currentStateHash = JSON.stringify({
      phase: gameState.phase,
      currentScreen: currentScreen,
      players: gameState.players.length,
      submittedAnswers: Object.keys(gameState.submittedAnswers || {}).length,
      votes: Object.keys(gameState.votes || {}).length
    });
    
    if (lastExplicitSaveRef.current === currentStateHash) {
      return; // Already saved this state
    }
    
    // CRITICAL: Only save when host makes EXPLICIT changes (screen transitions, game start, etc.)
    // Don't save when just receiving player submissions/votes via real-time sync
    // Real-time syncs update local state but shouldn't trigger host saves
    
    // Check if this update is ONLY about submissions/votes from other players (real-time sync)
    // If the ONLY change is submissions/votes from non-host players, skip save
    // But if there are other changes (phase, screen, players, etc.), we should save
    
    // Only skip if we're in questions/voting phase AND only submissions/votes changed
    const isQuestionsPhase = gameState.phase === 'questions' || gameState.phase === 'voting';
    const hasOnlySubmissionChanges = isQuestionsPhase && 
      gameState.submittedAnswers && 
      Object.keys(gameState.submittedAnswers).length > 0;
    const hasOnlyVoteChanges = gameState.phase === 'voting' && 
      gameState.votes && 
      Object.keys(gameState.votes).length > 0;
    
    // If we're in questions/voting phase and only submissions/votes exist, 
    // and host already submitted/voted, this is likely a sync update
    const hostAlreadySubmitted = gameState.submittedAnswers?.[currentUserId || ''] === true;
    const hostAlreadyVoted = gameState.votes?.[currentUserId || ''] !== undefined;
    
    // Only skip if host already acted and this looks like just a sync update
    if ((hasOnlySubmissionChanges && hostAlreadySubmitted) || 
        (hasOnlyVoteChanges && hostAlreadyVoted)) {
      console.log('⏭️ Skipping host debounced save - likely real-time sync update');
      return;
    }
    
    // This is an explicit host action - save it
    const stateToSave = {
      ...gameState,
      currentScreen: currentScreen
    };
    console.log('💾 Host debounced save triggered:', {
      phase: gameState.phase,
      currentScreen,
      reason: 'Host made explicit change'
    });
    lastExplicitSaveRef.current = currentStateHash;
    saveGameStateToSupabase(stateToSave);
  }, [gameState, currentScreen, roomId, currentUserId, saveGameStateToSupabase]);

  const handleEnter = () => {
    setCurrentScreen('home');
  };

  const handleGameModeSelect = (mode: GameMode) => {
    // Ensure gameMode is set correctly before navigating
    setGameState(prev => ({ ...prev, gameMode: mode }));
    setCurrentScreen('roomMode');
  };


  const handlePackSelect = async (pack: GamePack | WordPack) => {
    // Check if it's a custom pack - route to creation screen
    if (pack === 'custom') {
      // Double-check gameMode to ensure correct routing
      // If gameMode is questions, go to question creation; otherwise word creation
      if (gameState.gameMode === 'questions') {
        setCurrentScreen('customQuestionCreation');
      } else {
        setCurrentScreen('customWordCreation');
      }
      return;
    }

    if (!currentUserId) {
      console.error('User not authenticated');
      return;
    }

    const roomCode = generateRoomCode();
    
    // Prepare host player data (optimistic update)
    const hostPlayer: Player = {
      id: currentUserId,
      username: username,
      avatar: avatar,
      isHost: true,
      role: 'innocent', // Host is innocent for regular packs
      isConnected: true,
      answer: '',
      hasVoted: false,
      hasSubmittedAnswer: false,
      hasSeenRole: false,
      isEliminated: false
    };

    // Prepare game state immediately (optimistic update)
    const newGameState: GameState = {
            ...gameState,
            phase: 'lobby',
            players: [hostPlayer],
      hostId: currentUserId,
      roomCode: roomCode,
      selectedPack: pack,
            selectedPackType: pack,
      currentRound: 1,
      eliminatedPlayers: [],
      winners: [],
      winnerType: undefined,
      playerAnswers: {},
      submittedAnswers: {},
      votes: {},
      originalVotes: undefined,
      tieBreakerVotes: undefined,
      playerRoles: {},
      jesterCluePlayers: [],
      isTieVote: false,
      tiedPlayers: [],
      gameEndReason: undefined,
      currentVoteResult: undefined,
      currentImpostorWord: ''
    };
    
    // Optimistic UI update - navigate immediately
    setGameState({
      ...newGameState,
      currentScreen: 'lobby'
    });
    setCurrentScreen('lobby');

    // Run database operations in parallel (non-blocking)
    Promise.all([
      // Create room
      roomService.createRoom(
        currentUserId,
        roomCode,
        gameState.gameMode,
        gameState.impostorCount,
        gameState.hasJester,
        gameState.isRandomizeMode,
        pack
      ),
    ]).then(async ([room]) => {
      if (!room) {
        console.error('Failed to create room');
        // Revert to previous screen on error
        setCurrentScreen('gamePack');
        return;
      }

      setRoomId(room.id);

      // Run remaining operations in parallel
      await Promise.all([
        // Add host player to room
        roomService.addPlayerToRoom(
        room.id,
        currentUserId,
        username,
        avatar || null,
        true,
        false
        ),
        // Save game state (non-critical, can be deferred)
        roomService.saveGameState(room.id, newGameState as unknown as Record<string, unknown>)
      ]);
    }).catch((error) => {
      console.error('Error during room creation:', error);
      // Revert to previous screen on error
      setCurrentScreen('gamePack');
    });
  };

  const handleCustomQuestionSave = async (innocentQuestion: string, impostorQuestion: string) => {
    if (!currentUserId) {
      console.error('User not authenticated');
      return;
    }

    const roomCode = generateRoomCode();
    
    // Prepare host player data (optimistic update)
    const hostPlayer: Player = {
      id: currentUserId,
      username: username,
      avatar: avatar,
      isHost: true,
      role: 'spectator', // Host is spectator for custom packs
      isConnected: true,
      answer: '',
      hasVoted: false,
      hasSubmittedAnswer: false,
      hasSeenRole: false,
      isEliminated: false
    };

    // Prepare game state immediately (optimistic update)
    const newGameState: GameState = {
          ...gameState,
          phase: 'lobby',
          players: [hostPlayer],
      hostId: currentUserId,
      roomCode: roomCode,
      selectedPack: 'custom',
      selectedPackType: 'custom',
      currentRound: 1,
      eliminatedPlayers: [],
      winners: [],
      winnerType: undefined,
      playerAnswers: {},
      submittedAnswers: {},
      votes: {},
      originalVotes: undefined,
      tieBreakerVotes: undefined,
      playerRoles: {},
      jesterCluePlayers: [],
      isTieVote: false,
      tiedPlayers: [],
      gameEndReason: undefined,
      currentVoteResult: undefined,
      // Store custom questions for this game only
      currentQuestion: innocentQuestion,
      currentImpostorQuestion: impostorQuestion,
      currentImpostorWord: ''
    };
    
    // Optimistic UI update - navigate immediately
    setGameState({
      ...newGameState,
      currentScreen: 'lobby'
    });
    setCurrentScreen('lobby');

    // Run database operations in parallel (non-blocking)
    Promise.all([
      // Create room
      roomService.createRoom(
        currentUserId,
        roomCode,
        gameState.gameMode,
        gameState.impostorCount,
        gameState.hasJester,
        gameState.isRandomizeMode,
        'custom'
      ),
    ]).then(async ([room]) => {
      if (!room) {
        console.error('Failed to create room');
        // Revert to previous screen on error
        setCurrentScreen('customQuestionCreation');
        return;
      }

      setRoomId(room.id);

      // Run remaining operations in parallel
      await Promise.all([
        // Add host player to room
        roomService.addPlayerToRoom(
        room.id,
        currentUserId,
        username,
        avatar || null,
        true,
        false
        ),
        // Save game state (non-critical, can be deferred)
        roomService.saveGameState(room.id, newGameState as unknown as Record<string, unknown>)
      ]);
    }).catch((error) => {
      console.error('Error during room creation:', error);
      // Revert to previous screen on error
      setCurrentScreen('customQuestionCreation');
    });
  };

  const handleCustomWordSave = async (innocentWord: string, impostorWord: string) => {
    if (!currentUserId) {
      console.error('User not authenticated');
      return;
    }

    const roomCode = generateRoomCode();
    
    // Create room in Supabase
    const room = await roomService.createRoom(
      currentUserId,
      roomCode,
      gameState.gameMode,
      gameState.impostorCount,
      gameState.hasJester,
      gameState.isRandomizeMode,
      'custom'
    );

    if (!room) {
      console.error('Failed to create room');
      return;
    }

    setRoomId(room.id);

    const hostPlayer: Player = {
      id: currentUserId,
      username: username,
      avatar: avatar,
      isHost: true,
      role: 'spectator', // Host is spectator for custom packs
      isConnected: true,
      answer: '',
      hasVoted: false,
      hasSubmittedAnswer: false,
      hasSeenRole: false,
      isEliminated: false
    };

    // Add host player to room
    await roomService.addPlayerToRoom(
      room.id,
      currentUserId,
      username,
      avatar || null,
      true,
      false
    );

    const newGameState: GameState = {
        ...gameState,
        phase: 'lobby',
        players: [hostPlayer],
      hostId: currentUserId,
      roomCode: roomCode,
      selectedPack: 'custom',
      selectedPackType: 'custom',
      currentRound: 1,
      eliminatedPlayers: [],
      winners: [],
      winnerType: undefined,
      playerAnswers: {},
      submittedAnswers: {},
      votes: {},
      originalVotes: undefined,
      tieBreakerVotes: undefined,
      playerRoles: {},
      jesterCluePlayers: [],
      isTieVote: false,
      tiedPlayers: [],
      gameEndReason: undefined,
      currentVoteResult: undefined,
      // Store custom words for this game only
      currentWord: innocentWord,
      currentImpostorWord: impostorWord
    };

    // Include currentScreen in game state for syncing
    const gameStateWithScreen = {
      ...newGameState,
      currentScreen: 'lobby' as Screen
    };
    setGameState(gameStateWithScreen);
    await roomService.saveGameState(room.id, gameStateWithScreen as unknown as Record<string, unknown>);
    
    setCurrentScreen('lobby');
  };

  const handleCustomCreationBack = () => {
    setCurrentScreen('gamePack');
  };

  // Helper function to start voting phase (reduces duplication)
  const handleStartVotingPhase = useCallback(() => {
    // Only host can start voting
    if (currentUserId !== gameState.hostId) {
      console.warn('Only host can start voting');
      return;
    }
    
    console.log('🎯 Host starting voting phase');
    
    const updatedState = {
      ...gameState,
      phase: 'voting' as const,
      currentScreen: 'voting' as const
    };
    
    setGameState(updatedState);
    setCurrentScreen('voting');
    
    // CRITICAL: Save to Supabase IMMEDIATELY so all players sync
    if (roomId) {
      isSavingRef.current = true;
      const stateToSave = {
        ...updatedState,
        currentScreen: 'voting'
      };
      roomService.saveGameState(roomId, stateToSave as unknown as Record<string, unknown>)
        .then(() => {
          console.log('✅ Voting phase started - state saved to Supabase, all players should sync');
          setTimeout(() => { isSavingRef.current = false; }, 1000);
        })
        .catch((error) => {
          console.error('❌ Error saving voting phase start:', error);
          isSavingRef.current = false;
        });
    }
  }, [currentUserId, gameState.hostId, gameState, roomId]);

  const handleJoinRoomSubmit = async (roomCode: string) => {
    if (!currentUserId) {
      console.error('User not authenticated');
      return;
    }

    try {
      // Get room by code with timeout
      const room = await Promise.race([
        roomService.getRoomByCode(roomCode),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Room lookup timeout')), 10000)
        )
      ]) as Awaited<ReturnType<typeof roomService.getRoomByCode>>;
      
      if (!room) {
        console.error('Room not found');
        // TODO: Show error message to user
        return;
      }

      if (!room.is_active) {
        console.error('Room is not active');
        // TODO: Show error message to user
        return;
      }

      setRoomId(room.id);

      // Add player to room (or update if already exists)
      // UPSERT handles re-joins gracefully - if player already exists, it updates their status
      const roomPlayer = await Promise.race([
        roomService.addPlayerToRoom(
          room.id,
          currentUserId,
          username,
          avatar || null,
          false,
          false
        ),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Add player timeout')), 10000)
        )
      ]) as Awaited<ReturnType<typeof roomService.addPlayerToRoom>>;

      if (!roomPlayer) {
        console.error('Failed to join room - player may already be in room or database error occurred');
        // Try to get existing players to see if we're already in the room
        const existingPlayers = await roomService.getRoomPlayers(room.id);
        const alreadyInRoom = existingPlayers.some(p => p.player_id === currentUserId);
        
        if (alreadyInRoom) {
          console.log('Player already in room, continuing with existing data...');
          // Continue with existing room data instead of failing
        } else {
          // Real error - can't join
          return;
        }
      }

      // Get existing players and game state in parallel for better performance
      const [roomPlayers, gameStateData] = await Promise.all([
        roomService.getRoomPlayers(room.id),
        roomService.getGameState(room.id)
      ]);

    // Convert room data to game state
    const existingGameState = gameStateData?.state as GameState | undefined;
    const players = roomPlayers.map(rp => {
      const playerFromState = existingGameState?.players.find(p => p.id === rp.player_id);
      return {
        id: rp.player_id,
        username: rp.username,
        avatar: rp.avatar || undefined,
        isHost: rp.is_host,
        role: playerFromState?.role || 'innocent',
        isConnected: rp.is_connected,
        answer: playerFromState?.answer || '',
        hasVoted: playerFromState?.hasVoted || false,
        hasSubmittedAnswer: playerFromState?.hasSubmittedAnswer || false,
        hasSeenRole: playerFromState?.hasSeenRole || false,
        isEliminated: playerFromState?.isEliminated || false,
        isBot: rp.is_bot,
      };
    });

    // Merge room data with existing game state
    const roomGameStateData = roomToGameState(room);
    const mergedGameState: GameState = {
      ...existingGameState,
      ...roomGameStateData,
      players,
      roomCode: room.code,
      hostId: room.host_id,
    } as GameState;

    setGameState(mergedGameState);
    // Sync screen from game state if available, otherwise default to lobby
    const screenToShow = mergedGameState.currentScreen || 'lobby';
    setCurrentScreen(screenToShow as Screen);
    } catch (error) {
      console.error('Error joining room:', error);
      // Reset loading state will be handled by JoinRoomScreen
      throw error; // Re-throw so JoinRoomScreen can handle it
    }
  };

  const handleAddBot = async () => {
    // Only host can add bots
    if (roomId && currentUserId !== gameState.hostId) {
      console.warn('Only host can add bots');
      return;
    }

    if (!roomId || !currentUserId) {
      console.error('Room or user not available');
      return;
    }

    const bot = createBot(gameState.players.length);
    
    // Generate UUID for bot
    // NOTE: Bots are optional and mainly for testing
    // If bot creation fails, we'll just skip it (you can test with multiple browsers instead)
    const botId = generateUUID();
    
    console.log('🤖 Attempting to create bot with UUID:', botId, 'Username:', bot.username);
    
    // Try to add bot to Supabase
    // If this fails, we'll just skip bot creation (bots are optional for testing)
    const botPlayer = await roomService.addPlayerToRoom(
      roomId,
      botId,
      bot.username,
      bot.avatar || null,
      false,
      true
    );

    if (!botPlayer) {
      console.warn('⚠️ Bot creation failed - this is OK! Bots are optional.');
      console.info('💡 Tip: You can test the game by opening multiple browser tabs/windows instead');
      console.info('💡 To enable bots, make sure COMPLETE_SUPABASE_SETUP.sql has been run in Supabase');
      // Don't show alert - bots are optional, just log and return gracefully
      return;
    }

    console.log('✅ Bot added to room_players table');

    // Update local state immediately
    const updatedPlayers = [...gameState.players, { ...bot, id: botId }];
    setGameState(prev => ({
      ...prev,
      players: updatedPlayers
    }));
    
    // CRITICAL: Save game state immediately for fast sync to all players
    if (roomId && currentUserId === gameState.hostId) {
      const updatedState = {
        ...gameState,
        players: updatedPlayers
      };
      await roomService.saveGameState(roomId, updatedState as unknown as Record<string, unknown>);
      console.log('✅ Bot added and game state saved - realtime should broadcast to all players');
    }
  };


  const handleImpostorCountChange = async (count: number) => {
    // Only host can change settings
    if (roomId && currentUserId !== gameState.hostId) {
      console.warn('Only host can change impostor count');
      return;
    }

    setGameState(prev => ({ ...prev, impostorCount: count }));
    // Update room in Supabase if user is host
    if (roomId && currentUserId === gameState.hostId) {
      await roomService.updateRoom(roomId, { impostor_count: count });
    }
  };

  const handleRandomizeToggle = async (enabled: boolean) => {
    // Only host can change settings
    if (roomId && currentUserId !== gameState.hostId) {
      console.warn('Only host can toggle randomize mode');
      return;
    }

    setGameState(prev => ({ ...prev, isRandomizeMode: enabled }));
    // Update room in Supabase if user is host
    if (roomId && currentUserId === gameState.hostId) {
      await roomService.updateRoom(roomId, { is_randomize_mode: enabled });
    }
  };

  const handleJesterToggle = async (enabled: boolean) => {
    // Only host can change settings
    if (roomId && currentUserId !== gameState.hostId) {
      console.warn('Only host can toggle jester mode');
      return;
    }

    setGameState(prev => ({ ...prev, hasJester: enabled }));
    // Update room in Supabase if user is host
    if (roomId && currentUserId === gameState.hostId) {
      await roomService.updateRoom(roomId, { has_jester: enabled });
    }
  };

  // Helper function for host-only screen transitions
  const transitionToScreen = useCallback((newScreen: Screen, additionalStateUpdates?: Partial<GameState>) => {
    // Check if user is host (only check if we're in a room)
    // Use functional update to get latest hostId
    setGameState(prev => {
      if (roomId && currentUserId !== prev.hostId) {
        console.warn('Only host can change screens');
        return prev; // Don't update if not host
      }

      // Optimistic UI update - navigate immediately
      setCurrentScreen(newScreen);
      
      // Update game state with new screen (will trigger save to Supabase if host)
      return {
        ...prev,
        currentScreen: newScreen,
        ...additionalStateUpdates
      };
    });
  }, [currentUserId, roomId]);

  // CRITICAL: Watch synced submittedAnswers and transition when all players have submitted
  useEffect(() => {
    // Only check during questions phase and on questions screen
    if (currentScreen !== 'questions' || gameState.phase !== 'questions') {
      return;
    }

    // Filter out spectators - only check non-spectator players
    const nonSpectatorPlayers = gameState.players.filter(p => p.role !== 'spectator');
    
    if (nonSpectatorPlayers.length === 0) {
      return;
    }

    // Check if all non-spectator players have submitted (including bots)
    const allPlayersSubmitted = nonSpectatorPlayers.every(player => 
      gameState.submittedAnswers[player.id] || player.isBot
    );
    
    // Debug logging
    const submittedCount = Object.keys(gameState.submittedAnswers || {}).length;
    const nonBotPlayers = nonSpectatorPlayers.filter(p => !p.isBot);
    const nonBotSubmittedCount = nonBotPlayers.filter(p => gameState.submittedAnswers[p.id]).length;
    
    console.log('📊 Answer submission check:', {
      totalNonSpectatorPlayers: nonSpectatorPlayers.length,
      nonBotPlayers: nonBotPlayers.length,
      nonBotSubmitted: nonBotSubmittedCount,
      submittedAnswers: gameState.submittedAnswers,
      allPlayersSubmitted,
      currentScreen,
      phase: gameState.phase
    });

    if (allPlayersSubmitted) {
      console.log('✅ All players have submitted answers (synced from Supabase)');
      
      // Generate bot answers for bots that haven't answered yet
      const botAnswers: Record<string, string> = {};
      const botSubmissions: Record<string, boolean> = {};

      gameState.players.forEach(player => {
        if (player.isBot && !gameState.submittedAnswers[player.id]) {
          const answer = generateBotAnswer();
          botAnswers[player.id] = answer;
          botSubmissions[player.id] = true;
        }
      });

      // If there are bot answers to add, update state
      if (Object.keys(botAnswers).length > 0) {
        const updatedState = {
          ...gameState,
          playerAnswers: { ...gameState.playerAnswers, ...botAnswers },
          submittedAnswers: { ...gameState.submittedAnswers, ...botSubmissions }
        };
        setGameState(updatedState);
        
        // Save bot answers to Supabase immediately
        if (roomId && currentUserId === gameState.hostId) {
          const stateToSave = {
            ...updatedState,
            currentScreen: currentScreen
          };
          roomService.saveGameState(roomId, stateToSave as unknown as Record<string, unknown>);
        }
        return; // Wait for next render after bot answers are added
      }

      // Transition to role reveal screen
      // Only host triggers the transition, but all players will sync via real-time
      if (currentUserId === gameState.hostId) {
        console.log('🎯 Host transitioning to roleReveal screen - all players submitted');
        
        // CRITICAL: Save to Supabase IMMEDIATELY so all players sync
        // Don't rely on transitionToScreen's debounced save - this is a critical transition
        const updatedStateForTransition = {
          ...gameState,
          currentScreen: 'roleReveal' as const
        };
        
        setGameState(updatedStateForTransition);
        setCurrentScreen('roleReveal');
        
        // Save immediately to Supabase
        if (roomId) {
          isSavingRef.current = true;
          const stateToSave = {
            ...updatedStateForTransition,
            currentScreen: 'roleReveal'
          };
          roomService.saveGameState(roomId, stateToSave as unknown as Record<string, unknown>)
            .then(() => {
              console.log('✅ Transitioned to roleReveal - state saved to Supabase, all players should sync');
              setTimeout(() => { isSavingRef.current = false; }, 1000);
            })
            .catch((error) => {
              console.error('❌ Error saving roleReveal transition:', error);
              isSavingRef.current = false;
            });
        }
      }
    }
  }, [gameState.submittedAnswers, gameState.players, currentScreen, gameState.phase, currentUserId, gameState.hostId, roomId]);

  const handleStartGame = () => {
    // Only host can start the game
    if (currentUserId !== gameState.hostId) {
      console.warn('Only host can start the game');
      return;
    }

    console.log('handleStartGame called, players:', gameState.players.length);
    if (gameState.players.length < 3) {
      alert('Need at least 3 players to start the game');
      return;
    }
    
    // Mark that we've played at least once
    setHasPlayedOnce(true);

    const customContent = gameState.gameMode === 'questions'
      ? [gameState.currentQuestion, gameState.currentImpostorQuestion]
      : [gameState.currentWord];

    const newGameState = initializeGame(
      gameState.players,
      gameState.isRandomizeMode ? 'randomize' : gameState.impostorCount,
      gameState.hasJester,
      gameState.gameMode,
      gameState.isRandomizeMode,
      gameState.selectedPackType === 'custom' ? customContent : undefined,
      gameState.selectedPackType // Pass the selected pack type
    );

    // Determine target screen based on role
    const currentPlayer = gameState.players.find(p => p.username === username);
    const targetScreen: Screen = currentPlayer?.role === 'spectator' ? 'answers' : 'questions';
    
    const updatedGameState = {
      ...gameState,
      ...newGameState,
      // Preserve players and room info from lobby
      players: newGameState.players.map(p => {
        const oldPlayer = gameState.players.find(op => op.id === p.id);
        return { ...oldPlayer, ...p };
      }),
      roomCode: gameState.roomCode, 
      selectedPack: gameState.selectedPack,
      selectedPackType: gameState.selectedPackType,
      // IMPORTANT: Include currentScreen in game state for syncing
      currentScreen: targetScreen
    };
    
    setGameState(updatedGameState);
    
    // Transition to screen immediately (optimistic update)
    if (currentPlayer?.role === 'spectator') {
      console.log('Host is spectator, going to answers screen to wait for players');
      setCurrentScreen('answers');
    } else {
      console.log('Setting screen to questions');
      setCurrentScreen('questions');
    }
    
    // CRITICAL: Save to Supabase IMMEDIATELY so all players see the game start
    // Don't rely on debounced save - this is a critical transition
    if (roomId) {
      // Temporarily block debounced save to prevent conflicts
      isSavingRef.current = true;
      const stateToSave = {
        ...updatedGameState,
        currentScreen: targetScreen
      };
      roomService.saveGameState(roomId, stateToSave as unknown as Record<string, unknown>)
        .then(() => {
          console.log('✅ Game started - state saved to Supabase, all players should sync');
          // Reset flag after a short delay
          setTimeout(() => { isSavingRef.current = false; }, 1000);
        })
        .catch((error) => {
          console.error('❌ Error saving game start state:', error);
          isSavingRef.current = false;
        });
    }
  };

  const handleAnswerSubmit = async (answer: string) => {
    const currentPlayer = gameState.players.find(p => p.username === username);
    if (!currentPlayer) return;

    // CRITICAL: Fetch latest state from Supabase to merge submissions properly
    // This prevents overwriting other players' submissions
    let latestState = gameState;
    if (roomId) {
      try {
        const latestGameState = await roomService.getGameState(roomId);
        if (latestGameState?.state) {
          latestState = latestGameState.state as GameState;
          console.log('📥 Fetched latest state from Supabase before saving submission');
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch latest state, using local state:', error);
        // Continue with local state if fetch fails
      }
    }

    // Merge our submission with the latest state from Supabase
    const updatedGameState = {
      ...latestState,
      playerAnswers: {
        ...latestState.playerAnswers,
        [currentPlayer.id]: answer
      },
      submittedAnswers: {
        ...latestState.submittedAnswers,
        [currentPlayer.id]: true
      },
      // Preserve other important state that might have changed
      players: gameState.players, // Use local players (they might have updated)
      phase: gameState.phase,
      currentScreen: currentScreen
    };

    setGameState(updatedGameState);

    // CRITICAL: Save to Supabase IMMEDIATELY so other players see the submission
    // Each player saves their own submission - this ensures fast sync
    if (roomId) {
      const stateToSave = {
        ...updatedGameState,
        currentScreen: currentScreen
      };
      
      // Double-check host status - use both currentUserId and currentPlayer.isHost
      const isHost = currentUserId === gameState.hostId || currentPlayer.isHost;
      
      console.log('📝 Answer submission save check:', {
        currentUserId,
        hostId: gameState.hostId,
        isHost: isHost,
        playerIsHost: currentPlayer.isHost,
        username: currentPlayer.username,
        submittedAnswersCount: Object.keys(updatedGameState.submittedAnswers || {}).length,
        allSubmittedAnswers: updatedGameState.submittedAnswers
      });
      
      if (isHost) {
        // Host can INSERT or UPDATE (UPSERT)
        // Temporarily block debounced save to prevent overwriting
        isSavingRef.current = true;
        try {
          await roomService.saveGameState(roomId, stateToSave as unknown as Record<string, unknown>);
          console.log('✅ Host: Answer submitted and saved to Supabase immediately');
        } catch (error: any) {
          // If UPSERT fails with 403, fallback to UPDATE (shouldn't happen, but safety)
          if (error?.code === '42501' || error?.message?.includes('403')) {
            console.warn('⚠️ Host UPSERT failed, falling back to UPDATE');
            await roomService.updateGameState(roomId, stateToSave as unknown as Record<string, unknown>);
          } else {
            throw error;
          }
        }
        // Reset flag after sync completes
        setTimeout(() => { isSavingRef.current = false; }, 500);
      } else {
        // Non-host can only UPDATE (game state should already exist from host)
        await roomService.updateGameState(roomId, stateToSave as unknown as Record<string, unknown>);
        console.log('✅ Non-host: Answer submitted and saved to Supabase immediately');
      }
    }

    // Note: Transition logic is now handled by useEffect watching synced submittedAnswers
    // This ensures all players see each other's submissions before transitioning
  };

  const handleForceSubmitAllAnswers = useCallback(() => {
    // Generate bot answers for all bots that haven't answered
    const botAnswers: Record<string, string> = {};
    const botSubmissions: Record<string, boolean> = {};
    
    gameState.players.forEach(player => {
      if (player.isBot && !gameState.submittedAnswers[player.id]) {
        const answer = generateBotAnswer();
        botAnswers[player.id] = answer;
        botSubmissions[player.id] = true;
      }
    });

      setGameState(prev => ({
        ...prev,
      playerAnswers: { ...prev.playerAnswers, ...botAnswers },
      submittedAnswers: { ...prev.submittedAnswers, ...botSubmissions }
      }));
  }, [gameState.players, gameState.submittedAnswers]);

  const handleAllAnswersSubmitted = () => {
    // This function is no longer used since we go directly to voting screen
    console.log('All answers submitted - this function is deprecated');
  };

  const handleStartVoting = () => {
    if (!gameState.isRandomizeMode) {
      return;
    }

    // Only host can start voting
    if (currentUserId !== gameState.hostId) {
      console.warn('Only host can start voting');
      return;
    }

    setGameState(prev => ({
      ...prev,
      phase: 'voting',
      currentScreen: 'voting'
    }));

    transitionToScreen('voting');
  };

  const handleBotVote = (botId: string, votes: string[]) => {
    const botPlayer = gameState.players.find(p => p.id === botId);
    console.log(`Bot ${botPlayer?.username || botId} voting for ${votes.join(', ')}`);
    console.log('Current votes before bot vote:', gameState.votes);
    setGameState(prev => {
      const newVotes = {
        ...prev.votes,
        [botId]: votes
      };
      console.log('New votes after bot vote:', newVotes);
      return {
        ...prev,
        votes: newVotes
      };
    });
  };


  const handleSubmitVotes = useCallback(async (userVotes: string[] = []) => {
    console.log('App.tsx handleSubmitVotes called with userVotes:', userVotes);
    const currentPlayer = gameState.players.find(p => p.username === username);
    if (!currentPlayer) {
      console.log('App.tsx handleSubmitVotes: No current player found');
      return;
    }

    console.log('App.tsx handleSubmitVotes: Current player found:', currentPlayer.username);
    
    // Add user's vote to the votes if provided
    const allVotes = { ...gameState.votes };
    if (userVotes.length > 0) {
      allVotes[currentPlayer.id] = userVotes;
      console.log('App.tsx handleSubmitVotes: Added user vote to allVotes:', allVotes);
    }
    
    // Update local state immediately
    const updatedGameState = {
      ...gameState,
      votes: allVotes
    };
    setGameState(updatedGameState);

    // CRITICAL: Save votes to Supabase immediately so other players see the vote
    // Host uses UPSERT (can INSERT or UPDATE), non-host uses UPDATE only
    // IMPORTANT: Non-hosts should preserve currentScreen from latest state to avoid overwriting host transitions
    if (roomId) {
      // Double-check host status - use both currentUserId and currentPlayer.isHost
      const isHost = currentUserId === gameState.hostId || currentPlayer.isHost;
      
      console.log('📝 Vote submission save check:', {
        currentUserId,
        hostId: gameState.hostId,
        isHost: isHost,
        playerIsHost: currentPlayer.isHost,
        username: currentPlayer.username,
        currentScreen: currentScreen
      });
      
      if (isHost) {
        // Host can INSERT or UPDATE (UPSERT)
        // Host controls screen transitions, so use currentScreen
        const stateToSave = {
          ...updatedGameState,
          currentScreen: currentScreen // Host controls screen
        };
        try {
          await roomService.saveGameState(roomId, stateToSave as unknown as Record<string, unknown>);
          console.log('✅ Host: Vote submitted and saved to Supabase immediately');
        } catch (error: any) {
          // If UPSERT fails with 403, fallback to UPDATE (shouldn't happen, but safety)
          if (error?.code === '42501' || error?.message?.includes('403')) {
            console.warn('⚠️ Host UPSERT failed, falling back to UPDATE');
            await roomService.updateGameState(roomId, stateToSave as unknown as Record<string, unknown>);
          } else {
            throw error;
          }
        }
      } else {
        // Non-host can only UPDATE (game state should already exist from host)
        // CRITICAL: Non-hosts should NEVER update currentScreen - only host controls screen transitions
        // Fetch latest state and merge ONLY votes, preserving everything else (especially currentScreen)
        let stateToSave: GameState;
        try {
          const latestGameState = await roomService.getGameState(roomId);
          if (latestGameState?.state) {
            const latest = latestGameState.state as GameState;
            console.log('📥 Non-host: Fetched latest state before saving vote:', {
              latestScreen: latest.currentScreen,
              latestPhase: latest.phase,
              localScreen: currentScreen,
              preservingScreen: latest.currentScreen // Always preserve host's screen
            });
            // Merge ONLY votes into latest state, preserving currentScreen and phase from host
            // CRITICAL: Never update currentScreen or phase - these are host-controlled
            stateToSave = {
              ...latest, // Start with latest state from host (preserves currentScreen, phase, etc.)
              votes: {
                ...latest.votes, // Preserve existing votes
                ...updatedGameState.votes // Merge in new votes (overwrites if same player voted again)
              },
              // Preserve other fields from latest state
              players: latest.players || updatedGameState.players,
              playerAnswers: latest.playerAnswers || updatedGameState.playerAnswers,
              submittedAnswers: latest.submittedAnswers || updatedGameState.submittedAnswers,
              // CRITICAL: Never touch currentScreen or phase - these are host-controlled
              currentScreen: latest.currentScreen, // Always use host's screen
              phase: latest.phase // Always use host's phase
            };
          } else {
            // Fallback: if can't fetch, merge votes but preserve currentScreen from gameState
            console.warn('⚠️ Non-host: Could not fetch latest state, preserving screen from gameState');
            stateToSave = {
              ...updatedGameState,
              currentScreen: gameState.currentScreen, // Preserve from gameState (host's last known screen)
              phase: gameState.phase // Preserve phase too
            };
          }
        } catch (error) {
          console.warn('⚠️ Non-host: Error fetching latest state, preserving screen from gameState:', error);
          // Fallback: preserve currentScreen from gameState (host's last known screen)
          stateToSave = {
            ...updatedGameState,
            currentScreen: gameState.currentScreen, // Preserve from gameState, not local currentScreen
            phase: gameState.phase // Preserve phase too
          };
        }
        
        await roomService.updateGameState(roomId, stateToSave as unknown as Record<string, unknown>);
        console.log('✅ Non-host: Vote submitted and saved to Supabase immediately (preserved screen:', stateToSave.currentScreen, ', phase:', stateToSave.phase, ')');
      }
    }
    
    // Get non-eliminated players for validation
    const nonEliminatedPlayers = gameState.players.filter(p => !p.isEliminated);
          
    // VALIDATION: Ensure all NON-SPECTATOR players have voted before processing results
    const allPlayers = nonEliminatedPlayers;
    const nonSpectatorPlayers = allPlayers.filter(p => 
      gameState.selectedPackType !== 'custom' || p.role !== 'spectator'
    );
    const playersWhoVoted = Object.keys(allVotes);
    const playersWhoHaventVoted = nonSpectatorPlayers.filter(p => !playersWhoVoted.includes(p.id));
    
    console.log('VOTING VALIDATION:', {
      totalPlayers: allPlayers.length,
      nonSpectatorPlayers: nonSpectatorPlayers.length,
      playersWhoVoted: playersWhoVoted.length,
      playersWhoHaventVoted: playersWhoHaventVoted.map(p => ({ id: p.id, username: p.username, isBot: p.isBot, role: p.role })),
      allVotes: Object.keys(allVotes),
      allVotesDetails: allVotes,
      gameMode: gameState.gameMode,
      selectedPackType: gameState.selectedPackType
    });
    
    if (playersWhoHaventVoted.length > 0) {
      console.log('⏳ Waiting for more players to vote:', playersWhoHaventVoted.map(p => p.username));
      // Don't process results until all players have voted
      // The useEffect watching synced votes will handle the transition
      return;
    }
    
    // CRITICAL: Only host processes voting results to avoid race conditions
    // Non-host players just save their votes and wait for host to process
    if (currentUserId !== gameState.hostId) {
      console.log('⏳ Non-host: All votes submitted, waiting for host to process results...');
      return;
    }
      
    // Process voting results - use appropriate logic based on game mode and randomize mode
    // Only host reaches this point
    if (gameState.gameMode === 'words') {
      if (gameState.isRandomizeMode) {
        const wasTieBreakerRound = gameState.isTieVote;
        const { isTie, tiedPlayers, eliminatedPlayerIds } = processRandomizeVotes(gameState, allVotes, gameState.players);

        if (isTie) {
          setGameState(prev => {
            const votesSnapshot = JSON.parse(JSON.stringify(allVotes));
            const nextTieBreakerVotes = prev.isTieVote
              ? appendUniqueTieVote(prev.tieBreakerVotes, votesSnapshot)
              : undefined;

            const nextTieBreakerRound = (prev.currentTieBreakerRound || 0) + 1;
            const existingHistory = prev.tieBreakerHistory || [];
            const nextHistory = prev.isTieVote
              ? [...existingHistory, { round: nextTieBreakerRound - 1, votes: votesSnapshot, tiedPlayers }]
              : existingHistory;

            return {
              ...prev,
              phase: 'voting' as const,
              isTieVote: true,
              tiedPlayers,
              votes: {},
              originalVotes: prev.originalVotes || votesSnapshot,
              tieBreakerVotes: nextTieBreakerVotes,
              tieBreakerHistory: nextHistory,
              currentTieBreakerRound: nextTieBreakerRound,
            };
          });
          transitionToScreen('voting');
          return;
        }
        
        const autoEndResult = checkRandomizeAutoEnd(gameState, gameState.players, eliminatedPlayerIds);
        
        if (autoEndResult.shouldAutoEnd) {
          const winnerResult = determineRandomizeWinner(gameState, gameState.players);
          
          setGameState(prev => ({
            ...prev,
            ...winnerResult,
            phase: 'results',
            isTieVote: false
          }));
          
          transitionToScreen('results');
          return;
        }
        
        if (eliminatedPlayerIds.length > 0) {
          setGameState(prev => ({
              ...prev,
              ...updateGameStateAfterRandomizeElimination(
                prev,
                eliminatedPlayerIds,
                allVotes,
                wasTieBreakerRound
            ),
            currentScreen: 'voteResults'
          }));

          transitionToScreen('voteResults');
        }
      } else {
        const updatedGameState = processWordsGameVotes(gameState, allVotes, gameState.players);
        
        setGameState({
          ...updatedGameState,
          currentScreen: updatedGameState.phase === 'results' ? 'results' 
            : updatedGameState.phase === 'voteResults' ? 'voteResults'
            : updatedGameState.phase === 'voting' && updatedGameState.isTieVote ? 'voting'
            : undefined
        });
        
        if (updatedGameState.phase === 'results') {
          transitionToScreen('results');
        } else if (updatedGameState.phase === 'voteResults') {
          transitionToScreen('voteResults');
        } else if (updatedGameState.phase === 'voting' && updatedGameState.isTieVote) {
          transitionToScreen('voting');
        }
      }
    } else {
      // Process voting results for questions game standard mode
      // CRITICAL: Wrap setGameState to save immediately when transitioning to voteResults
      let finalStateAfterProcessing: GameState | null = null;
      let shouldSaveAfterProcessing = false;
      
      const wrappedSetGameState = (updatedState: GameState | ((prev: GameState) => GameState)) => {
        setGameState(prev => {
          const newState = typeof updatedState === 'function' 
            ? (updatedState as (prev: GameState) => GameState)(prev)
            : updatedState;
          
          // Store the final state for saving after processing completes
          finalStateAfterProcessing = newState;
          
          // If transitioning to voteResults, mark for saving
          if (newState.currentScreen === 'voteResults' && newState.currentScreen !== prev.currentScreen) {
            console.log('🎯 Processing voting results, transitioning to voteResults:', {
              from: prev.currentScreen,
              to: newState.currentScreen,
              phase: newState.phase,
              hasRoomId: !!roomId
            });
            setCurrentScreen(newState.currentScreen);
            shouldSaveAfterProcessing = true;
          } else if (newState.currentScreen && newState.currentScreen !== prev.currentScreen) {
            // Other screen changes - just update locally
            console.log('🎯 Screen changed during vote processing:', {
              from: prev.currentScreen,
              to: newState.currentScreen
            });
            setCurrentScreen(newState.currentScreen);
          }
          
          return newState;
        });
      };
      
      // Process voting results
      processVotingResults(
        allVotes, 
        gameState, 
        wrappedSetGameState, 
        (screen: string) => {
          // Screen transition callback - state already updated by wrappedSetGameState
          const newScreen = screen as Screen;
          console.log('🎯 processVotingResults setCurrentScreen callback:', newScreen);
          setCurrentScreen(newScreen);
          
          // If transitioning to voteResults, mark for saving
          if (newScreen === 'voteResults') {
            shouldSaveAfterProcessing = true;
          }
        }, 
        determineWinner
      );
      
      // CRITICAL: After processVotingResults completes, save the final state immediately
      // This ensures all players sync to voteResults screen
      if (shouldSaveAfterProcessing && finalStateAfterProcessing && roomId) {
        const targetScreen = finalStateAfterProcessing.currentScreen || 'voteResults';
        console.log('💾 Saving final voting results state to Supabase:', {
          currentScreen: targetScreen,
          phase: finalStateAfterProcessing.phase,
          eliminatedPlayers: finalStateAfterProcessing.eliminatedPlayers.length,
          hasWinners: !!(finalStateAfterProcessing.winners && finalStateAfterProcessing.winners.length > 0)
        });
        
        isSavingRef.current = true;
        const stateToSave = {
          ...finalStateAfterProcessing,
          currentScreen: targetScreen
        };
        
        roomService.saveGameState(roomId, stateToSave as unknown as Record<string, unknown>)
          .then(() => {
            console.log(`✅ Final state saved to Supabase with screen: ${targetScreen} - all players should sync`);
            setTimeout(() => { isSavingRef.current = false; }, 1000);
          })
          .catch((error) => {
            console.error(`❌ Error saving final voting results state:`, error);
            isSavingRef.current = false;
          });
      } else {
        console.warn('⚠️ Not saving vote results - missing conditions:', {
          shouldSave: shouldSaveAfterProcessing,
          hasState: !!finalStateAfterProcessing,
          currentScreen: finalStateAfterProcessing?.currentScreen,
          hasRoomId: !!roomId
        });
      }
    }
  }, [gameState.gameMode, gameState.isRandomizeMode, gameState.isTieVote, gameState.players, gameState.selectedPackType, gameState.votes, username, roomId, gameState]);

  // Helper function to handle vote submission (reduces duplication)
  // Must be defined after handleSubmitVotes since it depends on it
  const handleVoteSubmission = useCallback((votes: string[]) => {
    const currentPlayer = gameState.players.find(p => p.username === username);
    if (currentPlayer) {
      setGameState(prev => ({
        ...prev,
        votes: { ...prev.votes, [currentPlayer.id]: votes }
      }));
      setTimeout(() => {
        handleSubmitVotes(votes);
      }, 100);
    }
  }, [gameState.players, username, handleSubmitVotes]);


  const handleContinueRandomize = () => {
    console.log('CONTINUE RANDOMIZE: Starting new round');
    
    setGameState(prev => {
      const newContinueCount = (prev.continueCount || 0) + 1;
      console.log('Continue count:', newContinueCount, '/ 3');
      
      return {
        ...prev,
        continueCount: newContinueCount,
        ...prepareNextRandomizeRound(prev),
      };
    });
    
    // Always go to answer display screen for next round
    if (gameState.gameMode === 'words') {
      transitionToScreen('discussion');
    } else {
      transitionToScreen('answers');
    }
  };

  const handleFinishRandomize = () => {
    // Use appropriate winner determination logic based on game mode
    const { winners, winnerType } = gameState.gameMode === 'words' 
      ? determineWordsGameWinner(gameState, gameState.players)
      : determineRandomizeWinner(gameState, gameState.players);
    
    setGameState(prev => ({
      ...prev,
      phase: 'results',
      winners,
      winnerType
    }));
    transitionToScreen('results');
  };

  const handlePlayAgain = () => {
    // For custom packs, check if we've played once before
    if (gameState.selectedPackType === 'custom') {
      if (hasPlayedOnce) {
        // After playing once, go back to creation screen to create new questions
        setCurrentScreen(gameState.gameMode === 'questions' ? 'customQuestionCreation' : 'customWordCreation');
        return;
      } else {
        // First time playing, stay in lobby with same players but reset game settings
        setGameState(prev => {
          // Reset isEliminated status and roles for all players
          const resetPlayers = prev.players.map(p => ({ 
            ...p, 
            isEliminated: false,
            role: undefined as unknown as PlayerRole // Reset role to undefined so it gets reassigned in new game
          }));

          return {
            ...prev,
            players: resetPlayers,
            phase: 'lobby',
          currentRound: 1,
          eliminatedPlayers: [],
          winners: [],
          winnerType: undefined,
          playerAnswers: {},
          submittedAnswers: {},
          votes: {},
          originalVotes: undefined, // Clear previous game's original votes
          tieBreakerVotes: undefined, // Clear previous game's tie-breaker votes
          playerRoles: {},
          jesterCluePlayers: [],
          isTieVote: false,
          tiedPlayers: [],
          gameEndReason: undefined,
          currentVoteResult: undefined,
          // Reset game settings to defaults
          impostorCount: 1,
          hasJester: false,
          isRandomizeMode: false,
          // Keep custom content and players
          currentImpostorWord: '' // Clear previous game's custom word
          };
        });
        transitionToScreen('lobby');
        return;
      }
    }
      
    // For regular packs, go back to lobby with same pack and reset settings
    setGameState(prev => {
      // Reset isEliminated status and roles for all players
      const resetPlayers = prev.players.map(p => ({ 
        ...p, 
        isEliminated: false,
        role: undefined as unknown as PlayerRole // Reset role to undefined so it gets reassigned in new game
      }));

      return {
        ...prev,
        players: resetPlayers,
        phase: 'lobby',
        currentRound: 1,
        eliminatedPlayers: [],
        winners: [],
        winnerType: undefined,
        playerAnswers: {},
        submittedAnswers: {},
        votes: {},
        originalVotes: undefined, // Clear previous game's original votes
        tieBreakerVotes: undefined, // Clear previous game's tie-breaker votes
        originalPlayerRoles: undefined, // Clear previous game's original player roles
        continueCount: 0, // Reset continue count for new game
        playerRoles: {},
        jesterCluePlayers: [],
        isTieVote: false,
        tiedPlayers: [],
        gameEndReason: undefined,
        currentVoteResult: undefined,
        // Reset game settings to defaults
        impostorCount: 1,
        hasJester: false,
        isRandomizeMode: false,
        currentImpostorWord: '', // Clear previous game's custom word
        currentScreen: 'lobby' as Screen // Sync screen
      };
    });
    transitionToScreen('lobby');
  };

  const handleBackToHome = () => {
    setGameState({
      phase: 'lobby',
      players: [],
      currentRound: 1,
      maxRounds: 3,
      impostorCount: 1,
      hasJester: false,
      isRandomizeMode: false,
      hostId: '',
      roomCode: '',
      gameMode: 'questions',
      currentQuestion: '',
      currentImpostorQuestion: '',
      currentWord: '',
      currentImpostorWord: '',
      playerAnswers: {},
      submittedAnswers: {},
      votes: {},
      originalVotes: undefined, // Clear previous game's original votes
      tieBreakerVotes: undefined, // Clear previous game's tie-breaker votes
      eliminatedPlayers: [],
      winners: [],
      winnerType: undefined,
      playerRoles: {},
      selectedPack: null,
      startingPlayer: null,
      turnOrder: [],
      currentTurnPlayer: null,
      selectedQuestionPack: null,
      selectedPackType: null,
      jesterCluePlayers: [],
      isTieVote: false,
      tiedPlayers: [],
      gameEndReason: undefined,
      currentVoteResult: undefined
    });
    setHasPlayedOnce(false); // Reset play state when going back to home
    setCurrentScreen('home');
  };

  const handleRoleConfirmed = () => {
    // After role reveal, go to answers screen for questions game, discussion for words game
    // Only host controls screen transitions
    if (currentUserId !== gameState.hostId) {
      console.warn('Only host can confirm role and transition');
      return;
    }
    
    const targetScreen: Screen = gameState.gameMode === 'words' ? 'discussion' : 'answers';
    console.log('🎯 Host confirming role, transitioning to:', targetScreen);
    
    const updatedState = {
      ...gameState,
      currentScreen: targetScreen
    };
    
    setGameState(updatedState);
    setCurrentScreen(targetScreen);
    
    // CRITICAL: Save to Supabase IMMEDIATELY so all players sync
    if (roomId) {
      isSavingRef.current = true;
      const stateToSave = {
        ...updatedState,
        currentScreen: targetScreen
      };
      roomService.saveGameState(roomId, stateToSave as unknown as Record<string, unknown>)
        .then(() => {
          console.log(`✅ Transitioned to ${targetScreen} - state saved to Supabase, all players should sync`);
          setTimeout(() => { isSavingRef.current = false; }, 1000);
        })
        .catch((error) => {
          console.error(`❌ Error saving ${targetScreen} transition:`, error);
          isSavingRef.current = false;
        });
    }
  };

  // Auto-submit answers when timer expires
  useEffect(() => {
    if (currentScreen === 'questions' && gameState.phase === 'questions') {
      const timer = setTimeout(() => {
        handleForceSubmitAllAnswers();
        handleAllAnswersSubmitted();
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [currentScreen, gameState.phase, handleForceSubmitAllAnswers]);

  // Auto-submit votes when timer expires OR when all players have voted
  useEffect(() => {
    if ((currentScreen === 'voting' && gameState.phase === 'voting') || 
        (currentScreen === 'answers' && gameState.phase === 'voting')) {
      // Check if all non-spectator, non-eliminated players have voted
      const allPlayers = gameState.players;
      const activePlayers = allPlayers.filter(p => !p.isEliminated);
      const nonSpectatorPlayers = activePlayers.filter(p => 
        gameState.selectedPackType !== 'custom' || p.role !== 'spectator'
      );
      const playersWhoVoted = Object.keys(gameState.votes);
      const humanPlayer = allPlayers.find(p => p.username === username);
      const humanPlayerIsSpectator = humanPlayer?.role === 'spectator' && gameState.selectedPackType === 'custom';
      const humanPlayerHasVoted = humanPlayer ? playersWhoVoted.includes(humanPlayer.id) : false;
      const allNonSpectatorPlayersHaveVoted = nonSpectatorPlayers.every(p => playersWhoVoted.includes(p.id));
      
      console.log('VOTE CHECK:', {
        totalPlayers: allPlayers.length,
        activePlayers: activePlayers.length,
        nonSpectatorPlayers: nonSpectatorPlayers.length,
        playersWhoVoted: playersWhoVoted.length,
        allNonSpectatorPlayersHaveVoted,
        humanPlayerIsSpectator,
        humanPlayerHasVoted,
        humanPlayer: humanPlayer ? { id: humanPlayer.id, username: humanPlayer.username, role: humanPlayer.role } : 'not found',
        nonSpectatorPlayersList: nonSpectatorPlayers.map(p => ({ id: p.id, username: p.username, hasVoted: playersWhoVoted.includes(p.id), isHuman: p.username === username }))
      });
      
      // Process results if all non-spectator players have voted
      // CRITICAL: Only host processes results to avoid race conditions
      if (allNonSpectatorPlayersHaveVoted && nonSpectatorPlayers.length > 0 && currentUserId === gameState.hostId) {
        if (humanPlayerIsSpectator) {
          // Host is spectator, process results immediately
          console.log('✅ Host: All non-spectator players have voted, processing results (host is spectator)...');
          handleSubmitVotes();
          return;
        } else if (humanPlayerHasVoted) {
          // Host is not spectator and has voted, process results
          console.log('✅ Host: All players have voted (including host), processing results immediately...');
          handleSubmitVotes();
          return;
        } else {
          // Host is not spectator but hasn't voted yet
          console.log('⏳ Host: All non-spectator players have voted, waiting for host to vote...');
        }
      } else if (gameState.isTieVote) {
        console.log('Tie-breaker active - waiting for all players to vote again...');
      }
    }
  }, [currentScreen, gameState.phase, gameState.players, gameState.votes, gameState.eliminatedPlayers.length, username, handleSubmitVotes, gameState.selectedPackType, gameState.isTieVote]);


  // Auto-submit bot answers immediately when questions phase starts or when on answers screen
  useEffect(() => {
    if ((currentScreen === 'questions' && gameState.phase === 'questions') || 
        (currentScreen === 'answers' && gameState.phase === 'questions')) {
      const bots = gameState.players.filter(p => p.isBot && !gameState.submittedAnswers[p.id]);
      
      if (bots.length > 0) {
        console.log('Auto-submitting answers for bots:', bots.map(b => b.username));
        
        const botAnswers: Record<string, string> = {};
        const botSubmissions: Record<string, boolean> = {};
        
        bots.forEach(bot => {
          const answer = generateBotAnswer();
          botAnswers[bot.id] = answer;
          botSubmissions[bot.id] = true;
          console.log(`Bot ${bot.username} answered: ${answer}`);
        });
        
      setGameState(prev => ({
        ...prev,
          playerAnswers: { ...prev.playerAnswers, ...botAnswers },
          submittedAnswers: { ...prev.submittedAnswers, ...botSubmissions }
        }));
      }
    }
  }, [currentScreen, gameState.phase, gameState.players.length, gameState.submittedAnswers]);

  // Handle navigation to voting screen for host spectators (now handled within AnswerDisplayScreen)
  useEffect(() => {
    const handleNavigateToVoting = () => {
      console.log('Voting phase started within AnswerDisplayScreen');
      // The voting is now handled within the AnswerDisplayScreen component
      // No need to change screens
    };

    const handleNavigateToDiscussion = () => {
      console.log('Navigating to discussion screen from word game');
      setCurrentScreen('discussion');
    };

    window.addEventListener('navigateToVoting', handleNavigateToVoting);
    window.addEventListener('navigateToDiscussion', handleNavigateToDiscussion);
    return () => {
      window.removeEventListener('navigateToVoting', handleNavigateToVoting);
      window.removeEventListener('navigateToDiscussion', handleNavigateToDiscussion);
    };
  }, []);

  // Auto-adjust game settings when player count changes or when entering lobby
  useEffect(() => {
    if (currentScreen === 'lobby' && gameState.phase === 'lobby') {
      const playingPlayers = gameState.selectedPackType === 'custom' 
        ? gameState.players.filter(p => p.role !== 'spectator')
        : gameState.players;
      
      const playerCount = playingPlayers.length;
      
      // Calculate maximum allowed impostors for current player count
      const maxImpostors = Math.max(1, Math.floor((playerCount - 1) / 2));
      
      // If current impostor count is too high for player count, reset to 1
      if (gameState.impostorCount > maxImpostors) {
        console.log(`Player count reduced to ${playerCount}, resetting impostor count from ${gameState.impostorCount} to 1`);
        setGameState(prev => ({
          ...prev,
          impostorCount: 1,
          hasJester: false,
          isRandomizeMode: false
        }));
      }
      
      // If player count is less than 5, disable jester and randomize
      if (playerCount < 5) {
        if (gameState.hasJester || gameState.isRandomizeMode) {
          console.log(`Player count reduced to ${playerCount}, disabling jester and randomize`);
          setGameState(prev => ({
            ...prev,
            hasJester: false,
            isRandomizeMode: false
          }));
        }
      }
    }
  }, [currentScreen, gameState.phase, gameState.players.length, gameState.selectedPackType, gameState.impostorCount, gameState.hasJester, gameState.isRandomizeMode]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'entering':
        return <EnteringScreen onEnter={handleEnter} />;
      case 'home':
        return (
          <HomeScreen
            onGameModeSelect={handleGameModeSelect}
            username={username}
            onUsernameChange={setUsername}
            avatar={avatar}
            onAvatarChange={setAvatar}
            language="en"
            onLanguageChange={() => {}}
          />
        );
      case 'roomMode':
        return (
          <RoomModeScreen
            onCreateRoom={() => setCurrentScreen('gamePack')}
            onJoinRoom={() => setCurrentScreen('joinRoom')}
            onBack={() => setCurrentScreen('home')}
            language="en"
          />
        );
      case 'gamePack':
        return (
          <GamePackScreen
            gameMode={gameState.gameMode}
            onPackSelect={handlePackSelect}
            onBack={() => setCurrentScreen('roomMode')}
            language="en"
          />
        );
      case 'customQuestionCreation':
        return (
          <CustomQuestionCreationScreen
            onSave={handleCustomQuestionSave}
            onBack={handleCustomCreationBack}
            language="en"
          />
        );
      case 'customWordCreation':
        return (
          <CustomWordCreationScreen
            onSave={handleCustomWordSave}
            onBack={handleCustomCreationBack}
            language="en"
          />
        );
      case 'joinRoom':
        return (
          <JoinRoomScreen
            onJoinRoom={handleJoinRoomSubmit}
            onBack={() => setCurrentScreen('home')}
            error=""
            language="en"
          />
        );
      case 'lobby':
        return (
          <LobbyScreen
            gameState={gameState}
            currentUsername={username}
            onAddBot={handleAddBot}
            onImpostorCountChange={handleImpostorCountChange}
            onRandomizeToggle={handleRandomizeToggle}
            onJesterToggle={handleJesterToggle}
            onStartGame={handleStartGame}
            onBack={handleBackToHome}
            language="en"
          />
        );
      case 'questions':
        return (
          <QuestionScreen
            gameState={gameState}
            currentUsername={username}
            onSubmitAnswer={handleAnswerSubmit}
            language="en"
          />
        );
      case 'answers':
          return (
            <AnswerDisplayScreen
              gameState={gameState}
              currentUsername={username}
            language="en"
            onStartVoting={handleStartVotingPhase}
            onVote={handleVoteSubmission}
            setGameState={setGameState}
          />
        );
      case 'roleReveal':
        return (
          <>
            {/* Show AnswerDisplayScreen as background */}
            <AnswerDisplayScreen
              gameState={gameState}
              currentUsername={username}
              language="en"
              onStartVoting={() => {
                // Update game phase to voting
                setGameState(prev => ({
                  ...prev,
                  phase: 'voting'
                }));
              }}
              onVote={handleVoteSubmission}
              setGameState={setGameState}
            />
            {/* Show RoleRevealModal as overlay */}
            <RoleRevealModal
              playerRole={gameState.playerRoles[gameState.players.find(p => p.username === username)?.id || ''] as 'innocent' | 'impostor' | 'jester' || 'innocent'}
              playerName={username}
              onClose={handleRoleConfirmed}
              isOpen={true}
              language="en"
              players={gameState.players}
              playerAnswers={gameState.playerAnswers}
              currentQuestion={gameState.currentQuestion}
              currentWord={gameState.currentWord}
              gameMode={gameState.gameMode}
            />
          </>
        );
      case 'discussion':
        return (
          <DiscussionScreen
            gameState={gameState}
            currentUsername={username}
            onProceedToVoting={handleStartVoting}
            onUpdateGameState={setGameState}
            onVote={handleVoteSubmission}
            onBotVote={handleBotVote}
            language="en"
          />
        );
      case 'voting':
        return (
          <VotingScreen
            gameState={gameState}
            currentUsername={username}
            onVote={(votes) => {
              // Store the human player's vote and then process all votes
        const currentPlayer = gameState.players.find(p => p.username === username);
              if (currentPlayer) {
                setGameState(prev => ({
                  ...prev,
                  votes: { ...prev.votes, [currentPlayer.id]: votes }
                }));
                // Process votes immediately
                setTimeout(() => {
                  handleSubmitVotes(votes);
                }, 100);
              }
            }}
            onBotVote={handleBotVote}
            onStartVoting={() => {
              console.log('Voting started by host');
              // Voting starts automatically in VotingScreen component
            }}
          />
        );
      case 'voteResults':
        return (
          <VoteResultsScreen
            gameState={gameState}
            currentUsername={username}
            onFinishGame={() => setCurrentScreen('results')}
            onContinueRandomize={handleContinueRandomize}
            onFinishRandomize={handleFinishRandomize}
            language="en"
          />
        );
      case 'results':
        return (
          <ResultsScreen
            gameState={gameState}
            onPlayAgain={handlePlayAgain}
            onBackToHome={handleBackToHome}
            language="en"
          />
        );
      default:
        return <EnteringScreen onEnter={handleEnter} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {renderScreen()}
    </div>
  );
}

export default App;