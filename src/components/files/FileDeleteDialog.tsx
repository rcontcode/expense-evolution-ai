import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UnifiedFile } from '@/hooks/data/useAllFiles';

interface FileDeleteDialogProps {
  file: UnifiedFile | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function FileDeleteDialog({ file, isDeleting, onConfirm, onCancel }: FileDeleteDialogProps) {
  const { language } = useLanguage();

  return (
    <AlertDialog open={!!file} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {language === 'es' ? '¿Eliminar archivo?' : 'Delete file?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {language === 'es'
              ? `Se eliminará permanentemente "${file?.file_name}". Esta acción no se puede deshacer.`
              : `"${file?.file_name}" will be permanently deleted. This action cannot be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{language === 'es' ? 'Cancelar' : 'Cancel'}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting
              ? (language === 'es' ? 'Eliminando...' : 'Deleting...')
              : (language === 'es' ? 'Eliminar' : 'Delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
