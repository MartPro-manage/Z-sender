import React from 'react';
import { AlertTriangle, Send, X, CheckCircle, FileText, Image, Film, File } from 'lucide-react';
import { FileAttachment } from '../lib/gmailService';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  attachments: FileAttachment[];
  isScheduled?: boolean;
  scheduledTime?: string;
  isSending?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  senderEmail,
  recipientEmail,
  subject,
  attachments,
  isScheduled = false,
  scheduledTime,
  isSending = false,
}) => {
  if (!isOpen) return null;

  const totalBytes = attachments.reduce((sum, a) => sum + a.size, 0);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);

  const renderIcon = (cat?: string) => {
    switch (cat) {
      case 'image': return <Image className="w-4 h-4 text-emerald-400" />;
      case 'video': return <Film className="w-4 h-4 text-purple-400" />;
      case 'document': return <FileText className="w-4 h-4 text-blue-400" />;
      default: return <File className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        <button
          onClick={onClose}
          disabled={isSending}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-400">Confirm email transfer details before sending</p>
          </div>
        </div>

        <div className="space-y-3 my-5 text-sm">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">From (Your Gmail)</span>
              <span className="text-indigo-300 font-medium font-mono text-xs">{senderEmail}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-800/60 pt-2">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">To Recipient</span>
              <span className="text-emerald-400 font-medium font-mono text-xs">{recipientEmail}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-800/60 pt-2">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Subject</span>
              <span className="text-slate-200 font-medium truncate max-w-[240px]">{subject || '(No Subject)'}</span>
            </div>
            {isScheduled && scheduledTime && (
              <div className="flex justify-between items-center border-t border-slate-800/60 pt-2">
                <span className="text-amber-400 text-xs uppercase tracking-wider font-semibold">Scheduled For</span>
                <span className="text-amber-300 font-medium text-xs font-mono">{new Date(scheduledTime).toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
                Attachments ({attachments.length})
              </span>
              <span className="text-slate-400 text-xs font-mono">{totalMb} MB</span>
            </div>

            {attachments.length === 0 ? (
              <p className="text-slate-500 text-xs italic">No attachments added to this email.</p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      {renderIcon(att.category)}
                      <span className="text-slate-200 truncate">{att.filename}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px]">{(att.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            disabled={isSending}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSending}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{isScheduled ? 'Confirm Schedule' : 'Confirm & Send Email'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
