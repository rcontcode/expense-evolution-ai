import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle, CheckCircle2, Clock, FileText, Eye, 
  Edit3, Trash2, RotateCw, ZoomIn, ZoomOut, Maximize2,
  ArrowRight, Camera, Download, ShieldCheck, XCircle,
  CameraOff, ChevronRight, Sparkles, FileCheck, DollarSign
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useAuth } from '@/contexts/AuthContext';
import { ExpenseWithRelations } from '@/types/expense.types';
import { useDocumentsForReview, useDocumentImageUrl } from '@/hooks/data/useDocumentReview';
import { useDeleteExpense, useUpdateExpense } from '@/hooks/data/useExpenses';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ExpenseReviewCenterProps {
  expenses: ExpenseWithRelations[];
  onExportReady?: () => void;
}

interface DiscrepancyItem {
  expense: ExpenseWithRelations;
  document: any;
  expenseAmount: number;
  receiptAmount: number;
  difference: number;
  percentDiff: number;
}

// Mini image viewer for inline use
function MiniImageViewer({ filePath, className }: { filePath: string | null; className?: string }) {
  const url = useDocumentImageUrl(filePath);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const reset = () => { setScale(1); setRotation(0); setPosition({ x: 0, y: 0 }); };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale(prev => Math.max(0.5, Math.min(5, prev + (e.deltaY > 0 ? -0.15 : 0.15))));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDragging, dragStart]);

  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  if (!url) return (
    <div className={cn("flex items-center justify-center bg-muted rounded-lg", className)}>
      <Camera className="h-8 w-8 text-muted-foreground" />
    </div>
  );

  // Check if it's a PDF
  const isPdf = filePath?.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    return (
      <div className={cn("relative rounded-lg overflow-hidden border bg-black/5 dark:bg-white/5", className)}>
        <iframe src={url} className="w-full h-full border-0" title="PDF Preview" />
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-lg overflow-hidden border bg-black/5 dark:bg-white/5", className)}>
      {/* Controls */}
      <div className="absolute top-2 right-2 z-10 flex gap-1 bg-background/80 backdrop-blur-sm rounded-lg p-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(s => Math.min(5, s + 0.3))}>
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(s => Math.max(0.5, s - 0.3))}>
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRotation(r => r + 90)}>
          <RotateCw className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reset}>
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <img
          src={url}
          alt="Receipt"
          className="absolute top-1/2 left-1/2 max-w-none pointer-events-none"
          style={{
            transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            maxHeight: scale <= 1 ? '100%' : 'none',
            maxWidth: scale <= 1 ? '100%' : 'none',
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}

// Flow step indicator
function FlowStepIndicator({ 
  steps, 
  currentStep,
  language 
}: { 
  steps: { key: string; label: string; icon: React.ElementType; count: number; done: boolean }[];
  currentStep: string;
  language: string;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 px-1">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isCurrent = step.key === currentStep;
        const isDone = step.done;
        return (
          <div key={step.key} className="flex items-center gap-1 shrink-0">
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
              isCurrent && !isDone && "bg-primary/15 text-primary ring-2 ring-primary/30 shadow-sm",
              isDone && "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
              !isCurrent && !isDone && "bg-muted text-muted-foreground"
            )}>
              {isDone ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{step.label}</span>
              {step.count > 0 && !isDone && (
                <Badge variant={isCurrent ? "destructive" : "secondary"} className="px-1 py-0 text-[9px] h-4 min-w-[16px] justify-center">
                  {step.count}
                </Badge>
              )}
            </div>
            {idx < steps.length - 1 && (
              <ChevronRight className={cn(
                "h-3 w-3 shrink-0",
                isDone ? "text-emerald-400" : "text-muted-foreground/40"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ExpenseReviewCenter({ expenses, onExportReady }: ExpenseReviewCenterProps) {
  const { language } = useLanguage();
  const { formatCurrency: fmtCurr } = useFormatCurrency();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: documents = [] } = useDocumentsForReview();
  const deleteMutation = useDeleteExpense();
  const updateMutation = useUpdateExpense();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('discrepancies');
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [editIncomeData, setEditIncomeData] = useState<Record<string, string>>({});
  const [approvingIncomeId, setApprovingIncomeId] = useState<string | null>(null);

  // Find discrepancies: expense amount != receipt extracted amount
  const discrepancies = useMemo<DiscrepancyItem[]>(() => {
    return expenses
      .filter(e => e.document_id)
      .map(expense => {
        const doc = documents.find(d => d.id === expense.document_id);
        if (!doc?.extracted_data) return null;
        
        // extracted_data can be an array (from multi-receipt processing) or a plain object
        const extractedData = Array.isArray(doc.extracted_data) ? doc.extracted_data[0] : doc.extracted_data;
        const receiptAmount = Number(extractedData?.amount) || 0;
        const expenseAmount = Number(expense.amount);
        const difference = Math.abs(expenseAmount - receiptAmount);
        const percentDiff = receiptAmount > 0 ? (difference / receiptAmount) * 100 : 0;
        
        // Flag if difference > 5% or > $2
        if (difference < 2 && percentDiff < 5) return null;
        
        return { expense, document: doc, expenseAmount, receiptAmount, difference, percentDiff };
      })
      .filter(Boolean) as DiscrepancyItem[];
  }, [expenses, documents]);

  // Pending review documents (not yet approved) — exclude income documents
  const pendingDocs = useMemo(() => 
    documents.filter(d => 
      (d.review_status === 'pending_review' || d.review_status === 'needs_correction') &&
      (d.extracted_data as any)?.invoice_direction !== 'income'
    ),
    [documents]
  );

  // Pending income documents for review
  const pendingIncome = useMemo(() => 
    documents.filter(d => 
      (d.review_status === 'pending_review' || d.review_status === 'needs_correction') &&
      (d.extracted_data as any)?.invoice_direction === 'income'
    ),
    [documents]
  );

  // Expenses without receipts
  const noReceipt = useMemo(() => expenses.filter(e => !e.document_id), [expenses]);

  // All good - expenses with matched receipts and no discrepancies
  const readyExpenses = useMemo(() => 
    expenses.filter(e => e.document_id && !discrepancies.find(d => d.expense.id === e.id)),
    [expenses, discrepancies]
  );

  const totalIssues = discrepancies.length + pendingDocs.length + noReceipt.length + pendingIncome.length;
  const isAllGood = totalIssues === 0 && expenses.length > 0;

  // Flow steps for visual indicator
  const flowSteps = useMemo(() => [
    {
      key: 'discrepancies',
      label: language === 'es' ? 'Discrepancias' : 'Discrepancies',
      icon: AlertTriangle,
      count: discrepancies.length,
      done: discrepancies.length === 0,
    },
    {
      key: 'income',
      label: language === 'es' ? 'Ingresos' : 'Income',
      icon: DollarSign,
      count: pendingIncome.length,
      done: pendingIncome.length === 0,
    },
    {
      key: 'noreceipt',
      label: language === 'es' ? 'Sin recibo' : 'No receipt',
      icon: CameraOff,
      count: noReceipt.length,
      done: noReceipt.length === 0,
    },
    {
      key: 'pending',
      label: language === 'es' ? 'Pendientes' : 'Pending',
      icon: Clock,
      count: pendingDocs.length,
      done: pendingDocs.length === 0,
    },
    {
      key: 'ready',
      label: language === 'es' ? 'Listos' : 'Ready',
      icon: FileCheck,
      count: readyExpenses.length,
      done: isAllGood,
    },
  ], [language, discrepancies.length, pendingIncome.length, noReceipt.length, pendingDocs.length, readyExpenses.length, isAllGood]);

  const handleUpdateAmount = useCallback(async (expenseId: string, newAmount: number) => {
    // Check for duplicates with same amount
    const hasDuplicate = expenses.some(e => 
      e.id !== expenseId && 
      Math.abs(Number(e.amount) - newAmount) < 0.01
    );
    
    if (hasDuplicate) {
      toast.warning(
        language === 'es' 
          ? '⚠️ Ya existe un gasto con este mismo monto. Verifica que no sea duplicado.'
          : '⚠️ An expense with this amount already exists. Check it\'s not a duplicate.'
      );
    }

    updateMutation.mutate(
      { id: expenseId, updates: { amount: newAmount } },
      {
        onSuccess: () => {
          toast.success(language === 'es' ? '✅ Monto actualizado correctamente' : '✅ Amount updated successfully');
          setEditingId(null);
        },
      }
    );
  }, [expenses, updateMutation, language]);

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success(language === 'es' ? '🗑️ Gasto eliminado' : '🗑️ Expense deleted');
        setDeleteConfirm(null);
      },
    });
  }, [deleteMutation, language]);

  const handleApproveIncome = useCallback(async (docId: string) => {
    if (!user) return;
    setApprovingIncomeId(docId);
    try {
      const doc = documents.find(d => d.id === docId);
      if (!doc) throw new Error('Document not found');
      const ed = doc.extracted_data as any;
      const data = editingIncomeId === docId ? editIncomeData : {};
      
      const amount = data.amount ? parseFloat(data.amount) : (ed.amount || 0);
      const source = data.source || ed.source || ed.vendor || '';
      const description = data.description || ed.description || '';
      const date = data.date || ed.date || new Date().toISOString().split('T')[0];
      const currency = ed.currency || 'CAD';

      const { error: incomeError } = await supabase
        .from('income')
        .insert({
          user_id: user.id,
          amount,
          date,
          income_type: 'freelance' as const,
          source,
          description,
          currency,
          is_taxable: true,
          document_id: docId,
        } as any);

      if (incomeError) throw incomeError;

      await supabase
        .from('documents')
        .update({
          review_status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', docId);

      queryClient.invalidateQueries({ queryKey: ['documents-review'] });
      queryClient.invalidateQueries({ queryKey: ['income'] });
      toast.success(language === 'es' ? `✅ Ingreso de $${amount.toLocaleString()} aprobado y registrado` : `✅ Income of $${amount.toLocaleString()} approved and recorded`);
      setEditingIncomeId(null);
    } catch (error: any) {
      console.error('Error approving income:', error);
      toast.error(language === 'es' ? 'Error al aprobar el ingreso' : 'Error approving income');
    } finally {
      setApprovingIncomeId(null);
    }
  }, [user, documents, editingIncomeId, editIncomeData, queryClient, language]);

  const handleRejectIncome = useCallback(async (docId: string) => {
    await supabase
      .from('documents')
      .update({ review_status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', docId);
    queryClient.invalidateQueries({ queryKey: ['documents-review'] });
    toast.success(language === 'es' ? '🗑️ Ingreso descartado' : '🗑️ Income discarded');
  }, [queryClient, language]);

  // Auto-select tab based on what needs attention — only on initial mount
  const hasAutoSelected = useRef(false);
  useEffect(() => {
    if (hasAutoSelected.current) return;
    hasAutoSelected.current = true;
    if (discrepancies.length > 0) setActiveTab('discrepancies');
    else if (pendingIncome.length > 0) setActiveTab('income');
    else if (noReceipt.length > 0) setActiveTab('noreceipt');
    else if (pendingDocs.length > 0) setActiveTab('pending');
    else setActiveTab('ready');
  }, [discrepancies.length, pendingIncome.length, noReceipt.length, pendingDocs.length]);

  // Show if there are expenses OR pending income docs to review
  if (expenses.length === 0 && pendingIncome.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Summary header with flow indicator */}
      <div className={cn(
        "p-4 rounded-xl border space-y-3",
        isAllGood 
          ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
          : "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800"
      )}>
        <div className="flex items-center gap-3">
          {isAllGood ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
            </motion.div>
          ) : (
            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 animate-pulse" />
          )}
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-semibold", isAllGood ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300")}>
              {isAllGood
                ? (language === 'es' ? '🎉 ¡Todo revisado y listo para reportes!' : '🎉 All reviewed and ready for reports!')
                : (language === 'es' 
                  ? `📋 ${totalIssues} ${totalIssues === 1 ? 'punto requiere' : 'puntos requieren'} tu atención`
                  : `📋 ${totalIssues} ${totalIssues === 1 ? 'item needs' : 'items need'} your attention`)
              }
            </p>
            <p className={cn("text-xs mt-0.5", isAllGood ? "text-emerald-600/80" : "text-amber-600/80")}>
              {isAllGood
                ? (language === 'es' 
                  ? '✨ Tus gastos están conciliados con sus recibos. Genera tu reporte fiscal o de reembolsos ahora.' 
                  : '✨ Your expenses are reconciled with their receipts. Generate your tax or reimbursement report now.')
                : (language === 'es' 
                  ? '👇 Sigue los pasos del flujo para resolver cada punto antes de generar reportes' 
                  : '👇 Follow the flow steps to resolve each item before generating reports')
              }
            </p>
          </div>
          {isAllGood && onExportReady && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button size="sm" onClick={onExportReady} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">
                <Sparkles className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Generar Reporte' : 'Generate Report'}
              </Button>
            </motion.div>
          )}
        </div>

        {/* Flow step indicator */}
        <FlowStepIndicator steps={flowSteps} currentStep={activeTab} language={language} />
      </div>

      {/* Tabs for different review categories */}
      {!isAllGood && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="discrepancies" className="relative text-xs sm:text-sm">
              <AlertTriangle className="h-3.5 w-3.5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{language === 'es' ? 'Discrepancias' : 'Discrepancies'}</span>
              <span className="sm:hidden">{language === 'es' ? 'Dif.' : 'Diff.'}</span>
              {discrepancies.length > 0 && (
                <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px]">{discrepancies.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="income" className="text-xs sm:text-sm">
              <DollarSign className="h-3.5 w-3.5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{language === 'es' ? 'Ingresos' : 'Income'}</span>
              <span className="sm:hidden">💰</span>
              {pendingIncome.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">{pendingIncome.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="noreceipt" className="text-xs sm:text-sm">
              <CameraOff className="h-3.5 w-3.5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{language === 'es' ? 'Sin recibo' : 'No receipt'}</span>
              <span className="sm:hidden">📷</span>
              {noReceipt.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">{noReceipt.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm">
              <Clock className="h-3.5 w-3.5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{language === 'es' ? 'Pendientes' : 'Pending'}</span>
              <span className="sm:hidden">{language === 'es' ? 'Pend.' : 'Pend.'}</span>
              {pendingDocs.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{pendingDocs.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready" className="text-xs sm:text-sm">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{language === 'es' ? 'Listos' : 'Ready'}</span>
              <span className="sm:hidden">✅</span>
              <Badge variant="outline" className="ml-1 px-1.5 py-0 text-[10px]">{readyExpenses.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Discrepancies Tab */}
          <TabsContent value="discrepancies" className="space-y-3 mt-3">
            <AnimatePresence mode="wait">
              {discrepancies.length === 0 ? (
                <motion.div key="no-disc" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="border-dashed border-emerald-200 dark:border-emerald-800">
                    <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        {language === 'es' ? '✅ Sin discrepancias de montos' : '✅ No amount discrepancies'}
                      </p>
                      <p className="text-xs text-muted-foreground text-center max-w-md">
                        {language === 'es' 
                          ? 'Todos los montos en sistema coinciden con los recibos vinculados. ¡Excelente!' 
                          : 'All system amounts match their linked receipts. Excellent!'}
                      </p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground mt-2" />
                      <p className="text-xs text-muted-foreground">
                        {language === 'es' ? 'Continúa con el siguiente paso →' : 'Continue to the next step →'}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div key="disc-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  {/* Explanation banner */}
                  <div className="flex gap-2 p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      <p className="font-medium mb-0.5">
                        {language === 'es' ? '¿Por qué hay diferencias?' : 'Why are there differences?'}
                      </p>
                      <p className="text-amber-600 dark:text-amber-500">
                        {language === 'es' 
                          ? 'Cuando el sistema detecta un recibo, a veces identifica solo un ítem de una compra con múltiples productos. Puedes corregir el monto al total real o eliminar el gasto parcial si ya existe el correcto.'
                          : 'When the system detects a receipt, sometimes it identifies only one item from a multi-item purchase. You can fix the amount to the real total or delete the partial expense if the correct one already exists.'}
                      </p>
                    </div>
                  </div>

                  {discrepancies.map((item, idx) => (
                    <motion.div
                      key={item.expense.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="border-amber-200 dark:border-amber-800 overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                            {/* Left: Receipt image */}
                            <MiniImageViewer 
                              filePath={item.document?.file_path || null} 
                              className="h-64 lg:h-72"
                            />

                            {/* Right: Comparison */}
                            <div className="p-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                                  {language === 'es' ? '⚠️ Discrepancia de monto' : '⚠️ Amount discrepancy'}
                                </span>
                                <Badge variant="outline" className="text-[10px] ml-auto">
                                  #{idx + 1}/{discrepancies.length}
                                </Badge>
                              </div>

                              <div className="text-xs text-muted-foreground">
                                🏪 {item.expense.vendor || '—'} · 📅 {item.expense.date}
                                {item.expense.category && (
                                  <> · 🏷️ {item.expense.category}</>
                                )}
                              </div>

                              {/* Amount comparison */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-muted/50 border">
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                                    💻 {language === 'es' ? 'En sistema' : 'In system'}
                                  </p>
                                  <p className="text-lg font-bold">${item.expenseAmount.toFixed(2)}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                                  <p className="text-[10px] uppercase tracking-wider text-amber-600 mb-1">
                                    🧾 {language === 'es' ? 'En recibo' : 'On receipt'}
                                  </p>
                                  <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                                    ${item.receiptAmount.toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {language === 'es' 
                                  ? `📊 Diferencia: $${item.difference.toFixed(2)} (${item.percentDiff.toFixed(0)}%) — ${item.expenseAmount < item.receiptAmount ? 'Puede ser un ítem parcial de una compra mayor.' : 'El monto del sistema es mayor al del recibo.'}`
                                  : `📊 Difference: $${item.difference.toFixed(2)} (${item.percentDiff.toFixed(0)}%) — ${item.expenseAmount < item.receiptAmount ? 'May be a partial item from a larger purchase.' : 'System amount is higher than receipt.'}`}
                              </p>

                              {/* Actions */}
                              <div className="flex flex-col gap-2 pt-1">
                                {editingId === item.expense.id ? (
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={editAmount}
                                      onChange={(e) => setEditAmount(e.target.value)}
                                      className="h-9"
                                      placeholder={item.receiptAmount.toFixed(2)}
                                      autoFocus
                                    />
                                    <Button size="sm" onClick={() => handleUpdateAmount(item.expense.id, Number(editAmount))} className="shadow-sm">
                                      {language === 'es' ? '💾 Guardar' : '💾 Save'}
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 border-primary/30 hover:bg-primary/5"
                                      onClick={() => {
                                        setEditingId(item.expense.id);
                                        setEditAmount(item.receiptAmount.toFixed(2));
                                      }}
                                    >
                                      <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                                      {language === 'es' ? `Corregir a $${item.receiptAmount.toFixed(2)}` : `Fix to $${item.receiptAmount.toFixed(2)}`}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="shadow-sm"
                                      onClick={() => setDeleteConfirm(item.expense.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                      {language === 'es' ? 'Eliminar' : 'Delete'}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Income Review Tab */}
          <TabsContent value="income" className="space-y-3 mt-3">
            {pendingIncome.length === 0 ? (
              <Card className="border-dashed border-emerald-200 dark:border-emerald-800">
                <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    {language === 'es' ? '✅ No hay ingresos pendientes de revisión' : '✅ No pending income to review'}
                  </p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-2" />
                  <p className="text-xs text-muted-foreground">
                    {language === 'es' ? 'Continúa con el siguiente paso →' : 'Continue to the next step →'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {/* Explanation banner */}
                <div className="flex gap-2 p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
                  <DollarSign className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    <p className="font-medium mb-0.5">
                      {language === 'es' 
                        ? `💰 ${pendingIncome.length} factura(s) de ingreso pendientes de aprobación`
                        : `💰 ${pendingIncome.length} income invoice(s) pending approval`}
                    </p>
                    <p className="text-emerald-600 dark:text-emerald-500">
                      {language === 'es'
                        ? 'Revisa los datos extraídos por la IA antes de registrarlos como ingresos. Puedes editar monto, fuente y descripción.'
                        : 'Review the AI-extracted data before recording them as income. You can edit amount, source and description.'}
                    </p>
                  </div>
                </div>

                {pendingIncome.map((doc, idx) => {
                  const ed = doc.extracted_data as any;
                  const isEditing = editingIncomeId === doc.id;
                  const isApproving = approvingIncomeId === doc.id;

                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="border-emerald-200 dark:border-emerald-800 overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                            {/* Left: Document preview */}
                            <MiniImageViewer 
                              filePath={doc.file_path || null} 
                              className="h-64 lg:h-72"
                            />

                            {/* Right: Income details */}
                            <div className="p-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-emerald-500" />
                                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                  {language === 'es' ? '💰 Factura de Ingreso' : '💰 Income Invoice'}
                                </span>
                                <Badge variant="outline" className="text-[10px] ml-auto">
                                  #{idx + 1}/{pendingIncome.length}
                                </Badge>
                              </div>

                              <div className="text-xs text-muted-foreground">
                                📄 {doc.file_name}
                              </div>

                              {/* Extracted data */}
                              {isEditing ? (
                                <div className="space-y-2">
                                  <div>
                                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                      {language === 'es' ? 'Monto' : 'Amount'}
                                    </label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={editIncomeData.amount || String(ed.amount || 0)}
                                      onChange={(e) => setEditIncomeData(prev => ({ ...prev, amount: e.target.value }))}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                      {language === 'es' ? 'Fuente / Cliente' : 'Source / Client'}
                                    </label>
                                    <Input
                                      value={editIncomeData.source || ed.source || ''}
                                      onChange={(e) => setEditIncomeData(prev => ({ ...prev, source: e.target.value }))}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                      {language === 'es' ? 'Descripción' : 'Description'}
                                    </label>
                                    <Input
                                      value={editIncomeData.description || ed.description || ''}
                                      onChange={(e) => setEditIncomeData(prev => ({ ...prev, description: e.target.value }))}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                      {language === 'es' ? 'Fecha' : 'Date'}
                                    </label>
                                    <Input
                                      type="date"
                                      value={editIncomeData.date || ed.date || ''}
                                      onChange={(e) => setEditIncomeData(prev => ({ ...prev, date: e.target.value }))}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                                      <p className="text-[10px] uppercase tracking-wider text-emerald-600 mb-1">
                                        💵 {language === 'es' ? 'Monto' : 'Amount'}
                                      </p>
                                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                                        {fmtCurr(ed.amount || 0, { currency: ed.currency || undefined })}
                                      </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/50 border">
                                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                                        📅 {language === 'es' ? 'Fecha' : 'Date'}
                                      </p>
                                      <p className="text-sm font-medium">{ed.date || '—'}</p>
                                    </div>
                                  </div>
                                  <div className="p-2 rounded-lg bg-muted/30 border">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                                      🏢 {language === 'es' ? 'Fuente' : 'Source'}
                                    </p>
                                    <p className="text-xs font-medium">{ed.source || ed.vendor || '—'}</p>
                                  </div>
                                  {ed.description && (
                                    <div className="p-2 rounded-lg bg-muted/30 border">
                                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                                        📝 {language === 'es' ? 'Descripción' : 'Description'}
                                      </p>
                                      <p className="text-xs">{ed.description}</p>
                                    </div>
                                  )}
                                  {ed.line_items && ed.line_items.length > 0 && (
                                    <div className="p-2 rounded-lg bg-muted/30 border">
                                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                                        📋 {language === 'es' ? 'Ítems' : 'Items'}
                                      </p>
                                      {ed.line_items.slice(0, 5).map((item: any, i: number) => (
                                        <p key={i} className="text-[11px] text-muted-foreground">
                                          • {item.name} — ${(item.total || 0).toLocaleString()}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex gap-2 pt-1">
                                {!isEditing && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingIncomeId(doc.id);
                                      setEditIncomeData({
                                        amount: String(ed.amount || 0),
                                        source: ed.source || ed.vendor || '',
                                        description: ed.description || '',
                                        date: ed.date || '',
                                      });
                                    }}
                                  >
                                    <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                                    {language === 'es' ? 'Editar' : 'Edit'}
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveIncome(doc.id)}
                                  disabled={isApproving}
                                  className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                                >
                                  {isApproving ? (
                                    <Clock className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                  )}
                                  {language === 'es' ? '✅ Aprobar Ingreso' : '✅ Approve Income'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectIncome(doc.id)}
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                  {language === 'es' ? 'Descartar' : 'Discard'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="noreceipt" className="space-y-3 mt-3">
            {noReceipt.length === 0 ? (
              <Card className="border-dashed border-emerald-200 dark:border-emerald-800">
                <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    {language === 'es' ? '✅ Todos los gastos tienen recibo vinculado' : '✅ All expenses have a linked receipt'}
                  </p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-2" />
                  <p className="text-xs text-muted-foreground">
                    {language === 'es' ? 'Continúa con el siguiente paso →' : 'Continue to the next step →'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {/* Explanation banner */}
                <div className="flex gap-2 p-3 rounded-lg bg-orange-50/80 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-800/40">
                  <CameraOff className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-orange-700 dark:text-orange-400 leading-relaxed">
                    <p className="font-medium mb-0.5">
                      {language === 'es' ? `📷 ${noReceipt.length} gastos sin comprobante` : `📷 ${noReceipt.length} expenses without receipt`}
                    </p>
                    <p className="text-orange-600 dark:text-orange-500">
                      {language === 'es'
                        ? 'Los gastos sin recibo no son válidos para declaración fiscal (CRA/T2125). Vincula un recibo existente o sube una foto del comprobante.'
                        : 'Expenses without receipts are not valid for tax filing (CRA/T2125). Link an existing receipt or upload a photo of the receipt.'}
                    </p>
                  </div>
                </div>

                {/* List of expenses without receipts */}
                <div className="grid gap-2 sm:grid-cols-2">
                  {noReceipt.slice(0, 8).map(expense => (
                    <div key={expense.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <CameraOff className="h-4 w-4 text-orange-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{expense.vendor || '—'}</p>
                        <p className="text-[10px] text-muted-foreground">
                          📅 {expense.date} · 💰 ${Number(expense.amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {noReceipt.length > 8 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{noReceipt.length - 8} {language === 'es' ? 'más sin recibo' : 'more without receipt'}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  {language === 'es' 
                    ? '💡 Usa el panel de "Salud de Gastos" arriba para vincular recibos existentes o seleccionar gastos para eliminación.'
                    : '💡 Use the "Expense Health" panel above to link existing receipts or select expenses for deletion.'}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-3 mt-3">
            {pendingDocs.length === 0 ? (
              <Card className="border-dashed border-emerald-200 dark:border-emerald-800">
                <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    {language === 'es' ? '✅ Todos los recibos están revisados' : '✅ All receipts are reviewed'}
                  </p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-2" />
                  <p className="text-xs text-muted-foreground">
                    {language === 'es' ? 'Continúa con el siguiente paso →' : 'Continue to the next step →'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {/* Explanation banner */}
                <div className="flex gap-2 p-3 rounded-lg bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40">
                  <Clock className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                    <p className="font-medium mb-0.5">
                      {language === 'es' ? `⏳ ${pendingDocs.length} recibo(s) pendientes de aprobación` : `⏳ ${pendingDocs.length} receipt(s) pending approval`}
                    </p>
                    <p className="text-blue-600 dark:text-blue-500">
                      {language === 'es'
                        ? 'Estos recibos fueron capturados pero no han sido aprobados. Revísalos en la Bandeja de Recibos para validar los datos extraídos.'
                        : 'These receipts were captured but haven\'t been approved. Review them in the Receipt Inbox to validate the extracted data.'}
                    </p>
                  </div>
                </div>

                <Button variant="outline" size="sm" asChild className="shadow-sm">
                  <a href="/chaos">
                    <Eye className="h-4 w-4 mr-2" />
                    {language === 'es' ? '📥 Ir a Bandeja de Recibos' : '📥 Go to Receipt Inbox'}
                  </a>
                </Button>
                <div className="grid gap-2 sm:grid-cols-2">
                  {pendingDocs.slice(0, 4).map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">📄 {doc.file_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          🏪 {doc.extracted_data?.vendor || '—'} · 💰 ${doc.extracted_data?.amount?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {pendingDocs.length > 4 && (
                    <p className="text-xs text-muted-foreground text-center col-span-full">
                      +{pendingDocs.length - 4} {language === 'es' ? 'más' : 'more'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Ready Tab */}
          <TabsContent value="ready" className="mt-3">
            <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/80 to-emerald-50/30 dark:from-emerald-950/20 dark:to-emerald-950/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <FileCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      🎉 {readyExpenses.length} {language === 'es' ? 'gastos conciliados y listos' : 'reconciled expenses ready'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {language === 'es' 
                        ? 'Estos gastos tienen recibo vinculado y montos consistentes. Están listos para incluir en tu reporte fiscal o de reembolsos.'
                        : 'These expenses have linked receipts with consistent amounts. They are ready to include in your tax or reimbursement report.'}
                    </p>
                  </div>
                </div>
                
                {totalIssues > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/40 mb-3">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {language === 'es'
                        ? `⚠️ Aún tienes ${totalIssues} punto(s) por resolver. Puedes generar un reporte parcial con los ${readyExpenses.length} gastos listos, o resolver todo primero para un reporte completo.`
                        : `⚠️ You still have ${totalIssues} item(s) to resolve. You can generate a partial report with the ${readyExpenses.length} ready expenses, or resolve everything first for a complete report.`}
                    </p>
                  </div>
                )}

                {readyExpenses.length > 0 && onExportReady && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={onExportReady} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">
                      <Sparkles className="h-4 w-4 mr-2" />
                      {language === 'es' ? 'Generar Reporte' : 'Generate Report'}
                    </Button>
                    {totalIssues > 0 && (
                      <Button size="sm" variant="outline" onClick={() => setActiveTab('discrepancies')} className="border-amber-300 text-amber-700 hover:bg-amber-50">
                        {language === 'es' ? 'Resolver pendientes primero' : 'Resolve pending first'}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'es' ? '🗑️ ¿Eliminar este gasto?' : '🗑️ Delete this expense?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'es' 
                ? 'Este gasto parece ser un ítem parcial detectado de una compra mayor. Al eliminarlo, solo quedará el gasto principal con el monto correcto del recibo. Esta acción no se puede deshacer.'
                : 'This expense appears to be a partially detected item from a larger purchase. Deleting it will keep only the main expense with the correct receipt amount. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'es' ? 'Cancelar' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-destructive text-destructive-foreground">
              {language === 'es' ? 'Sí, eliminar gasto parcial' : 'Yes, delete partial expense'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
