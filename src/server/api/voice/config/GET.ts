import type { Request, Response } from 'express';
import { dbStore } from '../../../services/dbStore';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    let userId = 'u-demo-1';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = dbStore.verifyToken(authHeader.substring(7));
      if (decoded) userId = decoded.id;
    }

    const config = dbStore.getVoiceConfig(userId);

    return res.status(200).json({
      success: true,
      config,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch voice config';
    return res.status(500).json({ success: false, message: msg });
  }
}
