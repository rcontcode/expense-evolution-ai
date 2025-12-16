import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Navigation, LocateFixed } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/utils/useDebounce';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onCoordinatesChange: (lat: number | null, lng: number | null) => void;
  placeholder?: string;
  className?: string;
  showLocationButton?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  onCoordinatesChange,
  placeholder = 'Buscar dirección...',
  className,
  showLocationButton = true
}: AddressAutocompleteProps) {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const debouncedSearch = useDebounce(inputValue, 400);

  // Sync external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fetch suggestions from Nominatim
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedSearch || debouncedSearch.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedSearch)}&limit=5&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'es,en',
            }
          }
        );
        
        if (!response.ok) throw new Error('Nominatim fetch failed');
        
        const data: NominatimResult[] = await response.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch (error) {
        console.warn('Nominatim geocoding error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearch]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: NominatimResult) => {
    const address = result.display_name;
    setInputValue(address);
    onChange(address);
    onCoordinatesChange(parseFloat(result.lat), parseFloat(result.lon));
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    // Clear coordinates when manually typing (will be set when selecting)
    onCoordinatesChange(null, null);
  };

  // Get current location using Geolocation API + reverse geocoding
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error(t('mileage.geolocationNotSupported'));
      return;
    }

    setIsGettingLocation(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocoding with Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es,en',
          }
        }
      );

      if (!response.ok) throw new Error('Reverse geocoding failed');

      const data = await response.json();
      
      if (data.display_name) {
        setInputValue(data.display_name);
        onChange(data.display_name);
        onCoordinatesChange(latitude, longitude);
        toast.success(t('mileage.locationObtained'));
      } else {
        // Fallback: use coordinates as address
        const coordsAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setInputValue(coordsAddress);
        onChange(coordsAddress);
        onCoordinatesChange(latitude, longitude);
        toast.success(t('mileage.locationObtained'));
      }
    } catch (error: any) {
      console.error('Geolocation error:', error);
      if (error.code === 1) {
        toast.error(t('mileage.locationPermissionDenied'));
      } else if (error.code === 2) {
        toast.error(t('mileage.locationUnavailable'));
      } else if (error.code === 3) {
        toast.error(t('mileage.locationTimeout'));
      } else {
        toast.error(t('mileage.locationError'));
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder={placeholder}
            className="pr-8"
          />
          {isLoading && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        
        {showLocationButton && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            title={t('mileage.useMyLocation')}
            className="shrink-0"
          >
            {isGettingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((result) => (
            <button
              key={result.place_id}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-start gap-2 transition-colors"
              onClick={() => handleSelect(result)}
            >
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <span className="line-clamp-2">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}