import type { Request, Response } from 'express';
import { dbStore } from '../../../services/dbStore';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'PUT' && req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    let userId = 'u-demo-1';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = dbStore.verifyToken(authHeader.substring(7));
      if (decoded) userId = decoded.id;
    }

    const { triggerWord, sensitivity, autoSos, continuousListening } = req.body || {};

    if (!triggerWord || typeof triggerWord !== 'string') {
      return res.status(400).json({ success: false, message: 'Trigger word is required' });
    }

    const updated = dbStore.setVoiceConfig({
      userId,
      triggerWord: triggerWord.trim().toUpperCase(),
      sensitivity: sensitivity || 'medium',
      autoSos: autoSos !== false,
      continuousListening: continuousListening !== false,
    });

    console.log(`[VOICE] Updated trigger word for ${userId}: ${updated.triggerWord}`);

    return res.status(200).json({
      success: true,
      message: `Voice trigger set to "${updated.triggerWord}"`,
      config: updated,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update voice config';
    return res.status(500).json({ success: false, message: msg });
  }
}
