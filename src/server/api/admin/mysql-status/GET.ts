import type { Request, Response } from 'express';
import { mysqlService } from '../../../services/mysqlService';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const status = await mysqlService.getStatus();
    return res.status(200).json({
      success: true,
      status,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to query MySQL status';
    return res.status(500).json({ success: false, message: msg });
  }
}
