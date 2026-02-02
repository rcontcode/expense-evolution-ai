import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, FileText, Users, Eye } from 'lucide-react';
import { ContractDialog } from '@/components/dialogs/ContractDialog';
import { ContractsTable } from '@/components/tables/ContractsTable';
import { ContractCard } from '@/components/contracts/ContractCard';
import { ContractDetailDialog } from '@/components/contracts/ContractDetailDialog';
import { useContracts, useDeleteContract } from '@/hooks/data/useContracts';
import { PageContextGuide, PAGE_GUIDES } from '@/components/guidance/PageContextGuide';
import { SectionEmptyState } from '@/components/guidance/SectionEmptyState';
import { MentorQuoteBanner } from '@/components/MentorQuoteBanner';
import { PageHeader } from '@/components/PageHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { ContractWithClient } from '@/types/contract.types';
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

export default function Contracts() {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<ContractWithClient | null>(null);
  const { data: contracts, isLoading, refetch } = useContracts();
  const deleteContract = useDeleteContract();

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data } = await supabase.storage
      .from('contracts')
      .createSignedUrl(filePath, 3600);
    if (data?.signedUrl) {
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = fileName;
      link.click();
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteContract.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleContractUpdate = () => {
    refetch();
    setSelectedContract(null);
  };

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-4 sm:space-y-8">
        <PageHeader
          title={t('nav.contracts')}
          description={!isMobile ? t('contracts.description') : undefined}
        >
          <Button data-highlight="upload-contract-button" onClick={() => setDialogOpen(true)} size={isMobile ? 'sm' : 'default'}>
            <Plus className="mr-2 h-4 w-4" />
            {isMobile ? t('common.upload') : t('contracts.uploadContract')}
          </Button>
        </PageHeader>

        {!isMobile && (
          <>
            <MentorQuoteBanner context="clients" className="mb-2" />
            <PageContextGuide
              {...PAGE_GUIDES.contracts}
              actions={[
                { icon: Plus, title: { es: 'Subir Contrato', en: 'Upload Contract' }, description: { es: 'PDF o imagen', en: 'PDF or image' }, action: () => setDialogOpen(true) },
                { icon: Eye, title: { es: 'Ver Términos', en: 'View Terms' }, description: { es: 'Extraídos Smart', en: 'Smart extracted' }, action: () => {} },
                { icon: Users, title: { es: 'Ver Clientes', en: 'View Clients' }, description: { es: 'Vincular contratos', en: 'Link contracts' }, path: '/clients' },
                { icon: FileText, title: { es: 'Agregar Notas', en: 'Add Notes' }, description: { es: 'Acuerdos manuales', en: 'Manual agreements' }, action: () => {} }
              ]}
            />
          </>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        ) : contracts && contracts.length > 0 ? (
          <div data-highlight="contracts-table">
            {isMobile ? (
              <div className="space-y-3">
                {contracts.map((contract) => (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    onView={setSelectedContract}
                    onDownload={handleDownload}
                    onDelete={setDeleteId}
                  />
                ))}
              </div>
            ) : (
              <ContractsTable contracts={contracts} />
            )}
          </div>
        ) : (
          <SectionEmptyState 
            section="contracts" 
            onAction={() => setDialogOpen(true)}
            showSampleDataButton={true}
          />
        )}
      </div>

      <ContractDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      
      {selectedContract && (
        <ContractDetailDialog
          open={!!selectedContract}
          onOpenChange={(open) => !open && setSelectedContract(null)}
          contract={selectedContract}
          onContractUpdate={handleContractUpdate}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('contracts.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('contracts.deleteWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
