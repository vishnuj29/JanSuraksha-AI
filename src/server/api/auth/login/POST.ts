import type { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import { dbStore } from '../../../services/dbStore';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = dbStore.findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = bcryptjs.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate JWT Auth token directly
    const token = dbStore.generateToken(user);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      plan: user.plan,
      safetyScore: user.safetyScore,
      avatar: user.avatar,
      location: user.location,
      joinedDate: user.joinedDate,
    };

    console.log(`[AUTH] Direct login successful for ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Login successful! Welcome back to JanSuraksha AI.',
      token,
      user: safeUser,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Login failed';
    console.error('[AUTH ERROR] Direct login exception:', error);
    return res.status(500).json({ success: false, message: msg });
  }
}
