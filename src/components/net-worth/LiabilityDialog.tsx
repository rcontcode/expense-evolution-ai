import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { Liability, LIABILITY_CATEGORIES, useCreateLiability, useUpdateLiability } from '@/hooks/data/useNetWorth';
import { Home, Car, GraduationCap, CreditCard, HandCoins, Banknote, Building2, Receipt } from 'lucide-react';

interface LiabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLiability?: Liability | null;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, Car, GraduationCap, CreditCard, HandCoins, Banknote, Building2, Receipt
};

export function LiabilityDialog({ open, onOpenChange, editingLiability }: LiabilityDialogProps) {
  const { t } = useLanguage();
  const createLiability = useCreateLiability();
  const updateLiability = useUpdateLiability();

  const [formData, setFormData] = useState({
    name: '',
    category: 'credit_card',
    original_amount: 0,
    current_balance: 0,
    interest_rate: 0,
    minimum_payment: 0,
    due_date: '',
    currency: 'CAD',
    notes: '',
  });

  useEffect(() => {
    if (editingLiability) {
      setFormData({
        name: editingLiability.name,
        category: editingLiability.category,
        original_amount: editingLiability.original_amount,
        current_balance: editingLiability.current_balance,
        interest_rate: editingLiability.interest_rate || 0,
        minimum_payment: editingLiability.minimum_payment || 0,
        due_date: editingLiability.due_date || '',
        currency: editingLiability.currency,
        notes: editingLiability.notes || '',
      });
    } else {
      setFormData({
        name: '',
        category: 'credit_card',
        original_amount: 0,
        current_balance: 0,
        interest_rate: 0,
        minimum_payment: 0,
        due_date: '',
        currency: 'CAD',
        notes: '',
      });
    }
  }, [editingLiability, open]);

  const handleSave = async () => {
    if (!formData.name || formData.current_balance <= 0) return;

    const liabilityData = {
      ...formData,
      interest_rate: formData.interest_rate || null,
      minimum_payment: formData.minimum_payment || null,
      due_date: formData.due_date || null,
      notes: formData.notes || null,
    };

    if (editingLiability) {
      await updateLiability.mutateAsync({ id: editingLiability.id, ...liabilityData });
    } else {
      await createLiability.mutateAsync(liabilityData);
    }

    onOpenChange(false);
  };

  const selectedCategory = LIABILITY_CATEGORIES.find(c => c.value === formData.category);
  const IconComponent = selectedCategory ? iconMap[selectedCategory.icon] : Receipt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {IconComponent && <IconComponent className="h-5 w-5 text-destructive" />}
            {editingLiability ? 'Editar Pasivo' : 'Agregar Pasivo'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre de la Deuda</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Hipoteca Casa, Visa Oro..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Categoría</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIABILITY_CATEGORIES.map((cat) => {
                  const CatIcon = iconMap[cat.icon];
                  return (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        {CatIcon && <CatIcon className="h-4 w-4" />}
                        {cat.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="original_amount">Monto Original</Label>
              <Input
                id="original_amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.original_amount}
                onChange={(e) => setFormData({ ...formData, original_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="current_balance">Saldo Actual</Label>
              <Input
                id="current_balance"
                type="number"
                min="0"
                step="0.01"
                value={formData.current_balance}
                onChange={(e) => setFormData({ ...formData, current_balance: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="interest_rate">Tasa de Interés (%)</Label>
              <Input
                id="interest_rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.interest_rate}
                onChange={(e) => setFormData({ ...formData, interest_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="minimum_payment">Pago Mínimo</Label>
              <Input
                id="minimum_payment"
                type="number"
                min="0"
                step="0.01"
                value={formData.minimum_payment}
                onChange={(e) => setFormData({ ...formData, minimum_payment: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="due_date">Fecha de Vencimiento</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Moneda</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Detalles adicionales..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!formData.name || formData.current_balance <= 0 || createLiability.isPending || updateLiability.isPending}
          >
            {editingLiability ? 'Guardar' : 'Agregar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
