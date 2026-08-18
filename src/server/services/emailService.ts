import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface EmailResult {
  success: boolean;
  messageId?: string;
  mock?: boolean;
  error?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: {
            user,
            pass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
        this.isConfigured = true;
        console.log(`[EmailService] SMTP Transporter configured for host: ${host}`);
      } catch (err) {
        console.error('[EmailService] Failed to initialize SMTP transporter:', err);
        this.isConfigured = false;
      }
    } else {
      console.log('[EmailService] SMTP credentials not fully configured in environment. Using dev logger fallback.');
      this.isConfigured = false;
    }
  }

  /**
   * Send 6-digit Login OTP Email via SMTP
   */
  public async sendLoginOtpEmail(toEmail: string, otp: string, userName?: string): Promise<EmailResult> {
    const fromAddress = process.env.SMTP_FROM || 'JanSuraksha AI Security <security@jansuraksha.ai>';
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

    if (this.transporter && this.isConfigured) {
      try {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject: `🔐 JanSuraksha AI — Login Verification Code: ${otp}`,
          text: `Your JanSuraksha AI login verification code is: ${otp}. It expires in 10 minutes. Do not share this code.`,
          html: htmlContent,
        });

        console.log(`[EmailService] Login OTP sent to ${toEmail}. Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err) {
        console.error(`[EmailService] Failed to send email via SMTP to ${toEmail}:`, err);
        // Fall back to console logger
      }
    }

    // Dev/Fallback logger
    console.log('\n================== 📧 SMTP DEV EMAIL DISPATCH 📧 ==================');
    console.log(`To: ${toEmail}`);
    console.log(`Subject: 🔐 JanSuraksha AI — Login Verification Code: ${otp}`);
    console.log(`Generated OTP Code: [ ${otp} ] (Valid for 10 minutes)`);
    console.log('===================================================================\n');

    return {
      success: true,
      mock: true,
      messageId: `DEV_EMAIL_${Date.now()}`,
    };
  }

  /**
   * Send 6-digit Registration Verification OTP Email via SMTP
   */
  public async sendRegistrationOtpEmail(toEmail: string, otp: string, userName?: string): Promise<EmailResult> {
    const fromAddress = process.env.SMTP_FROM || 'JanSuraksha AI Security <security@jansuraksha.ai>';
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

    if (this.transporter && this.isConfigured) {
      try {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject: `🔐 JanSuraksha AI — Verify Your Email: ${otp}`,
          text: `Your JanSuraksha AI registration verification code is: ${otp}. It expires in 10 minutes.`,
          html: htmlContent,
        });

        console.log(`[EmailService] Registration OTP sent to ${toEmail}. Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err) {
        console.error(`[EmailService] Failed to send registration email via SMTP to ${toEmail}:`, err);
      }
    }

    // Dev fallback
    console.log('\n================== 📧 REGISTRATION OTP DISPATCH 📧 ==================');
    console.log(`To: ${toEmail} (${name})`);
    console.log(`Subject: 🔐 JanSuraksha AI — Verify Your Email: ${otp}`);
    console.log(`Registration OTP: [ ${otp} ] (Valid for 10 minutes)`);
    console.log('====================================================================\n');

    return {
      success: true,
      mock: true,
      messageId: `DEV_REG_EMAIL_${Date.now()}`,
    };
  }

  /**
   * Send Welcome / Registration Confirmation Email
   */
  public async sendWelcomeEmail(toEmail: string, userName: string): Promise<EmailResult> {
    const fromAddress = process.env.SMTP_FROM || 'JanSuraksha AI <welcome@jansuraksha.ai>';

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

    if (this.transporter && this.isConfigured) {
      try {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject: '🛡️ Welcome to JanSuraksha AI — Your Account is Ready',
          text: `Welcome to JanSuraksha AI, ${userName}! Your account is active. Stay protected 24/7.`,
          html: htmlContent,
        });
        return { success: true, messageId: info.messageId };
      } catch (err) {
        console.error('[EmailService] Failed to send welcome email:', err);
      }
    }

    console.log(`[EmailService DEV] Welcome confirmation email dispatched for: ${toEmail} (${userName})`);
    return { success: true, mock: true, messageId: `DEV_WELCOME_${Date.now()}` };
  }

  /**
   * Send SOS Alert Notification Email
   */
  public async sendSOSEmergencyEmail(toEmail: string, alertData: {
    userName: string;
    phone: string;
    locationUrl?: string;
    address?: string;
    triggerWord?: string;
    timestamp?: string;
  }): Promise<EmailResult> {
    const fromAddress = process.env.SMTP_FROM || 'JanSuraksha AI Emergency <sos@jansuraksha.ai>';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: sans-serif; background-color: #450a0a; color: #ffffff; padding: 20px; }
        .container { max-width: 560px; margin: 0 auto; background: #7f1d1d; border: 2px solid #ef4444; border-radius: 16px; padding: 24px; }
        .title { font-size: 26px; font-weight: 900; color: #ffffff; text-align: center; }
        .alert-box { background: #991b1b; padding: 16px; border-radius: 12px; margin: 20px 0; }
        .btn { display: inline-block; background: #ffffff; color: #991b1b; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="title">🚨 EMERGENCY SOS ALERT</div>
        <div class="alert-box">
          <p><strong>User:</strong> ${alertData.userName}</p>
          <p><strong>Contact:</strong> ${alertData.phone}</p>
          <p><strong>Trigger:</strong> ${alertData.triggerWord || 'Manual SOS'}</p>
          <p><strong>Time:</strong> ${alertData.timestamp || new Date().toLocaleString()}</p>
          ${alertData.address ? `<p><strong>Location:</strong> ${alertData.address}</p>` : ''}
          ${alertData.locationUrl ? `<a href="${alertData.locationUrl}" class="btn" target="_blank">📍 View Live GPS Location</a>` : ''}
        </div>
      </div>
    </body>
    </html>
    `;

    if (this.transporter && this.isConfigured) {
      try {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject: `🚨 CRITICAL EMERGENCY ALERT from ${alertData.userName}`,
          html: htmlContent,
        });
        return { success: true, messageId: info.messageId };
      } catch (err) {
        console.error('[EmailService] Failed to send SOS alert email:', err);
      }
    }

    console.log(`[EmailService DEV] SOS Emergency notification email dispatched to: ${toEmail}`);
    return { success: true, mock: true, messageId: `DEV_SOS_${Date.now()}` };
  }
}

export const emailService = new EmailService();
export default emailService;
