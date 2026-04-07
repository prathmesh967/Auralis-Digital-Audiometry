import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AudioEngine3D, { Sound3DPosition, SoundTestResult } from '../lib/audioEngine3D';
import { calculateTestScore, getPerceptionInsight, TestScore } from '../lib/scoreCalculator3D';
import SpatialVisualizer from '../components/SpatialVisualizer';
import { submit3DSoundResults } from '../lib/api';

const TOTAL_ROUNDS = 10;

export default function SoundLocalizationTestPage() {
  const navigate = useNavigate();
  const [audioEngine, setAudioEngine] = useState<AudioEngine3D | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<Sound3DPosition | null>(null);
  const [results, setResults] = useState<SoundTestResult[]>([]);
  const [responseTime, setResponseTime] = useState(0);
  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [score, setScore] = useState<TestScore | null>(null);
  const [currentDirection, setCurrentDirection] = useState<string | null>(null);

  const accuracy = results.filter((r) => r.correct).length > 0
    ? (results.filter((r) => r.correct).length / results.length) * 100
    : 0;
  const avgLatency = results.length > 0
    ? results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
    : 0;

  useEffect(() => {
    const engine = new AudioEngine3D();
    engine.initialize().then(() => {
      setAudioEngine(engine);
    });

    return () => {
      engine.stop();
    };
  }, []);

  const getDirectionLabel = (position: Sound3DPosition): string => {
    if (position.z > 0.5) return 'front';
    if (position.z < -0.5) return 'back';
    if (position.x > 0.5) return 'right';
    if (position.x < -0.5) return 'left';
    return 'center';
  };

  const playSound = async () => {
    if (!audioEngine) return;

    const position = audioEngine.getRandomPosition();
    setCurrentPosition(position);
    setIsPlaying(true);
    setCurrentDirection(getDirectionLabel(position));
    setTestStartTime(Date.now());

    audioEngine.playToneFromPosition(position, 1);
    // Keep isPlaying true until user responds - don't disable buttons after 1 second
  };

  const handleDirectionGuess = async (guessedDirection: string) => {
    if (!currentPosition || !testStartTime) return;

    const responseTimeMs = Date.now() - testStartTime;
    const actualDirection = getDirectionLabel(currentPosition);
    const isCorrect = guessedDirection === actualDirection;

    const newResult: SoundTestResult = {
      position: currentPosition,
      userGuess: guessedDirection,
      correct: isCorrect,
      responseTime: responseTimeMs,
      timestamp: Date.now(),
    };

    setResults([...results, newResult]);
    setResponseTime(responseTimeMs);
    setCurrentPosition(null);
    setCurrentDirection(null);
    setIsPlaying(false); // Disable buttons after response

    if (currentRound + 1 < TOTAL_ROUNDS) {
      setCurrentRound(currentRound + 1);
      setTimeout(() => {
        playSound();
      }, 1500);
    } else {
      const finalScore = calculateTestScore([...results, newResult]);
      setScore(finalScore);
      setTestCompleted(true);
      
      // Submit results to backend
      try {
        await submit3DSoundResults({
          results: [...results, newResult],
          overallAccuracy: finalScore.overallAccuracy,
          averageLatency: finalScore.averageLatency,
          frontalBias: finalScore.frontalBias,
          lateralDelay: finalScore.lateralDelay,
          spatialAccuracy: finalScore.spatialAccuracy,
          quadrantAnalysis: finalScore.quadrantAnalysis,
        });
      } catch (error) {
        console.error('Failed to submit results:', error);
      }
    }
  };

  const handleStartTest = () => {
    setTestStarted(true);
    setCurrentRound(0);
    setResults([]);
    setScore(null);
    setTestCompleted(false);
    setTimeout(() => {
      playSound();
    }, 1000);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (!testStarted) {
    return (
      <main className="min-h-screen pb-32 px-6 pt-24">
        <header className="fixed top-0 left-0 right-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">3D Spatial Audio</p>
              <h1 className="text-lg font-bold text-white">Sound Localization Test</h1>
            </div>
            <span className="text-cyan-300">🎧</span>
          </div>
        </header>

        <section className="space-y-6 pt-4">
          <div className="glass-panel rounded-[32px] border border-white/10 p-8">
            <h2 className="text-3xl font-black text-white mb-4">Spatial Audio Localization</h2>
            <p className="text-slate-300 mb-6">
              In this test, you'll hear tones playing from different directions in 3D space. Your task
              is to identify where each sound is coming from.
            </p>

            <div className="space-y-4 bg-slate-900/50 rounded-[24px] p-6 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎧</span>
                <div>
                  <h3 className="font-semibold text-white">Important: Use Headphones</h3>
                  <p className="text-sm text-slate-400">
                    For best results, wear headphones. The 3D spatial audio requires stereo sound to
                    accurately localize the sound source.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-slate-900/50 rounded-[24px] p-6 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📍</span>
                <div>
                  <h3 className="font-semibold text-white">How It Works</h3>
                  <ul className="text-sm text-slate-400 space-y-2 mt-2">
                    <li>• You'll hear {TOTAL_ROUNDS} sound sequences</li>
                    <li>• Each sound comes from FRONT, BACK, LEFT, or RIGHT</li>
                    <li>• Click the button that matches the sound direction</li>
                    <li>• We measure your accuracy and reaction time</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartTest}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-4 text-lg font-semibold text-slate-950 transition hover:scale-[0.99]"
            >
              Begin Test
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (testCompleted && score) {
    return (
      <main className="min-h-screen pb-32 px-6 pt-24">
        <header className="fixed top-0 left-0 right-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Test Complete</p>
              <h1 className="text-lg font-bold text-white">Results</h1>
            </div>
            <span className="text-cyan-300">✓</span>
          </div>
        </header>

        <section className="space-y-6 pt-4">
          {/* Main Score */}
          <div className="glass-panel rounded-[32px] border border-white/10 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Overall Performance</p>
            <p className="mt-6 text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              {score.overallAccuracy.toFixed(1)}%
            </p>
            <p className="mt-2 text-slate-300">{getPerceptionInsight(score)}</p>
          </div>

          {/* Detailed Stats */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="glass-panel rounded-[24px] border border-white/10 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Average Latency</p>
              <p className="mt-4 text-3xl font-black text-blue-300">{score.averageLatency.toFixed(0)} ms</p>
              <p className="mt-2 text-sm text-slate-400">Response time</p>
            </div>

            <div className="glass-panel rounded-[24px] border border-white/10 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Frontal Bias</p>
              <p
                className={`mt-4 text-3xl font-black ${
                  score.frontalBias > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {score.frontalBias > 0 ? '+' : ''}{score.frontalBias.toFixed(1)}%
              </p>
              <p className="mt-2 text-sm text-slate-400">Front vs lateral accuracy difference</p>
            </div>
          </div>

          {/* Spatial Breakdown */}
          <div className="glass-panel rounded-[32px] border border-white/10 p-8">
            <h3 className="text-xl font-bold text-white mb-6">Spatial Perception</h3>
            <div className="grid gap-4 lg:grid-cols-4">
              <div className="rounded-[24px] bg-slate-900/50 p-4 text-center">
                <p className="text-xs uppercase text-slate-400">Front</p>
                <p className="mt-3 text-2xl font-black text-cyan-300">{score.spatialAccuracy.frontal.toFixed(0)}%</p>
              </div>
              <div className="rounded-[24px] bg-slate-900/50 p-4 text-center">
                <p className="text-xs uppercase text-slate-400">Left</p>
                <p className="mt-3 text-2xl font-black text-cyan-300">{score.spatialAccuracy.lateral.toFixed(0)}%</p>
              </div>
              <div className="rounded-[24px] bg-slate-900/50 p-4 text-center">
                <p className="text-xs uppercase text-slate-400">Back</p>
                <p className="mt-3 text-2xl font-black text-blue-300">
                  {((100 - score.spatialAccuracy.frontal) / 2).toFixed(0)}%
                </p>
              </div>
              <div className="rounded-[24px] bg-slate-900/50 p-4 text-center">
                <p className="text-xs uppercase text-slate-400">Right</p>
                <p className="mt-3 text-2xl font-black text-blue-300">{score.spatialAccuracy.lowerLateral.toFixed(0)}%</p>
              </div>
            </div>
          </div>

          {/* Quadrant Analysis */}
          <div className="glass-panel rounded-[32px] border border-white/10 p-8">
            <h3 className="text-xl font-bold text-white mb-6">Quadrant Accuracy</h3>
            <div className="grid gap-4 lg:grid-cols-4">
              <div className="rounded-[24px] bg-slate-900/50 p-4 text-center">
                <p className="text-sm uppercase text-slate-400">Front-Left</p>
                <p className="mt-3 text-2xl font-black text-cyan-300">{score.quadrantAnalysis.frontLeft}</p>
              </div>
              <div className="rounded-[24px] bg-slate-900/50 p-4 text-center">
                <p className="text-sm uppercase text-slate-400">Front-Right</p>
                <p className="mt-3 text-2xl font-black text-cyan-300">{score.quadrantAnalysis.frontRight}</p>
              </div>
              <div className="rounded-[24px] bg-slate-900/50 p-4 text-center">
                <p className="text-sm uppercase text-slate-400">Back-Left</p>
                <p className="mt-3 text-2xl font-black text-blue-300">{score.quadrantAnalysis.backLeft}</p>
              </div>
              <div className="rounded-[24px] bg-slate-900/50 p-4 text-center">
                <p className="text-sm uppercase text-slate-400">Back-Right</p>
                <p className="mt-3 text-2xl font-black text-blue-300">{score.quadrantAnalysis.backRight}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleStartTest}
              className="flex-1 rounded-2xl bg-cyan-400 px-6 py-4 text-lg font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Retake Test
            </button>
            <button
              onClick={handleBackToDashboard}
              className="flex-1 rounded-2xl border border-white/10 px-6 py-4 text-lg font-semibold text-white transition hover:bg-slate-900"
            >
              Back to Home
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-40 px-6 pt-24">
      <header className="fixed top-0 left-0 right-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">3D Spatial Audio</p>
            <h1 className="text-lg font-bold text-white">
              Round {currentRound + 1} of {TOTAL_ROUNDS}
            </h1>
          </div>
          <span className="text-cyan-300">🎧</span>
        </div>
      </header>

      <section className="space-y-6 pt-4">
        {/* Spatial Visualizer */}
        <SpatialVisualizer
          isPlaying={isPlaying}
          currentDirection={currentDirection || undefined}
          accuracy={accuracy}
          latency={avgLatency}
        />

        {/* Instructions and Controls */}
        <div className="glass-panel rounded-[32px] border border-white/10 p-8">
          <div className="text-center mb-8">
            <p className="text-slate-300 mb-4">
              {isPlaying
                ? '🔊 Listening to sound... where is it coming from?'
                : 'Click "Play Sound" when ready for the next sequence'}
            </p>
            {responseTime > 0 && (
              <p className="text-sm text-cyan-300">
                Last response: {responseTime}ms •{' '}
                {results[results.length - 1]?.correct ? '✓ Correct' : '✗ Incorrect'}
              </p>
            )}
          </div>

          {!isPlaying ? (
            <>
              {currentRound === 0 ? (
                <button
                  onClick={playSound}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-4 font-semibold text-slate-950 transition hover:scale-[0.99]"
                >
                  🔊 Play Sound
                </button>
              ) : currentRound < TOTAL_ROUNDS ? (
                <button
                  onClick={playSound}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-4 font-semibold text-slate-950 transition hover:scale-[0.99]"
                >
                  🔊 Next Sound
                </button>
              ) : null}
            </>
          ) : (
            <div className="grid gap-3 grid-cols-2">
              <button
                onClick={() => handleDirectionGuess('front')}
                disabled={!isPlaying}
                className="rounded-2xl bg-slate-800 px-4 py-6 font-bold text-white transition hover:bg-slate-700 disabled:opacity-50 col-span-2"
              >
                ↑ FRONT
              </button>
              <button
                onClick={() => handleDirectionGuess('left')}
                disabled={!isPlaying}
                className="rounded-2xl bg-slate-800 px-4 py-6 font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                ← LEFT
              </button>
              <button
                onClick={() => handleDirectionGuess('right')}
                disabled={!isPlaying}
                className="rounded-2xl bg-slate-800 px-4 py-6 font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                RIGHT →
              </button>
              <button
                onClick={() => handleDirectionGuess('back')}
                disabled={!isPlaying}
                className="rounded-2xl bg-slate-800 px-4 py-6 font-bold text-white transition hover:bg-slate-700 disabled:opacity-50 col-span-2"
              >
                ↓ BACK
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="glass-panel rounded-[24px] border border-white/10 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-400">Test Progress</p>
            <p className="text-sm font-semibold text-cyan-300">
              {currentRound}/{TOTAL_ROUNDS}
            </p>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all"
              style={{ width: `${((currentRound + 1) / TOTAL_ROUNDS) * 100}%` }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
