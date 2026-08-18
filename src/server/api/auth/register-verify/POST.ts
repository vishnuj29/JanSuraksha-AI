import type { Request, Response } from 'express';
import { dbStore } from '../../../services/dbStore';
import { emailService } from '../../../services/emailService';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email, otp } = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
      return res.status(400).json({ success: false, message: 'Please enter the full 6-digit verification code' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify OTP and create user in database
    const newUser = dbStore.verifyPendingRegistration(cleanEmail, otp.trim());

    // Generate JWT token
    const token = dbStore.generateToken(newUser);

    // Send Welcome Email asynchronously
    emailService.sendWelcomeEmail(newUser.email, newUser.name).catch((err) => {
      console.error('[Auth Register] Welcome email dispatch warning:', err);
    });

    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      plan: newUser.plan,
      safetyScore: newUser.safetyScore,
      avatar: newUser.avatar,
      location: newUser.location,
      joinedDate: newUser.joinedDate,
    };

    console.log(`[AUTH] Registration OTP verified. Account activated: ${newUser.email} (ID: ${newUser.id})`);

    return res.status(201).json({
      success: true,
      message: 'Account verified and registered successfully! Welcome to JanSuraksha AI.',
      token,
      user: safeUser,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Registration verification failed';
    console.error('[AUTH ERROR] Register verify exception:', error);
    return res.status(400).json({ success: false, message: msg });
  }
}
