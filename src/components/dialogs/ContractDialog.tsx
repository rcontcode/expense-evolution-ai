import { ContractForm } from '@/components/forms/ContractForm';
import { useCreateContract } from '@/hooks/data/useContracts';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ContractFormSchema } from '@/lib/validations/contract.schema';
import { FullScreenDialog } from '@/components/mobile/FullScreenDialog';

interface ContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContractDialog({ open, onOpenChange }: ContractDialogProps) {
  const { t } = useLanguage();
  const createContract = useCreateContract();

  const handleSubmit = async (data: ContractFormSchema) => {
    await createContract.mutateAsync({
      files: data.files || [],
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
    <FullScreenDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('contracts.uploadContract')}
    >
      <ContractForm onSubmit={handleSubmit} isSubmitting={createContract.isPending} />
    </FullScreenDialog>
  );
}
