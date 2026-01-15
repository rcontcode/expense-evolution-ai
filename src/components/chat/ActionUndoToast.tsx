import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionUndoToastProps {
  action: {
    type: string;
    description: string;
    undoCallback?: () => void;
  } | null;
  language: 'es' | 'en';
  duration?: number;
  onDismiss: () => void;
}

export const ActionUndoToast: React.FC<ActionUndoToastProps> = ({
  action,
  language,
  duration = 5000,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (action) {
      setIsVisible(true);
      setProgress(100);

      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);

        if (remaining > 0) {
          requestAnimationFrame(animate);
        } else {
          setIsVisible(false);
          onDismiss();
        }
      };

      const animationId = requestAnimationFrame(animate);

      return () => cancelAnimationFrame(animationId);
    } else {
      setIsVisible(false);
    }
  }, [action, duration, onDismiss]);

  const handleUndo = () => {
    if (action?.undoCallback) {
      action.undoCallback();
    }
    setIsVisible(false);
    onDismiss();
  };

  const isSpanish = language === 'es';

  return (
    <AnimatePresence>
      {isVisible && action && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={cn(
            "fixed bottom-24 left-1/2 -translate-x-1/2 z-[60]",
            "bg-background/95 backdrop-blur-lg",
            "border border-border rounded-xl shadow-2xl",
            "overflow-hidden min-w-[280px] max-w-[380px]"
          )}
        >
          {/* Progress bar */}
          <div className="h-1 bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          <div className="p-3">
            <div className="flex items-center gap-3">
              {/* Success icon */}
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>

              {/* Action description */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {action.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isSpanish ? 'Acción completada' : 'Action completed'}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                {action.undoCallback && (
                  <button
                    onClick={handleUndo}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1.5 rounded-lg",
                      "bg-primary/10 text-primary text-xs font-medium",
                      "hover:bg-primary/20 transition-colors"
                    )}
                  >
                    <Undo2 className="h-3 w-3" />
                    {isSpanish ? 'Deshacer' : 'Undo'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsVisible(false);
                    onDismiss();
                  }}
                  className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
