import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Shield, AlertTriangle, Users, MapPin, ZoomIn, ZoomOut, Layers, RefreshCw } from 'lucide-react';

export interface ThreatZoneMarker {
  id: string;
  name: string;
  level: 'High' | 'Moderate' | 'Low' | 'Caution';
  coordinates: [number, number]; // [lat, lng]
  radius?: number; // in meters
  description?: string;
}

export interface ResponderMarker {
  id: string;
  name: string;
  type: 'Police' | 'Medic' | 'Volunteer' | 'Security';
  coordinates: [number, number]; // [lat, lng]
  eta?: string;
  distance?: string;
}

interface InteractiveMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  riskZones?: ThreatZoneMarker[];
  responders?: ResponderMarker[];
  height?: string;
  showControls?: boolean;
  className?: string;
  zoom?: number;
  onRefreshLocation?: () => void;
}

export default function InteractiveMap({
  latitude,
  longitude,
  accuracy = 25,
  address,
  riskZones = [],
  responders = [],
  height = '480px',
  showControls = true,
  className = '',
  zoom = 15,
  onRefreshLocation,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const respondersLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapStyle, setMapStyle] = useState<'voyager' | 'dark' | 'standard'>('dark');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
      });

      L.control
        .attribution({ position: 'bottomright', prefix: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' })
        .addTo(map);

      // Layer groups for zones and responders
      zonesLayerRef.current = L.layerGroup().addTo(map);
      respondersLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;

      // Invalidate size after layout renders
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Tile layer updater
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    if (mapStyle === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    } else if (mapStyle === 'standard') {
      tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    }

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);
  }, [mapStyle]);

  // Update User Marker & Accuracy Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.invalidateSize();

    const userLatLng: [number, number] = [latitude, longitude];

    // Pulsing user icon
    const userCustomIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background-color: rgba(37, 99, 235, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background-color: #2563eb; border: 3px solid #ffffff; box-shadow: 0 0 14px rgba(37, 99, 235, 0.9);"></div>
          <div style="position: absolute; width: 6px; height: 6px; border-radius: 50%; background-color: #ffffff;"></div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(userLatLng, { icon: userCustomIcon }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng(userLatLng);
      userMarkerRef.current.setIcon(userCustomIcon);
    }

    // Popup content
    const popupContent = `
      <div style="font-family: sans-serif; padding: 4px 2px; color: #0f172a; min-width: 170px;">
        <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px; color: #2563eb; margin-bottom: 4px;">
          <span>📍 Live GPS Position</span>
        </div>
        <div style="font-size: 11px; color: #334155; font-weight: 600; line-height: 1.4;">
          ${address || `${latitude.toFixed(5)}°, ${longitude.toFixed(5)}°`}
        </div>
        <div style="font-size: 10px; color: #15803d; font-weight: 700; margin-top: 4px;">
          GPS Precision: ±${Math.round(accuracy)}m
        </div>
      </div>
    `;
    userMarkerRef.current.bindPopup(popupContent);

    // Accuracy Circle
    if (!accuracyCircleRef.current) {
      accuracyCircleRef.current = L.circle(userLatLng, {
        radius: Math.max(accuracy, 25),
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.18,
        weight: 1.5,
      }).addTo(map);
    } else {
      accuracyCircleRef.current.setLatLng(userLatLng);
      accuracyCircleRef.current.setRadius(Math.max(accuracy, 25));
    }

    // Pan map to user position smoothly
    map.setView(userLatLng, zoom, { animate: true });
  }, [latitude, longitude, accuracy, address, zoom]);

  // Render Threat / Risk Zones
  useEffect(() => {
    const zonesGroup = zonesLayerRef.current;
    if (!zonesGroup) return;

    zonesGroup.clearLayers();

    riskZones.forEach((zone) => {
      const isHigh = zone.level === 'High';
      const isMod = zone.level === 'Moderate';
      const color = isHigh ? '#dc2626' : isMod ? '#d97706' : '#2563eb';
      const fillColor = isHigh ? '#ef4444' : isMod ? '#f59e0b' : '#3b82f6';

      const circle = L.circle(zone.coordinates, {
        radius: zone.radius || 250,
        color: color,
        fillColor: fillColor,
        fillOpacity: 0.25,
        weight: 2,
        dashArray: isHigh ? '4, 4' : undefined,
      });

      circle.bindTooltip(`
        <div style="font-family: sans-serif; font-size: 11px; font-weight: 700; color: #0f172a;">
          <strong style="color: ${color};">${zone.level} Risk Zone:</strong> ${zone.name}
          ${zone.description ? `<div style="font-size: 10px; color: #475569; font-weight: 500;">${zone.description}</div>` : ''}
        </div>
      `, { permanent: false, direction: 'top' });

      zonesGroup.addLayer(circle);
    });
  }, [riskZones]);

  // Render Nearby Responders
  useEffect(() => {
    const respondersGroup = respondersLayerRef.current;
    if (!respondersGroup) return;

    respondersGroup.clearLayers();

    responders.forEach((r) => {
      const isPolice = r.type === 'Police';
      const isMedic = r.type === 'Medic';
      const bgColor = isPolice ? '#2563eb' : isMedic ? '#dc2626' : '#16a34a';

      const responderIcon = L.divIcon({
        className: 'custom-responder-marker',
        html: `
          <div style="width: 26px; height: 26px; border-radius: 50%; background: ${bgColor}; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.4); color: white; font-size: 12px; font-weight: bold;">
            ${isPolice ? '👮' : isMedic ? '🚑' : '🛡️'}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker(r.coordinates, { icon: responderIcon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
          <strong>${r.name}</strong> (${r.type})
          ${r.distance ? `<div>Distance: <b>${r.distance}</b></div>` : ''}
          ${r.eta ? `<div>ETA: <span style="color: #15803d; font-weight: 700;">${r.eta}</span></div>` : ''}
        </div>
      `);

      respondersGroup.addLayer(marker);
    });
  }, [responders]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([latitude, longitude], 16, { duration: 1 });
      userMarkerRef.current?.openPopup();
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const cycleMapStyle = () => {
    setMapStyle((prev) => (prev === 'dark' ? 'voyager' : prev === 'voyager' ? 'standard' : 'dark'));
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-300 dark:border-white/10 shadow-2xl bg-[#090d16] ${className}`} style={{ height }}>
      {/* Real Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Status & Address Badge */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-[400] flex items-center gap-2 bg-[#0d1b3e]/90 dark:bg-[#0d1b3e]/90 bg-white/95 backdrop-blur-md border border-slate-300 dark:border-white/15 px-3 py-2 rounded-xl text-slate-900 dark:text-white shadow-xl pointer-events-auto">
        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
        <div className="flex flex-col min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 tracking-tight flex items-center gap-1">
              <Navigation size={12} className="text-blue-500" /> Live GPS Satellite
            </span>
            <span className="text-[9px] bg-green-500/20 text-green-700 dark:text-green-300 font-bold px-1.5 py-0.2 rounded border border-green-500/30">
              ACTIVE
            </span>
          </div>
          <span className="text-[11px] text-slate-800 dark:text-slate-300 truncate max-w-[260px] sm:max-w-xs font-mono font-medium">
            {address || `${latitude.toFixed(5)}°, ${longitude.toFixed(5)}°`}
          </span>
        </div>
      </div>

      {/* Map Control Buttons */}
      {showControls && (
        <div className="absolute right-3 top-3 z-[400] flex flex-col gap-1.5 pointer-events-auto">
          <button
            onClick={handleRecenter}
            type="button"
            title="Recenter on your GPS location"
            className="w-9 h-9 rounded-xl bg-white dark:bg-[#0d1b3e]/90 hover:bg-slate-100 dark:hover:bg-[#1a2d60] text-slate-800 dark:text-white border border-slate-300 dark:border-white/15 shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <MapPin size={16} className="text-blue-500" />
          </button>
          <button
            onClick={handleZoomIn}
            type="button"
            title="Zoom In"
            className="w-9 h-9 rounded-xl bg-white dark:bg-[#0d1b3e]/90 hover:bg-slate-100 dark:hover:bg-[#1a2d60] text-slate-800 dark:text-white border border-slate-300 dark:border-white/15 shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ZoomIn size={16} className="text-slate-700 dark:text-slate-300" />
          </button>
          <button
            onClick={handleZoomOut}
            type="button"
            title="Zoom Out"
            className="w-9 h-9 rounded-xl bg-white dark:bg-[#0d1b3e]/90 hover:bg-slate-100 dark:hover:bg-[#1a2d60] text-slate-800 dark:text-white border border-slate-300 dark:border-white/15 shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ZoomOut size={16} className="text-slate-700 dark:text-slate-300" />
          </button>
          <button
            onClick={cycleMapStyle}
            type="button"
            title={`Toggle Map Style (Current: ${mapStyle})`}
            className="w-9 h-9 rounded-xl bg-white dark:bg-[#0d1b3e]/90 hover:bg-slate-100 dark:hover:bg-[#1a2d60] text-slate-800 dark:text-white border border-slate-300 dark:border-white/15 shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Layers size={16} className="text-orange-500" />
          </button>
          {onRefreshLocation && (
            <button
              onClick={onRefreshLocation}
              type="button"
              title="Refresh GPS satellite fix"
              className="w-9 h-9 rounded-xl bg-white dark:bg-[#0d1b3e]/90 hover:bg-slate-100 dark:hover:bg-[#1a2d60] text-slate-800 dark:text-white border border-slate-300 dark:border-white/15 shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <RefreshCw size={14} className="text-green-500" />
            </button>
          )}
        </div>
      )}

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 left-3 z-[400] hidden sm:flex items-center gap-3 bg-white/95 dark:bg-[#080d1a]/85 backdrop-blur-md border border-slate-300 dark:border-white/10 px-3 py-1.5 rounded-lg text-[10px] text-slate-800 dark:text-slate-300 shadow-md">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>You</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>High Risk</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Moderate Risk</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Responder</span>
        </div>
      </div>
    </div>
  );
}
