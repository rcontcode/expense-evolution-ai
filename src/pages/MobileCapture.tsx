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
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReceiptProcessor } from '@/hooks/data/useReceiptProcessor';
import { useCreateExpense } from '@/hooks/data/useExpenses';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function MobileCapture() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [captureCount, setCaptureCount] = useState(0);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  const { processReceipt, isProcessing } = useReceiptProcessor();
  const createExpense = useCreateExpense();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCameraCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImagePreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onloadend = () => setImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleProcessAndSave = async () => {
    if (!imageBase64) return;

    try {
      const result = await processReceipt(imageBase64, undefined);
      
      if (result?.expenses?.length) {
        let savedCount = 0;
        for (const exp of result.expenses) {
          if (!exp.vendor || !exp.amount) continue;
          await createExpense.mutateAsync({
            vendor: exp.vendor,
            amount: exp.amount,
            date: exp.date,
            category: exp.category,
            description: exp.description,
            client_id: null,
            status: 'pending'
          } as any);
          savedCount++;
        }
        
        setCaptureCount(prev => prev + savedCount);
        setLastSavedTime(new Date());
        
        toast.success(
          language === 'es' 
            ? `¡${savedCount} gasto(s) guardado(s)! Sincronizado con tu laptop.`
            : `${savedCount} expense(s) saved! Synced to your laptop.`
        );
        
        // Reset for next capture
        setImagePreview(null);
        setImageBase64(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        toast.error(
          language === 'es'
            ? 'No se pudo extraer información del recibo'
            : 'Could not extract information from receipt'
        );
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      toast.error(
        language === 'es'
          ? 'Error al procesar el recibo'
          : 'Error processing receipt'
      );
    }
  };

  const handleRetake = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <span className="font-semibold">
              {language === 'es' ? 'Captura Móvil' : 'Mobile Capture'}
            </span>
          </div>
          <Badge variant={isOnline ? 'default' : 'destructive'} className="gap-1">
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4">
        {/* Stats Card */}
        {captureCount > 0 && (
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'es' ? 'Capturados hoy' : 'Captured today'}
                  </p>
                  <p className="text-2xl font-bold text-primary">{captureCount}</p>
                </div>
                {lastSavedTime && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {language === 'es' ? 'Último guardado' : 'Last saved'}
                    </p>
                    <p className="text-sm font-medium">
                      {lastSavedTime.toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Camera Area */}
        <Card className="flex-1">
          <CardContent className="p-4">
            {!imagePreview ? (
              <div 
                onClick={handleCameraCapture}
                className={cn(
                  "aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all",
                  "border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10 active:scale-[0.98]"
                )}
              >
                <div className="p-6 rounded-full bg-primary/20">
                  <Camera className="h-12 w-12 text-primary" />
                </div>
                <div className="text-center px-4">
                  <p className="text-lg font-semibold">
                    {language === 'es' ? 'Toca para fotografiar' : 'Tap to photograph'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'es' 
                      ? 'Captura tu recibo y se procesará automáticamente con IA'
                      : 'Capture your receipt and it will be processed automatically with AI'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted relative">
                  <img 
                    src={imagePreview} 
                    alt="Receipt preview" 
                    className="w-full h-full object-contain"
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-sm font-medium">
                        {language === 'es' ? 'Analizando con IA...' : 'Analyzing with AI...'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Action Buttons */}
        {imagePreview && !isProcessing && (
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={handleRetake}
              className="h-14"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              {language === 'es' ? 'Repetir' : 'Retake'}
            </Button>
            <Button 
              size="lg" 
              onClick={handleProcessAndSave}
              disabled={!isOnline}
              className="h-14"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {language === 'es' ? 'Procesar' : 'Process'}
            </Button>
          </div>
        )}

        {/* Quick capture again button after processing */}
        {!imagePreview && captureCount > 0 && (
          <Button 
            size="lg" 
            onClick={handleCameraCapture}
            className="w-full h-14"
          >
            <Camera className="mr-2 h-5 w-5" />
            {language === 'es' ? 'Capturar otro recibo' : 'Capture another receipt'}
          </Button>
        )}
      </main>

      {/* Offline Warning */}
      {!isOnline && (
        <div className="fixed bottom-0 left-0 right-0 bg-destructive text-destructive-foreground p-3 text-center text-sm">
          <WifiOff className="h-4 w-4 inline-block mr-2" />
          {language === 'es' 
            ? 'Sin conexión. Los gastos se guardarán cuando vuelvas a conectarte.'
            : 'Offline. Expenses will be saved when you reconnect.'
          }
        </div>
      )}
    </div>
  );
}
