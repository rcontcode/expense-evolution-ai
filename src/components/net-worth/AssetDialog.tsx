import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { Asset, ASSET_CATEGORIES, useCreateAsset, useUpdateAsset } from '@/hooks/data/useNetWorth';
import { 
  Wallet, TrendingUp, Home, Car, PiggyBank, Bitcoin, Gem, Building2, Package,
  Hexagon, CircleDollarSign, Coins, Layers, ImageIcon
} from 'lucide-react';

interface AssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAsset?: Asset | null;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wallet, TrendingUp, Home, Car, PiggyBank, Bitcoin, Gem, Building2, Package,
  Hexagon, CircleDollarSign, Coins, Layers, ImageIcon
};

export function AssetDialog({ open, onOpenChange, editingAsset }: AssetDialogProps) {
  const { t } = useLanguage();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();

  const [formData, setFormData] = useState({
    name: '',
    category: 'cash',
    current_value: 0,
    purchase_value: 0,
    purchase_date: '',
    currency: 'CAD',
    notes: '',
    is_liquid: false,
  });

  useEffect(() => {
    if (editingAsset) {
      setFormData({
        name: editingAsset.name,
        category: editingAsset.category,
        current_value: editingAsset.current_value,
        purchase_value: editingAsset.purchase_value || 0,
        purchase_date: editingAsset.purchase_date || '',
        currency: editingAsset.currency,
        notes: editingAsset.notes || '',
        is_liquid: editingAsset.is_liquid,
      });
    } else {
      setFormData({
        name: '',
        category: 'cash',
        current_value: 0,
        purchase_value: 0,
        purchase_date: '',
        currency: 'CAD',
        notes: '',
        is_liquid: false,
      });
    }
  }, [editingAsset, open]);

  const handleSave = async () => {
    if (!formData.name || formData.current_value <= 0) return;

    const assetData = {
      ...formData,
      purchase_value: formData.purchase_value || null,
      purchase_date: formData.purchase_date || null,
      notes: formData.notes || null,
    };

    if (editingAsset) {
      await updateAsset.mutateAsync({ id: editingAsset.id, ...assetData });
    } else {
      await createAsset.mutateAsync(assetData);
    }

    onOpenChange(false);
  };

  const selectedCategory = ASSET_CATEGORIES.find(c => c.value === formData.category);
  const IconComponent = selectedCategory ? iconMap[selectedCategory.icon] : Package;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {IconComponent && <IconComponent className="h-5 w-5 text-primary" />}
            {editingAsset ? 'Editar Activo' : 'Agregar Activo'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre del Activo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Cuenta de Ahorros, Tesla Model 3..."
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
                <SelectGroup>
                  <SelectLabel className="text-xs text-muted-foreground">Activos Generales</SelectLabel>
                  {ASSET_CATEGORIES.filter(c => c.group === 'general').map((cat) => {
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
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-xs text-muted-foreground flex items-center gap-1">
                    <Bitcoin className="h-3 w-3" />
                    Criptomonedas
                  </SelectLabel>
                  {ASSET_CATEGORIES.filter(c => c.group === 'crypto').map((cat) => {
                    const CatIcon = iconMap[cat.icon];
                    return (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          {CatIcon && <CatIcon className="h-4 w-4 text-amber-500" />}
                          {cat.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="current_value">Valor Actual</Label>
              <Input
                id="current_value"
                type="number"
                min="0"
                step="0.01"
                value={formData.current_value}
                onChange={(e) => setFormData({ ...formData, current_value: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="purchase_value">Valor de Compra</Label>
              <Input
                id="purchase_value"
                type="number"
                min="0"
                step="0.01"
                value={formData.purchase_value}
                onChange={(e) => setFormData({ ...formData, purchase_value: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="purchase_date">Fecha de Adquisición</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
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

          <div className="flex items-center gap-3">
            <Switch
              id="is_liquid"
              checked={formData.is_liquid}
              onCheckedChange={(checked) => setFormData({ ...formData, is_liquid: checked })}
            />
            <Label htmlFor="is_liquid" className="text-sm">
              Activo líquido (fácil de convertir a efectivo)
            </Label>
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
            disabled={!formData.name || formData.current_value <= 0 || createAsset.isPending || updateAsset.isPending}
          >
            {editingAsset ? 'Guardar' : 'Agregar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
