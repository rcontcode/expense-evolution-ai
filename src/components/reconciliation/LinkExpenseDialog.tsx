import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link2, Search, Receipt, Calendar, DollarSign, Building2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExpenseWithRelations } from '@/types/expense.types';

interface LinkExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: {
    id: string;
    amount: number;
    description: string | null;
    transaction_date: string;
  } | null;
  expenses: ExpenseWithRelations[];
  onLink: (transactionId: string, expenseId: string) => void;
  isLoading?: boolean;
}

export function LinkExpenseDialog({ 
  open, 
  onClose, 
  transaction, 
  expenses,
  onLink,
  isLoading 
}: LinkExpenseDialogProps) {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

  // Filter expenses that are not already matched and match search query
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        expense.vendor?.toLowerCase().includes(searchLower) ||
        expense.description?.toLowerCase().includes(searchLower) ||
        expense.category?.toLowerCase().includes(searchLower) ||
        expense.client?.name?.toLowerCase().includes(searchLower);
      
      return matchesSearch;
    });
  }, [expenses, searchQuery]);

  // Sort by date proximity to transaction
  const sortedExpenses = useMemo(() => {
    if (!transaction) return filteredExpenses;
    
    const txDate = new Date(transaction.transaction_date).getTime();
    
    return [...filteredExpenses].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      const diffA = Math.abs(txDate - dateA);
      const diffB = Math.abs(txDate - dateB);
      return diffA - diffB;
    });
  }, [filteredExpenses, transaction]);

  const handleLink = () => {
    if (!transaction || !selectedExpenseId) return;
    onLink(transaction.id, selectedExpenseId);
    setSelectedExpenseId(null);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSelectedExpenseId(null);
    setSearchQuery('');
    onClose();
  };

  // Calculate match score for visual indicator
  const getMatchScore = (expense: ExpenseWithRelations): number => {
    if (!transaction) return 0;
    
    let score = 0;
    
    // Amount match (up to 50 points)
    const amountDiff = Math.abs(Number(expense.amount) - transaction.amount);
    if (amountDiff === 0) score += 50;
    else if (amountDiff < 1) score += 40;
    else if (amountDiff < 5) score += 25;
    else if (amountDiff < 10) score += 10;
    
    // Date proximity (up to 50 points)
    const txDate = new Date(transaction.transaction_date);
    const expDate = new Date(expense.date);
    const daysDiff = Math.abs((txDate.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff === 0) score += 50;
    else if (daysDiff <= 1) score += 40;
    else if (daysDiff <= 3) score += 30;
    else if (daysDiff <= 7) score += 20;
    else if (daysDiff <= 14) score += 10;
    
    return score;
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Vincular con Gasto Existente' : 'Link to Existing Expense'}
          </DialogTitle>
          <DialogDescription>
            {language === 'es' 
              ? 'Selecciona un gasto registrado para vincularlo con esta transacción bancaria'
              : 'Select a recorded expense to link with this bank transaction'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Transaction info */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'es' ? 'Transacción a vincular:' : 'Transaction to link:'}
                  </p>
                  <p className="font-medium">{transaction.description || 'Sin descripción'}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(transaction.transaction_date), 'dd MMM yyyy', { 
                      locale: language === 'es' ? es : undefined 
                    })}
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg font-bold">
                  ${transaction.amount.toFixed(2)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'es' ? 'Buscar gastos...' : 'Search expenses...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Expenses list */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-2 pr-4">
              {sortedExpenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {language === 'es' 
                    ? 'No se encontraron gastos' 
                    : 'No expenses found'}
                </div>
              ) : (
                sortedExpenses.map((expense) => {
                  const matchScore = getMatchScore(expense);
                  const isSelected = selectedExpenseId === expense.id;
                  
                  return (
                    <Card 
                      key={expense.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedExpenseId(expense.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {/* Selection indicator */}
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected 
                              ? 'border-primary bg-primary' 
                              : 'border-muted-foreground/30'
                          }`}>
                            {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          
                          {/* Expense icon */}
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Receipt className="h-5 w-5 text-muted-foreground" />
                          </div>
                          
                          {/* Expense details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">
                                {expense.vendor || expense.description || 'Sin descripción'}
                              </p>
                              {matchScore >= 80 && (
                                <Badge variant="default" className="bg-success text-xs">
                                  {language === 'es' ? 'Coincide' : 'Match'}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(expense.date), 'dd/MM/yyyy')}
                              </span>
                              {expense.category && (
                                <Badge variant="outline" className="text-xs">
                                  {expense.category}
                                </Badge>
                              )}
                              {expense.client && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {expense.client.name}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Amount */}
                          <div className="text-right">
                            <p className="font-bold">${Number(expense.amount).toFixed(2)}</p>
                            {matchScore > 0 && (
                              <p className={`text-xs ${
                                matchScore >= 80 ? 'text-success' : 
                                matchScore >= 50 ? 'text-warning' : 
                                'text-muted-foreground'
                              }`}>
                                {matchScore}%
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {sortedExpenses.length} {language === 'es' ? 'gastos disponibles' : 'expenses available'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button 
                onClick={handleLink} 
                disabled={!selectedExpenseId || isLoading}
                className="bg-gradient-primary"
              >
                <Link2 className="h-4 w-4 mr-2" />
                {isLoading 
                  ? (language === 'es' ? 'Vinculando...' : 'Linking...')
                  : (language === 'es' ? 'Vincular' : 'Link')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
