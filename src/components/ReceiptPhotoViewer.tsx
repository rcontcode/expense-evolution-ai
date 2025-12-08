import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, ImageOff, Loader2, ZoomIn, ZoomOut, X } from 'lucide-react';
import { useDocumentUrl } from '@/hooks/data/useDocumentUrl';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ReceiptPhotoViewerProps {
  documentId: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showButton?: boolean;
}

export function ReceiptPhotoViewer({ documentId, size = 'sm', showButton = true }: ReceiptPhotoViewerProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const { url, isLoading, error } = useDocumentUrl(open ? documentId : null);

  if (!documentId) {
    if (!showButton) return null;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted cursor-not-allowed opacity-50">
              <ImageOff className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('expenses.noReceipt')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setOpen(true)}
              className={`flex items-center justify-center ${sizeClasses[size]} rounded-full bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer`}
            >
              <Camera className={`${iconSizes[size]} text-primary`} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('expenses.viewReceipt')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>{t('expenses.receiptPhoto')}</DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto p-4 bg-muted/50 min-h-[400px] flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">{t('common.loading')}...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageOff className="h-12 w-12" />
                <p className="text-sm">{error}</p>
              </div>
            ) : url ? (
              <img
                src={url}
                alt="Receipt"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg transition-transform"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
