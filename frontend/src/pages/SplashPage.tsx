import { Link } from 'react-router-dom';

export default function SplashPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="glass-panel border border-white/10 max-w-4xl p-10 rounded-[32px] shadow-glow">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Sonic Architect</p>
          <h1 className="font-headline text-5xl font-black tracking-tight text-white sm:text-6xl">
            Audiometry, spatial audio, and intelligent hearing diagnostics
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300 max-w-2xl mx-auto">
            A React + Vite hearing-health experience built with Tailwind CSS, Web Audio, Three.js, Howler, and Chart.js.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 text-left">
            <h2 className="text-sm uppercase tracking-[0.25em] text-secondary">Core Modules</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>Hearing testing with adaptive audiometry</li>
              <li>Ambient noise analysis</li>
              <li>Speech playback and mic decibel monitoring</li>
              <li>Interactive audiogram reports</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 text-left">
            <h2 className="text-sm uppercase tracking-[0.25em] text-primary">Get started</h2>
            <p className="mt-4 text-sm text-slate-300">
              Use the dashboard to get an overview, then run a hearing test and review audiogram analytics.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Sign In
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300"
              >
                Explore Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
