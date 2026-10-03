import React from 'react';
import { Mail, ShieldCheck, Zap, FileText, Send, Users, Clock, Paperclip } from 'lucide-react';

interface AuthLandingProps {
  onSignIn: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const AuthLanding: React.FC<AuthLandingProps> = ({ onSignIn, isLoading, error }) => {
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
              SwiftSend Gmail
            </span>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full ml-2 uppercase tracking-wider">
              Automated Attachments
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 border border-slate-800 bg-slate-900/60 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Official Google Workspace Integration</span>
        </div>
      </header>

      {/* Main Hero */}
      <main className="max-w-5xl mx-auto px-6 py-12 text-center flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-indigo-300 text-xs font-medium mb-8 shadow-inner">
          <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Fast Direct Gmail Email Transfers & Scheduling</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight max-w-3xl mb-6">
          Send Documents, Images & Videos <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">Directly from Your Gmail</span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed">
          Automate file attachment processing, manage your address book, and schedule emails effortlessly. Messages transfer directly from your personal or work Gmail address.
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm max-w-md w-full text-left space-y-3 shadow-lg">
            <div>
              <p className="font-semibold mb-1">Authentication Notice</p>
              <p className="text-xs text-rose-300/80">{error}</p>
            </div>
            <button
              onClick={() => window.open(window.location.href, '_blank')}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>Launch Standalone Tab (Recommended Fix)</span>
            </button>
          </div>
        )}

        {/* Official Google GSI Sign-In Button */}
        <div className="flex flex-col items-center gap-4 mb-16">
          <button
            onClick={onSignIn}
            disabled={isLoading}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 font-bold text-base rounded-2xl shadow-xl shadow-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
            )}
            <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google Account'}</span>
          </button>
          <p className="text-xs text-slate-500">
            Sends emails directly from your logged-in Gmail address. No password required.
          </p>
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
            <h3 className="font-bold text-white text-base mb-1">Your Logged-In Gmail</h3>
            <p className="text-xs text-slate-400">Transfers execute directly from your authenticated Gmail address using official Google APIs.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-900 text-center text-xs text-slate-500 relative z-10">
        <span>SwiftSend Gmail • Secure Google Account Authentication & Transfer Engine</span>
      </footer>
    </div>
  );
};
