import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from './firebase';

export interface ContactData {
  id: string;
  userId: string;
  name: string;
  email: string;
  category: 'Work' | 'Personal' | 'VIP' | 'Client' | 'General';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledEmailData {
  id: string;
  userId: string;
  senderEmail: string;
  toEmail: string;
  subject: string;
  body: string;
  scheduledAt: string; // ISO string
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  attachmentCount: number;
  attachmentsData?: { filename: string; mimeType: string; size: number; base64Data: string }[];
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface EmailLogData {
  id: string;
  userId: string;
  toEmail: string;
  subject: string;
  snippet: string;
  attachmentCount: number;
  sentAt: string;
  status: 'success' | 'failed';
}

export interface SavedAttachmentData {
  id: string;
  userId: string;
  filename: string;
  mimeType: string;
  size: number;
  base64Data: string;
  tag: string;
  createdAt: string;
}

// ADDRESS BOOK CONTACTS
export async function getContacts(userId: string): Promise<ContactData[]> {
  const path = `users/${userId}/contacts`;
  try {
    const q = query(collection(db, path), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as ContactData));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveContact(
  userId: string,
  contact: Omit<ContactData, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<ContactData> {
  const contactId = contact.id || `contact_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `users/${userId}/contacts/${contactId}`;
  const now = new Date().toISOString();
  
  const fullContact: ContactData = {
    ...contact,
    id: contactId,
    userId,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'users', userId, 'contacts', contactId), fullContact);
    return fullContact;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateContact(userId: string, contactId: string, updates: Partial<ContactData>): Promise<void> {
  const path = `users/${userId}/contacts/${contactId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'contacts', contactId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteContact(userId: string, contactId: string): Promise<void> {
  const path = `users/${userId}/contacts/${contactId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'contacts', contactId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// SCHEDULED EMAILS QUEUE
export async function getScheduledEmails(userId: string): Promise<ScheduledEmailData[]> {
  const path = `users/${userId}/scheduledEmails`;
  try {
    const q = query(collection(db, path), orderBy('scheduledAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as ScheduledEmailData));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveScheduledEmail(
  userId: string,
  data: Omit<ScheduledEmailData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<ScheduledEmailData> {
  const emailId = `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `users/${userId}/scheduledEmails/${emailId}`;
  const now = new Date().toISOString();

  const fullEmail: ScheduledEmailData = {
    ...data,
    id: emailId,
    userId,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'users', userId, 'scheduledEmails', emailId), fullEmail);
    return fullEmail;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateScheduledEmailStatus(
  userId: string,
  emailId: string,
  status: 'pending' | 'sent' | 'failed' | 'cancelled',
  errorMsg?: string
): Promise<void> {
  const path = `users/${userId}/scheduledEmails/${emailId}`;
  try {
    const updates: Record<string, any> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (errorMsg) updates.error = errorMsg;
    await updateDoc(doc(db, 'users', userId, 'scheduledEmails', emailId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteScheduledEmail(userId: string, emailId: string): Promise<void> {
  const path = `users/${userId}/scheduledEmails/${emailId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'scheduledEmails', emailId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// EMAIL LOGS
export async function getEmailLogs(userId: string): Promise<EmailLogData[]> {
  const path = `users/${userId}/emailLogs`;
  try {
    const q = query(collection(db, path), orderBy('sentAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as EmailLogData));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function logEmailSent(
  userId: string,
  data: Omit<EmailLogData, 'id' | 'userId'>
): Promise<EmailLogData> {
  const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `users/${userId}/emailLogs/${logId}`;

  const fullLog: EmailLogData = {
    ...data,
    id: logId,
    userId,
  };

  try {
    await setDoc(doc(db, 'users', userId, 'emailLogs', logId), fullLog);
    return fullLog;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// SAVED REUSABLE ATTACHMENT BANK
export async function getSavedAttachments(userId: string): Promise<SavedAttachmentData[]> {
  const path = `users/${userId}/savedAttachments`;
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as SavedAttachmentData));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveAttachmentToBank(
  userId: string,
  data: Omit<SavedAttachmentData, 'id' | 'userId' | 'createdAt'>
): Promise<SavedAttachmentData> {
  const attachmentId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `users/${userId}/savedAttachments/${attachmentId}`;
  const now = new Date().toISOString();

  const fullAttachment: SavedAttachmentData = {
    ...data,
    id: attachmentId,
    userId,
    createdAt: now,
  };

  try {
    await setDoc(doc(db, 'users', userId, 'savedAttachments', attachmentId), fullAttachment);
    return fullAttachment;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSavedAttachment(userId: string, attachmentId: string): Promise<void> {
  const path = `users/${userId}/savedAttachments/${attachmentId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'savedAttachments', attachmentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// DELETE ALL DATA FOR A USER ACCOUNT
export async function deleteAllUserData(userId: string): Promise<void> {
  const collections = ['contacts', 'scheduledEmails', 'emailLogs', 'savedAttachments'];
  for (const col of collections) {
    try {
      const colRef = collection(db, 'users', userId, col);
      const snap = await getDocs(colRef);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
    } catch (e) {
      console.warn(`Error deleting collection ${col} for user ${userId}:`, e);
    }
  }
}
