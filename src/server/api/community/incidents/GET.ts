import type { Request, Response } from 'express';
import { dbStore } from '../../../services/dbStore';

export default async function handler(req: Request, res: Response) {
  if (req.method === 'GET') {
    try {
      const incidents = dbStore.getIncidents();
      return res.status(200).json({ success: true, incidents });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch incidents';
      return res.status(500).json({ success: false, message: msg });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, category, location, coordinates, severity, description } = req.body || {};

      if (!title || !location) {
        return res.status(400).json({ success: false, message: 'Title and location are required' });
      }

      const newInc = dbStore.addIncident({
        title: title.trim(),
        category: category || 'Hazard',
        location: location.trim(),
        coordinates,
        time: 'Just now',
        severity: severity || 'medium',
        description: description || '',
        upvotes: 1,
      });

      console.log(`[COMMUNITY] Incident reported: ${newInc.title}`);

      return res.status(201).json({
        success: true,
        message: 'Community incident report posted successfully',
        incident: newInc,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to report incident';
      return res.status(500).json({ success: false, message: msg });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
