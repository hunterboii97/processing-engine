
import React, { useState, useCallback } from 'react';
import { UploadCloudIcon } from './icons/UploadCloudIcon';
import { LinkIcon } from './icons/LinkIcon';

interface FileUploadProps {
  onFileChange: (buffer: AudioBuffer, name: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, setIsLoading, setError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [url, setUrl] = useState('');

  const handleFile = useCallback(async (file: File) => {
    if (!file || !file.type.startsWith('audio/')) {
        setError('Please upload a valid audio file.');
        return;
    }

    setIsLoading(true);
    setError(null);
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      onFileChange(audioBuffer, file.name);
    } catch (e) {
      console.error('Error decoding audio data:', e);
      setError('Could not process the audio file. It might be corrupted or in an unsupported format.');
    } finally {
      setIsLoading(false);
    }
  }, [onFileChange, setIsLoading, setError]);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (!youtubeRegex.test(url)) {
        setError('Please enter a valid YouTube URL.');
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
        // Use a public API to get the audio stream URL from a YouTube video
        const cobaltResponse = await fetch('https://api.cobalt.tools/api/json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ url: url, isAudioOnly: true, aFormat: 'mp3' })
        });

        if (!cobaltResponse.ok) throw new Error(`Failed to get download link (Status: ${cobaltResponse.status}).`);
        
        const cobaltData = await cobaltResponse.json();

        if (cobaltData.status !== 'stream') {
            throw new Error(cobaltData.text || 'Could not process this YouTube video. It might be private or region-locked.');
        }

        const audioUrl = cobaltData.url;
        const videoTitle = cobaltData.title ? `${cobaltData.title}.mp3` : 'youtube_audio.mp3';

        // Fetch the audio file itself
        const audioFileResponse = await fetch(audioUrl);
        if (!audioFileResponse.ok) throw new Error('Failed to download the audio file from the provided link.');
        
        const arrayBuffer = await audioFileResponse.arrayBuffer();

        // Decode the audio data and pass it to the main app state
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        onFileChange(audioBuffer, videoTitle);

    } catch (err: any) {
        console.error('Error fetching YouTube audio:', err);
        setError(err.message || 'An error occurred while fetching the YouTube audio.');
    } finally {
        setIsLoading(false);
        setUrl('');
    }
};

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-4xl text-center">
      <div 
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative block w-full rounded-lg border-2 border-dashed border-gray-600 p-20 text-center hover:border-gray-500 transition-colors duration-200 ${isDragging ? 'border-brand-primary bg-gray-800' : ''}`}
      >
        <UploadCloudIcon />
        <p className="mt-4 block text-xl font-semibold text-white">
          Drag and drop audio file
        </p>
        <p className="text-gray-400 my-1">or</p>
        <label htmlFor="file-upload" className="cursor-pointer font-semibold text-brand-primary hover:text-brand-secondary transition-colors duration-200">
          <span>select a file</span>
          <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="audio/*" onChange={handleInputChange} />
        </label>
        <p className="text-xs text-gray-500 mt-2">MP3, WAV, FLAC, M4A, etc.</p>
      </div>

      <div className="relative flex items-center my-6">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="flex-shrink mx-4 text-gray-500 font-semibold">OR</span>
          <div className="flex-grow border-t border-gray-700"></div>
      </div>

      <form onSubmit={handleUrlSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon />
            </div>
            <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube URL here"
                className="bg-gray-800 border border-gray-600 text-gray-300 placeholder-gray-500 text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary block w-full pl-10 p-2.5 transition-colors"
                aria-label="YouTube URL"
            />
        </div>
        <button 
            type="submit"
            className="w-full sm:w-auto bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2.5 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50"
        >
            Load
        </button>
      </form>
    </div>
  );
};
