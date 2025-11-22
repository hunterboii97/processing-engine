
import React from 'react';
import { WaveformIcon } from './icons/WaveformIcon';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-center">
        <WaveformIcon />
        <h1 className="text-2xl md:text-3xl font-bold text-white ml-3">
          Audio Alter<span className="text-brand-secondary">FX</span>
        </h1>
      </div>
    </header>
  );
};
