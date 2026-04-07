import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../lib/api';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(email.trim(), password, name.trim());
      } else {
        await login(email.trim(), password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-panel w-full max-w-md rounded-[32px] border border-white/10 p-8 shadow-glow">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-highest text-4xl text-primary shadow-[0_20px_80px_rgba(150,248,255,0.15)]">
            🎧
          </div>
          <h1 className="font-headline text-3xl font-black uppercase tracking-tight text-white">
            {isRegister ? 'Create your account' : 'Welcome Back'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {isRegister
              ? 'Sign up to save your audiometry results securely.'
              : 'Access your clinical diagnostic dashboard'}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.3em] text-secondary">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Audrey Sound"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none transition focus:border-cyan-300"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-[0.3em] text-secondary">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="audiologist@sonic.tech"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none transition focus:border-cyan-300"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] uppercase tracking-[0.3em] text-secondary">Security Key</label>
              {!isRegister && (
                <button
                  onClick={() => setShowForgotPassword(true)}
                  className="text-[10px] text-tertiary transition hover:text-primary"
                  type="button"
                >
                  Forgot?
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none transition focus:border-cyan-300"
            />
          </div>

          {error && <p className="text-center text-sm text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (isRegister ? 'Creating account…' : 'Signing in…') : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="font-semibold text-cyan-300 transition hover:text-cyan-200"
          >
            {isRegister ? 'Sign in' : 'Register now'}
          </button>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={() => {
          setShowForgotPassword(false);
          setEmail('');
          setPassword('');
        }}
      />
    </main>
  );
}
