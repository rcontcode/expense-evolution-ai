import { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, Camera, Loader2, RefreshCw, 
  CheckCircle2, Clock, AlertTriangle, X,
  Smartphone, Monitor, Layers, ArrowRight, Video,
  Edit3, ChevronDown, ChevronUp, Eye, MessageSquare, MoreHorizontal,
  Sparkles, Receipt
} from 'lucide-react';
import { useContentDuplicateDetector } from '@/hooks/data/useContentDuplicateDetector';
import { DuplicateWarningDialog } from '@/components/chaos/DuplicateWarningDialog';
import { DuplicateMatch } from '@/hooks/data/useContentDuplicateDetector';
import { RecurringBillConfirmDialog, type RecurringBillCandidate } from '@/components/bills/RecurringBillConfirmDialog';
import { toast } from 'sonner';
import { useAIErrorHandler } from '@/hooks/utils/useAIErrorHandler';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UnifiedChaosInboxPanel } from '@/components/chaos/UnifiedChaosInboxPanel';
import { DocumentOnboardingChecklist, resetDocChecklist } from '@/components/chaos/DocumentOnboardingChecklist';
import { DocumentStatsBar } from '@/components/chaos/DocumentStatsBar';
import { InfoTooltip, TOOLTIP_CONTENT } from '@/components/ui/info-tooltip';
import { ReceiptReviewCard, ReceiptDocument, ExtractedData } from '@/components/capture/ReceiptReviewCard';
import { 
  useDocumentsForReview, 
  useDocumentReviewActions, 
  useRealtimeDocuments,
  useDocumentImageUrl 
} from '@/hooks/data/useDocumentReview';
import { ContinuousCameraDialog, CapturedPhoto } from '@/components/capture/ContinuousCameraDialog';
import { ScanSessionHistory } from '@/components/capture/ScanSessionHistory';
import { useScanSessions } from '@/hooks/data/useScanSessions';
import { cn } from '@/lib/utils';
import { PageContextGuide, PAGE_GUIDES } from '@/components/guidance/PageContextGuide';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIsMobile } from '@/hooks/use-mobile';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

function DocumentImageWrapper({ document, onApprove, onReject, onAddComment, onDelete, onCheckDuplicates, isLoading, onDataExtracted }: {
  document: ReceiptDocument;
  onApprove: (id: string, data: ExtractedData) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onAddComment: (id: string, comment: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onCheckDuplicates?: (id: string, data: ExtractedData) => Promise<void>;
  isLoading?: boolean;
  onDataExtracted?: () => void;
}) {
  const imageUrl = useDocumentImageUrl(document.file_path);
  
  return (
    <ReceiptReviewCard
      document={document}
      imageUrl={imageUrl}
      onApprove={onApprove}
      onReject={onReject}
      onAddComment={onAddComment}
      onDelete={onDelete}
      onCheckDuplicates={onCheckDuplicates}
      isLoading={isLoading}
      onDataExtracted={onDataExtracted}
    />
  );
}

// Workflow step component - Mobile optimized horizontal scroll
function WorkflowStep({ 
  step, 
  title, 
  icon: Icon, 
  isActive,
  count,
  compact = false
}: { 
  step: number;
  title: string;
  description?: string;
  icon: React.ElementType;
  isActive: boolean;
  count?: number;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-lg border min-w-[80px] transition-all",
        isActive 
          ? "border-primary bg-primary/10" 
          : "border-muted bg-muted/30 opacity-60"
      )}>
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full",
          isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[10px] font-medium text-center">{title}</span>
        {count !== undefined && count > 0 && (
          <Badge variant={isActive ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
            {count}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-lg border transition-all",
      isActive 
        ? "border-primary bg-primary/5 shadow-sm" 
        : "border-muted bg-muted/30 opacity-60"
    )}>
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {step}
          </span>
          <h4 className="font-semibold">{title}</h4>
          {count !== undefined && count > 0 && (
            <Badge variant={isActive ? "default" : "secondary"} className="ml-auto">
              {count}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// Section header component
function SectionHeader({ 
  icon: Icon, 
  title, 
  count, 
  color,
  description
}: { 
  icon: React.ElementType;
  title: string;
  count: number;
  color: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Badge variant="outline">{count}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function ChaosInbox() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleAIError } = useAIErrorHandler();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [detectMultipleReceipts, setDetectMultipleReceipts] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showApproved, setShowApproved] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  const [activeTab, setActiveTab] = useState('unified');
  const [reviewFilter, setReviewFilter] = useState<'pending' | 'processed' | 'all'>('pending');
  const [recurringCandidate, setRecurringCandidate] = useState<RecurringBillCandidate | null>(null);
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [duplicateQueue, setDuplicateQueue] = useState<Array<{
    matches: DuplicateMatch[];
    newDoc: { vendor?: string; amount?: number; date?: string; description?: string };
    docId: string;
  }>>([]);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateQueueTotal, setDuplicateQueueTotal] = useState(0);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [checklistKey, setChecklistKey] = useState(0);
  const [checklistVisible, setChecklistVisible] = useState(() => {
    const stored = localStorage.getItem('doc-onboarding-checklist');
    if (!stored) return true;
    try {
      const parsed = JSON.parse(stored);
      return !parsed.dismissed;
    } catch { return true; }
  });
  
  const { checkPreUpload, checkContent } = useContentDuplicateDetector();
  
  const { data: documents = [], isLoading, refetch } = useDocumentsForReview();
  const { approveDocument, rejectDocument, addComment, deleteDocument } = useDocumentReviewActions();
  const { startSession, updateSession, endSession } = useScanSessions();
  
  // Enable realtime sync
  useRealtimeDocuments();

  const pendingDocs = documents.filter(d => d.review_status === 'pending_review');
  const approvedDocs = documents.filter(d => d.review_status === 'approved');
  const needsCorrectionDocs = documents.filter(d => d.review_status === 'needs_correction');
  const rejectedDocs = documents.filter(d => d.review_status === 'rejected');

  // Extract uploaded document types for checklist auto-completion
  const uploadedTypes = documents.map(d => {
    const ed = d.extracted_data as any;
    return String(ed?.document_type || ed?.category || '').toLowerCase();
  }).filter(Boolean);
  
  // Determine current workflow step
  const currentStep = pendingDocs.length > 0 ? 2 : 
                      needsCorrectionDocs.length > 0 ? 3 : 1;

  // End session when leaving page
  useEffect(() => {
    return () => {
      if (currentSessionId) {
        endSession.mutate(currentSessionId);
      }
    };
  }, [currentSessionId]);

  // Upload progress state for inline feedback
  const [uploadProgress, setUploadProgress] = useState<{
    fileName: string;
    phase: 'received' | 'uploading' | 'analyzing' | 'classified' | 'unknown' | 'error';
  } | null>(null);

  // Auto-hide upload progress after 5 seconds
  useEffect(() => {
    if (uploadProgress && (uploadProgress.phase === 'classified' || uploadProgress.phase === 'unknown' || uploadProgress.phase === 'error')) {
      const timer = setTimeout(() => setUploadProgress(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadProgress]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    // Detect CSV/XLS bank files and redirect to banking
    const bankFiles = Array.from(files).filter(f => /\.(csv|xlsx?|xls)$/i.test(f.name));
    if (bankFiles.length > 0) {
      const l = language === 'es';
      toast.info(
        l ? 'Los extractos bancarios en formato CSV/Excel se importan desde Análisis Bancario → Importar Estado' 
          : 'Bank statements in CSV/Excel format are imported from Bank Analysis → Import Statement',
        {
          action: { label: l ? 'Ir a Banking' : 'Go to Banking', onClick: () => window.location.href = '/banking' },
          duration: 8000,
        }
      );
      // Remove bank files, keep others
      const otherFiles = Array.from(files).filter(f => !/\.(csv|xlsx?|xls)$/i.test(f.name));
      if (otherFiles.length === 0) return;
      // Continue with non-bank files only
    }

    setUploading(true);

    try {
      for (const file of Array.from(files).filter(f => !/\.(csv|xlsx?|xls)$/i.test(f.name))) {
        // Phase: Received
        setUploadProgress({ fileName: file.name, phase: 'received' });

        // Layer 1: Pre-upload duplicate check
        const preCheck = await checkPreUpload(file.name, file.size);
        if (preCheck.isDuplicate) {
          const msg = language === 'es'
            ? `"${file.name}" ya fue subido el ${preCheck.existingDate}. ¿Subir de todos modos?`
            : `"${file.name}" was already uploaded on ${preCheck.existingDate}. Upload anyway?`;
          if (!window.confirm(msg)) continue;
        }

        // Phase: Uploading
        setUploadProgress({ fileName: file.name, phase: 'uploading' });

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('expense-documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const { data: doc, error: dbError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            file_path: fileName,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            status: 'pending',
            review_status: 'pending_review',
          })
          .select()
          .single();

        if (dbError) throw dbError;

        if (doc) {
          setProcessing(doc.id);
          // Phase: Analyzing
          setUploadProgress({ fileName: file.name, phase: 'analyzing' });
          try {
            const { data: result, error: aiError } = await supabase.functions.invoke('process-receipt', {
              body: { 
                imageBase64: base64,
                detectMultipleReceipts: detectMultipleReceipts,
              },
            });

            if (aiError && handleAIError(aiError, { feature: 'ocr', requiredPlan: 'premium' })) {
              return;
            }
            if (result?.error && handleAIError(result, { feature: 'ocr', requiredPlan: 'premium' })) {
              return;
            }

            if (!aiError && result?.expenses?.length > 0) {
              const extractedData = {
                ...result.expenses[0],
                all_expenses: result.expenses,
                receipts_detected: result.receipts_detected || 1,
              };
              
              await supabase
                .from('documents')
                .update({ 
                  extracted_data: JSON.parse(JSON.stringify(extractedData)),
                  status: 'classified' 
                } as any)
                .eq('id', doc.id);

              // Phase: Classified
              const category = result.expenses[0]?.category || '';
              setUploadProgress({ fileName: file.name, phase: 'classified' });

              // Layer 2: Post-OCR duplicate detection (queued)
              const firstExpense = result.expenses[0];
              setCheckingDuplicates(true);
              try {
                const dupResult = await checkContent({
                  vendor: firstExpense.vendor,
                  amount: firstExpense.amount,
                  date: firstExpense.date,
                  description: firstExpense.description,
                  line_items: firstExpense.line_items,
                }, doc.id);

                if (dupResult.hasDuplicates) {
                  setDuplicateQueue(prev => [...prev, {
                    matches: dupResult.matches,
                    newDoc: {
                      vendor: firstExpense.vendor,
                      amount: firstExpense.amount,
                      date: firstExpense.date,
                      description: firstExpense.description,
                    },
                    docId: doc.id,
                  }]);
                }
              } finally {
                setCheckingDuplicates(false);
              }
              
              if (result.expenses.length > 1) {
                toast.info(
                  language === 'es'
                    ? `${result.expenses.length} gastos detectados en esta imagen`
                    : `${result.expenses.length} expenses detected in this image`
                );
              }
            } else {
              // No expenses found — unknown/unrecognized
              setUploadProgress({ fileName: file.name, phase: 'unknown' });
              toast.warning(
                language === 'es'
                  ? `⚠️ No pudimos identificar "${file.name}". Revísalo en la Subida Inteligente.`
                  : `⚠️ Could not identify "${file.name}". Review it in Smart Upload.`,
                { duration: 8000 }
              );
            }
          } catch (aiErr) {
            console.error('Smart processing failed:', aiErr);
            setUploadProgress({ fileName: file.name, phase: 'error' });
          } finally {
            setProcessing(null);
          }
        }
      }

      toast.success(
        language === 'es' 
          ? `${files.length} recibo(s) subido(s) - revisa los datos extraídos`
          : `${files.length} receipt(s) uploaded - review extracted data`
      );
      refetch();
      
      // Open duplicate dialog if queue has items
      setDuplicateQueue(prev => {
        if (prev.length > 0) {
          setDuplicateQueueTotal(prev.length);
          setDuplicateDialogOpen(true);
        }
        return prev;
      });
    } catch (error: any) {
      toast.error(error.message);
      setUploadProgress(prev => prev ? { ...prev, phase: 'error' } : null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApprove = async (id: string, data: ExtractedData) => {
    const result = await approveDocument.mutateAsync({ id, data });
    if (result.suggestedRecurring && result.recurringData) {
      setRecurringCandidate({
        name: result.recurringData.name || '',
        amount: result.recurringData.amount || 0,
        currency: result.recurringData.currency || 'CAD',
        category: result.recurringData.category || 'utilities',
        frequency: 'monthly',
        auto_pay: false,
        next_due_date: null,
      });
      setRecurringDialogOpen(true);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    if (!window.confirm(language === 'es' ? '¿Rechazar este documento?' : 'Reject this document?')) return;
    await rejectDocument.mutateAsync({ id, reason });
  };

  const handleAddComment = async (id: string, comment: string) => {
    await addComment.mutateAsync({ id, comment });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(language === 'es' ? '¿Eliminar este documento permanentemente?' : 'Delete this document permanently?')) return;
    await deleteDocument.mutateAsync(id);
  };

  const handleCheckDuplicates = async (id: string, data: ExtractedData) => {
    if (!user?.id) return;
    setCheckingDuplicates(true);
    try {
      const dupResult = await checkContent({
        vendor: data.vendor,
        amount: data.amount,
        date: data.date,
        description: data.description,
      }, id);

      if (dupResult.hasDuplicates) {
        setDuplicateQueue([{
          matches: dupResult.matches,
          newDoc: {
            vendor: data.vendor,
            amount: data.amount,
            date: data.date,
            description: data.description,
          },
          docId: id,
        }]);
        setDuplicateQueueTotal(1);
        setDuplicateDialogOpen(true);
      } else {
        toast.info(
          language === 'es' 
            ? '✅ No se encontraron duplicados para este documento' 
            : '✅ No duplicates found for this document'
        );
      }
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const handleCameraPhotos = async (photos: CapturedPhoto[]) => {
    if (!user || photos.length === 0) return;

    setUploading(true);
    
    let sessionId = currentSessionId;
    if (!sessionId) {
      const session = await startSession.mutateAsync(undefined);
      sessionId = session.id;
      setCurrentSessionId(sessionId);
    }

    let totalAmount = 0;
    let receiptsCount = 0;

    try {
      for (const photo of photos) {
        const response = await fetch(photo.dataUrl);
        const blob = await response.blob();
        
        const fileName = `${user.id}/${Date.now()}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('expense-documents')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        const { data: doc, error: dbError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            file_path: fileName,
            file_name: `receipt-${Date.now()}.jpg`,
            file_type: 'image/jpeg',
            file_size: blob.size,
            status: 'pending',
            review_status: 'pending_review',
          })
          .select()
          .single();

        if (dbError) throw dbError;

        if (doc) {
          setProcessing(doc.id);
          try {
            const { data: result, error: aiError } = await supabase.functions.invoke('process-receipt', {
              body: { 
                imageBase64: photo.dataUrl,
                detectMultipleReceipts: detectMultipleReceipts,
              },
            });

            if (aiError && handleAIError(aiError, { feature: 'ocr', requiredPlan: 'premium' })) {
              return;
            }
            if (result?.error && handleAIError(result, { feature: 'ocr', requiredPlan: 'premium' })) {
              return;
            }

            if (!aiError && result?.expenses?.length > 0) {
              const extractedData = {
                ...result.expenses[0],
                all_expenses: result.expenses,
                receipts_detected: result.receipts_detected || 1,
              };
              
              await supabase
                .from('documents')
                .update({ 
                  extracted_data: JSON.parse(JSON.stringify(extractedData)),
                  status: 'classified' 
                } as any)
                .eq('id', doc.id);
              
              receiptsCount += result.receipts_detected || 1;
              result.expenses.forEach((exp: any) => {
                totalAmount += exp.amount || 0;
              });

              // Layer 2: Post-OCR duplicate detection (camera, queued)
              const firstExpense = result.expenses[0];
              setCheckingDuplicates(true);
              try {
                const dupResult = await checkContent({
                  vendor: firstExpense.vendor,
                  amount: firstExpense.amount,
                  date: firstExpense.date,
                  description: firstExpense.description,
                  line_items: firstExpense.line_items,
                }, doc.id);

                if (dupResult.hasDuplicates) {
                  setDuplicateQueue(prev => [...prev, {
                    matches: dupResult.matches,
                    newDoc: {
                      vendor: firstExpense.vendor,
                      amount: firstExpense.amount,
                      date: firstExpense.date,
                      description: firstExpense.description,
                    },
                    docId: doc.id,
                  }]);
                }
              } finally {
                setCheckingDuplicates(false);
              }
              
              if (result.expenses.length > 1) {
                toast.info(
                  language === 'es'
                    ? `${result.expenses.length} gastos detectados en esta imagen`
                    : `${result.expenses.length} expenses detected in this image`
                );
              }
            }
          } catch (aiErr) {
            console.error('Smart processing failed:', aiErr);
          } finally {
            setProcessing(null);
          }
        }
      }
      
      if (sessionId) {
        updateSession.mutate({
          sessionId,
          updates: {
            receipts_captured: receiptsCount,
            total_amount: totalAmount,
          },
        });
      }

      toast.success(
        language === 'es' 
          ? `${photos.length} foto(s) procesada(s) - ${receiptsCount} recibo(s) detectado(s)`
          : `${photos.length} photo(s) processed - ${receiptsCount} receipt(s) detected`
      );
      refetch();
      
      // Open duplicate dialog if queue has items
      setDuplicateQueue(prev => {
        if (prev.length > 0) {
          setDuplicateQueueTotal(prev.length);
          setDuplicateDialogOpen(true);
        }
        return prev;
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const hasPendingWork = pendingDocs.length > 0 || needsCorrectionDocs.length > 0;

  const advanceDuplicateQueue = () => {
    setDuplicateQueue(prev => {
      const next = prev.slice(1);
      if (next.length === 0) {
        setDuplicateDialogOpen(false);
        toast.success(language === 'es' ? 'Revisión de duplicados completada' : 'Duplicate review complete');
      }
      return next;
    });
  };

  return (
    <Layout>
      <TooltipProvider>
        <div className="page-container section-gap">
          {/* Header - Mobile Compact */}
          <PageHeader
            title={language === 'es' ? 'Bandeja del Caos' : 'Chaos Inbox'}
            description={!isMobile ? (language === 'es' 
              ? 'Sube cualquier documento — el sistema lo clasifica y procesa automáticamente'
              : 'Upload any document — the system classifies and processes it automatically') : undefined}
          >
            {!isMobile && <InfoTooltip content={TOOLTIP_CONTENT.chaosInbox} />}
            {!isMobile && <ScanSessionHistory />}
            
            {!isMobile && (
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50">
                <Switch
                  id="multi-receipt"
                  checked={detectMultipleReceipts}
                  onCheckedChange={setDetectMultipleReceipts}
                />
                <Label htmlFor="multi-receipt" className="flex items-center gap-1 text-xs cursor-pointer">
                  <Layers className="h-3 w-3" />
                  {language === 'es' ? 'Multi-recibo' : 'Multi-receipt'}
                </Label>
              </div>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isLoading}
              className="h-9 w-9 p-0 sm:h-9 sm:w-auto sm:px-3"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              <span className="hidden sm:inline ml-2">{language === 'es' ? 'Actualizar' : 'Refresh'}</span>
            </Button>
            
            {/* Mobile overflow menu */}
            {isMobile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background">
                  <DropdownMenuItem onClick={() => setDetectMultipleReceipts(!detectMultipleReceipts)}>
                    <Layers className="h-4 w-4 mr-2" />
                    {detectMultipleReceipts 
                      ? (language === 'es' ? 'Multi-recibo: ON' : 'Multi-receipt: ON')
                      : (language === 'es' ? 'Multi-recibo: OFF' : 'Multi-receipt: OFF')
                    }
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </PageHeader>

          {/* Stats Bar - Always visible */}
          <DocumentStatsBar 
            checklistVisible={checklistVisible}
            onActivateChecklist={() => {
              resetDocChecklist();
              setChecklistVisible(true);
              setChecklistKey(k => k + 1);
            }}
          />

          {/* Global file input - always in DOM regardless of active tab */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={(e) => {
              handleFileUpload(e);
              setActiveTab('receipts');
            }}
            className="hidden"
          />

          {/* Onboarding Checklist - Above tabs */}
          <DocumentOnboardingChecklist 
            key={checklistKey}
            documentCount={documents.length} 
            onUploadClick={() => {
              fileInputRef.current?.click();
            }}
            uploadedTypes={uploadedTypes}
            onDismiss={() => setChecklistVisible(false)}
          />

          {/* Tabs: Unified vs Receipt Review */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="unified" className="gap-2">
                <Sparkles className="h-4 w-4" />
                {language === 'es' ? 'Subida Inteligente' : 'Smart Upload'}
              </TabsTrigger>
              <TabsTrigger value="receipts" className="gap-2">
                <Receipt className="h-4 w-4" />
                {language === 'es' ? 'Centro de Revisión' : 'Review Center'}
                {pendingDocs.length > 0 && (
                  <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">
                    {pendingDocs.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unified" className="mt-4 space-y-4">
              {checkingDuplicates && (
                <Alert className="border-primary/50 bg-primary/5 animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertTitle>{language === 'es' ? 'Verificando duplicados...' : 'Checking for duplicates...'}</AlertTitle>
                  <AlertDescription>
                    {language === 'es' 
                      ? 'Comparando con documentos y gastos existentes'
                      : 'Comparing with existing documents and expenses'}
                  </AlertDescription>
                </Alert>
              )}
              <UnifiedChaosInboxPanel />
            </TabsContent>

            <TabsContent value="receipts" className="mt-4 space-y-4">

          {/* Upload Progress Indicator */}
          {uploadProgress && (
            <Alert className={cn(
              "transition-all duration-300 animate-in fade-in slide-in-from-top-2",
              uploadProgress.phase === 'received' && "border-primary/50 bg-primary/5",
              uploadProgress.phase === 'uploading' && "border-primary/30 bg-primary/5",
              uploadProgress.phase === 'analyzing' && "border-accent/50 bg-accent/5 animate-pulse",
              uploadProgress.phase === 'classified' && "border-success/50 bg-success/5",
              uploadProgress.phase === 'unknown' && "border-warning/50 bg-warning/5",
              uploadProgress.phase === 'error' && "border-destructive/50 bg-destructive/5",
            )}>
              {(uploadProgress.phase === 'uploading' || uploadProgress.phase === 'analyzing') ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : uploadProgress.phase === 'classified' ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : uploadProgress.phase === 'unknown' ? (
                <AlertTriangle className="h-4 w-4 text-warning" />
              ) : uploadProgress.phase === 'error' ? (
                <X className="h-4 w-4 text-destructive" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <AlertTitle className="text-sm">
                {uploadProgress.phase === 'received' && (language === 'es' ? `📥 ${uploadProgress.fileName} recibido` : `📥 ${uploadProgress.fileName} received`)}
                {uploadProgress.phase === 'uploading' && (language === 'es' ? `⬆️ Subiendo ${uploadProgress.fileName}...` : `⬆️ Uploading ${uploadProgress.fileName}...`)}
                {uploadProgress.phase === 'analyzing' && (language === 'es' ? `🧠 Analizando...` : `🧠 Analyzing...`)}
                {uploadProgress.phase === 'classified' && (language === 'es' ? `✅ ${uploadProgress.fileName} clasificado` : `✅ ${uploadProgress.fileName} classified`)}
                {uploadProgress.phase === 'unknown' && (language === 'es' ? `⚠️ ${uploadProgress.fileName} no reconocido` : `⚠️ ${uploadProgress.fileName} not recognized`)}
                {uploadProgress.phase === 'error' && (language === 'es' ? `❌ Error procesando ${uploadProgress.fileName}` : `❌ Error processing ${uploadProgress.fileName}`)}
              </AlertTitle>
            </Alert>
          )}

          {/* Contextual Page Guide - Hidden on mobile */}
          {!isMobile && (
            <PageContextGuide
              {...PAGE_GUIDES['chaos-inbox']}
              actions={[
                { icon: Camera, title: { es: 'Cámara', en: 'Camera' }, description: { es: 'Captura continua', en: 'Continuous capture' }, action: () => setCameraDialogOpen(true) },
                { icon: Upload, title: { es: 'Subir Archivo', en: 'Upload File' }, description: { es: 'Imagen o PDF', en: 'Image or PDF' }, action: () => fileInputRef.current?.click() },
                { icon: CheckCircle2, title: { es: 'Revisar Pendientes', en: 'Review Pending' }, description: { es: `${pendingDocs.length} recibos`, en: `${pendingDocs.length} receipts` }, action: () => document.querySelector('[data-section="pending-docs"]')?.scrollIntoView({ behavior: 'smooth' }) },
                { icon: Edit3, title: { es: 'Correcciones', en: 'Corrections' }, description: { es: `${needsCorrectionDocs.length} pendientes`, en: `${needsCorrectionDocs.length} pending` }, action: () => document.querySelector('[data-section="needs-correction"]')?.scrollIntoView({ behavior: 'smooth' }) }
              ]}
            />
          )}

          {/* Upload Section - Always visible */}
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex items-center gap-4 text-primary">
                  <Smartphone className="h-8 w-8" />
                  <ArrowRight className="h-5 w-5" />
                  <Monitor className="h-8 w-8" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-semibold">
                    {language === 'es' 
                      ? 'Sincronización en tiempo real' 
                      : 'Real-time sync'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'es' 
                      ? 'Toma fotos con tu celular y aparecerán aquí automáticamente'
                      : 'Take photos with your phone and they will appear here automatically'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCameraDialogOpen(true)}
                    className="bg-primary/10 border-primary/30 hover:bg-primary/20"
                  >
                    <Video className="mr-2 h-4 w-4" />
                    {language === 'es' ? 'Cámara' : 'Camera'}
                  </Button>
                  
                  <Button disabled={uploading} onClick={() => fileInputRef.current?.click()} className="bg-gradient-primary">
                    {uploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {uploading 
                      ? (language === 'es' ? 'Subiendo...' : 'Uploading...')
                      : (language === 'es' ? 'Subir' : 'Upload')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mini-resumen de estado */}
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant={pendingDocs.length > 0 ? "warning" : "secondary"} className="gap-1">
              <Clock className="h-3 w-3" />
              {pendingDocs.length} {language === 'es' ? 'pendientes' : 'pending'}
            </Badge>
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {approvedDocs.length} {language === 'es' ? 'aprobados' : 'approved'}
            </Badge>
            {needsCorrectionDocs.length > 0 && (
              <Badge variant="outline" className="gap-1 border-warning text-warning">
                <MessageSquare className="h-3 w-3" />
                {needsCorrectionDocs.length} {language === 'es' ? 'con comentarios' : 'with comments'}
              </Badge>
            )}
            {rejectedDocs.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <X className="h-3 w-3" />
                {rejectedDocs.length} {language === 'es' ? 'rechazados' : 'rejected'}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {documents.length} {language === 'es' ? 'total' : 'total'}
            </span>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2">
            {(['pending', 'processed', 'all'] as const).map(filter => {
              const counts = { 
                pending: pendingDocs.length + needsCorrectionDocs.length,
                processed: approvedDocs.length + rejectedDocs.length,
                all: documents.length
              };
              const labels = {
                pending: language === 'es' ? 'Pendientes' : 'Pending',
                processed: language === 'es' ? 'Procesados' : 'Processed',
                all: language === 'es' ? 'Todos' : 'All',
              };
              return (
                <Button
                  key={filter}
                  variant={reviewFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setReviewFilter(filter)}
                  className="gap-1.5"
                >
                  {labels[filter]} ({counts[filter]})
                </Button>
              );
            })}
          </div>

          {/* Filtered document list */}
          {(() => {
            const filteredDocs = reviewFilter === 'pending' 
              ? [...pendingDocs, ...needsCorrectionDocs]
              : reviewFilter === 'processed' 
                ? [...approvedDocs, ...rejectedDocs]
                : documents;

            if (filteredDocs.length === 0) {
              return (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      {reviewFilter === 'pending' ? (
                        <CheckCircle2 className="h-6 w-6 text-success" />
                      ) : (
                        <Layers className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">
                      {reviewFilter === 'pending' 
                        ? (language === 'es' ? '¡Todo al día!' : 'All caught up!')
                        : reviewFilter === 'processed'
                          ? (language === 'es' ? 'Sin procesados aún' : 'No processed yet')
                          : (language === 'es' ? 'Sin documentos' : 'No documents')}
                    </h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      {reviewFilter === 'pending'
                        ? (language === 'es' ? 'No tienes documentos pendientes de revisar.' : 'You have no pending documents to review.')
                        : (language === 'es' ? 'Sube documentos para comenzar.' : 'Upload documents to get started.')}
                    </p>
                  </CardContent>
                </Card>
              );
            }

            return (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredDocs.map((doc) => (
                  <DocumentImageWrapper
                    key={doc.id}
                    document={doc}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onAddComment={handleAddComment}
                    onDelete={handleDelete}
                    onCheckDuplicates={handleCheckDuplicates}
                    isLoading={approveDocument.isPending || processing === doc.id}
                    onDataExtracted={() => refetch()}
                  />
                ))}
              </div>
            );
          })()}

          {/* Scan Session History */}
          <ScanSessionHistory />

            </TabsContent>
          </Tabs>
        </div>
      </TooltipProvider>

      <ContinuousCameraDialog
        open={cameraDialogOpen}
        onOpenChange={setCameraDialogOpen}
        onSubmitPhotos={handleCameraPhotos}
      />

      <RecurringBillConfirmDialog
        open={recurringDialogOpen}
        onClose={() => setRecurringDialogOpen(false)}
        candidate={recurringCandidate}
        onCreated={() => setRecurringCandidate(null)}
      />

      {duplicateQueue.length > 0 && (
        <DuplicateWarningDialog
          open={duplicateDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              // User closed dialog — skip current item, advance queue
              setDuplicateQueue(prev => {
                const next = prev.slice(1);
                if (next.length === 0) setDuplicateDialogOpen(false);
                return next;
              });
            }
            setDuplicateDialogOpen(open);
          }}
          matches={duplicateQueue[0].matches}
          newDocument={duplicateQueue[0].newDoc}
          newDocId={duplicateQueue[0].docId}
          queuePosition={duplicateQueueTotal > 1 ? (duplicateQueueTotal - duplicateQueue.length + 1) : undefined}
          queueTotal={duplicateQueueTotal > 1 ? duplicateQueueTotal : undefined}
          onKeepBoth={() => {
            toast.info(language === 'es' ? 'Ambos conservados' : 'Both kept');
            advanceDuplicateQueue();
          }}
          onDeleteNew={async () => {
            const currentItem = duplicateQueue[0];
            if (currentItem?.docId) {
              const { data: docData } = await supabase
                .from('documents')
                .select('file_path')
                .eq('id', currentItem.docId)
                .single();
              
              await supabase.from('documents').delete().eq('id', currentItem.docId).eq('user_id', user?.id || '');
              
              if (docData?.file_path) {
                await supabase.storage.from('expense-documents').remove([docData.file_path]);
              }
              
              refetch();
              toast.success(language === 'es' ? 'Duplicado eliminado' : 'Duplicate removed');
            }
            advanceDuplicateQueue();
          }}
          onReplaceOld={async () => {
            const currentItem = duplicateQueue[0];
            const match = currentItem?.matches[0];
            if (!match) {
              toast.info(language === 'es' ? 'Ambos conservados' : 'Both kept');
              advanceDuplicateQueue();
              return;
            }
            
            if (match.type === 'expense') {
              await supabase.from('expenses').delete().eq('id', match.id).eq('user_id', user?.id || '');
            }
            
            const oldDocId = match.type === 'document' ? match.id : match.document_id;
            if (oldDocId) {
              const { data: oldDoc } = await supabase
                .from('documents')
                .select('file_path')
                .eq('id', oldDocId)
                .single();
              
              await supabase.from('documents').delete().eq('id', oldDocId).eq('user_id', user?.id || '');
              
              if (oldDoc?.file_path) {
                await supabase.storage.from('expense-documents').remove([oldDoc.file_path]);
              }
            }
            
            refetch();
            toast.success(language === 'es' ? 'Anterior reemplazado' : 'Old one replaced');
            advanceDuplicateQueue();
          }}
        />
      )}
    </Layout>
  );
}
