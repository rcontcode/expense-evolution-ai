import { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, Landmark, User, ChevronRight, Check, 
  Sparkles, AlertTriangle, SkipForward, Trophy,
  Receipt, Tag, ArrowRight, Zap, PartyPopper
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useClients } from '@/hooks/data/useClients';
import { useContracts } from '@/hooks/data/useContracts';
import { useProjects } from '@/hooks/data/useProjects';
import { useUpdateExpense } from '@/hooks/data/useExpenses';
import { useLanguage } from '@/contexts/LanguageContext';
import { ExpenseWithRelations } from '@/types/expense.types';
import { getCategoryLabelByLanguage } from '@/lib/constants/expense-categories';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface QuickClassifyDialogProps {
  open: boolean;
  onClose: () => void;
  expenses: ExpenseWithRelations[];
}

type ReimbursementType = 'client_reimbursable' | 'cra_deductible' | 'personal';

const REIMBURSEMENT_OPTIONS: { value: ReimbursementType; label: { es: string; en: string }; description: { es: string; en: string }; icon: typeof Building2; gradient: string; border: string }[] = [
  { 
    value: 'client_reimbursable', 
    label: { es: 'Reembolsable por Cliente', en: 'Client Reimbursable' }, 
    description: { es: 'El cliente te debe este gasto', en: 'Client owes you this expense' },
    icon: Building2, 
    gradient: 'from-blue-500/15 to-blue-600/5',
    border: 'border-blue-400 dark:border-blue-600 shadow-blue-500/20'
  },
  { 
    value: 'cra_deductible', 
    label: { es: 'Deducible Impuestos', en: 'Tax Deductible' },
    description: { es: 'Deducible de impuestos en tu declaración', en: 'Tax deductible on your return' },
    icon: Landmark, 
    gradient: 'from-emerald-500/15 to-emerald-600/5',
    border: 'border-emerald-400 dark:border-emerald-600 shadow-emerald-500/20'
  },
  { 
    value: 'personal', 
    label: { es: 'Personal (No Deducible)', en: 'Personal (Not Deductible)' },
    description: { es: 'Gasto personal, no reclamable', en: 'Personal expense, not claimable' },
    icon: User, 
    gradient: 'from-orange-500/15 to-orange-600/5',
    border: 'border-orange-400 dark:border-orange-600 shadow-orange-500/20'
  },
];

const CATEGORY_EMOJI: Record<string, string> = {
  meals: '🍽️', travel: '✈️', equipment: '💻', software: '🖥️',
  mileage: '🚗', home_office: '🏠', professional_services: '👔',
  office_supplies: '📎', utilities: '⚡', fuel: '⛽', other: '📦',
};

export function QuickClassifyDialog({ open, onClose, expenses }: QuickClassifyDialogProps) {
  const { language } = useLanguage();
  const { data: clients = [] } = useClients();
  const { data: contracts = [] } = useContracts();
  const { data: projects = [] } = useProjects();
  const updateExpense = useUpdateExpense();

  const pendingExpenses = useMemo(() => 
    expenses.filter(e => !e.deleted_at && e.reimbursement_type === 'pending_classification'),
    [expenses]
  );

  const [selectedType, setSelectedType] = useState<ReimbursementType | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [classifiedIds, setClassifiedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  const remainingExpenses = useMemo(() => 
    pendingExpenses.filter(e => !classifiedIds.has(e.id)),
    [pendingExpenses, classifiedIds]
  );

  const current = remainingExpenses[0];
  const total = pendingExpenses.length;
  const classified = classifiedIds.size;
  const progress = total > 0 ? (classified / total) * 100 : 0;

  const clientContracts = useMemo(() => 
    selectedClientId ? contracts.filter(c => c.client_id === selectedClientId && !c.deleted_at) : [],
    [contracts, selectedClientId]
  );

  const clientProjects = useMemo(() => 
    selectedClientId ? projects.filter(p => (p as any).client_id === selectedClientId) : [],
    [projects, selectedClientId]
  );

  const resetSelection = useCallback(() => {
    setSelectedType(null);
    setSelectedClientId('');
    setSelectedContractId('');
    setSelectedProjectId('');
    setDirection(1);
  }, []);

  const fireCelebration = useCallback(() => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'],
    });
  }, []);

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
        if (selectedProjectId) updates.project_id = selectedProjectId;
      }

      await updateExpense.mutateAsync({ id: current.id, updates });
      
      const newClassified = new Set(classifiedIds).add(current.id);
      setClassifiedIds(newClassified);
      
      // Check if all done AFTER updating the set
      if (newClassified.size >= total) {
        fireCelebration();
        setShowComplete(true);
        toast.success(language === 'es' ? '🎉 ¡Todos los gastos clasificados!' : '🎉 All expenses classified!');
      } else {
        toast.success(language === 'es' ? '✓ Clasificado' : '✓ Classified');
      }
      resetSelection();
    } catch (err) {
      toast.error(language === 'es' ? 'Error al clasificar' : 'Error classifying');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    if (current) {
      setDirection(1);
      const newClassified = new Set(classifiedIds).add(current.id);
      setClassifiedIds(newClassified);
      resetSelection();
      if (newClassified.size >= total) {
        setShowComplete(true);
      }
    }
  };

  const handleClose = () => {
    setClassifiedIds(new Set());
    setShowComplete(false);
    resetSelection();
    onClose();
  };

  // Progress color based on completion
  const progressColor = progress >= 80 ? 'bg-emerald-500' : progress >= 50 ? 'bg-blue-500' : 'bg-amber-500';

  if (total === 0) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-8 text-center">
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }} 
              transition={{ type: 'spring', stiffness: 200 }}
              className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4"
            >
              <Trophy className="h-10 w-10 text-emerald-600" />
            </motion.div>
            <h3 className="text-xl font-bold">
              {language === 'es' ? '¡Todo clasificado!' : 'All classified!'}
            </h3>
            <p className="text-muted-foreground text-sm mt-2">
              {language === 'es' ? 'No hay gastos pendientes. Tus reportes están listos.' : 'No pending expenses. Your reports are ready.'}
            </p>
            <Button onClick={handleClose} className="mt-6">
              {language === 'es' ? 'Cerrar' : 'Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white">
              <Zap className="h-4 w-4" />
            </div>
            {language === 'es' ? 'Clasificación Rápida' : 'Quick Classification'}
          </DialogTitle>
          <DialogDescription>
            {language === 'es' 
              ? 'Clasifica cada gasto para generar reportes precisos' 
              : 'Classify each expense for accurate reports'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">
              {classified} / {total} {language === 'es' ? 'clasificados' : 'classified'}
            </span>
            <motion.span 
              key={classified}
              initial={{ scale: 1.3, color: 'hsl(var(--primary))' }} 
              animate={{ scale: 1, color: 'hsl(var(--muted-foreground))' }}
              className="font-bold"
            >
              {Math.round(progress)}%
            </motion.span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div 
              className={cn("h-full rounded-full", progressColor)}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {showComplete ? (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-8 text-center"
            >
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }} 
                transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
                className="p-5 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/20 mb-4"
              >
                <PartyPopper className="h-12 w-12 text-emerald-600" />
              </motion.div>
              <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {language === 'es' ? '¡Clasificación completa!' : 'Classification complete!'}
              </h3>
              <p className="text-muted-foreground text-sm mt-2 max-w-xs">
                {language === 'es' 
                  ? 'Ahora puedes generar reportes de reembolso y T2125 con datos precisos.' 
                  : 'You can now generate reimbursement and T2125 reports with accurate data.'}
              </p>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={handleClose}>
                  {language === 'es' ? 'Cerrar' : 'Close'}
                </Button>
                <Button onClick={() => {
                  handleClose();
                  // Navigate to export
                  window.dispatchEvent(new CustomEvent('open-export-dialog'));
                }} className="bg-emerald-600 hover:bg-emerald-700">
                  <Receipt className="h-4 w-4 mr-2" />
                  {language === 'es' ? 'Generar Reportes' : 'Generate Reports'}
                </Button>
              </div>
            </motion.div>
          ) : current ? (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: direction * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -30 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Current expense card */}
              <Card className="border-2 border-primary/20 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-primary/20" />
                <CardContent className="pt-4 space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{CATEGORY_EMOJI[current.category || 'other'] || '📦'}</span>
                        <p className="font-semibold text-lg truncate">{current.vendor || (language === 'es' ? 'Sin proveedor' : 'No vendor')}</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{current.date}</p>
                    </div>
                    <motion.p 
                      key={current.amount}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className="text-2xl font-bold text-primary whitespace-nowrap"
                    >
                      ${Number(current.amount).toFixed(2)}
                    </motion.p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {getCategoryLabelByLanguage(current.category || 'other', language)}
                    </Badge>
                    {current.description && (
                      <Badge variant="outline" className="text-xs font-normal max-w-[200px] truncate">
                        {current.description}
                      </Badge>
                    )}
                    {!current.document_id && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                        {language === 'es' ? 'Sin recibo' : 'No receipt'}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Classification options */}
              <div className="space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  {language === 'es' ? '¿Qué tipo de gasto es?' : 'What type of expense?'}
                </p>
                <div className="grid gap-2">
                  {REIMBURSEMENT_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const isSelected = selectedType === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setSelectedType(opt.value); setSelectedClientId(''); setSelectedContractId(''); setSelectedProjectId(''); }}
                        className={cn(
                          'flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left',
                          isSelected 
                            ? `bg-gradient-to-r ${opt.gradient} ${opt.border} shadow-md` 
                            : 'border-border/50 hover:border-muted-foreground/30 hover:bg-accent/50'
                        )}
                      >
                        <div className={cn(
                          'p-2 rounded-lg transition-colors',
                          isSelected ? 'bg-white/50 dark:bg-white/10' : 'bg-muted'
                        )}>
                          <Icon className="h-4 w-4 shrink-0" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm block">{opt.label[language]}</span>
                          <span className="text-xs text-muted-foreground">{opt.description[language]}</span>
                        </div>
                        {isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <Check className="h-5 w-5 text-primary" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Client/Contract/Project selectors for reimbursable */}
              <AnimatePresence>
                {selectedType === 'client_reimbursable' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-blue-600" />
                          {language === 'es' ? 'Cliente *' : 'Client *'}
                        </label>
                        <Select value={selectedClientId} onValueChange={(v) => { setSelectedClientId(v); setSelectedContractId(''); setSelectedProjectId(''); }}>
                          <SelectTrigger className="bg-white dark:bg-background">
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
                          <label className="text-sm font-medium text-muted-foreground">
                            {language === 'es' ? 'Contrato (opcional)' : 'Contract (optional)'}
                          </label>
                          <Select value={selectedContractId} onValueChange={setSelectedContractId}>
                            <SelectTrigger className="bg-white dark:bg-background">
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
                        <motion.p 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="text-xs text-amber-600 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg"
                        >
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          {language === 'es' ? 'Selecciona un cliente para continuar' : 'Select a client to continue'}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground hover:text-foreground">
                  <SkipForward className="h-4 w-4 mr-1" />
                  {language === 'es' ? 'Saltar' : 'Skip'}
                </Button>
                <div className="flex-1" />
                <Button
                  onClick={handleClassify}
                  disabled={!selectedType || isSaving || (selectedType === 'client_reimbursable' && !selectedClientId)}
                  size="lg"
                  className="min-w-[140px] shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                >
                  {isSaving ? (
                    <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                      {language === 'es' ? 'Guardando...' : 'Saving...'}
                    </motion.span>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1.5" />
                      {language === 'es' ? 'Clasificar' : 'Classify'}
                      {remainingExpenses.length > 1 && (
                        <ChevronRight className="h-4 w-4 ml-1" />
                      )}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
