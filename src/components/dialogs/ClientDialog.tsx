import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClientForm } from '@/components/forms/ClientForm';
import { ClientFormValues } from '@/lib/validations/client.schema';
import { useCreateClient, useUpdateClient, useDeleteClientTestData } from '@/hooks/data/useClients';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useMileage } from '@/hooks/data/useMileage';
import { useContracts } from '@/hooks/data/useContracts';
import { Client } from '@/types/expense.types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { FlaskConical, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { ClientProjectsSection } from '@/components/clients/ClientProjectsSection';
import confetti from 'canvas-confetti';
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
import { usePlanLimits } from '@/hooks/data/usePlanLimits';
import { UpgradePrompt } from '@/components/UpgradePrompt';

interface ClientDialogProps {
  open: boolean;
  onClose: () => void;
  client?: Client;
}

type DeleteStep = 'idle' | 'deleting' | 'success';

export function ClientDialog({ open, onClose, client }: ClientDialogProps) {
  const { t } = useLanguage();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteTestDataMutation = useDeleteClientTestData();
  const [showDeleteTestData, setShowDeleteTestData] = useState(false);
  const [deleteStep, setDeleteStep] = useState<DeleteStep>('idle');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const { canAddClient, planType, clientCount, limits, getUpgradePlan } = usePlanLimits();
  const isEditing = !!client;

  // Check limit on open
  useEffect(() => {
    if (open && !isEditing && !canAddClient()) {
      setShowUpgradePrompt(true);
    }
  }, [open, isEditing, canAddClient]);

  const triggerSuccessConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0']
    });
  };

  const { data: expenses } = useExpenses();
  const { data: income } = useIncome();
  const { data: mileage } = useMileage();
  const { data: contracts } = useContracts();

  const hasTestData = client ? (
    expenses?.some(exp => exp.client_id === client.id) ||
    income?.some(inc => inc.client_id === client.id) ||
    mileage?.some(mil => mil.client_id === client.id) ||
    contracts?.some(con => con.client_id === client.id)
  ) : false;

  const handleSubmit = (data: ClientFormValues) => {
    if (!isEditing && !canAddClient()) {
      setShowUpgradePrompt(true);
      return;
    }

    const clientData = {
      name: data.name,
      country: data.country || 'Canada',
      province: data.province || null,
      notes: data.notes || null,
      industry: data.industry || null,
      client_type: data.client_type || 'private',
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      payment_terms: data.payment_terms || 30,
      currency: data.currency || 'CAD',
      tax_id: data.tax_id || null,
      website: data.website || null,
      entity_id: data.entity_id || null,
    };

    if (client) {
      updateMutation.mutate(
        { id: client.id, updates: clientData },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(clientData, { onSuccess: onClose });
    }
  };

  const handleDeleteTestData = (e: React.MouseEvent) => {
    e.preventDefault();
    if (client && deleteStep === 'idle') {
      setDeleteStep('deleting');
      deleteTestDataMutation.mutate(client.id, {
        onSuccess: () => {
          setDeleteStep('success');
          triggerSuccessConfetti();
          setTimeout(() => {
            setDeleteStep('idle');
            setShowDeleteTestData(false);
          }, 1500);
        },
        onError: () => {
          setDeleteStep('idle');
        }
      });
    }
  };

  // Reset delete step when dialog closes
  useEffect(() => {
    if (!showDeleteTestData) {
      setDeleteStep('idle');
    }
  }, [showDeleteTestData]);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{client ? 'Edit Client' : 'Create New Client'}</DialogTitle>
          </DialogHeader>
          
          {client && hasTestData && (
            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <FlaskConical className="h-4 w-4" />
                <span className="text-sm">{t('clients.hasTestData')}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
                onClick={() => setShowDeleteTestData(true)}
              >
                {t('clients.deleteTestData')}
              </Button>
            </div>
          )}
          
          <ClientForm
            client={client}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />

          {/* Projects Section - only show when editing */}
          {client && (
            <ClientProjectsSection clientId={client.id} />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteTestData} onOpenChange={(open) => {
        if (!open && deleteStep === 'idle') setShowDeleteTestData(false);
      }}>
        <AlertDialogContent>
          {deleteStep === 'success' ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-in zoom-in-50 duration-300">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                <p className="text-lg font-semibold text-green-700 dark:text-green-400">
                  ¡Datos eliminados!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Todos los datos de prueba han sido eliminados exitosamente
                </p>
              </div>
            </div>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('clients.deleteTestDataConfirm')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('clients.deleteTestDataWarning')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteStep === 'deleting'}>
                  {t('common.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteTestData} 
                  className="bg-amber-600 hover:bg-amber-700"
                  disabled={deleteStep === 'deleting'}
                >
                  {deleteStep === 'deleting' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    t('clients.deleteTestData')
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => { setShowUpgradePrompt(false); if (!isEditing) onClose(); }}
        feature="clients"
        currentPlan={planType}
        requiredPlan={getUpgradePlan() || undefined}
        usageType="clients"
        currentUsage={clientCount}
        limit={limits.clients === Infinity ? 0 : limits.clients}
      />
    </>
  );
}
