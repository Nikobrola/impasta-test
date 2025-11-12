import { useState, useRef, useEffect } from 'react';
import { Camera, User, Upload, TowerControl as GameController2, MessageSquare } from 'lucide-react';
import { Language } from '../types';

interface HomeScreenProps {
  onGameModeSelect: (mode: 'questions' | 'words') => void;
  username: string;
  onUsernameChange: (username: string) => void;
  avatar?: string;
  onAvatarChange: (avatar: string) => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export default function HomeScreen({
  onGameModeSelect,
  username,
  onUsernameChange,
  avatar,
  onAvatarChange,
  language,
  onLanguageChange
}: HomeScreenProps) {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [isAvatarFading, setIsAvatarFading] = useState(false);
  const photoMenuRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);


  const handleTakePhoto = () => {
    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Try modern camera API first (for supported browsers)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && !isMobile) {
      // For desktop browsers, try to access camera directly
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          // Create video element to capture photo
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();
          
          // Create canvas to capture frame
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          video.addEventListener('loadedmetadata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx?.drawImage(video, 0, 0);
            
            // Convert to data URL
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            
            // Stop the stream
            stream.getTracks().forEach(track => track.stop());
            
            // Set the avatar
            onAvatarChange(dataURL);
            setShowPhotoMenu(false);
            setIsAvatarFading(false);
          });
        })
        .catch((error) => {
          console.log('Camera access denied or not available:', error);
          // Fallback to file input with camera capture
          openCameraFileInput();
        });
    } else {
      // For mobile or browsers without getUserMedia, use file input
      openCameraFileInput();
    }
  };

  const openCameraFileInput = () => {
    // Create a file input specifically for camera capture
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    // Try different capture methods for better compatibility
    const captureMethods = ['environment', 'user', 'camera'];
    let methodIndex = 0;
    
    const tryNextMethod = () => {
      if (methodIndex < captureMethods.length) {
        input.setAttribute('capture', captureMethods[methodIndex]);
        console.log(`Trying camera capture method: ${captureMethods[methodIndex]}`);
        methodIndex++;
        
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            console.log('Camera capture file:', {
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              method: captureMethods[methodIndex - 1]
            });
            
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              onAvatarChange(result);
              setShowPhotoMenu(false);
              setIsAvatarFading(false);
            };
            reader.readAsDataURL(file);
          }
        };
        
        input.onerror = () => {
          console.log(`Camera method ${captureMethods[methodIndex - 1]} failed, trying next...`);
          tryNextMethod();
        };
        
        input.click();
      } else {
        console.log('All camera methods failed, using regular file picker');
        // Final fallback - regular file picker
        input.removeAttribute('capture');
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          onAvatarChange(result);
          setShowPhotoMenu(false);
          setIsAvatarFading(false);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
      }
    };
    
    tryNextMethod();
  };

  const handleUploadPhoto = () => {
    // Create a file input specifically for gallery access (no camera)
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // Explicitly remove any camera capture attributes
    input.removeAttribute('capture');
    input.setAttribute('multiple', 'false');
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('Gallery upload file:', {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          onAvatarChange(result);
          setShowPhotoMenu(false);
          setIsAvatarFading(false);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };


  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (photoMenuRef.current && !photoMenuRef.current.contains(event.target as Node)) {
        setShowPhotoMenu(false);
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getFlagEmoji = (lang: Language) => {
    switch (lang) {
      case 'en': return '🇺🇸';
      case 'ru': return '🇷🇺';
      case 'ka': return '🇬🇪';
      default: return '🇺🇸';
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
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg" style={{ backgroundColor: '#3B82F6', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)' }}>
              <span className="text-2xl">🎮</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 leading-tight" style={{ color: '#FFFFFF' }}>
            Find the World's most
            <span className="block" style={{ color: '#3B82F6' }}>
              Amazing Game
            </span>
          </h1>
          <p className="text-lg" style={{ color: '#D1D5DB' }}>Choose your game mode and start playing</p>
        </div>

        {/* Profile Section */}
        <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
          <div className="flex flex-col items-center space-y-6">
            {/* Avatar or Selection Menu */}
            <div className="relative" ref={photoMenuRef}>
              {!showPhotoMenu ? (
                <div className={`flex flex-col items-center space-y-3 ${!isAvatarFading ? 'animate-in fade-in-0 slide-in-from-top-2 duration-500' : ''}`}>
                  <button
                    onClick={() => {
                      setIsAvatarFading(true);
                      setTimeout(() => {
                        setShowPhotoMenu(true);
                        setIsAvatarFading(false);
                      }, 300);
                    }}
                    className={`relative w-24 h-24 sm:w-20 sm:h-20 rounded-full overflow-hidden shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 transition-all duration-300 group ${isAvatarFading ? 'animate-out fade-out-0 duration-300' : ''}`}
                  >
                    {avatar && avatar.startsWith('data:') ? (
                      <img 
                        src={avatar} 
                        alt="Avatar" 
                        className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : avatar && !avatar.startsWith('data:') ? (
                      <div className={`w-full h-full ${avatar} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                        <User className="w-8 h-8 text-white transition-transform duration-300 group-hover:rotate-12" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                        <User className="w-8 h-8 text-white group-hover:scale-125 transition-transform duration-300 group-hover:rotate-12" />
                      </div>
                    )}
                  </button>
                  
                  {/* Hint text */}
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Camera className="w-3 h-3" />
                    <span>Tap to change</span>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center space-y-4">
                  <div className="flex flex-row gap-3 w-full max-w-md">
                    <button
                      onClick={handleTakePhoto}
                      className="flex items-center space-x-3 px-4 py-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl transition-all duration-300 text-left group border border-orange-500/50 transform flex-1 hover:scale-105 active:scale-95 animate-in slide-in-from-left-4 fade-in-0 duration-500"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white block">Take Photo</span>
                        <span className="text-xs text-gray-300">Use camera</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={handleUploadPhoto}
                      className="flex items-center space-x-3 px-4 py-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl transition-all duration-300 text-left group border border-blue-500/50 transform flex-1 hover:scale-105 active:scale-95 animate-in slide-in-from-right-4 fade-in-0 duration-500 delay-150"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white block">Upload Photo</span>
                        <span className="text-xs text-gray-300">From gallery</span>
                      </div>
                    </button>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowPhotoMenu(false);
                      // Reset fade state after a brief delay to ensure smooth transition
                      setTimeout(() => {
                        setIsAvatarFading(false);
                      }, 100);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-400 transition-colors duration-200 underline animate-in fade-in-0 duration-500 delay-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Username Input */}
            <div className="w-full relative">
              <input
                type="text"
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                placeholder="Enter your username..."
                className="w-full px-6 py-4 rounded-2xl text-center font-medium backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: 'rgba(59, 130, 246, 0.2)', 
                  borderColor: 'rgba(59, 130, 246, 0.4)', 
                  color: '#FFFFFF',
                  border: '1px solid'
                }}
                maxLength={15}
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/10 to-orange-500/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>
        </div>

        {/* Game Mode Cards */}
        <div className="space-y-4 mb-8">
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => {
                console.log('Questions button clicked, username:', username);
                onGameModeSelect('questions');
              }}
              disabled={!username.trim()}
              className="group relative rounded-3xl p-6 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-1"
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
                    <MessageSquare className="w-7 h-7 text-white" />
                  </div>
              <div className="text-left">
                    <h3 className="text-lg font-bold text-white mb-1">Questions Game</h3>
                    <p className="text-sm text-white/80">Answer questions and find impostors</p>
                  </div>
                </div>
                <div className="text-white/80 text-sm font-medium group-hover:text-white transition-colors duration-300">→</div>
              </div>
            </button>

            <button
              onClick={() => {
                console.log('Words button clicked, username:', username);
                onGameModeSelect('words');
              }}
              disabled={!username.trim()}
              className="group relative rounded-3xl p-6 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-1"
              style={{ 
                backgroundColor: '#22D3EE',
                boxShadow: '0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.2), 0 10px 25px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(34, 211, 238, 0.8)'
              }}
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                    <GameController2 className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-white mb-1">Word Game</h3>
                    <p className="text-sm text-white/80">Get words and blend in with others</p>
                  </div>
                </div>
                <div className="text-white/80 text-sm font-medium group-hover:text-white transition-colors duration-300">→</div>
            </div>
          </button>

            </div>
        </div>

        {/* Language Selector */}
        <div className="fixed bottom-6 left-6">
          <div className="relative" ref={languageMenuRef}>
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="w-12 h-12 bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-xl transform hover:scale-110 transition-all duration-300 border border-gray-600/50"
            >
              {getFlagEmoji(language)}
            </button>
            
            {showLanguageMenu && (
              <div className="absolute bottom-16 left-0 bg-gray-800/95 backdrop-blur-md rounded-lg shadow-2xl p-2 space-y-1 z-50 animate-in slide-in-from-bottom-2 duration-200 border border-gray-600/50">
                <button
                  onClick={() => {
                    onLanguageChange('en');
                    setShowLanguageMenu(false);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-700/50 rounded-lg transition-all duration-200 w-full hover:scale-105"
                >
                  <span>🇺🇸</span>
                  <span className="text-sm font-medium text-white">English</span>
                </button>
                <button
                  onClick={() => {
                    onLanguageChange('ru');
                    setShowLanguageMenu(false);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-700/50 rounded-lg transition-all duration-200 w-full hover:scale-105"
                >
                  <span>🇷🇺</span>
                  <span className="text-sm font-medium text-white">Русский</span>
                </button>
                <button
                  onClick={() => {
                    onLanguageChange('ka');
                    setShowLanguageMenu(false);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-700/50 rounded-lg transition-all duration-200 w-full hover:scale-105"
                >
                  <span>🇬🇪</span>
                  <span className="text-sm font-medium text-white">ქართული</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}