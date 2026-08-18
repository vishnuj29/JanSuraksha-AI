import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const lat = parseFloat(req.query.lat as string) || 28.6139;
    const lng = parseFloat(req.query.lng as string) || 77.2090;

    const helpers = [
      {
        id: 'H1',
        name: 'Verified Responder #104',
        distance: '0.3 km',
        status: 'available',
        rating: 4.9,
        verified: true,
        responseTime: '~2 min',
        coords: { latitude: lat + 0.002, longitude: lng + 0.002 },
      },
      {
        id: 'H2',
        name: 'Verified Responder #218',
        distance: '0.5 km',
        status: 'available',
        rating: 4.7,
        verified: true,
        responseTime: '~3 min',
        coords: { latitude: lat - 0.003, longitude: lng + 0.004 },
      },
      {
        id: 'H3',
        name: 'Community Patrol #09',
        distance: '0.8 km',
        status: 'busy',
        rating: 4.8,
        verified: true,
        responseTime: '~5 min',
        coords: { latitude: lat + 0.005, longitude: lng - 0.003 },
      },
      {
        id: 'H4',
        name: 'Verified Responder #330',
        distance: '1.1 km',
        status: 'available',
        rating: 4.6,
        verified: true,
        responseTime: '~6 min',
        coords: { latitude: lat - 0.006, longitude: lng - 0.005 },
      },
    ];

    const emergencyServices = [
      {
        id: 's1',
        name: 'Nearest Police Station',
        distance: '0.6 km',
        phone: '100',
        type: 'police',
      },
      {
        id: 's2',
        name: 'Civil Hospital Emergency',
        distance: '1.2 km',
        phone: '102',
        type: 'medical',
      },
      {
        id: 's3',
        name: 'Fire & Rescue Station',
        distance: '0.9 km',
        phone: '101',
        type: 'fire',
      },
    ];

    return res.status(200).json({
      success: true,
      helpers,
      emergencyServices,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch community helpers';
    return res.status(500).json({ success: false, message: msg });
  }
}
