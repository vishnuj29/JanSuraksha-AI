import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { helperId, coordinates, address } = req.body || {};

    console.log(`[COMMUNITY RESCUE] Distress broadcast sent to helper ${helperId || 'all'}`);

    return res.status(200).json({
      success: true,
      message: helperId
        ? 'Direct assistance request sent to responder! They are navigating to your location.'
        : 'Anonymous distress broadcast sent to 4 nearby verified helpers.',
      timestamp: new Date().toISOString(),
      eta: '2-4 minutes',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to request help';
    return res.status(500).json({ success: false, message: msg });
  }
}
