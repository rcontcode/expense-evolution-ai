import { cn } from '@/lib/utils';
import { Hand } from 'lucide-react';

interface MobileChartHintProps {
  language?: 'es' | 'en';
  className?: string;
}

/**
 * A small hint that appears only on mobile to tell users they can tap the chart
 * to see detailed information (since hover doesn't work on touch devices)
 */
export function MobileChartHint({ language = 'es', className }: MobileChartHintProps) {
  return (
    <div className={cn(
      "flex sm:hidden items-center justify-center gap-1.5 text-[10px] text-muted-foreground py-1",
      className
    )}>
      <Hand className="h-3 w-3 animate-pulse" />
      <span>
        {language === 'es' 
          ? 'Toca el gráfico para ver detalles' 
          : 'Tap chart to see details'}
      </span>
    </div>
  );
}
