import type { Request, Response } from 'express';
import { dbStore } from '../../../services/dbStore';
import { emailService } from '../../../services/emailService';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { name, email, password, phone } = req.body || {};

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please enter a valid full name (minimum 2 characters)' });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
      return res.status(400).json({ success: false, message: 'Please enter a valid phone number' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existing = dbStore.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ success: false, message: 'This email address is already registered. Please sign in.' });
    }

    // Save pending registration & generate 6-digit OTP
    const otp = dbStore.setPendingRegistration({
      name: name.trim(),
      email: cleanEmail,
      password,
      phone: phone.trim(),
    });

    // Send 6-digit OTP via SMTP
    await emailService.sendRegistrationOtpEmail(cleanEmail, otp, name.trim());

    console.log(`[AUTH] Registration OTP generated and dispatched via SMTP for ${cleanEmail}`);

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification security code has been sent to ${cleanEmail}`,
      email: cleanEmail,
      step: 'otp',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to initiate registration';
    console.error('[AUTH ERROR] Register initiate exception:', error);
    return res.status(400).json({ success: false, message: msg });
  }
}
