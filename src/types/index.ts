export interface Player {
  id: string;
  username: string;
  avatar?: string;
  isHost: boolean;
  role: PlayerRole;
  isConnected: boolean;
  answer: string;
  hasVoted: boolean;
  hasSubmittedAnswer: boolean;
  hasSeenRole: boolean;
  isEliminated: boolean;
  isBot?: boolean;
  personality?: 'aggressive' | 'cautious' | 'random' | 'helpful';
}

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  gameMode: GameMode;
  impostorCount: number;
  hasJester: boolean;
  isRandomizeMode: boolean;
  customContent: string[];
  selectedPack: string | null;
  isActive: boolean;
}

export interface GameQuestion {
  innocent: string;
  impostor: string;
}

export interface PlayerRoleAssignment {
  playerId: string;
  role: PlayerRole;
  question: string;
}

export interface GameAnswer {
  playerId: string;
  answer: string;
  submitted: boolean;
}

export interface Vote {
  voterId: string;
  targetIds: string[];
}

export interface QuestionPack {
  id: string;
  name: string;
  innocent: string;
  impostor: string;
}

export interface VoteResult {
  eliminatedPlayers: string[];
  voteBreakdown: Record<string, string[]>; // who voted for whom
  isTie: boolean;
  tiedPlayers: string[];
}

export interface GameEndCondition {
  reason: 'jester_win' | 'impostor_win' | 'innocent_win' | 'tie' | 'host_ended';
  winners: Player[];
  eliminatedPlayers: string[];
}

export type Language = 'en' | 'ru' | 'ka';

export type GameMode = 'questions' | 'words';

export type GamePack = 'party' | 'spicy' | 'normal' | 'custom';
export type WordPack = 'celebrities' | 'characters' | 'objects' | 'spicy' | 'custom';

// Type for room codes - 6 digit numeric strings
export type RoomCode = `${number}${number}${number}${number}${number}${number}`;

// Type for player roles
export type PlayerRole = 'innocent' | 'impostor' | 'jester' | 'spectator';

// Type for game phases
export type GamePhase = 'lobby' | 'questions' | 'roleReveal' | 'answerDisplay' | 'discussion' | 'voting' | 'votingResults' | 'voteResults' | 'results';

// Type for winner types
export type WinnerType = 'innocent' | 'impostor' | 'jester' | 'tie';

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentRound: number;
  maxRounds: number;
  impostorCount: number;
  hasJester: boolean;
  isRandomizeMode: boolean;
  hostId: string;
  roomCode: string;
  gameMode: GameMode;
  currentQuestion: string;
  currentImpostorQuestion: string;
  currentWord: string;
  currentImpostorWord: string;
  playerAnswers: Record<string, string>;
  submittedAnswers: Record<string, boolean>; // Track who has submitted answers
  votes: Record<string, string[]>; // Current/final votes
  originalVotes?: Record<string, string[]>; // Store original voting round votes
  tieBreakerVotes?: Record<string, string[]>[]; // Store multiple tie-breaking rounds votes
  currentTieBreakerRound?: number;
  tieBreakerHistory?: Array<{
    round: number;
    votes: Record<string, string[]>;
    tiedPlayers: string[];
  }>;
  eliminatedPlayers: string[];
  previousEliminatedPlayers?: string[];
  winners: Player[];
  winnerType?: WinnerType;
  playerRoles: Record<string, PlayerRole>;
  originalPlayerRoles?: Record<string, PlayerRole>; // Store original roles before eliminations
  continueCount?: number; // Track how many times host has continued the game (max 3 for randomize mode)
  selectedPack: string | null; // Track selected content pack
  startingPlayer?: Player | null; // Track starting player for Word Game
  turnOrder: Player[]; // Track turn order for Word Game
  currentTurnPlayer?: Player | null; // Track current player's turn
  // New properties for Questions Game
  selectedQuestionPack: QuestionPack | null;
  selectedPackType: GamePack | WordPack | null; // Track which pack type was selected
  jesterCluePlayers: string[]; // IDs of players who see jester clue
  isTieVote: boolean;
  tiedPlayers: string[];
  gameEndReason?: 'jester_win' | 'impostor_win' | 'innocent_win' | 'tie' | 'host_ended';
  currentVoteResult?: VoteResult;
  currentScreen?: 'lobby' | 'questions' | 'answers' | 'roleReveal' | 'discussion' | 'voting' | 'voteResults' | 'results';
}