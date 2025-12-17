import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, addMonths, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronLeft, ChevronRight, Car, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface TripCalendarPreviewProps {
  startDate: Date;
  endDate?: Date | null;
  recurrence: string;
  recurrenceDays?: number[] | null;
  exceptionDates?: Date[] | null;
  specificDates?: Date[] | null;
  kilometers: number;
  deductionPerTrip: number;
}

export const TripCalendarPreview = ({
  startDate,
  endDate,
  recurrence,
  recurrenceDays,
  exceptionDates,
  specificDates,
  kilometers,
  deductionPerTrip,
}: TripCalendarPreviewProps) => {
  const { t } = useLanguage();
  const [viewMonth, setViewMonth] = useState(startDate);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate which days are trip days
  const tripDays = useMemo(() => {
    if (recurrence === 'one_time') {
      return [startDate];
    }

    if (recurrence === 'irregular') {
      return specificDates || [];
    }

    const effectiveEnd = endDate || addMonths(startDate, 6);
    const allDays = eachDayOfInterval({ 
      start: startDate > monthStart ? startDate : monthStart, 
      end: effectiveEnd < monthEnd ? effectiveEnd : monthEnd 
    });

    let matchingDays: Date[] = [];

    if (recurrence === 'daily') {
      if (recurrenceDays?.length) {
        matchingDays = allDays.filter(day => recurrenceDays.includes(getDay(day)));
      } else {
        matchingDays = allDays;
      }
    } else if (recurrence === 'weekly' || recurrence === 'biweekly') {
      const selectedDays = recurrenceDays?.length ? recurrenceDays : [getDay(startDate)];
      matchingDays = allDays.filter(day => selectedDays.includes(getDay(day)));
      
      if (recurrence === 'biweekly') {
        matchingDays = matchingDays.filter((_, idx) => idx % 2 === 0);
      }
    } else if (recurrence === 'monthly') {
      const dayOfMonth = startDate.getDate();
      matchingDays = allDays.filter(day => day.getDate() === dayOfMonth);
    }

    // Remove exception dates
    if (exceptionDates?.length) {
      matchingDays = matchingDays.filter(day => 
        !exceptionDates.some(excDate => isSameDay(day, excDate))
      );
    }

    return matchingDays;
  }, [recurrence, startDate, endDate, recurrenceDays, exceptionDates, specificDates, monthStart, monthEnd]);

  // Calculate stats for current month view
  const monthStats = useMemo(() => {
    const tripsThisMonth = tripDays.filter(d => isSameMonth(d, viewMonth)).length;
    const kmThisMonth = tripsThisMonth * kilometers;
    const deductionThisMonth = tripsThisMonth * deductionPerTrip;
    
    return {
      trips: tripsThisMonth,
      km: kmThisMonth,
      deduction: deductionThisMonth,
    };
  }, [tripDays, viewMonth, kilometers, deductionPerTrip]);

  const isExceptionDay = (day: Date) => {
    return exceptionDates?.some(excDate => isSameDay(day, excDate)) || false;
  };

  const isTripDay = (day: Date) => {
    return tripDays.some(tripDate => isSameDay(day, tripDate));
  };

  const weekDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const firstDayOfMonth = getDay(monthStart);

  return (
    <div className="rounded-lg border bg-gradient-to-br from-chart-1/5 to-chart-2/5 p-4 space-y-4">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setViewMonth(prev => addMonths(prev, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h4 className="font-medium text-sm capitalize">
          {format(viewMonth, 'MMMM yyyy', { locale: es })}
        </h4>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setViewMonth(prev => addMonths(prev, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Mini calendar */}
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map((day, idx) => (
          <div key={idx} className="text-center text-[10px] text-muted-foreground font-medium py-1">
            {day}
          </div>
        ))}
        
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
          <div key={`empty-${idx}`} className="aspect-square" />
        ))}
        
        {/* Day cells */}
        {daysInMonth.map((day) => {
          const isTrip = isTripDay(day);
          const isException = isExceptionDay(day);
          const today = isToday(day);
          
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "aspect-square flex items-center justify-center text-[10px] rounded-sm transition-colors relative",
                isTrip && "bg-chart-1 text-white font-bold",
                isException && "bg-destructive/20 text-destructive line-through",
                !isTrip && !isException && "text-muted-foreground",
                today && "ring-2 ring-primary ring-offset-1"
              )}
            >
              {day.getDate()}
              {isTrip && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/80" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-chart-1" />
          <span>{t('mileage.tripDay')}</span>
        </div>
        {exceptionDates?.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-destructive/20 border border-destructive/50" />
            <span>{t('mileage.exceptionDay')}</span>
          </div>
        )}
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-chart-1">
            <Car className="h-3 w-3" />
            <span className="text-lg font-bold">{monthStats.trips}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">{t('mileage.trips')}</span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-primary">
            <TrendingUp className="h-3 w-3" />
            <span className="text-lg font-bold">{monthStats.km.toFixed(0)}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">km</span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-chart-2">
            <DollarSign className="h-3 w-3" />
            <span className="text-lg font-bold">{monthStats.deduction.toFixed(0)}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">{t('mileage.deduction')}</span>
        </div>
      </div>
    </div>
  );
};
