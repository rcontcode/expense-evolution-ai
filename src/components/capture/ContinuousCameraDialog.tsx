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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Camera, X, Trash2, Loader2, 
  RotateCcw, ImagePlus, Send, Zap, Flashlight, Crop,
  ScanLine, Pause, Play
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

// Generate shutter sound using Web Audio API
function playShutterSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
    
    setTimeout(() => audioContext.close(), 200);
  } catch (e) {
    console.log('Audio not supported');
  }
}

// Trigger device vibration
function triggerVibration() {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  } catch (e) {
    console.log('Vibration not supported');
  }
}

// Auto-crop receipt from image using edge detection
function autoCropReceipt(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/jpeg', 0.85);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  const grayscale: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    grayscale.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }
  
  let minX = width, maxX = 0, minY = height, maxY = 0;
  const margin = 20;
  
  for (let y = margin; y < height - margin; y++) {
    for (let x = margin; x < width - margin; x++) {
      const idx = y * width + x;
      const brightness = grayscale[idx];
      
      if (brightness > 150) {
        let brightNeighbors = 0;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nIdx = (y + dy) * width + (x + dx);
            if (grayscale[nIdx] > 140) brightNeighbors++;
          }
        }
        
        if (brightNeighbors > 15) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }
  
  const cropWidth = maxX - minX;
  const cropHeight = maxY - minY;
  
  if (cropWidth > width * 0.2 && cropHeight > height * 0.2 && 
      cropWidth < width * 0.95 && cropHeight < height * 0.95) {
    const padding = 10;
    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);
    const finalWidth = Math.min(width - cropX, cropWidth + padding * 2);
    const finalHeight = Math.min(height - cropY, cropHeight + padding * 2);
    
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = finalWidth;
    croppedCanvas.height = finalHeight;
    const croppedCtx = croppedCanvas.getContext('2d');
    
    if (croppedCtx) {
      croppedCtx.drawImage(
        canvas, 
        cropX, cropY, finalWidth, finalHeight,
        0, 0, finalWidth, finalHeight
      );
      return croppedCanvas.toDataURL('image/jpeg', 0.85);
    }
  }
  
  return canvas.toDataURL('image/jpeg', 0.85);
}

// Calculate image difference for motion detection
function calculateImageDifference(
  prevData: Uint8ClampedArray | null, 
  currData: Uint8ClampedArray
): number {
  if (!prevData || prevData.length !== currData.length) return 100;
  
  let diff = 0;
  const sampleRate = 16; // Sample every 16th pixel for performance
  let samples = 0;
  
  for (let i = 0; i < currData.length; i += 4 * sampleRate) {
    const prevGray = 0.299 * prevData[i] + 0.587 * prevData[i + 1] + 0.114 * prevData[i + 2];
    const currGray = 0.299 * currData[i] + 0.587 * currData[i + 1] + 0.114 * currData[i + 2];
    diff += Math.abs(prevGray - currGray);
    samples++;
  }
  
  return samples > 0 ? diff / samples : 0;
}

export function ContinuousCameraDialog({
  open,
  onOpenChange,
  onSubmitPhotos,
}: ContinuousCameraDialogProps) {
  const { language, t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  const stableFrameCountRef = useRef(0);
  const lastCaptureTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [flashOn, setFlashOn] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const [autoCropEnabled, setAutoCropEnabled] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);
  
  // Auto-scan mode states
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);
  const [autoScanPaused, setAutoScanPaused] = useState(false);
  const [scanStatus, setScanStatus] = useState<'waiting' | 'detecting' | 'stabilizing' | 'capturing'>('waiting');
  const [stabilityProgress, setStabilityProgress] = useState(0);

  const STABILITY_THRESHOLD = 5; // Max difference for "stable" frame
  const CHANGE_THRESHOLD = 15; // Min difference for "new receipt detected"
  const FRAMES_NEEDED_FOR_CAPTURE = 15; // ~0.5 seconds at 30fps
  const MIN_CAPTURE_INTERVAL = 2000; // 2 seconds between auto-captures

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      
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
      const videoTrack = stream.getVideoTracks()[0];
      trackRef.current = videoTrack;
      
      const capabilities = videoTrack.getCapabilities?.() as any;
      if (capabilities?.torch) {
        setFlashSupported(true);
      } else {
        setFlashSupported(false);
      }
      
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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      trackRef.current = null;
    }
    setCameraActive(false);
    setFlashOn(false);
    setAutoScanEnabled(false);
  }, []);

  const toggleFlash = useCallback(async () => {
    if (!trackRef.current || !flashSupported) return;
    
    try {
      const newFlashState = !flashOn;
      await trackRef.current.applyConstraints({
        advanced: [{ torch: newFlashState } as any]
      });
      setFlashOn(newFlashState);
    } catch (e) {
      console.error('Failed to toggle flash:', e);
    }
  }, [flashOn, flashSupported]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    playShutterSound();
    triggerVibration();
    
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 100);
    
    ctx.drawImage(video, 0, 0);
    
    const dataUrl = autoCropEnabled 
      ? autoCropReceipt(canvas) 
      : canvas.toDataURL('image/jpeg', 0.85);
    
    const newPhoto: CapturedPhoto = {
      id: `photo-${Date.now()}`,
      dataUrl,
      timestamp: new Date(),
    };
    
    setPhotos(prev => [...prev, newPhoto]);
    lastCaptureTimeRef.current = Date.now();
    stableFrameCountRef.current = 0;
    prevFrameDataRef.current = null;
    setScanStatus('waiting');
    setStabilityProgress(0);
  }, [autoCropEnabled]);

  // Auto-scan detection loop
  const runAutoScanDetection = useCallback(() => {
    if (!autoScanEnabled || autoScanPaused || !cameraActive || !videoRef.current || !detectionCanvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = detectionCanvasRef.current;
    
    // Use smaller canvas for detection (performance)
    const scale = 0.1;
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const currentData = imageData.data;
    
    const diff = calculateImageDifference(prevFrameDataRef.current, currentData);
    const timeSinceLastCapture = Date.now() - lastCaptureTimeRef.current;
    
    if (timeSinceLastCapture < MIN_CAPTURE_INTERVAL) {
      setScanStatus('waiting');
      setStabilityProgress(0);
    } else if (diff > CHANGE_THRESHOLD) {
      // Significant change detected - new receipt?
      setScanStatus('detecting');
      stableFrameCountRef.current = 0;
      setStabilityProgress(0);
    } else if (diff < STABILITY_THRESHOLD && scanStatus !== 'waiting') {
      // Frame is stable
      stableFrameCountRef.current++;
      const progress = Math.min(100, (stableFrameCountRef.current / FRAMES_NEEDED_FOR_CAPTURE) * 100);
      setStabilityProgress(progress);
      setScanStatus('stabilizing');
      
      if (stableFrameCountRef.current >= FRAMES_NEEDED_FOR_CAPTURE) {
        // Stable enough - capture!
        setScanStatus('capturing');
        capturePhoto();
      }
    } else if (scanStatus === 'detecting') {
      // Still moving but detected change
      stableFrameCountRef.current = 0;
      setStabilityProgress(0);
    }
    
    // Store current frame for next comparison
    prevFrameDataRef.current = new Uint8ClampedArray(currentData);
    
    animationFrameRef.current = requestAnimationFrame(runAutoScanDetection);
  }, [autoScanEnabled, autoScanPaused, cameraActive, scanStatus, capturePhoto]);

  // Start/stop auto-scan detection loop
  useEffect(() => {
    if (autoScanEnabled && cameraActive && !autoScanPaused) {
      animationFrameRef.current = requestAnimationFrame(runAutoScanDetection);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [autoScanEnabled, cameraActive, autoScanPaused, runAutoScanDetection]);

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

  const toggleAutoScan = () => {
    if (!autoScanEnabled) {
      setAutoScanEnabled(true);
      setAutoScanPaused(false);
      stableFrameCountRef.current = 0;
      prevFrameDataRef.current = null;
      lastCaptureTimeRef.current = 0;
      setScanStatus('waiting');
    } else {
      setAutoScanEnabled(false);
      setScanStatus('waiting');
      setStabilityProgress(0);
    }
  };

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

  useEffect(() => {
    if (open && cameraActive) {
      startCamera();
    }
  }, [facingMode]);

  const getScanStatusText = () => {
    switch (scanStatus) {
      case 'waiting':
        return t('camera.waitingReceipt');
      case 'detecting':
        return t('camera.receiptDetected');
      case 'stabilizing':
        return t('camera.stabilizing');
      case 'capturing':
        return t('camera.capturing');
      default:
        return '';
    }
  };

  const getScanStatusColor = () => {
    switch (scanStatus) {
      case 'waiting': return 'bg-muted';
      case 'detecting': return 'bg-warning';
      case 'stabilizing': return 'bg-primary';
      case 'capturing': return 'bg-success';
      default: return 'bg-muted';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {t('camera.continuousCapture')}
          </DialogTitle>
          <DialogDescription>
            {t('camera.continuousCaptureDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 pt-0 overflow-hidden">
          {/* Camera View */}
          <div className="flex-1 flex flex-col gap-3">
            {/* Camera Options */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-scan"
                  checked={autoScanEnabled}
                  onCheckedChange={toggleAutoScan}
                />
                <Label htmlFor="auto-scan" className="flex items-center gap-1 text-xs">
                  <ScanLine className="h-3 w-3" />
                  {t('camera.autoScan')}
                </Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-crop"
                  checked={autoCropEnabled}
                  onCheckedChange={setAutoCropEnabled}
                />
                <Label htmlFor="auto-crop" className="flex items-center gap-1 text-xs">
                  <Crop className="h-3 w-3" />
                  {t('camera.autoCrop')}
                </Label>
              </div>
              
              {flashSupported && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="flash"
                    checked={flashOn}
                    onCheckedChange={toggleFlash}
                  />
                  <Label htmlFor="flash" className="flex items-center gap-1 text-xs">
                    <Flashlight className="h-3 w-3" />
                    {t('camera.flash')}
                  </Label>
                </div>
              )}
            </div>
            
            <div className="relative flex-1 bg-black rounded-lg overflow-hidden min-h-[300px]">
              {/* Flash overlay animation */}
              <div 
                className={cn(
                  "absolute inset-0 bg-white z-20 pointer-events-none transition-opacity duration-100",
                  isFlashing ? "opacity-80" : "opacity-0"
                )}
              />
              
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
                  
                  {/* Receipt guide overlay */}
                  <div className={cn(
                    "absolute inset-8 border-2 border-dashed rounded-lg pointer-events-none transition-colors",
                    autoScanEnabled && scanStatus === 'detecting' ? "border-warning" :
                    autoScanEnabled && scanStatus === 'stabilizing' ? "border-primary" :
                    autoScanEnabled && scanStatus === 'capturing' ? "border-success" :
                    "border-white/30"
                  )} />
                  
                  {/* Auto-scan status overlay */}
                  {autoScanEnabled && (
                    <div className="absolute top-4 left-4 right-4 space-y-2">
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur text-sm",
                        getScanStatusColor(),
                        "text-foreground"
                      )}>
                        <ScanLine className={cn(
                          "h-4 w-4",
                          scanStatus !== 'waiting' && "animate-pulse"
                        )} />
                        <span>{getScanStatusText()}</span>
                        
                        {/* Pause/Resume button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setAutoScanPaused(!autoScanPaused)}
                          className="ml-auto h-6 w-6"
                        >
                          {autoScanPaused ? (
                            <Play className="h-3 w-3" />
                          ) : (
                            <Pause className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      
                      {scanStatus === 'stabilizing' && (
                        <Progress value={stabilityProgress} className="h-1" />
                      )}
                    </div>
                  )}
                  
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
                      onClick={capturePhoto}
                      disabled={!cameraActive}
                      className={cn(
                        "rounded-full h-16 w-16 shadow-lg active:scale-95 transition-all",
                        autoScanEnabled 
                          ? "bg-secondary hover:bg-secondary/90" 
                          : "bg-primary hover:bg-primary/90"
                      )}
                    >
                      <Camera className="h-8 w-8" />
                    </Button>
                    
                    {flashSupported ? (
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={toggleFlash}
                        className={cn(
                          "rounded-full h-12 w-12 backdrop-blur",
                          flashOn ? "bg-warning text-warning-foreground" : "bg-background/80"
                        )}
                      >
                        <Flashlight className="h-5 w-5" />
                      </Button>
                    ) : (
                      <div className="w-12" />
                    )}
                  </div>

                  {/* Photo count badge */}
                  {photos.length > 0 && (
                    <Badge 
                      className="absolute bottom-4 right-4 bg-primary text-primary-foreground"
                    >
                      <ImagePlus className="h-3 w-3 mr-1" />
                      {photos.length}
                    </Badge>
                  )}
                </>
              )}
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
            <canvas ref={detectionCanvasRef} className="hidden" />
          </div>

          {/* Captured Photos Panel */}
          <div className="w-full md:w-64 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" />
                {t('scanHistory.captured')} ({photos.length})
              </h3>
              {photos.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setPhotos([])}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t('common.delete')}
                </Button>
              )}
            </div>

            <ScrollArea className="flex-1 min-h-[150px] md:min-h-0">
              {photos.length === 0 ? (
                <Card className="border-dashed p-4 text-center text-muted-foreground">
                  <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {t('camera.startCapturing')}
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
                  {t('camera.processing')}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t('camera.processPhotos')} ({photos.length})
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
