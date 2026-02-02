import * as React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

// Check if device is touch-enabled
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return ('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth < 768;
};

interface TouchTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  className?: string;
  delayDuration?: number;
  /** If true, shows a small info indicator on touch devices */
  showIndicator?: boolean;
}

/**
 * TouchTooltip - A tooltip that works on both desktop (hover) and mobile (long-press/tap)
 * 
 * On desktop: Shows on hover (standard tooltip behavior)
 * On mobile: Shows on long-press (500ms) or tap, dismisses on tap outside
 */
export function TouchTooltip({
  children,
  content,
  side = "top",
  sideOffset = 4,
  className,
  delayDuration = 200,
  showIndicator = false,
}: TouchTooltipProps) {
  const [open, setOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Update touch detection on mount and resize
  useEffect(() => {
    const checkTouch = () => setIsTouch(isTouchDevice());
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Close tooltip when clicking outside on mobile
  useEffect(() => {
    if (!open || !isTouch) return;

    const handleClickOutside = (e: TouchEvent | MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('mousedown', handleClickOutside);

    // Auto-close after 4 seconds on mobile
    const autoClose = setTimeout(() => setOpen(false), 4000);

    return () => {
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(autoClose);
    };
  }, [open, isTouch]);

  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setOpen(true);
    }, 500); // 500ms long press
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTap = useCallback(() => {
    // Toggle on tap for mobile
    if (isTouch) {
      setOpen(prev => !prev);
    }
  }, [isTouch]);

  // For touch devices, render a custom implementation
  if (isTouch) {
    return (
      <div className="relative inline-flex" ref={triggerRef}>
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onClick={handleTap}
          className="inline-flex items-center"
        >
          {children}
          {showIndicator && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary/60 rounded-full" />
          )}
        </div>
        
        {open && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" 
              onClick={() => setOpen(false)}
            />
            
            {/* Tooltip content */}
            <div
              className={cn(
                "absolute z-50 min-w-[200px] max-w-[280px] rounded-xl border-2 border-primary/20 bg-popover p-3 shadow-xl",
                "animate-in fade-in-0 zoom-in-95 duration-200",
                side === "top" && "bottom-full left-1/2 -translate-x-1/2 mb-2",
                side === "bottom" && "top-full left-1/2 -translate-x-1/2 mt-2",
                side === "left" && "right-full top-1/2 -translate-y-1/2 mr-2",
                side === "right" && "left-full top-1/2 -translate-y-1/2 ml-2",
                className
              )}
            >
              {/* Close button */}
              <button
                onClick={() => setOpen(false)}
                className="absolute top-1 right-1 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
              
              <div className="text-sm text-popover-foreground pr-4">
                {content}
              </div>
              
              {/* Arrow indicator */}
              <div
                className={cn(
                  "absolute w-2 h-2 bg-popover border-primary/20 rotate-45",
                  side === "top" && "bottom-[-5px] left-1/2 -translate-x-1/2 border-b border-r",
                  side === "bottom" && "top-[-5px] left-1/2 -translate-x-1/2 border-t border-l",
                  side === "left" && "right-[-5px] top-1/2 -translate-y-1/2 border-t border-r",
                  side === "right" && "left-[-5px] top-1/2 -translate-y-1/2 border-b border-l"
                )}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  // Desktop: Use standard Radix tooltip
  return (
    <TooltipPrimitive.Root delayDuration={delayDuration} open={open} onOpenChange={setOpen}>
      <TooltipPrimitive.Trigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={sideOffset}
          className={cn(
            "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            className
          )}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/**
 * InfoTooltip - A pre-styled tooltip for informational content
 * Shows an info icon that reveals content on hover/tap
 */
interface InfoTooltipProps {
  title?: string;
  description: string;
  side?: "top" | "right" | "bottom" | "left";
}

export function InfoTooltip({ title, description, side = "top" }: InfoTooltipProps) {
  return (
    <TouchTooltip
      side={side}
      content={
        <div className="space-y-1">
          {title && <p className="font-semibold text-foreground">{title}</p>}
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      }
    >
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors cursor-help">
        <span className="text-[10px] font-bold">?</span>
      </span>
    </TouchTooltip>
  );
}
