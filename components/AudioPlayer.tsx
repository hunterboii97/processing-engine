
import React, { useState, useEffect, useRef } from 'react';
import { bufferToWave } from '../services/audioProcessor';

interface AudioPlayerProps {
  buffer: AudioBuffer;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ buffer }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Convert AudioBuffer to a Blob URL
    const wavBlob = new Blob([bufferToWave(buffer)], { type: 'audio/wav' });
    const url = URL.createObjectURL(wavBlob);
    setAudioUrl(url);

    // Cleanup URL on unmount
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [buffer]);

  return (
    <div className="w-full">
      {audioUrl && (
        <audio
          ref={audioRef}
          controls
          src={audioUrl}
          className="w-full"
        >
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
};
