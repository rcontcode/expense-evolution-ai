import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ContractForm } from '@/components/forms/ContractForm';
import { useCreateContract } from '@/hooks/data/useContracts';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ContractFormSchema } from '@/lib/validations/contract.schema';

interface ContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContractDialog({ open, onOpenChange }: ContractDialogProps) {
  const { t } = useLanguage();
  const createContract = useCreateContract();

  const handleSubmit = async (data: ContractFormSchema) => {
    await createContract.mutateAsync({
      file: data.file,
      client_id: data.client_id,
      title: data.title || undefined,
      contract_type: data.contract_type || undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      auto_renew: data.auto_renew,
      renewal_notice_days: data.renewal_notice_days || undefined,
      value: data.value || undefined,
      description: data.description || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('contracts.uploadContract')}</DialogTitle>
        </DialogHeader>
        <ContractForm onSubmit={handleSubmit} isSubmitting={createContract.isPending} />
      </DialogContent>
    </Dialog>
  );
}
