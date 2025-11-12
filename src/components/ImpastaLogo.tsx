import React from 'react';

export function ImpastaLogo() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="text-center space-y-6">
        {/* Main Logo */}
        <div className="space-y-2">
          <h1 className="text-6xl md:text-8xl font-bold text-white tracking-wider">
            IMPASTA
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-light tracking-wide">
            with pasta
          </p>
        </div>
        
        {/* Pasta decorations */}
        <div className="flex justify-center space-x-4 text-3xl opacity-70">
          <span className="animate-bounce">🍝</span>
          <span className="animate-pulse">🍜</span>
          <span className="animate-bounce delay-100">🥄</span>
        </div>
      </div>
    </div>
  );
}