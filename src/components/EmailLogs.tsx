import React, { useState } from 'react';
import { History, CheckCircle2, AlertCircle, Search, Paperclip, Mail, ExternalLink } from 'lucide-react';
import { EmailLogData } from '../lib/firestoreService';

interface EmailLogsProps {
  logs: EmailLogData[];
}

export const EmailLogs: React.FC<EmailLogsProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(
    (l) => l.subject.toLowerCase().includes(searchTerm.toLowerCase()) || l.toEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Sent Email Transfer Log</h2>
            <p className="text-xs text-slate-400">
              Audit log of all sent document, image, and video email transfers via Gmail API
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sent log..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Logs Table / Grid */}
      {filteredLogs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 space-y-2">
          <History className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm font-semibold text-slate-300">No sent transfers logged yet</p>
          <p className="text-xs">Sent transfers will appear here automatically with attachment details and delivery status.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition text-xs"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm">{log.subject || '(No Subject)'}</span>
                  <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-indigo-300 font-mono text-[11px]">
                    To: {log.toEmail}
                  </span>
                  {log.attachmentCount > 0 && (
                    <span className="bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20 font-bold flex items-center gap-1 text-[10px]">
                      <Paperclip className="w-3 h-3" />
                      {log.attachmentCount} File(s) Attached
                    </span>
                  )}
                </div>

                <p className="text-slate-400 line-clamp-1">{log.snippet}</p>

                <p className="text-[10px] text-slate-500 font-mono pt-1">
                  Sent: {new Date(log.sentAt).toLocaleString()}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full font-bold uppercase text-[10px] flex items-center gap-1 ${
                  log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {log.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {log.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
