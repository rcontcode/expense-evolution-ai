import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCcw, Upload, Monitor } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface WebcamCaptureProps {
  onCapture: (file: File, previewUrl: string) => void;
  onFallbackToFile: () => void;
}

export function WebcamCapture({ onCapture, onFallbackToFile }: WebcamCaptureProps) {
  const { language } = useLanguage();
  const l = language === 'es';
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'checking' | 'active' | 'no-camera' | 'denied'>('checking');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraState('checking');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraState('active');
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('denied');
      } else {
        setCameraState('no-camera');
      }
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [startCamera]);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopStream();
  }, [stopStream]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (!capturedImage) return;
    // Convert dataURL to File
    const arr = capturedImage.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    const file = new File([u8arr], `webcam-${Date.now()}.jpg`, { type: mime });
    onCapture(file, capturedImage);
  }, [capturedImage, onCapture]);

  // No camera or denied states
  if (cameraState === 'no-camera' || cameraState === 'denied') {
    return (
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center space-y-4">
        <div className="p-3 rounded-full bg-muted inline-flex">
          <Monitor className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {cameraState === 'denied'
              ? (l ? 'Permiso de cámara denegado' : 'Camera permission denied')
              : (l ? 'No se detectó cámara web' : 'No webcam detected')}
          </p>
          <p className="text-xs text-muted-foreground">
            {l
              ? 'Puedes subir un archivo o usar tu celular desde la app'
              : 'You can upload a file or use your phone from the app'}
          </p>
        </div>
        <Button variant="outline" onClick={onFallbackToFile} className="gap-2">
          <Upload className="h-4 w-4" />
          {l ? 'Subir archivo' : 'Upload file'}
        </Button>
      </div>
    );
  }

  // Captured image - confirm or retake
  if (capturedImage) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-lg overflow-hidden border-2 border-primary/30">
          <img src={capturedImage} alt="Captured" className="w-full max-h-64 object-contain bg-black" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={retake} className="flex-1 gap-1.5">
            <RotateCcw className="h-4 w-4" />
            {l ? 'Repetir' : 'Retake'}
          </Button>
          <Button onClick={confirmPhoto} className="flex-1 gap-1.5">
            <Camera className="h-4 w-4" />
            {l ? 'Usar foto' : 'Use photo'}
          </Button>
        </div>
      </div>
    );
  }

  // Active camera view
  return (
    <div className="space-y-3">
      <div className="relative rounded-lg overflow-hidden bg-black border-2 border-primary/20">
        {cameraState === 'checking' && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <p className="text-sm text-muted-foreground animate-pulse">
              {l ? 'Iniciando cámara...' : 'Starting camera...'}
            </p>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn("w-full max-h-64 object-contain", cameraState !== 'active' && "invisible")}
        />
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onFallbackToFile} className="gap-1.5">
          <Upload className="h-4 w-4" />
          {l ? 'Subir archivo' : 'Upload file'}
        </Button>
        <Button
          onClick={takePhoto}
          disabled={cameraState !== 'active'}
          className="flex-1 gap-1.5"
        >
          <Camera className="h-4 w-4" />
          {l ? 'Tomar foto' : 'Take photo'}
        </Button>
      </div>
    </div>
  );
}
