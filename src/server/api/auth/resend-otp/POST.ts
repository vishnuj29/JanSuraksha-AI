import type { Request, Response } from 'express';
import { dbStore } from '../../../services/dbStore';
import { emailService } from '../../../services/emailService';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = dbStore.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate fresh 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    dbStore.setOtp(user.email, otp);

    const emailResult = await emailService.sendLoginOtpEmail(user.email, otp, user.name);

    console.log(`[AUTH] Resent OTP code to ${user.email}: [${otp}]`);

    return res.status(200).json({
      success: true,
      message: 'A new 6-digit verification code has been dispatched to your email.',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to resend OTP';
    console.error('[AUTH ERROR] Resend OTP exception:', error);
    return res.status(500).json({ success: false, message: msg });
  }
}
