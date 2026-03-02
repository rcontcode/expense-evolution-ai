import { ReactNode } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { Plus, Camera, TrendingUp, Receipt, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/hooks/use-haptic';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuickAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface QuickActionsDrawerProps {
  open: boolean;
  onClose: () => void;
  actions?: QuickAction[];
  className?: string;
}

export function QuickActionsDrawer({
  open,
  onClose,
  actions,
  className,
}: QuickActionsDrawerProps) {
  const { language } = useLanguage();
  const dragControls = useDragControls();
  const navigate = useNavigate();

  // Default actions if none provided
  const defaultActions: QuickAction[] = [
    {
      icon: <Receipt className="h-5 w-5" />,
      label: language === 'es' ? 'Nuevo Gasto' : 'New Expense',
      onClick: () => navigate('/expenses'),
      color: 'from-rose-500 to-pink-600',
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: language === 'es' ? 'Nuevo Ingreso' : 'New Income',
      onClick: () => navigate('/income'),
      color: 'from-emerald-500 to-teal-600',
    },
    {
      icon: <Camera className="h-5 w-5" />,
      label: language === 'es' ? 'Capturar Recibo' : 'Capture Receipt',
      onClick: () => navigate('/chaos'),
      color: 'from-amber-500 to-orange-600',
    },
    {
      icon: <Search className="h-5 w-5" />,
      label: language === 'es' ? 'Buscar' : 'Search',
      onClick: () => navigate('/expenses'),
      color: 'from-blue-500 to-indigo-600',
    },
  ];

  const displayActions = actions || defaultActions;

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Close if dragged down more than 50px or with high velocity
    if (info.offset.y > 50 || info.velocity.y > 300) {
      hapticFeedback('light');
      onClose();
    }
  };

  const handleActionClick = (action: QuickAction) => {
    hapticFeedback('medium');
    action.onClick();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-background border-t rounded-t-2xl shadow-2xl",
              "safe-area-bottom",
              className
            )}
          >
            {/* Gesture handle */}
            <div 
              className="gesture-handle cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            />
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-2">
              <h3 className="font-semibold text-lg">
                {language === 'es' ? 'Acciones Rápidas' : 'Quick Actions'}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Actions grid */}
            <div className="grid grid-cols-4 gap-3 px-4 pb-6">
              {displayActions.map((action, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleActionClick(action)}
                  className="flex flex-col items-center gap-2 py-3"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    "bg-gradient-to-br text-white shadow-lg",
                    action.color || 'from-primary to-primary/80'
                  )}>
                    {action.icon}
                  </div>
                  <span className="text-xs text-center font-medium text-muted-foreground line-clamp-1">
                    {action.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
