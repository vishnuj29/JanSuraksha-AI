import type { Request, Response } from 'express';
import { dbStore } from '../../../services/dbStore';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { latitude, longitude, address, city, speed, accuracy } = req.body || {};

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Coordinates are required' });
    }

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = dbStore.verifyToken(authHeader.substring(7));
      if (decoded && address) {
        dbStore.updateUser(decoded.id, { location: address });
      }
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      received: { latitude, longitude, city, accuracy },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update location';
    return res.status(500).json({ success: false, message: msg });
  }
}
