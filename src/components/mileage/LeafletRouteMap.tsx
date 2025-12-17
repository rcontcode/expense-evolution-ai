import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RouteInfo {
  duration: number; // in seconds
  distance: number; // in meters
}

interface LeafletRouteMapProps {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  startAddress?: string | null;
  endAddress?: string | null;
  className?: string;
  onRouteInfo?: (info: RouteInfo | null) => void;
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
  className = '',
  onRouteInfo
}: LeafletRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);

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

    mapInstanceRef.current = map;

    // Fetch real route from OSRM
    const fetchRoute = async () => {
      try {
        setIsLoadingRoute(true);
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
        );
        
        if (!response.ok) throw new Error('Route fetch failed');
        
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const routeCoords = route.geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]] as L.LatLngTuple
          );
          
          // Pass route info to parent
          if (onRouteInfo) {
            onRouteInfo({
              duration: route.duration, // seconds
              distance: route.distance  // meters
            });
          }
          
          // Remove old route if exists
          if (routeLayerRef.current) {
            routeLayerRef.current.remove();
          }
          
          // Draw real route
          routeLayerRef.current = L.polyline(routeCoords, {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.8
          }).addTo(map);
          
          // Fit bounds to include full route
          map.fitBounds(routeLayerRef.current.getBounds(), { padding: [30, 30] });
        }
      } catch (error) {
        console.warn('Could not fetch real route, using straight line:', error);
        // Fallback to straight line
        if (onRouteInfo) {
          onRouteInfo(null);
        }
        routeLayerRef.current = L.polyline(
          [[startLat, startLng], [endLat, endLng]],
          { 
            color: '#3b82f6', 
            weight: 4, 
            opacity: 0.7,
            dashArray: '10, 10'
          }
        ).addTo(map);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    fetchRoute();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [startLat, startLng, endLat, endLng, startAddress, endAddress]);

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className={`w-full rounded-lg overflow-hidden ${className}`}
        style={{ minHeight: '150px' }}
      />
      {isLoadingRoute && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
          <span className="text-xs text-muted-foreground">Cargando ruta...</span>
        </div>
      )}
    </div>
  );
}