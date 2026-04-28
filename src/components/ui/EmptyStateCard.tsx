import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  children?: ReactNode;
  className?: string;
  /** Tone of the icon background. Defaults to primary. */
  tone?: 'primary' | 'emerald' | 'violet' | 'amber';
}

const toneMap: Record<NonNullable<EmptyStateCardProps['tone']>, string> = {
  primary: 'from-primary/20 to-primary/5 text-primary',
  emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-400',
  violet: 'from-violet-500/20 to-violet-500/5 text-violet-600 dark:text-violet-400',
  amber: 'from-amber-500/20 to-amber-500/5 text-amber-600 dark:text-amber-400',
};

/**
 * Reusable empty-state card. Use across pages where data is missing,
 * to give users a clear "what to do next" instead of a blank screen.
 */
export function EmptyStateCard({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCta,
  secondaryLabel,
  onSecondary,
  children,
  className,
  tone = 'primary',
}: EmptyStateCardProps) {
  return (
    <Card className={cn('border-dashed border-2 bg-gradient-to-br from-background to-muted/30', className)}>
      <CardContent className="py-10 px-6 flex flex-col items-center text-center gap-4">
        <div
          className={cn(
            'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-inner',
            toneMap[tone],
          )}
        >
          <Icon className="h-8 w-8" strokeWidth={1.75} />
        </div>
        <div className="space-y-1.5 max-w-md">
          <h3 className="text-lg font-bold tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        {(ctaLabel || secondaryLabel) && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {ctaLabel && onCta && (
              <Button onClick={onCta} size="sm" className="gap-2">
                {ctaLabel}
              </Button>
            )}
            {secondaryLabel && onSecondary && (
              <Button onClick={onSecondary} size="sm" variant="outline" className="gap-2">
                {secondaryLabel}
              </Button>
            )}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
