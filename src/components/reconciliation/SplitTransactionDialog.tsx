import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClients } from '@/hooks/data/useClients';
import { EXPENSE_CATEGORIES } from '@/lib/constants/expense-categories';
import { Plus, Trash2, Split, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface SplitItem {
  id: string;
  vendor: string;
  amount: number;
  category: string;
  client_id: string | null;
}

interface SplitTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: {
    id: string;
    amount: number;
    description: string | null;
    transaction_date: string;
  } | null;
  onSave: (items: SplitItem[], transactionId: string) => Promise<void>;
  isLoading?: boolean;
}

export function SplitTransactionDialog({ 
  open, 
  onClose, 
  transaction, 
  onSave,
  isLoading 
}: SplitTransactionDialogProps) {
  const { language } = useLanguage();
  const { data: clients = [] } = useClients();
  
  const [items, setItems] = useState<SplitItem[]>([
    {
      id: crypto.randomUUID(),
      vendor: transaction?.description || '',
      amount: transaction?.amount || 0,
      category: 'other',
      client_id: null,
    }
  ]);

  // Reset items when transaction changes
  const resetItems = () => {
    setItems([{
      id: crypto.randomUUID(),
      vendor: transaction?.description || '',
      amount: transaction?.amount || 0,
      category: 'other',
      client_id: null,
    }]);
  };

  const addItem = () => {
    setItems([...items, {
      id: crypto.randomUUID(),
      vendor: '',
      amount: 0,
      category: 'other',
      client_id: null,
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof SplitItem, value: string | number | null) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const remainingAmount = (transaction?.amount || 0) - totalAmount;
  const isBalanced = Math.abs(remainingAmount) < 0.01;

  const handleSave = async () => {
    if (!transaction) return;
    
    if (!isBalanced) {
      toast.error(
        language === 'es' 
          ? 'Los montos deben sumar el total de la transacción' 
          : 'Amounts must equal the transaction total'
      );
      return;
    }

    const invalidItems = items.filter(item => !item.vendor || item.amount <= 0);
    if (invalidItems.length > 0) {
      toast.error(
        language === 'es' 
          ? 'Todos los gastos deben tener proveedor y monto válido' 
          : 'All expenses must have vendor and valid amount'
      );
      return;
    }

    await onSave(items, transaction.id);
    resetItems();
    onClose();
  };

  const handleClose = () => {
    resetItems();
    onClose();
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Dividir Transacción' : 'Split Transaction'}
          </DialogTitle>
          <DialogDescription>
            {language === 'es' 
              ? 'Divide esta transacción en múltiples gastos (ej: combustible + comida en gasolinera)'
              : 'Split this transaction into multiple expenses (e.g., fuel + food at gas station)'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original transaction info */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{transaction.description || 'Sin descripción'}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.transaction_date).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline" className="text-lg font-bold">
                  ${Number(transaction.amount).toFixed(2)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Balance indicator */}
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            isBalanced ? 'bg-success/10' : 'bg-warning/10'
          }`}>
            <div className="flex items-center gap-2">
              {isBalanced ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <AlertCircle className="h-5 w-5 text-warning" />
              )}
              <span className="text-sm font-medium">
                {language === 'es' ? 'Total asignado:' : 'Total assigned:'}
              </span>
              <span className="font-bold">${totalAmount.toFixed(2)}</span>
            </div>
            {!isBalanced && (
              <span className={`text-sm font-medium ${remainingAmount > 0 ? 'text-warning' : 'text-destructive'}`}>
                {remainingAmount > 0 
                  ? `${language === 'es' ? 'Falta:' : 'Remaining:'} $${remainingAmount.toFixed(2)}`
                  : `${language === 'es' ? 'Excede:' : 'Exceeds:'} $${Math.abs(remainingAmount).toFixed(2)}`}
              </span>
            )}
          </div>

          {/* Split items */}
          <div className="space-y-3">
            {items.map((item, index) => (
              <Card key={item.id} className="border-primary/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {language === 'es' ? `Gasto ${index + 1}` : `Expense ${index + 1}`}
                    </Badge>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{language === 'es' ? 'Proveedor' : 'Vendor'}</Label>
                      <Input
                        value={item.vendor}
                        onChange={(e) => updateItem(item.id, 'vendor', e.target.value)}
                        placeholder={language === 'es' ? 'Ej: Petro-Canada' : 'E.g., Petro-Canada'}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{language === 'es' ? 'Monto' : 'Amount'}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.amount || ''}
                        onChange={(e) => updateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{language === 'es' ? 'Categoría' : 'Category'}</Label>
                      <Select
                        value={item.category}
                        onValueChange={(value) => updateItem(item.id, 'category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{language === 'es' ? 'Cliente (opcional)' : 'Client (optional)'}</Label>
                      <Select
                        value={item.client_id || '__none__'}
                        onValueChange={(value) => updateItem(item.id, 'client_id', value === '__none__' ? null : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'es' ? 'Sin cliente' : 'No client'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            {language === 'es' ? 'Sin cliente' : 'No client'}
                          </SelectItem>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add item button */}
          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Agregar otro gasto' : 'Add another expense'}
          </Button>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!isBalanced || isLoading}
              className="bg-gradient-primary"
            >
              {isLoading 
                ? (language === 'es' ? 'Guardando...' : 'Saving...')
                : (language === 'es' ? `Crear ${items.length} gasto(s)` : `Create ${items.length} expense(s)`)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
