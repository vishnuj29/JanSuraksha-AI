import type { Request, Response } from 'express';
import { dbStore } from '../../services/dbStore';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const id = (req.body && req.body.id) || (req.query && (req.query.id as string));

    if (!id) {
      return res.status(400).json({ success: false, message: 'Item ID is required' });
    }

    const deleted = dbStore.deleteVaultItem(id);

    return res.status(200).json({
      success: deleted,
      message: deleted ? 'Vault item removed' : 'Item not found',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to delete vault item';
    return res.status(500).json({ success: false, message: msg });
  }
}
