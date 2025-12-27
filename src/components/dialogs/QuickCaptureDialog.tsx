import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { QuickCapture } from '@/components/capture/QuickCapture';
import { QuickCaptureTutorial } from '@/components/capture/QuickCaptureTutorial';
import { useIsMobile } from '@/hooks/use-mobile';

interface QuickCaptureDialogProps {
  open: boolean;
  onClose: () => void;
}

const TUTORIAL_STORAGE_KEY = 'evofinz_quick_capture_tutorial_completed';

export function QuickCaptureDialog({ open, onClose }: QuickCaptureDialogProps) {
  const isMobile = useIsMobile();
  const [showTutorial, setShowTutorial] = useState(false);

  // Check if user has seen the tutorial
  useEffect(() => {
    if (open) {
      const tutorialCompleted = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (!tutorialCompleted) {
        setShowTutorial(true);
      }
    }
  }, [open]);

  const handleTutorialComplete = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setShowTutorial(false);
  };

  const handleTutorialSkip = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setShowTutorial(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={
          isMobile 
            ? "max-w-[100vw] w-full h-[100dvh] max-h-[100dvh] m-0 p-0 rounded-none overflow-y-auto" 
            : "max-w-2xl max-h-[85vh] overflow-y-auto"
        }
      >
        {showTutorial ? (
          <div className="p-4">
            <QuickCaptureTutorial 
              onComplete={handleTutorialComplete}
              onSkip={handleTutorialSkip}
            />
          </div>
        ) : (
          <QuickCapture 
            onSuccess={onClose}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
