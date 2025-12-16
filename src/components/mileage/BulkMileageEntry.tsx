import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save, Loader2, Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface BulkMileageEntryProps {
  onComplete: () => void;
}

interface TripEntry {
  id: string;
  date: Date;
  origin: string;
  destination: string;
  kilometers: string;
  purpose: string;
}

const createEmptyEntry = (): TripEntry => ({
  id: crypto.randomUUID(),
  date: new Date(),
  origin: '',
  destination: '',
  kilometers: '',
  purpose: ''
});

export const BulkMileageEntry = ({ onComplete }: BulkMileageEntryProps) => {
  const { toast } = useToast();
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [entries, setEntries] = useState<TripEntry[]>([
    createEmptyEntry(),
    createEmptyEntry(),
    createEmptyEntry()
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const t = {
    es: {
      title: 'Entrada Rápida de Viajes',
      description: 'Agrega múltiples viajes sin tener que abrir y cerrar diálogos',
      date: 'Fecha',
      origin: 'Origen',
      destination: 'Destino',
      kilometers: 'Km',
      purpose: 'Propósito',
      addRow: 'Agregar Fila',
      saveAll: 'Guardar Todos',
      saving: 'Guardando...',
      successMessage: 'viajes guardados correctamente',
      errorMessage: 'Error al guardar viajes',
      noValidEntries: 'Completa al menos origen, destino y kilómetros',
      quickDates: 'Fechas Rápidas',
      today: 'Hoy',
      yesterday: 'Ayer',
      daysAgo: 'hace {n} días'
    },
    en: {
      title: 'Quick Trip Entry',
      description: 'Add multiple trips without opening and closing dialogs',
      date: 'Date',
      origin: 'Origin',
      destination: 'Destination',
      kilometers: 'Km',
      purpose: 'Purpose',
      addRow: 'Add Row',
      saveAll: 'Save All',
      saving: 'Saving...',
      successMessage: 'trips saved successfully',
      errorMessage: 'Error saving trips',
      noValidEntries: 'Complete at least origin, destination and kilometers',
      quickDates: 'Quick Dates',
      today: 'Today',
      yesterday: 'Yesterday',
      daysAgo: '{n} days ago'
    }
  };

  const texts = t[language] || t.es;

  const updateEntry = (id: string, field: keyof TripEntry, value: any) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const addEntry = () => {
    setEntries(prev => [...prev, createEmptyEntry()]);
  };

  const getValidEntries = () => {
    return entries.filter(entry => 
      entry.origin.trim() && 
      entry.destination.trim() && 
      parseFloat(entry.kilometers) > 0
    );
  };

  const saveAll = async () => {
    if (!user) return;

    const validEntries = getValidEntries();
    
    if (validEntries.length === 0) {
      toast({
        title: texts.noValidEntries,
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase.from('mileage').insert(
        validEntries.map(entry => ({
          user_id: user.id,
          date: format(entry.date, 'yyyy-MM-dd'),
          route: `${entry.origin} → ${entry.destination}`,
          kilometers: parseFloat(entry.kilometers),
          purpose: entry.purpose || null,
          start_address: entry.origin,
          end_address: entry.destination
        }))
      );

      if (error) throw error;

      toast({
        title: `${validEntries.length} ${texts.successMessage}`,
      });

      queryClient.invalidateQueries({ queryKey: ['mileage'] });
      queryClient.invalidateQueries({ queryKey: ['mileage-summary'] });
      
      onComplete();

    } catch (error) {
      console.error('Error saving trips:', error);
      toast({
        title: texts.errorMessage,
        description: String(error),
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const validCount = getValidEntries().length;

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {texts.description}
      </div>

      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div 
            key={entry.id} 
            className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg bg-muted/30"
          >
            <div className="col-span-2">
              {index === 0 && (
                <Label className="text-xs mb-1 block">{texts.date}</Label>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9 text-xs",
                      !entry.date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-1 h-3 w-3" />
                    {format(entry.date, 'dd/MM')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex gap-1 p-2 border-b">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => updateEntry(entry.id, 'date', new Date())}
                    >
                      {texts.today}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => updateEntry(entry.id, 'date', subDays(new Date(), 1))}
                    >
                      {texts.yesterday}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => updateEntry(entry.id, 'date', subDays(new Date(), 7))}
                    >
                      -7d
                    </Button>
                  </div>
                  <CalendarComponent
                    mode="single"
                    selected={entry.date}
                    onSelect={(date) => date && updateEntry(entry.id, 'date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="col-span-3">
              {index === 0 && (
                <Label className="text-xs mb-1 block">{texts.origin}</Label>
              )}
              <Input
                value={entry.origin}
                onChange={(e) => updateEntry(entry.id, 'origin', e.target.value)}
                placeholder={texts.origin}
                className="h-9 text-sm"
              />
            </div>

            <div className="col-span-3">
              {index === 0 && (
                <Label className="text-xs mb-1 block">{texts.destination}</Label>
              )}
              <Input
                value={entry.destination}
                onChange={(e) => updateEntry(entry.id, 'destination', e.target.value)}
                placeholder={texts.destination}
                className="h-9 text-sm"
              />
            </div>

            <div className="col-span-1">
              {index === 0 && (
                <Label className="text-xs mb-1 block">{texts.kilometers}</Label>
              )}
              <Input
                type="number"
                step="0.1"
                value={entry.kilometers}
                onChange={(e) => updateEntry(entry.id, 'kilometers', e.target.value)}
                placeholder="0"
                className="h-9 text-sm"
              />
            </div>

            <div className="col-span-2">
              {index === 0 && (
                <Label className="text-xs mb-1 block">{texts.purpose}</Label>
              )}
              <Input
                value={entry.purpose}
                onChange={(e) => updateEntry(entry.id, 'purpose', e.target.value)}
                placeholder={texts.purpose}
                className="h-9 text-sm"
              />
            </div>

            <div className="col-span-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => removeEntry(entry.id)}
                disabled={entries.length === 1}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={addEntry}>
          <Plus className="h-4 w-4 mr-1" />
          {texts.addRow}
        </Button>

        <Button onClick={saveAll} disabled={isSaving || validCount === 0}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {texts.saving}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {texts.saveAll} ({validCount})
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
