
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { EffectsPanel } from './components/EffectsPanel';
import { AudioPlayer } from './components/AudioPlayer';
import { Loader } from './components/Loader';
import { Effect, EffectSettings, initialEffectSettings } from './types';
import { applyEffects, bufferToWave } from './services/audioProcessor';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { AdSensePanel } from './components/AdSensePanel';

const App: React.FC = () => {
  const [originalBuffer, setOriginalBuffer] = useState<AudioBuffer | null>(null);
  const [processedBuffer, setProcessedBuffer] = useState<AudioBuffer | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [effectSettings, setEffectSettings] = useState<EffectSettings>(initialEffectSettings);

  const handleFileChange = (buffer: AudioBuffer, name: string) => {
    setOriginalBuffer(buffer);
    setFileName(name);
    setProcessedBuffer(null);
    setEffectSettings(initialEffectSettings);
    setError(null);
  };

  const handleProcessAudio = useCallback(async () => {
    if (!originalBuffer) return;

    setIsLoading(true);
    setError(null);
    setProcessedBuffer(null);

    try {
      const processed = await applyEffects(originalBuffer, effectSettings);
      setProcessedBuffer(processed);
    } catch (err) {
      console.error('Error processing audio:', err);
      setError('An error occurred during audio processing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [originalBuffer, effectSettings]);

  const handleDownload = () => {
    if (!processedBuffer || !fileName) return;

    // Convert AudioBuffer to WAV Blob
    const wavBlob = new Blob([bufferToWave(processedBuffer)], { type: 'audio/wav' });

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = URL.createObjectURL(wavBlob);

    const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
    const alteredFileName = `${baseName}_altered.wav`;
    link.download = alteredFileName;

    // Programmatically click the link to trigger the download
    document.body.appendChild(link);
    link.click();
    
    // Clean up by removing the link and revoking the URL
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const resetState = () => {
    setOriginalBuffer(null);
    setProcessedBuffer(null);
    setFileName('');
    setIsLoading(false);
    setError(null);
    setEffectSettings(initialEffectSettings);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 font-sans flex flex-col">
      <Header />
      <div className="container mx-auto px-4 md:px-8 py-4">
        <AdSensePanel adType="Top Banner" className="h-24 mb-6" />
      </div>
      <main className="flex-grow container mx-auto px-4 md:px-8 flex flex-col">
        {!originalBuffer ? (
          <div className="flex-grow flex items-center justify-center py-8">
            <FileUpload onFileChange={handleFileChange} setIsLoading={setIsLoading} setError={setError} />
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-full max-w-5xl">
              <div className="bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 flex flex-col gap-8">
                  <div className="flex justify-between items-start">
                  <div>
                      <h2 className="text-xl md:text-2xl font-bold text-white">Audio Loaded</h2>
                      <p className="text-gray-400 truncate max-w-xs md:max-w-md">{fileName}</p>
                  </div>
                  <button onClick={resetState} className="text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                      New Audio
                  </button>
                  </div>

                  <EffectsPanel settings={effectSettings} onSettingsChange={setEffectSettings} />
                  
                  <AdSensePanel adType="In-Content Rectangle" className="h-64 my-4" />
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button
                      onClick={handleProcessAudio}
                      disabled={isLoading}
                      className="w-full sm:w-auto flex-grow bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                      {isLoading ? 'Processing...' : 'Apply Effects'}
                  </button>
                  {processedBuffer && (
                      <button
                          onClick={handleDownload}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                      >
                          <DownloadIcon />
                          Download
                      </button>
                  )}
                  </div>
                  
                  {isLoading && <Loader />}
                  {error && <div className="text-red-500 mt-4 text-center">{error}</div>}
                  
                  {processedBuffer && !isLoading && (
                  <div className="mt-4 space-y-6">
                      <div>
                          <h3 className="text-lg font-semibold mb-2 text-white">Preview</h3>
                          <AudioPlayer buffer={processedBuffer} />
                      </div>
                       <AdSensePanel adType="Below Player Ad" className="h-24" />
                  </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </main>
      <div className="container mx-auto px-4 md:px-8 py-4">
        <AdSensePanel adType="Bottom Banner" className="h-24 mt-6" />
      </div>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Powered by Web Audio API</p>
      </footer>
    </div>
  );
};

export default App;
