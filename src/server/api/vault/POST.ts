import type { Request, Response } from 'express';
import { dbStore } from '../../services/dbStore';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    let userId = 'u-demo-1';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = dbStore.verifyToken(authHeader.substring(7));
      if (decoded) userId = decoded.id;
    }

    const { type, title, size, duration, emergency, encrypted, dataUrl } = req.body || {};

    if (!type) {
      return res.status(400).json({ success: false, message: 'Media type is required (photo, video, audio)' });
    }

    const dateStr = new Date().toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newItem = dbStore.addVaultItem({
      userId,
      type: type || 'photo',
      title: title || `Evidence Capture (${type})`,
      date: dateStr,
      size: size || '1.5 MB',
      duration,
      emergency: emergency !== false,
      encrypted: encrypted !== false,
      dataUrl,
    });

    console.log(`[VAULT] Saved evidence item: ${newItem.id} (${newItem.type})`);

    return res.status(201).json({
      success: true,
      message: 'Evidence securely stored in encrypted vault',
      item: newItem,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to save vault item';
    return res.status(500).json({ success: false, message: msg });
  }
}
