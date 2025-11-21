import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Plus, Receipt } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { ExpensesTable } from '@/components/tables/ExpensesTable';
import { ExpenseFilters } from '@/components/filters/ExpenseFilters';
import { ExpenseDialog } from '@/components/dialogs/ExpenseDialog';
import { ExpenseFilters as Filters, ExpenseWithRelations } from '@/types/expense.types';
import { Card, CardContent } from '@/components/ui/card';

export default function Expenses() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<Filters>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithRelations | undefined>();

  const { data: expenses, isLoading } = useExpenses(filters);

  const handleEdit = (expense: ExpenseWithRelations) => {
    setSelectedExpense(expense);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedExpense(undefined);
  };

  const handleCreate = () => {
    setSelectedExpense(undefined);
    setDialogOpen(true);
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('expenses.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('expenses.manageExpenses')}</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('expenses.addExpense')}
          </Button>
        </div>

        <ExpenseFilters filters={filters} onChange={setFilters} />

        {isLoading ? (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">{t('expenses.loadingExpenses')}</p>
            </CardContent>
          </Card>
        ) : expenses && expenses.length > 0 ? (
          <ExpensesTable expenses={expenses} onEdit={handleEdit} />
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">{t('expenses.noExpenses')}</p>
              <p className="text-sm text-muted-foreground">
                {t('expenses.startByUploading')}
              </p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                {t('expenses.addFirstExpense')}
              </Button>
            </CardContent>
          </Card>
        )}

        <ExpenseDialog open={dialogOpen} onClose={handleClose} expense={selectedExpense} />
      </div>
    </Layout>
  );
}
