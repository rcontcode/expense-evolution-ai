import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  ClassifiedDocument, DocumentClassificationType, TYPE_LABELS, useUnifiedChaosInbox 
} from '@/hooks/data/useUnifiedChaosInbox';
import { 
  Upload, Loader2, CheckCircle2, AlertTriangle, X, Zap, 
  FileText, ArrowRight, RotateCcw, Sparkles, Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const { language } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFiles(files);
  }, [onFiles]);

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer group",
        dragOver 
          ? "border-primary bg-primary/10 scale-[1.01]" 
          : "border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) onFiles(files);
          e.target.value = '';
        }}
      />
      
      <div className="flex flex-col items-center gap-3">
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
          dragOver ? "bg-primary text-primary-foreground" : "bg-muted group-hover:bg-primary/20"
        )}>
          <Upload className="h-7 w-7" />
        </div>
        
        <div>
          <p className="font-semibold text-lg">
            {language === 'es' ? 'Suelta TODO aquí' : 'Drop EVERYTHING here'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {language === 'es' 
              ? 'Recibos, contratos, extractos bancarios, boletas, comprobantes de pago... ¡lo que sea!'
              : 'Receipts, contracts, bank statements, bills, payment proofs... anything!'}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {['🧾', '📄', '🏦', '💡', '💰', '📋'].map((emoji, i) => (
            <span key={i} className="text-xl opacity-60 group-hover:opacity-100 transition-opacity">
              {emoji}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentCard({ 
  doc, 
  onProcess, 
  onRemove, 
  onReclassify 
}: { 
  doc: ClassifiedDocument;
  onProcess: () => void;
  onRemove: () => void;
  onReclassify: (type: DocumentClassificationType) => void;
}) {
  const { language } = useLanguage();
  const classification = doc.classification;
  const typeInfo = classification ? TYPE_LABELS[classification.document_type] : null;

  const statusColors: Record<string, string> = {
    uploading: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    classifying: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    classified: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    processing: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    processed: 'bg-green-500/10 text-green-700 border-green-500/30',
    error: 'bg-destructive/10 text-destructive border-destructive/30',
  };

  const statusLabels: Record<string, { es: string; en: string }> = {
    uploading: { es: 'Subiendo...', en: 'Uploading...' },
    classifying: { es: 'Clasificando con IA...', en: 'AI Classifying...' },
    classified: { es: 'Listo para procesar', en: 'Ready to process' },
    processing: { es: 'Procesando...', en: 'Processing...' },
    processed: { es: 'Completado', en: 'Completed' },
    error: { es: 'Error', en: 'Error' },
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "overflow-hidden transition-all",
        doc.status === 'classified' && "ring-1 ring-primary/30",
        doc.status === 'processed' && "opacity-70"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Type icon */}
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 text-xl">
              {typeInfo?.icon || (doc.status === 'uploading' || doc.status === 'classifying' 
                ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> 
                : '📎')}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm truncate">{doc.fileName}</span>
                <Badge variant="outline" className={cn("text-[10px]", statusColors[doc.status])}>
                  {doc.status === 'classifying' || doc.status === 'processing' 
                    ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> 
                    : doc.status === 'processed' 
                    ? <CheckCircle2 className="h-3 w-3 mr-1" />
                    : doc.status === 'error'
                    ? <AlertTriangle className="h-3 w-3 mr-1" />
                    : null}
                  {statusLabels[doc.status]?.[language === 'es' ? 'es' : 'en']}
                </Badge>
              </div>

              {/* Classification result */}
              {classification && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {typeInfo?.icon} {typeInfo?.[language === 'es' ? 'es' : 'en']}
                    </Badge>
                    {classification.confidence >= 0.8 && (
                      <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">
                        {Math.round(classification.confidence * 100)}% seguro
                      </Badge>
                    )}
                    
                    {/* Reclassify dropdown */}
                    {doc.status === 'classified' && (
                      <Select 
                        value={classification.document_type}
                        onValueChange={(v) => onReclassify(v as DocumentClassificationType)}
                      >
                        <SelectTrigger className="h-6 w-auto text-[10px] border-dashed gap-1">
                          <RotateCcw className="h-3 w-3" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TYPE_LABELS).map(([key, val]) => (
                            <SelectItem key={key} value={key} className="text-xs">
                              {val.icon} {val[language === 'es' ? 'es' : 'en']}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">{classification.summary}</p>

                  {/* Preview data */}
                  {classification.extracted_preview && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {classification.extracted_preview.vendor && (
                        <Badge variant="outline" className="text-[10px]">
                          🏪 {classification.extracted_preview.vendor}
                        </Badge>
                      )}
                      {classification.extracted_preview.amount && (
                        <Badge variant="outline" className="text-[10px] font-mono">
                          💵 ${classification.extracted_preview.amount.toLocaleString()}
                        </Badge>
                      )}
                      {classification.extracted_preview.date && (
                        <Badge variant="outline" className="text-[10px]">
                          📅 {classification.extracted_preview.date}
                        </Badge>
                      )}
                      {classification.extracted_preview.is_recurring && (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                          🔄 {classification.extracted_preview.recurrence_frequency || 'Recurrente'}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Suggested actions */}
                  {classification.suggested_actions?.length > 0 && doc.status === 'classified' && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {classification.suggested_actions.slice(0, 3).map((action, i) => (
                        <span key={i} className="text-[10px] text-primary/70 flex items-center gap-0.5">
                          <ArrowRight className="h-2.5 w-2.5" /> {action}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Processed result */}
                  {doc.processedResult && (
                    <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {doc.processedResult.type === 'receipt' && (language === 'es' ? 'Enviado al Centro de Revisión' : 'Sent to Review Center')}
                      {doc.processedResult.type === 'utility_bill' && (language === 'es' ? 'Enviado al Centro de Revisión (sugerir recurrencia)' : 'Sent to Review (suggest recurring)')}
                      {doc.processedResult.type === 'bank_statement' && (language === 'es' ? `${doc.processedResult.transactions?.length || 0} transacciones extraídas` : `${doc.processedResult.transactions?.length || 0} transactions extracted`)}
                      {doc.processedResult.type === 'income_proof' && (language === 'es' ? 'Ingreso detectado — revísalo en Ingresos' : 'Income detected — review in Income')}
                      {doc.processedResult.type === 'contract' && (language === 'es' ? 'Contrato guardado y analizado' : 'Contract saved and analyzed')}
                      {doc.processedResult.type === 'manual_review' && (language === 'es' ? 'Guardado para revisión manual' : 'Saved for manual review')}
                    </div>
                  )}
                </div>
              )}

              {doc.error && (
                <p className="text-xs text-destructive mt-1">{doc.error}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {doc.status === 'classified' && (
                <Button size="sm" variant="default" onClick={onProcess} className="h-8 text-xs gap-1">
                  <Zap className="h-3.5 w-3.5" />
                  {language === 'es' ? 'Procesar' : 'Process'}
                </Button>
              )}
              {(doc.status === 'classified' || doc.status === 'error' || doc.status === 'processed') && (
                <Button size="sm" variant="ghost" onClick={onRemove} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function UnifiedChaosInboxPanel() {
  const { language } = useLanguage();
  const {
    documents,
    stats,
    isProcessingBatch,
    uploadAndClassify,
    processDocument,
    processAllClassified,
    reclassify,
    removeDoc,
  } = useUnifiedChaosInbox();

  const hasClassified = stats.classified > 0;
  const hasAnyDocs = stats.total > 0;
  const isWorking = stats.uploading > 0 || stats.classifying > 0 || stats.processing > 0;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <DropZone onFiles={uploadAndClassify} />

      {/* Stats bar */}
      {hasAnyDocs && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {stats.byType.map(([type, count]) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {TYPE_LABELS[type as DocumentClassificationType]?.icon} {count}
              </Badge>
            ))}
            {isWorking && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <Progress 
                  value={((stats.classified + stats.processed) / stats.total) * 100} 
                  className="w-24 h-2" 
                />
              </div>
            )}
          </div>

          {hasClassified && (
            <Button 
              onClick={processAllClassified} 
              disabled={isProcessingBatch}
              className="gap-2"
              size="sm"
            >
              {isProcessingBatch ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {language === 'es' 
                ? `Procesar todo (${stats.classified})` 
                : `Process all (${stats.classified})`}
            </Button>
          )}
        </div>
      )}

      {/* Document list */}
      {hasAnyDocs && (
        <ScrollArea className="max-h-[60vh]">
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {documents.map(doc => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onProcess={() => processDocument(doc.id)}
                  onRemove={() => removeDoc(doc.id)}
                  onReclassify={(type) => reclassify(doc.id, type)}
                />
              ))}
            </div>
          </AnimatePresence>
        </ScrollArea>
      )}

      {/* Empty state help */}
      {!hasAnyDocs && (
        <Card className="border-dashed">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: '🧾', label: language === 'es' ? 'Recibos de compras' : 'Purchase receipts' },
                { icon: '📄', label: language === 'es' ? 'Contratos' : 'Contracts' },
                { icon: '🏦', label: language === 'es' ? 'Extractos bancarios' : 'Bank statements' },
                { icon: '💡', label: language === 'es' ? 'Boletas de servicios' : 'Utility bills' },
                { icon: '💰', label: language === 'es' ? 'Comprobantes de pago' : 'Payment proofs' },
                { icon: '📋', label: language === 'es' ? 'Documentos fiscales' : 'Tax documents' },
                { icon: '🧾', label: language === 'es' ? 'Facturas' : 'Invoices' },
                { icon: '📎', label: language === 'es' ? '¡Lo que sea!' : 'Anything!' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-xs">{item.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              {language === 'es'
                ? 'La IA clasifica automáticamente cada documento y lo envía al pipeline correcto'
                : 'AI automatically classifies each document and routes it to the correct pipeline'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
