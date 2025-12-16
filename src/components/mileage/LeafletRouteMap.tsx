import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LeafletRouteMapProps {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  startAddress?: string | null;
  endAddress?: string | null;
  className?: string;
}

// Fix for default marker icons in Leaflet with webpack/vite
const startIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 24px; 
    height: 24px; 
    background: #22c55e; 
    border: 3px solid white; 
    border-radius: 50%; 
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

const endIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 24px; 
    height: 24px; 
    background: #ef4444; 
    border: 3px solid white; 
    border-radius: 50%; 
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

export function LeafletRouteMap({
  startLat,
  startLng,
  endLat,
  endLng,
  startAddress,
  endAddress,
  className = ''
}: LeafletRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Calculate bounds
    const bounds = L.latLngBounds(
      [startLat, startLng],
      [endLat, endLng]
    );

    // Create map
    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      dragging: true,
      zoomControl: true,
      attributionControl: true
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Fit bounds with padding
    map.fitBounds(bounds, { padding: [30, 30] });

    // Add markers
    const startMarker = L.marker([startLat, startLng], { icon: startIcon })
      .addTo(map);
    
    const endMarker = L.marker([endLat, endLng], { icon: endIcon })
      .addTo(map);

    // Add popups
    if (startAddress) {
      startMarker.bindPopup(`<strong>Inicio:</strong><br/>${startAddress}`);
    }
    if (endAddress) {
      endMarker.bindPopup(`<strong>Destino:</strong><br/>${endAddress}`);
    }

    // Draw line between points
    const polyline = L.polyline(
      [[startLat, startLng], [endLat, endLng]],
      { 
        color: '#3b82f6', 
        weight: 4, 
        opacity: 0.7,
        dashArray: '10, 10'
      }
    ).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [startLat, startLng, endLat, endLng, startAddress, endAddress]);

  return (
    <div 
      ref={mapRef} 
      className={`w-full rounded-lg overflow-hidden ${className}`}
      style={{ minHeight: '150px' }}
    />
  );
}
