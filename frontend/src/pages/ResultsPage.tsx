import { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { fetchHearingResults, fetchSpeechResults } from '../lib/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { jsPDF } from 'jspdf';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const defaultLabels = ['250', '500', '1000', '2000', '4000', '8000'];

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: '#f1f3fc',
      },
    },
    title: {
      display: true,
      text: 'Audiogram Report',
      color: '#f1f3fc',
      font: {
        size: 18,
      },
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Frequency (Hz)',
        color: '#cbd5e1',
      },
      ticks: {
        color: '#cbd5e1',
      },
      grid: {
        color: 'rgba(255,255,255,0.08)',
      },
    },
    y: {
      title: {
        display: true,
        text: 'Intensity (dB)',
        color: '#cbd5e1',
      },
      ticks: {
        color: '#cbd5e1',
      },
      grid: {
        color: 'rgba(255,255,255,0.08)',
      },
      reverse: true,
      suggestedMin: 0,
      suggestedMax: 160,
    },
  },
};

type HearingResult = {
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

type SpeechResult = {
  timestamp: string;
  wordsPresented: string[];
  wordsCorrect: number;
  totalWords: number;
  score: number;
  rating: string;
  ambientNoise: number;
};

const defaultResults: HearingResult = {
  frequencies: [250, 500, 1000, 2000, 4000, 8000],
  left: [50, 50, 100, 100, 150, 150],
  right: [50, 50, 100, 100, 150, 150],
  timestamp: new Date().toISOString(),
  ambientNoise: 45,
  score: 68,
  hearingAge: '40-49',
  riskLevel: 'Moderate risk',
  tips: ['Keep volume levels lower and repeat the test in a quiet room.'],
};

export default function ResultsPage() {
  const chartRef = useRef<any>(null);
  const [results, setResults] = useState<HearingResult>(defaultResults);
  const [speechResult, setSpeechResult] = useState<SpeechResult | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const hearingResponse = await fetchHearingResults();
        if (hearingResponse.results?.length) {
          setResults(hearingResponse.results[0]);
        }
      } catch (error) {
        console.warn('Unable to load hearing results from backend, using local fallback.', error);
        const stored = localStorage.getItem('audiogramResult');
        if (stored) {
          setResults(JSON.parse(stored));
        }
      }

      try {
        const speechResponse = await fetchSpeechResults();
        if (speechResponse.results?.length) {
          setSpeechResult(speechResponse.results[0]);
        }
      } catch (error) {
        console.warn('Unable to load speech results from backend, using local fallback.', error);
        const speechStored = localStorage.getItem('speechResult');
        if (speechStored) {
          setSpeechResult(JSON.parse(speechStored));
        }
      }
    };

    void loadResults();
  }, []);

  const data = {
    labels: results.frequencies.map((value) => value.toString()),
    datasets: [
      {
        label: 'Left Ear (dB)',
        data: results.left,
        borderColor: '#96f8ff',
        backgroundColor: 'rgba(150, 248, 255, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Right Ear (dB)',
        data: results.right,
        borderColor: '#af88ff',
        backgroundColor: 'rgba(175, 136, 255, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Audiogram Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Date: ${new Date(results.timestamp).toLocaleString()}`, 14, 34);
    doc.text(`Hearing Age: ${results.hearingAge}`, 14, 42);
    doc.text(`Risk Level: ${results.riskLevel}`, 14, 50);

    doc.setFontSize(12);
    doc.text('Left Ear Thresholds', 14, 62);
    results.frequencies.forEach((frequency, idx) => {
      doc.text(`${frequency} Hz: ${results.left[idx]} dB`, 14, 70 + idx * 8);
    });

    const rightStart = 70 + results.frequencies.length * 8 + 8;
    doc.text('Right Ear Thresholds', 14, rightStart);
    results.frequencies.forEach((frequency, idx) => {
      doc.text(`${frequency} Hz: ${results.right[idx]} dB`, 14, rightStart + 8 + idx * 8);
    });

    let extraStart = rightStart + 8 + results.frequencies.length * 8 + 12;
    if (speechResult) {
      doc.setFontSize(12);
      doc.text('Speech Test Summary', 14, extraStart);
      doc.text(`Correct: ${speechResult.wordsCorrect}/${speechResult.totalWords}`, 14, extraStart + 8);
      doc.text(`Score: ${speechResult.score}`, 14, extraStart + 16);
      doc.text(`Rating: ${speechResult.rating}`, 14, extraStart + 24);
      extraStart += 32;
    }

    const imageData = chartRef.current?.toBase64Image();
    if (imageData) {
      doc.addImage(imageData, 'PNG', 14, extraStart, 180, 90);
    }

    doc.save('audiogram-report.pdf');
  };

  const downloadXml = () => {
    const xmlFragments = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<audiogram>',
      `  <timestamp>${results.timestamp}</timestamp>`,
      `  <hearingAge>${results.hearingAge}</hearingAge>`,
      `  <riskLevel>${results.riskLevel}</riskLevel>`,
      `  <ambientNoise>${results.ambientNoise}</ambientNoise>`,
      '  <leftEar>',
      ...results.frequencies.map((frequency, idx) => `    <frequency hz="${frequency}">${results.left[idx]}</frequency>`),
      '  </leftEar>',
      '  <rightEar>',
      ...results.frequencies.map((frequency, idx) => `    <frequency hz="${frequency}">${results.right[idx]}</frequency>`),
      '  </rightEar>',
    ];

    if (speechResult) {
      xmlFragments.push('  <speechTest>');
      xmlFragments.push(`    <wordsCorrect>${speechResult.wordsCorrect}</wordsCorrect>`);
      xmlFragments.push(`    <totalWords>${speechResult.totalWords}</totalWords>`);
      xmlFragments.push(`    <score>${speechResult.score}</score>`);
      xmlFragments.push(`    <rating>${speechResult.rating}</rating>`);
      xmlFragments.push(`    <ambientNoise>${speechResult.ambientNoise}</ambientNoise>`);
      xmlFragments.push('  </speechTest>');
    }

    xmlFragments.push('</audiogram>');
    const xml = xmlFragments.join('\n');

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audiogram-report.xml';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen pb-32 px-6 pt-24">
      <div className="glass-panel rounded-[32px] border border-white/10 p-8 shadow-glow">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-secondary">Audiogram Summary</p>
            <h1 className="mt-3 text-3xl font-black text-white">Results & Report</h1>
            <p className="mt-3 text-sm text-slate-300">Hearing age estimate: {results.hearingAge} • Risk: {results.riskLevel}</p>
          </div>
          <div className="rounded-3xl bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
            Last test: {new Date(results.timestamp).toLocaleString()}
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={downloadPdf}
            className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={downloadXml}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300"
          >
            Download XML
          </button>
        </div>

        <div className="rounded-[28px] bg-slate-950/80 p-4">
          <Line ref={chartRef} data={data} options={options} />
        </div>
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="glass-panel rounded-[32px] border border-white/10 p-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Clinical Insights</p>
          <h2 className="mt-4 text-xl font-bold text-white">Personalized hearing review</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Your hearing thresholds are displayed for each frequency and ear. Follow the recommendations below to protect your hearing health.
          </p>
          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <p><span className="font-semibold text-white">Hearing health score:</span> {results.score}</p>
            <p><span className="font-semibold text-white">Ambient noise recorded:</span> {results.ambientNoise} dB</p>
          </div>
        </div>
        <div className="glass-panel rounded-[32px] border border-white/10 p-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Recommendations</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {results.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      </section>

      {speechResult && (
        <section className="mt-8 glass-panel rounded-[32px] border border-white/10 p-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Speech Hearing</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-white">Speech Test Summary</h2>
              <p className="mt-3 text-sm text-slate-300">You recognized {speechResult.wordsCorrect}/{speechResult.totalWords} words correctly.</p>
            </div>
            <div className="rounded-[28px] bg-slate-950/80 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Speech score</p>
              <p className="mt-3 text-4xl font-black text-cyan-300">{speechResult.score}</p>
              <p className="mt-2 text-sm text-slate-300">Rating: {speechResult.rating}</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
