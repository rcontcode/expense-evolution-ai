import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { useContractUrl, useContractGroup } from '@/hooks/data/useContracts';
import { ContractWithClient } from '@/types/contract.types';
import { ContractTermsViewer } from './ContractTermsViewer';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { FileText, Calendar, Building2, DollarSign, Loader2, ChevronLeft, ChevronRight, Files } from 'lucide-react';
import { FullScreenDialog } from '@/components/mobile/FullScreenDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

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
  onContractUpdate,
}: ContractDetailDialogProps) {
  const { language } = useLanguage();
  const locale = language === 'es' ? es : enUS;
  const isMobile = useIsMobile();

  // Multi-page support
  const { data: groupPages } = useContractGroup(contract.group_id);
  const pages = groupPages && groupPages.length > 1 ? groupPages : [contract];
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const currentPage = pages[currentPageIndex] || contract;

  const { data: previewUrl, isLoading: loadingUrl } = useContractUrl(currentPage.file_path);

  const extractedTerms =
    typeof contract.extracted_terms === 'object' ? contract.extracted_terms : null;

  const totalPages = pages.length;
  const isMultiPage = totalPages > 1;

  const previewPanel = (
    <ContractPreviewPanel
      currentPage={currentPage}
      pages={pages}
      currentPageIndex={currentPageIndex}
      setCurrentPageIndex={setCurrentPageIndex}
      isMultiPage={isMultiPage}
      totalPages={totalPages}
      previewUrl={previewUrl ?? null}
      loadingUrl={loadingUrl}
      language={language}
    />
  );

  const termsPanel = (
    <ContractTermsPanel
      contract={contract}
      extractedTerms={extractedTerms}
      language={language}
      locale={locale}
      onContractUpdate={onContractUpdate}
      isMobile={isMobile}
    />
  );

  return (
    <FullScreenDialog
      open={open}
      onOpenChange={onOpenChange}
      title={contract.title || contract.file_name}
      description={contract.client?.name}
      size="xl"
      resizable
    >
      {isMobile ? (
        <div className="space-y-4">
          {previewPanel}
          {termsPanel}
        </div>
      ) : (
        <ResizablePanelGroup direction="horizontal" className="min-h-[70vh] gap-2">
          <ResizablePanel defaultSize={55} minSize={25}>
            {previewPanel}
          </ResizablePanel>
          <ResizableHandle withHandle className="mx-1" />
          <ResizablePanel defaultSize={45} minSize={25}>
            {termsPanel}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </FullScreenDialog>
  );
}

// ─── Preview Panel ───────────────────────────────────────────────
interface PreviewPanelProps {
  currentPage: ContractWithClient;
  pages: ContractWithClient[];
  currentPageIndex: number;
  setCurrentPageIndex: (updater: (i: number) => number) => void;
  isMultiPage: boolean;
  totalPages: number;
  previewUrl: string | null;
  loadingUrl: boolean;
  language: string;
}

function ContractPreviewPanel({
  currentPage,
  pages,
  currentPageIndex,
  setCurrentPageIndex,
  isMultiPage,
  totalPages,
  previewUrl,
  loadingUrl,
  language,
}: PreviewPanelProps) {
  return (
    <div className="flex flex-col h-full min-h-[300px] lg:min-h-[60vh] pr-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          {language === 'es' ? 'Documento' : 'Document'}
        </span>
        <div className="flex items-center gap-2">
          {isMultiPage && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Files className="h-3 w-3" />
              {totalPages} {language === 'es' ? 'páginas' : 'pages'}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs max-w-[200px] truncate">
            {currentPage.file_name}
          </Badge>
        </div>
      </div>

      {isMultiPage && (
        <div className="flex items-center justify-between mb-2 p-2 bg-muted/50 rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPageIndex((i) => Math.max(0, i - 1))}
            disabled={currentPageIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {language === 'es' ? 'Anterior' : 'Previous'}
          </Button>
          <span className="text-sm font-medium">
            {language === 'es' ? 'Página' : 'Page'} {currentPageIndex + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPageIndex((i) => Math.min(totalPages - 1, i + 1))}
            disabled={currentPageIndex === totalPages - 1}
          >
            {language === 'es' ? 'Siguiente' : 'Next'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {isMultiPage && (
        <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
          {pages.map((page, index) => (
            <button
              key={page.id}
              onClick={() => setCurrentPageIndex(() => index)}
              className={`shrink-0 w-12 h-12 rounded-md border-2 flex items-center justify-center text-xs font-medium transition-all ${
                index === currentPageIndex
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 bg-muted rounded-lg overflow-hidden min-h-[400px]">
        {loadingUrl ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : previewUrl ? (
          currentPage.file_type?.includes('pdf') ? (
            <iframe src={previewUrl} className="w-full h-full min-h-[400px]" title={currentPage.file_name} />
          ) : (
            <img
              src={previewUrl}
              alt={currentPage.file_name}
              className="w-full h-full object-contain"
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground gap-2">
            <FileText className="h-10 w-10 opacity-50" />
            <p className="text-sm">
              {language === 'es' ? 'No se pudo cargar el documento' : 'Could not load document'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Terms Panel ─────────────────────────────────────────────────
interface TermsPanelProps {
  contract: ContractWithClient;
  extractedTerms: any;
  language: string;
  locale: typeof es | typeof enUS;
  onContractUpdate: () => void;
  isMobile?: boolean;
}

function ContractTermsPanel({
  contract,
  extractedTerms,
  language,
  locale,
  onContractUpdate,
  isMobile,
}: TermsPanelProps) {
  return (
    <ScrollArea className={isMobile ? '' : 'h-full'}>
      <div className="space-y-4 pr-2 lg:pr-4">
        <div className="grid grid-cols-2 gap-3">
          {contract.client && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Building2 className="h-4 w-4" />
                {language === 'es' ? 'Cliente' : 'Client'}
              </div>
              <p className="font-medium text-sm">{contract.client.name}</p>
            </div>
          )}
          {contract.value && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                {language === 'es' ? 'Valor' : 'Value'}
              </div>
              <p className="font-medium text-sm">${contract.value.toLocaleString()}</p>
            </div>
          )}
          {contract.start_date && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                {language === 'es' ? 'Inicio' : 'Start'}
              </div>
              <p className="font-medium text-sm">
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
              <p className="font-medium text-sm">
                {format(new Date(contract.end_date), 'dd MMM yyyy', { locale })}
              </p>
            </div>
          )}
        </div>

        {contract.description && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">
              {language === 'es' ? 'Descripción' : 'Description'}
            </p>
            <p className="text-sm">{contract.description}</p>
          </div>
        )}

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
  );
}
