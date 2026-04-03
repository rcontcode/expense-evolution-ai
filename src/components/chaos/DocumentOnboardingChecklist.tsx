import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Heart, ShoppingBag, UtensilsCrossed, Home, Car, Landmark, Shield, 
  Building2, Receipt, DollarSign, Upload, X, CheckCircle2, Sparkles, 
  ChevronDown, ChevronUp, Stethoscope, Pill, Eye, FlaskConical,
  Hammer, HardHat, Monitor, Printer, ShoppingCart, Coffee, Truck,
  Droplets, Zap, Flame, Wifi, Phone, KeyRound, Fuel, ParkingCircle,
  Wrench, Bus, CreditCard, TrendingUp, FileText, BadgeDollarSign,
  HeartPulse, CarFront, HomeIcon, UserCheck, Briefcase, Scale, Stamp,
  Calculator, Gift, Banknote, FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export const DOC_CHECKLIST_STORAGE_KEY = 'doc-onboarding-checklist';

export function resetDocChecklist() {
  localStorage.removeItem(DOC_CHECKLIST_STORAGE_KEY);
}

interface SubType {
  id: string;
  labelEs: string;
  labelEn: string;
  icon: React.ElementType;
}

interface Category {
  id: string;
  labelEs: string;
  labelEn: string;
  descEs: string;
  descEn: string;
  emoji: string;
  icon: React.ElementType;
  color: string;
  subtypes: SubType[];
}

const CATEGORIES: Category[] = [
  {
    id: 'health', labelEs: 'Salud', labelEn: 'Health',
    descEs: 'Gastos médicos, dentales, farmacia', descEn: 'Medical, dental, pharmacy expenses',
    emoji: '🏥', icon: Heart, color: 'emerald',
    subtypes: [
      { id: 'medical_receipt', labelEs: 'Boletas médicas', labelEn: 'Medical receipts', icon: Stethoscope },
      { id: 'dental', labelEs: 'Dentales', labelEn: 'Dental', icon: Heart },
      { id: 'pharmacy', labelEs: 'Farmacia', labelEn: 'Pharmacy', icon: Pill },
      { id: 'optical', labelEs: 'Óptica', labelEn: 'Optical', icon: Eye },
      { id: 'lab_results', labelEs: 'Exámenes de laboratorio', labelEn: 'Lab results', icon: FlaskConical },
    ],
  },
  {
    id: 'shopping', labelEs: 'Compras y materiales', labelEn: 'Shopping & Materials',
    descEs: 'Herramientas, materiales, suministros', descEn: 'Tools, materials, supplies',
    emoji: '🛒', icon: ShoppingBag, color: 'orange',
    subtypes: [
      { id: 'tools', labelEs: 'Herramientas', labelEn: 'Tools', icon: Hammer },
      { id: 'construction', labelEs: 'Materiales de construcción', labelEn: 'Construction materials', icon: HardHat },
      { id: 'office_supplies', labelEs: 'Suministros de oficina', labelEn: 'Office supplies', icon: Printer },
      { id: 'electronics', labelEs: 'Electrónica', labelEn: 'Electronics', icon: Monitor },
    ],
  },
  {
    id: 'food', labelEs: 'Alimentos', labelEn: 'Food',
    descEs: 'Supermercado, restaurantes, delivery', descEn: 'Grocery, restaurants, delivery',
    emoji: '🍽️', icon: UtensilsCrossed, color: 'amber',
    subtypes: [
      { id: 'grocery', labelEs: 'Supermercado', labelEn: 'Grocery', icon: ShoppingCart },
      { id: 'restaurant', labelEs: 'Restaurantes', labelEn: 'Restaurants', icon: UtensilsCrossed },
      { id: 'delivery', labelEs: 'Delivery', labelEn: 'Delivery', icon: Truck },
      { id: 'cafe', labelEs: 'Cafetería', labelEn: 'Café', icon: Coffee },
    ],
  },
  {
    id: 'home', labelEs: 'Hogar y servicios', labelEn: 'Home & Utilities',
    descEs: 'Agua, luz, gas, internet, arriendo', descEn: 'Water, power, gas, internet, rent',
    emoji: '🏠', icon: Home, color: 'blue',
    subtypes: [
      { id: 'water', labelEs: 'Agua', labelEn: 'Water', icon: Droplets },
      { id: 'electricity', labelEs: 'Electricidad', labelEn: 'Electricity', icon: Zap },
      { id: 'gas', labelEs: 'Gas', labelEn: 'Gas', icon: Flame },
      { id: 'internet', labelEs: 'Internet', labelEn: 'Internet', icon: Wifi },
      { id: 'phone_bill', labelEs: 'Teléfono', labelEn: 'Phone', icon: Phone },
      { id: 'rent', labelEs: 'Arriendo', labelEn: 'Rent', icon: KeyRound },
    ],
  },
  {
    id: 'transport', labelEs: 'Transporte', labelEn: 'Transport',
    descEs: 'Combustible, peajes, mantención', descEn: 'Fuel, tolls, maintenance',
    emoji: '🚗', icon: Car, color: 'violet',
    subtypes: [
      { id: 'fuel', labelEs: 'Combustible', labelEn: 'Fuel', icon: Fuel },
      { id: 'tolls', labelEs: 'Peajes', labelEn: 'Tolls', icon: Receipt },
      { id: 'parking', labelEs: 'Estacionamiento', labelEn: 'Parking', icon: ParkingCircle },
      { id: 'vehicle_maintenance', labelEs: 'Mantención vehículo', labelEn: 'Vehicle maintenance', icon: Wrench },
      { id: 'public_transport', labelEs: 'Transporte público', labelEn: 'Public transport', icon: Bus },
    ],
  },
  {
    id: 'financial', labelEs: 'Financieros', labelEn: 'Financial',
    descEs: 'Extractos, certificados, inversiones', descEn: 'Statements, certificates, investments',
    emoji: '🏦', icon: Landmark, color: 'indigo',
    subtypes: [
      { id: 'bank_statement', labelEs: 'Extractos bancarios', labelEn: 'Bank statements', icon: Landmark },
      { id: 'pension_cert', labelEs: 'Certificados AFP/RRSP', labelEn: '401k/RRSP certificates', icon: FileCheck },
      { id: 'investments', labelEs: 'Inversiones', labelEn: 'Investments', icon: TrendingUp },
      { id: 'credit_card_stmt', labelEs: 'Estados de tarjeta', labelEn: 'Credit card statements', icon: CreditCard },
    ],
  },
  {
    id: 'insurance', labelEs: 'Seguros', labelEn: 'Insurance',
    descEs: 'Salud, auto, hogar, vida', descEn: 'Health, auto, home, life',
    emoji: '🛡️', icon: Shield, color: 'pink',
    subtypes: [
      { id: 'health_insurance', labelEs: 'Seguro de salud', labelEn: 'Health insurance', icon: HeartPulse },
      { id: 'auto_insurance', labelEs: 'Seguro de auto', labelEn: 'Auto insurance', icon: CarFront },
      { id: 'home_insurance', labelEs: 'Seguro de hogar', labelEn: 'Home insurance', icon: HomeIcon },
      { id: 'life_insurance', labelEs: 'Seguro de vida', labelEn: 'Life insurance', icon: UserCheck },
    ],
  },
  {
    id: 'contracts', labelEs: 'Contratos y legales', labelEn: 'Contracts & Legal',
    descEs: 'Servicios, arriendo, trabajo', descEn: 'Service, lease, employment',
    emoji: '📋', icon: Building2, color: 'slate',
    subtypes: [
      { id: 'service_contract', labelEs: 'Contrato de servicio', labelEn: 'Service contract', icon: Briefcase },
      { id: 'lease_contract', labelEs: 'Contrato de arriendo', labelEn: 'Lease contract', icon: KeyRound },
      { id: 'employment_contract', labelEs: 'Contrato de trabajo', labelEn: 'Employment contract', icon: UserCheck },
      { id: 'notarial', labelEs: 'Documentos notariales', labelEn: 'Notarial documents', icon: Scale },
    ],
  },
  {
    id: 'taxes', labelEs: 'Impuestos', labelEn: 'Taxes',
    descEs: 'Declaraciones, formularios, donaciones', descEn: 'Returns, forms, donations',
    emoji: '📊', icon: Calculator, color: 'red',
    subtypes: [
      { id: 'tax_return', labelEs: 'Declaraciones', labelEn: 'Tax returns', icon: Calculator },
      { id: 'tax_form', labelEs: 'Formularios fiscales', labelEn: 'Tax forms', icon: FileText },
      { id: 'donation_receipt', labelEs: 'Boletas de donación', labelEn: 'Donation receipts', icon: Gift },
    ],
  },
  {
    id: 'income', labelEs: 'Ingresos', labelEn: 'Income',
    descEs: 'Sueldos, honorarios, facturas emitidas', descEn: 'Salary, fees, issued invoices',
    emoji: '💰', icon: DollarSign, color: 'teal',
    subtypes: [
      { id: 'payslip', labelEs: 'Liquidaciones de sueldo', labelEn: 'Payslips', icon: Banknote },
      { id: 'fee_receipt', labelEs: 'Boletas de honorarios', labelEn: 'Fee receipts', icon: BadgeDollarSign },
      { id: 'issued_invoice', labelEs: 'Facturas emitidas', labelEn: 'Issued invoices', icon: Stamp },
    ],
  },
];

// Color utility
const colorMap: Record<string, { bg: string; border: string; text: string; ring: string; progress: string }> = {
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-600', ring: 'ring-emerald-500/30', progress: 'bg-emerald-500' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-600', ring: 'ring-orange-500/30', progress: 'bg-orange-500' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-600', ring: 'ring-amber-500/30', progress: 'bg-amber-500' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-600', ring: 'ring-blue-500/30', progress: 'bg-blue-500' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-600', ring: 'ring-violet-500/30', progress: 'bg-violet-500' },
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-600', ring: 'ring-indigo-500/30', progress: 'bg-indigo-500' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-600', ring: 'ring-pink-500/30', progress: 'bg-pink-500' },
  slate: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-600', ring: 'ring-slate-500/30', progress: 'bg-slate-500' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-600', ring: 'ring-red-500/30', progress: 'bg-red-500' },
  teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-600', ring: 'ring-teal-500/30', progress: 'bg-teal-500' },
};

interface DocumentOnboardingChecklistProps {
  documentCount: number;
  onUploadClick?: () => void;
  uploadedTypes?: string[];
}

export function DocumentOnboardingChecklist({ documentCount, onUploadClick }: DocumentOnboardingChecklistProps) {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const [dismissed, setDismissed] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const [selectedSubtypes, setSelectedSubtypes] = useState<Set<string>>(new Set());
  const [completedSubtypes, setCompletedSubtypes] = useState<Set<string>>(new Set());
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(DOC_CHECKLIST_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.dismissed) { setDismissed(true); return; }
        if (parsed.setupDone) {
          setSetupDone(true);
          setSelectedSubtypes(new Set(parsed.selected ?? []));
          setCompletedSubtypes(new Set(parsed.completed ?? []));
        }
      } catch { /* ignore */ }
    }
  }, []);

  const save = (selected: Set<string>, completed: Set<string>, done: boolean, isDismissed = false) => {
    localStorage.setItem(DOC_CHECKLIST_STORAGE_KEY, JSON.stringify({
      dismissed: isDismissed,
      setupDone: done,
      selected: [...selected],
      completed: [...completed],
    }));
  };

  const handleDismiss = () => {
    setDismissed(true);
    save(selectedSubtypes, completedSubtypes, setupDone, true);
  };

  const toggleSubtype = (id: string) => {
    setSelectedSubtypes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllCategory = (cat: Category) => {
    setSelectedSubtypes(prev => {
      const next = new Set(prev);
      const allSelected = cat.subtypes.every(s => next.has(s.id));
      cat.subtypes.forEach(s => { if (allSelected) next.delete(s.id); else next.add(s.id); });
      return next;
    });
  };

  const handleStart = () => {
    setSetupDone(true);
    save(selectedSubtypes, completedSubtypes, true);
  };

  const markCompleted = (id: string) => {
    setCompletedSubtypes(prev => {
      const next = new Set(prev);
      next.add(id);
      save(selectedSubtypes, next, true);
      return next;
    });
  };

  if (dismissed) return null;

  const totalSelected = selectedSubtypes.size;
  const completedCount = [...selectedSubtypes].filter(id => completedSubtypes.has(id)).length;
  const allDone = setupDone && totalSelected > 0 && completedCount === totalSelected;
  if (allDone) return null;

  // Phase 1: Category & subtype selection
  if (!setupDone) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {isEs ? '¿Qué documentos tienes disponibles?' : 'What documents do you have?'}
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {isEs
              ? '🎯 Sube lo que tengas, como lo tengas — fotos, PDFs, capturas. ¡Nosotros lo organizamos!'
              : '🎯 Upload whatever you have — photos, PDFs, screenshots. We\'ll organize it!'}
          </p>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const colors = colorMap[cat.color];
              const isExpanded = expandedCategory === cat.id;
              const catSelectedCount = cat.subtypes.filter(s => selectedSubtypes.has(s.id)).length;
              const allCatSelected = catSelectedCount === cat.subtypes.length;

              return (
                <div key={cat.id} className="space-y-1">
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200',
                      'hover:shadow-md hover:scale-[1.02] active:translate-y-0.5',
                      isExpanded ? `${colors.bg} ${colors.border} ring-1 ${colors.ring}` : 'border-border hover:border-primary/40',
                      catSelectedCount > 0 && !isExpanded && `${colors.bg} ${colors.border}`
                    )}
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <Icon className={cn('h-5 w-5 shrink-0', colors.text)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{isEs ? cat.labelEs : cat.labelEn}</p>
                      <p className="text-xs text-muted-foreground truncate">{isEs ? cat.descEs : cat.descEn}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {catSelectedCount > 0 && (
                        <Badge variant="secondary" className="text-xs h-5 px-1.5">{catSelectedCount}</Badge>
                      )}
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className={cn('ml-2 p-2 rounded-lg border space-y-1.5', colors.bg, colors.border)}>
                      <button
                        onClick={() => toggleAllCategory(cat)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
                      >
                        {allCatSelected
                          ? (isEs ? '✕ Deseleccionar todos' : '✕ Deselect all')
                          : (isEs ? '✓ Seleccionar todos' : '✓ Select all')}
                      </button>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.subtypes.map(sub => {
                          const SubIcon = sub.icon;
                          const isSelected = selectedSubtypes.has(sub.id);
                          return (
                            <button
                              key={sub.id}
                              onClick={() => toggleSubtype(sub.id)}
                              className={cn(
                                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all duration-150',
                                'hover:scale-105 active:scale-95',
                                isSelected
                                  ? `${colors.border} ${colors.bg} ${colors.text} ring-1 ${colors.ring}`
                                  : 'border-border bg-background hover:bg-muted/50'
                              )}
                            >
                              <SubIcon className="h-3.5 w-3.5" />
                              {isEs ? sub.labelEs : sub.labelEn}
                              {isSelected && <CheckCircle2 className="h-3 w-3" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="sticky bottom-0 bg-card pt-2 border-t">
            <Button onClick={handleStart} disabled={totalSelected === 0} className="w-full gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {isEs ? 'Comenzar a subir' : 'Start uploading'}
              {totalSelected > 0 && <Badge variant="secondary" className="ml-1">{totalSelected}</Badge>}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-1.5">
              {isEs ? '💡 No importa el orden — sube primero lo que tengas a mano' : '💡 Order doesn\'t matter — upload whatever you have handy first'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Phase 2: Progress
  const progress = totalSelected > 0 ? (completedCount / totalSelected) * 100 : 0;

  // Group selected subtypes by category
  const groupedSelected = CATEGORIES
    .map(cat => ({
      ...cat,
      items: cat.subtypes.filter(s => selectedSubtypes.has(s.id)),
    }))
    .filter(g => g.items.length > 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {isEs ? 'Progreso de documentos' : 'Document progress'}
                <Badge variant="outline" className="text-xs">{completedCount}/{totalSelected}</Badge>
              </CardTitle>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
          {completedCount > 0 && completedCount < totalSelected && (
            <p className="text-xs text-muted-foreground">
              {isEs
                ? `🔥 ¡Ya subiste ${completedCount} de ${totalSelected}! Sigue así`
                : `🔥 ${completedCount} of ${totalSelected} uploaded! Keep going`}
            </p>
          )}
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-2 space-y-3 max-h-[50vh] overflow-y-auto">
            <p className="text-xs text-muted-foreground italic">
              {isEs ? '📦 Puedes subir en cualquier orden — esto es el Caos organizado' : '📦 Upload in any order — this is organized Chaos'}
            </p>
            {groupedSelected.map(group => {
              const colors = colorMap[group.color];
              const groupCompleted = group.items.filter(s => completedSubtypes.has(s.id)).length;
              return (
                <div key={group.id} className="space-y-1">
                  <div className={cn('flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium', colors.bg, colors.text)}>
                    <span>{group.emoji}</span>
                    {isEs ? group.labelEs : group.labelEn}
                    <span className="ml-auto text-xs opacity-70">{groupCompleted}/{group.items.length}</span>
                  </div>
                  {group.items.map(sub => {
                    const SubIcon = sub.icon;
                    const done = completedSubtypes.has(sub.id);
                    return (
                      <div
                        key={sub.id}
                        className={cn(
                          'flex items-center gap-3 p-2 rounded-lg border transition-all duration-200',
                          done ? `${colors.bg} ${colors.border} opacity-70` : 'border-border hover:bg-muted/50'
                        )}
                      >
                        <SubIcon className={cn('h-4 w-4 shrink-0', done ? colors.text : 'text-muted-foreground')} />
                        <span className={cn('text-sm flex-1', done && 'line-through text-muted-foreground')}>
                          {isEs ? sub.labelEs : sub.labelEn}
                        </span>
                        {done ? (
                          <CheckCircle2 className={cn('h-4 w-4 shrink-0', colors.text)} />
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={() => { onUploadClick?.(); markCompleted(sub.id); }}
                          >
                            <Upload className="h-3 w-3" />
                            {isEs ? 'Subir' : 'Upload'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
