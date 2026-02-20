import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, Landmark, User, ChevronRight, ChevronLeft, Check, 
  Sparkles, AlertTriangle, SkipForward, X
} from 'lucide-react';
import { useClients } from '@/hooks/data/useClients';
import { useContracts } from '@/hooks/data/useContracts';
import { useUpdateExpense } from '@/hooks/data/useExpenses';
import { useLanguage } from '@/contexts/LanguageContext';
import { ExpenseWithRelations } from '@/types/expense.types';
import { getCategoryLabelByLanguage } from '@/lib/constants/expense-categories';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuickClassifyDialogProps {
  open: boolean;
  onClose: () => void;
  expenses: ExpenseWithRelations[];
}

type ReimbursementType = 'client_reimbursable' | 'cra_deductible' | 'personal';

const REIMBURSEMENT_OPTIONS: { value: ReimbursementType; label: { es: string; en: string }; icon: typeof Building2; color: string }[] = [
  { value: 'client_reimbursable', label: { es: 'Reembolsable por Cliente', en: 'Client Reimbursable' }, icon: Building2, color: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800' },
  { value: 'cra_deductible', label: { es: 'Deducible CRA', en: 'CRA Deductible' }, icon: Landmark, color: 'bg-green-500/10 text-green-600 border-green-200 dark:border-green-800' },
  { value: 'personal', label: { es: 'Personal', en: 'Personal' }, icon: User, color: 'bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-800' },
];

export function QuickClassifyDialog({ open, onClose, expenses }: QuickClassifyDialogProps) {
  const { language } = useLanguage();
  const { data: clients = [] } = useClients();
  const { data: contracts = [] } = useContracts();
  const updateExpense = useUpdateExpense();

  const pendingExpenses = useMemo(() => 
    expenses.filter(e => !e.deleted_at && e.reimbursement_type === 'pending_classification'),
    [expenses]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedType, setSelectedType] = useState<ReimbursementType | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [classifiedCount, setClassifiedCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const current = pendingExpenses[currentIndex];
  const total = pendingExpenses.length;
  const progress = total > 0 ? ((classifiedCount) / total) * 100 : 0;

  const clientContracts = useMemo(() => 
    selectedClientId ? contracts.filter(c => c.client_id === selectedClientId && !c.deleted_at) : [],
    [contracts, selectedClientId]
  );

  const handleClassify = async () => {
    if (!current || !selectedType) return;
    setIsSaving(true);
    try {
      const updates: Record<string, any> = {
        reimbursement_type: selectedType,
        status: selectedType === 'cra_deductible' ? 'deductible' : 
               selectedType === 'client_reimbursable' ? 'reimbursable' : 
               'classified',
      };
      if (selectedType === 'client_reimbursable' && selectedClientId) {
        updates.client_id = selectedClientId;
        if (selectedContractId) updates.contract_id = selectedContractId;
      }

      await updateExpense.mutateAsync({ id: current.id, updates });
      setClassifiedCount(prev => prev + 1);
      toast.success(language === 'es' ? '✓ Clasificado' : '✓ Classified');
      moveNext();
    } catch (err) {
      toast.error(language === 'es' ? 'Error al clasificar' : 'Error classifying');
    } finally {
      setIsSaving(false);
    }
  };

  const moveNext = () => {
    setSelectedType(null);
    setSelectedClientId('');
    setSelectedContractId('');
    if (currentIndex < total - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      toast.success(language === 'es' ? '🎉 ¡Todos los gastos clasificados!' : '🎉 All expenses classified!');
      onClose();
    }
  };

  const handleSkip = () => moveNext();

  if (total === 0) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              {language === 'es' ? '¡Todo clasificado!' : 'All classified!'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            {language === 'es' ? 'No hay gastos pendientes de clasificación.' : 'No expenses pending classification.'}
          </p>
          <Button onClick={onClose}>{language === 'es' ? 'Cerrar' : 'Close'}</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Clasificación Rápida' : 'Quick Classification'}
          </DialogTitle>
          <DialogDescription>
            {language === 'es' 
              ? `${total - classifiedCount} gastos pendientes de clasificar` 
              : `${total - classifiedCount} expenses pending classification`}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{classifiedCount} / {total}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {current && (
          <div className="space-y-4">
            {/* Current expense card */}
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="pt-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-lg">{current.vendor || 'Sin proveedor'}</p>
                    <p className="text-sm text-muted-foreground">{current.date}</p>
                  </div>
                  <p className="text-xl font-bold">${Number(current.amount).toFixed(2)}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{getCategoryLabelByLanguage(current.category || 'other', language)}</Badge>
                  {current.description && (
                    <span className="text-xs text-muted-foreground">{current.description}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Classification options */}
            <div className="space-y-2">
              <p className="text-sm font-medium">{language === 'es' ? '¿Qué tipo de gasto es?' : 'What type of expense?'}</p>
              <div className="grid gap-2">
                {REIMBURSEMENT_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  const isSelected = selectedType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => { setSelectedType(opt.value); setSelectedClientId(''); setSelectedContractId(''); }}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                        isSelected ? opt.color + ' border-current' : 'border-border hover:border-muted-foreground/30'
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="font-medium text-sm">{opt.label[language]}</span>
                      {isSelected && <Check className="h-4 w-4 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Client/Contract selectors for reimbursable */}
            {selectedType === 'client_reimbursable' && (
              <div className="space-y-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{language === 'es' ? 'Cliente' : 'Client'}</label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'es' ? 'Seleccionar cliente...' : 'Select client...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {clientContracts.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{language === 'es' ? 'Contrato (opcional)' : 'Contract (optional)'}</label>
                    <Select value={selectedContractId} onValueChange={setSelectedContractId}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'es' ? 'Seleccionar contrato...' : 'Select contract...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {clientContracts.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.title || c.file_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {!selectedClientId && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {language === 'es' ? 'Selecciona un cliente para continuar' : 'Select a client to continue'}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
                <SkipForward className="h-4 w-4 mr-1" />
                {language === 'es' ? 'Saltar' : 'Skip'}
              </Button>
              <div className="flex-1" />
              <Button
                onClick={handleClassify}
                disabled={!selectedType || isSaving || (selectedType === 'client_reimbursable' && !selectedClientId)}
                className="min-w-[120px]"
              >
                {isSaving ? (
                  <span className="animate-pulse">{language === 'es' ? 'Guardando...' : 'Saving...'}</span>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    {language === 'es' ? 'Clasificar' : 'Classify'}
                    {currentIndex < total - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
