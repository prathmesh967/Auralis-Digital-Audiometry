export const defaultFrequencies = [250, 500, 1000, 2000, 4000, 8000];
export const intensitySteps = Array.from({ length: 25 }, (_, index) => index * 5); // 0 to 120 dB in 5 dB steps
export const ANSI_QUIET_ROOM_THRESHOLD = 35;
export const ANSI_NOISE_BLOCK_THRESHOLD = 45;

export type HearingResult = {
  frequencies: number[];
  left: number[];
  right: number[];
  timestamp: string;
  ambientNoise: number;
  score: number;
  hearingAge: string;
  riskLevel: string;
  tips: string[];
};

export type SpeechResult = {
  timestamp: string;
  wordsPresented: string[];
  wordsCorrect: number;
  totalWords: number;
  score: number;
  rating: string;
  ambientNoise: number;
};

export type HistoryItem = {
  id: string;
  type: 'audiogram' | 'speech';
  timestamp: string;
  title: string;
  subtitle: string;
  score: number;
  details: string;
};

export type LastTestSummary = {
  score: number;
  ambientNoise: number;
  historyLabel: string;
  lastTest: string;
  details: string;
  hearingAge?: string;
  riskLevel?: string;
};

function getAverageThreshold(left: number[], right: number[]) {
  const total = [...left, ...right].reduce((sum, value) => sum + value, 0);
  return total / (left.length + right.length);
}

export function calculateHearingScore(left: number[], right: number[]) {
  const avg = getAverageThreshold(left, right);
  const raw = 100 - (avg - 15) * 1.1;
  return Math.round(Math.max(20, Math.min(100, raw)));
}

export function evaluateAmbientNoise(noiseLevel: number) {
  if (noiseLevel <= ANSI_QUIET_ROOM_THRESHOLD) {
    return {
      valid: true,
      status: 'Excellent',
      message: 'Environment meets audiometric quiet-room guidelines. You may start the test.',
    };
  }
  if (noiseLevel <= ANSI_NOISE_BLOCK_THRESHOLD) {
    return {
      valid: false,
      status: 'Marginal',
      message: 'Noise is slightly above ideal. Lower ambient sound if possible before beginning.',
    };
  }
  return {
    valid: false,
    status: 'Unsuitable',
    message: 'Environment is too loud for accurate audiometry. Move to a quieter location before starting.',
  };
}

export function estimateHearingAge(left: number[], right: number[]) {
  const avg = getAverageThreshold(left, right);
  if (avg <= 20) return '20-29';
  if (avg <= 30) return '30-39';
  if (avg <= 40) return '40-49';
  if (avg <= 55) return '50-59';
  if (avg <= 70) return '60-69';
  return '70+';
}

export function inferRiskLevel(left: number[], right: number[]) {
  const avg = getAverageThreshold(left, right);
  if (avg <= 25) return 'Low risk';
  if (avg <= 40) return 'Moderate risk';
  if (avg <= 55) return 'High risk';
  return 'Severe risk';
}

export function generateProtectionTips(left: number[], right: number[], ambientNoise: number) {
  const avg = getAverageThreshold(left, right);
  const tips = [] as string[];

  if (avg <= 25) {
    tips.push('Your hearing thresholds are within a healthy range. Continue protecting your hearing with quiet breaks.');
  } else if (avg <= 40) {
    tips.push('Your hearing shows some sensitivity loss. Reduce exposure to loud music and noisy environments.');
  } else if (avg <= 55) {
    tips.push('You may benefit from professional evaluation and stronger hearing protection in noisy settings.');
  } else {
    tips.push('Significant threshold shifts were detected. See a hearing care specialist and avoid loud environments.');
  }

  const highFrequencyAvg = (right[4] + right[5] + left[4] + left[5]) / 4;
  if (highFrequencyAvg > 45) {
    tips.push('High-frequency thresholds are elevated. Wear hearing protection during music and traffic exposure.');
  }

  if (ambientNoise >= 65) {
    tips.push('Your test environment is noisy. Repeat the test in a quieter room for more reliable results.');
  }

  tips.push('Limit headphone volume to 60% or less and take regular listening breaks.');
  return tips;
}

export function createHistoryItem(item: HistoryItem) {
  const history = loadHistory();
  const updated = [item, ...history].slice(0, 12);
  window.localStorage.setItem('testHistory', JSON.stringify(updated));
  return updated;
}

export function loadHistory() {
  const stored = window.localStorage.getItem('testHistory');
  if (!stored) return [] as HistoryItem[];
  try {
    return JSON.parse(stored) as HistoryItem[];
  } catch {
    return [] as HistoryItem[];
  }
}

export function saveHearingTestResult(result: HearingResult) {
  window.localStorage.setItem('audiogramResult', JSON.stringify(result));
  const summary: LastTestSummary = {
    score: result.score,
    ambientNoise: result.ambientNoise,
    historyLabel: 'Hearing Test History',
    lastTest: `Last hearing exam ${new Date(result.timestamp).toLocaleString()}`,
    details: `Hearing age: ${result.hearingAge} • Risk level: ${result.riskLevel}`,
    hearingAge: result.hearingAge,
    riskLevel: result.riskLevel,
  };
  window.localStorage.setItem('lastTestSummary', JSON.stringify(summary));

  createHistoryItem({
    id: `hearing-${result.timestamp}`,
    type: 'audiogram',
    timestamp: result.timestamp,
    title: 'Pure Tone Hearing Test',
    subtitle: `Score ${result.score} • ${result.riskLevel}`,
    score: result.score,
    details: `Estimated hearing age ${result.hearingAge}.`,
  });
}

export function saveSpeechTestResult(result: SpeechResult) {
  window.localStorage.setItem('speechResult', JSON.stringify(result));
  const summary: LastTestSummary = {
    score: result.score,
    ambientNoise: result.ambientNoise,
    historyLabel: 'Speech Test History',
    lastTest: `Last speech test ${new Date(result.timestamp).toLocaleString()}`,
    details: `${result.wordsCorrect}/${result.totalWords} words correct • ${result.rating}`,
  };
  window.localStorage.setItem('lastTestSummary', JSON.stringify(summary));

  createHistoryItem({
    id: `speech-${result.timestamp}`,
    type: 'speech',
    timestamp: result.timestamp,
    title: 'Speech Hearing Test',
    subtitle: `${result.wordsCorrect}/${result.totalWords} words correct`,
    score: result.score,
    details: `Speech intelligibility rating: ${result.rating}`,
  });
}
