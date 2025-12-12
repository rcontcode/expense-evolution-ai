import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/data/useProfile';
import { Asset, ASSET_CATEGORIES, useCreateAsset, useUpdateAsset } from '@/hooks/data/useNetWorth';
import { 
  Wallet, TrendingUp, Home, Car, PiggyBank, Bitcoin, Gem, Building2, Package,
  Hexagon, CircleDollarSign, Coins, Layers, ImageIcon, AlertTriangle, Lightbulb, BookOpen
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

// Categories that require educational warning
const DEPRECIATING_CATEGORIES = ['vehicles'];

// Educational content for asset understanding
const ASSET_EDUCATION = {
  vehicles: {
    title: '¿Un auto es realmente un activo?',
    warning: 'Ojo, un vehículo personal NO es un activo productivo. Se deprecia (pierde valor) cada año y genera gastos constantes (seguro, mantenimiento, combustible).',
    exception: 'Solo cuenta como activo SI genera ingresos: taxi, Uber, repartos, vehículo de trabajo que te pagan por usar.',
    tip: 'Robert Kiyosaki dice: "Un activo pone dinero en tu bolsillo, un pasivo saca dinero de tu bolsillo." Tu auto personal saca dinero cada mes.',
    questions: [
      '¿Este vehículo genera ingresos directos?',
      '¿Lo usas para trabajar y recibes compensación?',
      '¿Se paga solo con lo que genera?'
    ]
  },
  collectibles: {
    title: '¿Los coleccionables son buenos activos?',
    warning: 'Los coleccionables (arte, relojes, tarjetas, etc.) son activos especulativos. Su valor depende del mercado y pueden no tener liquidez.',
    exception: 'Solo inclúyelos si tienes valuación profesional reciente y hay mercado activo para venderlos.',
    tip: 'Warren Buffett evita activos que no generan flujo de efectivo. Prefiere negocios que producen dinero constantemente.',
    questions: [
      '¿Tienes una valuación reciente y confiable?',
      '¿Existe un mercado líquido para venderlo?',
      '¿Genera algún ingreso (exhibición, alquiler)?'
    ]
  }
};

export function AssetDialog({ open, onOpenChange, editingAsset }: AssetDialogProps) {
  const { t } = useLanguage();
  const { data: profile } = useProfile();
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

  const [showWarning, setShowWarning] = useState(false);
  const [acknowledgedWarning, setAcknowledgedWarning] = useState(false);
  const [generatesIncome, setGeneratesIncome] = useState(false);

  const userName = profile?.full_name?.split(' ')[0] || 'Usuario';

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
      setAcknowledgedWarning(false);
      setGeneratesIncome(false);
    }
  }, [editingAsset, open]);

  // Check if category requires warning
  useEffect(() => {
    const needsWarning = DEPRECIATING_CATEGORIES.includes(formData.category) || 
                         formData.category === 'collectibles';
    setShowWarning(needsWarning && !acknowledgedWarning);
  }, [formData.category, acknowledgedWarning]);

  const handleSave = async () => {
    if (!formData.name || formData.current_value <= 0) return;

    // If it's a depreciating asset that doesn't generate income, add note
    let finalNotes = formData.notes;
    if (DEPRECIATING_CATEGORIES.includes(formData.category) && generatesIncome) {
      finalNotes = `[Genera ingresos] ${formData.notes}`;
    }

    const assetData = {
      ...formData,
      notes: finalNotes || null,
      purchase_value: formData.purchase_value || null,
      purchase_date: formData.purchase_date || null,
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
  const educationContent = ASSET_EDUCATION[formData.category as keyof typeof ASSET_EDUCATION];

  const canProceed = !showWarning || acknowledgedWarning;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
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
              placeholder="Ej: Cuenta de Ahorros, Portafolio de Inversión..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Categoría</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => {
                setFormData({ ...formData, category: value });
                setAcknowledgedWarning(false);
                setGeneratesIncome(false);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="text-xs text-muted-foreground">Activos Generales</SelectLabel>
                  {ASSET_CATEGORIES.filter(c => c.group === 'general').map((cat) => {
                    const CatIcon = iconMap[cat.icon];
                    const isDepreciating = DEPRECIATING_CATEGORIES.includes(cat.value);
                    return (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          {CatIcon && <CatIcon className="h-4 w-4" />}
                          {cat.label}
                          {isDepreciating && (
                            <AlertTriangle className="h-3 w-3 text-amber-500 ml-1" />
                          )}
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

          {/* Educational Warning for Depreciating Assets */}
          {showWarning && educationContent && (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <AlertTitle className="text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <span>¡Ojo, {userName}!</span>
                <BookOpen className="h-4 w-4" />
              </AlertTitle>
              <AlertDescription className="space-y-3 text-sm">
                <p className="font-medium">{educationContent.title}</p>
                <p>{educationContent.warning}</p>
                
                <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">💡 Excepción:</p>
                  <p className="text-xs">{educationContent.exception}</p>
                </div>

                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                  <p className="text-xs italic">"{educationContent.tip}"</p>
                </div>

                <div className="space-y-2 pt-2">
                  <p className="text-xs font-medium">Responde honestamente:</p>
                  {educationContent.questions.map((q, i) => (
                    <p key={i} className="text-xs flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">{i + 1}</span>
                      {q}
                    </p>
                  ))}
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="generates-income"
                      checked={generatesIncome}
                      onCheckedChange={setGeneratesIncome}
                    />
                    <Label htmlFor="generates-income" className="text-sm font-medium">
                      Sí, este {formData.category === 'vehicles' ? 'vehículo' : 'activo'} genera ingresos
                    </Label>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setAcknowledgedWarning(true)}
                    className="mt-2"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Entiendo, quiero agregarlo de todos modos
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Acknowledged info box */}
          {acknowledgedWarning && DEPRECIATING_CATEGORIES.includes(formData.category) && (
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <Lightbulb className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-sm">
                {generatesIncome ? (
                  <span className="text-green-600 dark:text-green-400">
                    ✓ Perfecto, {userName}. Si genera ingresos, es un activo válido. ¡Asegúrate de trackear esos ingresos también!
                  </span>
                ) : (
                  <span>
                    Recuerda: Este {formData.category === 'vehicles' ? 'vehículo' : 'activo'} se depreciará con el tiempo. 
                    Considera invertir en activos que generen flujo de efectivo.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

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

          {/* Show depreciation if applicable */}
          {formData.purchase_value > 0 && formData.current_value < formData.purchase_value && (
            <Alert className="border-red-500/30 bg-red-500/5">
              <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
              <AlertDescription className="text-sm text-red-600 dark:text-red-400">
                Este activo ha perdido {' '}
                <strong>
                  ${(formData.purchase_value - formData.current_value).toLocaleString()} 
                  ({((1 - formData.current_value / formData.purchase_value) * 100).toFixed(1)}%)
                </strong>
                {' '}de su valor original.
              </AlertDescription>
            </Alert>
          )}

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
              placeholder={generatesIncome ? "¿Cómo genera ingresos este activo?" : "Detalles adicionales..."}
              rows={2}
            />
          </div>

          {/* Asset Education Box */}
          <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              ¿Qué es un activo?
            </h4>
            <p className="text-xs text-muted-foreground">
              Un <strong>activo</strong> es algo que pone dinero en tu bolsillo: inversiones que generan dividendos, 
              propiedades que rentas, negocios que producen ganancias. Si solo saca dinero de tu bolsillo 
              (mantenimiento, seguros, gastos) sin generar ingresos, es más bien un <strong>pasivo disfrazado</strong>.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!formData.name || formData.current_value <= 0 || !canProceed || createAsset.isPending || updateAsset.isPending}
          >
            {editingAsset ? 'Guardar' : 'Agregar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
