import { ReactNode, useRef, useState } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/hooks/use-haptic';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon?: ReactNode;
    label: string;
    color?: string;
  };
  rightAction?: {
    icon?: ReactNode;
    label: string;
    color?: string;
  };
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = { icon: <Trash2 className="h-5 w-5" />, label: 'Delete', color: 'bg-destructive' },
  rightAction = { icon: <Check className="h-5 w-5" />, label: 'Complete', color: 'bg-emerald-500' },
  threshold = 100,
  className,
  disabled = false,
}: SwipeableCardProps) {
  const controls = useAnimation();
  const constraintsRef = useRef(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState(false);

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;
    
    setDragOffset(info.offset.x);
    
    // Trigger haptic when crossing threshold
    if (Math.abs(info.offset.x) >= threshold && !hasTriggeredHaptic) {
      hapticFeedback('medium');
      setHasTriggeredHaptic(true);
    } else if (Math.abs(info.offset.x) < threshold && hasTriggeredHaptic) {
      setHasTriggeredHaptic(false);
    }
  };

  const handleDragEnd = async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;
    
    const offsetX = info.offset.x;
    const velocityX = info.velocity.x;
    
    // Determine if swipe should trigger action
    const shouldTrigger = Math.abs(offsetX) > threshold || Math.abs(velocityX) > 500;
    
    if (shouldTrigger) {
      if (offsetX < 0 && onSwipeLeft) {
        // Swipe left - animate off screen
        await controls.start({ x: -window.innerWidth, opacity: 0 });
        hapticFeedback('success');
        onSwipeLeft();
      } else if (offsetX > 0 && onSwipeRight) {
        // Swipe right - animate off screen
        await controls.start({ x: window.innerWidth, opacity: 0 });
        hapticFeedback('success');
        onSwipeRight();
      } else {
        // No handler for this direction, snap back
        controls.start({ x: 0, opacity: 1 });
      }
    } else {
      // Below threshold, snap back
      controls.start({ x: 0, opacity: 1 });
    }
    
    setDragOffset(0);
    setHasTriggeredHaptic(false);
  };

  // Calculate action visibility based on drag
  const leftActionOpacity = Math.min(1, Math.max(0, -dragOffset / threshold));
  const rightActionOpacity = Math.min(1, Math.max(0, dragOffset / threshold));

  return (
    <div ref={constraintsRef} className={cn("relative overflow-hidden rounded-xl", className)}>
      {/* Left action background (swipe left reveals) */}
      {onSwipeLeft && (
        <div 
          className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-end px-4 text-white",
            leftAction.color || 'bg-destructive'
          )}
          style={{ 
            width: Math.abs(Math.min(0, dragOffset)) + 60,
            opacity: leftActionOpacity 
          }}
        >
          <div className="flex flex-col items-center gap-1">
            {leftAction.icon}
            <span className="text-xs font-medium">{leftAction.label}</span>
          </div>
        </div>
      )}
      
      {/* Right action background (swipe right reveals) */}
      {onSwipeRight && (
        <div 
          className={cn(
            "absolute inset-y-0 left-0 flex items-center justify-start px-4 text-white",
            rightAction.color || 'bg-emerald-500'
          )}
          style={{ 
            width: Math.max(0, dragOffset) + 60,
            opacity: rightActionOpacity 
          }}
        >
          <div className="flex flex-col items-center gap-1">
            {rightAction.icon}
            <span className="text-xs font-medium">{rightAction.label}</span>
          </div>
        </div>
      )}
      
      {/* Card content */}
      <motion.div
        drag={disabled ? false : "x"}
        dragConstraints={{ left: onSwipeLeft ? -200 : 0, right: onSwipeRight ? 200 : 0 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative bg-card border rounded-xl"
        style={{ touchAction: 'pan-y' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
