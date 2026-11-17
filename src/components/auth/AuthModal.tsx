import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsGuest } from '../../services/firebase';
import { Mail, Lock, LogIn, UserPlus, Sparkles, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'signup',
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setError('');
      setMode(defaultMode);
    }
  }, [isOpen, defaultMode]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email.trim(), password.trim());
      } else {
        await signInWithEmail(email.trim(), password.trim());
      }
      onClose();
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please check your credentials.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please log in.');
        setMode('login');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      const errMsg = err?.message || String(err);
      const errCode = String(err?.code || '');

      // Check if user simply cancelled the account chooser
      if (
        errCode === '12501' ||
        errCode === 'auth/popup-closed-by-user' ||
        errCode === 'auth/cancelled-popup-request' ||
        errMsg.toLowerCase().includes('canceled') ||
        errMsg.toLowerCase().includes('cancelled')
      ) {
        // User closed picker; ignore
        return;
      }

      if (errCode === '10' || errMsg.includes('10')) {
        setError('Google Sign-In configuration error (Developer Error 10). Make sure SHA-1 is added in Firebase Console and google-services.json is present.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Browser popup blocked. Please allow popups or use Email sign-in.');
      } else {
        setError(errMsg || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInAsGuest();
      onClose();
    } catch (err: any) {
      console.error('Guest Sign-In error:', err);
      setError('Failed to start quick session. Please try Email Sign-In.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isBusy={loading}
      title={mode === 'login' ? 'Log In to HabitsSeen' : 'Create Your HabitsSeen Account'}
      subtitle={
        mode === 'login'
          ? 'Sign in with your email or Google account to restore your progress.'
          : 'Create your account to start tracking habits, streaks, and discipline scores.'
      }
      maxWidth="sm"
    >
      <div className="space-y-4 pt-1 pb-1">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-2xl flex items-start gap-2 animate-in fade-in">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. EMAIL & PASSWORD FORM */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full text-sm font-bold bg-black text-white hover:bg-zinc-800 rounded-full h-11 mt-1 shadow-xs"
          >
            {loading
              ? 'Connecting...'
              : mode === 'signup'
              ? 'Create Account'
              : 'Sign In'}
          </Button>
        </form>

        {/* TOGGLE LOGIN / SIGNUP MODE */}
        <div className="text-center text-xs text-zinc-600 pt-1">
          {mode === 'signup' ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="font-bold text-black hover:underline cursor-pointer"
              >
                Log In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className="font-bold text-black hover:underline cursor-pointer"
              >
                Sign Up Free
              </button>
            </span>
          )}
        </div>

        <div className="relative flex items-center my-3">
          <div className="flex-grow border-t border-zinc-200" />
          <span className="flex-shrink mx-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            OR
          </span>
          <div className="flex-grow border-t border-zinc-200" />
        </div>

        {/* 2. GOOGLE SIGN IN BUTTON */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-bold h-11 px-4 rounded-full border border-zinc-300 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-60"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* 3. INSTANT GUEST SIGN IN */}
        <button
          type="button"
          onClick={handleGuestSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold h-10 px-4 rounded-full border border-zinc-200 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
        >
          <Sparkles size={14} className="text-amber-500" />
          <span>Quick Guest Mode (Instant Access)</span>
        </button>

        <p className="text-center text-[10px] text-zinc-400 pt-1">
          By signing in, you agree to our Terms of Service &amp; Privacy Policy.
        </p>
      </div>
    </Modal>
  );
};
