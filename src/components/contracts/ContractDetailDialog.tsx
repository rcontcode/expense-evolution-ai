import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { useContractUrl } from '@/hooks/data/useContracts';
import { ContractWithClient } from '@/types/contract.types';
import { ContractTermsViewer } from './ContractTermsViewer';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { FileText, Calendar, Building2, DollarSign, Loader2 } from 'lucide-react';

interface ContractDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: ContractWithClient;
  onContractUpdate: () => void;
}

export function ContractDetailDialog({ 
  open, 
  onOpenChange, 
  contract,
  onContractUpdate 
}: ContractDetailDialogProps) {
  const { t, language } = useLanguage();
  const { data: previewUrl, isLoading: loadingUrl } = useContractUrl(contract.file_path);
  const locale = language === 'es' ? es : enUS;

  // Parse extracted_terms safely
  const extractedTerms = typeof contract.extracted_terms === 'object' 
    ? contract.extracted_terms 
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {contract.title || contract.file_name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Document Preview */}
          <div className="flex flex-col h-full min-h-[400px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {language === 'es' ? 'Documento' : 'Document'}
              </span>
              <Badge variant="outline">{contract.file_name}</Badge>
            </div>
            <div className="flex-1 bg-muted rounded-lg overflow-hidden">
              {loadingUrl ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : previewUrl ? (
                contract.file_type?.includes('pdf') ? (
                  <iframe src={previewUrl} className="w-full h-full" />
                ) : (
                  <img 
                    src={previewUrl} 
                    alt={contract.file_name}
                    className="w-full h-full object-contain"
                  />
                )
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {language === 'es' ? 'No se pudo cargar el documento' : 'Could not load document'}
                </div>
              )}
            </div>
          </div>

          {/* Right: Contract Details & Terms */}
          <ScrollArea className="h-full max-h-[70vh]">
            <div className="space-y-4 pr-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-3">
                {contract.client && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Building2 className="h-4 w-4" />
                      {language === 'es' ? 'Cliente' : 'Client'}
                    </div>
                    <p className="font-medium">{contract.client.name}</p>
                  </div>
                )}
                {contract.value && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <DollarSign className="h-4 w-4" />
                      {language === 'es' ? 'Valor' : 'Value'}
                    </div>
                    <p className="font-medium">${contract.value.toLocaleString()}</p>
                  </div>
                )}
                {contract.start_date && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      {language === 'es' ? 'Inicio' : 'Start'}
                    </div>
                    <p className="font-medium">
                      {format(new Date(contract.start_date), 'dd MMM yyyy', { locale })}
                    </p>
                  </div>
                )}
                {contract.end_date && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      {language === 'es' ? 'Fin' : 'End'}
                    </div>
                    <p className="font-medium">
                      {format(new Date(contract.end_date), 'dd MMM yyyy', { locale })}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              {contract.description && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    {language === 'es' ? 'Descripción' : 'Description'}
                  </p>
                  <p className="text-sm">{contract.description}</p>
                </div>
              )}

              {/* Contract Terms Viewer */}
              <ContractTermsViewer
                contractId={contract.id}
                filePath={contract.file_path}
                fileType={contract.file_type}
                title={contract.title}
                extractedTerms={extractedTerms as any}
                userNotes={contract.user_notes as string | null}
                aiProcessedAt={contract.ai_processed_at as string | null}
                onUpdate={onContractUpdate}
              />
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
