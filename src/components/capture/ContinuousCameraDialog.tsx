import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Camera, X, Check, Trash2, Loader2, 
  RotateCcw, ImagePlus, Send, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
}

interface ContinuousCameraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitPhotos: (photos: CapturedPhoto[]) => Promise<void>;
}

export function ContinuousCameraDialog({
  open,
  onOpenChange,
  onSubmitPhotos,
}: ContinuousCameraDialogProps) {
  const { language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(
        language === 'es' 
          ? 'No se pudo acceder a la cámara. Verifica los permisos.'
          : 'Could not access camera. Check permissions.'
      );
      setCameraActive(false);
    }
  }, [facingMode, language]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    
    const newPhoto: CapturedPhoto = {
      id: `photo-${Date.now()}`,
      dataUrl,
      timestamp: new Date(),
    };
    
    setPhotos(prev => [...prev, newPhoto]);
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  }, []);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, []);

  const handleSubmit = async () => {
    if (photos.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmitPhotos(photos);
      setPhotos([]);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setPhotos([]);
    onOpenChange(false);
  };

  // Start camera when dialog opens
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (open && cameraActive) {
      startCamera();
    }
  }, [facingMode]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Captura Continua' : 'Continuous Capture'}
          </DialogTitle>
          <DialogDescription>
            {language === 'es' 
              ? 'Toma múltiples fotos de recibos sin cerrar la cámara'
              : 'Take multiple photos of receipts without closing the camera'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 pt-0 overflow-hidden">
          {/* Camera View */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="relative flex-1 bg-black rounded-lg overflow-hidden min-h-[300px]">
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive p-4">
                  <Camera className="h-12 w-12 mb-2 opacity-50" />
                  <p className="text-center">{cameraError}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={startCamera}
                    className="mt-4"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Reintentar' : 'Retry'}
                  </Button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  
                  {/* Camera Controls Overlay */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={switchCamera}
                      className="rounded-full h-12 w-12 bg-background/80 backdrop-blur"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                    
                    <Button
                      size="icon"
                      onClick={takePhoto}
                      disabled={!cameraActive}
                      className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90 shadow-lg"
                    >
                      <Camera className="h-8 w-8" />
                    </Button>
                    
                    <div className="w-12" /> {/* Spacer for symmetry */}
                  </div>

                  {/* Photo count badge */}
                  {photos.length > 0 && (
                    <Badge 
                      className="absolute top-4 right-4 bg-primary text-primary-foreground"
                    >
                      <ImagePlus className="h-3 w-3 mr-1" />
                      {photos.length}
                    </Badge>
                  )}
                </>
              )}
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Captured Photos Panel */}
          <div className="w-full md:w-64 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" />
                {language === 'es' ? 'Capturadas' : 'Captured'} ({photos.length})
              </h3>
              {photos.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setPhotos([])}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {language === 'es' ? 'Limpiar' : 'Clear'}
                </Button>
              )}
            </div>

            <ScrollArea className="flex-1 min-h-[150px] md:min-h-0">
              {photos.length === 0 ? (
                <Card className="border-dashed p-4 text-center text-muted-foreground">
                  <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {language === 'es' 
                      ? 'Toma fotos de tus recibos'
                      : 'Take photos of your receipts'}
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-2 gap-2">
                  {photos.map((photo, index) => (
                    <div 
                      key={photo.id} 
                      className="relative group aspect-square rounded-lg overflow-hidden border"
                    >
                      <img 
                        src={photo.dataUrl} 
                        alt={`Receipt ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <Badge 
                        variant="secondary" 
                        className="absolute bottom-1 left-1 text-xs"
                      >
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={photos.length === 0 || isSubmitting}
              className="w-full bg-gradient-primary"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'es' ? 'Procesando...' : 'Processing...'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {language === 'es' 
                    ? `Enviar ${photos.length} recibo(s)`
                    : `Submit ${photos.length} receipt(s)`}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { CapturedPhoto };
