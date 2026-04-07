import { useEffect, useRef, useState } from 'react';

const AudioContextConstructor =
  window.AudioContext || (window as any).webkitAudioContext;

export default function ThreeDSoundTestPage() {
  const [audioSupported] = useState(Boolean(AudioContextConstructor));
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [positionZ, setPositionZ] = useState(-1);
  const [status, setStatus] = useState('Ready to play a spatial tone.');

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<OscillatorNode | null>(null);
  const pannerRef = useRef<PannerNode | null>(null);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // ✅ PLAY (FIXED)
  const handlePlay = async () => {
    if (!audioSupported) {
      setStatus('AudioContext is not supported.');
      return;
    }

    // Create AudioContext if not exists
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor();
    }

    const context = audioContextRef.current;

    // Resume if suspended (important for browser autoplay policy)
    if (context.state === 'suspended') {
      await context.resume();
    }

    // 🔥 Always create NEW nodes
    const source = context.createOscillator();
    const panner = context.createPanner();

    // Configure panner (3D audio)
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';

    panner.positionX.value = positionX;
    panner.positionY.value = positionY;
    panner.positionZ.value = positionZ;

    panner.refDistance = 1;
    panner.maxDistance = 20;
    panner.rolloffFactor = 2;

    panner.coneInnerAngle = 60;
    panner.coneOuterAngle = 120;
    panner.coneOuterGain = 0.3;

    // Tone settings
    source.type = 'sine'; // try 'sawtooth' for stronger spatial feel
    source.frequency.value = 520;

    // Connect graph
    source.connect(panner);
    panner.connect(context.destination);

    // Start sound
    source.start();

    // Store refs
    sourceRef.current = source;
    pannerRef.current = panner;

    setIsPlaying(true);
    setStatus('Playing spatial tone. Move sliders to locate sound.');
  };

  // ✅ STOP (FIXED)
  const handleStop = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) {}

      sourceRef.current.disconnect();
      pannerRef.current?.disconnect();

      sourceRef.current = null;
      pannerRef.current = null;
    }

    setIsPlaying(false);
    setStatus('Playback stopped.');
  };

  // ✅ UPDATE POSITION (LIVE)
  const updatePosition = (axis: 'x' | 'y' | 'z', value: number) => {
    if (axis === 'x') setPositionX(value);
    if (axis === 'y') setPositionY(value);
    if (axis === 'z') setPositionZ(value);

    if (pannerRef.current) {
      if (axis === 'x') pannerRef.current.positionX.value = value;
      if (axis === 'y') pannerRef.current.positionY.value = value;
      if (axis === 'z') pannerRef.current.positionZ.value = value;
    }
  };

  return (
    <main className="min-h-screen pb-32 px-6 pt-24">
      <div className="glass-panel rounded-[32px] border border-white/10 p-8 shadow-glow">
        <p className="text-[10px] uppercase tracking-[0.3em] text-secondary">
          3D Sound Test
        </p>
        <h1 className="mt-3 text-3xl font-black text-white">
          Spatial Audiometry
        </h1>

        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Move the sliders to change sound direction and distance.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* LEFT PANEL */}
          <div className="rounded-[32px] bg-slate-950/80 p-8 shadow-inner">
            <div className="space-y-6">
              {/* CONTROLS */}
              <div className="rounded-[28px] bg-slate-900/80 p-6">
                <p className="text-sm text-slate-300">Playback controls</p>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handlePlay}
                    disabled={!audioSupported || isPlaying}
                    className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                  >
                    Play tone
                  </button>

                  <button
                    onClick={handleStop}
                    disabled={!isPlaying}
                    className="rounded-2xl bg-slate-700 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-50"
                  >
                    Stop
                  </button>
                </div>
              </div>

              {/* SLIDERS */}
              <div className="rounded-[28px] bg-slate-900/80 p-6">
                <p className="text-sm text-slate-300">Sound position</p>

                <div className="mt-4 space-y-5">
                  <label className="flex flex-col gap-2 text-sm text-slate-300">
                    X (left/right): {positionX.toFixed(1)}
                    <input
                      type="range"
                      min={-10}
                      max={10}
                      step={0.5}
                      value={positionX}
                      onChange={(e) =>
                        updatePosition('x', Number(e.target.value))
                      }
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-sm text-slate-300">
                    Y (up/down): {positionY.toFixed(1)}
                    <input
                      type="range"
                      min={-10}
                      max={10}
                      step={0.5}
                      value={positionY}
                      onChange={(e) =>
                        updatePosition('y', Number(e.target.value))
                      }
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-sm text-slate-300">
                    Z (near/far): {positionZ.toFixed(1)}
                    <input
                      type="range"
                      min={-10}
                      max={0}
                      step={0.5}
                      value={positionZ}
                      onChange={(e) =>
                        updatePosition('z', Number(e.target.value))
                      }
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="rounded-[32px] bg-slate-900/80 p-8">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6">
              <p className="text-sm text-slate-500">Spatial preview</p>

              <div className="mt-6 flex h-72 items-center justify-center bg-slate-950/80 rounded-3xl">
                <div className="relative h-56 w-56">
                  {/* Center */}
                  <div className="absolute left-1/2 top-1/2 h-4 w-4 bg-cyan-400 rounded-full transform -translate-x-1/2 -translate-y-1/2" />

                  {/* Moving point */}
                  <div
                    className="absolute h-5 w-5 bg-sky-300 rounded-full"
                    style={{
                      left: `${50 + positionX * 3}%`,
                      top: `${50 - positionY * 3}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-400">
                Dot = sound position
              </p>
            </div>

            <div className="mt-6 rounded-[28px] bg-slate-950/80 p-6 text-sm text-slate-300">
              {status}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}