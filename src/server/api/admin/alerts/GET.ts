import type { Request, Response } from 'express';
import { dbStore } from '../../../services/dbStore';

export default async function handler(req: Request, res: Response) {
  if (req.method === 'GET') {
    try {
      const alerts = dbStore.getSosAlerts();
      return res.status(200).json({ success: true, alerts });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch alerts';
      return res.status(500).json({ success: false, message: msg });
    }
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    try {
      const { id, status } = req.body || {};
      if (id) {
        dbStore.resolveSosAlert(id);
      }
      return res.status(200).json({ success: true, message: 'Alert status updated' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update alert';
      return res.status(500).json({ success: false, message: msg });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
