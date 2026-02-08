import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, ThermometerSun, Snowflake, Zap } from 'lucide-react';
import { 
  type LeadPriority, 
  getPriorityLabel, 
  getPriorityColors 
} from '@/hooks/admin/useLeadScoring';
import { cn } from '@/lib/utils';

interface LeadScoreBadgeProps {
  score: number;
  priority: LeadPriority;
  showScore?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const priorityIcons: Record<LeadPriority, React.ReactNode> = {
  hot: <Flame className="h-3 w-3" />,
  warm: <ThermometerSun className="h-3 w-3" />,
  cool: <Snowflake className="h-3 w-3" />,
  cold: <Zap className="h-3 w-3" />,
};

export function LeadScoreBadge({
  score,
  priority,
  showScore = true,
  showLabel = true,
  size = 'md',
  className,
}: LeadScoreBadgeProps) {
  const colors = getPriorityColors(priority);
  const label = getPriorityLabel(priority);

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge 
        variant="outline" 
        className={cn(
          'font-semibold flex items-center gap-1 border',
          colors.badge,
          sizeClasses[size]
        )}
      >
        {priorityIcons[priority]}
        {showLabel && <span>{label}</span>}
        {showScore && <span className="opacity-75">({score})</span>}
      </Badge>
    </div>
  );
}

interface LeadScoreProgressProps {
  score: number;
  priority: LeadPriority;
  showNumber?: boolean;
  className?: string;
}

export function LeadScoreProgress({
  score,
  priority,
  showNumber = true,
  className,
}: LeadScoreProgressProps) {
  const colors = getPriorityColors(priority);

  const progressColor = {
    hot: 'bg-red-500',
    warm: 'bg-orange-500',
    cool: 'bg-blue-500',
    cold: 'bg-gray-400',
  }[priority];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Progress 
        value={score} 
        className="h-2 w-16"
        indicatorClassName={progressColor}
      />
      {showNumber && (
        <span className={cn('text-xs font-medium', colors.text)}>
          {score}
        </span>
      )}
    </div>
  );
}

interface LeadPriorityIndicatorProps {
  priority: LeadPriority;
  className?: string;
}

export function LeadPriorityIndicator({ priority, className }: LeadPriorityIndicatorProps) {
  const colors = getPriorityColors(priority);
  
  return (
    <div 
      className={cn(
        'w-2 h-2 rounded-full',
        priority === 'hot' && 'bg-red-500 animate-pulse',
        priority === 'warm' && 'bg-orange-500',
        priority === 'cool' && 'bg-blue-500',
        priority === 'cold' && 'bg-gray-400',
        className
      )}
    />
  );
}
