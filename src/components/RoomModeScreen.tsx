import React from 'react';
import { Plus, Users } from 'lucide-react';
import { Language } from '../types';

interface RoomModeScreenProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onBack: () => void;
  language: Language;
}

export default function RoomModeScreen({ onCreateRoom, onJoinRoom, onBack, language }: RoomModeScreenProps) {
  console.log('RoomModeScreen rendered with props:', { onCreateRoom: !!onCreateRoom, onJoinRoom: !!onJoinRoom, onBack: !!onBack, language });
  const texts = {
    en: {
      title: 'Room Options',
      createRoom: 'Create a Room',
      joinRoom: 'Join a Room',
      createDesc: 'Host a new game and invite friends',
      joinDesc: 'Enter a room code to join existing game',
      back: 'Back'
    },
    ru: {
      title: 'Опции комнаты',
      createRoom: 'Создать комнату',
      joinRoom: 'Присоединиться к комнате',
      createDesc: 'Создать новую игру и пригласить друзей',
      joinDesc: 'Введите код комнаты для присоединения',
      back: 'Назад'
    },
    ka: {
      title: 'ოთახის ოფციები',
      createRoom: 'ოთახის შექმნა',
      joinRoom: 'ოთახში შესვლა',
      createDesc: 'ახალი თამაშის ჩატარება და მეგობრების მოწვევა',
      joinDesc: 'შეიყვანეთ ოთახის კოდი არსებულ თამაშში შესასვლელად',
      back: 'უკან'
    }
  };

  const t = texts[language] || texts.en;

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
              <span className="text-2xl">🏠</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 leading-tight" style={{ color: '#FFFFFF' }}>
            Find the World's most
            <span className="block" style={{ color: '#3B82F6' }}>
              Amazing Room
            </span>
          </h1>
          <p className="text-gray-400 text-lg">Create or join a game room</p>
        </div>

        {/* Room Options */}
        <div className="space-y-4 mb-8">
          <button
            onClick={onCreateRoom}
            className="group relative rounded-3xl p-6 transition-all duration-300 w-full shadow-lg hover:shadow-xl hover:-translate-y-1"
            style={{ 
              backgroundColor: '#10B981',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2), 0 10px 25px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(16, 185, 129, 0.8)'
            }}
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <Plus className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white mb-1">Create Room</h3>
                  <p className="text-sm text-white/80">Host a new game and invite friends</p>
                </div>
              </div>
              <div className="text-white/80 text-sm font-medium group-hover:text-white transition-colors duration-300">→</div>
            </div>
          </button>

          <button
            onClick={onJoinRoom}
            className="group relative rounded-3xl p-6 transition-all duration-300 w-full shadow-lg hover:shadow-xl hover:-translate-y-1"
            style={{ 
              backgroundColor: '#3B82F6',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2), 0 10px 25px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(59, 130, 246, 0.8)'
            }}
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white mb-1">Join Room</h3>
                  <p className="text-sm text-white/80">Enter a room code to join existing game</p>
                </div>
              </div>
              <div className="text-white/80 text-sm font-medium group-hover:text-white transition-colors duration-300">→</div>
            </div>
          </button>
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="w-full py-4 bg-gradient-to-br from-gray-600/80 to-gray-700/80 backdrop-blur-sm text-white font-medium rounded-2xl hover:from-gray-500/80 hover:to-gray-600/80 transition-all duration-300 border border-gray-500/70"
        >
          {t.back}
        </button>
      </div>
    </div>
  );
}