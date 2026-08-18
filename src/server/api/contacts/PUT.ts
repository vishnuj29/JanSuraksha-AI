import type { Request, Response } from 'express';
import { dbStore } from '../../services/dbStore';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id, name, phone, relation, isPrimary, notifyLevel, shareLocation } = req.body || {};
    const contactId = id || (req.query.id as string);

    if (!contactId) {
      return res.status(400).json({ success: false, message: 'Contact ID is required' });
    }

    const updated = dbStore.updateContact(contactId, {
      ...(name && { name: name.trim() }),
      ...(phone && { phone: phone.trim() }),
      ...(relation && { relation }),
      ...(isPrimary !== undefined && { isPrimary: Boolean(isPrimary) }),
      ...(notifyLevel && { notifyLevel }),
      ...(shareLocation !== undefined && { shareLocation: Boolean(shareLocation) }),
    });

    return res.status(200).json({
      success: true,
      message: 'Contact updated successfully',
      contact: updated,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update contact';
    return res.status(500).json({ success: false, message: msg });
  }
}
