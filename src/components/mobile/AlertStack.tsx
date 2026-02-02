import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AlertItem {
  id: string;
  content: ReactNode;
  type?: 'info' | 'warning' | 'success' | 'error';
  dismissible?: boolean;
}

interface AlertStackProps {
  alerts: AlertItem[];
  onDismiss?: (id: string) => void;
  className?: string;
  maxVisible?: number;
}

export function AlertStack({ 
  alerts, 
  onDismiss, 
  className,
  maxVisible = 1 
}: AlertStackProps) {
  const [expanded, setExpanded] = useState(false);
  
  if (alerts.length === 0) return null;
  
  const visibleAlerts = expanded ? alerts : alerts.slice(0, maxVisible);
  const hiddenCount = alerts.length - maxVisible;
  
  const typeStyles = {
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    error: 'bg-destructive/10 border-destructive/20 text-destructive',
  };

  return (
    <div className={cn("space-y-2", className)}>
      <AnimatePresence mode="popLayout">
        {visibleAlerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className={cn(
              "relative flex items-center gap-2 px-3 py-2 rounded-lg border text-sm",
              typeStyles[alert.type || 'info']
            )}
          >
            <div className="flex-1 min-w-0">
              {alert.content}
            </div>
            {alert.dismissible && onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
                onClick={() => onDismiss(alert.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Expand/Collapse toggle when there are hidden alerts */}
      {hiddenCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              +{hiddenCount} more alerts
            </>
          )}
        </Button>
      )}
    </div>
  );
}
