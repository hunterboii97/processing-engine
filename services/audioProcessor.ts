import { Effect, EffectSettings } from '../types';

// Global AudioContext
let audioContext: AudioContext;
const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// --- Impulse Response for Reverb ---
const createImpulseResponse = async (actx: BaseAudioContext, duration: number, decay: number): Promise<AudioBuffer> => {
  const sampleRate = actx.sampleRate;
  const length = sampleRate * duration;
  const impulse = actx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const n = length - i;
    left[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
    right[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
  }
  return impulse;
};

// --- Distortion Curve ---
const makeDistortionCurve = (amount: number): Float32Array => {
    const k = amount * 100;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    for (let i = 0; i < n_samples; ++i) {
        const x = i * 2 / n_samples - 1;
        curve[i] = (Math.PI + k) * x / (Math.PI + k * Math.abs(x));
    }
    return curve;
};

// --- Main Processing Function ---
export const applyEffects = async (
  originalBuffer: AudioBuffer,
  settings: EffectSettings
): Promise<AudioBuffer> => {

  const speedSettings = settings[Effect.SPEED];
  const speedRate = speedSettings.enabled ? speedSettings.rate : 1.0;
  
  const duration = originalBuffer.duration / speedRate;

  if (!isFinite(duration) || duration <= 0) {
    console.error("Invalid audio duration calculated. Aborting processing.");
    return Promise.reject(new Error("Invalid audio duration calculated."));
  }
  
  const offlineCtx = new OfflineAudioContext(originalBuffer.numberOfChannels, Math.ceil(duration * originalBuffer.sampleRate), originalBuffer.sampleRate);
  
  let source = offlineCtx.createBufferSource();
  source.buffer = originalBuffer;

  source.playbackRate.value = speedRate;
  
  let lastNode: AudioNode = source;

  // Processing Chain: Distortion -> EQ -> Filter -> Pan -> Tremolo -> Reverb
  
  // Distortion
  if (settings[Effect.DISTORTION].enabled && settings[Effect.DISTORTION].character > 0) {
      const distortionSettings = settings[Effect.DISTORTION];
      const driveNode = offlineCtx.createGain();
      driveNode.gain.value = distortionSettings.drive;

      const waveShaperNode = offlineCtx.createWaveShaper();
      waveShaperNode.curve = makeDistortionCurve(distortionSettings.character);
      waveShaperNode.oversample = '4x';
      
      const toneNode = offlineCtx.createBiquadFilter();
      toneNode.type = 'lowpass';
      toneNode.frequency.value = distortionSettings.tone;

      lastNode.connect(driveNode);
      driveNode.connect(waveShaperNode);
      waveShaperNode.connect(toneNode);
      lastNode = toneNode;
  }

  // 7-Band Equalizer
  if (settings[Effect.EQUALIZER].enabled) {
    const eq = settings[Effect.EQUALIZER];
    const Q = 1.2; // Quality factor for peaking filters - refined for a more musical response

    const filters = [
      { type: 'lowshelf', freq: 80, gain: eq.band80 },
      { type: 'peaking', freq: 250, gain: eq.band250 },
      { type: 'peaking', freq: 500, gain: eq.band500 },
      { type: 'peaking', freq: 1000, gain: eq.band1k },
      { type: 'peaking', freq: 2500, gain: eq.band2k5 },
      { type: 'peaking', freq: 5000, gain: eq.band5k },
      { type: 'highshelf', freq: 10000, gain: eq.band10k },
    ].map(config => {
      const filter = offlineCtx.createBiquadFilter();
      filter.type = config.type as BiquadFilterType;
      filter.frequency.value = config.freq;
      filter.gain.value = config.gain;
      if (filter.type === 'peaking') {
        filter.Q.value = Q;
      }
      return filter;
    });

    filters.reduce((prev, curr) => {
        prev.connect(curr);
        return curr;
    }, lastNode);
    
    lastNode = filters[filters.length - 1];
  }

  // Low Pass Filter
  if (settings[Effect.LOW_PASS_FILTER].enabled) {
    const filterSettings = settings[Effect.LOW_PASS_FILTER];
    const filterNode = offlineCtx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = filterSettings.frequency;
    filterNode.Q.value = filterSettings.q;
    
    lastNode.connect(filterNode);
    lastNode = filterNode;
  }

  // Pan
  if (settings[Effect.PAN].enabled) {
    const panSettings = settings[Effect.PAN];
    const panner = offlineCtx.createStereoPanner();
    
    if (panSettings.isAuto) {
      const lfo = offlineCtx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = panSettings.frequency;
      
      const lfoGain = offlineCtx.createGain();
      lfoGain.gain.value = panSettings.depth;
      
      lfo.connect(lfoGain);
      lfoGain.connect(panner.pan);
      lfo.start(0);
    } else {
      panner.pan.value = panSettings.pan;
    }
    lastNode.connect(panner);
    lastNode = panner;
  }
  
  // Tremolo
  if (settings[Effect.TREMOLO].enabled && settings[Effect.TREMOLO].depth > 0) {
    const tremoloSettings = settings[Effect.TREMOLO];
    const tremoloNode = offlineCtx.createGain();
    const lfo = offlineCtx.createOscillator();
    lfo.frequency.value = tremoloSettings.frequency;
    lfo.type = 'sine';

    const shaper = offlineCtx.createWaveShaper();
    const curve = new Float32Array(256);
    // Map LFO from [-1, 1] to gain modulation [1-depth, 1]
    for (let i = 0; i < 256; i++) {
        const x = i * 2 / 255 - 1;
        curve[i] = 1 - (((x + 1) / 2) * tremoloSettings.depth);
    }
    shaper.curve = curve;
    
    lfo.connect(shaper);
    shaper.connect(tremoloNode.gain);
    lfo.start(0);

    lastNode.connect(tremoloNode);
    lastNode = tremoloNode;
  }

  const merger = offlineCtx.createGain();

  // Reverb
  if (settings[Effect.REVERB].enabled && settings[Effect.REVERB].mix > 0) {
    const reverbSettings = settings[Effect.REVERB];
    const convolver = offlineCtx.createConvolver();
    convolver.buffer = await createImpulseResponse(offlineCtx, reverbSettings.duration, reverbSettings.decay);
    
    const dryNode = offlineCtx.createGain();
    dryNode.gain.value = 1 - reverbSettings.mix;
    
    const wetNode = offlineCtx.createGain();
    wetNode.gain.value = reverbSettings.mix;

    const preDelayNode = offlineCtx.createDelay(1.0); // Max 1s pre-delay
    preDelayNode.delayTime.value = reverbSettings.preDelay;

    lastNode.connect(dryNode);
    dryNode.connect(merger);

    lastNode.connect(preDelayNode);
    preDelayNode.connect(convolver);
    convolver.connect(wetNode);
    wetNode.connect(merger);

    lastNode = merger;
  }
  
  lastNode.connect(offlineCtx.destination);

  source.start(0);
  const renderedBuffer = await offlineCtx.startRendering();

  return renderedBuffer;
};


// --- WAV Conversion Utility ---
export const bufferToWave = (abuffer: AudioBuffer): DataView => {
  const numChannels = abuffer.numberOfChannels;
  const sampleRate = abuffer.sampleRate;
  const numSamples = abuffer.length;
  const bitsPerSample = 16;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const bufferSize = 44 + dataSize;

  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  let pos = 0;

  const writeString = (s: string) => {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(pos++, s.charCodeAt(i));
    }
  };

  // RIFF header
  writeString('RIFF');
  view.setUint32(pos, 36 + dataSize, true); pos += 4;
  writeString('WAVE');

  // fmt chunk
  writeString('fmt ');
  view.setUint32(pos, 16, true); pos += 4;
  view.setUint16(pos, 1, true); pos += 2;
  view.setUint16(pos, numChannels, true); pos += 2;
  view.setUint32(pos, sampleRate, true); pos += 4;
  view.setUint32(pos, byteRate, true); pos += 4;
  view.setUint16(pos, blockAlign, true); pos += 2;
  view.setUint16(pos, bitsPerSample, true); pos += 2;

  // data chunk
  writeString('data');
  view.setUint32(pos, dataSize, true); pos += 4;

  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  for (let i = 0; i < numSamples; i++) {
    for (let j = 0; j < numChannels; j++) {
      const sample = Math.max(-1, Math.min(1, channels[j][i]));
      const intSample = sample < 0 ? sample * 32768 : sample * 32767;
      view.setInt16(pos, intSample, true);
      pos += 2;
    }
  }

  return view;
};