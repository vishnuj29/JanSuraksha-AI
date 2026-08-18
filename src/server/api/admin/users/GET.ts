import type { Request, Response } from 'express';
import { dbStore } from '../../../services/dbStore';

export default async function handler(req: Request, res: Response) {
  if (req.method === 'GET') {
    try {
      const users = dbStore.getAllUsers().map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        plan: u.plan,
        status: 'Active',
        joined: u.joinedDate,
        lastSeen: 'Active now',
        sosCount: 1,
        location: u.location || 'India',
      }));

      return res.status(200).json({
        success: true,
        users,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch users';
      return res.status(500).json({ success: false, message: msg });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
