// FIX: Removed a circular import of `Effect` from this same file.
export enum Effect {
  REVERB = 'Reverb',
  SPEED = 'Speed',
  EQUALIZER = 'Equalizer',
  DISTORTION = 'Distortion',
  PAN = 'Pan',
  TREMOLO = 'Tremolo',
  LOW_PASS_FILTER = 'Low Pass Filter',
}

export interface ReverbSettings {
  mix: number; // 0 to 1
  decay: number; // 0.1 to 10
  duration: number; // 0.1 to 10
  preDelay: number; // 0 to 1
  intensity: number; // 0 to 100
  enabled: boolean;
}

export interface SpeedSettings {
  rate: number; // 0.25 to 4
  enabled: boolean;
}

export interface PanSettings {
  pan: number; // -1 to 1 (left to right) for simple pan
  isAuto: boolean;
  frequency: number; // Hz for auto pan
  depth: number; // 0 to 1 for auto pan
  enabled: boolean;
}

export interface EqualizerSettings {
    band80: number; // -30 to 30 dB (Sub Bass)
    band250: number; // -30 to 30 dB (Low Mids)
    band500: number; // -30 to 30 dB (Mids)
    band1k: number; // -30 to 30 dB (Upper Mids)
    band2k5: number; // -30 to 30 dB (Presence)
    band5k: number; // -30 to 30 dB (Treble)
    band10k: number; // -30 to 30 dB (Air)
    enabled: boolean;
}

export interface DistortionSettings {
    drive: number; // 1 to 100
    character: number; // 0 to 1
    tone: number; // 200 to 10000 Hz
    intensity: number; // 0 to 100
    enabled: boolean;
}

export interface TremoloSettings {
    frequency: number; // 0.1 to 20 Hz
    depth: number; // 0 to 1
    intensity: number; // 0 to 100
    enabled: boolean;
}

export interface LowPassFilterSettings {
    frequency: number; // 20 to 20000 Hz
    q: number; // 0.1 to 20
    intensity: number; // 0 to 100
    enabled: boolean;
}

export interface EffectSettings {
  [Effect.REVERB]: ReverbSettings;
  [Effect.SPEED]: SpeedSettings;
  [Effect.PAN]: PanSettings;
  [Effect.EQUALIZER]: EqualizerSettings;
  [Effect.DISTORTION]: DistortionSettings;
  [Effect.TREMOLO]: TremoloSettings;
  [Effect.LOW_PASS_FILTER]: LowPassFilterSettings;
}

export const initialEffectSettings: EffectSettings = {
  [Effect.REVERB]: { mix: 0, decay: 1.5, duration: 2, preDelay: 0, intensity: 0, enabled: false },
  [Effect.SPEED]: { rate: 1, enabled: false },
  [Effect.EQUALIZER]: { band80: 0, band250: 0, band500: 0, band1k: 0, band2k5: 0, band5k: 0, band10k: 0, enabled: false },
  [Effect.DISTORTION]: { drive: 1, character: 0, tone: 8000, intensity: 0, enabled: false },
  [Effect.PAN]: { pan: 0, isAuto: false, frequency: 2, depth: 1, enabled: false },
  [Effect.TREMOLO]: { frequency: 5, depth: 0, intensity: 0, enabled: false },
  [Effect.LOW_PASS_FILTER]: { frequency: 20000, q: 1, intensity: 0, enabled: false },
};