import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Download, Trash2, X } from 'lucide-react';

interface FileBulkActionsProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkDownload: () => void;
  onClearSelection: () => void;
  isDeleting?: boolean;
}

export function FileBulkActions({ selectedCount, onBulkDelete, onBulkDownload, onClearSelection, isDeleting }: FileBulkActionsProps) {
  const { language } = useLanguage();
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-primary/5 border border-primary/20">
      <span className="text-sm font-medium text-primary">
        {selectedCount} {language === 'es' ? 'seleccionado(s)' : 'selected'}
      </span>
      <div className="flex gap-1 ml-auto">
        <Button variant="outline" size="sm" onClick={onBulkDownload} className="h-7 text-xs">
          <Download className="h-3 w-3 mr-1" />
          {language === 'es' ? 'Descargar' : 'Download'}
        </Button>
        <Button variant="destructive" size="sm" onClick={onBulkDelete} disabled={isDeleting} className="h-7 text-xs">
          <Trash2 className="h-3 w-3 mr-1" />
          {language === 'es' ? 'Eliminar' : 'Delete'}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClearSelection}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
