import { Trophy, RotateCcw, User, Crown, Star, Skull } from 'lucide-react';
import { GameState, Language, WinnerType } from '../types';

interface ResultsScreenProps {
  gameState: GameState;
  onPlayAgain: () => void;
  onBackToHome: () => void;
  language: Language;
}

export default function ResultsScreen({
  gameState,
  onPlayAgain,
  onBackToHome,
  language
}: ResultsScreenProps) {
  const { winners, winnerType, players: allPlayers, playerRoles, originalPlayerRoles, eliminatedPlayers } = gameState;
  
  // Use original roles for eliminated players, current roles for active players
  const displayRoles = { ...playerRoles };
  if (originalPlayerRoles && eliminatedPlayers) {
    eliminatedPlayers.forEach(playerId => {
      if (originalPlayerRoles[playerId]) {
        displayRoles[playerId] = originalPlayerRoles[playerId];
      }
    });
  }
  
  console.log('ResultsScreen - Game State:', {
    winners: winners?.length || 0,
    winnerType,
    players: allPlayers?.length || 0,
    playerRoles: Object.keys(playerRoles || {}).length,
    originalVotes: gameState.originalVotes ? Object.keys(gameState.originalVotes).length : 0,
    tieBreakerVotes: gameState.tieBreakerVotes ? gameState.tieBreakerVotes.length : 0,
    currentVotes: gameState.votes ? Object.keys(gameState.votes).length : 0
  });
  console.log('Winners array:', winners);
  console.log('Winner type:', winnerType);
  console.log('All players with roles:', allPlayers?.map(p => ({
    id: p.id,
    username: p.username,
    role: playerRoles?.[p.id]
  })));
  console.log('Impostor count in game:', gameState.impostorCount);

  const texts = {
    en: {
      gameOver: 'Game Over!',
      winners: 'Winners',
      innocentWin: 'Innocent Players Win!',
      impostorWin: 'Impostors Win!',
      jesterWin: 'Jester Wins!',
      playerRoles: 'Player Roles',
      innocent: 'Innocent',
      impostor: 'Impostor',
      jester: 'Jester',
      restartGame: 'Play Again',
      leaveRoom: 'Leave Room',
      waitingForHost: 'Waiting for host to restart...',
      innocentWinDesc: 'All impostors were eliminated!',
      impostorWinDesc: 'The impostors avoided detection!',
      jesterWinDesc: 'The jester was voted out!',
      tieGame: 'Tie Game!',
      tieGameDesc: 'One innocent and all impostors were eliminated!',
      eliminatedButWon: 'Eliminated but Won',
      // Victory messages for impostors/jester
      impostorVictory1: 'absolutely COOKED in the game',
      impostorVictory2: 'is the absolute GOAT of the Impasta game',
      impostorVictory3: 'pasta team and {winner} should be nerfed',
      // Victory messages for innocents/crewmates
      innocentVictory1: 'Crewmates were moving like prime MESSI during the game',
      innocentVictory2: 'Crewmates need to be nerfed brooo',
      innocentVictory3: 'impastas got cooked like pasta fr',
      innocentVictory4: 'impasta? more like I\'m pasta.'
    },
    ru: {
      gameOver: 'Игра окончена!',
      winners: 'Победители',
      innocentWin: 'Честные игроки победили!',
      impostorWin: 'Самозванцы победили!',
      jesterWin: 'Шут победил!',
      playerRoles: 'Роли игроков',
      innocent: 'Честный',
      impostor: 'Самозванец',
      jester: 'Шут',
      restartGame: 'Играть снова',
      leaveRoom: 'Покинуть комнату',
      waitingForHost: 'Ждем хоста для перезапуска...',
      innocentWinDesc: 'Все самозванцы были исключены!',
      impostorWinDesc: 'Самозванцы избежали обнаружения!',
      jesterWinDesc: 'Шут был исключен!',
      tieGame: 'Ничья!',
      tieGameDesc: 'Один честный игрок и все самозванцы были исключены!',
      eliminatedButWon: 'Исключен, но выиграл',
      // Victory messages for impostors/jester
      impostorVictory1: 'абсолютно ЗАЖАРИЛ в игре',
      impostorVictory2: 'абсолютный КОЗЕЛ игры Impasta',
      impostorVictory3: 'команда пасты и {winner} должны быть ослаблены',
      // Victory messages for innocents/crewmates
      innocentVictory1: 'Честные игроки двигались как прим МЕССИ в игре',
      innocentVictory2: 'Честных игроков нужно ослабить, братан',
      innocentVictory3: 'самозванцы зажарились как паста, честно',
      innocentVictory4: 'самозванец? больше похоже на "я паста".'
    },
    ka: {
      gameOver: 'თამაში დასრულდა!',
      winners: 'გამარჯვებულები',
      innocentWin: 'პატიოსანი მოთამაშეები იმარჯვებენ!',
      impostorWin: 'თაღლითები იმარჯვებენ!',
      jesterWin: 'ჯოკერი იმარჯვებს!',
      playerRoles: 'მოთამაშეების როლები',
      innocent: 'პატიოსანი',
      impostor: 'თაღლითი',
      jester: 'ჯოკერი',
      restartGame: 'თავიდან თამაში',
      leaveRoom: 'ოთახის დატოვება',
      waitingForHost: 'ველოდებით მასპინძელს გადასატვირთად...',
      innocentWinDesc: 'ყველა თაღლითი გამოირიცხა!',
      impostorWinDesc: 'თაღლითებმა თავი აარიდეს აღმოჩენას!',
      jesterWinDesc: 'ჯოკერი გამოირიცხა!',
      tieGame: 'ტოლი!',
      tieGameDesc: 'ერთი პატიოსანი მოთამაშე და ყველა თაღლითი გამოირიცხა!',
      eliminatedButWon: 'გამოირიცხა, მაგრამ იმარჯვა',
      // Victory messages for impostors/jester
      impostorVictory1: 'აბსოლუტურად გამოცხვა თამაშში',
      impostorVictory2: 'არის აბსოლუტური ღორი Impasta თამაშის',
      impostorVictory3: 'პასტის გუნდი და {winner} უნდა იყოს შემცირებული',
      // Victory messages for innocents/crewmates
      innocentVictory1: 'პატიოსანი მოთამაშეები მოძრაობდნენ როგორც პრაიმ მესი თამაშში',
      innocentVictory2: 'პატიოსანი მოთამაშეები უნდა იყოს შემცირებული, ძმაო',
      innocentVictory3: 'თაღლითები გამოცხვნენ როგორც პასტა, სიმართლე',
      innocentVictory4: 'თაღლითი? უფრო მსგავსი "მე ვარ პასტა".'
    }
  };

  const t = texts[language];

  const getWinnerTitle = () => {
    switch (winnerType) {
      case 'innocent': return t.innocentWin;
      case 'impostor': return t.impostorWin;
      case 'jester': return t.jesterWin;
      case 'tie': return t.tieGame;
      default: return t.gameOver;
    }
  };

  const getWinnerDescription = () => {
    switch (winnerType) {
      case 'innocent': return t.innocentWinDesc;
      case 'impostor': return t.impostorWinDesc;
      case 'jester': return t.jesterWinDesc;
      case 'tie': return t.tieGameDesc;
      default: return '';
    }
  };


  const getRoleColor = (role: string) => {
    switch (role) {
      case 'innocent': return 'bg-green-100 text-green-800 border-green-200';
      case 'impostor': return 'bg-red-100 text-red-800 border-red-200';
      case 'jester': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'innocent': return t.innocent;
      case 'impostor': return t.impostor;
      case 'jester': return t.jester;
      default: return role;
    }
  };

  // Get a random victory message based on winner type
  const getVictoryMessage = (winnerType: WinnerType, winnerNames: string[]) => {
    if (winnerType === 'innocent') {
      const messages = [t.innocentVictory1, t.innocentVictory2, t.innocentVictory3, t.innocentVictory4];
      return messages[Math.floor(Math.random() * messages.length)];
    } else if (winnerType === 'impostor' || winnerType === 'jester') {
      const messages = [t.impostorVictory1, t.impostorVictory2];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      // For the third message, we need to replace {winner} with actual winner names
      if (Math.random() < 0.3) { // 30% chance for the special message
        const winnerName = winnerNames.length > 0 ? winnerNames[0] : 'Winner';
        return t.impostorVictory3.replace('{winner}', winnerName);
      }
      
      return randomMessage;
    }
    return ''; // No special message for tie games
  };

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
              <span className="text-2xl">🏆</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 leading-tight" style={{ color: '#FFFFFF' }}>
            Find the World's most
            <span className="block" style={{ color: '#3B82F6' }}>
              Amazing Results
            </span>
          </h1>
          <p className="text-lg" style={{ color: '#D1D5DB' }}>{t.gameOver}</p>
        </div>

        {/* Winner Announcement */}
        <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg mx-auto">
                <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-lg animate-bounce" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-4">{getWinnerTitle()}</h2>
            <p className="text-lg text-gray-300 mb-6">{getWinnerDescription()}</p>
            
            {/* Winner Names */}
            <div className="space-y-3">
              {winners && winners.length > 0 ? winners.map((winner, index) => (
                <div key={winner.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg transform hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center justify-center space-x-3">
                    {winner.avatar && winner.avatar.startsWith('data:') ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shadow-md">
                        <img 
                          src={winner.avatar} 
                          alt={`${winner.username}'s avatar`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : winner.avatar ? (
                      <div className={`w-12 h-12 ${winner.avatar} rounded-full flex items-center justify-center shadow-md`}>
                        <User className="w-6 h-6 text-white" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center shadow-md">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="text-center">
                      <p className="font-bold text-xl text-white">{winner.username}</p>
                      <div className="flex items-center justify-center space-x-1 mt-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium text-gray-300">Winner #{index + 1}</span>
                        <Star className="w-4 h-4 text-yellow-400" />
                      </div>
                      {gameState.eliminatedPlayers?.includes(winner.id) && (
                        <div className="flex items-center justify-center space-x-1 mt-2">
                          <span className="text-xs bg-red-500/30 text-red-300 px-2 py-1 rounded-full border border-red-400/50">
                            {t.eliminatedButWon}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl p-4 border border-gray-600/50 shadow-lg">
                  <p className="text-center text-gray-300 font-medium">No winners determined</p>
                </div>
              )}
            </div>
            
            {/* Victory Message */}
            {winners && winners.length > 0 && winnerType && winnerType !== 'tie' && (
              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-xl">
                <p className="text-center text-yellow-200 text-lg font-medium italic">
                  {getVictoryMessage(winnerType, winners.map(w => w.username))}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Player Roles */}
        <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
          <h3 className="text-xl font-bold text-white mb-6 text-center">{t.playerRoles}</h3>
          <div className="grid grid-cols-2 gap-3">
            {allPlayers.map((player) => {
              const isEliminated = gameState.eliminatedPlayers.includes(player.id);
              return (
                <div key={player.id} className={`relative p-4 rounded-2xl border bg-white/10 min-h-[120px] flex flex-col transition-all duration-300 ${
                  isEliminated ? 'border-red-500/30 bg-red-900/20 opacity-70' : 'border-white/20'
                }`}>
                  {/* Avatar */}
                  <div className="relative mx-auto mb-3">
                    {player.avatar && player.avatar.startsWith('data:') ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center">
                        <img 
                          src={player.avatar} 
                          alt={`${player.username}'s avatar`}
                          className={`w-full h-full object-cover ${isEliminated ? 'blur-sm' : ''}`}
                        />
                      </div>
                    ) : (
                      <div className={`w-12 h-12 ${player.avatar || 'bg-gradient-to-br from-gray-500 to-gray-600'} rounded-full flex items-center justify-center ${isEliminated ? 'blur-sm' : ''}`}>
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    {player.isHost && !isEliminated && (
                      <Crown className="w-5 h-5 text-yellow-400 absolute -top-1 -right-1" />
                    )}
                    {isEliminated && (
                      <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                        <Skull className="w-6 h-6 text-red-500" />
                      </div>
                    )}
                  </div>

                  {/* Name and Role */}
                  <div className="text-center flex-grow">
                    <h3 className={`text-sm font-bold text-white mb-2 truncate ${isEliminated ? 'line-through text-gray-400' : ''}`}>
                      {player.username}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(displayRoles[player.id])}`}>
                      {getRoleText(displayRoles[player.id])}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={onPlayAgain}
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
                <RotateCcw className="w-7 h-7 text-white" />
              </div>
              <span className="font-semibold text-lg text-white">{t.restartGame}</span>
            </div>
          </button>

          <button
            onClick={onBackToHome}
            className="w-full py-4 bg-gradient-to-br from-gray-600/80 to-gray-700/80 backdrop-blur-sm text-white font-medium rounded-2xl hover:from-gray-500/80 hover:to-gray-600/80 transition-all duration-300 border border-gray-500/70"
          >
            {t.leaveRoom}
          </button>
        </div>
      </div>
    </div>
  );
}