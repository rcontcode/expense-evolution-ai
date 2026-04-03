import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Receipt, FileText, Landmark, Shield, Award, Building2, 
  Upload, X, CheckCircle2, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export const DOC_CHECKLIST_STORAGE_KEY = 'doc-onboarding-checklist';

export function resetDocChecklist() {
  localStorage.removeItem(DOC_CHECKLIST_STORAGE_KEY);
}

interface ChecklistItem {
  id: string;
  labelEs: string;
  labelEn: string;
  descEs: string;
  descEn: string;
  icon: React.ElementType;
  selected: boolean;
  completed: boolean;
}

const DEFAULT_ITEMS: Omit<ChecklistItem, 'selected' | 'completed'>[] = [
  { id: 'receipts', labelEs: 'Boletas / Recibos', labelEn: 'Receipts', descEs: 'Compras, gastos diarios', descEn: 'Purchases, daily expenses', icon: Receipt },
  { id: 'invoices', labelEs: 'Facturas', labelEn: 'Invoices', descEs: 'Facturas de proveedores o clientes', descEn: 'Vendor or client invoices', icon: FileText },
  { id: 'contracts', labelEs: 'Contratos', labelEn: 'Contracts', descEs: 'Contratos de servicio, arriendo, etc.', descEn: 'Service, lease contracts', icon: Building2 },
  { id: 'bank', labelEs: 'Extractos bancarios', labelEn: 'Bank Statements', descEs: 'Estados de cuenta mensuales', descEn: 'Monthly bank statements', icon: Landmark },
  { id: 'certificates', labelEs: 'Certificados (AFP, RRSP)', labelEn: 'Certificates (401k, RRSP)', descEs: 'Certificados de ahorro o pensión', descEn: 'Savings or pension certificates', icon: Award },
  { id: 'insurance', labelEs: 'Pólizas de seguro', labelEn: 'Insurance Policies', descEs: 'Seguro de salud, auto, hogar', descEn: 'Health, auto, home insurance', icon: Shield },
];

interface DocumentOnboardingChecklistProps {
  documentCount: number;
  onUploadClick?: () => void;
}

export function DocumentOnboardingChecklist({ documentCount, onUploadClick }: DocumentOnboardingChecklistProps) {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const [dismissed, setDismissed] = useState(false);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [setupDone, setSetupDone] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Load state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(DOC_CHECKLIST_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.dismissed) { setDismissed(true); return; }
        if (parsed.setupDone) {
          setSetupDone(true);
          setItems(DEFAULT_ITEMS.map(d => ({
            ...d,
            selected: parsed.selected?.includes(d.id) ?? false,
            completed: parsed.completed?.includes(d.id) ?? false,
          })));
        }
      } catch { /* ignore */ }
    }
  }, []);

  const save = (newItems: ChecklistItem[], newSetupDone: boolean, newDismissed = false) => {
    localStorage.setItem(DOC_CHECKLIST_STORAGE_KEY, JSON.stringify({
      dismissed: newDismissed,
      setupDone: newSetupDone,
      selected: newItems.filter(i => i.selected).map(i => i.id),
      completed: newItems.filter(i => i.completed).map(i => i.id),
    }));
  };

  const handleDismiss = () => {
    setDismissed(true);
    save(items, setupDone, true);
  };

  const toggleSelect = (id: string) => {
    setItems(prev => {
      const next = prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i);
      return next;
    });
  };

  const handleStartChecklist = () => {
    const initialized = DEFAULT_ITEMS.map(d => ({
      ...d,
      selected: items.find(i => i.id === d.id)?.selected ?? false,
      completed: false,
    }));
    setItems(initialized);
    setSetupDone(true);
    save(initialized, true);
  };

  const markCompleted = (id: string) => {
    setItems(prev => {
      const next = prev.map(i => i.id === id ? { ...i, completed: true } : i);
      save(next, true);
      return next;
    });
  };

  if (dismissed) return null;
  // Hide if all done
  if (documentCount >= 10 && !setupDone) {
    // Don't auto-hide - let the user see the checklist
  }

  const selectedItems = items.filter(i => i.selected);
  const completedCount = selectedItems.filter(i => i.completed).length;
  const totalSelected = selectedItems.length;
  const allDone = setupDone && totalSelected > 0 && completedCount === totalSelected;

  if (allDone) return null;

  // Phase 1: Selection
  if (!setupDone) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {isEs ? '¿Qué documentos tienes disponibles?' : 'What documents do you have available?'}
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {isEs 
              ? 'Selecciona los tipos que tengas y te guiaremos para subirlos todos'
              : 'Select the types you have and we\'ll guide you to upload them all'}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEFAULT_ITEMS.map(item => {
              const Icon = item.icon;
              const isSelected = items.find(i => i.id === item.id)?.selected ?? false;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (!items.length) {
                      // Initialize on first click
                      const init = DEFAULT_ITEMS.map(d => ({ ...d, selected: d.id === item.id, completed: false }));
                      setItems(init);
                    } else {
                      toggleSelect(item.id);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                    isSelected
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                      : 'border-border hover:border-primary/40 hover:bg-muted/50'
                  )}
                >
                  <Icon className={cn('h-5 w-5 shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{isEs ? item.labelEs : item.labelEn}</p>
                    <p className="text-xs text-muted-foreground truncate">{isEs ? item.descEs : item.descEn}</p>
                  </div>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>
          <Button
            onClick={handleStartChecklist}
            disabled={!items.some(i => i.selected)}
            className="w-full gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isEs ? 'Comenzar a subir' : 'Start uploading'}
            {items.filter(i => i.selected).length > 0 && (
              <Badge variant="secondary" className="ml-1">{items.filter(i => i.selected).length}</Badge>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Phase 2: Progress checklist
  const progress = totalSelected > 0 ? (completedCount / totalSelected) * 100 : 0;

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
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-2 space-y-1.5">
            {selectedItems.map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 p-2.5 rounded-lg border transition-all',
                    item.completed
                      ? 'border-primary/20 bg-primary/5 opacity-70'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', item.completed ? 'text-primary' : 'text-muted-foreground')} />
                  <span className={cn('text-sm flex-1', item.completed && 'line-through text-muted-foreground')}>
                    {isEs ? item.labelEs : item.labelEn}
                  </span>
                  {item.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => {
                        onUploadClick?.();
                        // Mark as completed (user will upload via the main uploader)
                        markCompleted(item.id);
                      }}
                    >
                      <Upload className="h-3 w-3" />
                      {isEs ? 'Subir' : 'Upload'}
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
