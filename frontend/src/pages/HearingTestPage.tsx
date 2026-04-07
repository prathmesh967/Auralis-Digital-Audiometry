import { useEffect, useState } from 'react';
import { createToneController, startNoiseMeter, stopTone, ToneController } from '../lib/audio';
import { useNavigate } from 'react-router-dom';
import NoiseCheckModal from '../components/NoiseCheckModal';
import {
  ANSI_NOISE_BLOCK_THRESHOLD,
  ANSI_QUIET_ROOM_THRESHOLD,
  defaultFrequencies,
  intensitySteps,
  calculateHearingScore,
  estimateHearingAge,
  evaluateAmbientNoise,
  inferRiskLevel,
  generateProtectionTips,
  saveHearingTestResult,
  HearingResult,
} from '../lib/audiometry';
import { submitHearingResult } from '../lib/api';

const initialIntensityIndex = intensitySteps.indexOf(30);

export default function HearingTestPage() {
  const navigate = useNavigate();
  const [toneController, setToneController] = useState<ToneController | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [showNoiseCheckModal, setShowNoiseCheckModal] = useState(true);
  const [earIndex, setEarIndex] = useState(0);
  const [frequencyIndex, setFrequencyIndex] = useState(0);
  const [currentIntensityIndex, setCurrentIntensityIndex] = useState(initialIntensityIndex);
  const [lastResponse, setLastResponse] = useState<'heard' | 'notHeard' | null>(null);
  const [leftThresholds, setLeftThresholds] = useState<number[]>([]);
  const [rightThresholds, setRightThresholds] = useState<number[]>([]);
  const [precheckMessage, setPrecheckMessage] = useState('Check the ambient noise before starting the hearing test.');

  const currentEar = earIndex === 0 ? 'Left' : 'Right';
  const currentFrequency = defaultFrequencies[frequencyIndex];
  const currentIntensity = intensitySteps[currentIntensityIndex];
  const isLeftPhase = earIndex === 0;
  const isLastFrequency = frequencyIndex === defaultFrequencies.length - 1;
  const stageLabel = `${currentEar} Ear — ${currentFrequency} Hz`;
  const noiseEvaluation = evaluateAmbientNoise(noiseLevel);
  const noiseSafe = noiseLevel <= ANSI_QUIET_ROOM_THRESHOLD;
  const noiseMarginal = noiseLevel > ANSI_QUIET_ROOM_THRESHOLD && noiseLevel <= ANSI_NOISE_BLOCK_THRESHOLD;
  const noiseDanger = noiseLevel > ANSI_NOISE_BLOCK_THRESHOLD;

  useEffect(() => {
    const stopMeter = startNoiseMeter(setNoiseLevel);

    return () => {
      stopMeter();
      toneController?.stop();
      stopTone();
    };
  }, []);

  useEffect(() => {
    if (toneController) {
      toneController.setFrequency(currentFrequency);
      toneController.setIntensity(currentIntensity);
    }
  }, [currentFrequency, currentIntensity, toneController]);

  const handleStartTest = () => {
    if (!noiseEvaluation.valid) {
      setPrecheckMessage(noiseEvaluation.message);
      return;
    }
    setTestStarted(true);
    setPrecheckMessage(noiseEvaluation.message);
  };

  const handlePlayPause = () => {
    if (!toneController) {
      const controller = createToneController(currentFrequency, currentIntensity);
      setToneController(controller);
      setIsPlaying(true);
      return;
    }

    if (isPlaying) {
      toneController.pause();
      setIsPlaying(false);
      return;
    }

    toneController.play();
    setIsPlaying(true);
  };

  const persistHearingResult = async (result: HearingResult) => {
    try {
      await submitHearingResult(result);
    } catch (error) {
      console.warn('Unable to save hearing result to backend, falling back to local storage.', error);
      saveHearingTestResult(result);
    }
  };

  const applyResponse = (heard: boolean) => {
    const response = heard ? 'heard' : 'notHeard';
    const currentLevelIndex = currentIntensityIndex;
    const currentLevelValue = intensitySteps[currentLevelIndex];
    let nextIndex = currentLevelIndex;
    let thresholdFound = false;
    let thresholdValue = currentLevelValue;

    if (response === 'heard') {
      if (lastResponse === 'notHeard' || currentLevelIndex <= 1) {
        thresholdFound = true;
      } else {
        nextIndex = Math.max(0, currentLevelIndex - 2); // down 10 dB
      }
    } else {
      if (currentLevelIndex >= intensitySteps.length - 1) {
        thresholdFound = true;
      } else {
        nextIndex = Math.min(intensitySteps.length - 1, currentLevelIndex + 1); // up 5 dB
      }
    }

    setLastResponse(response);

    if (thresholdFound) {
      recordThreshold(thresholdValue);
      return;
    }

    setCurrentIntensityIndex(nextIndex);
  };

  const recordThreshold = (threshold: number) => {
    const nextLeftThresholds = isLeftPhase ? [...leftThresholds, threshold] : leftThresholds;
    const nextRightThresholds = isLeftPhase ? rightThresholds : [...rightThresholds, threshold];

    toneController?.stop();
    setToneController(null);
    setIsPlaying(false);
    setLastResponse(null);

    if (!isLastFrequency) {
      if (isLeftPhase) {
        setLeftThresholds(nextLeftThresholds);
      } else {
        setRightThresholds(nextRightThresholds);
      }
      setFrequencyIndex((index) => index + 1);
      setCurrentIntensityIndex(initialIntensityIndex);
      return;
    }

    if (isLeftPhase) {
      setLeftThresholds(nextLeftThresholds);
      setEarIndex(1);
      setFrequencyIndex(0);
      setCurrentIntensityIndex(initialIntensityIndex);
      return;
    }

    const finalLeft = nextLeftThresholds;
    const finalRight = nextRightThresholds;
    const score = calculateHearingScore(finalLeft, finalRight);
    const hearingAge = estimateHearingAge(finalLeft, finalRight);
    const riskLevel = inferRiskLevel(finalLeft, finalRight);
    const tips = generateProtectionTips(finalLeft, finalRight, noiseLevel);

    const result: HearingResult = {
      frequencies: defaultFrequencies,
      left: finalLeft,
      right: finalRight,
      timestamp: new Date().toISOString(),
      ambientNoise: noiseLevel,
      score,
      hearingAge,
      riskLevel,
      tips,
    };

    void persistHearingResult(result);
    navigate('/results');
  };

  return (
    <main className="min-h-screen pb-32 px-6 pt-24">
      <header className="fixed top-0 left-0 right-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Adaptive Audiometry</p>
            <h1 className="text-lg font-bold text-white">Hearing Threshold Test</h1>
          </div>
          <span className="text-cyan-300">{(leftThresholds.length + rightThresholds.length)}/{defaultFrequencies.length * 2}</span>
        </div>
      </header>

      <section className="space-y-6 pt-4">
        {!testStarted ? (
          <div className="glass-panel rounded-[32px] border border-white/10 p-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Noise Precheck</p>
                <h2 className="text-3xl font-black text-white">Ambient Noise Level</h2>
                <p className="mt-4 text-5xl font-black text-cyan-300">{noiseLevel} dB</p>
                <p className={`mt-4 text-sm ${noiseDanger ? 'text-rose-300' : noiseMarginal ? 'text-amber-300' : 'text-slate-300'}`}>
                  {precheckMessage}
                </p>
              </div>
              <div className="rounded-[28px] bg-slate-950/80 p-6">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Environment status</p>
                <div className="mt-6 space-y-3 text-sm text-slate-300">
                  <p>{noiseLevel <= ANSI_QUIET_ROOM_THRESHOLD ? 'Quiet-room standard achieved.' : 'Standard quiet-room noise is 35 dB or lower.'}</p>
                  <p>Use headphones, close doors, and pause background audio.</p>
                </div>
              </div>
            </div>
            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleStartTest}
                className="rounded-3xl bg-cyan-400 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Start Hearing Test
              </button>
              <div className="text-right text-sm text-slate-400">
                <p>ANSI/ISO quiet-room limit: {ANSI_QUIET_ROOM_THRESHOLD} dB</p>
                <p>Current test quality: {noiseDanger ? 'Unsuitable' : noiseMarginal ? 'Marginal' : 'Good'}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="glass-panel rounded-[32px] border border-white/10 p-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Current Stage</p>
                  <h2 className="text-5xl font-black text-white">{stageLabel}</h2>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Intensity</p>
                  <h2 className="text-5xl font-black text-white">{currentIntensity} <span className="text-xl text-secondary">dB</span></h2>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[32px] border border-white/10 p-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Frequency</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {defaultFrequencies.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFrequencyIndex(defaultFrequencies.indexOf(value))}
                        className={`rounded-2xl border px-4 py-3 text-sm transition ${
                          currentFrequency === value
                            ? 'border-cyan-300 bg-cyan-400/10 text-white'
                            : 'border-white/10 text-slate-300 hover:border-cyan-300'
                        }`}
                      >
                        {value} Hz
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Intensity Steps</p>
                  <div className="mt-4 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setCurrentIntensityIndex((current) => Math.max(0, current - 1))}
                      className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white transition hover:border-cyan-300"
                    >
                      -
                    </button>
                    <span className="text-2xl font-bold text-white">{currentIntensity} dB</span>
                    <button
                      type="button"
                      onClick={() => setCurrentIntensityIndex((current) => Math.min(intensitySteps.length - 1, current + 1))}
                      className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white transition hover:border-cyan-300"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[32px] border border-white/10 p-6 text-center">
              <button
                type="button"
                onClick={handlePlayPause}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 px-8 py-4 text-sm font-semibold text-slate-950 transition hover:scale-[0.99]"
              >
                {isPlaying ? 'Pause Tone' : 'Play Tone'}
              </button>
              <p className="mt-4 text-sm text-slate-400">Play the tone and indicate whether you hear it clearly in your currently tested ear.</p>
            </div>

            <div className="glass-panel rounded-[32px] border border-white/10 p-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[28px] bg-slate-950/80 p-6">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Response</p>
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => applyResponse(true)}
                    className="rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                  >
                    Heard
                  </button>
                  <button
                    type="button"
                    onClick={() => applyResponse(false)}
                    className="rounded-2xl bg-rose-500 px-5 py-4 text-sm font-semibold text-white transition hover:bg-rose-400"
                  >
                    Not heard
                  </button>
                </div>
              </div>
              <div className="rounded-[28px] bg-slate-950/80 p-6">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Tips for Testing</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  <li>Stay still and listen carefully to each tone.</li>
                  <li>Use noise-cancelling headphones if available.</li>
                  <li>Respond only when the tone is audible, not when you imagine it.</li>
                </ul>
              </div>
            </div>

            <div className="glass-panel rounded-[32px] border border-white/10 p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-300">
                {isLeftPhase
                  ? 'Testing left ear first. After the last frequency, the test will switch to the right ear.'
                  : 'Testing right ear now. Complete all frequencies to generate your audiogram result.'}
              </p>
              <div className="text-right text-sm text-slate-400">
                <p>Left ear recorded: {leftThresholds.length}/6</p>
                <p>Right ear recorded: {rightThresholds.length}/6</p>
              </div>
            </div>
          </>
        )}
      </section>

      <NoiseCheckModal
        isOpen={showNoiseCheckModal}
        onProceed={() => setShowNoiseCheckModal(false)}
        onCancel={() => navigate('/dashboard')}
      />
    </main>
  );
}
