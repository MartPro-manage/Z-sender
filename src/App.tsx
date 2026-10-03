import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout, getAccessToken } from './lib/auth';
import {
  FileAttachment,
  buildRawRfc822Message,
  sendGmailMessage,
  createGmailDraft,
} from './lib/gmailService';
import {
  ContactData,
  ScheduledEmailData,
  EmailLogData,
  SavedAttachmentData,
  getContacts,
  saveContact,
  deleteContact,
  getScheduledEmails,
  saveScheduledEmail,
  updateScheduledEmailStatus,
  deleteScheduledEmail,
  getEmailLogs,
  logEmailSent,
  getSavedAttachments,
  saveAttachmentToBank,
  deleteSavedAttachment,
} from './lib/firestoreService';
import { Navbar, ActiveTab } from './components/Navbar';
import { Composer } from './components/Composer';
import { AddressBook } from './components/AddressBook';
import { ScheduledQueue } from './components/ScheduledQueue';
import { EmailLogs } from './components/EmailLogs';
import { AttachmentBank } from './components/AttachmentBank';
import { ConfirmModal } from './components/ConfirmModal';
import { AuthLanding } from './components/AuthLanding';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('composer');

  // Firestore Data State
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmailData[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLogData[]>([]);
  const [savedAttachments, setSavedAttachments] = useState<SavedAttachmentData[]>([]);

  // Composer prefill
  const [composerRecipient, setComposerRecipient] = useState('');
  const [composerSubject, setComposerSubject] = useState('');
  const [composerBody, setComposerBody] = useState('');

  // Parse deep-link query parameters on launch
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const toParam = params.get('to') || params.get('email') || params.get('recipient');
    const subParam = params.get('subject') || params.get('sub');
    const bodyParam = params.get('body') || params.get('msg') || params.get('text');

    if (toParam) setComposerRecipient(toParam);
    if (subParam) setComposerSubject(subParam);
    if (bodyParam) setComposerBody(bodyParam);
  }, []);

  // Confirmation Modal State (Mandatory Workspace Skill Requirement)
  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    toEmail: string;
    subject: string;
    bodyHtml: string;
    attachments: FileAttachment[];
    sendSelfCopy: boolean;
    isScheduled?: boolean;
    scheduledTime?: string;
  }>({
    isOpen: false,
    toEmail: '',
    subject: '',
    bodyHtml: '',
    attachments: [],
    sendSelfCopy: false,
  });

  const [isSendingInProgress, setIsSendingInProgress] = useState(false);
  const [globalBanner, setGlobalBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser) => {
        setUser(authUser);
        setIsAuthLoading(false);
      },
      () => {
        setUser(null);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Firestore user data when authenticated
  const loadUserData = async (uid: string) => {
    try {
      const [cList, sList, lList, aList] = await Promise.all([
        getContacts(uid).catch(() => []),
        getScheduledEmails(uid).catch(() => []),
        getEmailLogs(uid).catch(() => []),
        getSavedAttachments(uid).catch(() => []),
      ]);
      setContacts(cList);
      setScheduledEmails(sList);
      setEmailLogs(lList);
      setSavedAttachments(aList);
    } catch (err) {
      console.error('Error loading Firestore data:', err);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      loadUserData(user.uid);
    }
  }, [user]);

  // Background Worker: Checks pending scheduled emails every 15s and sends due items
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const token = await getAccessToken();
      if (!token || !user.email) return;

      const now = new Date().getTime();
      const pending = scheduledEmails.filter((e) => e.status === 'pending');

      for (const item of pending) {
        if (new Date(item.scheduledAt).getTime() <= now) {
          try {
            const rawMsg = buildRawRfc822Message({
              fromEmail: user.email,
              toEmail: item.toEmail,
              subject: item.subject,
              bodyHtml: item.body,
              attachments: item.attachmentsData
                ? item.attachmentsData.map((a) => ({
                    filename: a.filename,
                    mimeType: a.mimeType,
                    size: a.size,
                    base64Data: a.base64Data,
                  }))
                : [],
            });

            await sendGmailMessage(token, rawMsg);
            await updateScheduledEmailStatus(user.uid, item.id, 'sent');
            await logEmailSent(user.uid, {
              toEmail: item.toEmail,
              subject: item.subject,
              snippet: item.body.replace(/<[^>]+>/g, '').substring(0, 100),
              attachmentCount: item.attachmentCount,
              sentAt: new Date().toISOString(),
              status: 'success',
            });

            loadUserData(user.uid);
          } catch (err: any) {
            console.error('Scheduled dispatch error:', err);
            await updateScheduledEmailStatus(user.uid, item.id, 'failed', err.message);
          }
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [user, scheduledEmails]);

  // Auth Actions
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const res = await googleSignIn();
      setUser(res.user);
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        // Quietly handle user cancelling/closing the login popup
        setAuthError('Sign-in window was closed. Click "Continue with Google Account" to try again.');
      } else if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setAuthError(
          'Unauthorized Domain: To log in from your Vercel deployment, you must add your Vercel URL (e.g., yoursite.vercel.app) to the "Authorized Domains" list in your Firebase Console (Authentication -> Settings -> Authorized Domains).'
        );
      } else {
        console.error('Sign-In Error:', err);
        setAuthError(err?.message || 'Failed to authenticate with Google Account.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  // Trigger Confirmation Modal for Email Transfer
  const handleInitiateSendNow = async (data: {
    toEmail: string;
    subject: string;
    bodyHtml: string;
    attachments: FileAttachment[];
    sendSelfCopy: boolean;
  }) => {
    setConfirmModalData({
      isOpen: true,
      toEmail: data.toEmail,
      subject: data.subject,
      bodyHtml: data.bodyHtml,
      attachments: data.attachments,
      sendSelfCopy: data.sendSelfCopy,
    });
  };

  // Confirm and Execute Gmail Sending
  const handleExecuteSend = async () => {
    if (!user || !user.email) return;

    setIsSendingInProgress(true);
    try {
      let token = await getAccessToken();
      if (!token) {
        // Prompt re-auth if token expired
        const res = await googleSignIn();
        token = res.accessToken;
      }

      const { toEmail, subject, bodyHtml, attachments, sendSelfCopy } = confirmModalData;

      // Build & Send raw RFC 822 email
      const rawMsg = buildRawRfc822Message({
        fromEmail: user.email,
        toEmail,
        subject,
        bodyHtml,
        attachments,
      });

      await sendGmailMessage(token, rawMsg);

      // If sendSelfCopy is checked, also send copy to user's logged in address
      if (sendSelfCopy && user.email !== toEmail) {
        const selfMsg = buildRawRfc822Message({
          fromEmail: user.email,
          toEmail: user.email,
          subject: `[Copy] ${subject}`,
          bodyHtml,
          attachments,
        });
        await sendGmailMessage(token, selfMsg).catch((e) => console.error('Self copy error:', e));
      }

      // Log sent transfer in Firestore
      await logEmailSent(user.uid, {
        toEmail,
        subject,
        snippet: bodyHtml.replace(/<[^>]+>/g, '').substring(0, 100),
        attachmentCount: attachments.length,
        sentAt: new Date().toISOString(),
        status: 'success',
      });

      setGlobalBanner({
        type: 'success',
        message: `Email successfully sent via Gmail to ${toEmail} with ${attachments.length} attachment(s)!`,
      });

      setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
      loadUserData(user.uid);
    } catch (err: any) {
      console.error('Send Error:', err);
      setGlobalBanner({
        type: 'error',
        message: `Sending failed: ${err.message || 'Check your Gmail permissions.'}`,
      });
    } finally {
      setIsSendingInProgress(false);
      setTimeout(() => setGlobalBanner(null), 5000);
    }
  };

  // Schedule Email Handler
  const handleScheduleSend = async (data: {
    toEmail: string;
    subject: string;
    bodyHtml: string;
    scheduledAt: string;
    attachments: FileAttachment[];
  }) => {
    if (!user || !user.email) return;

    try {
      await saveScheduledEmail(user.uid, {
        senderEmail: user.email,
        toEmail: data.toEmail,
        subject: data.subject,
        body: data.bodyHtml,
        scheduledAt: data.scheduledAt,
        status: 'pending',
        attachmentCount: data.attachments.length,
        attachmentsData: data.attachments.map((a) => ({
          filename: a.filename,
          mimeType: a.mimeType,
          size: a.size,
          base64Data: a.base64Data,
        })),
      });

      setGlobalBanner({
        type: 'success',
        message: `Email queued for scheduled sending on ${new Date(data.scheduledAt).toLocaleString()}!`,
      });

      loadUserData(user.uid);
      setActiveTab('scheduled-queue');
    } catch (err: any) {
      setGlobalBanner({ type: 'error', message: `Failed to schedule email: ${err.message}` });
    } finally {
      setTimeout(() => setGlobalBanner(null), 5000);
    }
  };

  // Save Gmail Draft Handler
  const handleSaveDraft = async (data: {
    toEmail: string;
    subject: string;
    bodyHtml: string;
    attachments: FileAttachment[];
  }) => {
    if (!user || !user.email) return;

    try {
      let token = await getAccessToken();
      if (!token) {
        const res = await googleSignIn();
        token = res.accessToken;
      }

      const rawMsg = buildRawRfc822Message({
        fromEmail: user.email,
        toEmail: data.toEmail,
        subject: data.subject,
        bodyHtml: data.bodyHtml,
        attachments: data.attachments,
      });

      await createGmailDraft(token, rawMsg);

      setGlobalBanner({
        type: 'success',
        message: `Draft created in your Gmail account!`,
      });
    } catch (err: any) {
      setGlobalBanner({ type: 'error', message: `Failed to create draft: ${err.message}` });
    } finally {
      setTimeout(() => setGlobalBanner(null), 5000);
    }
  };

  // Address Book Actions
  const handleSaveContact = async (cData: Omit<ContactData, 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    await saveContact(user.uid, cData);
    await loadUserData(user.uid);
  };

  const handleQuickSaveContact = async (name: string, email: string) => {
    if (!user) return;
    await saveContact(user.uid, {
      name,
      email,
      category: 'General',
      notes: 'Quick added from composer',
    });
    await loadUserData(user.uid);
    setGlobalBanner({ type: 'success', message: `Added ${email} to your Address Book!` });
    setTimeout(() => setGlobalBanner(null), 3000);
  };

  const handleDeleteContactAction = async (contactId: string) => {
    if (!user) return;
    if (window.confirm('Delete this contact from your Address Book?')) {
      await deleteContact(user.uid, contactId);
      await loadUserData(user.uid);
    }
  };

  // Scheduled Queue Actions
  const handleDispatchNow = async (item: ScheduledEmailData) => {
    if (!user || !user.email) return;
    try {
      let token = await getAccessToken();
      if (!token) {
        const res = await googleSignIn();
        token = res.accessToken;
      }

      const rawMsg = buildRawRfc822Message({
        fromEmail: user.email,
        toEmail: item.toEmail,
        subject: item.subject,
        bodyHtml: item.body,
        attachments: item.attachmentsData
          ? item.attachmentsData.map((a) => ({
              filename: a.filename,
              mimeType: a.mimeType,
              size: a.size,
              base64Data: a.base64Data,
            }))
          : [],
      });

      await sendGmailMessage(token, rawMsg);
      await updateScheduledEmailStatus(user.uid, item.id, 'sent');
      await logEmailSent(user.uid, {
        toEmail: item.toEmail,
        subject: item.subject,
        snippet: item.body.replace(/<[^>]+>/g, '').substring(0, 100),
        attachmentCount: item.attachmentCount,
        sentAt: new Date().toISOString(),
        status: 'success',
      });

      setGlobalBanner({ type: 'success', message: `Dispatched scheduled email to ${item.toEmail}!` });
      loadUserData(user.uid);
    } catch (err: any) {
      setGlobalBanner({ type: 'error', message: `Dispatch failed: ${err.message}` });
    } finally {
      setTimeout(() => setGlobalBanner(null), 4000);
    }
  };

  const handleCancelSchedule = async (emailId: string) => {
    if (!user) return;
    await updateScheduledEmailStatus(user.uid, emailId, 'cancelled');
    await loadUserData(user.uid);
  };

  const handleDeleteSchedule = async (emailId: string) => {
    if (!user) return;
    await deleteScheduledEmail(user.uid, emailId);
    await loadUserData(user.uid);
  };

  // Reusable Attachment Bank Actions
  const handleSaveToBank = async (att: FileAttachment) => {
    if (!user) return;
    await saveAttachmentToBank(user.uid, {
      filename: att.filename,
      mimeType: att.mimeType,
      size: att.size,
      base64Data: att.base64Data,
      tag: 'General',
    });
    await loadUserData(user.uid);
    setGlobalBanner({ type: 'success', message: `Saved "${att.filename}" to your Attachment Bank!` });
    setTimeout(() => setGlobalBanner(null), 3000);
  };

  const handleDeleteFromBank = async (attachmentId: string) => {
    if (!user) return;
    if (window.confirm('Delete this saved file from your Attachment Bank?')) {
      await deleteSavedAttachment(user.uid, attachmentId);
      await loadUserData(user.uid);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-100">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading SwiftSend Gmail Services...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthLanding onSignIn={handleGoogleSignIn} isLoading={isAuthLoading} error={authError} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <div>
        <Navbar
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          scheduledCount={scheduledEmails.filter((e) => e.status === 'pending').length}
          contactCount={contacts.length}
        />

        {/* Global Banner Notification */}
        {globalBanner && (
          <div
            className={`max-w-5xl mx-auto mt-4 px-4 py-3 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in duration-200 ${
              globalBanner.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {globalBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{globalBanner.message}</span>
            </div>
            <button onClick={() => setGlobalBanner(null)} className="hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="py-6">
          {activeTab === 'composer' && (
            <Composer
              user={user}
              contacts={contacts}
              savedAttachmentsBank={savedAttachments}
              onSendNow={handleInitiateSendNow}
              onScheduleSend={handleScheduleSend}
              onSaveDraft={handleSaveDraft}
              onSaveContactQuick={handleQuickSaveContact}
              onSaveAttachmentToBank={handleSaveToBank}
              initialRecipient={composerRecipient}
              initialSubject={composerSubject}
              initialBody={composerBody}
            />
          )}

          {activeTab === 'address-book' && (
            <AddressBook
              contacts={contacts}
              onSaveContact={handleSaveContact}
              onDeleteContact={handleDeleteContactAction}
              onSelectCompose={(email) => {
                setComposerRecipient(email);
                setActiveTab('composer');
              }}
            />
          )}

          {activeTab === 'scheduled-queue' && (
            <ScheduledQueue
              scheduledEmails={scheduledEmails}
              onDispatchNow={handleDispatchNow}
              onCancelSchedule={handleCancelSchedule}
              onDeleteSchedule={handleDeleteSchedule}
            />
          )}

          {activeTab === 'sent-history' && <EmailLogs logs={emailLogs} />}

          {activeTab === 'attachment-bank' && (
            <AttachmentBank
              savedAttachments={savedAttachments}
              onSaveToBank={async (data) => {
                await saveAttachmentToBank(user.uid, data);
                await loadUserData(user.uid);
              }}
              onDeleteFromBank={handleDeleteFromBank}
              onSelectComposeWithFile={(file) => {
                setActiveTab('composer');
              }}
            />
          )}
        </main>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalData.isOpen}
        onClose={() => setConfirmModalData((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteSend}
        title="Confirm Gmail Transfer"
        senderEmail={user.email || ''}
        recipientEmail={confirmModalData.toEmail}
        subject={confirmModalData.subject}
        attachments={confirmModalData.attachments}
        isSending={isSendingInProgress}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-[11px] text-slate-600">
        SwiftSend Gmail • Transfers sent directly from <span className="text-slate-400">{user.email}</span>
      </footer>
    </div>
  );
}
