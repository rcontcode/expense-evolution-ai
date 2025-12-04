import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QuickCapture } from '@/components/capture/QuickCapture';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuickCaptureDialogProps {
  open: boolean;
  onClose: () => void;
}

export function QuickCaptureDialog({ open, onClose }: QuickCaptureDialogProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <QuickCapture 
          onSuccess={onClose}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
