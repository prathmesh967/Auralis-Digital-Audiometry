import { useState } from 'react';
import { forgotPassword, verifyOTP, resetPassword } from '../lib/api';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  onSuccess,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSendOTP = async () => {
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setMessage('OTP sent to your email');
      setStep('otp');
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError('');
    try {
      await verifyOTP(email, otp, 'forgot-password');
      setMessage('OTP verified successfully');
      setStep('password');
    } catch (err: any) {
      setError(err?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await resetPassword(email, otp, newPassword);
      setMessage('Password reset successfully. You can now log in.');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-[32px] bg-slate-950 border border-white/10 shadow-2xl p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-black text-white">Reset Password</h2>
          <p className="text-sm text-slate-400 mt-2">
            {step === 'email'
              ? 'Enter your email to receive a password reset OTP'
              : step === 'otp'
                ? 'Enter the OTP sent to your email'
                : 'Create your new password'}
          </p>
        </div>

        <div className="space-y-4">
          {step === 'email' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
              />
            </div>
          )}

          {step === 'otp' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                One-Time Password
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-slate-400 mt-2">Check your email for the 6-digit code</p>
            </div>
          )}

          {step === 'password' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}
        {message && <p className="text-sm text-emerald-400">{message}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
          >
            Cancel
          </button>
          <button
            onClick={
              step === 'email'
                ? handleSendOTP
                : step === 'otp'
                  ? handleVerifyOTP
                  : handleResetPassword
            }
            disabled={loading}
            className="flex-1 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
          >
            {loading
              ? 'Processing...'
              : step === 'email'
                ? 'Send OTP'
                : step === 'otp'
                  ? 'Verify OTP'
                  : 'Reset Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
