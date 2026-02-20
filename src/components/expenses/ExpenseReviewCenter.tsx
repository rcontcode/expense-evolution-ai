import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle, CheckCircle2, Clock, FileText, Eye, 
  Edit3, Trash2, RotateCw, ZoomIn, ZoomOut, Maximize2,
  ArrowRight, Camera, Download, ShieldCheck, XCircle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ExpenseWithRelations } from '@/types/expense.types';
import { useDocumentsForReview, useDocumentImageUrl } from '@/hooks/data/useDocumentReview';
import { useDeleteExpense, useUpdateExpense } from '@/hooks/data/useExpenses';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
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

export function ExpenseReviewCenter({ expenses, onExportReady }: ExpenseReviewCenterProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: documents = [] } = useDocumentsForReview();
  const deleteMutation = useDeleteExpense();
  const updateMutation = useUpdateExpense();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('discrepancies');

  // Find discrepancies: expense amount != receipt extracted amount
  const discrepancies = useMemo<DiscrepancyItem[]>(() => {
    return expenses
      .filter(e => e.document_id)
      .map(expense => {
        const doc = documents.find(d => d.id === expense.document_id);
        if (!doc?.extracted_data) return null;
        
        const receiptAmount = Number(doc.extracted_data.amount) || 0;
        const expenseAmount = Number(expense.amount);
        const difference = Math.abs(expenseAmount - receiptAmount);
        const percentDiff = receiptAmount > 0 ? (difference / receiptAmount) * 100 : 0;
        
        // Flag if difference > 5% or > $2
        if (difference < 2 && percentDiff < 5) return null;
        
        return { expense, document: doc, expenseAmount, receiptAmount, difference, percentDiff };
      })
      .filter(Boolean) as DiscrepancyItem[];
  }, [expenses, documents]);

  // Pending review documents (not yet approved)
  const pendingDocs = useMemo(() => 
    documents.filter(d => d.review_status === 'pending_review' || d.review_status === 'needs_correction'),
    [documents]
  );

  // Expenses without receipts
  const noReceipt = useMemo(() => expenses.filter(e => !e.document_id), [expenses]);

  // All good - expenses with matched receipts and no discrepancies
  const readyExpenses = useMemo(() => 
    expenses.filter(e => e.document_id && !discrepancies.find(d => d.expense.id === e.id)),
    [expenses, discrepancies]
  );

  const totalIssues = discrepancies.length + pendingDocs.length + noReceipt.length;
  const isAllGood = totalIssues === 0 && expenses.length > 0;

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
          toast.success(language === 'es' ? 'Monto actualizado' : 'Amount updated');
          setEditingId(null);
        },
      }
    );
  }, [expenses, updateMutation, language]);

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success(language === 'es' ? 'Gasto eliminado' : 'Expense deleted');
        setDeleteConfirm(null);
      },
    });
  }, [deleteMutation, language]);

  // Auto-select tab based on what needs attention
  useEffect(() => {
    if (discrepancies.length > 0) setActiveTab('discrepancies');
    else if (pendingDocs.length > 0) setActiveTab('pending');
    else if (noReceipt.length > 0) setActiveTab('noreceipt');
    else setActiveTab('ready');
  }, [discrepancies.length, pendingDocs.length, noReceipt.length]);

  if (expenses.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Summary header */}
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-xl border",
        isAllGood 
          ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
          : "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800"
      )}>
        {isAllGood ? (
          <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
        ) : (
          <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-semibold", isAllGood ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300")}>
            {isAllGood
              ? (language === 'es' ? '✅ Todo revisado y listo para reportes' : '✅ All reviewed and ready for reports')
              : (language === 'es' 
                ? `${totalIssues} ${totalIssues === 1 ? 'punto requiere' : 'puntos requieren'} tu atención`
                : `${totalIssues} ${totalIssues === 1 ? 'item needs' : 'items need'} your attention`)
            }
          </p>
          <p className={cn("text-xs", isAllGood ? "text-emerald-600/80" : "text-amber-600/80")}>
            {isAllGood
              ? (language === 'es' ? 'Puedes generar tu reporte fiscal ahora' : 'You can generate your tax report now')
              : (language === 'es' ? 'Revisa discrepancias de montos y recibos pendientes' : 'Review amount discrepancies and pending receipts')
            }
          </p>
        </div>
        {isAllGood && onExportReady && (
          <Button size="sm" onClick={onExportReady} className="bg-emerald-600 hover:bg-emerald-700">
            <Download className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Generar Reporte' : 'Generate Report'}
          </Button>
        )}
      </div>

      {/* Tabs for different review categories */}
      {!isAllGood && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="discrepancies" className="relative text-xs sm:text-sm">
              <AlertTriangle className="h-3.5 w-3.5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{language === 'es' ? 'Discrepancias' : 'Discrepancies'}</span>
              <span className="sm:hidden">{language === 'es' ? 'Dif.' : 'Diff.'}</span>
              {discrepancies.length > 0 && (
                <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px]">{discrepancies.length}</Badge>
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
              <span className="sm:hidden">OK</span>
              <Badge variant="outline" className="ml-1 px-1.5 py-0 text-[10px]">{readyExpenses.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Discrepancies Tab */}
          <TabsContent value="discrepancies" className="space-y-3 mt-3">
            {discrepancies.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center py-8">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2" />
                  <p className="text-sm text-muted-foreground">
                    {language === 'es' ? 'No hay discrepancias de montos' : 'No amount discrepancies found'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              discrepancies.map((item) => (
                <Card key={item.expense.id} className="border-amber-200 dark:border-amber-800 overflow-hidden">
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
                            {language === 'es' ? 'Discrepancia de monto' : 'Amount discrepancy'}
                          </span>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {item.expense.vendor || '—'} · {item.expense.date}
                        </div>

                        {/* Amount comparison */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-muted/50 border">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                              {language === 'es' ? 'En sistema' : 'In system'}
                            </p>
                            <p className="text-lg font-bold">${item.expenseAmount.toFixed(2)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                            <p className="text-[10px] uppercase tracking-wider text-amber-600 mb-1">
                              {language === 'es' ? 'En recibo' : 'On receipt'}
                            </p>
                            <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                              ${item.receiptAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {language === 'es' 
                            ? `Diferencia: $${item.difference.toFixed(2)} (${item.percentDiff.toFixed(0)}%) — Puede ser un ítem parcial de una compra mayor.`
                            : `Difference: $${item.difference.toFixed(2)} (${item.percentDiff.toFixed(0)}%) — May be a partial item from a larger purchase.`}
                        </p>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          {editingId === item.expense.id ? (
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="h-9"
                                placeholder={item.receiptAmount.toFixed(2)}
                              />
                              <Button size="sm" onClick={() => handleUpdateAmount(item.expense.id, Number(editAmount))}>
                                {language === 'es' ? 'Guardar' : 'Save'}
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
                                className="flex-1"
                                onClick={() => {
                                  setEditingId(item.expense.id);
                                  setEditAmount(item.receiptAmount.toFixed(2));
                                }}
                              >
                                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                                {language === 'es' ? 'Corregir a $' + item.receiptAmount.toFixed(2) : 'Fix to $' + item.receiptAmount.toFixed(2)}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
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
              ))
            )}
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-3 mt-3">
            {pendingDocs.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center py-8">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2" />
                  <p className="text-sm text-muted-foreground">
                    {language === 'es' ? 'No hay recibos pendientes de revisión' : 'No receipts pending review'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {language === 'es' 
                    ? `Tienes ${pendingDocs.length} recibo(s) sin aprobar. Ve a la Bandeja de Recibos para revisarlos.`
                    : `You have ${pendingDocs.length} unapproved receipt(s). Go to the Receipt Inbox to review them.`}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="/chaos">
                    <Eye className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Ir a Bandeja de Recibos' : 'Go to Receipt Inbox'}
                  </a>
                </Button>
                <div className="grid gap-2 sm:grid-cols-2">
                  {pendingDocs.slice(0, 4).map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                      <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{doc.file_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {doc.extracted_data?.vendor || '—'} · ${doc.extracted_data?.amount?.toFixed(2) || '0.00'}
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
            <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {readyExpenses.length} {language === 'es' ? 'gastos listos' : 'expenses ready'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'es' 
                        ? 'Estos gastos tienen recibo vinculado y montos consistentes'
                        : 'These expenses have linked receipts with consistent amounts'}
                    </p>
                  </div>
                </div>
                {readyExpenses.length > 0 && onExportReady && (
                  <Button size="sm" onClick={onExportReady} variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100">
                    <Download className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Generar reporte con estos gastos' : 'Generate report with these expenses'}
                  </Button>
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
              {language === 'es' ? '¿Eliminar este gasto?' : 'Delete this expense?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'es' 
                ? 'Este gasto parece ser un ítem parcial detectado. Al eliminarlo, solo quedará el gasto principal con el monto correcto del recibo.'
                : 'This expense appears to be a partially detected item. Deleting it will keep only the main expense with the correct receipt amount.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'es' ? 'Cancelar' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-destructive text-destructive-foreground">
              {language === 'es' ? 'Sí, eliminar' : 'Yes, delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
