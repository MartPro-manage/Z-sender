import express from 'express';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API endpoint for sending email directly via SMTP / Gmail App Password
  app.post('/api/send-email', async (req, res) => {
    try {
      const {
        senderEmail,
        appPassword,
        smtpHost,
        smtpPort,
        smtpSecure,
        toEmail,
        subject,
        bodyHtml,
        attachments = [],
      } = req.body;

      if (!senderEmail || !toEmail || !subject) {
        return res.status(400).json({ error: 'Missing required parameters (senderEmail, toEmail, subject).' });
      }

      const cleanPassword = (appPassword || '').replace(/\s+/g, '');

      if (!cleanPassword) {
        return res.status(400).json({
          error: 'Missing Gmail App Password. Please provide your 16-character Gmail App Password.',
        });
      }

      let transportConfig: any;
      if (smtpHost) {
        transportConfig = {
          host: smtpHost,
          port: Number(smtpPort) || 587,
          secure: smtpSecure === true || Number(smtpPort) === 465,
          auth: {
            user: senderEmail,
            pass: cleanPassword,
          },
        };
      } else {
        // Standard Gmail SMTP
        transportConfig = {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: senderEmail,
            pass: cleanPassword,
          },
        };
      }

      const transporter = nodemailer.createTransport(transportConfig);

      // Verify connection configuration
      await transporter.verify();

      // Convert attachments format from { filename, base64Data, mimeType }
      const mailAttachments = attachments.map((att: any) => ({
        filename: att.filename,
        content: Buffer.from(att.base64Data, 'base64'),
        contentType: att.mimeType,
      }));

      const info = await transporter.sendMail({
        from: senderEmail,
        to: toEmail,
        subject: subject,
        html: bodyHtml,
        attachments: mailAttachments,
      });

      return res.json({
        success: true,
        messageId: info.messageId,
        response: info.response,
      });
    } catch (err: any) {
      console.error('Nodemailer dispatch error:', err);
      let message = err?.message || 'Failed to deliver email.';
      if (
        message.includes('Invalid login') ||
        message.includes('BadCredentials') ||
        message.includes('535') ||
        message.includes('Username and Password not accepted')
      ) {
        message = 'Invalid Gmail App Password. Please check your 16-letter App Password at https://myaccount.google.com/apppasswords';
      }
      return res.status(500).json({ error: message });
    }
  });

  // Verify SMTP credentials endpoint
  app.post('/api/verify-smtp', async (req, res) => {
    try {
      const { senderEmail, appPassword, smtpHost, smtpPort, smtpSecure } = req.body;
      if (!senderEmail || !appPassword) {
        return res.status(400).json({ error: 'Email and App Password are required.' });
      }

      const cleanPassword = (appPassword || '').replace(/\s+/g, '');
      const transportConfig: any = smtpHost
        ? {
            host: smtpHost,
            port: Number(smtpPort) || 587,
            secure: smtpSecure === true || Number(smtpPort) === 465,
            auth: { user: senderEmail, pass: cleanPassword },
          }
        : {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: { user: senderEmail, pass: cleanPassword },
          };

      const transporter = nodemailer.createTransport(transportConfig);
      await transporter.verify();

      return res.json({ success: true, message: 'SMTP credentials verified and ready!' });
    } catch (err: any) {
      console.error('SMTP verify error:', err);
      let message = err?.message || 'SMTP credentials verification failed.';
      if (
        message.includes('Invalid login') ||
        message.includes('BadCredentials') ||
        message.includes('535') ||
        message.includes('Username and Password not accepted')
      ) {
        message = 'Invalid Gmail App Password. Generate a 16-character App Password at https://myaccount.google.com/apppasswords';
      }
      return res.status(400).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
