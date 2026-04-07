import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthToken, getStoredUser, updateProfile } from '../lib/api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const storedUser = getStoredUser();
  const [name, setName] = useState(storedUser?.name || '');
  const [email, setEmail] = useState(storedUser?.email || '');
  const [photo, setPhoto] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storedUser) {
      navigate('/login');
    }
  }, [navigate, storedUser]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(name, email);
      setMessage('Profile updated successfully.');
    } catch (err: any) {
      setMessage(err?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAccount = () => {
    const results = {
      user: { name, email, photo },
      hearingResults: JSON.parse(localStorage.getItem('hearingResults') || '[]'),
      speechResults: JSON.parse(localStorage.getItem('speechResults') || '[]'),
    };
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audiometry-account-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMessage('Account data exported successfully.');
  };

  const handleDeleteAccount = () => {
    clearAuthToken();
    localStorage.removeItem('sonicArchitectUser');
    localStorage.removeItem('hearingResults');
    localStorage.removeItem('speechResults');
    navigate('/login');
  };

  return (
    <main className="min-h-screen pb-32 px-6 pt-24">
      <div className="glass-panel rounded-[32px] border border-white/10 p-8 shadow-glow">
        <p className="text-[10px] uppercase tracking-[0.3em] text-secondary">Profile</p>
        <h1 className="mt-3 text-3xl font-black text-white">My Profile</h1>
        <p className="mt-3 text-sm text-slate-400">Manage your account details and export your data.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6 rounded-[32px] bg-slate-950/80 p-8">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Account details</p>
              <div className="mt-4 space-y-4">
                <label className="block text-sm font-semibold text-slate-300">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                />
                <label className="block text-sm font-semibold text-slate-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                />
                <label className="block text-sm font-semibold text-slate-300">Profile photo URL</label>
                <input
                  type="url"
                  value={photo}
                  onChange={(event) => setPhoto(event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                />
              </div>
            </div>

            <div className="rounded-[28px] bg-slate-900/80 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Save settings</p>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="mt-4 w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </div>

          <div className="space-y-6 rounded-[32px] bg-slate-950/80 p-8">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-3xl border border-white/10 bg-slate-800">
                {photo ? (
                  <img src={photo} alt="Profile preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl text-slate-400">👤</div>
                )}
              </div>
              <div>
                <p className="text-sm text-slate-300">Profile photo preview</p>
                <p className="mt-1 text-xs text-slate-500">Paste an image URL above to preview it here.</p>
              </div>
            </div>
            <div className="rounded-[28px] bg-slate-900/80 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Account actions</p>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={handleExportAccount}
                  className="w-full rounded-2xl bg-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-600"
                >
                  Export account data
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="w-full rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400"
                >
                  Delete account
                </button>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className="mt-6 rounded-3xl bg-cyan-950/30 px-4 py-3 text-sm text-cyan-200">
            {message}
          </div>
        )}
      </div>
    </main>
  );
}
