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

    const { name, phone, relation, isPrimary, notifyLevel, shareLocation } = req.body || {};

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }

    const newContact = dbStore.addContact({
      userId,
      name: name.trim(),
      phone: phone.trim(),
      relation: relation || 'Family',
      isPrimary: Boolean(isPrimary),
      notifyLevel: notifyLevel || 'always',
      shareLocation: shareLocation !== false,
      verified: true,
      avatar: name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'C',
    });

    console.log(`[CONTACTS] Added contact: ${newContact.name} (${newContact.phone})`);

    return res.status(201).json({
      success: true,
      message: 'Emergency contact added successfully',
      contact: newContact,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to add contact';
    return res.status(500).json({ success: false, message: msg });
  }
}
