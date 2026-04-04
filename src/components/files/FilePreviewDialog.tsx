import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DocumentPreviewRenderer } from '@/components/shared/DocumentPreviewRenderer';
import type { UnifiedFile } from '@/hooks/data/useAllFiles';

interface FilePreviewDialogProps {
  file: UnifiedFile | null;
  previewUrl: string | null;
  isLoading: boolean;
  onClose: () => void;
  onDownload: (file: UnifiedFile) => void;
  onGoToSection: (file: UnifiedFile) => void;
}

export function FilePreviewDialog({ file, previewUrl, isLoading, onClose, onDownload, onGoToSection }: FilePreviewDialogProps) {
  const { language } = useLanguage();
  if (!file) return null;

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{file.file_name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto rounded-lg bg-muted/30 flex items-center justify-center">
          <DocumentPreviewRenderer
            url={previewUrl}
            fileName={file.file_name}
            mimeType={file.file_type}
            isLoading={isLoading}
            className="w-full min-h-[300px] max-h-[60vh]"
            pdfWidth={600}
            onDownload={() => onDownload(file)}
          />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" size="sm" onClick={() => onDownload(file)}>
            <Download className="h-4 w-4 mr-1" />
            {language === 'es' ? 'Descargar' : 'Download'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onGoToSection(file)}>
            <ExternalLink className="h-4 w-4 mr-1" />
            {language === 'es' ? 'Ir a sección' : 'Go to section'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
