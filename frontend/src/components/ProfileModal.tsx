import { useEffect, useState } from 'react';
import { getStoredUser, updateProfile, clearAuthToken } from '../lib/api';
import { useNavigate } from 'react-router-dom';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const navigate = useNavigate();
  const storedUser = getStoredUser();
  const [name, setName] = useState(storedUser?.name || '');
  const [email, setEmail] = useState(storedUser?.email || '');
  const [photo, setPhoto] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (storedUser) {
      setName(storedUser.name || '');
      setEmail(storedUser.email || '');
    }
  }, [storedUser, isOpen]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(name, email);
      setMessage('Profile updated successfully.');
      setTimeout(() => setMessage(''), 2000);
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

  const handleLogout = () => {
    clearAuthToken();
    navigate('/login');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-[32px] bg-slate-950 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="sticky top-0 bg-slate-950 border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-white">My Profile</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-[28px] bg-slate-900/80 p-6">
            <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500 mb-4">Account details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Profile photo URL</label>
                <input
                  type="url"
                  value={photo}
                  onChange={(event) => setPhoto(event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-slate-900/80 p-6">
            <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500 mb-4">Profile photo</h3>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-slate-800 flex-shrink-0">
                {photo ? (
                  <img src={photo} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xl text-slate-400">👤</div>
                )}
              </div>
              <p className="text-xs text-slate-400">Paste an image URL to preview it.</p>
            </div>
          </div>

          <div className="rounded-[28px] bg-slate-900/80 p-6 space-y-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save changes'}
            </button>
            <button
              onClick={handleExportAccount}
              className="w-full rounded-2xl bg-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-600"
            >
              Export data
            </button>
            <button
              onClick={handleLogout}
              className="w-full rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400"
            >
              Logout
            </button>
          </div>

          {message && (
            <div className="rounded-2xl bg-cyan-950/30 px-4 py-3 text-sm text-cyan-200">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
