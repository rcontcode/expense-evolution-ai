import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
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

  const isImage = file.file_type && /jpg|jpeg|png|webp|gif/i.test(file.file_type);
  const isPdf = file.file_type && /pdf/i.test(file.file_type);

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{file.file_name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto rounded-lg bg-muted/30 flex items-center justify-center">
          {isLoading ? (
            <div className="p-12 text-muted-foreground animate-pulse">
              {language === 'es' ? 'Cargando...' : 'Loading...'}
            </div>
          ) : previewUrl ? (
            isImage ? (
              <img src={previewUrl} alt={file.file_name} className="max-w-full max-h-[60vh] object-contain" />
            ) : isPdf ? (
              <iframe src={previewUrl} className="w-full h-[60vh] border-0 rounded" title={file.file_name} />
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-3 opacity-50" />
                <p>{language === 'es' ? 'Vista previa no disponible para este tipo de archivo' : 'Preview not available for this file type'}</p>
              </div>
            )
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-3 opacity-50" />
              <p>{language === 'es' ? 'No se pudo cargar la vista previa' : 'Could not load preview'}</p>
            </div>
          )}
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
