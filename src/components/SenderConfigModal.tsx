import React, { useState } from 'react';
import { Key, ShieldAlert, CheckCircle2, ExternalLink, X, Zap, Server, AlertCircle, RefreshCw } from 'lucide-react';
import { SenderSettingsData } from '../lib/firestoreService';

interface SenderConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderEmail: string;
  currentSettings: SenderSettingsData | null;
  onSaveSettings: (settings: SenderSettingsData) => Promise<void>;
}

export const SenderConfigModal: React.FC<SenderConfigModalProps> = ({
  isOpen,
  onClose,
  senderEmail,
  currentSettings,
  onSaveSettings,
}) => {
  const [appPassword, setAppPassword] = useState(currentSettings?.appPassword || '');
  const [useCustomSmtp, setUseCustomSmtp] = useState(Boolean(currentSettings?.smtpHost));
  const [smtpHost, setSmtpHost] = useState(currentSettings?.smtpHost || '');
  const [smtpPort, setSmtpPort] = useState(currentSettings?.smtpPort ? String(currentSettings.smtpPort) : '587');
  const [smtpSecure, setSmtpSecure] = useState(currentSettings?.smtpSecure || false);

  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsVerifying(true);

    const cleanPass = appPassword.replace(/\s+/g, '');
    if (!cleanPass) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter your 16-character Gmail App Password.',
      });
      setIsVerifying(false);
      return;
    }

    try {
      // 1. Verify with backend
      const res = await fetch('/api/verify-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail,
          appPassword: cleanPass,
          smtpHost: useCustomSmtp ? smtpHost.trim() : undefined,
          smtpPort: useCustomSmtp ? Number(smtpPort) : undefined,
          smtpSecure: useCustomSmtp ? smtpSecure : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify SMTP credentials.');
      }

      // 2. Save settings to Firestore
      const newSettings: SenderSettingsData = {
        appPassword: cleanPass,
        smtpHost: useCustomSmtp ? smtpHost.trim() : undefined,
        smtpPort: useCustomSmtp ? Number(smtpPort) : undefined,
        smtpSecure: useCustomSmtp ? smtpSecure : undefined,
      };

      await onSaveSettings(newSettings);

      setStatusMessage({
        type: 'success',
        text: 'Credentials verified and activated! Real email dispatch is ready.',
      });

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('SMTP test error:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Verification failed. Check your App Password and try again.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Direct Email Dispatch Setup</h2>
              <p className="text-xs text-slate-400">
                Bypass Google OAuth verification limits & dispatch real emails
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Why OAuth Verification Blocked Notice */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2 text-amber-200">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-amber-300">Why Google showed "Access blocked: App not verified":</span>
                <p className="mt-1 text-slate-300 text-[11px]">
                  Google restricts automated Gmail OAuth for security unless you go through months of public app verification.
                  Using a <strong>Gmail App Password</strong> or <strong>Direct SMTP</strong> is Google's official recommended method for apps to send emails immediately without verification blocks!
                </p>
              </div>
            </div>
          </div>

          {/* Quick 3-Step Guide */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>How to get your 16-letter Gmail App Password (20 seconds):</span>
            </h3>

            <ol className="space-y-2 text-slate-300 list-decimal list-inside text-[11px] leading-relaxed">
              <li>
                Open Google Account Security:{' '}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 underline underline-offset-2"
                >
                  <span>myaccount.google.com/apppasswords</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                Type <code className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded font-mono">SwiftSend</code> as the app name and click <strong>Create</strong>.
              </li>
              <li>
                Copy the <strong>16-letter password</strong> generated (e.g. <code className="bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded font-mono">abcd efgh ijkl mnop</code>) and paste it below.
              </li>
            </ol>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5 text-[11px]">
                Sender Account Email
              </label>
              <input
                type="text"
                disabled
                value={senderEmail}
                className="w-full bg-slate-950/60 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5 text-[11px]">
                Gmail App Password (16 characters)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-600 outline-none transition text-sm"
                />
              </div>
            </div>

            {/* Custom SMTP Toggle */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setUseCustomSmtp(!useCustomSmtp)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 font-semibold"
              >
                <Server className="w-3.5 h-3.5" />
                <span>{useCustomSmtp ? 'Hide Custom SMTP Settings' : 'Use Custom SMTP (Outlook, Yahoo, Custom Server)'}</span>
              </button>
            </div>

            {useCustomSmtp && (
              <div className="space-y-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. smtp.office365.com"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                      Port
                    </label>
                    <input
                      type="number"
                      placeholder="587 or 465"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono outline-none"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={smtpSecure}
                    onChange={(e) => setSmtpSecure(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                  />
                  <span>SSL / TLS Secure Connection (Port 465)</span>
                </label>
              </div>
            )}

            {/* Status Message */}
            {statusMessage && (
              <div
                className={`p-3 rounded-xl border flex items-start gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                )}
                <div className="leading-relaxed font-medium">{statusMessage.text}</div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className="flex-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying SMTP...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Save Credentials</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
