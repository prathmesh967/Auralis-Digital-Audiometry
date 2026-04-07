import { Link } from 'react-router-dom';

export default function LegacyUiPage() {
  return (
    <main className="min-h-screen pb-32 px-6 pt-24">
      <div className="glass-panel rounded-[32px] border border-white/10 p-8 shadow-glow">
        <p className="text-[10px] uppercase tracking-[0.3em] text-secondary">Legacy UI</p>
        <h1 className="mt-3 text-3xl font-black text-white">Classic Audiometry View</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          This legacy interface provides a simplified classical layout for quick access to core audiometry features.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[32px] bg-slate-950/80 p-8 shadow-inner">
            <h2 className="text-xl font-bold text-white">Quick access</h2>
            <p className="mt-2 text-sm text-slate-400">Jump into the older-style flow for hearing and speech tests.</p>
            <div className="mt-6 space-y-4">
              <Link
                to="/hearing-test"
                className="block rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Launch Hearing Test
              </Link>
              <Link
                to="/speech-test"
                className="block rounded-2xl bg-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-600"
              >
                Launch Speech Test
              </Link>
              <Link
                to="/3d-sound-test"
                className="block rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
              >
                Launch 3D Sound Test
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] bg-slate-950/80 p-8 shadow-inner">
            <h2 className="text-xl font-bold text-white">Classic overview</h2>
            <p className="mt-2 text-sm text-slate-400">
              Legacy UI presents a cleaner, more direct navigation structure, designed for users who prefer a simpler audiometry workflow.
            </p>
            <div className="mt-6 rounded-[28px] bg-slate-900/80 p-6">
              <p className="text-sm text-slate-300">Features included:</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li>• Direct test launch buttons</li>
                <li>• Minimalist visual layout</li>
                <li>• Faster navigation for experienced users</li>
                <li>• Profile and logout accessible from the main nav</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[32px] bg-slate-900/80 p-8 text-sm text-slate-300">
          <p>
            Legacy mode is fully functional and will preserve your test progress. Use it when you want a compact classic experience with the same backend sync support.
          </p>
        </div>
      </div>
    </main>
  );
}
