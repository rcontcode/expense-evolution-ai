import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, LocateFixed, Star, Clock, Plus, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/utils/useDebounce';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface SavedAddress {
  id: string;
  address: string;
  lat: number | null;
  lng: number | null;
  label: string | null;
  use_count: number;
}

const COUNTRIES = [
  { code: 'ca', name: 'Canadá', flag: '🇨🇦' },
  { code: 'mx', name: 'México', flag: '🇲🇽' },
  { code: 'es', name: 'España', flag: '🇪🇸' },
  { code: 'us', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'ar', name: 'Argentina', flag: '🇦🇷' },
  { code: 'co', name: 'Colombia', flag: '🇨🇴' },
  { code: 'cl', name: 'Chile', flag: '🇨🇱' },
  { code: 'pe', name: 'Perú', flag: '🇵🇪' },
  { code: 'global', name: 'Global', flag: '🌍' },
];

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSaveOption, setShowSaveOption] = useState(false);
  const [pendingAddress, setPendingAddress] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [countryCode, setCountryCode] = useState('ca');
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const debouncedSearch = useDebounce(inputValue, 400);

  // Fetch saved addresses
  const { data: savedAddresses = [] } = useQuery({
    queryKey: ['user-addresses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('use_count', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as SavedAddress[];
    },
    enabled: !!user?.id
  });

  // Save address mutation
  const saveAddressMutation = useMutation({
    mutationFn: async (addressData: { address: string; lat: number; lng: number; label?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Check if address already exists
      const { data: existing } = await supabase
        .from('user_addresses')
        .select('id, use_count')
        .eq('user_id', user.id)
        .eq('address', addressData.address)
        .single();

      if (existing) {
        // Update use count
        await supabase
          .from('user_addresses')
          .update({ use_count: existing.use_count + 1, last_used_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        // Insert new address
        await supabase
          .from('user_addresses')
          .insert({
            user_id: user.id,
            address: addressData.address,
            lat: addressData.lat,
            lng: addressData.lng,
            label: addressData.label
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      toast.success(t('mileage.addressSaved'));
      setShowSaveOption(false);
      setPendingAddress(null);
    }
  });

  // Update use count when selecting saved address
  const updateUseCount = async (addressId: string, currentCount: number) => {
    await supabase
      .from('user_addresses')
      .update({ use_count: currentCount + 1, last_used_at: new Date().toISOString() })
      .eq('id', addressId);
    queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
  };

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
        const countryParam = countryCode && countryCode !== 'global' ? `&countrycodes=${countryCode}` : '';
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedSearch)}&limit=5&addressdetails=1${countryParam}`,
          {
            headers: {
              'Accept-Language': 'es,en',
            }
          }
        );
        
        if (!response.ok) throw new Error('Nominatim fetch failed');
        
        const data: NominatimResult[] = await response.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0 || filteredSavedAddresses.length > 0);
      } catch (error) {
        console.warn('Nominatim geocoding error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearch, countryCode]);

  // Filter saved addresses based on input
  const filteredSavedAddresses = savedAddresses.filter(addr => 
    !debouncedSearch || addr.address.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

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
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    setInputValue(address);
    onChange(address);
    onCoordinatesChange(lat, lng);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Show save option for new addresses
    const isAlreadySaved = savedAddresses.some(a => a.address === address);
    if (!isAlreadySaved) {
      setPendingAddress({ address, lat, lng });
      setShowSaveOption(true);
    }
  };

  const handleSelectSaved = (saved: SavedAddress) => {
    setInputValue(saved.address);
    onChange(saved.address);
    onCoordinatesChange(saved.lat, saved.lng);
    setShowSuggestions(false);
    setSuggestions([]);
    updateUseCount(saved.id, saved.use_count);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    onCoordinatesChange(null, null);
    setShowSaveOption(false);
  };

  const handleFocus = () => {
    if (filteredSavedAddresses.length > 0 || suggestions.length > 0) {
      setShowSuggestions(true);
    }
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
        
        // Show save option
        const isAlreadySaved = savedAddresses.some(a => a.address === data.display_name);
        if (!isAlreadySaved) {
          setPendingAddress({ address: data.display_name, lat: latitude, lng: longitude });
          setShowSaveOption(true);
        }
      } else {
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
        <Select value={countryCode} onValueChange={setCountryCode}>
          <SelectTrigger className="w-[70px] shrink-0">
            <SelectValue>
              {COUNTRIES.find(c => c.code === countryCode)?.flag || '🌍'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <span className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="relative flex-1">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
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

      {/* Save address option */}
      {showSaveOption && pendingAddress && (
        <div className="mt-1 p-2 bg-primary/5 border border-primary/20 rounded-md flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground truncate flex-1">
            {t('mileage.saveAddressQuestion')}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 text-xs"
            onClick={() => saveAddressMutation.mutate(pendingAddress)}
          >
            <Plus className="h-3 w-3 mr-1" />
            {t('mileage.saveAddress')}
          </Button>
        </div>
      )}

      {showSuggestions && (filteredSavedAddresses.length > 0 || suggestions.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Saved addresses first */}
          {filteredSavedAddresses.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t('mileage.recentAddresses')}
              </div>
              {filteredSavedAddresses.map((saved) => (
                <button
                  key={saved.id}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-start gap-2 transition-colors"
                  onClick={() => handleSelectSaved(saved)}
                >
                  <Star className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    {saved.label && (
                      <span className="text-xs font-medium text-primary mr-1">{saved.label}:</span>
                    )}
                    <span className="line-clamp-2">{saved.address}</span>
                  </div>
                </button>
              ))}
            </>
          )}
          
          {/* Nominatim suggestions */}
          {suggestions.length > 0 && (
            <>
              {filteredSavedAddresses.length > 0 && (
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">
                  {t('mileage.searchResults')}
                </div>
              )}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}