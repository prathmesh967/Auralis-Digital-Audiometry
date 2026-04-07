import { useEffect, useRef, useState } from 'react';

interface NoiseCheckModalProps {
  isOpen: boolean;
  onProceed: () => void;
  onCancel: () => void;
}

export default function NoiseCheckModal({ isOpen, onProceed, onCancel }: NoiseCheckModalProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState<number | null>(null);
  const [isSuitable, setIsSuitable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startNoiseCheck = async () => {
    setIsChecking(true);
    setError('');
    setNoiseLevel(null);
    setIsSuitable(null);

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      mediaStreamRef.current = stream;

      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;

      // Measure noise for 2 seconds
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let totalNoise = 0;
      let measurements = 0;
      const measurementInterval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        totalNoise += average;
        measurements++;

        if (measurements >= 20) {
          // 20 * 100ms = 2 seconds
          clearInterval(measurementInterval);
          cleanup();

          const averageNoise = totalNoise / measurements;
          setNoiseLevel(Math.round(averageNoise));

          // Threshold: if noise level is below 50 (out of 255), it's suitable
          const suitable = averageNoise < 50;
          setIsSuitable(suitable);
          setIsChecking(false);
        }
      }, 100);
    } catch (err) {
      setError('Unable to access microphone. Please check permissions.');
      setIsChecking(false);
      cleanup();
    }
  };

  const cleanup = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-[32px] bg-slate-950 border border-white/10 shadow-2xl p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-black text-white">Environment Check</h2>
          <p className="text-sm text-slate-400 mt-2">
            Let's check if your environment is suitable for the test.
          </p>
        </div>

        {!noiseLevel && (
          <div className="rounded-[28px] bg-slate-900/80 p-8 flex flex-col items-center justify-center min-h-[240px]">
            {isChecking ? (
              <>
                <div className="animate-pulse flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full border-4 border-cyan-400/30 border-t-cyan-400 animate-spin" />
                  <div className="space-y-2 text-center">
                    <p className="text-sm font-semibold text-white">Measuring noise...</p>
                    <p className="text-xs text-slate-400">Please stay silent for 2 seconds</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">🎤</div>
                <p className="text-sm text-slate-300 text-center mb-6">
                  Click to measure ambient noise in your environment
                </p>
                <button
                  onClick={startNoiseCheck}
                  disabled={isChecking}
                  className="rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
                >
                  Start Check
                </button>
              </>
            )}
          </div>
        )}

        {noiseLevel !== null && (
          <div className="rounded-[28px] bg-slate-900/80 p-8 space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className={`text-5xl ${isSuitable ? '✅' : '⚠️'}`} />
              <div className="text-center">
                <p className="text-3xl font-black text-white">{noiseLevel}</p>
                <p className="text-xs text-slate-400 mt-1">Noise Level (0-255)</p>
              </div>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isSuitable ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min((noiseLevel / 255) * 100, 100)}%` }}
              />
            </div>

            <div className={`rounded-2xl p-4 ${isSuitable ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
              <p
                className={`text-sm font-semibold ${
                  isSuitable ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {isSuitable
                  ? '✓ Environment is suitable for testing'
                  : '⚠ Environment is too noisy for accurate testing'}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {isSuitable
                  ? 'Your environment has low ambient noise. You are ready to proceed with the test.'
                  : 'For best results, please move to a quieter location and try again.'}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
          >
            Cancel
          </button>
          {noiseLevel !== null && (
            <button
              onClick={onProceed}
              disabled={!isSuitable}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isSuitable
                  ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isSuitable ? 'Start Test' : 'Too Noisy'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
