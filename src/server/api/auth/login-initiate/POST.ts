import type { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import { dbStore } from '../../../services/dbStore';
import { emailService } from '../../../services/emailService';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = dbStore.findUserByEmail(cleanEmail);

    if (password && user) {
      const isMatch = bcryptjs.compareSync(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
    }

    // Generate 6-digit numeric OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    dbStore.setOtp(cleanEmail, otp);

    // Send Mail OTP via SMTP Protocol
    const emailResult = await emailService.sendLoginOtpEmail(cleanEmail, otp, user?.name || cleanEmail.split('@')[0]);

    if (!emailResult.success && emailResult.error) {
      return res.status(500).json({
        success: false,
        message: `Email dispatch failed: ${emailResult.error}`,
        error: emailResult.error,
      });
    }

    console.log(`[AUTH] Login OTP dispatched to ${cleanEmail}. OTP: [${otp}]`);

    const userEmail = user?.email || cleanEmail;
    const maskedEmail = userEmail.replace(/^(.)(.*)(@.*)$/, (_, first, middle, domain) => {
      return first + '*'.repeat(Math.max(1, middle.length)) + domain;
    });

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${maskedEmail}`,
      email: userEmail,
      step: 'otp',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Login initiation failed';
    console.error('[AUTH ERROR] Login initiate exception:', error);
    return res.status(500).json({ success: false, message: msg });
  }
}
