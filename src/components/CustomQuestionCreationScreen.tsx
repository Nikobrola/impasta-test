import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Language } from '../types';

interface CustomQuestionCreationScreenProps {
  onSave: (innocentQuestion: string, impostorQuestion: string) => void;
  onBack: () => void;
  language: Language;
}

export default function CustomQuestionCreationScreen({ onSave, onBack, language }: CustomQuestionCreationScreenProps) {
  const [innocentQuestion, setInnocentQuestion] = useState('');
  const [impostorQuestion, setImpostorQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);

  const MAX_LENGTH = 150;

  const texts = {
    en: {
      title: 'Create Custom Questions',
      innocentLabel: 'Innocent Question (for non-impostors)',
      impostorLabel: 'Impostor Question (for impostors)',
      innocentPlaceholder: 'e.g., "What is your favorite animal?"',
      impostorPlaceholder: 'e.g., "What is your least favorite animal?"',
      save: 'Save Questions & Start Game',
      back: 'Back to Packs',
      required: 'Both questions are required.',
      maxLength: `Question must be less than ${MAX_LENGTH} characters.`,
      success: 'Custom questions saved!'
    },
    ru: {
      title: 'Создать свои вопросы',
      innocentLabel: 'Вопрос для мирных (для не-самозванцев)',
      impostorLabel: 'Вопрос для самозванцев (для самозванцев)',
      innocentPlaceholder: 'напр., "Какое ваше любимое животное?"',
      impostorPlaceholder: 'напр., "Какое ваше наименее любимое животное?"',
      save: 'Сохранить вопросы и начать игру',
      back: 'Назад к пакетам',
      required: 'Оба вопроса обязательны.',
      maxLength: `Вопрос должен быть менее ${MAX_LENGTH} символов.`,
      success: 'Пользовательские вопросы сохранены!'
    },
    ka: {
      title: 'შექმენით საკუთარი კითხვები',
      innocentLabel: 'უდანაშაულო კითხვა (არა-იმპოსტორებისთვის)',
      impostorLabel: 'იმპოსტორის კითხვა (იმპოსტორებისთვის)',
      innocentPlaceholder: 'მაგ., "რომელია თქვენი საყვარელი ცხოველი?"',
      impostorPlaceholder: 'მაგ., "რომელია თქვენი ყველაზე ნაკლებად საყვარელი ცხოველი?"',
      save: 'კითხვების შენახვა და თამაშის დაწყება',
      back: 'უკან პაკეტებში',
      required: 'ორივე კითხვა სავალდებულოა.',
      maxLength: `კითხვა უნდა იყოს ${MAX_LENGTH} სიმბოლოზე ნაკლები.`,
      success: 'მორგებული კითხვები შენახულია!'
    }
  };

  const t = texts[language];

  const handleSave = () => {
    if (!innocentQuestion.trim() || !impostorQuestion.trim()) {
      setError(t.required);
      return;
    }
    if (innocentQuestion.length > MAX_LENGTH || impostorQuestion.length > MAX_LENGTH) {
      setError(t.maxLength);
      return;
    }
    setError(null);
    onSave(innocentQuestion, impostorQuestion);
  };

  return (
    <div className="min-h-screen p-4 relative overflow-hidden" style={{ backgroundColor: '#101721' }}>
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg" style={{ backgroundColor: '#10B981', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.25)' }}>
              <span className="text-2xl">✏️</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 leading-tight" style={{ color: '#FFFFFF' }}>
            {t.title}
          </h1>
          <p className="text-lg" style={{ color: '#D1D5DB' }}>Create 1 question for innocents and 1 for impostors</p>
        </div>

        {/* Input Fields */}
        <div className="space-y-6 mb-8">
          {/* Innocent Question */}
          <div className="relative">
            <label className="block text-lg font-medium mb-2" style={{ color: '#10B981' }}>{t.innocentLabel}</label>
            <textarea
              className="w-full p-4 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-10B981/50 border transition-all duration-300"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: 'rgba(16, 185, 129, 0.4)', minHeight: '100px' }}
              placeholder={t.innocentPlaceholder}
              value={innocentQuestion}
              onChange={(e) => setInnocentQuestion(e.target.value)}
              maxLength={MAX_LENGTH}
            />
            <span className="absolute bottom-3 right-3 text-sm" style={{ color: '#D1D5DB' }}>
              {innocentQuestion.length}/{MAX_LENGTH}
            </span>
          </div>

          {/* Impostor Question */}
          <div className="relative">
            <label className="block text-lg font-medium mb-2" style={{ color: '#EF4444' }}>{t.impostorLabel}</label>
            <textarea
              className="w-full p-4 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-EF4444/50 border transition-all duration-300"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.4)', minHeight: '100px' }}
              placeholder={t.impostorPlaceholder}
              value={impostorQuestion}
              onChange={(e) => setImpostorQuestion(e.target.value)}
              maxLength={MAX_LENGTH}
            />
            <span className="absolute bottom-3 right-3 text-sm" style={{ color: '#D1D5DB' }}>
              {impostorQuestion.length}/{MAX_LENGTH}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-center mb-6">
            <p className="text-red-200 font-medium">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-3"
            style={{
              backgroundColor: '#10B981',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2), 0 10px 25px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(16, 185, 129, 0.8)'
            }}
          >
            <Check className="w-6 h-6 text-white" />
            <span className="font-semibold text-lg text-white">{t.save}</span>
          </button>

          <button
            onClick={onBack}
            className="w-full py-4 backdrop-blur-sm text-white font-medium rounded-2xl transition-all duration-300 border"
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderColor: 'rgba(59, 130, 246, 0.4)',
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)',
            }}
          >
            <ArrowLeft className="inline-block w-5 h-5 mr-2" /> {t.back}
          </button>
        </div>
      </div>
    </div>
  );
}
