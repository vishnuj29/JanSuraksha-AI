import type { Request, Response } from 'express';
import { dbStore } from '../../../services/dbStore';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { alertId } = req.body || {};
    dbStore.resolveSosAlert(alertId);

    console.log(`[SOS] Emergency resolved: ${alertId || 'all active'}`);

    return res.status(200).json({
      success: true,
      message: 'Emergency status marked as resolved. User marked safe.',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to resolve emergency';
    return res.status(500).json({ success: false, message: msg });
  }
}
