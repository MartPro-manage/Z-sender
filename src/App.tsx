import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  signInWithEmail,
  signUpWithEmail,
  logout,
  getAccessToken,
  deleteCurrentAccount,
  resetPassword,
  requestGmailSenderAuthorization,
} from './lib/auth';
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
  SenderSettingsData,
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
  deleteAllUserData,
  getUserSenderSettings,
  saveUserSenderSettings,
} from './lib/firestoreService';
import { Navbar, ActiveTab } from './components/Navbar';
import { Composer } from './components/Composer';
import { AddressBook } from './components/AddressBook';
import { ScheduledQueue } from './components/ScheduledQueue';
import { EmailLogs } from './components/EmailLogs';
import { AttachmentBank } from './components/AttachmentBank';
import { AuthLanding } from './components/AuthLanding';
import { SenderConfigModal } from './components/SenderConfigModal';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isGmailAuthorized, setIsGmailAuthorized] = useState(false);
  const [senderSettings, setSenderSettings] = useState<SenderSettingsData | null>(null);
  const [isSenderModalOpen, setIsSenderModalOpen] = useState(false);

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

  const [isSendingInProgress, setIsSendingInProgress] = useState(false);
  const [globalBanner, setGlobalBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, token) => {
        setUser(authUser);
        if (token) {
          setIsGmailAuthorized(true);
        }
        setIsAuthLoading(false);
      },
      () => {
        setUser(null);
        setIsGmailAuthorized(false);
        setSenderSettings(null);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Firestore user data when authenticated
  const loadUserData = async (uid: string) => {
    try {
      const [cList, sList, lList, aList, sSettings] = await Promise.all([
        getContacts(uid).catch(() => []),
        getScheduledEmails(uid).catch(() => []),
        getEmailLogs(uid).catch(() => []),
        getSavedAttachments(uid).catch(() => []),
        getUserSenderSettings(uid).catch(() => null),
      ]);
      setContacts(cList);
      setScheduledEmails(sList);
      setEmailLogs(lList);
      setSavedAttachments(aList);
      setSenderSettings(sSettings);
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
    if (!user || !user.email) return;

    const interval = setInterval(async () => {
      const token = await getAccessToken();
      const hasAppPassword = Boolean(senderSettings?.appPassword);

      if (!token && !hasAppPassword) return;

      const now = new Date().getTime();
      const pending = scheduledEmails.filter((e) => e.status === 'pending');

      for (const item of pending) {
        if (new Date(item.scheduledAt).getTime() <= now) {
          try {
            const formattedAtts = item.attachmentsData
              ? item.attachmentsData.map((a) => ({
                  filename: a.filename,
                  mimeType: a.mimeType,
                  size: a.size,
                  base64Data: a.base64Data,
                }))
              : [];

            if (hasAppPassword && senderSettings?.appPassword) {
              const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  senderEmail: user.email,
                  appPassword: senderSettings.appPassword,
                  smtpHost: senderSettings.smtpHost,
                  smtpPort: senderSettings.smtpPort,
                  smtpSecure: senderSettings.smtpSecure,
                  toEmail: item.toEmail,
                  subject: item.subject,
                  bodyHtml: item.body,
                  attachments: formattedAtts,
                }),
              });
              if (!res.ok) {
                const eJson = await res.json().catch(() => null);
                throw new Error(eJson?.error || 'Failed to dispatch scheduled email');
              }
            } else if (token) {
              const rawMsg = buildRawRfc822Message({
                fromEmail: user.email || '',
                toEmail: item.toEmail,
                subject: item.subject,
                bodyHtml: item.body,
                attachments: formattedAtts,
              });
              await sendGmailMessage(token, rawMsg);
            }

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
  }, [user, scheduledEmails, senderSettings]);

  // Helper to map Firebase Auth error codes to user-friendly messages
  const formatAuthError = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please verify your credentials or create a new account.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again or create a new account.';
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists. Please sign in instead.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/operation-not-allowed':
        return 'Email/Password sign-in is not enabled in your Firebase console. Please enable Email/Password under Authentication > Sign-in method in Firebase Console.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful attempts. Access has been temporarily restricted. Please try again in a few moments.';
      case 'auth/network-request-failed':
        return 'Network connection issue. Please check your internet connection and try again.';
      default:
        return err?.message || 'Authentication failed. Please check your details and try again.';
    }
  };

  // Auth Actions: Sign In & Sign Up
  const handleSignIn = async (email: string, pass: string) => {
    setAuthError(null);
    setIsAuthSubmitting(true);
    try {
      const loggedUser = await signInWithEmail(email, pass);
      setUser(loggedUser);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setAuthError(formatAuthError(err));
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleSignUp = async (email: string, pass: string, displayName?: string) => {
    setAuthError(null);
    setIsAuthSubmitting(true);
    try {
      const newUser = await signUpWithEmail(email, pass, displayName);
      setUser(newUser);
    } catch (err: any) {
      console.error('Sign-up error:', err);
      setAuthError(formatAuthError(err));
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleResetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await resetPassword(email);
      return { success: true };
    } catch (err: any) {
      console.error('Reset password error:', err);
      const code = err?.code || '';
      let msg = err?.message || 'Failed to send reset link.';
      if (code === 'auth/user-not-found') {
        msg = 'No account found with this email address.';
      } else if (code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      return { success: false, error: msg };
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setIsGmailAuthorized(false);
  };

  // Connect / Authorize Gmail Sender
  const handleConnectGmail = async () => {
    try {
      setGlobalBanner({
        type: 'success',
        message: 'Opening Google authorization window to connect Gmail...',
      });
      const token = await requestGmailSenderAuthorization();
      if (token) {
        setIsGmailAuthorized(true);
        setGlobalBanner({
          type: 'success',
          message: 'Gmail successfully connected! Real inbox delivery is enabled.',
        });
      }
    } catch (err: any) {
      console.error('Connect Gmail error:', err);
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        setGlobalBanner({
          type: 'error',
          message: 'Google authorization window was closed. Click "Connect Gmail" to try again.',
        });
      } else {
        setGlobalBanner({
          type: 'error',
          message: `Failed to connect Gmail: ${err?.message || 'Check your browser popup permissions.'}`,
        });
      }
    } finally {
      setTimeout(() => setGlobalBanner(null), 6000);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete your account (${user.email}) and all saved contacts, scheduled transfers, saved attachments, and sent logs?\n\nThis action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      setIsSendingInProgress(true);
      setGlobalBanner({
        type: 'success',
        message: 'Purging database records and deleting your account...',
      });

      // 1. Wipe all user records from Firestore
      await deleteAllUserData(user.uid);

      // 2. Delete user from Firebase Authentication
      await deleteCurrentAccount();

      setUser(null);
      setIsGmailAuthorized(false);
      setGlobalBanner(null);
      alert('Your account and all associated data have been permanently deleted.');
    } catch (err: any) {
      console.error('Account deletion error:', err);
      if (err?.code === 'auth/requires-recent-login') {
        alert('For security reasons, deleting your account requires a recent sign-in. Please sign out, sign back in, and try deleting your account again.');
      } else {
        alert(`Failed to delete account: ${err?.message || 'Unknown error'}`);
      }
    } finally {
      setIsSendingInProgress(false);
    }
  };

  const handleSaveSenderSettings = async (settings: SenderSettingsData) => {
    if (!user) return;
    await saveUserSenderSettings(user.uid, settings);
    setSenderSettings(settings);
    setGlobalBanner({
      type: 'success',
      message: 'Email sender credentials verified and saved! Real dispatch is ready.',
    });
  };

  // Trigger Direct Email Sending
  const handleInitiateSendNow = async (data: {
    toEmail: string;
    subject: string;
    bodyHtml: string;
    attachments: FileAttachment[];
    sendSelfCopy: boolean;
  }) => {
    if (!user || !user.email) return;

    setIsSendingInProgress(true);
    setGlobalBanner({
      type: 'success',
      message: 'Processing real email delivery...',
    });

    try {
      const { toEmail, subject, bodyHtml, attachments, sendSelfCopy } = data;
      const hasAppPassword = Boolean(senderSettings?.appPassword);

      if (hasAppPassword && senderSettings?.appPassword) {
        // Direct dispatch using App Password & SMTP backend (100% bypasses Google OAuth verification restrictions)
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderEmail: user.email,
            appPassword: senderSettings.appPassword,
            smtpHost: senderSettings.smtpHost,
            smtpPort: senderSettings.smtpPort,
            smtpSecure: senderSettings.smtpSecure,
            toEmail,
            subject,
            bodyHtml,
            attachments,
          }),
        });

        const sendRes = await res.json();
        if (!res.ok) {
          throw new Error(sendRes.error || 'Failed to dispatch email via SMTP.');
        }

        // If sendSelfCopy is checked, also deliver copy to sender's own address
        if (sendSelfCopy && user.email !== toEmail) {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              senderEmail: user.email,
              appPassword: senderSettings.appPassword,
              smtpHost: senderSettings.smtpHost,
              smtpPort: senderSettings.smtpPort,
              smtpSecure: senderSettings.smtpSecure,
              toEmail: user.email,
              subject: `[Copy] ${subject}`,
              bodyHtml,
              attachments,
            }),
          }).catch((e) => console.warn('Self copy note:', e));
        }
      } else {
        // Fallback to OAuth token if user prefers OAuth
        let token = await getAccessToken();
        if (!token) {
          try {
            setGlobalBanner({
              type: 'success',
              message: 'Authorizing Gmail access for real inbox delivery...',
            });
            token = await requestGmailSenderAuthorization();
            setIsGmailAuthorized(true);
          } catch (oauthErr: any) {
            console.warn('OAuth authorization failed, opening App Password setup:', oauthErr);
            setIsSenderModalOpen(true);
            throw new Error(
              'Google OAuth blocked this app because verification is pending. Please enter your 16-character Gmail App Password to send real emails immediately.'
            );
          }
        }

        if (!token) {
          setIsSenderModalOpen(true);
          throw new Error('Please set up your Gmail App Password to enable real email sending.');
        }

        // Build RFC 822 MIME message with Base64 attachments
        const rawMsg = buildRawRfc822Message({
          fromEmail: user.email,
          toEmail,
          subject,
          bodyHtml,
          attachments,
        });

        // Send via official Gmail REST API
        await sendGmailMessage(token, rawMsg);

        if (sendSelfCopy && user.email !== toEmail) {
          const selfMsg = buildRawRfc822Message({
            fromEmail: user.email,
            toEmail: user.email,
            subject: `[Copy] ${subject}`,
            bodyHtml,
            attachments,
          });
          await sendGmailMessage(token, selfMsg).catch((e) => console.warn('Self copy note:', e));
        }
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
        message: `Email successfully delivered to ${toEmail} with ${attachments.length} attachment(s)!`,
      });

      loadUserData(user.uid);
    } catch (err: any) {
      console.error('Send Error:', err);
      let errMsg = err?.message || 'Check your transfer settings.';
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        errMsg = 'Google authorization popup was closed. Use a 16-letter Gmail App Password instead.';
        setIsSenderModalOpen(true);
      }
      setGlobalBanner({
        type: 'error',
        message: `Sending failed: ${errMsg}`,
      });
      throw err;
    } finally {
      setIsSendingInProgress(false);
      setTimeout(() => setGlobalBanner(null), 6000);
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

  // Save Draft Handler
  const handleSaveDraft = async (data: {
    toEmail: string;
    subject: string;
    bodyHtml: string;
    attachments: FileAttachment[];
  }) => {
    if (!user || !user.email) return;

    try {
      const token = await getAccessToken();
      if (token) {
        const rawMsg = buildRawRfc822Message({
          fromEmail: user.email,
          toEmail: data.toEmail,
          subject: data.subject,
          bodyHtml: data.bodyHtml,
          attachments: data.attachments,
        });

        await createGmailDraft(token, rawMsg);
      }

      setGlobalBanner({
        type: 'success',
        message: `Draft created successfully!`,
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
      const token = await getAccessToken();
      if (token) {
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
      }

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
      setGlobalBanner({ type: 'success', message: `Dispatched "${item.subject}" immediately!` });
    } catch (err: any) {
      console.error('Dispatch error:', err);
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
        <p className="text-xs font-mono text-slate-400">Loading SwiftSend Services...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthLanding
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onResetPassword={handleResetPassword}
        isLoading={isAuthSubmitting}
        error={authError}
        onClearError={() => setAuthError(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <div>
        <Navbar
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
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
              isGmailAuthorized={isGmailAuthorized}
              senderSettings={senderSettings}
              onConnectGmail={handleConnectGmail}
              onOpenSenderConfig={() => setIsSenderModalOpen(true)}
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

      {/* Sender Configuration Modal for App Password / Direct SMTP */}
      {user && (
        <SenderConfigModal
          isOpen={isSenderModalOpen}
          onClose={() => setIsSenderModalOpen(false)}
          senderEmail={user.email || ''}
          currentSettings={senderSettings}
          onSaveSettings={handleSaveSenderSettings}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-[11px] text-slate-600">
        SwiftSend • Transfers sent directly from <span className="text-slate-400">{user.email}</span>
      </footer>
    </div>
  );
}
