import { GameState, Language } from '../types';
import { User, Skull, RefreshCw } from 'lucide-react';
import { canRandomizeContinue } from '../utils/randomizeGameLogic';

interface VoteResultsScreenProps {
  gameState: GameState;
  currentUsername: string;
  onFinishGame: () => void;
  onContinueRandomize: () => void;
  onFinishRandomize: () => void;
  language: Language;
}

export default function VoteResultsScreen({
  gameState,
  currentUsername,
  onFinishGame,
  onContinueRandomize,
  onFinishRandomize,
  language
}: VoteResultsScreenProps) {
  const { players, votes, eliminatedPlayers, isRandomizeMode } = gameState;

  const currentPlayer = players.find(p => p.username === currentUsername);
  const hostPlayer = players.find(p => p.id === gameState.hostId);
  const isHost = currentPlayer
    ? currentPlayer.id === gameState.hostId || currentPlayer.isHost
    : currentUsername === hostPlayer?.username;
  const canContinueRandomize = isRandomizeMode ? canRandomizeContinue(gameState, players) : false;
  const randomizeEliminationLimitReached = isRandomizeMode ? gameState.eliminatedPlayers.length >= 4 : false;

  const texts = {
    en: {
      voteResults: 'Vote Results',
      eliminated: 'Eliminated',
      tieBreaker: 'Tie-Breaker!',
      waitingForHost: 'Waiting for host...',
      continueGame: 'Continue Game',
      eliminationLimitReached: 'All rounds completed',
      notEnoughPlayers: 'Cannot continue, not enough players',
      finishGame: 'Finish Game',
      waitingForHostToDecide: 'Waiting for host to decide...',
      whoVotedForWhom: 'Vote Results',
      revealWinners: 'Reveal the Winners'
    },
    ru: {
      voteResults: 'Результаты Голосования',
      eliminated: 'Исключен',
      tieBreaker: 'Тай-брейк!',
      waitingForHost: 'Ожидание хоста...',
      continueGame: 'Продолжить Игру',
      eliminationLimitReached: 'Все раунды завершены',
      notEnoughPlayers: 'Продолжение невозможно — недостаточно игроков',
      finishGame: 'Закончить Игру',
      waitingForHostToDecide: 'Ожидание решения хоста...',
      whoVotedForWhom: 'Результаты Голосования',
      revealWinners: 'Показать победителей'
    },
    ka: {
      voteResults: 'ხმის მიცემის შედეგები',
      eliminated: 'გამოეთიშა',
      tieBreaker: 'დამატებითი რაუნდი!',
      waitingForHost: 'ელოდება მასპინძელს...',
      continueGame: 'თამაშის გაგრძელება',
      eliminationLimitReached: 'ყველა რაუნდი დასრულდა',
      notEnoughPlayers: 'გაგრძელება შეუძლებელია — საკმარისი მოთამაშე არ არის',
      finishGame: 'თამაშის დასრულება',
      waitingForHostToDecide: 'ელოდება მასპინძლის გადაწყვეტილებას...',
      whoVotedForWhom: 'ხმის მიცემის შედეგები',
      revealWinners: 'გამარჯვებულების ჩვენება'
    }
  };

  const t = texts[language];

  const getPlayerById = (id: string) => players.find(p => p.id === id);

  const normalizeVoteMap = (voteMap?: Record<string, string[]>) => {
    if (!voteMap) return 'null';
    const normalized = Object.entries(voteMap).map(([voterId, targets]) => [
      voterId,
      [...targets].sort()
    ] as [string, string[]]);
    normalized.sort((a, b) => a[0].localeCompare(b[0]));
    return JSON.stringify(normalized);
  };

  const areVoteMapsEqual = (
    a?: Record<string, string[]>,
    b?: Record<string, string[]>
  ) => normalizeVoteMap(a) === normalizeVoteMap(b);

  const buildVoteCounts = (voteMap: Record<string, string[]>) => {
    const counts: Record<string, number> = {};
    Object.values(voteMap).forEach(targets => {
      targets.forEach(targetId => {
        counts[targetId] = (counts[targetId] || 0) + 1;
      });
    });
    return counts;
  };

  const sortVoteCounts = (counts: Record<string, number>) =>
    Object.entries(counts).sort(([, a], [, b]) => b - a);

  const isWordsRandomize = isRandomizeMode && gameState.gameMode === 'words';

  const hasOriginalVotes = Boolean(gameState.originalVotes && Object.keys(gameState.originalVotes).length > 0);

  const mainVotesSource = (() => {
    if (isWordsRandomize) {
      return hasOriginalVotes
        ? (gameState.originalVotes as Record<string, string[]>)
        : votes;
    }
    return hasOriginalVotes
      ? (gameState.originalVotes as Record<string, string[]>)
      : votes;
  })();

  const mainVoteCounts = buildVoteCounts(mainVotesSource);
  const sortedMainVotes = sortVoteCounts(mainVoteCounts);

  const rawTieBreakerRounds = gameState.tieBreakerVotes || [];

  const tieBreakerRounds = rawTieBreakerRounds.filter((round, index) => {
    if (!round) return false;
    if (isWordsRandomize && areVoteMapsEqual(round, mainVotesSource)) {
      return false;
    }
    if (index > 0) {
      const previous = rawTieBreakerRounds[index - 1];
      if (areVoteMapsEqual(round, previous)) {
        return false;
      }
    }
    return true;
  });
  
  console.log('VoteResultsScreen - Game state:', {
    originalVotes: gameState.originalVotes,
    tieBreakerVotes: gameState.tieBreakerVotes,
    tieBreakerRounds: tieBreakerRounds,
    eliminatedPlayers: gameState.eliminatedPlayers
  });
  
  // Get all eliminated players
  // Exclude host spectators (in custom packs) but include player spectators (in randomize mode when eliminated)
  const playerById = new Map(players.map(player => [player.id, player]));
  const previousEliminatedSet = new Set(gameState.previousEliminatedPlayers || []);

  const orderedEliminatedPlayers = gameState.eliminatedPlayers
    .map(id => playerById.get(id))
    .filter((player): player is typeof players[number] => {
      if (!player) {
        return false;
      }
      const isHostSpectator = gameState.selectedPackType === 'custom' && player.role === 'spectator' && player.isHost;
      return !isHostSpectator;
    });

  const eliminatedThisRoundIds = gameState.eliminatedPlayers.filter(id => !previousEliminatedSet.has(id));
  const eliminatedThisRoundSet = new Set(eliminatedThisRoundIds);
  const eliminatedThisRound = eliminatedThisRoundIds
    .map(id => playerById.get(id))
    .filter((player): player is typeof players[number] => Boolean(player));

  const combinedEliminatedPlayers = [
    ...eliminatedThisRound,
    ...orderedEliminatedPlayers.filter(player => !eliminatedThisRoundSet.has(player.id))
  ];

  const seenEliminatedIds = new Set<string>();
  const allEliminatedPlayers = combinedEliminatedPlayers.filter(player => {
    if (seenEliminatedIds.has(player.id)) {
      return false;
    }
    seenEliminatedIds.add(player.id);
    return true;
  });

  const isStandardQuestionsMode = gameState.gameMode === 'questions' && !isRandomizeMode;
  const eliminatedInOriginalSet = isStandardQuestionsMode
    ? new Set(gameState.eliminatedPlayers)
    : new Set(
        gameState.originalVotes
          ? (gameState.previousEliminatedPlayers || [])
          : eliminatedPlayers
      );

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: '#101721' }}>
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 max-w-md mx-auto">
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg" style={{ backgroundColor: '#3B82F6', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)' }}>
              <span className="text-2xl">🗳️</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 leading-tight text-white">
            {t.voteResults}
          </h1>
        </div>

        {/* Eliminated Players Display */}
        {allEliminatedPlayers.length > 0 && (
          <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <h3 className="text-xl font-bold text-white mb-4 text-center">
              {t.eliminated} ({allEliminatedPlayers.length})
            </h3>
            <div className="space-y-3">
              {allEliminatedPlayers.map((player, index) => {
                const isEliminatedThisRound = eliminatedThisRound.some(p => p.id === player.id);
                
                return (
                  <div key={`eliminated-${player.id}-${index}`} className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all ${
                    isEliminatedThisRound 
                      ? 'bg-red-500/30 border-red-400/60 animate-pulse shadow-lg' 
                      : 'bg-red-500/20 border-red-500/40'
                  }`}>
                    {/* Elimination Order Number */}
                    <div className="w-8 h-8 rounded-full bg-red-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>
                    
                    {/* Player Avatar with Skull Overlay */}
                    <div className="relative flex-shrink-0">
                      {player.avatar && player.avatar.startsWith('data:') ? (
                        <img src={player.avatar} alt={player.username} className="w-12 h-12 rounded-full object-cover opacity-70" />
                      ) : (
                        <div className={`w-12 h-12 ${player.avatar || 'bg-gray-500'} rounded-full flex items-center justify-center opacity-70`}>
                          <User className="w-7 h-7 text-white" />
                        </div>
                      )}
                      {/* Skull overlay on profile picture */}
                      <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                        <Skull className="w-6 h-6 text-red-400" />
                      </div>
                    </div>
                    
                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-red-200 text-lg truncate line-through">
                        {player.username}
                      </div>
                      {isEliminatedThisRound && (
                        <div className="text-xs text-red-300 font-medium">
                          Just eliminated
                        </div>
                      )}
                    </div>
                    
                    {/* Elimination Status */}
                    <div className="text-xs text-red-300 bg-red-500/30 px-2 py-1 rounded-full flex-shrink-0">
                      Eliminated
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VOTE BREAKDOWN - Original Round (All modes) */}
        {sortedMainVotes.length > 0 && (
          <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
            <h3 className="text-xl font-bold text-white mb-6 text-center">{gameState.tieBreakerVotes && gameState.tieBreakerVotes.length > 0 ? 'Original Vote' : t.whoVotedForWhom}</h3>
            <div className="space-y-3">
              {sortedMainVotes.map(([playerId, count], index) => {
                const player = getPlayerById(playerId);
                if (!player) return null;
                const isEliminatedInOriginal = eliminatedInOriginalSet.has(playerId);
                return (
                  <div key={`main-vote-${playerId}-${index}`} className={`p-4 rounded-xl border-2 ${
                    isEliminatedInOriginal 
                      ? 'bg-red-500/20 border-red-500/50' 
                      : 'bg-gray-700/50 border-gray-600/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-gray-600 text-white">
                          {index + 1}
                        </div>
                        {player.avatar && player.avatar.startsWith('data:') ? (
                          <img src={player.avatar} alt={player.username} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className={`w-10 h-10 ${player.avatar || 'bg-gray-500'} rounded-full flex items-center justify-center`}>
                            <User className="w-6 h-6 text-white" />
                          </div>
                        )}
                        <span className={`font-bold text-white ${isEliminatedInOriginal ? 'line-through' : ''}`}>{player.username}</span>
                        {isEliminatedInOriginal && (
                          <span className="text-xs bg-red-500/30 text-red-300 px-2 py-1 rounded-full">
                            Eliminated
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{count}</div>
                        <div className="text-xs text-gray-400">vote{count > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VOTE BREAKDOWN - Tie-Breaker Rounds (All modes) */}
        {tieBreakerRounds.map((roundVotes, roundIndex) => {
          console.log(`Tie-breaker round ${roundIndex + 1} votes:`, roundVotes);
          
          // For tie-breaker rounds, only count votes for tied players
          const roundVoteCounts = Object.values(roundVotes).flat().reduce((acc, playerId) => {
            acc[playerId] = (acc[playerId] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          console.log(`Tie-breaker round ${roundIndex + 1} vote counts:`, roundVoteCounts);
          
          // Sort by vote count (highest first)
          const sortedRoundVotes = Object.entries(roundVoteCounts).sort(([, a], [, b]) => b - a);

          return (
            <div key={roundIndex} className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ 
              backgroundColor: 'rgba(16, 185, 129, 0.1)', 
              borderColor: 'rgba(16, 185, 129, 0.5)'
            }}>
              <h3 className="text-xl font-bold text-white mb-6 text-center">Tie-Breaker Round {roundIndex + 1}</h3>
              <div className="space-y-4">
                {sortedRoundVotes.map(([playerId, count], voteIndex) => {
                  const player = getPlayerById(playerId);
                  if (!player) return null;
                  const isEliminated = eliminatedPlayers.includes(playerId);
                  return (
                    <div key={`tiebreaker-${roundIndex}-${playerId}-${voteIndex}`} className={`p-4 rounded-xl border-2 ${
                      isEliminated 
                        ? 'bg-red-500/20 border-red-500/50' 
                        : 'bg-gray-700/50 border-gray-600/50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-gray-600 text-white">
                            {voteIndex + 1}
                          </div>
                          {player.avatar && player.avatar.startsWith('data:') ? (
                            <img src={player.avatar} alt={player.username} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className={`w-10 h-10 ${player.avatar || 'bg-gray-500'} rounded-full flex items-center justify-center`}>
                              <User className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <span className={`font-bold text-white ${isEliminated ? 'line-through' : ''}`}>{player.username}</span>
                           {isEliminated && (
                            <span className="text-xs bg-red-500/30 text-red-300 px-2 py-1 rounded-full">
                              Eliminated
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">{count}</div>
                          <div className="text-xs text-gray-400">vote{count > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="space-y-4">
          {isHost ? (
            isRandomizeMode ? (
              <div className="grid grid-cols-2 gap-4">
                {canContinueRandomize ? (
                  <button
                    onClick={onContinueRandomize}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-2xl shadow-lg hover:scale-105 transition-transform flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>{t.continueGame}</span>
                  </button>
                ) : randomizeEliminationLimitReached ? (
                  <div className="bg-gray-700/50 rounded-2xl flex items-center justify-center text-center p-4">
                    <p className="text-gray-400 text-sm font-medium">{t.eliminationLimitReached}</p>
                  </div>
                ) : (
                  <div className="bg-gray-700/50 rounded-2xl flex items-center justify-center text-center p-4">
                    <p className="text-gray-400 text-sm font-medium">{t.notEnoughPlayers}</p>
                  </div>
                )}
                <button
                  onClick={onFinishRandomize}
                  className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:scale-105 transition-transform flex items-center justify-center space-x-2"
                >
                  <Skull className="w-5 h-5" />
                  <span>{t.finishGame}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onFinishGame}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-2xl shadow-lg hover:scale-105 transition-transform"
              >
                {t.revealWinners}
              </button>
            )
          ) : (
            <div className="text-center text-gray-300 p-4 bg-white/5 rounded-2xl">
              {isRandomizeMode ? t.waitingForHostToDecide : t.waitingForHost}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
