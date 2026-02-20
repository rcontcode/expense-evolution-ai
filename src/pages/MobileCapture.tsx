import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Loader2, 
  Sparkles, 
  RefreshCw, 
  ArrowLeft,
  Wifi,
  WifiOff,
  Zap,
  Upload,
  ImagePlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useReceiptProcessor, ExtractedExpenseData } from '@/hooks/data/useReceiptProcessor';
import { useCreateExpense, useUpdateExpense } from '@/hooks/data/useExpenses';
import { useCaptureStreak } from '@/hooks/data/useCaptureStreak';
import { useEntity } from '@/contexts/EntityContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { MobileCaptureStats } from '@/components/capture/MobileCaptureStats';
import { QuickEditPanel } from '@/components/capture/QuickEditPanel';
export default function MobileCapture() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { currentEntity } = useEntity();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [savedDocumentId, setSavedDocumentId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSavedExpense, setLastSavedExpense] = useState<ExtractedExpenseData | null>(null);
  const [savedExpenseId, setSavedExpenseId] = useState<string | null>(null);
  const [showQuickEdit, setShowQuickEdit] = useState(false);

  const { processReceipt, isProcessing } = useReceiptProcessor();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const { 
    todayCount, 
    dailyGoal, 
    currentStreak, 
    goalProgress, 
    goalReached,
    recordCapture 
  } = useCaptureStreak();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success(language === 'es' ? '¡Conexión restaurada!' : 'Connection restored!');
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [language]);

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, source: 'camera' | 'file' = 'file') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setImagePreview(URL.createObjectURL(file));
    setImageFile(file);
    
    // Convert to base64 for AI processing
    const reader = new FileReader();
    reader.onloadend = () => setImageBase64(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to storage immediately (same as QuickCapture)
    const fileName = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('expense-documents')
      .upload(fileName, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      toast.error(language === 'es' ? `Error subiendo foto: ${uploadError.message}` : `Upload error: ${uploadError.message}`);
      return;
    }

    // Create document record
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

    if (dbError) {
      console.error('Document DB error:', dbError);
      return;
    }

    setSavedDocumentId(doc.id);
  };

  const triggerSuccessConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'],
    });
  };

  const handleProcessAndSave = async () => {
    if (!imageBase64) return;

    try {
      const result = await processReceipt(imageBase64, undefined);
      
      if (result?.expenses?.length) {
        // Save extracted data to document record
        if (savedDocumentId) {
          await supabase
            .from('documents')
            .update({ extracted_data: result.expenses as any, status: 'classified' })
            .eq('id', savedDocumentId);
        }

        let savedCount = 0;
        let billsCreated = 0;
        let lastExpense: ExtractedExpenseData | null = null;
        let lastId: string | null = null;
        let isFirst = true;

        for (const exp of result.expenses) {
          if (!exp.vendor || !exp.amount) continue;

          // Create expense
          const docId = isFirst ? savedDocumentId : null;
          const newExpense = await createExpense.mutateAsync({
            vendor: exp.vendor,
            amount: exp.amount,
            date: exp.date,
            category: exp.category,
            description: exp.description,
            client_id: null,
            document_id: docId,
            currency: currentEntity?.default_currency || exp.currency || 'CAD',
            status: 'pending'
          } as any);

          // Link document back to first expense
          if (isFirst && savedDocumentId && newExpense?.id) {
            await supabase
              .from('documents')
              .update({ expense_id: newExpense.id, status: 'classified', review_status: 'approved' })
              .eq('id', savedDocumentId);
          }

          // Auto-create recurring bill if detected (same as QuickCapture)
          if (exp.is_recurring_candidate && exp.recurring_bill_data && user) {
            try {
              const billData = exp.recurring_bill_data;
              await supabase.from('recurring_bills').insert({
                user_id: user.id,
                name: billData.name,
                amount: exp.amount,
                category: billData.category || 'utilities',
                frequency: billData.frequency || 'monthly',
                next_due_date: billData.next_due_date || exp.date,
                auto_pay: billData.auto_pay || false,
                is_active: true,
                currency: currentEntity?.default_currency || exp.currency || 'CAD',
              });
              billsCreated++;
            } catch (billErr) {
              console.error('Error creating recurring bill:', billErr);
            }
          }

          savedCount++;
          lastExpense = exp;
          lastId = newExpense?.id || null;
          isFirst = false;
        }
        
        recordCapture(savedCount);
        triggerSuccessConfetti();
        
        if (lastExpense) {
          setLastSavedExpense(lastExpense);
          setSavedExpenseId(lastId);
          setShowQuickEdit(true);
        }

        // Build contextual success message
        const parts: string[] = [];
        if (savedCount > 0) {
          parts.push(language === 'es' ? `${savedCount} gasto(s)` : `${savedCount} expense(s)`);
        }
        if (billsCreated > 0) {
          parts.push(language === 'es' ? `${billsCreated} pago(s) fijo(s)` : `${billsCreated} recurring bill(s)`);
        }
        toast.success(
          language === 'es'
            ? `✅ ${parts.join(' + ')} guardado(s) con documento`
            : `✅ ${parts.join(' + ')} saved with document`
        );
        
      } else {
        toast.error(
          language === 'es'
            ? 'No se pudo extraer información del documento'
            : 'Could not extract information from document'
        );
      }
    } catch (error) {
      console.error('Error processing document:', error);
      toast.error(
        language === 'es'
          ? 'Error al procesar el documento'
          : 'Error processing document'
      );
    }
  };

  const handleRetake = () => {
    setImagePreview(null);
    setImageBase64(null);
    setImageFile(null);
    setSavedDocumentId(null);
    setShowQuickEdit(false);
    setLastSavedExpense(null);
    setSavedExpenseId(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleQuickEditSave = async (updates: { 
    clientId?: string; 
    projectId?: string; 
    category?: string;
  }) => {
    if (!savedExpenseId) return;
    
    try {
      await updateExpense.mutateAsync({
        id: savedExpenseId,
        updates: {
          client_id: updates.clientId || null,
          project_id: updates.projectId || null,
          category: updates.category,
        },
      });
      setShowQuickEdit(false);
      setImagePreview(null);
      setImageBase64(null);
      setImageFile(null);
      setSavedDocumentId(null);
      setSavedExpenseId(null);
      setLastSavedExpense(null);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const handleCaptureAnother = () => {
    setShowQuickEdit(false);
    setImagePreview(null);
    setImageBase64(null);
    setImageFile(null);
    setSavedDocumentId(null);
    setLastSavedExpense(null);
    setSavedExpenseId(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => handleCameraCapture(), 100);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Animated Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-gradient-to-r from-primary/90 via-accent/80 to-primary/90 backdrop-blur border-b border-primary/20 px-4 py-3"
      >
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard')}
            className="text-primary-foreground hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ 
                boxShadow: ['0 0 0 0 rgba(255,255,255,0.4)', '0 0 0 8px rgba(255,255,255,0)', '0 0 0 0 rgba(255,255,255,0)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-1.5 rounded-full bg-white/20"
            >
              <Camera className="h-5 w-5 text-primary-foreground" />
            </motion.div>
            <span className="font-semibold text-primary-foreground">
              {language === 'es' ? 'Captura de Recibos' : 'Receipt Capture'}
            </span>
          </div>
          <Badge 
            variant={isOnline ? 'default' : 'destructive'} 
            className={cn(
              "gap-1 transition-all",
              isOnline 
                ? "bg-emerald-500/90 hover:bg-emerald-500" 
                : "bg-red-500/90 animate-pulse"
            )}
          >
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Stats Card - Always visible */}
        <MobileCaptureStats
          todayCount={todayCount}
          dailyGoal={dailyGoal}
          currentStreak={currentStreak}
          goalProgress={goalProgress}
          goalReached={goalReached}
        />

        {/* Camera/Upload Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden border border-border">
            <CardContent className="p-4">
              {!imagePreview ? (
                <div className="space-y-4">
                  {/* Two action buttons: Camera + Upload */}
                  <div className={cn(
                    "grid gap-3",
                    isMobile ? "grid-cols-1" : "grid-cols-2"
                  )}>
                    {/* Camera Button */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCameraCapture}
                      className={cn(
                        "rounded-xl border-2 border-dashed border-primary/40 cursor-pointer transition-all relative overflow-hidden",
                        "bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10",
                        "hover:border-primary hover:shadow-lg hover:shadow-primary/20",
                        "flex flex-col items-center justify-center gap-3 p-8",
                        isMobile ? "aspect-[4/3]" : "aspect-square"
                      )}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
                        animate={{ x: ['-200%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                      />
                      <motion.div 
                        className="p-4 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 shadow-lg shadow-primary/20"
                        animate={{ 
                          y: [0, -5, 0],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Camera className="h-8 w-8 text-primary" />
                      </motion.div>
                      <div className="text-center relative z-10">
                        <p className="text-base font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          {language === 'es' ? '📸 Tomar Foto' : '📸 Take Photo'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === 'es' 
                            ? 'Usa la cámara de tu dispositivo'
                            : 'Use your device camera'
                          }
                        </p>
                      </div>
                    </motion.div>

                    {/* Upload Button */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleFileUpload}
                      className={cn(
                        "rounded-xl border-2 border-dashed border-accent/40 cursor-pointer transition-all relative overflow-hidden",
                        "bg-gradient-to-br from-accent/5 via-secondary/5 to-primary/10",
                        "hover:border-accent hover:shadow-lg hover:shadow-accent/20",
                        "flex flex-col items-center justify-center gap-3 p-8",
                        isMobile ? "aspect-[4/3]" : "aspect-square"
                      )}
                    >
                      <motion.div 
                        className="p-4 rounded-full bg-gradient-to-br from-accent/30 to-secondary/20 shadow-lg shadow-accent/20"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                      >
                        <Upload className="h-8 w-8 text-accent-foreground" />
                      </motion.div>
                      <div className="text-center relative z-10">
                        <p className="text-base font-semibold text-accent-foreground">
                          {language === 'es' ? '📁 Subir Archivo' : '📁 Upload File'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === 'es'
                            ? 'Selecciona una imagen o documento'
                            : 'Select an image or document'
                          }
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    {language === 'es'
                      ? '💡 Soporta recibos, facturas, e-transfers y estados de cuenta'
                      : '💡 Supports receipts, invoices, e-transfers and bank statements'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={cn(
                    "rounded-xl overflow-hidden bg-muted relative",
                    isMobile ? "aspect-[3/4]" : "aspect-[4/3] max-h-[400px]"
                  )}>
                    <img 
                      src={imagePreview} 
                      alt="Receipt preview" 
                      className="w-full h-full object-contain"
                    />
                    
                    {/* Laser scan animation during processing */}
                    <AnimatePresence>
                      {isProcessing && (
                        <>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
                          />
                          <motion.div
                            initial={{ top: '0%' }}
                            animate={{ top: '100%' }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_20px_5px_rgba(16,185,129,0.5)]"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                            >
                              <Zap className="h-10 w-10 text-emerald-500" />
                            </motion.div>
                            <p className="text-sm font-medium text-foreground">
                              {language === 'es' ? 'Analizando...' : 'Analyzing...'}
                            </p>
                          </div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileSelect(e, 'camera')}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => handleFileSelect(e, 'file')}
          className="hidden"
        />

        {/* Action Buttons */}
        <AnimatePresence>
          {imagePreview && !isProcessing && !showQuickEdit && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="grid grid-cols-2 gap-3"
            >
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleRetake}
                className="h-14 border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                {language === 'es' ? 'Repetir' : 'Retake'}
              </Button>
              <Button 
                size="lg" 
                onClick={handleProcessAndSave}
                disabled={!isOnline}
                className={cn(
                  "h-14 font-semibold transition-all",
                  "bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%]",
                  "hover:bg-[position:100%_0] hover:shadow-lg hover:shadow-primary/30",
                  "active:scale-[0.98]"
                )}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                {language === 'es' ? 'Procesar' : 'Process'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick capture again button after processing */}
        {!imagePreview && !showQuickEdit && todayCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button 
              size="lg" 
              onClick={handleCameraCapture}
              className={cn(
                "w-full h-14 font-semibold",
                "bg-gradient-to-r from-emerald-500 to-green-500",
                "hover:from-emerald-600 hover:to-green-600",
                "shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50",
                "transition-all active:scale-[0.98]"
              )}
            >
              <Camera className="mr-2 h-5 w-5" />
              {language === 'es' ? 'Capturar otro recibo' : 'Capture another receipt'}
            </Button>
          </motion.div>
        )}
      </main>

      {/* Quick Edit Panel */}
      {showQuickEdit && lastSavedExpense && (
        <QuickEditPanel
          expense={lastSavedExpense}
          onSave={handleQuickEditSave}
          onCaptureAnother={handleCaptureAnother}
          onEditMore={() => navigate('/expenses')}
          onClose={() => {
            setShowQuickEdit(false);
            handleRetake();
          }}
        />
      )}

      {/* Offline Warning */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3 text-center text-sm shadow-lg"
          >
            <WifiOff className="h-4 w-4 inline-block mr-2" />
            {language === 'es' 
              ? 'Sin conexión. Los gastos se guardarán cuando vuelvas a conectarte.'
              : 'Offline. Expenses will be saved when you reconnect.'
            }
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
