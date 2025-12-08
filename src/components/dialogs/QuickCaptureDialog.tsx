import { Dialog, DialogContent } from '@/components/ui/dialog';
import { QuickCapture } from '@/components/capture/QuickCapture';
import { useIsMobile } from '@/hooks/use-mobile';

interface QuickCaptureDialogProps {
  open: boolean;
  onClose: () => void;
}

export function QuickCaptureDialog({ open, onClose }: QuickCaptureDialogProps) {
  const isMobile = useIsMobile();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={
          isMobile 
            ? "max-w-[100vw] w-full h-[100dvh] max-h-[100dvh] m-0 p-0 rounded-none overflow-y-auto" 
            : "max-w-2xl max-h-[90vh] overflow-y-auto"
        }
      >
        <QuickCapture 
          onSuccess={onClose}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
