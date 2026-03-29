import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrashItems, useRestoreItem, usePermanentDelete, useEmptyTrash, TrashItemType } from '@/hooks/data/useTrash';
import { Trash2, RotateCcw, AlertTriangle, Receipt, DollarSign, Users, FolderKanban, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const TYPE_CONFIG: Record<TrashItemType, { icon: React.ElementType; label: string; labelEn: string; color: string }> = {
  expense: { icon: Receipt, label: 'Gasto', labelEn: 'Expense', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  income: { icon: DollarSign, label: 'Ingreso', labelEn: 'Income', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  client: { icon: Users, label: 'Cliente', labelEn: 'Client', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  project: { icon: FolderKanban, label: 'Proyecto', labelEn: 'Project', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  contract: { icon: FileText, label: 'Contrato', labelEn: 'Contract', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  mileage: { icon: Receipt, label: 'Kilometraje', labelEn: 'Mileage', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
};

export default function Trash() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { data: items, isLoading } = useTrashItems();
  const restoreMutation = useRestoreItem();
  const deleteMutation = usePermanentDelete();
  const emptyTrashMutation = useEmptyTrash();
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<{ id: string; type: TrashItemType } | null>(null);

  return (
    <Layout>
      <div className="page-container section-gap">
        <PageHeader
          title={l ? 'Papelera' : 'Trash'}
          description={l ? 'Elementos eliminados recientemente. Puedes restaurarlos o eliminarlos permanentemente.' : 'Recently deleted items. You can restore or permanently delete them.'}
        >
          {items && items.length > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setConfirmEmpty(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              {l ? 'Vaciar Papelera' : 'Empty Trash'}
            </Button>
          )}
        </PageHeader>

        {isLoading ? (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">{l ? 'Cargando...' : 'Loading...'}</p>
            </CardContent>
          </Card>
        ) : !items || items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Trash2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium">{l ? 'La papelera está vacía' : 'Trash is empty'}</p>
                <p className="text-sm text-muted-foreground">{l ? 'Los elementos eliminados aparecerán aquí' : 'Deleted items will appear here'}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map(item => {
              const config = TYPE_CONFIG[item.type];
              const Icon = config.icon;
              return (
                <Card key={`${item.type}-${item.id}`} className="hover:bg-accent/50 transition-colors">
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{item.name}</p>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {l ? config.label : config.labelEn}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.details && `${item.details} · `}
                        {l ? 'Eliminado ' : 'Deleted '}
                        {formatDistanceToNow(new Date(item.deleted_at), { addSuffix: true, locale: l ? es : undefined })}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:bg-primary/10"
                        onClick={() => restoreMutation.mutate({ id: item.id, type: item.type })}
                        disabled={restoreMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmDeleteId({ id: item.id, type: item.type })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Confirm empty trash */}
        <AlertDialog open={confirmEmpty} onOpenChange={setConfirmEmpty}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                {l ? '¿Vaciar papelera?' : 'Empty trash?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {l
                  ? `Se eliminarán permanentemente ${items?.length || 0} elementos. Esta acción NO se puede deshacer.`
                  : `${items?.length || 0} items will be permanently deleted. This action CANNOT be undone.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{l ? 'Cancelar' : 'Cancel'}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { emptyTrashMutation.mutate(); setConfirmEmpty(false); }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {l ? 'Vaciar Todo' : 'Empty All'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Confirm permanent delete */}
        <AlertDialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{l ? '¿Eliminar permanentemente?' : 'Delete permanently?'}</AlertDialogTitle>
              <AlertDialogDescription>
                {l ? 'Esta acción NO se puede deshacer.' : 'This action CANNOT be undone.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{l ? 'Cancelar' : 'Cancel'}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { if (confirmDeleteId) { deleteMutation.mutate(confirmDeleteId); setConfirmDeleteId(null); } }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {l ? 'Eliminar' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
