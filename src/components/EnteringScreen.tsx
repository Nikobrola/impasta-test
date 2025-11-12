import React, { useState, useEffect } from 'react';

interface EnteringScreenProps {
  onEnter: () => void;
}

export default function EnteringScreen({ onEnter }: EnteringScreenProps) {
  const [canEnter, setCanEnter] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanEnter(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleEnter = () => {
    if (canEnter) {
      onEnter();
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Compact Logo */}
        <div className="space-y-2">
          <h1 className="text-6xl md:text-7xl font-bold text-white tracking-wider">
            IMPASTA
          </h1>
          <p className="text-base md:text-lg text-gray-300 font-light tracking-wide">
            with pasta
          </p>
        </div>
        
        {/* Pasta decorations */}
        <div className="flex justify-center space-x-3 text-xl opacity-70">
          <span className="animate-bounce">🍝</span>
          <span className="animate-pulse">🍜</span>
          <span className="animate-bounce delay-100">🥄</span>
        </div>
        
        {/* Status text */}
        <p className="text-base text-gray-300">
          {canEnter ? 'Ready to play!' : 'Loading...'}
        </p>
        
        {/* Enter button */}
        <button
          onClick={handleEnter}
          disabled={!canEnter}
          className={`px-8 py-3 text-white text-base font-bold rounded-full shadow-lg transform active:scale-95 ${
            canEnter
              ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-xl hover:scale-105 animate-pulse'
              : 'bg-gray-500 cursor-not-allowed opacity-50'
          }`}
        >
          {canEnter ? 'Enter Game' : 'Please Wait...'}
        </button>
      </div>
    </div>
  );
}