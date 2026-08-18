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
      return res.status(400).json({ success: false, message: 'Please enter a valid full name' });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ success: false, message: 'Please enter a valid phone number' });
    }

    const existingUser = dbStore.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'This email is already registered. Please sign in.' });
    }

    // Direct Account Creation (No OTP blocker during registration!)
    const newUser = dbStore.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone.trim(),
    });

    // Send Welcome Confirmation Email via SMTP protocol asynchronously
    emailService.sendWelcomeEmail(newUser.email, newUser.name).catch((err) => {
      console.error('[Auth Register] Welcome email notice:', err);
    });

    // Generate JWT token for seamless auto-login
    const token = dbStore.generateToken(newUser);

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

    console.log(`[AUTH] User registered successfully: ${newUser.email} (ID: ${newUser.id})`);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to JanSuraksha AI.',
      token,
      user: safeUser,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Registration failed';
    console.error('[AUTH ERROR] Register exception:', error);
    return res.status(500).json({ success: false, message: msg });
  }
}
