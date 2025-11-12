import React, { useEffect } from 'react';
import { X, Crown, Shield, Zap } from 'lucide-react';
import { Language, Player } from '../types';

interface RoleRevealModalProps {
  playerRole: 'innocent' | 'impostor' | 'jester';
  playerName: string;
  language: Language;
  onClose: () => void;
  isOpen: boolean;
  players?: Player[];
  playerAnswers?: Record<string, string>;
  currentQuestion?: string;
  currentWord?: string;
  gameMode?: 'questions' | 'words';
}

export default function RoleRevealModal({
  playerRole,
  playerName,
  language,
  onClose,
  isOpen,
  players = [],
  playerAnswers = {},
  currentQuestion = '',
  currentWord = '',
  gameMode = 'questions'
}: RoleRevealModalProps) {
  // Suppress unused variable warnings for props that might be used in future features
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = { players, playerAnswers, currentQuestion, currentWord, gameMode };
  const [isVisible, setIsVisible] = React.useState(false);

  // Handle escape key press and animation state
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      // Trigger fade-in animation after a brief delay
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Don't render if modal is not open
  if (!isOpen) return null;

  const texts = {
    en: {
      roleReveal: 'Your Role',
      innocent: 'You are Innocent',
      impostor: 'You are the Impasta',
      jester: 'You are the Jester',
      innocentDescription: 'You have the same question as other innocent players. Help find the impostors!',
      impostorDescription: 'You have a different question! Pretend you have the same one and blend in.',
      jesterDescription: 'Try to get voted out to win the game!',
      ok: 'Got it'
    },
    ru: {
      roleReveal: 'Ваша роль',
      innocent: 'Вы невиновны',
      impostor: 'Вы самозванец',
      jester: 'Вы шут',
      innocentDescription: 'У вас тот же вопрос, что и у других честных игроков. Помогите найти самозванцев!',
      impostorDescription: 'У вас другой вопрос! Притворяйтесь, что у вас такой же.',
      jesterDescription: 'Постарайтесь, чтобы вас исключили, чтобы выиграть игру!',
      ok: 'Понятно'
    },
    ka: {
      roleReveal: 'თქვენი როლი',
      innocent: 'თქვენ ხართ უდანაშაულო',
      impostor: 'თქვენ ხართ თაღლითი',
      jester: 'თქვენ ხართ ჯუკი',
      innocentDescription: 'თქვენ გაქვთ იგივე კითხვა, რაც სხვა უდანაშაულო მოთამაშეებს. დაეხმარეთ თაღლითების პოვნაში!',
      impostorDescription: 'თქვენ გაქვთ სხვა კითხვა! ფარალეთ, რომ გაქვთ იგივე.',
      jesterDescription: 'შეეცადეთ, რომ გაგირიყოთ, რომ მოიგოთ თამაში!',
      ok: 'გასაგებია'
    }
  };

  const t = texts[language];

  const getRoleConfig = () => {
    switch (playerRole) {
      case 'innocent':
        return {
          title: t.innocent,
          description: t.innocentDescription,
          icon: Shield,
          gradient: 'from-green-500 to-emerald-500',
          bgColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 0.3)',
          textColor: 'text-green-400'
        };
      case 'impostor':
        return {
          title: t.impostor,
          description: t.impostorDescription,
          icon: Crown,
          gradient: 'from-red-500 to-rose-500',
          bgColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          textColor: 'text-red-400'
        };
      case 'jester':
        return {
          title: t.jester,
          description: t.jesterDescription,
          icon: Zap,
          gradient: 'from-purple-500 to-violet-500',
          bgColor: 'rgba(168, 85, 247, 0.1)',
          borderColor: 'rgba(168, 85, 247, 0.3)',
          textColor: 'text-purple-400'
        };
      default:
        return {
          title: '',
          description: '',
          icon: Shield,
          gradient: 'from-gray-500 to-slate-500',
          bgColor: 'rgba(107, 114, 128, 0.1)',
          borderColor: 'rgba(107, 114, 128, 0.3)',
          textColor: 'text-gray-400'
        };
    }
  };

  const roleConfig = getRoleConfig();
  const IconComponent = roleConfig.icon;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className={`max-w-md w-full mx-4 transform transition-all duration-300 ${
            isVisible 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 translate-y-4'
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-modal-title"
          aria-describedby="role-modal-description"
        >
          {/* Main Content Card */}
          <div 
            className="backdrop-blur-sm rounded-3xl p-8 border shadow-2xl"
            style={{ 
              backgroundColor: '#101721',
              borderColor: roleConfig.borderColor
            }}
          >
            {/* Header with Icon */}
            <div className="text-center mb-8">
              <div 
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-lg"
                style={{ 
                  backgroundColor: '#3B82F6',
                  boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)'
                }}
              >
                <IconComponent className="w-10 h-10 text-white" />
              </div>
              
              <h2 id="role-modal-title" className="text-white text-lg font-semibold mb-2 opacity-80">
                {t.roleReveal}
              </h2>
            </div>

            {/* Role Title - Large and Bold */}
            <div className="text-center mb-6">
              <h3 
                className={`text-4xl font-bold mb-4 ${roleConfig.textColor} transform transition-all duration-500 delay-200 ${
                  isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
              >
                {roleConfig.title}
              </h3>
              
              {/* Decorative line */}
              <div 
                className={`w-24 h-1 rounded-full mx-auto mb-6 bg-gradient-to-r ${roleConfig.gradient} transform transition-all duration-500 delay-300 ${
                  isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
              />
            </div>

            {/* Role Description */}
            <div 
              className="backdrop-blur-sm rounded-2xl p-6 mb-8 border"
              style={{ 
                backgroundColor: roleConfig.bgColor,
                borderColor: roleConfig.borderColor
              }}
            >
              <p 
                id="role-modal-description" 
                className={`text-gray-300 text-center text-sm leading-relaxed transform transition-all duration-500 delay-400 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}
              >
                {roleConfig.description}
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={onClose}
              className={`w-full bg-gradient-to-r ${roleConfig.gradient} text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current ${
                isVisible ? 'scale-100' : 'scale-95'
              }`}
              style={{ 
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
              }}
              autoFocus
            >
              {t.ok}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
