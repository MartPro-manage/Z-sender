import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ShieldCheck, Zap, Paperclip, Users, Clock, Send, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';

interface AuthLandingProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, displayName?: string) => Promise<void>;
  onResetPassword?: (email: string) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export const AuthLanding: React.FC<AuthLandingProps> = ({
  onSignIn,
  onSignUp,
  onResetPassword,
  isLoading,
  error,
  onClearError,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleTabChange = (newMode: 'signin' | 'signup' | 'forgot') => {
    setMode(newMode);
    setValidationError(null);
    setResetSuccessMsg(null);
    if (onClearError) onClearError();
  };

  const handleSwitchToSignIn = () => {
    setMode('signin');
    setValidationError(null);
    setResetSuccessMsg(null);
    if (onClearError) onClearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setResetSuccessMsg(null);

    if (mode === 'forgot') {
      if (!email.trim()) {
        setValidationError('Please enter your email address to receive a reset link.');
        return;
      }
      if (onResetPassword) {
        setIsResetting(true);
        const res = await onResetPassword(email.trim());
        setIsResetting(false);
        if (res.success) {
          setResetSuccessMsg(`Password reset link sent to ${email.trim()}. Please check your email inbox.`);
        } else {
          setValidationError(res.error || 'Failed to send password reset email.');
        }
      }
      return;
    }

    if (!email.trim() || !password) {
      setValidationError('Please enter both email and password.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setValidationError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setValidationError('Passwords do not match. Please re-enter.');
        return;
      }
      await onSignUp(email.trim(), password, displayName.trim());
    } else {
      await onSignIn(email.trim(), password);
    }
  };

  const isEmailAlreadyInUse =
    (error && (error.toLowerCase().includes('already exists') || error.toLowerCase().includes('already registered') || error.toLowerCase().includes('already-in-use'))) || false;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[350px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-6 border-b border-slate-900 flex justify-between items-center max-w-7xl mx-auto w-full relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl">
            S
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
              SwiftSend
            </span>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full ml-2 uppercase tracking-wider">
              Email Dispatch & Transfer
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 border border-slate-800 bg-slate-900/60 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Secure Cloud Account Storage</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-10 flex-1 flex flex-col items-center justify-center relative z-10 w-full">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-indigo-300 text-xs font-medium mb-6 shadow-inner">
          <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Automated Attachments, Address Book & Scheduled Transfers</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mb-4 text-center">
          Send Documents, Images & Videos <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">Effortlessly</span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-xl mb-8 leading-relaxed text-center">
          Sign in or create your SwiftSend account to dispatch email attachments with RFC encoding, manage your contacts, and schedule transfers.
        </p>

        {/* Auth Form Card */}
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl mb-12">
          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800/80 mb-6">
            <button
              type="button"
              onClick={() => handleTabChange('signin')}
              className={`py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                mode === 'signin' || mode === 'forgot'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('signup')}
              className={`py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Validation or Server Error with 1-Click Action */}
          {(validationError || error) && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs flex flex-col gap-2.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="flex-1 leading-relaxed">
                  {validationError || error}
                </div>
              </div>

              {/* Quick switch to Sign In if email already exists */}
              {isEmailAlreadyInUse && (
                <button
                  type="button"
                  onClick={handleSwitchToSignIn}
                  className="mt-1 w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow cursor-pointer"
                >
                  <span>Sign In with {email || 'this email'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Password Reset Success Message */}
          {resetSuccessMsg && (
            <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <div className="flex-1 leading-relaxed font-medium">
                {resetSuccessMsg}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {mode === 'signup' && (
              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5 text-[11px]">
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-3.5 py-3 text-white outline-none placeholder-slate-600 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5 text-[11px]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-3.5 py-3 text-white outline-none placeholder-slate-600 font-mono transition"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => handleTabChange('forgot')}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-10 py-3 text-white outline-none placeholder-slate-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5 text-[11px]">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-3.5 py-3 text-white outline-none placeholder-slate-600 transition"
                  />
                </div>
              </div>
            )}

            {mode === 'forgot' ? (
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={isResetting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isResetting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Send Password Reset Email</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('signin')}
                  className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{mode === 'signup' ? 'Creating Account...' : 'Signing In...'}</span>
                  </>
                ) : (
                  <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                )}
              </button>
            )}
          </form>

          {/* Switch Prompt */}
          {mode !== 'forgot' && (
            <div className="mt-5 text-center text-xs text-slate-400">
              {mode === 'signin' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabChange('signup')}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline underline-offset-2"
                  >
                    Create one now
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabChange('signin')}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline underline-offset-2"
                  >
                    Sign in here
                  </button>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Key Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full text-left">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl hover:border-indigo-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
              <Paperclip className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">Automated Attachments</h3>
            <p className="text-xs text-slate-400">Drag & drop docs, images, or videos with instant RFC 2822 encoding and auto payload checks.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl hover:border-purple-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">Saved Address Book</h3>
            <p className="text-xs text-slate-400">Store frequent recipients with quick autocomplete, tags, and 1-click contact composition.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl hover:border-emerald-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">Scheduled Sending</h3>
            <p className="text-xs text-slate-400">Schedule transfers for later times with background queue processing and status tracking.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl hover:border-amber-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
              <Send className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">Direct Email Transfers</h3>
            <p className="text-xs text-slate-400">Instant background transfers with comprehensive delivery auditing and activity logs.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-900 text-center text-xs text-slate-500 relative z-10">
        <span>SwiftSend • Secure Email Dispatch & Transfer Engine</span>
      </footer>
    </div>
  );
};
