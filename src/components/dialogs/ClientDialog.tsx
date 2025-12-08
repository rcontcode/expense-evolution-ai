import { useState } from 'react';
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
import { FlaskConical } from 'lucide-react';
import { ClientProjectsSection } from '@/components/clients/ClientProjectsSection';
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

interface ClientDialogProps {
  open: boolean;
  onClose: () => void;
  client?: Client;
}

export function ClientDialog({ open, onClose, client }: ClientDialogProps) {
  const { t } = useLanguage();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteTestDataMutation = useDeleteClientTestData();
  const [showDeleteTestData, setShowDeleteTestData] = useState(false);

  const { data: expenses } = useExpenses();
  const { data: income } = useIncome();
  const { data: mileage } = useMileage();
  const { data: contracts } = useContracts();

  // Check if client has test data
  const hasTestData = client ? (
    expenses?.some(exp => exp.client_id === client.id) ||
    income?.some(inc => inc.client_id === client.id) ||
    mileage?.some(mil => mil.client_id === client.id) ||
    contracts?.some(con => con.client_id === client.id)
  ) : false;

  const handleSubmit = (data: ClientFormValues) => {
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

  const handleDeleteTestData = () => {
    if (client) {
      deleteTestDataMutation.mutate(client.id, {
        onSuccess: () => setShowDeleteTestData(false)
      });
    }
  };

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

      <AlertDialog open={showDeleteTestData} onOpenChange={setShowDeleteTestData}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('clients.deleteTestDataConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('clients.deleteTestDataWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTestData} 
              className="bg-amber-600 hover:bg-amber-700"
            >
              {t('clients.deleteTestData')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
