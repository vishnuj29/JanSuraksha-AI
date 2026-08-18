import type { Request, Response } from 'express';
import { dbStore } from '../../services/dbStore';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const contactId = (req.body && req.body.id) || (req.query && (req.query.id as string));

    if (!contactId) {
      return res.status(400).json({ success: false, message: 'Contact ID is required' });
    }

    const deleted = dbStore.deleteContact(contactId);

    return res.status(200).json({
      success: deleted,
      message: deleted ? 'Contact removed' : 'Contact not found',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to delete contact';
    return res.status(500).json({ success: false, message: msg });
  }
}
