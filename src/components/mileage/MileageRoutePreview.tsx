import { useMemo } from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MileageRoutePreviewProps {
  startAddress?: string | null;
  endAddress?: string | null;
  startLat?: number | null;
  startLng?: number | null;
  endLat?: number | null;
  endLng?: number | null;
  kilometers: number;
  compact?: boolean;
  route?: string;
}

export function MileageRoutePreview({ 
  startAddress, 
  endAddress, 
  startLat, 
  startLng, 
  endLat, 
  endLng,
  kilometers,
  compact = false,
  route
}: MileageRoutePreviewProps) {
  // Generate static map URL using OpenStreetMap tiles via a free service
  const mapUrl = useMemo(() => {
    if (!startLat || !startLng || !endLat || !endLng) return null;
    
    // Use OpenStreetMap static map API alternative
    // Calculate center point
    const centerLat = (startLat + endLat) / 2;
    const centerLng = (startLng + endLng) / 2;
    
    // Calculate zoom based on distance
    const latDiff = Math.abs(startLat - endLat);
    const lngDiff = Math.abs(startLng - endLng);
    const maxDiff = Math.max(latDiff, lngDiff);
    let zoom = 12;
    if (maxDiff > 1) zoom = 8;
    else if (maxDiff > 0.5) zoom = 9;
    else if (maxDiff > 0.2) zoom = 10;
    else if (maxDiff > 0.1) zoom = 11;
    
    // Using staticmap.io or similar service (free tier)
    return `https://staticmap.io/api/v1/staticmap?center=${centerLat},${centerLng}&zoom=${zoom}&size=200x100&markers=${startLat},${startLng}|${endLat},${endLng}&format=png`;
  }, [startLat, startLng, endLat, endLng]);

  // Generate Google Maps directions URL
  const googleMapsUrl = useMemo(() => {
    if (startAddress && endAddress) {
      return `https://www.google.com/maps/dir/${encodeURIComponent(startAddress)}/${encodeURIComponent(endAddress)}`;
    }
    if (startLat && startLng && endLat && endLng) {
      return `https://www.google.com/maps/dir/${startLat},${startLng}/${endLat},${endLng}`;
    }
    return null;
  }, [startAddress, endAddress, startLat, startLng, endLat, endLng]);

  const hasCoordinates = startLat && startLng && endLat && endLng;
  const hasAddresses = startAddress || endAddress;

  if (compact) {
    // Compact view for table - just a small icon/badge
    if (!hasAddresses && !hasCoordinates) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <MapPin className="h-3 w-3 mr-1" />
          {route?.substring(0, 20) || 'Sin ruta'}
        </Badge>
      );
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            {hasCoordinates ? (
              <div className="relative w-16 h-10 rounded overflow-hidden border bg-muted">
                {mapUrl ? (
                  <img 
                    src={mapUrl} 
                    alt="Route preview" 
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Navigation className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="text-[10px] font-bold text-white drop-shadow">
                    {kilometers.toFixed(0)}km
                  </span>
                </div>
              </div>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3" />
                {kilometers.toFixed(1)}km
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1 text-xs">
            {startAddress && (
              <p><strong>Desde:</strong> {startAddress}</p>
            )}
            {endAddress && (
              <p><strong>Hasta:</strong> {endAddress}</p>
            )}
            {!startAddress && !endAddress && route && (
              <p>{route}</p>
            )}
            {googleMapsUrl && (
              <a 
                href={googleMapsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 mt-1"
              >
                Ver en Google Maps
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Full view for detail dialog or form
  return (
    <div className="space-y-3">
      {/* Map Preview */}
      {hasCoordinates && (
        <div className="relative w-full h-32 rounded-lg overflow-hidden border bg-muted">
          {mapUrl ? (
            <img 
              src={mapUrl} 
              alt="Route map" 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Navigation className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="bg-background/80">
              {kilometers.toFixed(1)} km
            </Badge>
          </div>
        </div>
      )}

      {/* Addresses */}
      <div className="space-y-2">
        {startAddress && (
          <div className="flex items-start gap-2 text-sm">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Inicio</span>
              <p className="font-medium">{startAddress}</p>
            </div>
          </div>
        )}
        
        {endAddress && (
          <div className="flex items-start gap-2 text-sm">
            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <MapPin className="h-3 w-3 text-red-500" />
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Destino</span>
              <p className="font-medium">{endAddress}</p>
            </div>
          </div>
        )}
      </div>

      {/* Google Maps Link */}
      {googleMapsUrl && (
        <Button variant="outline" size="sm" className="w-full gap-2" asChild>
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Ver en Google Maps
          </a>
        </Button>
      )}
    </div>
  );
}
