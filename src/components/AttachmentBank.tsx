import React, { useRef, useState } from 'react';
import { FolderKanban, Plus, Trash2, Send, FileText, Image as ImageIcon, Film, File, Save, Paperclip, Download } from 'lucide-react';
import { SavedAttachmentData } from '../lib/firestoreService';
import { fileToAttachment } from '../lib/gmailService';

interface AttachmentBankProps {
  savedAttachments: SavedAttachmentData[];
  onSaveToBank: (data: { filename: string; mimeType: string; size: number; base64Data: string; tag: string }) => Promise<void>;
  onDeleteFromBank: (attachmentId: string) => Promise<void>;
  onSelectComposeWithFile: (file: SavedAttachmentData) => void;
}

export const AttachmentBank: React.FC<AttachmentBankProps> = ({
  savedAttachments,
  onSaveToBank,
  onDeleteFromBank,
  onSelectComposeWithFile,
}) => {
  const [tagInput, setTagInput] = useState('Standard');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const att = await fileToAttachment(file);
        await onSaveToBank({
          filename: att.filename,
          mimeType: att.mimeType,
          size: att.size,
          base64Data: att.base64Data,
          tag: tagInput.trim() || 'General',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const renderIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-emerald-400" />;
    if (mimeType.startsWith('video/')) return <Film className="w-5 h-5 text-purple-400" />;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="w-5 h-5 text-blue-400" />;
    return <File className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Reusable Attachment Bank</h2>
            <p className="text-xs text-slate-400">
              Save frequently sent documents, images, or media templates to attach in 1-click
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{isUploading ? 'Encoding...' : 'Upload File to Bank'}</span>
          </button>
        </div>
      </div>

      {/* Attachments Grid */}
      {savedAttachments.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 space-y-2">
          <FolderKanban className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm font-semibold text-slate-300">Your attachment bank is empty</p>
          <p className="text-xs">Upload company brochures, contracts, resumes, or standard media to reuse them across emails.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedAttachments.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl space-y-4 shadow-xl transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                      {renderIcon(item.mimeType)}
                    </div>
                    <div className="truncate">
                      <h3 className="font-bold text-white text-xs truncate">{item.filename}</h3>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {(item.size / 1024).toFixed(0)} KB • {item.mimeType.split('/')[1] || 'file'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700 shrink-0">
                    {item.tag || 'Saved'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectComposeWithFile(item)}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/20 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Attach & Compose</span>
                </button>

                <button
                  onClick={() => onDeleteFromBank(item.id)}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                  title="Delete from bank"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
