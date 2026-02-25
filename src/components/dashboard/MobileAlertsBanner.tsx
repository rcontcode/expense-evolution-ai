import { useState, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertStack } from '@/components/mobile/AlertStack';

interface MobileAlertsBannerProps {
  pendingDocuments: number;
  incompleteExpenses: number;
}

export const MobileAlertsBanner = memo(({ pendingDocuments, incompleteExpenses }: MobileAlertsBannerProps) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const alerts = useMemo(() => {
    const items: Array<{ id: string; content: React.ReactNode; type: 'info' | 'warning' | 'success'; dismissible: boolean }> = [];

    if (pendingDocuments > 0 && !dismissedAlerts.includes('pending-docs')) {
      items.push({
        id: 'pending-docs',
        content: (
          <span className="flex items-center gap-2" onClick={() => navigate('/chaos')}>
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {pendingDocuments} {language === 'es' ? 'documentos pendientes' : 'pending documents'}
            </span>
          </span>
        ),
        type: 'warning',
        dismissible: true,
      });
    }

    if (incompleteExpenses > 0 && !dismissedAlerts.includes('incomplete-expenses')) {
      items.push({
        id: 'incomplete-expenses',
        content: (
          <span className="flex items-center gap-2" onClick={() => navigate('/expenses')}>
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {incompleteExpenses} {language === 'es' ? 'gastos incompletos' : 'incomplete expenses'}
            </span>
          </span>
        ),
        type: 'warning',
        dismissible: true,
      });
    }

    return items;
  }, [pendingDocuments, incompleteExpenses, dismissedAlerts, language, navigate]);

  const handleDismissAlert = (id: string) => {
    setDismissedAlerts(prev => [...prev, id]);
  };

  return (
    <AlertStack
      alerts={alerts}
      onDismiss={handleDismissAlert}
      maxVisible={1}
    />
  );
});

MobileAlertsBanner.displayName = 'MobileAlertsBanner';
