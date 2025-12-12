import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Liability, LIABILITY_CATEGORIES, useDeleteLiability } from '@/hooks/data/useNetWorth';
import { Plus, Pencil, Trash2, Home, Car, GraduationCap, CreditCard, HandCoins, Banknote, Building2, Receipt, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface LiabilitiesListProps {
  liabilities: Liability[];
  onAdd: () => void;
  onEdit: (liability: Liability) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, Car, GraduationCap, CreditCard, HandCoins, Banknote, Building2, Receipt
};

export function LiabilitiesList({ liabilities, onAdd, onEdit }: LiabilitiesListProps) {
  const deleteLiability = useDeleteLiability();

  const formatCurrency = (value: number, currency: string = 'CAD') => {
    return new Intl.NumberFormat('es-CA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.current_balance, 0);
  const totalMinPayments = liabilities.reduce((sum, l) => sum + (l.minimum_payment || 0), 0);
  const highInterestDebt = liabilities.filter(l => (l.interest_rate || 0) > 15);

  const getCategoryInfo = (categoryValue: string) => {
    return LIABILITY_CATEGORIES.find(c => c.value === categoryValue) || LIABILITY_CATEGORIES[LIABILITY_CATEGORIES.length - 1];
  };

  const getPaidPercentage = (liability: Liability) => {
    if (!liability.original_amount || liability.original_amount === 0) return 0;
    const paid = liability.original_amount - liability.current_balance;
    return Math.max(0, Math.min(100, (paid / liability.original_amount) * 100));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5 text-destructive" />
              Pasivos
            </CardTitle>
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <span>Total: <span className="font-semibold text-destructive">{formatCurrency(totalLiabilities)}</span></span>
              <span>Pagos min/mes: {formatCurrency(totalMinPayments)}</span>
            </div>
            {highInterestDebt.length > 0 && (
              <Badge variant="destructive" className="mt-2">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {highInterestDebt.length} deuda(s) con interés alto (&gt;15%)
              </Badge>
            )}
          </div>
          <Button onClick={onAdd} size="sm" variant="destructive">
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {liabilities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No tienes pasivos registrados</p>
            <p className="text-sm">Agrega tus deudas, préstamos e hipotecas</p>
          </div>
        ) : (
          liabilities.map((liability) => {
            const category = getCategoryInfo(liability.category);
            const IconComponent = iconMap[category.icon] || Receipt;
            const paidPercentage = getPaidPercentage(liability);
            const isHighInterest = (liability.interest_rate || 0) > 15;

            return (
              <div
                key={liability.id}
                className={`p-3 rounded-lg transition-colors ${isHighInterest ? 'bg-destructive/10 hover:bg-destructive/15' : 'bg-muted/50 hover:bg-muted'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isHighInterest ? 'bg-destructive/20' : 'bg-destructive/10'}`}>
                      <IconComponent className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{liability.name}</span>
                        {isHighInterest && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {liability.interest_rate}%
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{category.label}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold text-destructive">
                        {formatCurrency(liability.current_balance, liability.currency)}
                      </div>
                      {liability.minimum_payment && (
                        <div className="text-xs text-muted-foreground">
                          Min: {formatCurrency(liability.minimum_payment, liability.currency)}/mes
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(liability)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar pasivo?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará "{liability.name}" permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteLiability.mutate(liability.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>

                {liability.original_amount > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progreso de pago</span>
                      <span>{paidPercentage.toFixed(0)}% pagado</span>
                    </div>
                    <Progress value={paidPercentage} className="h-2" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
