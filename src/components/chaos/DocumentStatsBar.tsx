import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, Receipt, Building2, Landmark, Award, Shield, 
  Upload, CheckCircle2, Clock, BookOpen
} from 'lucide-react';

const STORAGE_KEY = 'doc-onboarding-checklist';

interface DocumentStatsBarProps {
  onActivateChecklist?: () => void;
  checklistVisible?: boolean;
}

export function DocumentStatsBar({ onActivateChecklist, checklistVisible }: DocumentStatsBarProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isEs = language === 'es';

  const { data: stats } = useQuery({
    queryKey: ['doc-stats-bar', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [docsRes, contractsRes] = await Promise.all([
        supabase
          .from('documents')
          .select('id, status, extracted_data')
          .eq('user_id', user!.id),
        supabase
          .from('contracts')
          .select('id, contract_type, status')
          .eq('user_id', user!.id)
          .is('deleted_at', null),
      ]);

      const docs = docsRes.data ?? [];
      const contracts = contractsRes.data ?? [];

      const totalUploaded = docs.length + contracts.length;
      const processed = docs.filter(d => d.status === 'classified' || d.status === 'processed').length + contracts.length;
      const pending = docs.filter(d => d.status === 'pending').length;

      // Categorize documents by extracted type
      const typeCounts: Record<string, number> = {};
      docs.forEach(d => {
        const ed = d.extracted_data as any;
        const docType = ed?.document_type || ed?.category || 'receipt';
        const key = String(docType).toLowerCase();
        typeCounts[key] = (typeCounts[key] || 0) + 1;
      });
      if (contracts.length > 0) {
        typeCounts['contract'] = (typeCounts['contract'] || 0) + contracts.length;
      }

      return { totalUploaded, processed, pending, typeCounts };
    },
    refetchInterval: 30000,
  });

  if (!stats || stats.totalUploaded === 0) return null;

  const typeConfig: Record<string, { icon: React.ElementType; labelEs: string; labelEn: string }> = {
    receipt: { icon: Receipt, labelEs: 'Boletas', labelEn: 'Receipts' },
    invoice: { icon: FileText, labelEs: 'Facturas', labelEn: 'Invoices' },
    contract: { icon: Building2, labelEs: 'Contratos', labelEn: 'Contracts' },
    bank_statement: { icon: Landmark, labelEs: 'Bancarios', labelEn: 'Bank' },
    certificate: { icon: Award, labelEs: 'Certificados', labelEn: 'Certificates' },
    insurance: { icon: Shield, labelEs: 'Seguros', labelEn: 'Insurance' },
  };

  const typeEntries = Object.entries(stats.typeCounts).filter(([, count]) => count > 0);

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-muted/30">
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <Upload className="h-4 w-4 text-muted-foreground" />
        <span>{stats.totalUploaded}</span>
        <span className="text-muted-foreground text-xs">{isEs ? 'subidos' : 'uploaded'}</span>
      </div>

      <span className="text-muted-foreground">·</span>

      <div className="flex items-center gap-1.5 text-sm font-medium">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <span>{stats.processed}</span>
        <span className="text-muted-foreground text-xs">{isEs ? 'procesados' : 'processed'}</span>
      </div>

      {stats.pending > 0 && (
        <>
          <span className="text-muted-foreground">·</span>
          <div className="flex items-center gap-1.5 text-sm font-medium text-warning">
            <Clock className="h-4 w-4" />
            <span>{stats.pending}</span>
            <span className="text-xs">{isEs ? 'pendientes' : 'pending'}</span>
          </div>
        </>
      )}

      {typeEntries.length > 0 && (
        <>
          <span className="text-muted-foreground hidden sm:inline">│</span>
          <div className="flex flex-wrap gap-1.5">
            {typeEntries.map(([type, count]) => {
              const config = typeConfig[type] || { icon: FileText, labelEs: type, labelEn: type };
              const Icon = config.icon;
              return (
                <Badge key={type} variant="outline" className="gap-1 text-xs font-normal">
                  <Icon className="h-3 w-3" />
                  {count} {isEs ? config.labelEs : config.labelEn}
                </Badge>
              );
            })}
          </div>
        </>
      )}

      {!checklistVisible && onActivateChecklist && (
        <>
          <span className="text-muted-foreground hidden sm:inline">│</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-primary"
            onClick={onActivateChecklist}
          >
            <BookOpen className="h-3 w-3" />
            {isEs ? 'Activar guía' : 'Activate guide'}
          </Button>
        </>
      )}
    </div>
  );
}
