import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, LocateFixed, Star, Clock, Plus, Globe, MapPinOff, Info, CheckCircle2 } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  class?: string;
  type?: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
    country_code?: string;
  };
}

type GeocodeSource = 'photon' | 'nominatim';

interface GeocodeSuggestion {
  id: string;
  display: string;
  lat: number;
  lng: number;
  source: GeocodeSource;
  houseNumber?: string;
  countryCode?: string;
}

interface PhotonResponse {
  features?: Array<{
    properties?: {
      name?: string;
      housenumber?: string;
      street?: string;
      city?: string;
      state?: string;
      postcode?: string;
      country?: string;
      countrycode?: string;
      osm_id?: number;
      osm_type?: string;
    };
    geometry?: {
      type: 'Point';
      coordinates: [number, number];
    };
  }>;
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
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSaveOption, setShowSaveOption] = useState(false);
  const [pendingAddress, setPendingAddress] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [countryCode, setCountryCode] = useState('ca');
  const [isDetectingCountry, setIsDetectingCountry] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'unknown' | 'granted' | 'denied' | 'unavailable'>('unknown');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);
  
  const debouncedSearch = useDebounce(inputValue, 250);

  // Auto-detect country from user's location on mount (and store location for better search results)
  useEffect(() => {
    const detectCountry = async () => {
      if (!navigator.geolocation) {
        setIsDetectingCountry(false);
        setLocationStatus('unavailable');
        return;
      }

      // Check permission status if available
      if (navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          if (permissionStatus.state === 'denied') {
            setLocationStatus('denied');
            setIsDetectingCountry(false);
            return;
          }
          // Listen for permission changes
          permissionStatus.onchange = () => {
            if (permissionStatus.state === 'denied') {
              setLocationStatus('denied');
              setUserLocation(null);
            } else if (permissionStatus.state === 'granted') {
              setLocationStatus('granted');
            }
          };
        } catch (e) {
          // Some browsers don't support permissions API for geolocation
        }
      }

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 300000 // Cache for 5 minutes
          });
        });

        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationStatus('granted');
        
        // Reverse geocode to get country
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=3`,
          {
            headers: {
              'Accept-Language': 'es,en',
              'User-Agent': 'EvoFinz/1.0 (https://evofinz.com)'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const detectedCountryCode = data.address?.country_code?.toLowerCase();
          
          if (detectedCountryCode) {
            const matchingCountry = COUNTRIES.find(c => c.code === detectedCountryCode);
            if (matchingCountry) {
              setCountryCode(detectedCountryCode);
            }
          }
        }
      } catch (error: any) {
        // Check if it was a permission denial
        if (error.code === 1) {
          setLocationStatus('denied');
        } else {
          setLocationStatus('unavailable');
        }
        console.log('Country detection failed, using default');
      } finally {
        setIsDetectingCountry(false);
      }
    };

    detectCountry();
  }, []);

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

  // Fetch suggestions (Photon primary + Nominatim fallback)
  useEffect(() => {
    const fetchSuggestions = async () => {
      const rawTerm = debouncedSearch?.trim() ?? '';
      const normalizeForGeocoder = (term: string) =>
        term.replace(/^([0-9]{1,6})(?:\s*[,;]\s*|\s+-\s+)/, '$1 ');
      const searchTerm = normalizeForGeocoder(rawTerm);

      if (!searchTerm || searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      // Cancel any in-flight request to avoid race conditions.
      fetchAbortRef.current?.abort();
      const controller = new AbortController();
      fetchAbortRef.current = controller;

      setIsLoading(true);

      try {
        const leadingHouseNumber = searchTerm.match(/^(\d{1,6})(?=[\s,])/ )?.[1] ?? null;
        
        // Extract Canadian postal code (format: V7T 2K3 or V7T2K3)
        const canadianPostalCodeMatch = searchTerm.match(/\b([A-Z]\d[A-Z])\s?(\d[A-Z]\d)\b/i);
        const canadianPostalCode = canadianPostalCodeMatch 
          ? `${canadianPostalCodeMatch[1].toUpperCase()} ${canadianPostalCodeMatch[2].toUpperCase()}`
          : null;
        const canadianPostalCodeNormalized = canadianPostalCode?.replace(/\s/g, '').toUpperCase() ?? null;

        const headers = {
          'Accept-Language': 'es,en',
          // Some browsers ignore this header, but keeping it doesn't hurt.
          'User-Agent': 'EvoFinz/1.0 (https://evofinz.com)'
        } as const;

        const selectedCountry = countryCode && countryCode !== 'global' ? countryCode.toLowerCase() : null;

        const rankByHouseAndProximity = (items: GeocodeSuggestion[]) => {
          if (items.length <= 1) return items;

          const hn = leadingHouseNumber;
          const userLat = userLocation?.lat ?? null;
          const userLng = userLocation?.lng ?? null;

          const score = (r: GeocodeSuggestion) => {
            let s = 0;

            // Prioritize results from selected country
            if (selectedCountry && r.countryCode === selectedCountry) {
              s += 500;
            }

            // Prioritize results matching Canadian postal code
            if (canadianPostalCodeNormalized) {
              const displayNormalized = r.display.replace(/\s/g, '').toUpperCase();
              if (displayNormalized.includes(canadianPostalCodeNormalized)) {
                s += 800; // High priority for postal code match
              }
            }

            if (hn) {
              if (r.houseNumber === hn) s += 1000;
              if (r.houseNumber) s += 40;
            }

            if (userLat != null && userLng != null) {
              const dist = Math.abs(r.lat - userLat) + Math.abs(r.lng - userLng);
              s -= dist * 10;
            }

            return s;
          };

          return [...items].sort((a, b) => score(b) - score(a));
        };

        const fetchPhoton = async (): Promise<GeocodeSuggestion[]> => {
          // Photon NO soporta lang=es (solo: default/en/de/fr). Si mandamos un lang no soportado, responde 400.
          const photonLang = language === 'en' ? 'en' : 'default';

          const params = new URLSearchParams({
            q: searchTerm,
            limit: '10',
          });

          if (photonLang !== 'default') params.set('lang', photonLang);

          if (userLocation) {
            params.set('lat', String(userLocation.lat));
            params.set('lon', String(userLocation.lng));
          }

          const url = `https://photon.komoot.io/api/?${params.toString()}`;
          const res = await fetch(url, { headers, signal: controller.signal });
          if (!res.ok) return [];

          const json = (await res.json()) as PhotonResponse;
          const features = json.features ?? [];

          let items: GeocodeSuggestion[] = features
            .map((f) => {
              const coords = f.geometry?.coordinates;
              const p = f.properties ?? {};
              if (!coords || coords.length !== 2) return null;

              const [lng, lat] = coords;
              const houseNumber = p.housenumber?.toString();
              const street = p.street || p.name || '';
              const city = p.city || '';
              const state = p.state || '';
              const postcode = p.postcode || '';
              const country = p.country || '';
              const itemCountryCode = p.countrycode?.toLowerCase();

              const displayParts = [
                `${houseNumber ? `${houseNumber} ` : ''}${street}`.trim(),
                city,
                state,
                postcode,
                country
              ].filter(Boolean);

              const display = displayParts.join(', ');

              return {
                id: `photon-${p.osm_type ?? 'osm'}-${p.osm_id ?? `${lat},${lng}`}`,
                display,
                lat: Number(lat),
                lng: Number(lng),
                source: 'photon' as const,
                houseNumber,
                countryCode: itemCountryCode
              } satisfies GeocodeSuggestion;
            })
            .filter(Boolean) as GeocodeSuggestion[];

          // Filter by selected country
          if (selectedCountry) {
            const countryFiltered = items.filter((i) => i.countryCode === selectedCountry);
            // Only use filtered results if we got some, otherwise fall through to Nominatim
            if (countryFiltered.length > 0) {
              items = countryFiltered;
            } else {
              // No results from selected country - return empty to trigger Nominatim fallback
              return [];
            }
          }

          // If the user typed a house number, prefer results that include it.
          if (leadingHouseNumber) {
            const exact = items.filter((i) => i.houseNumber === leadingHouseNumber);
            if (exact.length > 0) return rankByHouseAndProximity(exact);
          }

          return rankByHouseAndProximity(items);
        };

        const fetchNominatim = async (): Promise<GeocodeSuggestion[]> => {
          const countryParam = countryCode && countryCode !== 'global' ? `&countrycodes=${countryCode}` : '';

          const getGeoBiasParams = () => {
            if (!userLocation) return '';
            const latDelta = 0.5;
            const lngDelta = 0.5;
            const viewbox = `${userLocation.lng - lngDelta},${userLocation.lat + latDelta},${userLocation.lng + lngDelta},${userLocation.lat - latDelta}`;
            return `&viewbox=${viewbox}`;
          };

          const parts = searchTerm.split(',').map((p) => p.trim()).filter(Boolean);
          // Use already extracted Canadian postal code or try to find one in parts
          const postalCode = canadianPostalCode ?? parts.find((p) => /[A-Z]\d[A-Z]\s?\d[A-Z]\d/i.test(p))?.match(/[A-Z]\d[A-Z]\s?\d[A-Z]\d/i)?.[0] ?? null;

          const geoBias = getGeoBiasParams();
          const dedupeParam = leadingHouseNumber ? '&dedupe=0' : '&dedupe=1';
          const makeUrl = (params: string) =>
            `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=10${dedupeParam}${countryParam}${params}`;

          const q = searchTerm.length > 80 && parts.length > 2 ? parts.slice(0, 3).join(', ') : searchTerm;

          const urls: string[] = [];
          
          // If we have a Canadian postal code, prioritize postal code-based searches
          if (postalCode) {
            const postalParam = `&postalcode=${encodeURIComponent(postalCode)}`;
            if (leadingHouseNumber) {
              const street = parts[0] ?? searchTerm;
              urls.push(makeUrl(`&street=${encodeURIComponent(street)}${postalParam}${geoBias}`));
            }
            // Search with just postal code for area
            urls.push(makeUrl(`&q=${encodeURIComponent(q)}${geoBias}`));
          }
          
          if (leadingHouseNumber) {
            const street = parts[0] ?? searchTerm;
            const cityGuess = parts.slice(1).find((p) => /vancouver|burnaby|surrey|richmond|coquitlam|north\s*vancouver|west\s*vancouver/i.test(p)) ?? parts[1] ?? '';
            const cityParam = cityGuess ? `&city=${encodeURIComponent(cityGuess)}` : '';

            urls.push(makeUrl(`&street=${encodeURIComponent(street)}${cityParam}${geoBias}`));
            urls.push(makeUrl(`&street=${encodeURIComponent(street)}${geoBias}`));
            urls.push(makeUrl(`&q=${encodeURIComponent(q)}${geoBias}`));
          } else {
            urls.push(makeUrl(`&q=${encodeURIComponent(q)}${geoBias}`));
            urls.push(makeUrl(`&q=${encodeURIComponent(q)}`));
          }

          const tryFetch = async (url: string) => {
            const response = await fetch(url, { headers, signal: controller.signal });
            if (!response.ok) return [] as NominatimResult[];
            return (await response.json()) as NominatimResult[];
          };

          let data: NominatimResult[] = [];
          for (const url of urls) {
            data = await tryFetch(url);
            if (data.length > 0) break;
          }

          const items: GeocodeSuggestion[] = data.map((r) => {
            const lat = Number.parseFloat(r.lat);
            const lng = Number.parseFloat(r.lon);
            const houseNumber = r.address?.house_number;
            const itemCountryCode = r.address?.country_code?.toLowerCase();

            return {
              id: `nominatim-${r.place_id}`,
              display: r.display_name,
              lat,
              lng,
              source: 'nominatim',
              houseNumber,
              countryCode: itemCountryCode
            } satisfies GeocodeSuggestion;
          });

          // If the user typed a house number, prefer exact matches.
          if (leadingHouseNumber) {
            const exact = items.filter((i) => i.houseNumber === leadingHouseNumber || new RegExp(`\\b${leadingHouseNumber}\\b`).test(i.display));
            if (exact.length > 0) return rankByHouseAndProximity(exact);
          }

          return rankByHouseAndProximity(items);
        };

        // Primary provider (generally more "autocomplete-like" for civic addresses)
        let items = await fetchPhoton();

        // If the user typed a house number, ensure we also try Nominatim for exact civic matches.
        if (leadingHouseNumber) {
          const hasExact = items.some(
            (i) => i.houseNumber === leadingHouseNumber || new RegExp(`\\b${leadingHouseNumber}\\b`).test(i.display)
          );
          if (!hasExact) {
            const nom = await fetchNominatim();
            items = rankByHouseAndProximity([...nom, ...items]);
          }
        }

        // Fallback
        if (items.length === 0) items = await fetchNominatim();

        const top = items.slice(0, 5);
        setSuggestions(top);
        setShowSuggestions(top.length > 0);
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.warn('Address search error:', error);
        }
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearch, countryCode, userLocation, language]);


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

  const handleSelect = (result: GeocodeSuggestion) => {
    const address = result.display;
    const lat = result.lat;
    const lng = result.lng;

    setInputValue(address);
    onChange(address);
    onCoordinatesChange(lat, lng);
    setShowSuggestions(false);
    setSuggestions([]);

    // Show save option for new addresses
    const isAlreadySaved = savedAddresses.some((a) => a.address === address);
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
            'User-Agent': 'EvoFinz/1.0 (https://evofinz.com)'
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
        <Select value={countryCode} onValueChange={setCountryCode} disabled={isDetectingCountry}>
          <SelectTrigger className="w-[70px] shrink-0" title={isDetectingCountry ? 'Detectando ubicación...' : 'Cambiar país'}>
            <SelectValue>
              {isDetectingCountry ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                COUNTRIES.find(c => c.code === countryCode)?.flag || '🌍'
              )}
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && suggestions[0]) {
                e.preventDefault();
                handleSelect(suggestions[0]);
              }
            }}
            placeholder={placeholder}
            className="pr-8"
          />
          {isLoading && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        
        {showLocationButton && (
          <div className="flex items-center gap-1">
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
            
            {/* Location status indicator */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-full transition-colors",
                    locationStatus === 'granted' && "bg-green-500/10 text-green-600 hover:bg-green-500/20",
                    locationStatus === 'denied' && "bg-destructive/10 text-destructive hover:bg-destructive/20",
                    (locationStatus === 'unknown' || locationStatus === 'unavailable') && "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                  title={
                    locationStatus === 'granted' 
                      ? t('mileage.locationActive') 
                      : locationStatus === 'denied' 
                        ? t('mileage.locationBlocked')
                        : t('mileage.locationUnknown')
                  }
                >
                  {locationStatus === 'granted' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : locationStatus === 'denied' ? (
                    <MapPinOff className="h-4 w-4" />
                  ) : (
                    <Info className="h-4 w-4" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                {locationStatus === 'granted' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">{t('mileage.locationActiveTitle')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('mileage.locationActiveDesc')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-destructive">
                      <MapPinOff className="h-5 w-5" />
                      <span className="font-medium">{t('mileage.locationBlockedTitle')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('mileage.locationBlockedDesc')}
                    </p>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <p className="text-sm font-medium">{t('mileage.howToEnable')}</p>
                      <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                        <li>{t('mileage.enableStep1')}</li>
                        <li>{t('mileage.enableStep2')}</li>
                        <li>{t('mileage.enableStep3')}</li>
                      </ol>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.reload()}
                    >
                      {t('mileage.reloadPage')}
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
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
                  key={result.id}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-start gap-2 transition-colors"
                  onClick={() => handleSelect(result)}
                >
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{result.display}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}