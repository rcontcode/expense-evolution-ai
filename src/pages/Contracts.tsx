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
import { useFeatureAccess } from '@/hooks/data/useFeatureAccess';
import { PageContextGuide, PAGE_GUIDES } from '@/components/guidance/PageContextGuide';
import { SectionEmptyState } from '@/components/guidance/SectionEmptyState';
import { MentorQuoteBanner } from '@/components/MentorQuoteBanner';
import { PageHeader } from '@/components/PageHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { ContractRenewalCountdown } from '@/components/contracts/ContractRenewalCountdown';
import { supabase } from '@/integrations/supabase/client';
import { ContractWithClient, ContractGroup, groupContracts } from '@/types/contract.types';
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
  const contractAccess = useFeatureAccess('contract_analysis');

  const openContractDialog = () => {
    if (!contractAccess.allowed) {
      contractAccess.openUpgrade();
      return;
    }
    setDialogOpen(true);
  };

  const contractGroups = contracts ? groupContracts(contracts) : [];

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
      <div className="page-container section-gap">
        <PageHeader
          title={t('nav.contracts')}
          description={!isMobile ? t('contracts.description') : undefined}
        >
          <Button data-highlight="upload-contract-button" onClick={openContractDialog} size={isMobile ? 'sm' : 'default'}>
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
                { icon: Plus, title: { es: 'Subir Contrato', en: 'Upload Contract' }, description: { es: 'PDF o imagen', en: 'PDF or image' }, action: openContractDialog },
                { icon: Eye, title: { es: 'Ver Términos', en: 'View Terms' }, description: { es: 'Extraídos Smart', en: 'Smart extracted' }, path: '/files' },
                { icon: Users, title: { es: 'Ver Clientes', en: 'View Clients' }, description: { es: 'Vincular contratos', en: 'Link contracts' }, path: '/clients' },
                { icon: FileText, title: { es: 'Agregar Notas', en: 'Add Notes' }, description: { es: 'Acuerdos manuales', en: 'Manual agreements' }, action: openContractDialog }
              ]}
            />
          </>
        )}

        {typeof contractAccess.limit === 'number' && contractAccess.limit !== Infinity && contractAccess.limit > 0 && (
          <p className="text-xs text-muted-foreground -mt-2">
            {t('common.usage') || 'Uso'}: {contractAccess.currentUsage ?? 0}/{contractAccess.limit} {t('common.thisMonth') || 'este mes'}
            {!contractAccess.allowed && contractAccess.reason === 'quota' && (
              <button onClick={contractAccess.openUpgrade} className="ml-2 underline text-primary">
                {t('common.upgrade') || 'Mejorar plan'}
              </button>
            )}
          </p>
        )}

        {/* Contract Renewal Countdown */}
        <ContractRenewalCountdown />

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        ) : contractGroups.length > 0 ? (
          <div data-highlight="contracts-table">
            {isMobile ? (
              <div className="space-y-3">
                {contractGroups.map((group) => (
                  <ContractCard
                    key={group.primary.id}
                    contract={group.primary}
                    pageCount={group.pageCount}
                    onView={setSelectedContract}
                    onDownload={handleDownload}
                    onDelete={setDeleteId}
                  />
                ))}
              </div>
            ) : (
              <ContractsTable contractGroups={contractGroups} />
            )}
          </div>
        ) : (
          <SectionEmptyState 
            section="contracts" 
            onAction={openContractDialog}
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
