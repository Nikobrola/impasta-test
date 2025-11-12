import React, { useState, useEffect, useMemo } from 'react';
import { GameState } from '../types';
import { Clock, Vote, User, Users } from 'lucide-react';
import { generateBotVotes } from '../utils/botUtils';

interface AnswerDisplayScreenProps {
  gameState: GameState;
  currentUsername: string;
  language: 'en' | 'ru' | 'ka';
  onStartVoting: () => void;
  onVote?: (votes: string[]) => void;
  setGameState?: React.Dispatch<React.SetStateAction<GameState>>;
}

const AnswerDisplayScreen: React.FC<AnswerDisplayScreenProps> = ({
  gameState,
  currentUsername,
  language,
  onStartVoting,
  onVote,
  setGameState
}) => {
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [votingStarted, setVotingStarted] = useState(false);
  const [selectedVotes, setSelectedVotes] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPlayer = gameState.players.find(p => p.username === currentUsername);

  // ADDED: Reset state on new tie-breaker round
  useEffect(() => {
    if (gameState.isTieVote) {
      setVotingStarted(true);
      setSelectedVotes([]);
      setSubmitted(false);
      setError(null);
    }
  }, [gameState.isTieVote, gameState.tiedPlayers]);
  
  // Timer countdown
  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft]);


  // Calculate votes needed
  const votesNeeded = gameState.isRandomizeMode || gameState.isTieVote ? 1 : gameState.impostorCount - gameState.eliminatedPlayers.length;

  // Get eligible players (non-eliminated, non-spectator)
  const eligiblePlayers = useMemo(() => {
    const activePlayers = gameState.players.filter(p => 
      !gameState.eliminatedPlayers.includes(p.id) && 
      (gameState.selectedPackType !== 'custom' || p.role !== 'spectator')
    );

    if (gameState.isTieVote && gameState.tiedPlayers && gameState.tiedPlayers.length > 0) {
      const tiedPlayerIds = new Set(gameState.tiedPlayers);
      return activePlayers.filter(p => tiedPlayerIds.has(p.id));
    }

    return activePlayers;
  }, [gameState.players, gameState.eliminatedPlayers, gameState.selectedPackType, gameState.isTieVote, gameState.tiedPlayers]);

  // Handle vote toggle
  const handleVoteToggle = (playerId: string) => {
    if (submitted) return;
    
    // Prevent spectators from voting in custom packs
    const currentPlayer = gameState.players.find(p => p.username === currentUsername);
    if (gameState.selectedPackType === 'custom' && currentPlayer?.role === 'spectator') return;
    
    setSelectedVotes(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else if (gameState.isRandomizeMode || gameState.isTieVote) {
        return [playerId]; // Only allow one selection
      } else if (prev.length < votesNeeded) {
        return [...prev, playerId];
      }
      return prev;
    });
    setError(null);
  };

  // Handle vote submission
  const handleSubmitVotes = () => {
    if (submitted) return;
    
    // Prevent spectators from submitting votes in custom packs
    if (gameState.selectedPackType === 'custom' && currentPlayer?.role === 'spectator') return;
    
    if (gameState.isRandomizeMode || gameState.isTieVote) {
      if (selectedVotes.length !== 1) {
        setError(`Please select exactly 1 player to vote for.`);
        return;
      }
    } else if (selectedVotes.length !== votesNeeded) {
      setError(`Please select exactly ${votesNeeded} player${votesNeeded > 1 ? 's' : ''} to vote for.`);
      return;
    }

    setSubmitted(true);
    setError(null);
    onVote?.(selectedVotes);
  };

  // Handle start voting
  const handleStartVoting = () => {
    if (votingStarted) return;
    setVotingStarted(true);
    setTimeLeft(0); // Stop the timer
    setIsTimerRunning(false);
    onStartVoting();
  };

  // Bot voting logic with timeout
  useEffect(() => {
    if (!votingStarted) return;

    let activePlayers = gameState.players.filter(p => !p.isEliminated);
    
    // If in tie-breaker mode, only allow voting for tied players
    if (gameState.isTieVote && gameState.tiedPlayers && gameState.tiedPlayers.length > 0) {
      activePlayers = activePlayers.filter(p => gameState.tiedPlayers!.includes(p.id));
      console.log('AnswerDisplay Tie-breaker: Bots can only vote for tied players:', activePlayers.map(p => p.username));
    }

    // Only vote for bots that haven't voted yet
    const bots = gameState.players.filter(player => 
      (player.isBot || player.username.startsWith('Bot_')) && 
      !gameState.votes[player.id] &&
      (gameState.selectedPackType !== 'custom' || player.role !== 'spectator') &&
      !player.isEliminated
    );
    
    if (bots.length === 0) return;

    // Generate all bot votes immediately - no delays
    bots.forEach((bot) => {
      const botVotes = generateBotVotes(
        bot.id,
        activePlayers,
        votesNeeded,
        bot.personality || 'random',
        gameState.isTieVote ? gameState.tiedPlayers : undefined,
        { eliminatedPlayers: gameState.eliminatedPlayers }
      );
      
      // Store bot votes in game state
      if (setGameState) {
        setGameState(prev => ({
          ...prev,
          votes: { ...prev.votes, [bot.id]: botVotes }
        }));
      }
    });

    // Force bot voting timeout - ensure all bots vote within 3 seconds
    const timeout = setTimeout(() => {
      const remainingBots = activePlayers.filter(player => 
        (player.isBot || player.username.startsWith('Bot_')) && 
        !gameState.votes[player.id] &&
        !player.isEliminated && // This check is redundant now but safe
        (gameState.selectedPackType !== 'custom' || player.role !== 'spectator')
      );
      
      if (remainingBots.length > 0) {
        console.log('Bot voting timeout - forcing votes for:', remainingBots.map(b => b.username));
        
        remainingBots.forEach((bot) => {
          const botVotes = generateBotVotes(
            bot.id,
            activePlayers,
            votesNeeded,
            'random', // Force random voting on timeout
            gameState.isTieVote ? gameState.tiedPlayers : undefined,
            { eliminatedPlayers: gameState.eliminatedPlayers }
          );
          
          if (setGameState) {
            setGameState(prev => ({
              ...prev,
              votes: { ...prev.votes, [bot.id]: botVotes }
            }));
          }
        });
      }
    }, 3000); // 3 seconds timeout

    return () => clearTimeout(timeout);
  }, [votingStarted, votesNeeded, gameState.isTieVote, gameState.tiedPlayers, gameState.players, gameState.votes, gameState.selectedPackType, setGameState]);


  const getPlayerAnswer = (playerId: string) => {
    return gameState.playerAnswers?.[playerId] || '';
  };

  const isHost = currentPlayer?.isHost;
  const isSpectator = currentPlayer?.role === 'spectator';

  // Translation texts
  const texts = {
    en: {
      title: 'Discussion Time',
      question: 'Question',
      answers: 'Answers',
      startVoting: 'Start Voting',
      discussionTimer: 'Discussion Timer',
      timeLeft: 'Time Left',
      playerAnswer: 'Answer',
      noAnswer: 'No answer submitted',
      waitingForHost: 'Waiting for host to start voting...'
    },
    ru: {
      title: 'Время Обсуждения',
      question: 'Вопрос',
      answers: 'Ответы',
      startVoting: 'Начать Голосование',
      discussionTimer: 'Таймер Обсуждения',
      timeLeft: 'Осталось Времени',
      playerAnswer: 'Ответ',
      noAnswer: 'Ответ не отправлен',
      waitingForHost: 'Ожидание начала голосования от хоста...'
    },
    ka: {
      title: 'დისკუსიის დრო',
      question: 'კითხვა',
      answers: 'პასუხები',
      startVoting: 'ხმის მიცემის დაწყება',
      discussionTimer: 'დისკუსიის ტაიმერი',
      timeLeft: 'დარჩენილი დრო',
      playerAnswer: 'პასუხი',
      noAnswer: 'პასუხი არ არის გაგზავნილი',
      waitingForHost: 'მფლობელის ხმის მიცემის დაწყების ლოდინი...'
    }
  };

  const t = texts[language];

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
        {/* Header */}
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg" style={{ backgroundColor: '#3B82F6', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)' }}>
              <span className="text-2xl">💬</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 leading-tight" style={{ color: '#FFFFFF' }}>
            Find the World's most
            <span className="block" style={{ color: '#3B82F6' }}>
              Amazing Discussion
            </span>
          </h1>
          <p className="text-lg" style={{ color: '#D1D5DB' }}>{t.title}</p>
          {!gameState.isRandomizeMode && (
            <div className="mt-6 backdrop-blur-sm rounded-2xl p-4 border shadow-lg inline-block" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <div className="flex items-center justify-center space-x-3">
                <div className="p-3 rounded-full bg-red-500/20">
                  <Users className="w-6 h-6 text-red-400" />
                </div>
                <span className="font-mono text-2xl font-bold text-white">
                  Impostors: {gameState.impostorCount}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Question Display - Only show for question mode */}
        {gameState.gameMode === 'questions' && (
          <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
                <span className="text-2xl">❓</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-4">
                {gameState.gameMode === 'words' ? 'Word:' : t.question}:
              </h2>
              <p className="text-lg text-white leading-relaxed break-words hyphens-auto">
                {gameState.gameMode === 'words' ? gameState.currentWord : gameState.currentQuestion}
              </p>
            </div>
          </div>
        )}

        {/* Rules Section - Simple Text */}
        <div className="text-center mb-8">
          {!votingStarted ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Discussion Phase</h2>
              <p className="text-gray-300 text-lg">
                Review all answers and discuss who you think are the impostors.
              </p>
              <p className="text-gray-400">
                {isHost ? 'Click "Start Voting" when ready.' : 'The host will start voting when ready.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Voting Phase</h2>
              <p className="text-gray-300 text-lg">
                {gameState.isRandomizeMode || gameState.isTieVote
                  ? 'Vote for an impostor.'
                  : `Select ${votesNeeded} impostor${votesNeeded > 1 ? 's' : ''} to vote for.`
                }
              </p>
              <p className="text-gray-400">
                {selectedVotes.length}/{votesNeeded} selected
              </p>
          </div>
          )}
        </div>

        {/* Answers Display Section */}
        <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <h3 className="text-xl font-bold text-white mb-6 text-center">
            {t.answers}
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {eligiblePlayers.map((player) => {
              const answer = getPlayerAnswer(player.id);
              const isSelected = selectedVotes.includes(player.id);
              const isEligible = eligiblePlayers.some(p => p.id === player.id);
              
              return (
                <div 
                  key={player.id}
                  className={`relative p-4 rounded-xl border-2 transition-all transform duration-300 min-h-[200px] flex flex-col ${
                    player.isEliminated
                      ? 'bg-gray-800/30 border-gray-700/50 opacity-50 filter blur-sm'
                      : votingStarted 
                      ? (isSelected
                        ? 'bg-red-500/20 border-red-500/50 shadow-lg shadow-red-500/20'
                        : isEligible && player.id !== currentPlayer?.id
                        ? 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-600/50 hover:scale-105 cursor-pointer'
                        : 'bg-gray-800/30 border-gray-700/50 opacity-50')
                      : 'bg-gray-700/50 border-gray-600/50'
                  } ${votingStarted && submitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={votingStarted && isEligible && !player.isEliminated && player.id !== currentPlayer?.id && !submitted && !(gameState.selectedPackType === 'custom' && currentPlayer?.role === 'spectator') ? () => handleVoteToggle(player.id) : undefined}
                >
                  {/* Avatar */}
                  <div className="relative mx-auto mb-3">
                    {player.avatar && player.avatar.startsWith('data:') ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center">
                        <img
                          src={player.avatar}
                          alt={`${player.username}'s avatar`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : player.avatar ? (
                      <div className={`w-12 h-12 ${player.avatar} rounded-full flex items-center justify-center`}>
                        <User className="w-6 h-6 text-white" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                    </div>
                    )}
                        {player.isHost && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-xs">👑</span>
                      </div>
                          )}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="text-center mb-2">
                    <h3 className="text-sm font-bold text-white truncate">
                      {player.username}
                    </h3>
                  </div>
                  
                  {/* Answer Display */}
                  <div className="flex-grow flex flex-col justify-center">
                    <div className="text-xs text-gray-200 bg-black/20 rounded-2xl p-1.5 break-words leading-tight flex-grow flex items-center justify-center text-center overflow-hidden">
                      <span className="block max-w-full">
                        {answer || t.noAnswer}
                      </span>
                    </div>
                  </div>
                  
                  {votingStarted && !isEligible && (
                    <div className="mt-2 text-center">
                      <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
                        Not available
                      </span>
                    </div>
                  )}
                  {votingStarted && player.id === currentPlayer?.id && (
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
          {!votingStarted ? (
            // Discussion Phase
            <>
              {isHost && isSpectator ? (
                <button
                  onClick={() => {
                    // Check if all non-spectator players have submitted answers
                    const nonSpectatorPlayers = gameState.players.filter(p => p.role !== 'spectator');
                    const allSubmitted = nonSpectatorPlayers.every(p => 
                      p.isBot || gameState.submittedAnswers[p.id]
                    );
                    if (allSubmitted) {
                      handleStartVoting();
                    }
                  }}
                  className="group relative rounded-3xl p-6 transition-all duration-300 w-full shadow-lg hover:shadow-xl hover:-translate-y-1"
                  style={{ 
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2), 0 10px 25px rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(16, 185, 129, 0.8)'
                  }}
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center space-x-3">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                      <Vote className="w-7 h-7 text-white" />
                    </div>
                    <span className="font-semibold text-lg text-white">Start Voting Phase</span>
                  </div>
                </button>
              ) : isHost ? (
            <button
                  onClick={handleStartVoting}
                  className="group relative rounded-3xl p-6 transition-all duration-300 w-full shadow-lg hover:shadow-xl hover:-translate-y-1"
                  style={{ 
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2), 0 10px 25px rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(16, 185, 129, 0.8)'
                  }}
            >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center space-x-3">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                      <Vote className="w-7 h-7 text-white" />
                    </div>
                    <span className="font-semibold text-lg text-white">{t.startVoting}</span>
                  </div>
            </button>
              ) : (
                <div className="backdrop-blur-sm rounded-2xl p-6 text-center border shadow-2xl" style={{ backgroundColor: 'rgba(107, 114, 128, 0.1)', borderColor: 'rgba(107, 114, 128, 0.3)' }}>
                  <div className="flex items-center justify-center text-gray-300">
                    <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold">{t.waitingForHost}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Voting Phase
            <>
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-4">
                  <p className="text-red-200 text-center font-medium">{error}</p>
                </div>
              )}
              
              {!(gameState.selectedPackType === 'custom' && isSpectator) && (
                <button
                  onClick={handleSubmitVotes}
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
              )}
              
              {(gameState.selectedPackType === 'custom' && isSpectator) && (
                <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4">
                  <div className="flex items-center justify-center text-blue-200">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold">You are spectating - Watch the voting unfold!</span>
                  </div>
                </div>
              )}
              
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnswerDisplayScreen;