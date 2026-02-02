import { ReactNode } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface FullScreenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function FullScreenDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: FullScreenDialogProps) {
  const isMobile = useIsMobile();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Desktop styles
          "max-w-2xl max-h-[90vh]",
          // Mobile: full screen
          isMobile && [
            "fixed inset-0 h-full w-full max-w-full max-h-full",
            "rounded-none m-0 p-0",
            "flex flex-col",
            // Override default dialog animations for mobile
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-4",
          ],
          className
        )}
      >
        {isMobile ? (
          <>
            {/* Mobile: Sticky header */}
            <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-lg truncate">{title}</h2>
                {description && (
                  <p className="text-xs text-muted-foreground truncate">{description}</p>
                )}
              </div>
            </div>
            
            {/* Mobile: Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {children}
            </div>
            
            {/* Mobile: Sticky footer */}
            {footer && (
              <div className="sticky bottom-0 z-10 bg-background border-t px-4 py-3 safe-area-bottom">
                {footer}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Desktop: Standard dialog layout */}
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
              {children}
            </div>
            {footer && <div className="mt-4">{footer}</div>}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
