import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Language } from '../types';

interface CustomWordCreationScreenProps {
  onSave: (innocentWord: string, impostorWord: string) => void;
  onBack: () => void;
  language: Language;
}

export default function CustomWordCreationScreen({ onSave, onBack, language }: CustomWordCreationScreenProps) {
  const [innocentWord, setInnocentWord] = useState('');
  const [impostorWord, setImpostorWord] = useState('');
  const [error, setError] = useState<string | null>(null);

  const MAX_LENGTH = 50;
  const MIN_LENGTH = 2;

  const texts = {
    en: {
      title: 'Create Custom Words',
      innocentLabel: 'Innocent Word (for non-impostors)',
      impostorLabel: 'Impostor Word (for impostors)',
      innocentPlaceholder: 'e.g., "Apple"',
      impostorPlaceholder: 'e.g., "Banana"',
      save: 'Save Words & Start Game',
      back: 'Back to Packs',
      required: 'Both words are required.',
      minLength: `Word must be at least ${MIN_LENGTH} characters.`,
      maxLength: `Word must be less than ${MAX_LENGTH} characters.`,
      success: 'Custom words saved!'
    },
    ru: {
      title: 'Создать свои слова',
      innocentLabel: 'Слово для мирных (для не-самозванцев)',
      impostorLabel: 'Слово для самозванцев (для самозванцев)',
      innocentPlaceholder: 'напр., "Яблоко"',
      impostorPlaceholder: 'напр., "Банан"',
      save: 'Сохранить слова и начать игру',
      back: 'Назад к пакетам',
      required: 'Оба слова обязательны.',
      minLength: `Слово должно быть не менее ${MIN_LENGTH} символов.`,
      maxLength: `Слово должно быть менее ${MAX_LENGTH} символов.`,
      success: 'Пользовательские слова сохранены!'
    },
    ka: {
      title: 'შექმენით საკუთარი სიტყვები',
      innocentLabel: 'უდანაშაულო სიტყვა (არა-იმპოსტორებისთვის)',
      impostorLabel: 'იმპოსტორის სიტყვა (იმპოსტორებისთვის)',
      innocentPlaceholder: 'მაგ., "ვაშლი"',
      impostorPlaceholder: 'მაგ., "ბანანი"',
      save: 'სიტყვების შენახვა და თამაშის დაწყება',
      back: 'უკან პაკეტებში',
      required: 'ორივე სიტყვა სავალდებულოა.',
      minLength: `სიტყვა უნდა იყოს მინიმუმ ${MIN_LENGTH} სიმბოლო.`,
      maxLength: `სიტყვა უნდა იყოს ${MAX_LENGTH} სიმბოლოზე ნაკლები.`,
      success: 'მორგებული სიტყვები შენახულია!'
    }
  };

  const t = texts[language];

  const handleSave = () => {
    if (!innocentWord.trim() || !impostorWord.trim()) {
      setError(t.required);
      return;
    }
    if (innocentWord.length < MIN_LENGTH || impostorWord.length < MIN_LENGTH) {
      setError(t.minLength);
      return;
    }
    if (innocentWord.length > MAX_LENGTH || impostorWord.length > MAX_LENGTH) {
      setError(t.maxLength);
      return;
    }
    setError(null);
    onSave(innocentWord, impostorWord);
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg" style={{ backgroundColor: '#22D3EE', boxShadow: '0 10px 25px rgba(34, 211, 238, 0.25)' }}>
              <span className="text-2xl">📝</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 leading-tight" style={{ color: '#FFFFFF' }}>
            {t.title}
          </h1>
          <p className="text-lg" style={{ color: '#D1D5DB' }}>Create 1 word for innocents and 1 for impostors</p>
        </div>

        {/* Input Fields */}
        <div className="space-y-6 mb-8">
          {/* Innocent Word */}
          <div className="relative">
            <label className="block text-lg font-medium mb-2" style={{ color: '#22D3EE' }}>{t.innocentLabel}</label>
            <input
              type="text"
              className="w-full p-4 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-22D3EE/50 border transition-all duration-300"
              style={{ backgroundColor: 'rgba(34, 211, 238, 0.2)', borderColor: 'rgba(34, 211, 238, 0.4)' }}
              placeholder={t.innocentPlaceholder}
              value={innocentWord}
              onChange={(e) => setInnocentWord(e.target.value)}
              maxLength={MAX_LENGTH}
            />
            <span className="absolute bottom-3 right-3 text-sm" style={{ color: '#D1D5DB' }}>
              {innocentWord.length}/{MAX_LENGTH}
            </span>
          </div>

          {/* Impostor Word */}
          <div className="relative">
            <label className="block text-lg font-medium mb-2" style={{ color: '#EF4444' }}>{t.impostorLabel}</label>
            <input
              type="text"
              className="w-full p-4 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-EF4444/50 border transition-all duration-300"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
              placeholder={t.impostorPlaceholder}
              value={impostorWord}
              onChange={(e) => setImpostorWord(e.target.value)}
              maxLength={MAX_LENGTH}
            />
            <span className="absolute bottom-3 right-3 text-sm" style={{ color: '#D1D5DB' }}>
              {impostorWord.length}/{MAX_LENGTH}
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
