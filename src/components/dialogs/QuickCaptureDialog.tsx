import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuickCapture } from '@/components/capture/QuickCapture';
import { SmartTextInput } from '@/components/capture/SmartTextInput';
import { QuickCaptureTutorial } from '@/components/capture/QuickCaptureTutorial';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { Camera, MessageSquareText } from 'lucide-react';

interface QuickCaptureDialogProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: 'photo' | 'text';
}

const TUTORIAL_STORAGE_KEY = 'evofinz_quick_capture_tutorial_completed';

export function QuickCaptureDialog({ open, onClose, defaultTab = 'photo' }: QuickCaptureDialogProps) {
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const l = language === 'es';
  const [showTutorial, setShowTutorial] = useState(false);
  const [tab, setTab] = useState<string>(defaultTab);

  useEffect(() => {
    if (open) {
      setTab(defaultTab);
      const tutorialCompleted = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (!tutorialCompleted) setShowTutorial(true);
    }
  }, [open, defaultTab]);

  const handleTutorialComplete = () => {
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
              onSkip={handleTutorialComplete}
            />
          </div>
        ) : (
          <div className={isMobile ? "p-4" : ""}>
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="text" className="flex-1 gap-1.5">
                  <MessageSquareText className="h-4 w-4" />
                  {l ? 'Texto Libre' : 'Free Text'}
                </TabsTrigger>
                <TabsTrigger value="photo" className="flex-1 gap-1.5">
                  <Camera className="h-4 w-4" />
                  {l ? 'Foto / Voz' : 'Photo / Voice'}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="text">
                <SmartTextInput onSuccess={onClose} onCancel={onClose} />
              </TabsContent>
              <TabsContent value="photo">
                <QuickCapture onSuccess={onClose} onCancel={onClose} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
