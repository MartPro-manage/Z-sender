import React, { useState } from 'react';
import { Send, BookOpen, Clock, History, FolderKanban, LogOut, CheckCircle2, ShieldCheck, Plus, Copy, Check } from 'lucide-react';
import { User } from 'firebase/auth';

export type ActiveTab = 'composer' | 'address-book' | 'scheduled-queue' | 'sent-history' | 'attachment-bank';

interface NavbarProps {
  user: User;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  scheduledCount: number;
  contactCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  scheduledCount,
  contactCount,
}) => {
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.uid);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 transition">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Logged in Gmail indicator */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-extrabold text-xl">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">SwiftSend</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Gmail Connected
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span className="truncate max-w-[150px]">{user.email}</span>
                <span className="text-slate-600">|</span>
                <button
                  onClick={handleCopyId}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer border border-indigo-500/20 bg-indigo-500/5 px-2 py-0.5 rounded-md text-[10px] transition"
                  title="Copy your Connection ID for integration"
                >
                  {copiedId ? <Check className="w-2.5 h-3" /> : <Copy className="w-2.5 h-3" />}
                  <span>{copiedId ? 'Copied ID!' : 'Copy Connection ID'}</span>
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="md:hidden text-slate-400 hover:text-rose-400 p-2 rounded-lg bg-slate-900 border border-slate-800"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 border border-slate-800/80 p-1 rounded-2xl w-full md:w-auto overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('composer')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeTab === 'composer'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Composer</span>
          </button>

          <button
            onClick={() => setActiveTab('address-book')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition whitespace-nowrap cursor-pointer relative ${
              activeTab === 'address-book'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Address Book</span>
            {contactCount > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                activeTab === 'address-book' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
              }`}>
                {contactCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('scheduled-queue')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition whitespace-nowrap cursor-pointer relative ${
              activeTab === 'scheduled-queue'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Scheduled</span>
            {scheduledCount > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                activeTab === 'scheduled-queue' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {scheduledCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('attachment-bank')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeTab === 'attachment-bank'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Saved Files</span>
          </button>

          <button
            onClick={() => setActiveTab('sent-history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeTab === 'sent-history'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Sent Log</span>
          </button>
        </nav>

        {/* User Profile & Actions */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'Profile'} className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                {(user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <span className="text-xs text-slate-300 font-medium max-w-[140px] truncate">
              {user.displayName || user.email}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-rose-500/30 transition cursor-pointer"
            title="Sign out of Google Account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
