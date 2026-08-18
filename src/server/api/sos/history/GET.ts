import type { Request, Response } from 'express';
import { dbStore } from '../../../services/dbStore';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const alerts = dbStore.getSosAlerts();
    return res.status(200).json({
      success: true,
      alerts,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch alert history';
    return res.status(500).json({ success: false, message: msg });
  }
}
