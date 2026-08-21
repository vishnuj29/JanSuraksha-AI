import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Ensure .env is loaded in development & serverless environments
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface EmailResult {
  success: boolean;
  messageId?: string;
  mock?: boolean;
  error?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  /**
   * Dynamically get or create SMTP Transporter using latest environment variables
   */
  private getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) {
      return this.transporter;
    }

    // Refresh env if needed
    if (!process.env.SMTP_USER) {
      dotenv.config({ path: path.resolve(process.cwd(), '.env') });
    }

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const rawPort = process.env.SMTP_PORT;
    const user = (process.env.SMTP_USER || 'ec23019@glbitm.ac.in').trim();
    const pass = (process.env.SMTP_PASS || 'qvlsjfrhfvovnruv').trim().replace(/\s+/g, '');
    const isGmail = host.includes('gmail.com') || user.includes('gmail.com') || user.includes('glbitm.ac.in');

    if (user && pass) {
      try {
        if (isGmail) {
          // Direct SSL Port 465 is the most reliable for Gmail in Serverless Lambdas
          this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
              user,
              pass,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
          });
        } else {
          const port = parseInt(rawPort || '587', 10);
          this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: {
              user,
              pass,
            },
            tls: {
              rejectUnauthorized: false,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
          });
        }
        console.log(`[EmailService] 📧 SMTP Transporter created successfully for: ${user}`);
        return this.transporter;
      } catch (err) {
        console.error('[EmailService] Failed to create SMTP transporter:', err);
        return null;
      }
    }

    console.warn('[EmailService] SMTP credentials not set. Falling back to dev logger.');
    return null;
  }

  private getFromAddress(): string {
    const user = (process.env.SMTP_USER || 'ec23019@glbitm.ac.in').trim();
    return `"JanSuraksha AI Security" <${user}>`;
  }

  /**
   * Send 6-digit Login OTP Email via SMTP
   */
  public async sendLoginOtpEmail(toEmail: string, otp: string, userName?: string): Promise<EmailResult> {
    const fromAddress = this.getFromAddress();
    const name = userName || 'JanSuraksha User';
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0f; color: #ffffff; margin: 0; padding: 20px; }
        .container { max-width: 560px; margin: 0 auto; background: #0d1b3e; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #b91c1c, #991b1b); padding: 28px 24px; text-align: center; }
        .logo-text { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .logo-sub { font-size: 11px; font-weight: 600; color: #fca5a5; letter-spacing: 2px; text-transform: uppercase; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #f8fafc; }
        .description { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
        .otp-card { background: rgba(0,0,0,0.3); border: 2px dashed #ef4444; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }
        .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #ffffff; font-family: monospace; }
        .otp-validity { font-size: 12px; color: #f87171; margin-top: 6px; font-weight: 600; }
        .warning-box { background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; font-size: 12px; color: #cbd5e1; margin-bottom: 24px; }
        .footer { background: #080d1a; padding: 20px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.06); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-text">JanSuraksha AI</div>
          <div class="logo-sub">Smart Safety & Security Network</div>
        </div>
        <div class="content">
          <div class="greeting">Hello ${name},</div>
          <div class="description">
            We received a request to access your JanSuraksha AI account. Use the one-time verification code below to complete your secure sign-in.
          </div>
          <div class="otp-card">
            <div class="otp-code">${otp}</div>
            <div class="otp-validity">⏱ Valid for 10 minutes only</div>
          </div>
          <div class="warning-box">
            <strong>Security Notice:</strong> Never share this code with anyone. JanSuraksha AI officials will never ask for your verification code. Request generated at: <em>${timestamp} (IST)</em>.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} JanSuraksha AI Systems. Automated security notification.
        </div>
      </div>
    </body>
    </html>
    `;

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          replyTo: 'ec23019@glbitm.ac.in',
          priority: 'high',
          headers: {
            'X-Priority': '1',
            'X-MSMail-Priority': 'High',
            'Importance': 'High',
          },
          subject: `🔐 JanSuraksha AI — Login Verification Code: ${otp}`,
          text: `Your JanSuraksha AI login verification code is: ${otp}. It expires in 10 minutes. Do not share this code.`,
          html: htmlContent,
        });

        console.log(`[EmailService] ✅ Login OTP sent successfully to ${toEmail}. Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err: any) {
        console.error(`[EmailService] ❌ Failed to send email via SMTP to ${toEmail}:`, err);
        return {
          success: false,
          error: err?.message || 'SMTP Authentication error. Please verify your Gmail App Password.',
        };
      }
    }

    // Fallback logger when credentials missing
    console.log('\n================== 📧 SMTP DEV EMAIL DISPATCH 📧 ==================');
    console.log(`To: ${toEmail}`);
    console.log(`Subject: 🔐 JanSuraksha AI — Login Verification Code: ${otp}`);
    console.log(`Generated OTP Code: [ ${otp} ] (Valid for 10 minutes)`);
    console.log('===================================================================\n');

    return {
      success: false,
      mock: true,
      error: 'SMTP credentials (SMTP_USER / SMTP_PASS) not configured in Vercel environment.',
      messageId: `DEV_EMAIL_${Date.now()}`,
    };
  }

  /**
   * Send 6-digit Registration Verification OTP Email via SMTP
   */
  public async sendRegistrationOtpEmail(toEmail: string, otp: string, userName?: string): Promise<EmailResult> {
    const fromAddress = this.getFromAddress();
    const name = userName || 'JanSuraksha User';
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0f; color: #ffffff; margin: 0; padding: 20px; }
        .container { max-width: 560px; margin: 0 auto; background: #0d1b3e; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #1e3a8a, #0d1b3e); padding: 28px 24px; text-align: center; }
        .logo-text { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .logo-sub { font-size: 13px; color: #93c5fd; margin-top: 4px; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
        .description { font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px; }
        .otp-card { background: rgba(30, 58, 138, 0.4); border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #60a5fa; font-family: 'Courier New', monospace; }
        .otp-validity { font-size: 12px; color: #93c5fd; margin-top: 8px; }
        .warning-box { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #fca5a5; margin: 20px 0; }
        .footer { background: #080d1a; padding: 20px 24px; text-align: center; font-size: 11px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-text">JanSuraksha AI</div>
          <div class="logo-sub">Account Registration Verification</div>
        </div>
        <div class="content">
          <div class="greeting">Welcome, ${name}!</div>
          <div class="description">
            Thank you for registering with JanSuraksha AI. To complete your account creation and activate your 24/7 AI safety network, please enter the one-time verification code below:
          </div>
          <div class="otp-card">
            <div class="otp-code">${otp}</div>
            <div class="otp-validity">⏱ Valid for 10 minutes</div>
          </div>
          <div class="warning-box">
            <strong>Security Notice:</strong> Please enter this code on the registration page to finalize your account. Request generated at: <em>${timestamp} (IST)</em>.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} JanSuraksha AI Systems. Automated registration notification.
        </div>
      </div>
    </body>
    </html>
    `;

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          replyTo: 'ec23019@glbitm.ac.in',
          priority: 'high',
          headers: {
            'X-Priority': '1',
            'X-MSMail-Priority': 'High',
            'Importance': 'High',
          },
          subject: `🔐 JanSuraksha AI — Verify Your Email: ${otp}`,
          text: `Your JanSuraksha AI registration verification code is: ${otp}. It expires in 10 minutes.`,
          html: htmlContent,
        });

        console.log(`[EmailService] ✅ Registration OTP sent to ${toEmail}. Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err: any) {
        console.error(`[EmailService] ❌ Failed to send registration email via SMTP to ${toEmail}:`, err);
        return {
          success: false,
          error: err?.message || 'SMTP Authentication error. Please verify your Gmail App Password.',
        };
      }
    }

    // Dev fallback
    console.log('\n================== 📧 REGISTRATION OTP DISPATCH 📧 ==================');
    console.log(`To: ${toEmail} (${name})`);
    console.log(`Subject: 🔐 JanSuraksha AI — Verify Your Email: ${otp}`);
    console.log(`Registration OTP: [ ${otp} ] (Valid for 10 minutes)`);
    console.log('====================================================================\n');

    return {
      success: false,
      mock: true,
      error: 'SMTP credentials (SMTP_USER / SMTP_PASS) not configured in Vercel environment.',
      messageId: `DEV_REG_EMAIL_${Date.now()}`,
    };
  }

  /**
   * Send Welcome / Registration Confirmation Email
   */
  public async sendWelcomeEmail(toEmail: string, userName: string): Promise<EmailResult> {
    const fromAddress = this.getFromAddress();

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #ffffff; margin: 0; padding: 20px; }
        .container { max-width: 560px; margin: 0 auto; background: #0d1b3e; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #1e3a8a, #0d1b3e); padding: 32px 24px; text-align: center; }
        .title { font-size: 26px; font-weight: 900; color: #ffffff; margin-bottom: 6px; }
        .subtitle { font-size: 13px; color: #93c5fd; }
        .content { padding: 32px 24px; }
        .highlight { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 14px; color: #86efac; }
        .feature-list { list-style: none; padding: 0; margin: 20px 0; }
        .feature-item { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13px; color: #cbd5e1; display: flex; align-items: center; }
        .footer { background: #080d1a; padding: 20px 24px; text-align: center; font-size: 11px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">Welcome to JanSuraksha AI</div>
          <div class="subtitle">Your 24/7 AI-Powered Personal Safety Shield</div>
        </div>
        <div class="content">
          <p style="font-size: 16px; font-weight: 600;">Welcome aboard, ${userName}!</p>
          <div class="highlight">
            ✓ Your JanSuraksha AI account has been successfully created and secured.
          </div>
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
            You now have access to intelligent real-time protection tools:
          </p>
          <ul class="feature-list">
            <li class="feature-item">🚨 <strong>Instant SOS Emergency</strong> — One-tap alert with live GPS coordinates</li>
            <li class="feature-item">🎙️ <strong>Voice Trigger Activation</strong> — Hands-free secret distress detection</li>
            <li class="feature-item">📍 <strong>Live Threat Tracking</strong> — Dynamic risk zone and safe route analysis</li>
            <li class="feature-item">🔒 <strong>Encrypted Evidence Vault</strong> — Secure cloud capture of audio & video</li>
            <li class="feature-item">👥 <strong>Community Rescue Network</strong> — Verified nearby responder broadcast</li>
          </ul>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} JanSuraksha AI Systems. Stay Safe, Stay Protected.
        </div>
      </div>
    </body>
    </html>
    `;

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject: '🛡️ Welcome to JanSuraksha AI — Your Account is Ready',
          text: `Welcome to JanSuraksha AI, ${userName}! Your account is active. Stay protected 24/7.`,
          html: htmlContent,
        });
        console.log(`[EmailService] ✅ Welcome email sent to ${toEmail}. Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err) {
        console.error('[EmailService] ❌ Failed to send welcome email:', err);
      }
    }

    console.log(`[EmailService DEV] Welcome confirmation email dispatched for: ${toEmail} (${userName})`);
    return { success: true, mock: true, messageId: `DEV_WELCOME_${Date.now()}` };
  }

  /**
   * Send SOS Alert Notification Email (supports single recipient or list of recipients)
   */
  public async sendSOSEmergencyEmail(
    toEmail: string | string[],
    alertData: {
      userName: string;
      phone: string;
      locationUrl?: string;
      address?: string;
      triggerWord?: string;
      timestamp?: string;
    }
  ): Promise<EmailResult> {
    const fromAddress = this.getFromAddress();
    const recipients = Array.isArray(toEmail) ? toEmail : [toEmail];
    const validRecipients = recipients.filter((e) => e && typeof e === 'string' && e.includes('@'));

    if (validRecipients.length === 0) {
      console.warn('[EmailService] No valid recipient email addresses for SOS alert.');
      return { success: false, error: 'No valid email recipients' };
    }

    const mapUrl = alertData.locationUrl || 'https://www.google.com/maps?q=28.6139,77.2090';
    const addressDisplay = alertData.address || 'Real-time GPS Tracking Active';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #1a0505; color: #ffffff; padding: 16px; margin: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #2a0808; border: 2px solid #ef4444; border-radius: 16px; padding: 28px; box-shadow: 0 12px 40px rgba(239, 68, 68, 0.35); }
        .badge { display: inline-block; background: #dc2626; color: #ffffff; font-weight: 800; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; padding: 6px 14px; border-radius: 20px; margin-bottom: 12px; }
        .title { font-size: 26px; font-weight: 900; color: #ffffff; margin: 0 0 6px 0; letter-spacing: -0.5px; }
        .subtitle { font-size: 14px; color: #fca5a5; margin: 0 0 24px 0; }
        .alert-box { background: rgba(220, 38, 38, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); padding: 20px; border-radius: 12px; margin: 20px 0; }
        .alert-row { font-size: 15px; margin: 10px 0; color: #fee2e2; line-height: 1.5; }
        .alert-row strong { color: #ffffff; }
        .map-card { background: #180303; border: 2px solid #f87171; border-radius: 14px; padding: 22px; margin: 24px 0; text-align: center; }
        .map-title { font-size: 17px; font-weight: 800; color: #ffffff; margin-bottom: 8px; }
        .map-addr { font-size: 14px; color: #fecaca; margin-bottom: 18px; line-height: 1.4; word-break: break-word; }
        .btn-map { display: inline-block; background: #ef4444; color: #ffffff !important; font-weight: 800; padding: 15px 32px; border-radius: 12px; text-decoration: none; font-size: 16px; box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5); }
        .raw-link { font-size: 12px; color: #93c5fd; margin-top: 14px; word-break: break-all; }
        .footer { font-size: 11px; color: #9ca3af; text-align: center; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div style="text-align: center;">
          <div class="badge">⚠️ DISTRESS SIGNAL DETECTED</div>
          <div class="title">🚨 CRITICAL EMERGENCY SOS</div>
          <div class="subtitle">JanSuraksha AI 24/7 Rapid Response Dispatch</div>
        </div>

        <div class="alert-box">
          <div class="alert-row"><strong>👤 User:</strong> ${alertData.userName}</div>
          <div class="alert-row"><strong>📞 Contact Phone:</strong> <a href="tel:${alertData.phone}" style="color: #60a5fa; font-weight: bold; text-decoration: none;">${alertData.phone}</a></div>
          <div class="alert-row"><strong>🎙️ Distress Trigger:</strong> <span style="background: #991b1b; padding: 3px 8px; border-radius: 6px; font-weight: bold;">${alertData.triggerWord || 'Voice / Manual SOS'}</span></div>
          <div class="alert-row"><strong>⏱️ Time:</strong> ${alertData.timestamp || new Date().toLocaleString('en-IN')} (IST)</div>
        </div>

        <div class="map-card">
          <div class="map-title">📍 LIVE GPS LOCATION & TRACKING</div>
          <div class="map-addr"><strong>Location Area:</strong> ${addressDisplay}</div>
          <a href="${mapUrl}" class="btn-map" target="_blank">📍 Open Live Location in Google Maps</a>
          <div class="raw-link">
            <strong>Direct Tracking URL:</strong><br/>
            <a href="${mapUrl}" style="color: #60a5fa;" target="_blank">${mapUrl}</a>
          </div>
        </div>

        <div class="footer">
          JanSuraksha AI Automated Emergency Response System. Please contact or dispatch assistance to this person immediately.
        </div>
      </div>
    </body>
    </html>
    `;

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to: validRecipients.join(', '),
          subject: `🚨 CRITICAL EMERGENCY ALERT: ${alertData.userName} needs help (${alertData.triggerWord || 'SOS'})`,
          text: `🚨 CRITICAL EMERGENCY ALERT from ${alertData.userName} (${alertData.phone})!\nTrigger: ${alertData.triggerWord || 'Emergency'}\nTime: ${alertData.timestamp || new Date().toLocaleString()}\nLocation: ${addressDisplay}\nLive Google Maps Tracking URL: ${mapUrl}\n\nPlease check on this person immediately!`,
          html: htmlContent,
        });
        console.log(`[EmailService] ✅ Emergency SOS email successfully delivered to [${validRecipients.join(', ')}]. Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err) {
        console.error(`[EmailService] ❌ Failed to send SOS alert email to [${validRecipients.join(', ')}]:`, err);
        return { success: false, error: err instanceof Error ? err.message : 'SMTP dispatch failure' };
      }
    }

    console.log(`[EmailService DEV] SOS Emergency notification email simulated for: ${validRecipients.join(', ')}`);
    return { success: true, mock: true, messageId: `DEV_SOS_${Date.now()}` };
  }
}

export const emailService = new EmailService();
export default emailService;
