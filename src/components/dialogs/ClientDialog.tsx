import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClientForm } from '@/components/forms/ClientForm';
import { ClientFormValues } from '@/lib/validations/client.schema';
import { useCreateClient, useUpdateClient } from '@/hooks/data/useClients';
import { Client } from '@/types/expense.types';

interface ClientDialogProps {
  open: boolean;
  onClose: () => void;
  client?: Client;
}

export function ClientDialog({ open, onClose, client }: ClientDialogProps) {
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();

  const handleSubmit = (data: ClientFormValues) => {
    if (client) {
      updateMutation.mutate(
        { id: client.id, updates: data },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(
        { 
          name: data.name, 
          country: data.country || 'Canada',
          province: data.province || null,
          notes: data.notes || null
        }, 
        { onSuccess: onClose }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'Create New Client'}</DialogTitle>
        </DialogHeader>
        <ClientForm
          client={client}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
