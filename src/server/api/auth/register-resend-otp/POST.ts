import type { Request, Response } from 'express';
import { dbStore } from '../../../services/dbStore';
import { emailService } from '../../../services/emailService';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Resend registration OTP
    const { otp, name } = dbStore.resendRegistrationOtp(cleanEmail);

    await emailService.sendRegistrationOtpEmail(cleanEmail, otp, name);

    console.log(`[AUTH] Resent registration OTP to ${cleanEmail}`);

    return res.status(200).json({
      success: true,
      message: `A new 6-digit verification code has been dispatched to ${cleanEmail}`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to resend verification code';
    return res.status(400).json({ success: false, message: msg });
  }
}
