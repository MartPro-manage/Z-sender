import React, { useEffect, useState } from 'react';
import { Clock, Send, Trash2, AlertCircle, CheckCircle2, Play, Calendar, Paperclip } from 'lucide-react';
import { ScheduledEmailData } from '../lib/firestoreService';

interface ScheduledQueueProps {
  scheduledEmails: ScheduledEmailData[];
  onDispatchNow: (email: ScheduledEmailData) => Promise<void>;
  onCancelSchedule: (emailId: string) => Promise<void>;
  onDeleteSchedule: (emailId: string) => Promise<void>;
}

export const ScheduledQueue: React.FC<ScheduledQueueProps> = ({
  scheduledEmails,
  onDispatchNow,
  onCancelSchedule,
  onDeleteSchedule,
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pendingEmails = scheduledEmails.filter((e) => e.status === 'pending');
  const pastEmails = scheduledEmails.filter((e) => e.status !== 'pending');

  const getTimeRemaining = (scheduledAtIso: string) => {
    const target = new Date(scheduledAtIso).getTime();
    const current = now.getTime();
    const diff = target - current;

    if (diff <= 0) return 'Due for dispatch...';

    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    const hours = Math.floor(mins / 60);

    if (hours > 0) return `${hours}h ${mins % 60}m remaining`;
    return `${mins}m ${secs}s remaining`;
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Scheduled Email Queue</h2>
            <p className="text-xs text-slate-400">
              Automated delayed dispatch queue with live countdown timers and override options
            </p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold font-mono">
          {pendingEmails.length} Pending
        </div>
      </div>

      {/* Pending Queue List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Pending Dispatch ({pendingEmails.length})</span>
        </h3>

        {pendingEmails.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-slate-500 space-y-2">
            <Clock className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No scheduled emails in queue</p>
            <p className="text-xs">Schedule emails in the Composer tab to send them automatically at a later time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingEmails.map((item, index) => (
              <div
                key={`${item.id || 'pending'}-${index}`}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">{item.subject || '(No Subject)'}</span>
                    <span className="text-[11px] bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 text-indigo-300 font-mono">
                      To: {item.toEmail}
                    </span>
                    {item.attachmentCount > 0 && (
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/20 font-bold flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        {item.attachmentCount} Attachment(s)
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-1">{item.body.replace(/<[^>]+>/g, '')}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Target: {new Date(item.scheduledAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Countdown & Controls */}
                <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 block">
                      {getTimeRemaining(item.scheduledAt)}
                    </span>
                  </div>

                  <button
                    onClick={() => onDispatchNow(item)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
                    title="Send Immediately"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Send Now</span>
                  </button>

                  <button
                    onClick={() => onCancelSchedule(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                    title="Cancel Schedule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past / Dispatched History */}
      {pastEmails.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Past Queue Activity ({pastEmails.length})
          </h3>

          <div className="space-y-2">
            {pastEmails.map((item, index) => (
              <div
                key={`${item.id || 'past'}-${index}`}
                className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3 truncate">
                  {item.status === 'sent' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div className="truncate">
                    <p className="font-semibold text-slate-300 truncate">{item.subject}</p>
                    <p className="text-slate-500 text-[11px] font-mono">To: {item.toEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                    item.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.status}
                  </span>
                  <button
                    onClick={() => onDeleteSchedule(item.id)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
