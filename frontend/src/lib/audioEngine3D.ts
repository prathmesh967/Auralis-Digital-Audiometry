// Audio engine for 3D spatial sound simulation using Web Audio API and HRTF

export interface Sound3DPosition {
  x: number; // Left (-1) to Right (+1)
  y: number; // Down (-1) to Up (+1)
  z: number; // Back (-1) to Front (+1)
}

export interface SoundTestResult {
  position: Sound3DPosition;
  userGuess: string;
  correct: boolean;
  responseTime: number;
  timestamp: number;
}

class AudioEngine3D {
  private audioContext: AudioContext | null = null;
  private pannerNode: PannerNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;

  constructor() {
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  async initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Create main gain node
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0.1;
    this.gainNode.connect(this.audioContext.destination);

    // Create panner node for 3D audio
    this.pannerNode = this.audioContext.createPanner();
    this.pannerNode.panningModel = 'HRTF'; // Head-Related Transfer Function
    this.pannerNode.distanceModel = 'linear';
    this.pannerNode.refDistance = 1;
    this.pannerNode.maxDistance = 10;
    this.pannerNode.rolloffFactor = 1;
    this.pannerNode.connect(this.gainNode);
  }

  setSpatialPosition(position: Sound3DPosition) {
    if (!this.pannerNode) return;

    this.pannerNode.setPosition(position.x * 10, position.y * 10, position.z * 10);
  }

  playToneFromPosition(position: Sound3DPosition, duration: number = 1) {
    if (!this.audioContext || !this.pannerNode || !this.gainNode) return;

    this.setSpatialPosition(position);

    // Create oscillator for tone
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.value = 440; // A4 note
    this.oscillator.connect(this.pannerNode);

    // Setup envelope with gain node
    const envelopeGain = this.audioContext.createGain();
    this.pannerNode.connect(envelopeGain);
    envelopeGain.connect(this.gainNode);

    const now = this.audioContext.currentTime;
    envelopeGain.gain.setValueAtTime(0, now);
    envelopeGain.gain.linearRampToValueAtTime(1, now + 0.1);
    envelopeGain.gain.linearRampToValueAtTime(0, now + duration - 0.1);

    this.oscillator.start(now);
    this.oscillator.stop(now + duration);

    this.isPlaying = true;

    setTimeout(() => {
      this.isPlaying = false;
    }, duration * 1000);
  }

  playNoiseFromPosition(position: Sound3DPosition, duration: number = 1) {
    if (!this.audioContext || !this.pannerNode || !this.gainNode) return;

    this.setSpatialPosition(position);

    // Create white noise
    const bufferSize = this.audioContext.sampleRate * duration;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.connect(this.pannerNode);

    // Setup envelope with gain node
    const envelopeGain = this.audioContext.createGain();
    this.pannerNode.connect(envelopeGain);
    envelopeGain.connect(this.gainNode);

    const now = this.audioContext.currentTime;
    envelopeGain.gain.setValueAtTime(0, now);
    envelopeGain.gain.linearRampToValueAtTime(1, now + 0.1);
    envelopeGain.gain.linearRampToValueAtTime(0, now + duration - 0.1);

    noiseSource.start(now);
    noiseSource.stop(now + duration);

    this.isPlaying = true;

    setTimeout(() => {
      this.isPlaying = false;
    }, duration * 1000);
  }

  getRandomPosition(): Sound3DPosition {
    const directions = [
      { x: -1, y: 0, z: 0, label: 'left' },
      { x: 1, y: 0, z: 0, label: 'right' },
      { x: 0, y: 0, z: 1, label: 'front' },
      { x: 0, y: 0, z: -1, label: 'back' },
    ];

    const selected = directions[Math.floor(Math.random() * directions.length)];
    return { x: selected.x, y: selected.y, z: selected.z };
  }

  stop() {
    if (this.oscillator) {
      try {
        this.oscillator.stop();
      } catch (e) {
        // Already stopped
      }
    }
  }

  getIsPlaying() {
    return this.isPlaying;
  }
}

export default AudioEngine3D;
