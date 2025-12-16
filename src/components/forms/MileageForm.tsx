import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, MapPin, Navigation, Sparkles, Building2, Loader2, Route } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { mileageSchema, MileageFormValues } from '@/lib/validations/mileage.schema';
import { useClients } from '@/hooks/data/useClients';
import { useLanguage } from '@/contexts/LanguageContext';
import { MileageWithClient, calculateMileageDeduction, CRA_MILEAGE_RATES } from '@/hooks/data/useMileage';
import { MileageRoutePreview } from '@/components/mileage/MileageRoutePreview';
import { AddressAutocomplete } from '@/components/mileage/AddressAutocomplete';

interface MileageFormProps {
  initialData?: MileageWithClient | null;
  yearToDateKm?: number;
  onSubmit: (data: MileageFormValues) => void;
  isLoading?: boolean;
}

export const MileageForm = ({ initialData, yearToDateKm = 0, onSubmit, isLoading }: MileageFormProps) => {
  const { t } = useLanguage();
  const { data: clients } = useClients();
  const [showClientAddressSuggestion, setShowClientAddressSuggestion] = useState(false);
  const [selectedClientAddress, setSelectedClientAddress] = useState<string | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [calculatedDuration, setCalculatedDuration] = useState<number | null>(null);

  const form = useForm<MileageFormValues>({
    resolver: zodResolver(mileageSchema),
    defaultValues: {
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      kilometers: initialData?.kilometers ? parseFloat(initialData.kilometers.toString()) : undefined,
      route: initialData?.route || '',
      purpose: initialData?.purpose || '',
      client_id: initialData?.client_id || undefined,
      start_address: initialData?.start_address || '',
      end_address: initialData?.end_address || '',
      start_lat: initialData?.start_lat || null,
      start_lng: initialData?.start_lng || null,
      end_lat: initialData?.end_lat || null,
      end_lng: initialData?.end_lng || null,
    },
  });

  const watchKilometers = form.watch('kilometers');
  const watchClientId = form.watch('client_id');
  const watchStartAddress = form.watch('start_address');
  const watchEndAddress = form.watch('end_address');
  const watchStartLat = form.watch('start_lat');
  const watchStartLng = form.watch('start_lng');
  const watchEndLat = form.watch('end_lat');
  const watchEndLng = form.watch('end_lng');
  
  const estimatedDeduction = watchKilometers 
    ? calculateMileageDeduction(watchKilometers, yearToDateKm)
    : { deductible: 0, rate: CRA_MILEAGE_RATES.first5000 };

  // Calculate distance using OSRM when both coordinates are available
  const calculateRouteDistance = useCallback(async (
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
  ) => {
    setIsCalculatingDistance(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=false`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const distanceKm = data.routes[0].distance / 1000;
        const durationMin = Math.round(data.routes[0].duration / 60);
        setCalculatedDistance(Math.round(distanceKm * 10) / 10);
        setCalculatedDuration(durationMin);
      }
    } catch (error) {
      console.error('Error calculating route distance:', error);
    } finally {
      setIsCalculatingDistance(false);
    }
  }, []);

  // Auto-calculate distance when both coordinates are set
  useEffect(() => {
    if (watchStartLat && watchStartLng && watchEndLat && watchEndLng) {
      calculateRouteDistance(watchStartLat, watchStartLng, watchEndLat, watchEndLng);
    } else {
      setCalculatedDistance(null);
      setCalculatedDuration(null);
    }
  }, [watchStartLat, watchStartLng, watchEndLat, watchEndLng, calculateRouteDistance]);

  const applyCalculatedDistance = () => {
    if (calculatedDistance) {
      form.setValue('kilometers', calculatedDistance);
    }
  };

  // Auto-update route when addresses change
  useEffect(() => {
    if (watchStartAddress && watchEndAddress) {
      const newRoute = `${watchStartAddress} → ${watchEndAddress}`;
      form.setValue('route', newRoute);
    }
  }, [watchStartAddress, watchEndAddress, form]);

  // Check if selected client has an address and show suggestion
  useEffect(() => {
    if (watchClientId && watchClientId !== 'none') {
      const client = clients?.find(c => c.id === watchClientId);
      if (client?.address) {
        setSelectedClientAddress(client.address);
        setShowClientAddressSuggestion(true);
      } else {
        setSelectedClientAddress(null);
        setShowClientAddressSuggestion(false);
      }
    } else {
      setSelectedClientAddress(null);
      setShowClientAddressSuggestion(false);
    }
  }, [watchClientId, clients]);

  const applyClientAddressAsDestination = () => {
    if (selectedClientAddress) {
      form.setValue('end_address', selectedClientAddress);
      setShowClientAddressSuggestion(false);
    }
  };

  const applyClientAddressAsOrigin = () => {
    if (selectedClientAddress) {
      form.setValue('start_address', selectedClientAddress);
      setShowClientAddressSuggestion(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('mileage.date')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>{t('mileage.pickDate')}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="kilometers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('mileage.kilometers')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('mileage.client')}</FormLabel>
              <Select
                value={field.value || 'none'}
                onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('mileage.selectClient')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">{t('common.none')}</SelectItem>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <span className="flex items-center gap-2">
                        {client.name}
                        {client.address && (
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Smart Address Suggestion */}
        {showClientAddressSuggestion && selectedClientAddress && (
          <Alert className="bg-primary/5 border-primary/20">
            <Building2 className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-2">
              <span className="text-sm">
                <strong>{t('mileage.clientHasAddress')}:</strong> {selectedClientAddress}
              </span>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={applyClientAddressAsDestination}
                  className="text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {t('mileage.useAsDestination')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={applyClientAddressAsOrigin}
                  className="text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {t('mileage.useAsOrigin')}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Address Fields with Geocoding */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="start_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-chart-1 flex items-center justify-center">
                    <span className="text-xs text-white font-bold">A</span>
                  </div>
                  {t('mileage.startAddress')}
                </FormLabel>
                <FormControl>
                  <AddressAutocomplete
                    value={field.value || ''}
                    onChange={(address) => field.onChange(address)}
                    onCoordinatesChange={(lat, lng) => {
                      form.setValue('start_lat', lat);
                      form.setValue('start_lng', lng);
                    }}
                    placeholder={t('mileage.startAddressPlaceholder')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-chart-2 flex items-center justify-center">
                    <span className="text-xs text-white font-bold">B</span>
                  </div>
                  {t('mileage.endAddress')}
                </FormLabel>
                <FormControl>
                  <AddressAutocomplete
                    value={field.value || ''}
                    onChange={(address) => field.onChange(address)}
                    onCoordinatesChange={(lat, lng) => {
                      form.setValue('end_lat', lat);
                      form.setValue('end_lng', lng);
                    }}
                    placeholder={t('mileage.endAddressPlaceholder')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* OSRM Distance Calculation Result */}
        {(isCalculatingDistance || calculatedDistance) && (
          <Alert className="bg-chart-1/10 border-chart-1/30">
            <Route className="h-4 w-4 text-chart-1" />
            <AlertDescription className="flex items-center justify-between">
              {isCalculatingDistance ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{t('mileage.calculatingDistance')}</span>
                </div>
              ) : calculatedDistance ? (
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {t('mileage.calculatedDistance')}: <strong>{calculatedDistance} km</strong>
                    </span>
                    {calculatedDuration && (
                      <span className="text-xs text-muted-foreground">
                        {t('mileage.estimatedTime')}: ~{calculatedDuration} min
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={applyCalculatedDistance}
                    className="text-xs shrink-0"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    {t('mileage.applyDistance')}
                  </Button>
                </div>
              ) : null}
            </AlertDescription>
          </Alert>
        )}

        {/* Route Preview */}
        {watchStartAddress && watchEndAddress && (
          <div className="rounded-lg border p-3">
            <MileageRoutePreview
              startAddress={watchStartAddress}
              endAddress={watchEndAddress}
              startLat={watchStartLat}
              startLng={watchStartLng}
              endLat={watchEndLat}
              endLng={watchEndLng}
              kilometers={watchKilometers || 0}
              compact={false}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="route"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('mileage.route')}</FormLabel>
              <FormControl>
                <Input placeholder={t('mileage.routePlaceholder')} {...field} />
              </FormControl>
              <FormDescription className="text-xs">
                {t('mileage.routeAutoGenerated')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('mileage.purpose')}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={t('mileage.purposePlaceholder')} 
                  className="resize-none"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Deduction Preview */}
        {watchKilometers > 0 && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <h4 className="font-medium text-sm">{t('mileage.deductionPreview')}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">{t('mileage.estimatedDeduction')}</span>
              <span className="font-bold text-chart-1">${estimatedDeduction.deductible.toFixed(2)}</span>
              <span className="text-muted-foreground">{t('mileage.rateApplied')}</span>
              <span>${estimatedDeduction.rate.toFixed(2)}/km</span>
              <span className="text-muted-foreground">{t('mileage.yearToDateKm')}</span>
              <span>{yearToDateKm.toFixed(1)} km</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('mileage.craRateNote')}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </Form>
  );
};
