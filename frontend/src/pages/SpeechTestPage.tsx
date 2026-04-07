import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startNoiseMeter } from '../lib/audio';
import { SpeechResult } from '../lib/audiometry';
import { submitSpeechResult } from '../lib/api';

const speechPrompts = [
  'Please say the phrase exactly as shown.',
  'Turn down the volume when listening in noisy places.',
  'The speech test checks clarity and comprehension.',
  'Repeat the sentence and focus on every word.',
  'Use calm, clear speech into the microphone.',
  'The app plays spoken phrases to evaluate recognition.',
  'This hearing module supports speech intelligibility.',
  'Keep your mouth steady and pronounce all words.',
  'Quiet rooms help improve speech recognition accuracy.',
  'Listen carefully and repeat the prompt clearly.',
];

export default function SpeechTestPage() {
  const navigate = useNavigate();
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [micAllowed, setMicAllowed] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Use the mic to speak the shown sentence.');
  const [matchStatus, setMatchStatus] = useState<string | null>(null);
  const [wordsCorrect, setWordsCorrect] = useState(0);
  const [currentWordCorrect, setCurrentWordCorrect] = useState(false);
  const [speechComplete, setSpeechComplete] = useState(false);
  const [speechScore, setSpeechScore] = useState(0);
  const [speechRating, setSpeechRating] = useState('');

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setRecognitionSupported(Boolean(SpeechRecognition));

    const obtainMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        setMicAllowed(true);
        return stream;
      } catch (error) {
        setMicAllowed(false);
        setStatusMessage('Microphone access denied. Please allow the mic to run the speech test.');
        return null;
      }
    };

    let stopMeter = () => {};
    (async () => {
      const stream = await obtainMic();
      stopMeter = startNoiseMeter(setNoiseLevel, stream ?? undefined);
    })();

    return () => {
      stopMeter();
      recognitionRef.current?.stop?.();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const playPrompt = (prompt: string) => {
    if (!('speechSynthesis' in window)) {
      setStatusMessage('Speech playback is unavailable in this browser.');
      return;
    }
    const utterance = new SpeechSynthesisUtterance(prompt);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const requestMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setMicAllowed(true);
      return stream;
    } catch (error) {
      setMicAllowed(false);
      setStatusMessage('Microphone access denied.');
      return null;
    }
  };

  const handleRecord = async () => {
    if (speechComplete) {
      return;
    }

    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      setStatusMessage('Recording stopped.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatusMessage('Speech recognition is not supported in this browser.');
      return;
    }

    const stream = mediaStreamRef.current || (await requestMicrophone());
    if (!stream) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setRecording(true);
      setTranscript('');
      setMatchStatus(null);
      setStatusMessage('Listening... Speak the word clearly into the mic.');
      setCurrentWordCorrect(false);
    };

    recognition.onresult = (event: any) => {
      const resultText = event.results?.[0]?.[0]?.transcript || '';
const expected = speechPrompts[currentWordIndex].toLowerCase().trim();
      const normalized = resultText.toLowerCase().trim();
      const correct = normalized === expected;

      setTranscript(resultText);
      setMatchStatus(correct ? 'Matched' : 'Try again');
      setStatusMessage(correct ? 'Great! You repeated the sentence correctly.' : 'The spoken sentence did not match exactly. Try again.');

      if (correct && !currentWordCorrect) {
        setWordsCorrect((current) => current + 1);
        setCurrentWordCorrect(true);
      }
    };

    recognition.onerror = (event: any) => {
      setStatusMessage(`Recognition error: ${event.error || 'unknown error'}`);
      setRecording(false);
    };

    recognition.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const persistSpeechResult = async (result: SpeechResult) => {
    try {
      await submitSpeechResult(result);
    } catch (error) {
      console.warn('Unable to save speech result to backend, falling back to local storage.', error);
      window.localStorage.setItem('speechResult', JSON.stringify(result));
    }
  };

  const finishSpeechTest = () => {
    const totalWords = speechPrompts.length;
    const score = Math.round((wordsCorrect / totalWords) * 100);
    const rating = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 50 ? 'Fair' : 'Needs improvement';

    const speechResult: SpeechResult = {
      timestamp: new Date().toISOString(),
      wordsPresented: speechPrompts,
      wordsCorrect,
      totalWords,
      score,
      rating,
      ambientNoise: noiseLevel,
    };

    void persistSpeechResult(speechResult);
    setSpeechScore(score);
    setSpeechRating(rating);
    setSpeechComplete(true);
    setStatusMessage('Speech test complete. Review your score and recommendations.');
  };

  const goToNextWord = () => {
    if (currentWordIndex >= speechPrompts.length - 1) {
      finishSpeechTest();
      return;
    }

    setCurrentWordIndex((index) => index + 1);
    setTranscript('');
    setMatchStatus(null);
    setCurrentWordCorrect(false);
    setStatusMessage('Ready for the next prompt.');
  };

  const resetSpeechTest = () => {
    setCurrentWordIndex(0);
    setTranscript('');
    setMatchStatus(null);
    setWordsCorrect(0);
    setSpeechComplete(false);
    setSpeechScore(0);
    setSpeechRating('');
    setStatusMessage('Speech test restarted.');
  };

  return (
    <main className="min-h-screen pb-32 px-6 pt-24">
      <div className="glass-panel mx-auto max-w-4xl rounded-[32px] border border-white/10 p-8 shadow-glow">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-secondary">Speech Test</p>
            <h1 className="mt-3 text-3xl font-black text-white">Speech Recognition + Mic Check</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              Read each word aloud with your microphone. The browser evaluates whether your speech matches the prompt.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => playPrompt(speechPrompts[currentWordIndex])}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Hear Prompt
            </button>
            <button
              type="button"
              onClick={handleRecord}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${recording ? 'bg-rose-500 text-white hover:bg-rose-400' : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'}`}
            >
              {recording ? 'Stop Recording' : 'Record Word'}
            </button>
          </div>
        </div>

        {speechComplete ? (
          <div className="rounded-[28px] bg-slate-950/80 p-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Speech test complete</p>
                <h2 className="mt-4 text-4xl font-black text-white">{speechScore}%</h2>
                <p className="mt-2 text-sm text-slate-300">{speechRating} performance based on {wordsCorrect}/{speechPrompts.length} correct prompts.</p>
              </div>
              <div className="rounded-3xl bg-slate-900/70 p-6">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Noise level during test</p>
                <p className="mt-4 text-3xl font-black text-cyan-300">{noiseLevel} dB</p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetSpeechTest}
              className="mt-6 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Retry Speech Test
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="rounded-[28px] bg-slate-950/80 p-8">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Current prompt</p>
              <div className="mt-6 rounded-[28px] border border-cyan-500/20 bg-slate-900/80 p-8 text-center">
                <p className="text-sm uppercase tracking-[0.4em] text-cyan-300">Say this sentence</p>
                <h2 className="mt-4 text-4xl font-black text-white">{speechPrompts[currentWordIndex]}</h2>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-900/70 p-6">
                  <p className="text-sm text-slate-400">Recognized text</p>
                  <p className="mt-4 min-h-[2rem] text-lg font-semibold text-white">{transcript || 'Waiting for speech...'}</p>
                </div>
                <div className="rounded-3xl bg-slate-900/70 p-6">
                  <p className="text-sm text-slate-400">Match status</p>
                  <p className={`mt-4 min-h-[2rem] text-lg font-semibold ${matchStatus === 'Matched' ? 'text-emerald-400' : 'text-amber-300'}`}> {matchStatus || 'Not yet verified'} </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={goToNextWord}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Next Prompt
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentWordIndex(0)}
                  className="rounded-2xl bg-slate-900/80 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Restart List
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6 rounded-[28px] bg-slate-950/80 p-6">
              <div className="rounded-3xl bg-slate-900/70 p-6">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Microphone status</p>
                <p className="mt-4 text-lg font-semibold text-white">{micAllowed ? 'Enabled' : 'Disabled'}</p>
                <p className="mt-3 text-sm text-slate-300">{statusMessage}</p>
              </div>

              <div className="rounded-3xl bg-slate-900/70 p-6">
                <div className="mb-4 flex items-center justify-between text-sm text-slate-400">
                  <span>Ambient noise</span>
                  <span>{noiseLevel} dB</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${Math.min(noiseLevel * 2, 100)}%` }} />
                </div>
                <p className="mt-4 text-sm text-slate-300">Keep the room under 55 dB for improved speech recognition accuracy.</p>
              </div>

              <div className="rounded-3xl bg-slate-900/70 p-6">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Progress</p>
                <p className="mt-4 text-lg font-semibold text-white">{currentWordIndex + 1}/{speechPrompts.length} prompts</p>
                <p className="mt-2 text-sm text-slate-300">Correct so far: {wordsCorrect}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
