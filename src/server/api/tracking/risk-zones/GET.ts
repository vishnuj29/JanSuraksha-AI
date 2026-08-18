import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const lat = parseFloat(req.query.lat as string) || 28.6139;
    const lng = parseFloat(req.query.lng as string) || 77.2090;
    const city = (req.query.city as string) || 'Local Area';

    // Generate dynamic risk zones around the user's actual location
    const zones = [
      {
        id: 'z1',
        name: `${city} North Sector`,
        level: 'high',
        distance: '0.8 km away',
        latitude: lat + 0.0075,
        longitude: lng + 0.0062,
        tip: 'Elevated incidents after 9:00 PM — low street illumination. Avoid sub-lanes.',
        badge: 'bg-red-500/10 border-red-500/20 text-red-400',
      },
      {
        id: 'z2',
        name: `${city} Commercial Corridor`,
        level: 'medium',
        distance: '1.2 km away',
        latitude: lat - 0.0055,
        longitude: lng - 0.0070,
        tip: 'Moderate crowd congestion — stay alert in transit junctions.',
        badge: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
      },
      {
        id: 'z3',
        name: `${city} Industrial Road`,
        level: 'medium',
        distance: '1.7 km away',
        latitude: lat + 0.0090,
        longitude: lng - 0.0085,
        tip: 'Sparse pedestrian activity during late evening hours.',
        badge: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
      },
    ];

    const safeRoutes = [
      {
        id: 'r1',
        name: 'Main Well-Lit Boulevard',
        safetyScore: '94/100',
        safetyLevel: 'HIGH_SAFETY',
        details: 'CCTV monitored, active street illumination, 2 police patrol booths',
      },
      {
        id: 'r2',
        name: 'Metro Transit Corridor',
        safetyScore: '88/100',
        safetyLevel: 'HIGH_SAFETY',
        details: 'Continuous footfall, well illuminated, emergency kiosks every 300m',
      },
    ];

    return res.status(200).json({
      success: true,
      city,
      center: { latitude: lat, longitude: lng },
      riskZones: zones,
      safeRoutes,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch risk zones';
    return res.status(500).json({ success: false, message: msg });
  }
}
