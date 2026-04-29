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
import { ResizeHandle } from '@/components/ui/resize-handle';

type DialogSize = 'md' | 'lg' | 'xl' | 'full';

interface FullScreenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Default 'md' (max-w-2xl). Use 'xl'/'full' for document/preview dialogs. */
  size?: DialogSize;
  /** Allow user to resize the dialog by dragging its bottom-right corner. */
  resizable?: boolean;
}

const SIZE_CLASSES: Record<DialogSize, string> = {
  md: 'max-w-2xl max-h-[90vh]',
  lg: 'max-w-4xl w-[90vw] max-h-[92vh]',
  xl: 'max-w-[95vw] w-[95vw] max-h-[92vh]',
  full: 'max-w-[98vw] w-[98vw] max-h-[96vh]',
};

export function FullScreenDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  size = 'md',
  resizable = false,
}: FullScreenDialogProps) {
  const isMobile = useIsMobile();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Desktop styles per size
          SIZE_CLASSES[size],
          // Resizable on desktop only
          resizable && !isMobile && 'dialog-resizable relative',
          // Mobile: full screen (overrides size)
          isMobile && [
            'fixed inset-0 h-full w-full max-w-full max-h-full',
            'rounded-none m-0 p-0',
            'flex flex-col',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-4',
          ],
          className,
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
            <div
              className={cn(
                'overflow-y-auto',
                resizable
                  ? 'max-h-[calc(100%-6rem)] h-[calc(100%-6rem)]'
                  : 'max-h-[calc(90vh-8rem)]',
              )}
            >
              {children}
            </div>
            {footer && <div className="mt-4">{footer}</div>}
            {resizable && <ResizeHandle />}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
