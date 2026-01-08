import { useEffect, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FOCUS_AREAS, FOCUS_AREA_ORDER, FocusAreaId } from '@/lib/constants/focus-areas';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface FocusSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeAreas: FocusAreaId[];
  onSaveActiveAreas: (areas: FocusAreaId[]) => void;
}

export const FocusSelector = ({
  open,
  onOpenChange,
  activeAreas,
  onSaveActiveAreas,
}: FocusSelectorProps) => {
  const { language } = useLanguage();
  const [selectedAreas, setSelectedAreas] = useState<FocusAreaId[]>(activeAreas);

  // Keep modal selection in sync with saved preferences when opening
  useEffect(() => {
    if (open) setSelectedAreas(activeAreas);
  }, [open, activeAreas]);

  const handleToggleArea = (areaId: FocusAreaId) => {
    setSelectedAreas((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId]
    );
  };

  const handleSelectAll = () => {
    setSelectedAreas(FOCUS_AREA_ORDER);
  };

  const handleSave = () => {
    onSaveActiveAreas(selectedAreas);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {language === 'es' ? '¿En qué te enfocas hoy?' : 'What are you focusing on today?'}
          </DialogTitle>
          <DialogDescription>
            {language === 'es'
              ? 'Selecciona las áreas que quieres ver. Puedes cambiar esto en cualquier momento.'
              : 'Select the areas you want to see. You can change this anytime.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {FOCUS_AREA_ORDER.map((areaId) => {
            const area = FOCUS_AREAS[areaId];
            const isSelected = selectedAreas.includes(areaId);

            return (
              <button
                key={areaId}
                onClick={() => handleToggleArea(areaId)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all',
                  'hover:shadow-md',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/30'
                )}
                style={{
                  borderColor: isSelected ? area.color : undefined,
                  backgroundColor: isSelected ? area.bgColor : undefined,
                }}
              >
                <span className="text-2xl">{area.emoji}</span>
                <div className="flex-1 text-left">
                  <div
                    className="font-medium"
                    style={{ color: isSelected ? area.color : undefined }}
                  >
                    {area.name[language as 'es' | 'en'] || area.name.es}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {area.description[language as 'es' | 'en'] || area.description.es}
                  </div>
                </div>
                {isSelected && (
                  <Check className="h-5 w-5" style={{ color: area.color }} />
                )}
              </button>
            );
          })}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSelectAll}
            className="w-full sm:w-auto"
          >
            {language === 'es' ? 'Seleccionar Todo' : 'Select All'}
          </Button>
          <Button
            onClick={handleSave}
            className="w-full sm:w-auto"
            disabled={selectedAreas.length === 0}
          >
            {language === 'es' ? 'Continuar' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

