import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Tag, X, Zap, Users, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDeleteExpense } from '@/hooks/data/useExpenses';
import { ExpenseWithRelations } from '@/types/expense.types';
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

interface ExpenseBulkActionsProps {
  selectedIds: Set<string>;
  expenses: ExpenseWithRelations[];
  onClearSelection: () => void;
  onClassifySelected: () => void;
  onAssignSelected: () => void;
}

export const ExpenseBulkActions = memo(function ExpenseBulkActions({
  selectedIds,
  expenses,
  onClearSelection,
  onClassifySelected,
  onAssignSelected,
}: ExpenseBulkActionsProps) {
  const { language } = useLanguage();
  const deleteMutation = useDeleteExpense();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selectedExpenses = expenses.filter(e => selectedIds.has(e.id));
  const totalAmount = selectedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const count = selectedIds.size;

  const handleBulkDelete = async () => {
    const promises = Array.from(selectedIds).map(id => deleteMutation.mutateAsync(id));
    await Promise.allSettled(promises);
    onClearSelection();
    setConfirmDelete(false);
  };

  return (
    <>
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-2xl"
          >
            <div className="rounded-2xl border border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl shadow-primary/10 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">
                    {count}
                  </Badge>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium">
                      {language === 'es' ? 'seleccionados' : 'selected'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${totalAmount.toFixed(2)} {language === 'es' ? 'total' : 'total'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onClassifySelected}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">{language === 'es' ? 'Clasificar' : 'Classify'}</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={onAssignSelected}>
                    <Users className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">{language === 'es' ? 'Asignar' : 'Assign'}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">{language === 'es' ? 'Eliminar' : 'Delete'}</span>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onClearSelection}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {language === 'es' ? `¿Eliminar ${count} gastos?` : `Delete ${count} expenses?`}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {language === 'es'
                  ? `Se moverán ${count} gastos a la papelera por un total de $${totalAmount.toFixed(2)}. Podrás restaurarlos desde la sección Papelera.`
                  : `${count} expenses totaling $${totalAmount.toFixed(2)} will be moved to trash. You can restore them from the Trash section.`}
              </p>
              <div className="max-h-32 overflow-y-auto text-xs space-y-1 mt-2 p-2 bg-muted rounded">
                {selectedExpenses.slice(0, 10).map(e => (
                  <div key={e.id} className="flex justify-between">
                    <span className="truncate">{e.vendor || '—'}</span>
                    <span className="font-medium">${Number(e.amount).toFixed(2)}</span>
                  </div>
                ))}
                {count > 10 && (
                  <p className="text-muted-foreground">+{count - 10} {language === 'es' ? 'más' : 'more'}...</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'es' ? 'Cancelar' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="h-4 w-4 mr-2" />
              {language === 'es' ? `Eliminar ${count}` : `Delete ${count}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
