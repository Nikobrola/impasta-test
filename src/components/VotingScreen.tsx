import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState } from '../types';
import { generateBotVotes } from '../utils/botUtils';
import { generateWordsGameBotVotes } from '../utils/wordsGameLogic';
import { User, Vote, Clock, MessageCircle, Play } from 'lucide-react';

interface VotingScreenProps {
  gameState: GameState;
  currentUsername: string;
  onVote: (votes: string[]) => void;
  onBotVote: (botId: string, votes: string[]) => void;
  onStartVoting?: () => void;
}

export default function VotingScreen({
  gameState,
  currentUsername,
  onVote, 
  onBotVote,
  onStartVoting
}: VotingScreenProps) {
  const [selectedVotes, setSelectedVotes] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discussionTimeLeft, setDiscussionTimeLeft] = useState(60);
  const [votingStarted, setVotingStarted] = useState(gameState.phase === 'voting');

  // Memoize current player to prevent unnecessary recalculations
  const currentPlayer = useMemo(() => 
    gameState.players.find(p => p.username === currentUsername), 
    [gameState.players, currentUsername]
  );
  
  const currentPlayerId = currentPlayer?.id;

  // Memoize host status
  const isHost = useMemo(() => {
    const hostPlayer = gameState.players.find(p => p.isHost);
    return hostPlayer?.username === currentUsername;
  }, [gameState.players, currentUsername]);

  // Memoize eligible players to prevent recalculation on every render
  const eligiblePlayers = useMemo(() => {
    if (gameState.isTieVote && gameState.tiedPlayers) {
      // In tie-breaker, only vote for tied players (exclude yourself and spectators for custom packs)
      return gameState.players.filter(p => 
        gameState.tiedPlayers!.includes(p.id) && 
        !gameState.eliminatedPlayers.includes(p.id) &&
        p.id !== currentPlayerId &&
        (gameState.selectedPackType !== 'custom' || p.role !== 'spectator')
      );
    } else {
      // In normal voting, can vote for anyone except yourself
      return gameState.players.filter(p => 
        !gameState.eliminatedPlayers.includes(p.id) &&
        (gameState.selectedPackType !== 'custom' || p.role !== 'spectator')
      );
    }
  }, [gameState.players, gameState.isTieVote, gameState.tiedPlayers, gameState.eliminatedPlayers, currentPlayerId, gameState.selectedPackType]);

  // ADDED: Reset state on new tie-breaker round
useEffect(() => {
  if (gameState.isTieVote) {
    setSelectedVotes([]);
    setSubmitted(false);
  }
}, [gameState.isTieVote, gameState.tiedPlayers]);

  // For words game, use standard mode logic (no randomize, but tie votes are allowed)
  const votesNeeded = (gameState.isRandomizeMode || gameState.isTieVote) 
    ? 1 
    : (gameState.impostorCount - gameState.eliminatedPlayers.length);

  const isVotingActive = useMemo(() => (
    gameState.isRandomizeMode ||
    gameState.isTieVote ||
    gameState.phase === 'voting' ||
    votingStarted
  ), [gameState.isRandomizeMode, gameState.isTieVote, gameState.phase, votingStarted]);

  // Memoize votable players for rendering
  const votablePlayers = useMemo(() => {
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    if (gameState.isTieVote && gameState.tiedPlayers.length > 0) {
      return activePlayers.filter(p => gameState.tiedPlayers.includes(p.id));
    }
    return activePlayers;
  }, [gameState.players, gameState.isTieVote, gameState.tiedPlayers]);

  // Reset state when switching between normal and tie-breaker voting
  useEffect(() => {
    setSelectedVotes([]);
    setSubmitted(false);
    setError(null);
    
    // For tie-breaker or randomize mode, start voting immediately
    if (gameState.isRandomizeMode || gameState.isTieVote || gameState.phase === 'voting') {
      setVotingStarted(true);
      setDiscussionTimeLeft(0);
    } else {
      setVotingStarted(false);
      setDiscussionTimeLeft(60);
    }
  }, [gameState.isRandomizeMode, gameState.isTieVote, gameState.phase]);

  // Stable timer callback to prevent recreation
  const handleStartVoting = useCallback(() => {
    setVotingStarted(true);
    onStartVoting?.();
  }, [onStartVoting]);

  // Discussion timer - single effect with proper cleanup
  useEffect(() => {
    if (votingStarted || discussionTimeLeft <= 0 || gameState.isRandomizeMode || gameState.isTieVote) return;

    const timer = setInterval(() => {
      setDiscussionTimeLeft(prev => {
        if (prev <= 1) {
          handleStartVoting();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [votingStarted, handleStartVoting, gameState.isRandomizeMode, gameState.isTieVote, discussionTimeLeft]);

  // Bot voting - INSTANT VOTING
  useEffect(() => {
    // Only run if voting has started
    if (!votingStarted) return;

    // Determine which players are eligible to cast a vote.
    const eligibleVoters = gameState.players.filter(p => !p.isEliminated);
    
    // Find ALL bots that need to vote (not just ones that haven't voted yet)
    const allBots = eligibleVoters.filter(player =>
      (player.isBot || player.username.startsWith('Bot_'))
    );
    
    console.log('VotingScreen INSTANT bot voting:', {
      eligibleVoters: eligibleVoters.length,
      allBots: allBots.length,
      botIds: allBots.map(b => ({ id: b.id, username: b.username, isBot: b.isBot })),
      currentVotes: Object.keys(gameState.votes),
      votesNeeded
    });
    
    if (allBots.length === 0) return;

    // Generate and submit votes for ALL bots INSTANTLY
    allBots.forEach((bot) => {
      // Skip if bot already voted
      if (gameState.votes[bot.id]) {
        console.log(`VotingScreen: Bot ${bot.username} already voted, skipping`);
        return;
      }

      // The list of players a bot can vote FOR - filter based on tie-breaker status
      let targetablePlayers = gameState.players.filter(p => !p.isEliminated);
      
      // If in tie-breaker mode, only allow voting for tied players
      if (gameState.isTieVote && gameState.tiedPlayers && gameState.tiedPlayers.length > 0) {
        targetablePlayers = targetablePlayers.filter(p => gameState.tiedPlayers!.includes(p.id));
        console.log('Tie-breaker mode: Bots can only vote for tied players:', targetablePlayers.map(p => p.username));
      }

      // Use words game bot voting for words game mode
      const botVotes = gameState.gameMode === 'words' 
        ? generateWordsGameBotVotes(
            bot.id,
            targetablePlayers,
            votesNeeded,
            bot.personality || 'random',
            gameState.isTieVote ? gameState.tiedPlayers : undefined,
            gameState
          )
        : generateBotVotes(
            bot.id,
            targetablePlayers,
            votesNeeded,
            bot.personality || 'random',
            gameState.isTieVote ? gameState.tiedPlayers : undefined,
            { eliminatedPlayers: gameState.eliminatedPlayers }
          );

      console.log(`VotingScreen: Bot ${bot.username} (${bot.id}) generated votes:`, botVotes);
      console.log(`Available targets for bot:`, targetablePlayers.map(p => p.username));

      // If no votes were generated (empty array), force the bot to vote for someone
      let finalVotes = botVotes;
      if (botVotes.length === 0 && targetablePlayers.length > 0) {
        finalVotes = [targetablePlayers[0].id]; // Force vote for the first eligible player
        console.log(`VotingScreen: Bot ${bot.username} had no votes, forcing vote for:`, finalVotes);
      }

      console.log(`VotingScreen: INSTANTLY calling onBotVote for ${bot.username} with votes:`, finalVotes);
      onBotVote(bot.id, finalVotes);
    });

  }, [
    votingStarted, 
    gameState.isTieVote, 
    gameState.players, 
    onBotVote, 
    votesNeeded, 
    gameState.tiedPlayers,
    gameState.gameMode
  ]);

  // BACKUP: Force all bots to vote after a short delay to ensure no bots are left behind
  useEffect(() => {
    if (!votingStarted) return;

    const forceBotVotingTimeout = setTimeout(() => {
      const eligibleVoters = gameState.players.filter(p => !p.isEliminated);
      const botsThatStillNeedToVote = eligibleVoters.filter(player =>
        (player.isBot || player.username.startsWith('Bot_')) &&
        !gameState.votes[player.id]
      );

      if (botsThatStillNeedToVote.length > 0) {
        console.log('FORCE VOTING: Some bots still need to vote, forcing them now:', botsThatStillNeedToVote.map(b => b.username));
        
        botsThatStillNeedToVote.forEach((bot) => {
          const targetablePlayers = gameState.players.filter(p => !p.isEliminated);
          const botVotes = gameState.gameMode === 'words' 
            ? generateWordsGameBotVotes(
                bot.id,
                targetablePlayers,
                votesNeeded,
                bot.personality || 'random',
                gameState.isTieVote ? gameState.tiedPlayers : undefined,
                gameState
              )
            : generateBotVotes(
                bot.id,
                targetablePlayers,
                votesNeeded,
                bot.personality || 'random',
                gameState.isTieVote ? gameState.tiedPlayers : undefined,
                { eliminatedPlayers: gameState.eliminatedPlayers }
              );

          let finalVotes = botVotes;
          if (botVotes.length === 0 && targetablePlayers.length > 0) {
            finalVotes = [targetablePlayers[0].id];
          }

          console.log(`FORCE VOTING: Bot ${bot.username} forced to vote:`, finalVotes);
          onBotVote(bot.id, finalVotes);
        });
      }
    }, 1000); // Force after 1 second

    return () => clearTimeout(forceBotVotingTimeout);
  }, [votingStarted, gameState, onBotVote, votesNeeded, discussionTimeLeft]);

  // AUTO-PROCESS: Check if all players have voted and auto-process if so
  useEffect(() => {
    if (!votingStarted) return;

    const eligibleVoters = gameState.players.filter(p => !p.isEliminated);
    const nonSpectatorPlayers = eligibleVoters.filter(p => 
      gameState.selectedPackType !== 'custom' || p.role !== 'spectator'
    );
    const playersWhoVoted = Object.keys(gameState.votes);
    const playersWhoHaventVoted = nonSpectatorPlayers.filter(p => !playersWhoVoted.includes(p.id));

    console.log('VotingScreen AUTO-PROCESS check:', {
      eligibleVoters: eligibleVoters.length,
      nonSpectatorPlayers: nonSpectatorPlayers.length,
      playersWhoVoted: playersWhoVoted.length,
      playersWhoHaventVoted: playersWhoHaventVoted.length,
      allVotes: Object.keys(gameState.votes)
    });

    // If all players have voted, auto-process the votes
    if (playersWhoHaventVoted.length === 0 && nonSpectatorPlayers.length > 0) {
      console.log('VotingScreen AUTO-PROCESS: All players have voted, auto-processing...');

      const expectedSelectionCount = (() => {
        if (gameState.gameMode === 'words') {
          return gameState.isTieVote ? 1 : votesNeeded;
        }
        if (gameState.isRandomizeMode || gameState.isTieVote) {
          return 1;
        }
        return votesNeeded;
      })();

      const hasValidSelection = selectedVotes.length === expectedSelectionCount && expectedSelectionCount > 0;

      if (!submitted) {
        if (!hasValidSelection) {
          console.log('VotingScreen AUTO-PROCESS: Skipping auto-submit because selection is incomplete.', {
            expectedSelectionCount,
            selectedVotes
          });
          return;
        }

        setSubmitted(true);
        console.log('VotingScreen AUTO-PROCESS: Calling onVote with selectedVotes:', selectedVotes);
        onVote(selectedVotes); // Use the user's actual selected votes
      }
    }
  }, [votingStarted, gameState.players, gameState.votes, gameState.selectedPackType, submitted, onVote, selectedVotes, gameState.gameMode, gameState.isTieVote, gameState.isRandomizeMode, votesNeeded]);

  // Stable vote toggle handler
  const handleVoteToggle = useCallback((playerId: string) => {
    if (submitted || !votingStarted) return;
    
    // Prevent spectators from voting in custom packs
    const currentPlayer = gameState.players.find(p => p.username === currentUsername);
    if (gameState.selectedPackType === 'custom' && currentPlayer?.role === 'spectator') return;

    setError(null);
    setSelectedVotes(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        // For words game, use standard mode logic (multiple votes allowed unless tie vote)
        if (gameState.gameMode === 'words') {
          if (gameState.isTieVote) {
            return [playerId]; // Only allow one selection in tie votes
          }
          return prev.length < votesNeeded ? [...prev, playerId] : prev;
        }
        if (gameState.isRandomizeMode || gameState.isTieVote) {
          return [playerId]; // Only allow one selection
        }
        return prev.length < votesNeeded ? [...prev, playerId] : prev;
      }
    });
  }, [submitted, votingStarted, votesNeeded, gameState.isRandomizeMode, gameState.isTieVote, gameState.players, currentUsername, gameState.selectedPackType, gameState.gameMode]);

  // Stable submit handler
  const handleSubmit = useCallback(() => {
    console.log('VotingScreen handleSubmit called:', {
      submitted,
      votingStarted,
      selectedVotes,
      votesNeeded,
      gameMode: gameState.gameMode,
      isTieVote: gameState.isTieVote
    });

    if (submitted || !votingStarted) {
      console.log('VotingScreen handleSubmit: Early return - submitted:', submitted, 'votingStarted:', votingStarted);
      return;
    }

    // For words game, use standard mode logic (multiple votes required unless tie vote)
    if (gameState.gameMode === 'words') {
      if (gameState.isTieVote) {
        if (selectedVotes.length !== 1) {
          setError('You must vote for exactly one player.');
          return;
        }
      } else {
        if (selectedVotes.length !== votesNeeded) {
          setError(`Please select exactly ${votesNeeded} player${votesNeeded > 1 ? 's' : ''} to vote for.`);
          return;
        }
      }
    } else if (gameState.isRandomizeMode || gameState.isTieVote) {
      if (selectedVotes.length !== 1) {
        setError('You must vote for exactly one player.');
        return;
      }
    } else {
      if (selectedVotes.length !== votesNeeded) {
        setError(`Please select exactly ${votesNeeded} player${votesNeeded > 1 ? 's' : ''} to vote for.`);
        return;
      }
    }

    // Prevent spectators from submitting votes in custom packs
    const currentPlayer = gameState.players.find(p => p.username === currentUsername);
    if (gameState.selectedPackType === 'custom' && currentPlayer?.role === 'spectator') {
      console.log('VotingScreen handleSubmit: Spectator cannot vote');
      return;
    }

    console.log('VotingScreen handleSubmit: Calling onVote with selectedVotes:', selectedVotes);
    setSubmitted(true);
    setError(null);
    onVote(selectedVotes);
  }, [submitted, votingStarted, selectedVotes, votesNeeded, onVote, gameState.gameMode, gameState.isTieVote, gameState.selectedPackType, currentUsername, gameState.players, gameState.isRandomizeMode]);


  // Check if current user is spectator
  const isSpectator = currentPlayer?.role === 'spectator';

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: '#101721' }}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative z-10 max-w-md mx-auto">
        {/* Header Section */}
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg" style={{ backgroundColor: '#3B82F6', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)' }}>
              <span className="text-2xl">{votingStarted ? '🗳️' : '💬'}</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 leading-tight" style={{ color: '#FFFFFF' }}>
            Find the World's most
            <span className="block" style={{ color: '#3B82F6' }}>
              {gameState.isTieVote 
                ? 'Amazing Tie-Breaker'
                : (votingStarted ? 'Amazing Vote' : 'Amazing Discussion')
              }
            </span>
          </h1>
          
          <p className="text-lg mb-6" style={{ color: '#D1D5DB' }}>
          {gameState.isTieVote 
            ? 'Vote for 1 player to eliminate from the tied players'
            : `Vote for ${votesNeeded} player${votesNeeded > 1 ? 's' : ''}`
          }
          </p>
          
          {/* Tie-Breaker Indicator */}
          {gameState.isTieVote && (
            <div className="backdrop-blur-sm rounded-2xl p-4 mb-6 border shadow-2xl" style={{ 
              backgroundColor: 'rgba(16, 185, 129, 0.1)', 
              borderColor: 'rgba(16, 185, 129, 0.5)'
            }}>
              <div className="flex items-center justify-center text-white">
                <span className="text-lg font-semibold">
                  🎯 TIE-BREAKER ROUND
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Main Question/Word */}
        <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <div className="w-16 h-16 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">❓</span>
              </div>
            </div>
            <h2 className="text-5xl font-extrabold text-white tracking-tight">
              {gameState.isTieVote ? "Tie Breaker!" : "Voting Time"}
            </h2>
            <p className="mt-4 text-xl text-gray-400">
              {gameState.isTieVote
                ? "It's a tie! Vote again between these players."
                : (gameState.isRandomizeMode 
                    ? "Vote for an impostor."
                    : `Select ${votesNeeded} player${votesNeeded > 1 ? 's' : ''} to vote for.`)}
            </p>
            {!submitted && (
              <p className="text-2xl font-mono mt-4 text-white">
                {selectedVotes.length}/{votesNeeded}
              </p>
            )}
          </div>
            </div>

        {/* Discussion Timer or Voting Progress - Only show for questions game */}
        {gameState.gameMode === 'questions' && (
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 shadow-lg border border-gray-600/50 mb-6">
            <div className="text-center">
              {!votingStarted && !gameState.isTieVote ? (
                <div className="flex items-center justify-center space-x-3">
                  <Clock className="w-6 h-6 text-blue-400" />
                  <p className="text-white text-lg font-semibold">
                    Discussion Time: {discussionTimeLeft}s
                  </p>
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
            ) : (() => {
              if (gameState.selectedPackType === 'custom' && isSpectator) {
                return (
                  <div className="flex items-center justify-center space-x-3">
                    <User className="w-6 h-6 text-gray-400" />
                    <p className="text-gray-300 text-lg font-semibold">
                      You are spectating - Watch the voting unfold!
                    </p>
                    <User className="w-6 h-6 text-gray-400" />
            </div>
                );
              }
              return (
                <p className="text-white text-lg font-semibold">
                  {gameState.isRandomizeMode
                    ? `Vote for an impostor (${selectedVotes.length}/${votesNeeded})`
                    : gameState.isTieVote 
                    ? `Select 1 player to eliminate (${selectedVotes.length}/1)`
                    : `Select ${votesNeeded} impostor${votesNeeded > 1 ? 's' : ''} (${selectedVotes.length}/${votesNeeded})`
                  }
                </p>
              );
            })()}
          </div>
        </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
            <p className="text-red-200 text-center font-medium">{error}</p>
          </div>
        )}

        {/* Answers Display / Voting Section */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-gray-600/50 mb-6">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            {votingStarted ? 'Tap Answer Cards to Vote' : 'Review All Answers'}
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {votablePlayers.map((player) => {
              const isSelected = selectedVotes.includes(player.id);
              const isEligible = eligiblePlayers.some(p => p.id === player.id);
              
            return (
            <div
              key={player.id}
                  className={`relative ${gameState.gameMode === 'words' ? 'p-6 min-h-[160px]' : 'p-4 min-h-[200px]'} rounded-xl border-2 transition-all transform duration-300 flex flex-col justify-center items-center ${
                    votingStarted 
                      ? (isSelected
                        ? 'bg-red-500/20 border-red-500/50 shadow-lg shadow-red-500/20'
                        : isEligible && player.id !== currentPlayerId
                        ? 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-600/50 hover:scale-105 cursor-pointer'
                        : 'bg-gray-800/30 border-gray-700/50 opacity-50')
                      : 'bg-gray-700/50 border-gray-600/50'
                  } ${votingStarted && submitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={votingStarted && isEligible && player.id !== currentPlayerId && !submitted && !isSpectator ? () => handleVoteToggle(player.id) : undefined}
                >
                  {/* Avatar */}
                  <div className={`relative ${gameState.gameMode === 'words' ? 'mb-2' : 'mb-3'}`}>
                {player.avatar && player.avatar.startsWith('data:') ? (
                      <div className={`${gameState.gameMode === 'words' ? 'w-16 h-16' : 'w-12 h-12'} rounded-full overflow-hidden flex items-center justify-center`}>
                  <img
                    src={player.avatar}
                          alt={`${player.username}'s avatar`}
                    className="w-full h-full object-cover"
                  />
                      </div>
                ) : player.avatar ? (
                      <div className={`${gameState.gameMode === 'words' ? 'w-16 h-16' : 'w-12 h-12'} ${player.avatar} rounded-full flex items-center justify-center`}>
                    <User className={`${gameState.gameMode === 'words' ? 'w-8 h-8' : 'w-6 h-6'} text-white`} />
                  </div>
                ) : (
                      <div className={`${gameState.gameMode === 'words' ? 'w-16 h-16' : 'w-12 h-12'} bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center`}>
                    <User className={`${gameState.gameMode === 'words' ? 'w-8 h-8' : 'w-6 h-6'} text-white`} />
                      </div>
                    )}
                    {player.isHost && (
                      <div className={`absolute -top-1 -right-1 ${gameState.gameMode === 'words' ? 'w-6 h-6' : 'w-6 h-6'} bg-yellow-400 rounded-full flex items-center justify-center`}>
                        <span className={`${gameState.gameMode === 'words' ? 'text-xs' : 'text-xs'}`}>👑</span>
                      </div>
                    )}
                    {isSelected && (
                      <div className={`absolute -top-1 -right-1 ${gameState.gameMode === 'words' ? 'w-7 h-7' : 'w-7 h-7'} bg-red-500 rounded-full flex items-center justify-center`}>
                        <span className={`text-white ${gameState.gameMode === 'words' ? 'text-sm' : 'text-sm'} font-bold`}>✓</span>
                  </div>
                )}
              </div>

                  {/* Name */}
                  <div className="text-center mb-2">
                    <h3 className="text-lg font-bold text-white truncate">
                      {player.username}
                      {player.id === currentPlayerId && ' (You)'}
                    </h3>
                  </div>
                  
                  {/* Answer Display - Only show for questions game */}
                  {gameState.gameMode === 'questions' && (
                    <div className="flex-grow flex flex-col justify-center">
                      <div className="text-xs text-gray-200 bg-black/20 rounded-2xl p-1.5 break-words leading-tight flex-grow flex items-center justify-center text-center overflow-hidden">
                        <span className="block max-w-full">
                          {gameState.playerAnswers[player.id] || 'No answer'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {votingStarted && !isEligible && (
                    <div className="mt-2 text-center">
                      <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
                        Not available
                      </span>
                </div>
              )}
              {votingStarted && player.id === currentPlayerId && (
                <div className="mt-2 text-center">
                  <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
                    You cannot vote for yourself
                  </span>
                </div>
              )}
            </div>
            );
          })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {!isVotingActive && !gameState.isTieVote && !gameState.isRandomizeMode ? (
            <div className="space-y-4">
              {isHost ? (
                <button
                  onClick={handleStartVoting}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3 font-semibold text-lg"
                >
                  <Play className="w-6 h-6" />
                  <span>Start Voting</span>
                </button>
              ) : (
                <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4">
                  <div className="flex items-center justify-center text-blue-200">
                    <MessageCircle className="w-6 h-6 mr-3" />
                    <span className="font-semibold">Waiting for host to start voting...</span>
                  </div>
                  <p className="text-blue-200 text-sm mt-2 text-center">
                    Discuss the answers above and decide who to vote for!
                  </p>
                </div>
              )}

              <div className="bg-gray-700/50 border border-gray-600/50 rounded-xl p-4">
                <div className="flex items-center justify-center text-gray-300">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Discussion Phase</span>
                </div>
                <p className="text-gray-400 text-sm mt-2 text-center">
                  Review all answers and discuss who you think are the impostors. 
                  {isHost ? ' Click "Start Voting" when ready.' : ' The host will start voting when ready.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {!isSpectator && (
                // Voting Phase (normal voting or tie-breaker) - only for non-spectators
                <div className="space-y-4">
          <button
            onClick={handleSubmit}
                    disabled={submitted || (gameState.isRandomizeMode || gameState.isTieVote ? selectedVotes.length !== 1 : selectedVotes.length !== votesNeeded)}
                    className={`w-full py-4 rounded-xl shadow-lg transform transition-all duration-300 flex items-center justify-center space-x-3 font-semibold text-lg ${
                      submitted || (gameState.isRandomizeMode || gameState.isTieVote ? selectedVotes.length !== 1 : selectedVotes.length !== votesNeeded)
                        ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-xl hover:scale-105'
                    }`}
                  >
                    <Vote className="w-6 h-6" />
                    <span>
                      {submitted ? 'Vote Submitted!' : 'Submit Vote'}
                    </span>
                  </button>
                  
                  {submitted && (
                    <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
                      <div className="flex items-center justify-center text-green-200">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm">✓</span>
                        </div>
                        <span className="font-semibold">Votes Submitted!</span>
                      </div>
                      <p className="text-green-200 text-sm mt-2 text-center">Waiting for other players...</p>
                    </div>
                  )}
                </div>
              )}
              
              {isSpectator && (
                // Spectator waiting message
                <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-6">
                  <div className="flex items-center justify-center text-blue-200">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <User className="w-5 h-5 text-white" />
            </div>
                    <span className="font-semibold text-lg">Waiting for players to finish voting...</span>
              </div>
                  <p className="text-blue-200 text-sm mt-2 text-center">You are spectating the voting process</p>
            </div>
              )}
            </>
          )}
          </div>
      </div>
    </div>
  );
}