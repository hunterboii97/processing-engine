import React, { useState } from 'react';
import { Effect, EffectSettings, initialEffectSettings } from '../types';
import { ReverbIcon } from './icons/ReverbIcon';
import { SpeedIcon } from './icons/SpeedIcon';
import { PanIcon } from './icons/PanIcon';
import { EqualizerIcon } from './icons/EqualizerIcon';
import { DistortionIcon } from './icons/DistortionIcon';
import { TremoloIcon } from './icons/TremoloIcon';
import { LowPassIcon } from './icons/LowPassIcon';

interface EffectsPanelProps {
  settings: EffectSettings;
  onSettingsChange: (settings: EffectSettings) => void;
}

const effectList = [
  { id: Effect.SPEED, icon: <SpeedIcon /> },
  { id: Effect.DISTORTION, icon: <DistortionIcon /> },
  { id: Effect.EQUALIZER, icon: <EqualizerIcon /> },
  { id: Effect.LOW_PASS_FILTER, icon: <LowPassIcon /> },
  { id: Effect.PAN, icon: <PanIcon /> },
  { id: Effect.TREMOLO, icon: <TremoloIcon /> },
  { id: Effect.REVERB, icon: <ReverbIcon /> },
];

// --- Studio-Grade Presets ---
const presets = [
  { name: 'Custom', settings: {} },
  { name: 'Reset to Default', settings: initialEffectSettings },
  {
    name: 'Bass Boosted (Medium)',
    settings: {
        [Effect.EQUALIZER]: { band80: 6, band250: 7, band500: -3, band1k: 0, band2k5: 3, band5k: 2, band10k: -1, enabled: true },
    }
  },
  {
    name: 'Slowed & Reverb',
    settings: {
      [Effect.SPEED]: { rate: 0.85, enabled: true },
      [Effect.REVERB]: { mix: 0.15, decay: 1.57, duration: 1.27, preDelay: 0.03, intensity: 30, enabled: true },
    }
  },
];


const Slider: React.FC<{label: string, value: number, min: number, max: number, step: number, unit: string, displayValue?: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = 
({ label, value, min, max, step, unit, displayValue, onChange }) => (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between text-sm">
        <label className="font-medium text-gray-300">{label}</label>
        <span className="text-brand-secondary font-semibold">{displayValue ?? value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"
      />
    </div>
);

const Toggle: React.FC<{enabled: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({enabled, onChange}) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" checked={enabled} onChange={onChange} className="sr-only peer" />
    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
  </label>
);

export const EffectsPanel: React.FC<EffectsPanelProps> = ({ settings, onSettingsChange }) => {
  const [activeEffect, setActiveEffect] = useState<Effect | null>(null);
  const [selectedPreset, setSelectedPreset] = useState('Custom');
  const [advancedViews, setAdvancedViews] = useState<Set<Effect>>(new Set());

  const toggleAdvancedView = (effect: Effect) => {
    setAdvancedViews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(effect)) newSet.delete(effect);
      else newSet.add(effect);
      return newSet;
    });
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = e.target.value;
    if (presetName === 'Custom') return;

    setSelectedPreset(presetName);
    const preset = presets.find(p => p.name === presetName);

    if (preset) {
        const newSettings = JSON.parse(JSON.stringify(initialEffectSettings));
        for (const effectKey in preset.settings) {
            const key = effectKey as Effect;
            if (newSettings[key] && (preset.settings as any)[key]) {
                Object.assign(newSettings[key], (preset.settings as any)[key]);
            }
        }
        onSettingsChange(newSettings);
        setAdvancedViews(new Set());
        if (activeEffect && !newSettings[activeEffect]?.enabled) {
            setActiveEffect(null);
        }
    }
  };
  
  const handleIntensityChange = (effect: Effect.REVERB | Effect.DISTORTION | Effect.TREMOLO | Effect.LOW_PASS_FILTER, intensity: number) => {
    setSelectedPreset('Custom');
    let newEffectSettings;

    if (effect === Effect.REVERB) {
        const mix = intensity > 0 ? (intensity / 100) * 0.5 : 0;
        const duration = intensity > 0 ? 0.1 + (intensity / 100) * 3.9 : 0.1;
        const decay = intensity > 0 ? 0.1 + (intensity / 100) * 4.9 : 0.1;
        const preDelay = (intensity / 100) * 0.1;
        newEffectSettings = { ...settings[Effect.REVERB], intensity, mix, duration, decay, preDelay };
    } else if (effect === Effect.DISTORTION) {
        const drive = 1 + (intensity / 100) * 99;
        const character = (intensity / 100) * 0.8;
        newEffectSettings = { ...settings[Effect.DISTORTION], intensity, drive, character };
    } else if (effect === Effect.LOW_PASS_FILTER) {
        // from 20kHz down to 20Hz (logarithmic)
        let frequency = 20000 / Math.pow(10, 2 * intensity/100);
        frequency = Math.max(20, Math.min(20000, frequency));
        const q = 1 + (intensity/100) * 4; // Q from 1 to 5
        newEffectSettings = { ...settings[Effect.LOW_PASS_FILTER], intensity, frequency, q };
    } else { // Tremolo
        const depth = intensity / 100;
        const frequency = 2 + (intensity / 100) * 8; // Scale from 2Hz to 10Hz
        newEffectSettings = { ...settings[Effect.TREMOLO], intensity, depth, frequency };
    }
    
    onSettingsChange({ ...settings, [effect]: newEffectSettings });
  };

  const handleSettingChange = <K extends Effect>(effect: K, key: keyof EffectSettings[K], value: any) => {
    setSelectedPreset('Custom');
    onSettingsChange({
      ...settings,
      [effect]: { ...settings[effect], [key]: value },
    });
  };

  const renderEffectControls = () => {
    if (!activeEffect) {
      return <div className="text-center text-gray-500 py-16">Select an effect to adjust its settings.</div>
    }

    const isAdvanced = advancedViews.has(activeEffect);
    const simpleAdvancedEffects = [Effect.REVERB, Effect.DISTORTION, Effect.TREMOLO, Effect.LOW_PASS_FILTER];

    const panValue = settings[Effect.PAN].pan;
    let panDisplay: string;
    if (panValue === 0) panDisplay = 'Center';
    else {
        const percentage = Math.round(Math.abs(panValue) * 100);
        panDisplay = `${percentage}% ${panValue < 0 ? 'L' : 'R'}`;
    }

    return (
      <>
        {simpleAdvancedEffects.includes(activeEffect) && (
          <div className="flex justify-end mb-4 -mt-2">
            <button
              onClick={() => toggleAdvancedView(activeEffect)}
              className="text-sm font-semibold text-brand-secondary hover:text-brand-primary transition-colors"
            >
              {isAdvanced ? 'Simple View' : 'Advanced Settings'}
            </button>
          </div>
        )}
        
        {(() => {
            switch (activeEffect) {
                case Effect.REVERB:
                    return isAdvanced ? (
                        <div className="space-y-4">
                            <Slider label="Mix" value={settings[Effect.REVERB].mix} min={0} max={1} step={0.01} unit="" onChange={(e) => handleSettingChange(Effect.REVERB, 'mix', +e.target.value)} />
                            <Slider label="Decay" value={settings[Effect.REVERB].decay} min={0.1} max={10} step={0.1} unit="s" onChange={(e) => handleSettingChange(Effect.REVERB, 'decay', +e.target.value)} />
                            <Slider label="Duration" value={settings[Effect.REVERB].duration} min={0.1} max={10} step={0.1} unit="s" onChange={(e) => handleSettingChange(Effect.REVERB, 'duration', +e.target.value)} />
                            <Slider label="Pre-delay" value={settings[Effect.REVERB].preDelay} min={0} max={1} step={0.01} unit="s" onChange={(e) => handleSettingChange(Effect.REVERB, 'preDelay', +e.target.value)} />
                        </div>
                    ) : (
                        <Slider label="Intensity" value={settings[Effect.REVERB].intensity} min={0} max={100} step={1} unit="%" onChange={(e) => handleIntensityChange(Effect.REVERB, +e.target.value)} />
                    );
                case Effect.SPEED:
                    return (
                        <div className="space-y-4">
                          <Slider label="Rate" value={settings[Effect.SPEED].rate} min={0.25} max={4} step={0.01} unit="x" onChange={(e) => handleSettingChange(Effect.SPEED, 'rate', +e.target.value)} />
                        </div>
                      );
                case Effect.EQUALIZER:
                    return (
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <Slider label="80 Hz" value={settings[Effect.EQUALIZER].band80} min={-30} max={30} step={1} unit=" dB" onChange={(e) => handleSettingChange(Effect.EQUALIZER, 'band80', +e.target.value)} />
                            <Slider label="250 Hz" value={settings[Effect.EQUALIZER].band250} min={-30} max={30} step={1} unit=" dB" onChange={(e) => handleSettingChange(Effect.EQUALIZER, 'band250', +e.target.value)} />
                            <Slider label="500 Hz" value={settings[Effect.EQUALIZER].band500} min={-30} max={30} step={1} unit=" dB" onChange={(e) => handleSettingChange(Effect.EQUALIZER, 'band500', +e.target.value)} />
                            <Slider label="1 kHz" value={settings[Effect.EQUALIZER].band1k} min={-30} max={30} step={1} unit=" dB" onChange={(e) => handleSettingChange(Effect.EQUALIZER, 'band1k', +e.target.value)} />
                            <Slider label="2.5 kHz" value={settings[Effect.EQUALIZER].band2k5} min={-30} max={30} step={1} unit=" dB" onChange={(e) => handleSettingChange(Effect.EQUALIZER, 'band2k5', +e.target.value)} />
                            <Slider label="5 kHz" value={settings[Effect.EQUALIZER].band5k} min={-30} max={30} step={1} unit=" dB" onChange={(e) => handleSettingChange(Effect.EQUALIZER, 'band5k', +e.target.value)} />
                            <Slider label="10 kHz" value={settings[Effect.EQUALIZER].band10k} min={-30} max={30} step={1} unit=" dB" onChange={(e) => handleSettingChange(Effect.EQUALIZER, 'band10k', +e.target.value)} />
                        </div>
                    );
                case Effect.DISTORTION:
                    return isAdvanced ? (
                        <div className="space-y-4">
                            <Slider label="Drive" value={settings[Effect.DISTORTION].drive} min={1} max={100} step={1} unit="" onChange={(e) => handleSettingChange(Effect.DISTORTION, 'drive', +e.target.value)} />
                            <Slider label="Character" value={settings[Effect.DISTORTION].character} min={0} max={1} step={0.01} unit="" onChange={(e) => handleSettingChange(Effect.DISTORTION, 'character', +e.target.value)} />
                            <Slider label="Tone" value={settings[Effect.DISTORTION].tone} min={200} max={10000} step={100} unit=" Hz" onChange={(e) => handleSettingChange(Effect.DISTORTION, 'tone', +e.target.value)} />
                        </div>
                    ) : (
                      <Slider label="Intensity" value={settings[Effect.DISTORTION].intensity} min={0} max={100} step={1} unit="%" onChange={(e) => handleIntensityChange(Effect.DISTORTION, +e.target.value)} />
                    );
                case Effect.LOW_PASS_FILTER:
                    const filterSettings = settings[Effect.LOW_PASS_FILTER];
                    return (
                        <div className="space-y-4">
                            {isAdvanced ? (
                                <>
                                    <Slider label="Frequency" value={filterSettings.frequency} min={20} max={20000} step={1} unit=" Hz" onChange={(e) => handleSettingChange(Effect.LOW_PASS_FILTER, 'frequency', +e.target.value)} />
                                    <Slider label="Resonance (Q)" value={filterSettings.q} min={0.1} max={20} step={0.1} unit="" onChange={(e) => handleSettingChange(Effect.LOW_PASS_FILTER, 'q', +e.target.value)} />
                                </>
                            ) : (
                                <Slider label="Intensity" value={filterSettings.intensity} min={0} max={100} step={1} unit="%" onChange={(e) => handleIntensityChange(Effect.LOW_PASS_FILTER, +e.target.value)} />
                            )}
                        </div>
                    );
                case Effect.PAN:
                    const isAuto = settings[Effect.PAN].isAuto;
                    return (
                        <div className="space-y-4">
                        <div className="flex justify-center bg-gray-800 rounded-lg p-1">
                            <button onClick={() => handleSettingChange(Effect.PAN, 'isAuto', false)} className={`w-full py-1.5 text-sm font-semibold rounded-md transition-colors ${!isAuto ? 'bg-brand-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Simple</button>
                            <button onClick={() => handleSettingChange(Effect.PAN, 'isAuto', true)} className={`w-full py-1.5 text-sm font-semibold rounded-md transition-colors ${isAuto ? 'bg-brand-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Auto</button>
                        </div>
                        {isAuto ? (
                            <>
                            <Slider label="Frequency" value={settings[Effect.PAN].frequency} min={0.1} max={10} step={0.1} unit=" Hz" onChange={(e) => handleSettingChange(Effect.PAN, 'frequency', +e.target.value)} />
                            <Slider label="Depth" value={settings[Effect.PAN].depth} min={0} max={1} step={0.01} unit="" onChange={(e) => handleSettingChange(Effect.PAN, 'depth', +e.target.value)} />
                            </>
                        ) : (
                            <Slider label="Pan" value={panValue} min={-1} max={1} step={0.01} unit="" displayValue={panDisplay} onChange={(e) => handleSettingChange(Effect.PAN, 'pan', +e.target.value)} />
                        )}
                        </div>
                    );
                case Effect.TREMOLO:
                    return isAdvanced ? (
                        <div className="space-y-4">
                            <Slider label="Frequency" value={settings[Effect.TREMOLO].frequency} min={0.1} max={20} step={0.1} unit=" Hz" onChange={(e) => handleSettingChange(Effect.TREMOLO, 'frequency', +e.target.value)} />
                            <Slider label="Depth" value={settings[Effect.TREMOLO].depth} min={0} max={1} step={0.01} unit="" onChange={(e) => handleSettingChange(Effect.TREMOLO, 'depth', +e.target.value)} />
                        </div>
                    ) : (
                        <Slider label="Intensity" value={settings[Effect.TREMOLO].intensity} min={0} max={100} step={1} unit="%" onChange={(e) => handleIntensityChange(Effect.TREMOLO, +e.target.value)} />
                    );
                default:
                    return null;
            }
        })()}
      </>
    )
  }

  return (
    <div>
        <div className="mb-6">
            <label htmlFor="preset-select" className="block text-sm font-medium text-gray-400 mb-2">Studio Presets</label>
            <select
            id="preset-select"
            value={selectedPreset}
            onChange={handlePresetChange}
            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary block w-full p-2.5"
            >
            {presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col space-y-2">
            {effectList.map((effect) => (
            <div
                key={effect.id}
                onClick={() => setActiveEffect(effect.id)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${activeEffect === effect.id ? 'bg-brand-primary/20 text-white' : 'hover:bg-gray-700'}`}
            >
                <div className="flex items-center gap-3">
                <span className={`${activeEffect === effect.id ? 'text-brand-secondary' : 'text-gray-400'}`}>{effect.icon}</span>
                <span className="font-semibold">{effect.id}</span>
                </div>
                <Toggle enabled={settings[effect.id]?.enabled ?? false} onChange={(e) => handleSettingChange(effect.id, 'enabled', e.target.checked)} />
            </div>
            ))}
        </div>
        <div className="md:col-span-2 bg-gray-900/50 p-6 rounded-lg min-h-[260px]">
            {renderEffectControls()}
        </div>
        </div>
    </div>
  );
};