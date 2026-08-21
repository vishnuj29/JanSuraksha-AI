import type { Request, Response } from 'express';
import { dbStore } from '../../../services/dbStore';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email, otp } = req.body || {};

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const cleanOtp = String(otp).trim();
    if (cleanOtp.length !== 6) {
      return res.status(400).json({ success: false, message: 'Please enter the 6-digit OTP code' });
    }

    const user = dbStore.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isValid = dbStore.verifyOtp(email, cleanOtp);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code. Please try again.' });
    }

    const isAdmin = user.email.toLowerCase() === 'ec23019@glbitm.ac.in' || user.email.toLowerCase() === 'admin@jansuraksha.ai';
    if (isAdmin && user.role !== 'admin') {
      user.role = 'admin';
    }

    // Generate JWT token
    const token = dbStore.generateToken(user);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: isAdmin ? 'admin' : user.role,
      plan: isAdmin ? 'Premium' : user.plan,
      safetyScore: user.safetyScore,
      avatar: user.avatar,
      location: user.location,
      joinedDate: user.joinedDate,
    };

    console.log(`[AUTH] User verified OTP and logged in: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Login successful! Welcome back.',
      token,
      user: safeUser,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'OTP verification failed';
    console.error('[AUTH ERROR] OTP verify exception:', error);
    return res.status(400).json({ success: false, message: msg });
  }
}
