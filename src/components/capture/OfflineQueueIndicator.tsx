import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Cloud, 
  CloudOff, 
  Upload, 
  AlertCircle,
  CheckCircle,
  Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface OfflineQueueIndicatorProps {
  pendingCount: number;
  syncingCount: number;
  errorCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  onSync?: () => void;
}

export function OfflineQueueIndicator({
  pendingCount,
  syncingCount,
  errorCount,
  isOnline,
  isSyncing,
  onSync,
}: OfflineQueueIndicatorProps) {
  const { language } = useLanguage();
  
  const totalPending = pendingCount + syncingCount;
  const hasItems = totalPending > 0 || errorCount > 0;

  if (!hasItems && isOnline) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        className="fixed right-4 top-20 z-40"
      >
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border backdrop-blur-sm",
          isOnline 
            ? "bg-card/95 border-primary/30" 
            : "bg-amber-500/10 border-amber-500/30"
        )}>
          {/* Status icon */}
          {isSyncing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Upload className="h-4 w-4 text-primary" />
            </motion.div>
          ) : isOnline ? (
            <Cloud className="h-4 w-4 text-emerald-500" />
          ) : (
            <CloudOff className="h-4 w-4 text-amber-500" />
          )}

          {/* Counts */}
          <div className="flex items-center gap-1.5">
            {totalPending > 0 && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "h-5 px-1.5 text-xs font-medium",
                  isSyncing && "animate-pulse"
                )}
              >
                {isSyncing ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : null}
                {totalPending}
              </Badge>
            )}
            
            {errorCount > 0 && (
              <Badge 
                variant="destructive" 
                className="h-5 px-1.5 text-xs font-medium"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                {errorCount}
              </Badge>
            )}
          </div>

          {/* Sync button */}
          {isOnline && totalPending > 0 && !isSyncing && onSync && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={onSync}
            >
              {language === 'es' ? 'Sincronizar' : 'Sync'}
            </Button>
          )}
        </div>

        {/* Status text below */}
        {!isOnline && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-center text-amber-600 dark:text-amber-400 mt-1"
          >
            {language === 'es' 
              ? 'Guardando localmente...' 
              : 'Saving locally...'}
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
