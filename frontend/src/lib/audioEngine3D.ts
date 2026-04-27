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
  private envelopeGain: GainNode | null = null;
  private isPlaying = false;
  private currentPosition: Sound3DPosition | null = null;

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

    // Create main gain node at an audible level
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0.4;
    this.gainNode.connect(this.audioContext.destination);

    // Create panner node for 3D audio
    this.pannerNode = this.audioContext.createPanner();
    this.pannerNode.panningModel = 'HRTF';
    this.pannerNode.distanceModel = 'inverse';
    this.pannerNode.refDistance = 0.5;
    this.pannerNode.maxDistance = 20;
    this.pannerNode.rolloffFactor = 0.8;
  }

  setSpatialPosition(position: Sound3DPosition) {
    if (!this.pannerNode) return;

    const panner = this.pannerNode as any;
    if ('positionX' in panner) {
      panner.positionX.value = position.x * 5;
      panner.positionY.value = position.y * 5;
      panner.positionZ.value = position.z * 5;
    } else if (typeof panner.setPosition === 'function') {
      panner.setPosition(position.x * 5, position.y * 5, position.z * 5);
    }
  }

  playToneFromPosition(position: Sound3DPosition, duration: number = 1) {
    if (!this.audioContext || !this.pannerNode || !this.gainNode) return;

    // Ensure audio context is running
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.setSpatialPosition(position);

    // Create oscillator for tone
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.value = 1000; // 1 kHz tone for clear hearing detection

    // Create envelope gain node
    const envelopeGain = this.audioContext.createGain();

    // Connect: oscillator -> panner -> envelope -> main gain -> destination
    this.oscillator.connect(this.pannerNode);
    this.pannerNode.connect(envelopeGain);
    envelopeGain.connect(this.gainNode);

    const now = this.audioContext.currentTime;
    envelopeGain.gain.setValueAtTime(0, now);
    envelopeGain.gain.linearRampToValueAtTime(0.5, now + 0.05); // Fade in
    envelopeGain.gain.setValueAtTime(0.5, now + duration - 0.05); // Hold
    envelopeGain.gain.linearRampToValueAtTime(0, now + duration); // Fade out

    this.oscillator.start(now);
    this.oscillator.stop(now + duration);

    this.isPlaying = true;

    setTimeout(() => {
      this.isPlaying = false;
    }, duration * 1000);
  }

  startContinuousTone(position: Sound3DPosition) {
    if (!this.audioContext || !this.pannerNode || !this.gainNode) return;

    // Stop any existing tone
    this.stopTone();

    // Ensure audio context is running
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.setSpatialPosition(position);
    this.currentPosition = position;

    // Create oscillator for continuous tone at a normal hearing frequency
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.value = 1000; // 1 kHz is easy to hear for most users

    // Create envelope gain node for smooth start/stop
    this.envelopeGain = this.audioContext.createGain();
    this.envelopeGain.gain.value = 0;

    // Connect: oscillator -> panner -> envelope -> main gain -> destination
    this.oscillator.connect(this.pannerNode);
    this.pannerNode.connect(this.envelopeGain);
    this.envelopeGain.connect(this.gainNode);

    this.oscillator.start();
    this.envelopeGain.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.05);
    this.isPlaying = true;
  }

  stopTone() {
    if (this.oscillator && this.envelopeGain && this.audioContext) {
      const now = this.audioContext.currentTime;
      this.envelopeGain.gain.linearRampToValueAtTime(0, now + 0.05);

      setTimeout(() => {
        if (this.oscillator) {
          try {
            this.oscillator.stop();
            this.oscillator.disconnect();
          } catch (e) {
            // Already stopped
          }
          this.oscillator = null;
        }
        if (this.envelopeGain) {
          this.envelopeGain.disconnect();
          this.envelopeGain = null;
        }
      }, 100);
    }
    this.isPlaying = false;
    this.currentPosition = null;
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

  getAudioContext() {
    return this.audioContext;
  }
}

export default AudioEngine3D;
