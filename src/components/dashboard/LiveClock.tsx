import { useState, useEffect } from 'react';
import { Clock, CalendarDays } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function LiveClock() {
  const { language } = useLanguage();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString(language === 'es' ? 'es-CL' : 'en-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeStr = now.toLocaleTimeString(language === 'es' ? 'es-CL' : 'en-CA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Capitalize first letter
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <CalendarDays className="h-4 w-4 text-primary/70" />
        <span className="font-medium">{formattedDate}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Clock className="h-4 w-4 text-primary/70" />
        <span className="font-mono tabular-nums">{timeStr}</span>
      </div>
    </div>
  );
}
