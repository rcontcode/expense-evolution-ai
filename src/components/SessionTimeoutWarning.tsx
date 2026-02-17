import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

export function SessionTimeoutWarning() {
  const { showWarning, secondsLeft, extendSession } = useSessionTimeout();
  const { language } = useLanguage();

  return (
    <AlertDialog open={showWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Sesión por expirar' : 'Session expiring'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {language === 'es'
              ? `Tu sesión se cerrará automáticamente en ${secondsLeft} segundos por inactividad.`
              : `Your session will automatically close in ${secondsLeft} seconds due to inactivity.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={extendSession}>
            {language === 'es' ? 'Seguir conectado' : 'Stay connected'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
