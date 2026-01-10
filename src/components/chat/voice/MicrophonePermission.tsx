import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertCircle, Mic, Settings, RefreshCw } from 'lucide-react';

interface MicrophonePermissionProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

export function useMicrophonePermission() {
  const [permission, setPermission] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [isChecking, setIsChecking] = useState(false);

  const checkPermission = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermission('unsupported');
      return 'unsupported';
    }

    setIsChecking(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop all tracks immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      setPermission('granted');
      return 'granted';
    } catch (error) {
      const err = error as DOMException;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermission('denied');
        return 'denied';
      }
      // Other errors (NotFoundError, etc.)
      setPermission('unsupported');
      return 'unsupported';
    } finally {
      setIsChecking(false);
    }
  };

  const requestPermission = async () => {
    return await checkPermission();
  };

  // Check permission status on mount (if available via Permissions API)
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then(result => {
          if (result.state === 'granted') {
            setPermission('granted');
          } else if (result.state === 'denied') {
            setPermission('denied');
          }
          // Listen for changes
          result.onchange = () => {
            if (result.state === 'granted') {
              setPermission('granted');
            } else if (result.state === 'denied') {
              setPermission('denied');
            } else {
              setPermission('prompt');
            }
          };
        })
        .catch(() => {
          // Permissions API not available for microphone, we'll check on first use
        });
    }
  }, []);

  return {
    permission,
    isChecking,
    checkPermission,
    requestPermission,
  };
}

export function MicrophonePermissionAlert({ onPermissionGranted, onPermissionDenied }: MicrophonePermissionProps) {
  const { language } = useLanguage();
  const { permission, isChecking, requestPermission } = useMicrophonePermission();

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      onPermissionGranted?.();
    } else if (result === 'denied') {
      onPermissionDenied?.();
    }
  };

  if (permission === 'granted') {
    return null;
  }

  if (permission === 'unsupported') {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>
          {language === 'es' ? 'Micrófono No Disponible' : 'Microphone Not Available'}
        </AlertTitle>
        <AlertDescription>
          {language === 'es'
            ? 'Tu dispositivo o navegador no soporta el acceso al micrófono. Intenta con otro navegador o dispositivo.'
            : 'Your device or browser does not support microphone access. Try a different browser or device.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (permission === 'denied') {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>
          {language === 'es' ? 'Permiso Denegado' : 'Permission Denied'}
        </AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            {language === 'es'
              ? 'El acceso al micrófono fue denegado. Para usar comandos de voz:'
              : 'Microphone access was denied. To use voice commands:'}
          </p>
          <ol className="list-decimal list-inside text-xs space-y-1">
            <li>
              {language === 'es'
                ? 'Haz clic en el icono de candado/información en la barra de direcciones'
                : 'Click the lock/info icon in the address bar'}
            </li>
            <li>
              {language === 'es'
                ? 'Busca "Micrófono" y cámbialo a "Permitir"'
                : 'Find "Microphone" and change it to "Allow"'}
            </li>
            <li>
              {language === 'es' ? 'Recarga la página' : 'Reload the page'}
            </li>
          </ol>
          <Button size="sm" variant="outline" onClick={() => window.location.reload()} className="mt-2">
            <RefreshCw className="h-3 w-3 mr-1" />
            {language === 'es' ? 'Recargar' : 'Reload'}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // permission === 'prompt'
  return (
    <Alert className="mb-4 border-primary/50 bg-primary/5">
      <Mic className="h-4 w-4 text-primary" />
      <AlertTitle>
        {language === 'es' ? 'Habilitar Micrófono' : 'Enable Microphone'}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          {language === 'es'
            ? 'Para usar comandos de voz, necesitamos acceso a tu micrófono.'
            : 'To use voice commands, we need access to your microphone.'}
        </p>
        <Button size="sm" onClick={handleRequestPermission} disabled={isChecking}>
          <Mic className="h-3 w-3 mr-1" />
          {isChecking
            ? (language === 'es' ? 'Verificando...' : 'Checking...')
            : (language === 'es' ? 'Permitir Micrófono' : 'Allow Microphone')}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
