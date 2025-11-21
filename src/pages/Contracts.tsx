import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus } from 'lucide-react';
import { ContractDialog } from '@/components/dialogs/ContractDialog';
import { ContractsTable } from '@/components/tables/ContractsTable';
import { useContracts } from '@/hooks/data/useContracts';

export default function Contracts() {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: contracts, isLoading } = useContracts();

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('nav.contracts')}</h1>
            <p className="text-muted-foreground mt-2">{t('contracts.description')}</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('contracts.uploadContract')}
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        ) : (
          <ContractsTable contracts={contracts || []} />
        )}
      </div>

      <ContractDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Layout>
  );
}