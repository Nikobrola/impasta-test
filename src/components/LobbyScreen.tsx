import { useState, useEffect, useRef } from 'react';
import { Copy, Play, Users, Crown, User, Bot, HelpCircle } from 'lucide-react';
import { GameState, Language } from '../types';
import { Bot as BotType } from '../utils/botUtils';

interface LobbyScreenProps {
  gameState: GameState;
  currentUsername: string;
  onAddBot: () => void;
  onImpostorCountChange: (count: number) => void;
  onRandomizeToggle: (enabled: boolean) => void;
  onJesterToggle: (enabled: boolean) => void;
  onStartGame: () => void;
  onBack: () => void;
  language: Language;
}

export default function LobbyScreen({
  gameState,
  currentUsername,
  onAddBot,
  onImpostorCountChange,
  onRandomizeToggle,
  onJesterToggle,
  onStartGame,
  onBack,
  language
}: LobbyScreenProps) {
  const { roomCode, players } = gameState;
  // Check if CURRENT user is host (not just if any player is host)
  const currentPlayer = players.find(p => p.username === currentUsername);
  const isHost = currentPlayer?.isHost || false;
  const currentPlayerId = currentPlayer?.id || '';
  
  const [showRandomizeTooltip, setShowRandomizeTooltip] = useState(false);
  const [showJesterTooltip, setShowJesterTooltip] = useState(false);
  
  // Refs for tooltip buttons
  const randomizeTooltipRef = useRef<HTMLButtonElement>(null);
  const jesterTooltipRef = useRef<HTMLButtonElement>(null);

  // Click outside handler to close tooltips
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close randomize tooltip if clicked outside
      if (showRandomizeTooltip && randomizeTooltipRef.current && 
          !randomizeTooltipRef.current.contains(event.target as Node)) {
        setShowRandomizeTooltip(false);
      }
      
      // Close jester tooltip if clicked outside
      if (showJesterTooltip && jesterTooltipRef.current && 
          !jesterTooltipRef.current.contains(event.target as Node)) {
        setShowJesterTooltip(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRandomizeTooltip, showJesterTooltip]);

  const texts = {
    en: {
      roomCode: 'Room Code',
      lobby: 'Lobby:',
      impostors: 'Impostors:',
      jester: 'Jester:',
      randomize: 'Randomize',
      on: 'ON',
      off: 'OFF',
      startGame: 'Start Game',
      leaveRoom: 'Leave Room',
      waitingHost: 'Waiting for host to start...',
      addBots: 'Add Bots',
      minPlayers: 'Need at least 3 players to start',
      codeCopied: 'Code copied!',
      you: '(You)',
      host: 'Host',
      selectedPack: 'Selected Pack',
      party: 'Party',
      spicy: 'Spicy',
      normal: 'Normal',
      custom: 'Custom',
      bot: 'Bot',
      jesterEnabled: 'Jester role enabled',
      jesterDisabled: 'Jester role disabled',
      randomizeEnabled: 'Randomize mode enabled',
      randomizeDisabled: 'Randomize mode disabled',
      randomizeTooltip: 'Randomize impostor count between 1-3 (or 1 to half of players for smaller games). Requires at least 5 players.',
      jesterTooltip: 'Add a Jester role. The Jester wins by getting voted out, creating an additional challenge for other players.'
    },
    ru: {
      roomCode: 'Код комнаты',
      lobby: 'Лобби:',
      impostors: 'Самозванцы:',
      jester: 'Шут:',
      randomize: 'Случайно',
      on: 'ВКЛ',
      off: 'ВЫКЛ',
      startGame: 'Начать игру',
      leaveRoom: 'Покинуть комнату',
      waitingHost: 'Ждем хоста...',
      addBots: 'Добавить ботов',
      minPlayers: 'Нужно минимум 3 игрока',
      codeCopied: 'Код скопирован!',
      you: '(Вы)',
      host: 'Хост',
      selectedPack: 'Выбранный пакет',
      party: 'Вечеринка',
      spicy: 'Острый',
      normal: 'Обычный',
      custom: 'Пользовательский',
      bot: 'Бот',
      jesterEnabled: 'Роль шута включена',
      jesterDisabled: 'Роль шута отключена',
      randomizeEnabled: 'Режим случайности включен',
      randomizeDisabled: 'Режим случайности отключен',
      randomizeTooltip: 'Случайное количество самозванцев от 1 до 3 (или до половины игроков для маленьких игр). Требуется минимум 5 игроков.',
      jesterTooltip: 'Добавить роль Шута. Шут выигрывает, если его выгонят, создавая дополнительный вызов для других игроков.'
    },
    ka: {
      roomCode: 'ოთახის კოდი',
      lobby: 'ლობი:',
      impostors: 'თაღლითები:',
      jester: 'ჯოკერი:',
      randomize: 'შემთხვევით',
      on: 'ჩართული',
      off: 'გამორთული',
      startGame: 'თამაშის დაწყება',
      leaveRoom: 'ოთახიდან გასვლა',
      waitingHost: 'ველოდებით ჰოსტს...',
      addBots: 'ბოტების დამატება',
      minPlayers: 'საჭიროა მინიმუმ 3 მოთამაშე',
      codeCopied: 'კოდი კოპირებულია!',
      you: '(შენ)',
      host: 'ჰოსტი',
      selectedPack: 'არჩეული პაკეტი',
      party: 'ღონისძიება',
      spicy: 'მწვავე',
      normal: 'ჩვეულებრივი',
      custom: 'პერსონალური',
      bot: 'ბოტი',
      jesterEnabled: 'ჯოკერის როლი ჩართულია',
      jesterDisabled: 'ჯოკერის როლი გამორთულია',
      randomizeEnabled: 'შემთხვევითობის რეჟიმი ჩართულია',
      randomizeDisabled: 'შემთხვევითობის რეჟიმი გამორთულია',
      randomizeTooltip: 'შემთხვევითი თაღლითების რაოდენობა 1-3 (ან ნახევარი მოთამაშეების რაოდენობა პატარა თამაშებისთვის). საჭიროა მინიმუმ 5 მოთამაშე.',
      jesterTooltip: 'ჯოკერის როლის დამატება. ჯოკერი იმარჯვებს, თუ მას გააძევებენ, რაც სხვა მოთამაშეებისთვის დამატებით გამოწვევას ქმნის.'
    }
  };

  const t = texts[language];

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      // Show toast or feedback
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Calculate playing players (excluding spectators for custom packs)
  const playingPlayers = gameState.selectedPackType === 'custom' 
    ? players.filter(p => p.role !== 'spectator')
    : players;
  
  const canStart = playingPlayers.length >= 3;
  
  // Button state logic based on playing player count (excluding spectators)
  const playerCount = playingPlayers.length;
  const canModifyImpostors = playerCount >= 3; // +/- buttons work for 3+ players
  const canRandomize = playerCount >= 5; // randomize works for 5+ players
  const canUseJester = playerCount >= 3; // jester works for 3+ players

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
              <span className="text-2xl">🏠</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 leading-tight" style={{ color: '#FFFFFF' }}>
            Find the World's most
            <span className="block" style={{ color: '#3B82F6' }}>
              Amazing Lobby
            </span>
          </h1>
          <p className="text-lg" style={{ color: '#D1D5DB' }}>Configure your game and invite players</p>
        </div>

        {/* Room Code Card */}
        <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-4">Room Code</h2>
            <button
              onClick={copyRoomCode}
              className="group relative rounded-2xl p-4 transition-all duration-300 w-full shadow-lg hover:shadow-xl hover:-translate-y-1"
              style={{ 
                backgroundColor: '#3B82F6',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2), 0 10px 25px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(59, 130, 246, 0.8)'
              }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center space-x-3">
                <span className="text-2xl font-mono tracking-wider text-white">{roomCode}</span>
                <Copy className="w-5 h-5 text-white" />
              </div>
            </button>
            <p className="text-sm text-gray-400 mt-3">Share this code with other players</p>
          </div>
        </div>

        {/* Game Settings */}
        {isHost && (
          <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <h2 className="text-xl font-bold text-white mb-6 text-center">Game Settings</h2>
            
            <div className="space-y-6">
              {/* Selected Pack Display */}
              {gameState.gameMode === 'questions' && (
                <div>
                  <label className="block text-lg text-gray-300 mb-3">{t.selectedPack}</label>
                  <div className="flex items-center space-x-2">
                    {gameState.selectedPackType ? (
                      <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium">
                        {gameState.selectedPackType === 'party' && t.party}
                        {gameState.selectedPackType === 'spicy' && t.spicy}
                        {gameState.selectedPackType === 'normal' && t.normal}
                        {gameState.selectedPackType === 'custom' && t.custom}
                      </div>
                    ) : (
                      <div className="px-4 py-2 bg-gray-600 text-gray-300 rounded-xl text-sm font-medium">
                        No pack selected
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Impostor Count */}
              <div>
                <label className="block text-lg text-gray-300 mb-3">{t.impostors}</label>
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => onImpostorCountChange(Math.max(1, gameState.impostorCount - 1))}
                    disabled={!canModifyImpostors || gameState.impostorCount <= 1 || gameState.isRandomizeMode}
                    className="w-12 h-12 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-200 hover:scale-105"
                  >
                    -
                  </button>
                  <div className="bg-gray-700/50 rounded-xl py-3 px-6 min-w-[4rem] text-center">
                    <span className="text-white font-bold text-2xl">
                      {gameState.isRandomizeMode ? '?' : gameState.impostorCount}
                    </span>
                  </div>
                  <button
                    onClick={() => onImpostorCountChange(Math.min(Math.max(1, Math.floor((playingPlayers.length - 1) / 2)), gameState.impostorCount + 1))}
                    disabled={!canModifyImpostors || gameState.impostorCount >= Math.max(1, Math.floor((playingPlayers.length - 1) / 2)) || gameState.isRandomizeMode}
                    className="w-12 h-12 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-200 hover:scale-105"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Randomize & Jester */}
              <div className={`grid ${gameState.gameMode === 'words' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                <div>
                  <label className="block text-lg text-gray-300 mb-3 flex items-center space-x-2">
                    <span>{t.randomize}</span>
                    <button
                      ref={randomizeTooltipRef}
                      onClick={() => setShowRandomizeTooltip(!showRandomizeTooltip)}
                      className="relative"
                    >
                      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-300" />
                      {showRandomizeTooltip && (
                        <div className="fixed left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 w-80 max-w-[calc(100vw-2rem)] p-4 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-[9999]">
                          {t.randomizeTooltip}
                        </div>
                      )}
                    </button>
                  </label>
                  <button
                    onClick={() => onRandomizeToggle(!gameState.isRandomizeMode)}
                    disabled={!canRandomize || gameState.hasJester}
                    className={`w-full px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                      gameState.isRandomizeMode
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                        : !canRandomize || gameState.hasJester
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-600 hover:bg-gray-500 text-white'
                    }`}
                  >
                    {gameState.isRandomizeMode ? t.on : t.off}
                  </button>
                </div>

                {/* Jester - Only show for questions game mode */}
                {gameState.gameMode === 'questions' && (
                  <div>
                    <label className="block text-lg text-gray-300 mb-3 flex items-center space-x-2">
                      <span>{t.jester}</span>
                      <button
                        ref={jesterTooltipRef}
                        onClick={() => setShowJesterTooltip(!showJesterTooltip)}
                        className="relative"
                      >
                        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-300" />
                        {showJesterTooltip && (
                          <div className="fixed left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 w-80 max-w-[calc(100vw-2rem)] p-4 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-[9999]">
                            {t.jesterTooltip}
                          </div>
                        )}
                      </button>
                    </label>
                    <button
                      onClick={() => onJesterToggle(!gameState.hasJester)}
                      disabled={!canUseJester || gameState.isRandomizeMode}
                      className={`w-full px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                        gameState.hasJester
                          ? 'bg-purple-500 hover:bg-purple-600 text-white'
                          : !canUseJester || gameState.isRandomizeMode
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-600 hover:bg-gray-500 text-white'
                      }`}
                    >
                      {gameState.hasJester ? t.on : t.off}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Bots Button */}
        {isHost && players.length < 10 && (
          <div className="mb-8">
            <button
              onClick={onAddBot}
              className="group relative rounded-3xl p-6 transition-all duration-300 w-full shadow-lg hover:shadow-xl hover:-translate-y-1"
              style={{ 
                backgroundColor: '#22D3EE',
                boxShadow: '0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.2), 0 10px 25px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(34, 211, 238, 0.8)'
              }}
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center space-x-3">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <span className="font-semibold text-lg text-white">{t.addBots}</span>
              </div>
            </button>
          </div>
        )}

        {/* Room Full Message */}
        {players.length >= 10 && (
          <div className="mb-6">
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4 text-center">
              <p className="text-yellow-200 font-medium">
                {language === 'en' && 'Room is full (10 players maximum)'}
                {language === 'ru' && 'Комната полная (максимум 10 игроков)'}
                {language === 'ka' && 'ოთახი სავსეა (მაქსიმუმ 10 მოთამაშე)'}
              </p>
            </div>
          </div>
        )}

        {/* Players List */}
        <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">{t.lobby}</h2>
            <span className="text-sm text-gray-400">
              ({players.length}/10){gameState.selectedPackType === 'custom' ? ` - ${playingPlayers.length} playing` : ''}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
            {players.map((player) => (
              <div
                key={player.id}
                className={`relative p-4 rounded-2xl border transition-all duration-300 min-h-[120px] flex flex-col ${
                  player.id === currentPlayerId 
                    ? 'border-orange-500/50 bg-orange-500/20 shadow-lg' 
                    : 'border-gray-600/50 bg-gray-700/30'
                }`}
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
                    <Crown className="w-5 h-5 text-yellow-400 absolute -top-1 -right-1" />
                  )}
                  {(player as BotType).isBot && (
                    <Bot className="w-5 h-5 text-blue-400 absolute -top-1 -left-1" />
                  )}
                </div>

                {/* Name and Status */}
                <div className="text-center flex-grow">
                  <h3 className="text-sm font-bold text-white mb-1 truncate">
                    {player.username}
                  </h3>
                  <div className="space-y-1">
                    {player.id === currentPlayerId && (
                      <div className="text-xs text-orange-400 font-medium">{t.you}</div>
                    )}
                    {player.isHost && (
                      <div className="text-xs text-yellow-400 font-medium">{t.host}</div>
                    )}
                    {player.role === 'spectator' && gameState.selectedPackType === 'custom' && (
                      <div className="text-xs text-gray-400 font-medium">Spectator</div>
                    )}
                    {(player as BotType).isBot && (
                      <div className="text-xs text-blue-400 font-medium">{t.bot}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {isHost ? (
            (() => {
              const currentPlayer = gameState.players.find(p => p.username === currentUsername);
              if (gameState.selectedPackType === 'custom' && currentPlayer?.role === 'spectator' && gameState.phase !== 'lobby') {
                // Host is spectator and game has started - show game state
                return (
                  <div className="backdrop-blur-sm rounded-3xl p-6 border shadow-2xl" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-white mb-2">🎮 Game in Progress</h3>
                      <p className="text-gray-300">You are spectating the game</p>
                    </div>
                    
                    {/* Show current question/word */}
                    <div className="bg-gray-700/50 rounded-xl p-4 mb-4">
                      <h4 className="text-lg font-semibold text-white mb-2">
                        {gameState.gameMode === 'questions' ? '📝 Current Question' : '🔤 Current Word'}
                      </h4>
                      <p className="text-gray-300">
                        {gameState.gameMode === 'questions' 
                          ? gameState.currentQuestion || 'No question available'
                          : gameState.currentWord || 'No word available'
                        }
                      </p>
                    </div>
                    
                    {/* Show impostor question/word for reference */}
                    <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 mb-4">
                      <h4 className="text-lg font-semibold text-red-300 mb-2">
                        {gameState.gameMode === 'questions' ? '🎭 Impostor Question' : '🎭 Impostor Word'}
                      </h4>
                      <p className="text-red-200">
                        {gameState.gameMode === 'questions' 
                          ? gameState.currentImpostorQuestion || 'No impostor question available'
                          : gameState.currentImpostorWord || 'No impostor word available'
                        }
                      </p>
                    </div>

                    {/* Control buttons for host */}
                    <div className="space-y-3">
                      {gameState.phase === 'questions' && (
                        <button
                          onClick={() => {
                            // Check if all non-spectator players have submitted answers
                            const nonSpectatorPlayers = gameState.players.filter(p => p.role !== 'spectator');
                            const allSubmitted = nonSpectatorPlayers.every(p => 
                              p.isBot || gameState.submittedAnswers[p.id]
                            );
                            if (allSubmitted) {
                              // Transition to voting screen
                              window.dispatchEvent(new CustomEvent('navigateToVoting'));
                            } else {
                              console.log('Not all players have submitted answers yet');
                              const notSubmitted = nonSpectatorPlayers.filter(p => 
                                !p.isBot && !gameState.submittedAnswers[p.id]
                              );
                              console.log('Players who haven\'t submitted:', notSubmitted.map(p => p.username));
                            }
                          }}
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3"
                        >
                          <Play className="w-5 h-5" />
                          <span className="font-semibold">Go to Voting Phase</span>
                        </button>
                      )}
                      
                      {gameState.phase === 'voting' && (
                        <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-4 text-center">
                          <p className="text-green-200 font-medium">Voting phase is active</p>
                          <p className="text-green-300 text-sm mt-1">Players are voting now</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              } else {
                // Host is regular player - show start game button
                return (
                  <button
                    onClick={onStartGame}
                    disabled={!canStart}
                    className="group relative rounded-3xl p-6 transition-all duration-300 w-full shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:-translate-y-0"
                    style={{ 
                      backgroundColor: canStart ? '#10B981' : '#6B7280',
                      boxShadow: canStart ? '0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2), 0 10px 25px rgba(0, 0, 0, 0.3)' : '0 10px 25px rgba(0, 0, 0, 0.3)',
                      border: canStart ? '1px solid rgba(16, 185, 129, 0.8)' : '1px solid rgba(107, 114, 128, 0.8)'
                    }}
                  >
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-center space-x-3">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                        <Play className="w-7 h-7 text-white" />
                      </div>
                      <span className="font-semibold text-lg text-white">
                        {canStart ? t.startGame : t.minPlayers}
                      </span>
                    </div>
                  </button>
                );
              }
            })()
          ) : (
            <div className="backdrop-blur-sm rounded-3xl p-6 text-center border shadow-2xl" style={{ backgroundColor: 'rgba(107, 114, 128, 0.1)', borderColor: 'rgba(107, 114, 128, 0.3)' }}>
              <div className="text-gray-300 text-lg">
                {t.waitingHost}
              </div>
            </div>
          )}

          <button
            onClick={onBack}
            className="w-full py-4 bg-gradient-to-br from-gray-600/80 to-gray-700/80 backdrop-blur-sm text-white font-medium rounded-2xl hover:from-gray-500/80 hover:to-gray-600/80 transition-all duration-300 border border-gray-500/70"
          >
            {t.leaveRoom}
          </button>
        </div>
      </div>
    </div>
  );
}