import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { Language } from '../types';

interface JoinRoomScreenProps {
  onJoinRoom: (code: string) => void;
  onBack: () => void;
  language: Language;
  error?: string;
}

export default function JoinRoomScreen({ onJoinRoom, onBack, language, error }: JoinRoomScreenProps) {
  const [roomCode, setRoomCode] = useState('');

  const texts = {
    en: {
      title: 'Join Room',
      codeLabel: 'Room Code',
      codePlaceholder: 'Enter 6-digit code...',
      join: 'Join Room',
      back: 'Back',
      roomNotFound: 'Room not found',
      invalidCode: 'Invalid room code'
    },
    ru: {
      title: 'Присоединиться к комнате',
      codeLabel: 'Код комнаты',
      codePlaceholder: 'Введите 6-значный код...',
      join: 'Присоединиться',
      back: 'Назад',
      roomNotFound: 'Комната не найдена',
      invalidCode: 'Неверный код комнаты'
    },
    ka: {
      title: 'ოთახში შესვლა',
      codeLabel: 'ოთახის კოდი',
      codePlaceholder: 'შეიყვანეთ 6-ნიშნა კოდი...',
      join: 'ოთახში შესვლა',
      back: 'უკან',
      roomNotFound: 'ოთახი ვერ მოიძებნა',
      invalidCode: 'არასწორი ოთახის კოდი'
    }
  };

  const t = texts[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.length === 6) {
      onJoinRoom(roomCode);
    }
  };

  const handleCodeChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setRoomCode(cleaned);
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
        {/* Header */}
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg" style={{ backgroundColor: '#3B82F6', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)' }}>
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 leading-tight" style={{ color: '#FFFFFF' }}>
            Find the World's most
            <span className="block" style={{ color: '#3B82F6' }}>
              Amazing Room
            </span>
          </h1>
          <p className="text-gray-400 text-lg">Enter room code to join</p>
        </div>

        {/* Join Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white">{t.codeLabel}</h2>
            </div>

            {/* Code Input */}
            <div className="space-y-4">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder={t.codePlaceholder}
                className="w-full px-6 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl text-center text-2xl font-mono tracking-widest text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                maxLength={6}
              />

              {/* Error Message */}
              {error && (
                <div className="backdrop-blur-sm rounded-xl p-4 border" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                  <p className="text-red-400 text-sm text-center font-medium">
                    {error === 'roomNotFound' && t.roomNotFound}
                    {error === 'invalidCode' && t.invalidCode}
                    {!['roomNotFound', 'invalidCode'].includes(error) && error}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Join Button */}
          <button
            type="submit"
            disabled={roomCode.length !== 6}
            className="w-full py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold text-lg text-white"
            style={{ 
              backgroundColor: '#3B82F6',
              boxShadow: roomCode.length === 6 ? '0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2), 0 10px 25px rgba(0, 0, 0, 0.3)' : '0 10px 25px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(59, 130, 246, 0.8)'
            }}
          >
            {t.join}
          </button>

          {/* Back Button */}
          <button
            onClick={onBack}
            className="w-full py-4 bg-gradient-to-br from-gray-600/80 to-gray-700/80 backdrop-blur-sm text-white font-medium rounded-2xl hover:from-gray-500/80 hover:to-gray-600/80 transition-all duration-300 border border-gray-500/70"
          >
            {t.back}
          </button>
        </form>
      </div>
    </div>
  );
}