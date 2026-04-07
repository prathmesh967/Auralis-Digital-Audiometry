import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchHistory, getStoredUser } from '../lib/api';
import { LastTestSummary, HistoryItem } from '../lib/audiometry';
import ProfileModal from '../components/ProfileModal';

const defaultSummary: LastTestSummary = {
  score: 85,
  ambientNoise: 42,
  historyLabel: 'Stable History',
  lastTest: 'No recent test',
  details: 'Your hearing is in the optimal range. Keep up the protection.',
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<LastTestSummary>(defaultSummary);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const storedUser = getStoredUser();

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetchHistory();
        setHistory(response.history);

        if (response.history.length > 0) {
          const latest = response.history[0];
          setSummary({
            score: latest.score,
            ambientNoise: latest.ambientNoise ?? 40,
            historyLabel: latest.type === 'audiogram' ? 'Latest Hearing Exam' : 'Latest Speech Test',
            lastTest: `Last test ${new Date(latest.timestamp).toLocaleString()}`,
            details: latest.details || '',
          });
        }
      } catch (error) {
        console.warn('Unable to load history from backend.', error);
      }
    };
    void loadHistory();
  }, []);

  return (
    <main className="min-h-screen pb-32 px-6 pt-24">
      <header className="fixed top-0 left-0 right-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="h-10 w-10 overflow-hidden rounded-full border border-cyan-400/20 bg-slate-800 flex items-center justify-center hover:border-cyan-400/50 transition text-lg"
            >
              {storedUser?.name ? storedUser.name.charAt(0).toUpperCase() : '👤'}
            </button>
            <h1 className="text-xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-headline">
              Auralis
            </h1>
          </div>
          <button className="text-cyan-300 hover:text-white transition">⚙️</button>
        </div>
      </header>

      <section className="space-y-8 pt-4">
        <div className="glass-panel rounded-[32px] border border-white/10 p-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <span className="text-xs uppercase tracking-[0.35em] text-slate-400">Overall Sonic Index</span>
          <div className="mt-8 flex items-center justify-center">
            <div className="relative flex h-48 w-48 flex-col items-center justify-center rounded-full border border-white/10 bg-slate-950/80">
              <span className="text-6xl font-black text-white">{summary.score}</span>
              <span className="mt-2 text-sm uppercase tracking-[0.25em] text-cyan-300">Last score</span>
            </div>
          </div>
          <div className="mt-6 text-center">
            <h2 className="text-2xl font-bold text-white">{summary.historyLabel}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300">{summary.details}</p>
            <p className="mt-3 text-sm text-slate-400">{summary.lastTest}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-panel rounded-[32px] border border-white/10 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Live Environment</p>
                <h3 className="mt-2 text-lg font-bold text-white">Ambient Noise</h3>
              </div>
              <span className="text-2xl text-cyan-300">📶</span>
            </div>
            <div className="mt-6 flex items-end gap-2 h-16">
              {[4, 8, 6, 10, 5, 9, 4, 7, 11, 6, 8].map((height) => (
                <div
                  key={height}
                  className="w-2 rounded-full bg-cyan-300"
                  style={{ height: `${height * 8}px` }}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-3xl font-black text-cyan-300">{summary.ambientNoise} <span className="text-sm font-medium text-slate-400">dB</span></span>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-emerald-300">
                Safe Zone
              </span>
            </div>
          </div>
          <div className="glass-panel rounded-[32px] border border-white/10 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Threshold Analytics</p>
                <h3 className="mt-2 text-lg font-bold text-white">Recent History</h3>
              </div>
              <span className="text-2xl text-secondary">📊</span>
            </div>
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              {history.length > 0 ? (
                history.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-3xl bg-slate-900/70 p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{item.title}</p>
                    <p className="mt-2 text-base font-semibold text-white">{item.subtitle}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.details}</p>
                  </div>
                ))
              ) : (
                <p>No previous tests recorded yet. Start your first hearing assessment below.</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Link
            to="/hearing-test"
            className="glass-panel rounded-[28px] border border-white/10 p-6 hover:border-cyan-400/50 transition-all hover:scale-[1.02] group"
          >
            <div className="flex flex-col items-start justify-between h-full">
              <div className="space-y-2">
                <span className="text-3xl">🎧</span>
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition">Hearing Test</h3>
              </div>
              <p className="text-sm text-slate-400 mt-4">Assess your hearing frequencies</p>
            </div>
          </Link>

          <Link
            to="/3d-sound-test"
            className="glass-panel rounded-[28px] border border-white/10 p-6 hover:border-cyan-400/50 transition-all hover:scale-[1.02] group"
          >
            <div className="flex flex-col items-start justify-between h-full">
              <div className="space-y-2">
                <span className="text-3xl">🌐</span>
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition">3D Sound</h3>
              </div>
              <p className="text-sm text-slate-400 mt-4">Explore spatial audio</p>
            </div>
          </Link>

          <Link
            to="/speech-test"
            className="glass-panel rounded-[28px] border border-white/10 p-6 hover:border-cyan-400/50 transition-all hover:scale-[1.02] group"
          >
            <div className="flex flex-col items-start justify-between h-full">
              <div className="space-y-2">
                <span className="text-3xl">🗣️</span>
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition">Speech Test</h3>
              </div>
              <p className="text-sm text-slate-400 mt-4">Test speech recognition</p>
            </div>
          </Link>
        </div>
      </section>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </main>
  );
}
