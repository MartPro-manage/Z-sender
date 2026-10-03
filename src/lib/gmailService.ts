export interface FileAttachment {
  id?: string;
  filename: string;
  mimeType: string;
  size: number;
  base64Data: string; // Pure Base64 without data: mime/type prefix
  dataUrl?: string;   // Full data URL for client preview
  category?: 'image' | 'video' | 'document' | 'audio' | 'archive' | 'other';
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal?: number;
  threadsTotal?: number;
  historyId?: string;
}

/**
 * Encodes string to Base64URL (RFC 4648 §5)
 */
function toBase64Url(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Encodes binary string to Base64URL
 */
function binaryToBase64Url(binaryStr: string): string {
  return btoa(binaryStr)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Categorize file based on MIME type or extension
 */
export function categorizeFile(filename: string, mimeType: string): 'image' | 'video' | 'document' | 'audio' | 'archive' | 'other' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType.includes('presentation') ||
    mimeType.includes('powerpoint') ||
    mimeType.includes('text/') ||
    filename.endsWith('.pdf') ||
    filename.endsWith('.docx') ||
    filename.endsWith('.xlsx') ||
    filename.endsWith('.pptx') ||
    filename.endsWith('.txt') ||
    filename.endsWith('.csv')
  ) {
    return 'document';
  }
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('tar') ||
    mimeType.includes('7z') ||
    mimeType.includes('compressed') ||
    filename.endsWith('.zip') ||
    filename.endsWith('.rar')
  ) {
    return 'archive';
  }
  return 'other';
}

/**
 * Converts browser File object to Base64 attachment structure
 */
export async function fileToAttachment(file: File): Promise<FileAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64Data = dataUrl.split(',')[1] || '';
      const category = categorizeFile(file.name, file.type);
      resolve({
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        base64Data,
        dataUrl,
        category,
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Formats RFC 2822 raw email with MIME attachments and returns Base64Url string
 */
export function buildRawRfc822Message(params: {
  fromEmail: string;
  toEmail: string;
  subject: string;
  bodyHtml: string;
  attachments?: FileAttachment[];
}): string {
  const { fromEmail, toEmail, subject, bodyHtml, attachments = [] } = params;
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;

  let rawMessage = '';
  rawMessage += `From: <${fromEmail}>\r\n`;
  rawMessage += `To: ${toEmail}\r\n`;
  rawMessage += `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=\r\n`;
  rawMessage += `MIME-Version: 1.0\r\n`;

  if (attachments.length === 0) {
    rawMessage += `Content-Type: text/html; charset="UTF-8"\r\n`;
    rawMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
    rawMessage += `${btoa(unescape(encodeURIComponent(bodyHtml)))}\r\n`;
  } else {
    rawMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

    // HTML Body part
    rawMessage += `--${boundary}\r\n`;
    rawMessage += `Content-Type: text/html; charset="UTF-8"\r\n`;
    rawMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
    rawMessage += `${btoa(unescape(encodeURIComponent(bodyHtml)))}\r\n\r\n`;

    // Attachments parts
    for (const att of attachments) {
      rawMessage += `--${boundary}\r\n`;
      rawMessage += `Content-Type: ${att.mimeType}; name="=?UTF-8?B?${btoa(unescape(encodeURIComponent(att.filename)))}?="\r\n`;
      rawMessage += `Content-Disposition: attachment; filename="=?UTF-8?B?${btoa(unescape(encodeURIComponent(att.filename)))}?="\r\n`;
      rawMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
      
      // Split base64 lines every 76 chars as per RFC
      const chunks = att.base64Data.match(/.{1,76}/g) || [];
      rawMessage += `${chunks.join('\r\n')}\r\n\r\n`;
    }

    rawMessage += `--${boundary}--\r\n`;
  }

  // Convert raw message string to Base64URL
  return binaryToBase64Url(rawMessage);
}

/**
 * Fetch user's Gmail profile information
 */
export async function getGmailProfile(accessToken: string): Promise<GmailProfile> {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to fetch Gmail profile: ${response.status} - ${errText}`);
  }

  return response.json();
}

/**
 * Sends email directly through Gmail API
 */
export async function sendGmailMessage(accessToken: string, rawBase64Url: string): Promise<{ id: string; threadId: string }> {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: rawBase64Url }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`Gmail API error: ${message}`);
  }

  return response.json();
}

/**
 * Saves draft in user's Gmail account
 */
export async function createGmailDraft(accessToken: string, rawBase64Url: string): Promise<{ id: string; message: { id: string } }> {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: { raw: rawBase64Url } }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`Gmail Draft error: ${message}`);
  }

  return response.json();
}
