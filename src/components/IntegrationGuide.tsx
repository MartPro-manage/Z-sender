import React, { useState } from 'react';
import { Code2, Link, Copy, Check, Terminal, ExternalLink, Zap, Database, Server } from 'lucide-react';

export const IntegrationGuide: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // URL Deep Link Generator
  const [testEmail, setTestEmail] = useState('client@example.com');
  const [testSubject, setTestSubject] = useState('Important Invoice & Documents');
  const [testBody, setTestBody] = useState('Please review the attached project files.');

  const baseUrl = window.location.origin;
  const deepLinkUrl = `${baseUrl}/?to=${encodeURIComponent(testEmail)}&subject=${encodeURIComponent(testSubject)}&body=${encodeURIComponent(testBody)}`;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const codeSnippets = [
    {
      title: 'Method 1: Direct URL Deep Link (Easiest - Any Language or HTML)',
      description: 'Open SwiftSend from your other app with recipient, subject, and body pre-filled automatically in 1 click:',
      code: deepLinkUrl,
      type: 'url',
    },
    {
      title: 'Method 2: JavaScript / HTML Window Popup or Redirect',
      description: 'Trigger email composer directly from a button click in your other frontend app:',
      code: `function openSwiftSendComposer(recipientEmail, subject, message) {
  const swiftSendUrl = "${baseUrl}/" +
    "?to=" + encodeURIComponent(recipientEmail) +
    "&subject=" + encodeURIComponent(subject) +
    "&body=" + encodeURIComponent(message);

  window.open(swiftSendUrl, '_blank', 'width=1000,height=800');
}

// Example Trigger:
openSwiftSendComposer("${testEmail}", "${testSubject}", "${testBody}");`,
      type: 'js',
    },
    {
      title: 'Method 3: Shared Firestore Database Queue (Automated)',
      description: 'Write scheduled or pending emails directly to the shared Firestore collection from your other app:',
      code: `import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const app = initializeApp({
  projectId: "gen-lang-client-0190629153",
  apiKey: "AIzaSyAAX7f-8E22vSUvV8A0bcIkKXx0Urul6Sg",
  authDomain: "gen-lang-client-0190629153.firebaseapp.com",
});

const db = getFirestore(app, "ai-studio-swiftsendmail-d8a0838e-1f0f-4a11-a1f8-e5569821a2ad");

// Queue an email from your other app:
async function queueEmailForSwiftSend(userId, toEmail, subject, bodyHtml) {
  await addDoc(collection(db, "users", userId, "scheduledEmails"), {
    userId,
    toEmail,
    subject,
    body: bodyHtml,
    scheduledAt: new Date().toISOString(),
    status: "pending",
    attachmentCount: 0,
    createdAt: new Date().toISOString()
  });
}`,
      type: 'js',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Cross-App Connection & Integration Guide</h2>
            <p className="text-xs text-slate-400">
              Easily connect your other websites or applications to SwiftSend Gmail using URL deep links or shared database triggers
            </p>
          </div>
        </div>
      </div>

      {/* Interactive URL Generator Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Interactive Deep Link Generator</span>
        </div>
        <p className="text-xs text-slate-400">
          Enter sample parameters below to generate a pre-filled URL link that opens SwiftSend directly in composer mode:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Recipient</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</label>
            <input
              type="text"
              value={testSubject}
              onChange={(e) => setTestSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Body Text</label>
            <input
              type="text"
              value={testBody}
              onChange={(e) => setTestBody(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-indigo-300 truncate max-w-lg">{deepLinkUrl}</span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopy(deepLinkUrl, 99)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer"
              >
                {copiedIndex === 99 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 99 ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <a
                href={deepLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test Link</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Code Snippets List */}
      <div className="space-y-4">
        {codeSnippets.map((snippet, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-sm">{snippet.title}</h3>
                <p className="text-xs text-slate-400">{snippet.description}</p>
              </div>
              <button
                onClick={() => handleCopy(snippet.code, idx)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition cursor-pointer"
              >
                {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === idx ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-xs text-indigo-200 font-mono overflow-x-auto leading-relaxed">
              <code>{snippet.code}</code>
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};
