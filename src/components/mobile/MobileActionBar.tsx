import { useState, useRef, useEffect, ReactNode } from 'react';
import { MoreVertical, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/hooks/use-haptic';

interface ActionItem {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'primary';
  disabled?: boolean;
}

interface MobileActionBarProps {
  /** Primary actions - always visible (max 2 recommended) */
  primaryActions?: ActionItem[];
  /** Overflow actions - shown in dropdown menu */
  overflowActions?: ActionItem[];
  /** Additional content to render */
  children?: ReactNode;
  className?: string;
}

export function MobileActionBar({
  primaryActions = [],
  overflowActions = [],
  children,
  className,
}: MobileActionBarProps) {
  const [showOverflow, setShowOverflow] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close overflow menu when clicking outside
  useEffect(() => {
    if (!showOverflow) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowOverflow(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOverflow]);

  const handleOverflowClick = (action: ActionItem) => {
    hapticFeedback('selection');
    action.onClick();
    setShowOverflow(false);
  };

  const variantStyles = {
    default: 'text-foreground hover:bg-muted',
    destructive: 'text-destructive hover:bg-destructive/10',
    primary: 'text-primary hover:bg-primary/10',
  };

  return (
    <div className={cn("flex items-center gap-1 relative", className)}>
      {children}
      
      {/* Primary actions */}
      {primaryActions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Button
            key={index}
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9 shrink-0",
              variantStyles[action.variant || 'default']
            )}
            onClick={() => {
              hapticFeedback('light');
              action.onClick();
            }}
            disabled={action.disabled}
          >
            <Icon className="h-5 w-5" />
            <span className="sr-only">{action.label}</span>
          </Button>
        );
      })}
      
      {/* Overflow menu trigger */}
      {overflowActions.length > 0 && (
        <div ref={menuRef} className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => {
              hapticFeedback('light');
              setShowOverflow(!showOverflow);
            }}
          >
            <MoreVertical className="h-5 w-5" />
            <span className="sr-only">More options</span>
          </Button>
          
          {/* Overflow menu dropdown */}
          {showOverflow && (
            <div className="mobile-overflow-menu animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
              {overflowActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    className={cn(
                      "mobile-overflow-menu-item",
                      variantStyles[action.variant || 'default'],
                      action.disabled && "opacity-50 pointer-events-none"
                    )}
                    onClick={() => handleOverflowClick(action)}
                    disabled={action.disabled}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{action.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
