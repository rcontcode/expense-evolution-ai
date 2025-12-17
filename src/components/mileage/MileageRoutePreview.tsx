import { useMemo, useState, useCallback } from 'react';
import { MapPin, Navigation, Maximize2, Map, Globe, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LeafletRouteMap } from './LeafletRouteMap';

// Helper to format duration in seconds to human readable
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes} min`;
};

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
  const [showFullMap, setShowFullMap] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);

  const handleRouteInfo = useCallback((info: { duration: number; distance: number } | null) => {
    if (info) {
      setEstimatedTime(info.duration);
    }
  }, []);

  // Google Maps URL - shows route with directions (reliable, no blocking)
  const googleMapsUrl = useMemo(() => {
    if (startLat && startLng && endLat && endLng) {
      return `https://www.google.com/maps/dir/${startLat},${startLng}/${endLat},${endLng}`;
    }
    if (startAddress && endAddress) {
      return `https://www.google.com/maps/dir/${encodeURIComponent(startAddress)}/${encodeURIComponent(endAddress)}`;
    }
    return null;
  }, [startAddress, endAddress, startLat, startLng, endLat, endLng]);

  // OpenStreetMap URL - simple view centered on route (avoids /directions blocking)
  const osmUrl = useMemo(() => {
    if (startLat && startLng && endLat && endLng) {
      const centerLat = (startLat + endLat) / 2;
      const centerLng = (startLng + endLng) / 2;
      return `https://www.openstreetmap.org/?mlat=${centerLat}&mlon=${centerLng}#map=13/${centerLat}/${centerLng}`;
    }
    return null;
  }, [startLat, startLng, endLat, endLng]);

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
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => hasCoordinates && setShowFullMap(true)}
            >
              {hasCoordinates ? (
                <div className="relative w-16 h-10 rounded overflow-hidden border bg-muted group">
                  <LeafletRouteMap
                    startLat={startLat!}
                    startLng={startLng!}
                    endLat={endLat!}
                    endLng={endLng!}
                    className="h-10 pointer-events-none"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
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
              {hasCoordinates && (
                <p className="text-primary">Click para ver mapa interactivo</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Full Map Dialog */}
        <Dialog open={showFullMap} onOpenChange={setShowFullMap}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Ruta: {kilometers.toFixed(1)} km
                {estimatedTime && (
                  <Badge variant="outline" className="ml-2 gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(estimatedTime)}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {hasCoordinates && (
                <LeafletRouteMap
                  startLat={startLat!}
                  startLng={startLng!}
                  endLat={endLat!}
                  endLng={endLng!}
                  startAddress={startAddress}
                  endAddress={endAddress}
                  className="h-64"
                  onRouteInfo={handleRouteInfo}
                />
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 shrink-0 mt-1" />
                  <div>
                    <span className="text-muted-foreground text-xs">Inicio</span>
                    <p className="font-medium">{startAddress || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500 shrink-0 mt-1" />
                  <div>
                    <span className="text-muted-foreground text-xs">Destino</span>
                    <p className="font-medium">{endAddress || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {googleMapsUrl && (
                  <Button 
                    variant="default" 
                    className="flex-1 gap-2"
                    onClick={() => window.open(googleMapsUrl, '_blank', 'noopener,noreferrer')}
                  >
                    <Map className="h-4 w-4" />
                    Google Maps
                  </Button>
                )}
                {osmUrl && (
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={() => window.open(osmUrl, '_blank', 'noopener,noreferrer')}
                  >
                    <Globe className="h-4 w-4" />
                    OpenStreetMap
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Full view for detail dialog or form
  return (
    <div className="space-y-3">
      {/* Interactive Map */}
      {hasCoordinates && (
        <div className="relative">
          <LeafletRouteMap
            startLat={startLat!}
            startLng={startLng!}
            endLat={endLat!}
            endLng={endLng!}
            startAddress={startAddress}
            endAddress={endAddress}
            className="h-40"
            onRouteInfo={handleRouteInfo}
          />
          <div className="absolute bottom-2 right-2 flex gap-2">
            {estimatedTime && (
              <Badge variant="secondary" className="bg-background/90 gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(estimatedTime)}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-background/90">
              {kilometers.toFixed(1)} km
            </Badge>
            <Button 
              size="icon" 
              variant="secondary" 
              className="h-6 w-6 bg-background/90"
              onClick={() => setShowFullMap(true)}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
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

      {/* External Maps Links */}
      <div className="flex gap-2">
        {googleMapsUrl && (
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1 gap-2"
            onClick={() => window.open(googleMapsUrl, '_blank', 'noopener,noreferrer')}
          >
            <Map className="h-4 w-4" />
            Google Maps
          </Button>
        )}
        {osmUrl && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-2"
            onClick={() => window.open(osmUrl, '_blank', 'noopener,noreferrer')}
          >
            <Globe className="h-4 w-4" />
            OpenStreetMap
          </Button>
        )}
      </div>

      {/* Full Map Dialog */}
      {hasCoordinates && (
        <Dialog open={showFullMap} onOpenChange={setShowFullMap}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Ruta: {kilometers.toFixed(1)} km
                {estimatedTime && (
                  <Badge variant="outline" className="ml-2 gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(estimatedTime)}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            <LeafletRouteMap
              startLat={startLat!}
              startLng={startLng!}
              endLat={endLat!}
              endLng={endLng!}
              startAddress={startAddress}
              endAddress={endAddress}
              className="h-96"
              onRouteInfo={handleRouteInfo}
            />
            <div className="flex gap-2">
              {googleMapsUrl && (
                <Button 
                  variant="default" 
                  className="flex-1 gap-2"
                  onClick={() => window.open(googleMapsUrl, '_blank', 'noopener,noreferrer')}
                >
                  <Map className="h-4 w-4" />
                  Google Maps
                </Button>
              )}
              {osmUrl && (
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={() => window.open(osmUrl, '_blank', 'noopener,noreferrer')}
                >
                  <Globe className="h-4 w-4" />
                  OpenStreetMap
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
