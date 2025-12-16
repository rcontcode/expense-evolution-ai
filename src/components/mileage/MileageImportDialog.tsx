import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, FileSpreadsheet, MapPin, Zap, Download, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { BulkMileageEntry } from './BulkMileageEntry';

interface MileageImportDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ParsedTrip {
  date: string;
  route: string;
  kilometers: number;
  purpose?: string;
  start_address?: string;
  end_address?: string;
  start_lat?: number;
  start_lng?: number;
  end_lat?: number;
  end_lng?: number;
  valid: boolean;
  error?: string;
}

export const MileageImportDialog = ({ open, onClose }: MileageImportDialogProps) => {
  const { toast } = useToast();
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('csv');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedTrips, setParsedTrips] = useState<ParsedTrip[]>([]);
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'complete'>('upload');

  const t = {
    es: {
      title: 'Importar Viajes',
      description: 'Importa tus viajes históricos de diferentes fuentes',
      csvTab: 'CSV/Excel',
      googleTab: 'Google Maps',
      bulkTab: 'Entrada Rápida',
      csvDescription: 'Sube un archivo CSV o Excel con tus viajes',
      googleDescription: 'Importa desde tu historial de Google Maps Timeline',
      bulkDescription: 'Agrega múltiples viajes rápidamente',
      downloadTemplate: 'Descargar Plantilla CSV',
      selectFile: 'Seleccionar Archivo',
      processing: 'Procesando...',
      previewTitle: 'Vista Previa de Importación',
      validTrips: 'viajes válidos',
      invalidTrips: 'viajes con errores',
      importAll: 'Importar Todos',
      importValid: 'Importar Solo Válidos',
      cancel: 'Cancelar',
      back: 'Volver',
      successMessage: 'viajes importados correctamente',
      errorMessage: 'Error al importar viajes',
      noValidTrips: 'No se encontraron viajes válidos para importar',
      googleInstructions: [
        '1. Ve a Google Takeout (takeout.google.com)',
        '2. Selecciona solo "Historial de Ubicaciones"',
        '3. Elige formato JSON o KML',
        '4. Descarga y sube el archivo aquí'
      ],
      templateColumns: 'Columnas: Fecha, Origen, Destino, Kilómetros, Propósito (opcional)',
      dateFormats: 'Formatos de fecha aceptados: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY'
    },
    en: {
      title: 'Import Trips',
      description: 'Import your historical trips from different sources',
      csvTab: 'CSV/Excel',
      googleTab: 'Google Maps',
      bulkTab: 'Quick Entry',
      csvDescription: 'Upload a CSV or Excel file with your trips',
      googleDescription: 'Import from your Google Maps Timeline history',
      bulkDescription: 'Add multiple trips quickly',
      downloadTemplate: 'Download CSV Template',
      selectFile: 'Select File',
      processing: 'Processing...',
      previewTitle: 'Import Preview',
      validTrips: 'valid trips',
      invalidTrips: 'trips with errors',
      importAll: 'Import All',
      importValid: 'Import Valid Only',
      cancel: 'Cancel',
      back: 'Back',
      successMessage: 'trips imported successfully',
      errorMessage: 'Error importing trips',
      noValidTrips: 'No valid trips found to import',
      googleInstructions: [
        '1. Go to Google Takeout (takeout.google.com)',
        '2. Select only "Location History"',
        '3. Choose JSON or KML format',
        '4. Download and upload the file here'
      ],
      templateColumns: 'Columns: Date, Origin, Destination, Kilometers, Purpose (optional)',
      dateFormats: 'Accepted date formats: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY'
    }
  };

  const texts = t[language] || t.es;

  const downloadTemplate = () => {
    const headers = language === 'es' 
      ? 'Fecha,Origen,Destino,Kilometros,Proposito'
      : 'Date,Origin,Destination,Kilometers,Purpose';
    
    const example1 = language === 'es'
      ? '15/12/2024,Casa - Av. Principal 123,Oficina Cliente - Calle 456,25.5,Reunión con cliente'
      : '12/15/2024,Home - Main Ave 123,Client Office - Street 456,25.5,Client meeting';
    
    const example2 = language === 'es'
      ? '16/12/2024,Oficina,Aeropuerto,45,Viaje de negocios'
      : '12/16/2024,Office,Airport,45,Business trip';

    const csvContent = `${headers}\n${example1}\n${example2}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'mileage_template.csv';
    link.click();
  };

  const parseDate = (dateStr: string): Date | null => {
    const formats = [
      'dd/MM/yyyy',
      'yyyy-MM-dd',
      'dd-MM-yyyy',
      'MM/dd/yyyy',
      'd/M/yyyy',
      'yyyy/MM/dd'
    ];

    for (const fmt of formats) {
      try {
        const parsed = parse(dateStr.trim(), fmt, new Date(), { locale: language === 'es' ? es : enUS });
        if (isValid(parsed)) {
          return parsed;
        }
      } catch {
        continue;
      }
    }
    return null;
  };

  const parseCSV = (content: string): ParsedTrip[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const trips: ParsedTrip[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      if (values.length < 4) {
        trips.push({
          date: '',
          route: '',
          kilometers: 0,
          valid: false,
          error: language === 'es' ? 'Columnas insuficientes' : 'Insufficient columns'
        });
        continue;
      }

      const [dateStr, origin, destination, kmStr, purpose] = values;
      const parsedDate = parseDate(dateStr);
      const km = parseFloat(kmStr.replace(',', '.'));

      if (!parsedDate) {
        trips.push({
          date: dateStr,
          route: `${origin} → ${destination}`,
          kilometers: km || 0,
          purpose,
          valid: false,
          error: language === 'es' ? 'Fecha inválida' : 'Invalid date'
        });
        continue;
      }

      if (isNaN(km) || km <= 0) {
        trips.push({
          date: format(parsedDate, 'yyyy-MM-dd'),
          route: `${origin} → ${destination}`,
          kilometers: 0,
          purpose,
          valid: false,
          error: language === 'es' ? 'Kilómetros inválidos' : 'Invalid kilometers'
        });
        continue;
      }

      trips.push({
        date: format(parsedDate, 'yyyy-MM-dd'),
        route: `${origin} → ${destination}`,
        kilometers: km,
        purpose: purpose || undefined,
        start_address: origin,
        end_address: destination,
        valid: true
      });
    }

    return trips;
  };

  const parseGoogleTimeline = (content: string, fileName: string): ParsedTrip[] => {
    const trips: ParsedTrip[] = [];

    try {
      if (fileName.endsWith('.json')) {
        const data = JSON.parse(content);
        
        // Handle different Google Timeline JSON formats
        const locations = data.timelineObjects || data.locations || [];
        
        locations.forEach((item: any) => {
          if (item.activitySegment) {
            const segment = item.activitySegment;
            if (segment.activityType === 'IN_VEHICLE' || segment.activityType === 'DRIVING') {
              const startLat = segment.startLocation?.latitudeE7 / 1e7;
              const startLng = segment.startLocation?.longitudeE7 / 1e7;
              const endLat = segment.endLocation?.latitudeE7 / 1e7;
              const endLng = segment.endLocation?.longitudeE7 / 1e7;
              const distance = segment.distance ? segment.distance / 1000 : 0; // Convert to km

              if (distance > 0.5) { // Only trips > 0.5km
                const timestamp = segment.duration?.startTimestamp || segment.startTimestamp;
                const date = timestamp ? new Date(timestamp) : new Date();

                trips.push({
                  date: format(date, 'yyyy-MM-dd'),
                  route: `${startLat?.toFixed(4)}, ${startLng?.toFixed(4)} → ${endLat?.toFixed(4)}, ${endLng?.toFixed(4)}`,
                  kilometers: Math.round(distance * 10) / 10,
                  start_lat: startLat,
                  start_lng: startLng,
                  end_lat: endLat,
                  end_lng: endLng,
                  valid: true
                });
              }
            }
          }
        });
      } else if (fileName.endsWith('.kml')) {
        // Basic KML parsing for placemarks with coordinates
        const placemarkRegex = /<Placemark>[\s\S]*?<\/Placemark>/g;
        const matches = content.match(placemarkRegex) || [];
        
        matches.forEach((placemark: string) => {
          const coordsMatch = placemark.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
          const nameMatch = placemark.match(/<name>([\s\S]*?)<\/name>/);
          const timeMatch = placemark.match(/<when>([\s\S]*?)<\/when>/);
          
          if (coordsMatch) {
            const coords = coordsMatch[1].trim().split(/\s+/);
            if (coords.length >= 2) {
              const [startCoord, endCoord] = [coords[0], coords[coords.length - 1]];
              const [startLng, startLat] = startCoord.split(',').map(Number);
              const [endLng, endLat] = endCoord.split(',').map(Number);
              
              const date = timeMatch ? new Date(timeMatch[1]) : new Date();
              
              trips.push({
                date: isValid(date) ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                route: nameMatch ? nameMatch[1] : `${startLat?.toFixed(4)}, ${startLng?.toFixed(4)} → ${endLat?.toFixed(4)}, ${endLng?.toFixed(4)}`,
                kilometers: 0, // Will need manual entry or OSRM calculation
                start_lat: startLat,
                start_lng: startLng,
                end_lat: endLat,
                end_lng: endLng,
                valid: true
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('Error parsing Google Timeline:', error);
    }

    return trips;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'csv' | 'google') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const content = await file.text();
      let trips: ParsedTrip[];

      if (type === 'csv') {
        trips = parseCSV(content);
      } else {
        trips = parseGoogleTimeline(content, file.name);
      }

      if (trips.length === 0) {
        toast({
          title: language === 'es' ? 'Sin datos' : 'No data',
          description: language === 'es' ? 'No se encontraron viajes en el archivo' : 'No trips found in the file',
          variant: 'destructive'
        });
      } else {
        setParsedTrips(trips);
        setImportStep('preview');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: texts.errorMessage,
        description: String(error),
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const importTrips = async (validOnly: boolean) => {
    if (!user) return;

    const tripsToImport = validOnly ? parsedTrips.filter(t => t.valid) : parsedTrips.filter(t => t.valid);
    
    if (tripsToImport.length === 0) {
      toast({
        title: texts.noValidTrips,
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await supabase.from('mileage').insert(
        tripsToImport.map(trip => ({
          user_id: user.id,
          date: trip.date,
          route: trip.route,
          kilometers: trip.kilometers,
          purpose: trip.purpose,
          start_address: trip.start_address,
          end_address: trip.end_address,
          start_lat: trip.start_lat,
          start_lng: trip.start_lng,
          end_lat: trip.end_lat,
          end_lng: trip.end_lng
        }))
      );

      if (error) throw error;

      toast({
        title: `${tripsToImport.length} ${texts.successMessage}`,
      });

      queryClient.invalidateQueries({ queryKey: ['mileage'] });
      queryClient.invalidateQueries({ queryKey: ['mileage-summary'] });
      
      setImportStep('complete');
      setTimeout(() => {
        onClose();
        setParsedTrips([]);
        setImportStep('upload');
      }, 1500);

    } catch (error) {
      console.error('Error importing trips:', error);
      toast({
        title: texts.errorMessage,
        description: String(error),
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedTrips.filter(t => t.valid).length;
  const invalidCount = parsedTrips.filter(t => !t.valid).length;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        {importStep === 'upload' && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="csv" className="flex items-center gap-1">
                <FileSpreadsheet className="h-4 w-4" />
                {texts.csvTab}
              </TabsTrigger>
              <TabsTrigger value="google" className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {texts.googleTab}
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                {texts.bulkTab}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="csv" className="space-y-4 mt-4">
              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p>{texts.csvDescription}</p>
                  <p className="text-xs text-muted-foreground">{texts.templateColumns}</p>
                  <p className="text-xs text-muted-foreground">{texts.dateFormats}</p>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadTemplate} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  {texts.downloadTemplate}
                </Button>
              </div>

              <div className="space-y-2">
                <Label>{texts.selectFile}</Label>
                <Input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => handleFileUpload(e, 'csv')}
                  disabled={isProcessing}
                />
              </div>
            </TabsContent>

            <TabsContent value="google" className="space-y-4 mt-4">
              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription>
                  <p className="mb-2">{texts.googleDescription}</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {texts.googleInstructions.map((instruction, i) => (
                      <li key={i}>{instruction}</li>
                    ))}
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>{texts.selectFile}</Label>
                <Input
                  type="file"
                  accept=".json,.kml"
                  onChange={(e) => handleFileUpload(e, 'google')}
                  disabled={isProcessing}
                />
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="mt-4">
              <BulkMileageEntry onComplete={onClose} />
            </TabsContent>
          </Tabs>
        )}

        {importStep === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span>{validCount} {texts.validTrips}</span>
              </div>
              {invalidCount > 0 && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span>{invalidCount} {texts.invalidTrips}</span>
                </div>
              )}
            </div>

            <div className="max-h-[300px] overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">{language === 'es' ? 'Estado' : 'Status'}</th>
                    <th className="text-left p-2">{language === 'es' ? 'Fecha' : 'Date'}</th>
                    <th className="text-left p-2">{language === 'es' ? 'Ruta' : 'Route'}</th>
                    <th className="text-right p-2">Km</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedTrips.map((trip, i) => (
                    <tr key={i} className={trip.valid ? '' : 'bg-destructive/10'}>
                      <td className="p-2">
                        {trip.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-xs text-destructive">{trip.error}</span>
                        )}
                      </td>
                      <td className="p-2">{trip.date}</td>
                      <td className="p-2 truncate max-w-[200px]">{trip.route}</td>
                      <td className="p-2 text-right">{trip.kilometers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setParsedTrips([]); setImportStep('upload'); }}>
                {texts.back}
              </Button>
              <Button onClick={() => importTrips(true)} disabled={isProcessing || validCount === 0}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {texts.processing}
                  </>
                ) : (
                  `${texts.importValid} (${validCount})`
                )}
              </Button>
            </div>
          </div>
        )}

        {importStep === 'complete' && (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
            <p className="text-lg font-medium">
              {validCount} {texts.successMessage}
            </p>
          </div>
        )}

        {isProcessing && importStep === 'upload' && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">{texts.processing}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
