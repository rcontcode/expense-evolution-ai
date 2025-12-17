import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, MapPin, Navigation, Sparkles, Building2, Loader2, Route, RotateCcw, Repeat } from 'lucide-react';
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
import { mileageSchema, MileageFormValues, RECURRENCE_TYPES } from '@/lib/validations/mileage.schema';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [isRoundTrip, setIsRoundTrip] = useState(false);

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
      recurrence: (initialData as any)?.recurrence || 'one_time',
      recurrence_end_date: (initialData as any)?.recurrence_end_date ? new Date((initialData as any).recurrence_end_date) : null,
      recurrence_days: (initialData as any)?.recurrence_days || null,
    },
  });

  const watchRecurrence = form.watch('recurrence');

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

  const applyCalculatedDistance = (roundTrip: boolean = isRoundTrip) => {
    if (calculatedDistance) {
      const distance = roundTrip ? calculatedDistance * 2 : calculatedDistance;
      form.setValue('kilometers', Math.round(distance * 10) / 10);
    }
  };

  const displayDistance = isRoundTrip && calculatedDistance ? calculatedDistance * 2 : calculatedDistance;
  const displayDuration = isRoundTrip && calculatedDuration ? calculatedDuration * 2 : calculatedDuration;

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

        {/* Address Fields with Geocoding - PRIMERO para entrada rápida */}
        <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Navigation className="h-4 w-4 text-primary" />
            {t('mileage.routeAddresses')}
          </div>
          
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
                    showLocationButton={false}
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
                    showLocationButton={false}
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

        {/* OSRM Distance Calculation Result */}
        {(isCalculatingDistance || calculatedDistance) && (
          <Alert className="bg-chart-1/10 border-chart-1/30">
            <Route className="h-4 w-4 text-chart-1" />
            <AlertDescription className="flex flex-col gap-3">
              {isCalculatingDistance ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{t('mileage.calculatingDistance')}</span>
                </div>
              ) : calculatedDistance ? (
                <>
                  <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {t('mileage.calculatedDistance')}: <strong>{displayDistance} km</strong>
                        {isRoundTrip && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({calculatedDistance} km × 2)
                          </span>
                        )}
                      </span>
                      {displayDuration && (
                        <span className="text-xs text-muted-foreground">
                          {t('mileage.estimatedTime')}: ~{displayDuration} min
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => applyCalculatedDistance()}
                      className="text-xs shrink-0"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {t('mileage.applyDistance')}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <RotateCcw className="h-4 w-4 text-muted-foreground" />
                      {t('mileage.roundTrip')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsRoundTrip(!isRoundTrip)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                        isRoundTrip ? "bg-chart-1" : "bg-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition-transform",
                          isRoundTrip ? "translate-x-4" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                </>
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

        {/* Recurrence Section */}
        <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Repeat className="h-4 w-4 text-muted-foreground" />
            {t('mileage.recurrence')}
          </div>
          
          <FormField
            control={form.control}
            name="recurrence"
            render={({ field }) => (
              <FormItem>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="one_time">{t('mileage.recurrenceOneTime')}</SelectItem>
                    <SelectItem value="daily">{t('mileage.recurrenceDaily')}</SelectItem>
                    <SelectItem value="weekly">{t('mileage.recurrenceWeekly')}</SelectItem>
                    <SelectItem value="biweekly">{t('mileage.recurrenceBiweekly')}</SelectItem>
                    <SelectItem value="monthly">{t('mileage.recurrenceMonthly')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Days of week selection for weekly recurrence */}
          {watchRecurrence === 'weekly' && (
            <FormField
              control={form.control}
              name="recurrence_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">{t('mileage.selectDays')}</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { day: 0, label: t('mileage.daySun') },
                      { day: 1, label: t('mileage.dayMon') },
                      { day: 2, label: t('mileage.dayTue') },
                      { day: 3, label: t('mileage.dayWed') },
                      { day: 4, label: t('mileage.dayThu') },
                      { day: 5, label: t('mileage.dayFri') },
                      { day: 6, label: t('mileage.daySat') },
                    ].map(({ day, label }) => {
                      const isSelected = (field.value || []).includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const currentDays = field.value || [];
                            const newDays = isSelected
                              ? currentDays.filter((d: number) => d !== day)
                              : [...currentDays, day].sort();
                            field.onChange(newDays.length > 0 ? newDays : null);
                          }}
                          className={cn(
                            "px-3 py-1.5 text-xs rounded-md border transition-colors",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-muted"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* End date for recurring trips */}
          {watchRecurrence !== 'one_time' && (
            <FormField
              control={form.control}
              name="recurrence_end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">{t('mileage.recurrenceEndDate')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>{t('mileage.noEndDate')}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription className="text-xs">
                    {t('mileage.recurrenceEndDateHint')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

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
