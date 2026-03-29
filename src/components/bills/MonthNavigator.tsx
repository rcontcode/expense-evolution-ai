import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, subMonths, format, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface MonthNavigatorProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function MonthNavigator({ value, onChange, className }: MonthNavigatorProps) {
  const { language } = useLanguage();
  const l = language === 'es';
  const isCurrentMonth = isSameMonth(value, new Date());

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange(subMonths(value, 1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-semibold min-w-[140px] text-center capitalize">
        {format(value, 'MMMM yyyy', { locale: l ? es : undefined })}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange(addMonths(value, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      {!isCurrentMonth && (
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7 ml-1"
          onClick={() => onChange(new Date())}
        >
          {l ? 'Hoy' : 'Today'}
        </Button>
      )}
    </div>
  );
}
