import { ChangeEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthToken, getStoredUser, requestOTP, changePassword } from '../lib/api';

export default function SettingsPage() {
  const navigate = useNavigate();
  const storedUser = getStoredUser();
  const [name, setName] = useState(storedUser?.name || '');
  const [email, setEmail] = useState(storedUser?.email || '');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [dataMessage, setDataMessage] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);

  useEffect(() => {
    if (storedUser) {
      setName(storedUser.name || '');
      setEmail(storedUser.email || '');
    }
  }, [storedUser]);

  const handleProfileSave = () => {
    setDataMessage('Profile settings saved locally.');
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setDataMessage('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setDataMessage('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setDataMessage('Password must be at least 6 characters.');
      return;
    }

    // Request OTP
    setPasswordChangeLoading(true);
    try {
      await requestOTP();
      setDataMessage('OTP sent to your email. Please enter it below.');
      setIsChangingPassword(true);
      setShowOtpInput(true);
    } catch (err: any) {
      setDataMessage(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleSubmitPasswordWithOTP = async () => {
    if (!otp) {
      setDataMessage('Please enter the OTP.');
      return;
    }

    setPasswordChangeLoading(true);
    try {
      await changePassword(currentPassword, newPassword, otp);
      setDataMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
      setShowOtpInput(false);
      setIsChangingPassword(false);
    } catch (err: any) {
      setDataMessage(err?.message || 'Failed to change password. Please try again.');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleClearCache = () => {
    localStorage.removeItem('sonicArchitectToken');
    localStorage.removeItem('sonicArchitectUser');
    setDataMessage('Local cache cleared.');
  };

  const handleClearHistory = () => {
    localStorage.removeItem('hearingResults');
    localStorage.removeItem('speechResults');
    setDataMessage('Test history cleared from local device.');
  };

  const handleResetPreferences = () => {
    localStorage.removeItem('settingsPreferences');
    setDataMessage('Saved preferences reset.');
  };

  const handleExportHistory = () => {
    const hearing = localStorage.getItem('hearingResults') || '[]';
    const speech = localStorage.getItem('speechResults') || '[]';
    const payload = JSON.stringify({ hearing: JSON.parse(hearing), speech: JSON.parse(speech) }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audiometry-history.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDataMessage('Hearing and speech history exported.');
  };

  const handleImportHistory = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (parsed.hearing) {
          localStorage.setItem('hearingResults', JSON.stringify(parsed.hearing));
        }
        if (parsed.speech) {
          localStorage.setItem('speechResults', JSON.stringify(parsed.speech));
        }
        setDataMessage(`Imported history from ${file.name}.`);
      } catch {
        setDataMessage('Unable to import file. Use a valid JSON export.');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteAccount = () => {
    setDataMessage('Account deletion is not enabled in this demo.');
  };

  const handleLogout = () => {
    clearAuthToken();
    navigate('/login');
  };

  return (
    <main className="min-h-screen pb-32 px-6 pt-24">
      <div className="glass-panel rounded-[32px] border border-white/10 p-8 shadow-glow">
        <p className="text-[10px] uppercase tracking-[0.3em] text-secondary">Configuration</p>
        <h1 className="mt-3 text-3xl font-black text-white">Settings</h1>

        <section className="mt-8 space-y-8">
          <div className="rounded-[32px] bg-slate-950/80 p-8 shadow-inner">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-secondary">Account Settings</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Profile and security</h2>
              </div>
              <button
                type="button"
                onClick={handleProfileSave}
                className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Save profile
              </button>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[28px] bg-slate-900/80 p-6">
                <label className="block text-sm font-semibold text-slate-300">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
                />
                <label className="mt-6 block text-sm font-semibold text-slate-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
                />
                <label className="mt-6 block text-sm font-semibold text-slate-300">Profile photo</label>
                <input
                  type="text"
                  value={profilePhoto}
                  onChange={(event) => setProfilePhoto(event.target.value)}
                  placeholder="Image URL"
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
                />
              </div>

              <div className="rounded-[28px] bg-slate-900/80 p-6">
                <p className="text-sm font-semibold text-slate-300">Change password</p>
                <div className="mt-4 space-y-4">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="Current password"
                    disabled={showOtpInput}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none disabled:opacity-50"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="New password"
                    disabled={showOtpInput}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none disabled:opacity-50"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm password"
                    disabled={showOtpInput}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none disabled:opacity-50"
                  />

                  {showOtpInput && (
                    <div className="mt-4 space-y-3 rounded-2xl bg-slate-950/50 p-4">
                      <p className="text-xs text-slate-400">Enter the 6-digit OTP sent to your email</p>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none text-center text-xl tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={handleSubmitPasswordWithOTP}
                        disabled={passwordChangeLoading}
                        className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
                      >
                        {passwordChangeLoading ? 'Verifying...' : 'Verify & Change Password'}
                      </button>
                    </div>
                  )}

                  {!showOtpInput && (
                    <button
                      type="button"
                      onClick={handlePasswordChange}
                      disabled={passwordChangeLoading}
                      className="w-full rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50"
                    >
                      {passwordChangeLoading ? 'Sending OTP...' : 'Update password'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-[28px] bg-slate-900/80 p-6">
              <h3 className="text-lg font-semibold text-white">Account actions</h3>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400"
                >
                  Delete account
                </button>
                <button
                  type="button"
                  onClick={handleExportHistory}
                  className="rounded-2xl bg-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-600"
                >
                  Export account data
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] bg-slate-950/80 p-8 shadow-inner">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-secondary">Data Settings</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Local data controls</h2>
              </div>
              <button
                type="button"
                onClick={handleResetPreferences}
                className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Reset preferences
              </button>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[28px] bg-slate-900/80 p-6">
                <h3 className="text-lg font-semibold text-white">Data management</h3>
                <p className="mt-2 text-sm text-slate-400">Remove stored data from this device.</p>
                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={handleClearCache}
                    className="w-full rounded-2xl bg-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-600"
                  >
                    Clear local cache
                  </button>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="w-full rounded-2xl bg-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-600"
                  >
                    Clear test history
                  </button>
                </div>
              </div>

              <div className="rounded-[28px] bg-slate-900/80 p-6">
                <h3 className="text-lg font-semibold text-white">Export / import</h3>
                <p className="mt-2 text-sm text-slate-400">Save or restore your test history data.</p>
                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={handleExportHistory}
                    className="w-full rounded-2xl bg-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-600"
                  >
                    Export history JSON
                  </button>
                  <label className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white transition hover:bg-slate-700">
                    <span>{importFileName || 'Import history file'}</span>
                    <input
                      type="file"
                      accept="application/json"
                      onChange={handleImportHistory}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] bg-slate-950/80 p-8 shadow-inner">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-secondary">Session / Logout</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Sign out and session control</h2>
              </div>
              <button
                type="button"
                onClick={() => setLogoutConfirm(true)}
                className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400"
              >
                Logout
              </button>
            </div>

            <div className="mt-8 rounded-[28px] bg-slate-900/80 p-6">
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-800 px-4 py-3">
                <span className="text-sm text-slate-200">Stay signed in</span>
                <input
                  type="checkbox"
                  checked={staySignedIn}
                  onChange={(event) => setStaySignedIn(event.target.checked)}
                />
              </label>
              <p className="mt-4 text-sm text-slate-400">
                Keeping this enabled keeps your session active on this device.
              </p>
            </div>
          </div>

          {dataMessage && (
            <div className="rounded-[28px] border border-cyan-400/30 bg-cyan-950/20 p-4 text-sm text-cyan-200">
              {dataMessage}
            </div>
          )}
        </section>
      </div>

      {logoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6">
          <div className="w-full max-w-md rounded-[32px] bg-slate-950 p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-white">Confirm logout</h3>
            <p className="mt-3 text-sm text-slate-400">Are you sure you want to end your session? You will need to log in again.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400"
              >
                Yes, logout
              </button>
              <button
                type="button"
                onClick={() => setLogoutConfirm(false)}
                className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
