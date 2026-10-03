import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Clock,
  Sparkles,
  X,
  FileText,
  Image as ImageIcon,
  Film,
  File,
  Check,
  UserPlus,
  AlertCircle,
  BookmarkPlus,
  ChevronDown,
  Archive,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { FileAttachment, fileToAttachment } from '../lib/gmailService';
import { ContactData, SavedAttachmentData } from '../lib/firestoreService';

interface ComposerProps {
  user: User;
  contacts: ContactData[];
  savedAttachmentsBank: SavedAttachmentData[];
  onSendNow: (emailData: {
    toEmail: string;
    subject: string;
    bodyHtml: string;
    attachments: FileAttachment[];
    sendSelfCopy: boolean;
  }) => Promise<void>;
  onScheduleSend: (emailData: {
    toEmail: string;
    subject: string;
    bodyHtml: string;
    scheduledAt: string;
    attachments: FileAttachment[];
  }) => Promise<void>;
  onSaveDraft: (emailData: {
    toEmail: string;
    subject: string;
    bodyHtml: string;
    attachments: FileAttachment[];
  }) => Promise<void>;
  onSaveContactQuick: (name: string, email: string) => Promise<void>;
  onSaveAttachmentToBank: (att: FileAttachment) => Promise<void>;
  initialRecipient?: string;
  initialSubject?: string;
  initialBody?: string;
}

const TEMPLATES = [
  {
    label: 'Document Share',
    subject: 'Important Document Transfer - Please Review',
    body: `<p>Hello,</p><p>Please find the attached document(s) for your review. Let me know if you have any questions or require additional details.</p><p>Best regards,</p>`,
  },
  {
    label: 'Media / Video Pack',
    subject: 'Media Deliverables & Assets',
    body: `<p>Hi there,</p><p>I have attached the requested images and videos. All files are ready for download and use.</p><p>Best regards,</p>`,
  },
  {
    label: 'Invoice & Receipt',
    subject: 'Invoice & Payment Details',
    body: `<p>Hello,</p><p>Attached is the invoice for recent services. Kindly process payment at your convenience.</p><p>Thank you,</p>`,
  },
  {
    label: 'Project Update',
    subject: 'Project Progress & Attachments',
    body: `<p>Hi Team,</p><p>Here is the latest progress update along with relevant project files attached below.</p><p>Best regards,</p>`,
  },
];

export const Composer: React.FC<ComposerProps> = ({
  user,
  contacts,
  savedAttachmentsBank,
  onSendNow,
  onScheduleSend,
  onSaveDraft,
  onSaveContactQuick,
  onSaveAttachmentToBank,
  initialRecipient = '',
  initialSubject = '',
  initialBody = '',
}) => {
  const [toEmail, setToEmail] = useState(initialRecipient);
  const [subject, setSubject] = useState(initialSubject);
  const [bodyText, setBodyText] = useState(initialBody);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [sendSelfCopy, setSendSelfCopy] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  // Address book autocomplete state
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState<ContactData[]>([]);

  // Scheduling state
  const [sendMode, setSendMode] = useState<'instant' | 'scheduled'>('instant');
  const [scheduleOption, setScheduleOption] = useState<string>('15m');
  const [customScheduleDateTime, setCustomScheduleDateTime] = useState('');

  // Notifications
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialRecipient) setToEmail(initialRecipient);
    if (initialSubject) setSubject(initialSubject);
    if (initialBody) setBodyText(initialBody);
  }, [initialRecipient, initialSubject, initialBody]);

  // Handle contact search autocomplete
  useEffect(() => {
    if (toEmail.trim() && !toEmail.includes(';')) {
      const queryStr = toEmail.toLowerCase();
      const matches = contacts.filter(
        (c) => c.email.toLowerCase().includes(queryStr) || c.name.toLowerCase().includes(queryStr)
      );
      setFilteredContacts(matches);
      setShowAutoComplete(matches.length > 0);
    } else {
      setShowAutoComplete(false);
    }
  }, [toEmail, contacts]);

  const totalBytes = attachments.reduce((acc, a) => acc + a.size, 0);
  const totalMb = totalBytes / (1024 * 1024);
  const MAX_MB = 25; // Gmail limit

  // File drop & upload handler
  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessingFiles(true);
    setStatusMsg({ type: 'info', text: 'Processing and encoding file attachments...' });

    try {
      const newAtts: FileAttachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 22 * 1024 * 1024) {
          setStatusMsg({
            type: 'error',
            text: `File "${file.name}" exceeds the max individual file threshold for email transfers.`,
          });
          continue;
        }
        const att = await fileToAttachment(file);
        newAtts.push(att);
      }

      setAttachments((prev) => [...prev, ...newAtts]);
      setStatusMsg({ type: 'success', text: `Added ${newAtts.length} attachment(s) successfully.` });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Error reading attached files.' });
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const applyTemplate = (tmpl: (typeof TEMPLATES)[0]) => {
    setSubject(tmpl.subject);
    setBodyText(tmpl.body.replace(/<p>/g, '').replace(/<\/p>/g, '\n\n').trim());
    setStatusMsg({ type: 'info', text: `Applied "${tmpl.label}" template.` });
    setTimeout(() => setStatusMsg(null), 2000);
  };

  const attachFromSavedBank = (saved: SavedAttachmentData) => {
    const exists = attachments.some((a) => a.filename === saved.filename && a.size === saved.size);
    if (exists) {
      setStatusMsg({ type: 'info', text: `"${saved.filename}" is already attached.` });
      setTimeout(() => setStatusMsg(null), 2000);
      return;
    }

    const att: FileAttachment = {
      filename: saved.filename,
      mimeType: saved.mimeType,
      size: saved.size,
      base64Data: saved.base64Data,
      dataUrl: `data:${saved.mimeType};base64,${saved.base64Data}`,
    };

    setAttachments((prev) => [...prev, att]);
    setStatusMsg({ type: 'success', text: `Attached "${saved.filename}" from file bank.` });
    setTimeout(() => setStatusMsg(null), 2000);
  };

  // Calculate scheduled ISO timestamp
  const calculateScheduledISO = (): string => {
    const now = new Date();
    if (scheduleOption === '15m') return new Date(now.getTime() + 15 * 60 * 1000).toISOString();
    if (scheduleOption === '1h') return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    if (scheduleOption === '3h') return new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();
    if (scheduleOption === 'tomorrow_9am') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow.toISOString();
    }
    if (scheduleOption === 'custom' && customScheduleDateTime) {
      return new Date(customScheduleDateTime).toISOString();
    }
    return new Date(now.getTime() + 15 * 60 * 1000).toISOString();
  };

  const handleTriggerSend = async () => {
    if (!toEmail.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter a recipient Gmail address.' });
      return;
    }

    if (totalMb > MAX_MB) {
      setStatusMsg({
        type: 'error',
        text: `Total attachments payload (${totalMb.toFixed(1)}MB) exceeds Gmail's 25MB limit. Please remove some files.`,
      });
      return;
    }

    const formattedBodyHtml = bodyText
      .split('\n')
      .map((line) => line.trim() ? `<p>${line}</p>` : '<br/>')
      .join('');

    setIsSending(true);
    try {
      if (sendMode === 'instant') {
        await onSendNow({
          toEmail,
          subject: subject || 'No Subject',
          bodyHtml: formattedBodyHtml,
          attachments,
          sendSelfCopy,
        });
      } else {
        const scheduledAt = calculateScheduledISO();
        await onScheduleSend({
          toEmail,
          subject: subject || 'No Subject',
          bodyHtml: formattedBodyHtml,
          scheduledAt,
          attachments,
        });
      }
      
      // Clear fields upon successful submit
      setToEmail('');
      setSubject('');
      setBodyText('');
      setAttachments([]);
    } catch (error: any) {
      setStatusMsg({ type: 'error', text: error.message || 'Operation failed.' });
    } finally {
      setIsSending(false);
    }
  };

  const renderFileIcon = (cat?: string) => {
    switch (cat) {
      case 'image': return <ImageIcon className="w-5 h-5 text-emerald-400" />;
      case 'video': return <Film className="w-5 h-5 text-purple-400" />;
      case 'document': return <FileText className="w-5 h-5 text-blue-400" />;
      case 'archive': return <Archive className="w-5 h-5 text-amber-400" />;
      default: return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner / Status info */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Gmail Transfer & Attachment Composer</h2>
            <p className="text-xs text-slate-400">
              Sender Account: <span className="text-indigo-300 font-mono font-semibold">{user.email}</span>
            </p>
          </div>
        </div>

        {/* Templates quick picker */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 font-semibold mr-1">Templates:</span>
          {TEMPLATES.map((tmpl, i) => (
            <button
              key={i}
              onClick={() => applyTemplate(tmpl)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 transition cursor-pointer"
            >
              {tmpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Banner */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between animate-in fade-in duration-150 ${
            statusMsg.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Composer Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative">
        {/* Recipient Address Field */}
        <div className="relative">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Recipient Gmail Address</label>
            {toEmail.trim() && !contacts.some((c) => c.email.toLowerCase() === toEmail.toLowerCase()) && (
              <button
                onClick={() => onSaveContactQuick(toEmail.split('@')[0], toEmail)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Save to Address Book</span>
              </button>
            )}
          </div>

          <input
            type="email"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            placeholder="e.g. receiver@gmail.com"
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 font-mono transition outline-none"
          />

          {/* Autocomplete Dropdown */}
          {showAutoComplete && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-30 max-h-48 overflow-y-auto p-1">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => {
                    setToEmail(contact.email);
                    setShowAutoComplete(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-800 flex items-center justify-between text-xs transition cursor-pointer"
                >
                  <div>
                    <p className="font-bold text-white">{contact.name}</p>
                    <p className="text-slate-400 font-mono text-[11px]">{contact.email}</p>
                  </div>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-indigo-300 border border-slate-700">
                    {contact.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Subject Line */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Final Documents & Project Deliverables"
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 transition outline-none font-medium"
          />
        </div>

        {/* Body Area */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Message Content</label>
          <textarea
            rows={5}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder="Write your email body here..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-4 text-white text-sm placeholder-slate-600 transition outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Automated Attachment Zone */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Automated Attachment Zone</span>
            </div>

            {/* Total Size Indicator */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Total:</span>
              <span className={`font-bold ${totalMb > 22 ? 'text-rose-400' : totalMb > 15 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {totalMb.toFixed(2)} MB / 25 MB
              </span>
            </div>
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-950'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Paperclip className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">
                Drag & drop any Document, Image, or Video here
              </p>
              <p className="text-xs text-slate-500">
                Supports PDF, DOCX, XLSX, PNG, JPG, MP4, MOV, ZIP and more
              </p>
            </div>
          </div>

          {/* Quick attach from Saved Files Bank */}
          {savedAttachmentsBank.length > 0 && (
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Quick Attach from Saved File Bank:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {savedAttachmentsBank.map((saved) => (
                  <button
                    key={saved.id}
                    onClick={() => attachFromSavedBank(saved)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-slate-200 transition shrink-0 cursor-pointer"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="truncate max-w-[120px]">{saved.filename}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attachments List */}
          {attachments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 group hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3 truncate">
                    {att.category === 'image' && att.dataUrl ? (
                      <img src={att.dataUrl} alt={att.filename} className="w-10 h-10 object-cover rounded-lg border border-slate-800" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                        {renderFileIcon(att.category)}
                      </div>
                    )}

                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate">{att.filename}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {(att.size / 1024).toFixed(0)} KB • {att.mimeType.split('/')[1] || 'file'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSaveAttachmentToBank(att)}
                      className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-900 rounded-lg transition"
                      title="Save to Reusable File Bank"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition"
                      title="Remove Attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sending & Scheduling Options */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Mode Toggle */}
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setSendMode('instant')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  sendMode === 'instant' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Instantly</span>
              </button>

              <button
                onClick={() => setSendMode('scheduled')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  sendMode === 'scheduled' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Schedule for Later</span>
              </button>
            </div>

            {/* Self Copy Checkbox */}
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendSelfCopy}
                onChange={(e) => setSendSelfCopy(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Send a copy to my Gmail inbox ({user.email})</span>
            </label>
          </div>

          {/* Scheduled Date Picker Options */}
          {sendMode === 'scheduled' && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-500/30 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                <Clock className="w-4 h-4" />
                <span>Select Schedule Time:</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: '15m', label: 'In 15 minutes' },
                  { id: '1h', label: 'In 1 hour' },
                  { id: '3h', label: 'In 3 hours' },
                  { id: 'tomorrow_9am', label: 'Tomorrow 9 AM' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setScheduleOption(opt.id)}
                    className={`py-2 px-3 rounded-xl border text-center transition cursor-pointer ${
                      scheduleOption === opt.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={customScheduleDateTime}
                  onChange={(e) => {
                    setCustomScheduleDateTime(e.target.value);
                    setScheduleOption('custom');
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-500">Or choose custom date & time</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={() => onSaveDraft({ toEmail, subject, bodyHtml: bodyText, attachments })}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save as Gmail Draft</span>
            </button>

            <button
              onClick={handleTriggerSend}
              disabled={isProcessingFiles || isSending}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{sendMode === 'instant' ? 'Send Email via Gmail' : 'Confirm Scheduled Queue'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
