import { Howl } from 'howler';

const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let panner: PannerNode | null = null;

export function playTone(frequency = 1000) {
  stopTone();
  oscillator = audioContext.createOscillator();
  gainNode = audioContext.createGain();
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
  oscillator.start();
  gainNode.gain.exponentialRampToValueAtTime(0.4, audioContext.currentTime + 0.05);
}

export function stopTone() {
  if (oscillator) {
    oscillator.stop();
    oscillator.disconnect();
    gainNode?.disconnect();
  }
  oscillator = null;
  gainNode = null;
}

function intensityToGain(intensity: number) {
  return Math.min(1, Math.max(0, intensity / 150));
}

export type ToneController = {
  play: () => void;
  pause: () => void;
  stop: () => void;
  setFrequency: (frequency: number) => void;
  setIntensity: (intensity: number) => void;
};

export function createToneController(frequency = 1000, intensity = 100): ToneController {
  stopTone();
  oscillator = audioContext.createOscillator();
  gainNode = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gainNode.gain.value = intensityToGain(intensity);
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();

  return {
    play() {
      if (gainNode) {
        gainNode.gain.setValueAtTime(intensityToGain(intensity), audioContext.currentTime);
      }
    },
    pause() {
      if (gainNode) {
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      }
    },
    stop() {
      stopTone();
    },
    setFrequency(newFrequency: number) {
      if (oscillator) {
        oscillator.frequency.value = newFrequency;
      }
    },
    setIntensity(newIntensity: number) {
      if (gainNode) {
        gainNode.gain.setValueAtTime(intensityToGain(newIntensity), audioContext.currentTime);
      }
    },
  };
}

export function createSpatialTone(x = 0, y = 0, z = -1) {
  stopTone();
  oscillator = audioContext.createOscillator();
  gainNode = audioContext.createGain();
  panner = audioContext.createPanner();
  panner.panningModel = 'HRTF';
  panner.distanceModel = 'inverse';
  panner.positionX.value = x;
  panner.positionY.value = y;
  panner.positionZ.value = z;
  oscillator.type = 'sine';
  oscillator.frequency.value = 550;
  oscillator.connect(panner);
  panner.connect(gainNode);
  gainNode.connect(audioContext.destination);
  gainNode.gain.value = 0.1;
  oscillator.start();

  return {
    updatePosition(nx: number, ny: number, nz: number) {
      if (panner) {
        panner.positionX.value = nx;
        panner.positionY.value = ny;
        panner.positionZ.value = nz;
      }
    },
    stop() {
      stopTone();
      panner = null;
    },
  };
}

export function loadSpeechSample() {
  return new Howl({
    src: ['https://actions.google.com/sounds/v1/transportation/vehicle_horn.ogg'],
    html5: true,
    volume: 0.8,
  });
}

export function startNoiseMeter(onLevel: (db: number) => void, existingStream?: MediaStream) {
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  const meterGain = audioContext.createGain();
  meterGain.gain.value = 0;
  analyser.connect(meterGain);
  meterGain.connect(audioContext.destination);

  let animationFrame = 0;
  let stream: MediaStream | null = existingStream || null;

  const updateMeter = () => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < bufferLength; i += 1) {
      sum += dataArray[i];
    }
    const amplitude = sum / bufferLength;
    const db = Math.max(0, 100 - 1.5 * (255 - amplitude));
    onLevel(Math.round(db));
    animationFrame = requestAnimationFrame(updateMeter);
  };

  const connectStream = (micStream: MediaStream) => {
    stream = micStream;
    const source = audioContext.createMediaStreamSource(micStream);
    source.connect(analyser);
    updateMeter();
  };

  if (stream) {
    connectStream(stream);
  } else {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((micStream) => {
        connectStream(micStream);
      })
      .catch(() => onLevel(0));
  }

  return () => {
    cancelAnimationFrame(animationFrame);
    stream?.getTracks().forEach((track) => track.stop());
  };
}
