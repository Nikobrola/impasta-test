import { useState } from 'react';
import { Flame, PartyPopper, Users, Edit3, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { GamePack, WordPack, Language } from '../types';

interface GamePackScreenProps {
  gameMode: 'questions' | 'words';
  onPackSelect: (pack: GamePack | WordPack) => void;
  onBack: () => void;
  language: Language;
}

export default function GamePackScreen({ gameMode, onPackSelect, onBack, language }: GamePackScreenProps) {
  const [selectedPack, setSelectedPack] = useState<GamePack | WordPack | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const texts = {
    en: {
      questionPacks: 'Question Packs',
      wordPacks: 'Word Packs',
      party: 'Party',
      spicy: 'Spicy',
      normal: 'Normal',
      celebrities: 'Celebrities',
      characters: 'Characters',
      objects: 'Everyday Objects',
      custom: 'Make Your Own',
      partyDesc: 'Fun party questions for everyone',
      spicyDesc: 'Bold questions for adults',
      normalDesc: 'Classic everyday questions',
      celebritiesDesc: 'Famous people and personalities',
      charactersDesc: 'Fictional characters from movies & TV',
      objectsDesc: 'Common items and things',
      customDesc: 'Create your own questions',
      back: 'Back',
      selectPack: 'Select a pack to continue',
      selected: 'Selected',
      confirmSelection: 'Continue with this pack',
      loading: 'Loading...',
      error: 'Something went wrong. Please try again.',
      packRequired: 'Please select a pack to continue'
    },
    ru: {
      questionPacks: 'Наборы Вопросов',
      wordPacks: 'Наборы Слов',
      party: 'Вечеринка',
      spicy: 'Острые',
      normal: 'Обычные',
      celebrities: 'Знаменитости',
      characters: 'Персонажи',
      objects: 'Предметы',
      custom: 'Создать свои',
      partyDesc: 'Веселые вопросы для всех',
      spicyDesc: 'Смелые вопросы для взрослых',
      normalDesc: 'Классические повседневные вопросы',
      celebritiesDesc: 'Известные люди и личности',
      charactersDesc: 'Вымышленные персонажи из фильмов и ТВ',
      objectsDesc: 'Обычные предметы и вещи',
      customDesc: 'Создайте свои вопросы',
      back: 'Назад',
      selectPack: 'Выберите набор для продолжения',
      selected: 'Выбрано',
      confirmSelection: 'Продолжить с этим набором',
      loading: 'Загрузка...',
      error: 'Что-то пошло не так. Попробуйте еще раз.',
      packRequired: 'Пожалуйста, выберите набор для продолжения'
    },
    ka: {
      questionPacks: 'კითხვების პაკეტები',
      wordPacks: 'სიტყვების პაკეტები',
      party: 'ღონისძიება',
      spicy: 'მწვავე',
      normal: 'ჩვეულებრივი',
      celebrities: 'ცნობილი პიროვნებები',
      characters: 'პერსონაჟები',
      objects: 'ყოველდღიური ნივთები',
      custom: 'შექმენით საკუთარი',
      partyDesc: 'სახალისო კითხვები ყველასთვის',
      spicyDesc: 'თამამი კითხვები ზრდასრულებისთვის',
      normalDesc: 'კლასიკური ყოველდღიური კითხვები',
      celebritiesDesc: 'ცნობილი ადამიანები და პიროვნებები',
      charactersDesc: 'ფიქციური პერსონაჟები ფილმებიდან და TV-დან',
      objectsDesc: 'ჩვეულებრივი ნივთები და საგნები',
      customDesc: 'შექმენით საკუთარი კითხვები',
      back: 'უკან',
      selectPack: 'გააგრძელეთ პაკეტის არჩევით',
      selected: 'არჩეული',
      confirmSelection: 'გააგრძელეთ ამ პაკეტით',
      loading: 'იტვირთება...',
      error: 'რაღაც შეცდომა მოხდა. გთხოვთ, სცადეთ კვლავ.',
      packRequired: 'გთხოვთ, აირჩიოთ პაკეტი გასაგრძელებლად'
    }
  };

  const t = texts[language];

  const questionPacks = [
    { id: 'party' as GamePack, name: t.party, desc: t.partyDesc, icon: PartyPopper, color: 'from-pink-500 to-rose-500', emoji: '🎉' },
    { id: 'spicy' as GamePack, name: t.spicy, desc: t.spicyDesc, icon: Flame, color: 'from-red-500 to-orange-500', emoji: '🌶️' },
    { id: 'normal' as GamePack, name: t.normal, desc: t.normalDesc, icon: Users, color: 'from-blue-500 to-indigo-500', emoji: '💬' },
    { id: 'custom' as GamePack, name: t.custom, desc: t.customDesc, icon: Edit3, color: 'from-purple-500 to-violet-500', emoji: '✏️' }
  ];

  const wordPacks = [
    { id: 'celebrities' as WordPack, name: t.celebrities, desc: t.celebritiesDesc, icon: Users, color: 'from-yellow-500 to-orange-500', emoji: '⭐' },
    { id: 'characters' as WordPack, name: t.characters, desc: t.charactersDesc, icon: Users, color: 'from-purple-500 to-pink-500', emoji: '🎭' },
    { id: 'objects' as WordPack, name: t.objects, desc: t.objectsDesc, icon: Users, color: 'from-green-500 to-teal-500', emoji: '📦' },
    { id: 'spicy' as WordPack, name: t.spicy, desc: t.spicyDesc, icon: Flame, color: 'from-red-500 to-orange-500', emoji: '🌶️' },
    { id: 'custom' as WordPack, name: t.custom, desc: t.customDesc, icon: Edit3, color: 'from-gray-500 to-slate-500', emoji: '✏️' }
  ];

  const packs = gameMode === 'questions' ? questionPacks : wordPacks;
  const title = gameMode === 'questions' ? t.questionPacks : t.wordPacks;

  const handlePackSelect = async (pack: GamePack | WordPack) => {
    setError(null);
    setSelectedPack(pack);
    
    // Add a small delay for better UX
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      onPackSelect(pack);
    } catch {
      setError(t.error);
      setSelectedPack(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (!isLoading) {
      onBack();
    }
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
          <div className="flex items-center justify-center mb-6">
            <button
              onClick={handleBack}
              disabled={isLoading}
              className="mr-4 p-3 rounded-full bg-gray-600/80 backdrop-blur-sm hover:bg-gray-500/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-gray-500/70"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl shadow-lg" style={{ backgroundColor: '#3B82F6', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)' }}>
                <span className="text-lg">📦</span>
              </div>
              <h1 className="text-3xl font-bold" style={{ color: '#FFFFFF' }}>
                {title}
              </h1>
            </div>
          </div>
          <p className="text-gray-400 text-lg">Choose your preferred pack</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Pack Selection */}
        <div className="space-y-4">
          {packs.map((pack) => {
            const Icon = pack.icon;
            const isSelected = selectedPack === pack.id;
            const isDisabled = isLoading;
            
            // Define pack colors according to specifications
            const packColors = {
              'party': '#F59E0B', // Party Pack - Amber/Gold
              'normal': '#22D3EE', // Normal Pack - Cyan
              'custom': '#10B981', // Custom Pack - Emerald Green
              'spicy': '#EF4444', // Spicy Pack - Coral Red
              'celebrities': '#3B82F6', // Celebrities Pack - Bright Electric Blue
              'characters': '#A855F7', // Characters Pack - Purple
              'objects': '#22D3EE' // Objects Pack - Cyan (same as normal)
            };
            
            const bgColor = packColors[pack.id as keyof typeof packColors] || '#3B82F6';
            
            return (
              <button
                key={pack.id}
                onClick={() => handlePackSelect(pack.id)}
                disabled={isDisabled}
                className={`
                  group relative rounded-3xl p-6 hover:opacity-90 transition-all duration-300 w-full shadow-lg hover:shadow-xl hover:-translate-y-1
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${isSelected ? 'ring-2 ring-white ring-opacity-50 shadow-xl scale-105' : ''}
                `}
                style={{ 
                  backgroundColor: bgColor,
                  boxShadow: `0 0 20px ${bgColor}40, 0 0 40px ${bgColor}20, 0 10px 25px rgba(0, 0, 0, 0.3)`,
                  border: `1px solid ${bgColor}80`
                }}
              >
                {/* Hover overlay */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="w-7 h-7 text-white drop-shadow-lg" />
                  </div>
                )}
                
                {/* Loading overlay */}
                {isLoading && isSelected && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-3xl">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-white mb-1">{pack.name}</h3>
                      <p className="text-sm text-white/80">{pack.desc}</p>
                    </div>
                  </div>
                  <div className="text-white/80 text-sm font-medium group-hover:text-white transition-colors duration-300">→</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        {selectedPack && !isLoading && (
          <div className="mt-8">
            <button
              onClick={() => handlePackSelect(selectedPack)}
              className="w-full text-white py-4 px-6 rounded-2xl transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1"
              style={{ 
                backgroundColor: '#10B981',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2), 0 10px 25px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(16, 185, 129, 0.8)'
              }}
            >
              {t.confirmSelection}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}