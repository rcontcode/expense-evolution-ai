import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, FileText, Users, Eye } from 'lucide-react';
import { ContractDialog } from '@/components/dialogs/ContractDialog';
import { ContractsTable } from '@/components/tables/ContractsTable';
import { useContracts } from '@/hooks/data/useContracts';
import { PageContextGuide, PAGE_GUIDES } from '@/components/guidance/PageContextGuide';
import { MentorQuoteBanner } from '@/components/MentorQuoteBanner';

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

        <MentorQuoteBanner context="clients" className="mb-2" />

        {/* Contextual Page Guide */}
        <PageContextGuide
          {...PAGE_GUIDES.contracts}
          actions={[
            { icon: Plus, title: { es: 'Subir Contrato', en: 'Upload Contract' }, description: { es: 'PDF o imagen', en: 'PDF or image' }, action: () => setDialogOpen(true) },
            { icon: Eye, title: { es: 'Ver Términos', en: 'View Terms' }, description: { es: 'Extraídos por IA', en: 'AI extracted' }, action: () => {} },
            { icon: Users, title: { es: 'Ver Clientes', en: 'View Clients' }, description: { es: 'Vincular contratos', en: 'Link contracts' }, path: '/clients' },
            { icon: FileText, title: { es: 'Agregar Notas', en: 'Add Notes' }, description: { es: 'Acuerdos manuales', en: 'Manual agreements' }, action: () => {} }
          ]}
        />

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
