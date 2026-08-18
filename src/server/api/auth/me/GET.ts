import type { Request, Response } from 'express';
import { dbStore } from '../../../services/dbStore';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized: missing token' });
    }

    const token = authHeader.substring(7);
    const decoded = dbStore.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const user = dbStore.findUserById(decoded.id) || dbStore.findUserByEmail(decoded.email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

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

    return res.status(200).json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch user';
    return res.status(500).json({ success: false, message: msg });
  }
}
