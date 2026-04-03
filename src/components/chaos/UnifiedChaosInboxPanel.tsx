import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  ClassifiedDocument, DocumentClassificationType, TYPE_LABELS, HistoryEntry, useUnifiedChaosInbox 
} from '@/hooks/data/useUnifiedChaosInbox';
import { useContentDuplicateDetector, DuplicateMatch } from '@/hooks/data/useContentDuplicateDetector';
import { DuplicateWarningDialog } from './DuplicateWarningDialog';
import { 
  Upload, Loader2, CheckCircle2, AlertTriangle, X, Zap, 
  FileText, ArrowRight, RotateCcw, Sparkles, Package,
  Trash2, RefreshCw, ExternalLink, Image, FileIcon, Eye,
  ChevronRight, ArrowUpRight, Inbox, HelpCircle, Clock, ChevronDown, Wand2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { PostUploadWizard } from './PostUploadWizard';
import { toast } from 'sonner';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all cursor-pointer group",
          dragOver 
            ? "border-primary bg-primary/10 scale-[1.01] shadow-lg shadow-primary/10" 
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
          <motion.div 
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
              dragOver ? "bg-primary text-primary-foreground" : "bg-muted group-hover:bg-primary/20"
            )}
            animate={dragOver ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Upload className="h-7 w-7" />
          </motion.div>
          
          <div>
            <p className="font-semibold text-lg">
              {language === 'es' ? '🌀 Suelta TODO aquí' : '🌀 Drop EVERYTHING here'}
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              {language === 'es' 
                ? 'Recibos, contratos, extractos bancarios, boletas, comprobantes de pago... ¡La IA clasifica y organiza todo!'
                : 'Receipts, contracts, bank statements, bills, payment proofs... AI classifies and organizes everything!'}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {Object.entries(TYPE_LABELS).filter(([k]) => k !== 'unknown').map(([key, val]) => (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <span className="text-xl opacity-50 group-hover:opacity-100 transition-opacity hover:scale-125 cursor-default">
                    {val.icon}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {val[language === 'es' ? 'es' : 'en']}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ConfidenceDot({ confidence }: { confidence: number }) {
  const color = confidence >= 0.85 ? 'bg-green-500' : confidence >= 0.6 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-block w-2 h-2 rounded-full", color)} />
      </TooltipTrigger>
      <TooltipContent className="text-xs">{Math.round(confidence * 100)}% confianza</TooltipContent>
    </Tooltip>
  );
}

function Thumbnail({ doc }: { doc: ClassifiedDocument }) {
  if (!doc.base64) return null;
  const isImage = doc.fileType.startsWith('image/');
  if (!isImage) {
    return (
      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <FileIcon className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border bg-muted">
      <img src={doc.base64} alt="" className="w-full h-full object-cover" />
    </div>
  );
}

function ProcessedResultMessage({ doc, language }: { doc: ClassifiedDocument; language: string }) {
  const navigate = useNavigate();
  const result = doc.processedResult;
  if (!result) return null;

  const messages: Record<string, { es: string; en: string; route?: string; routeLabel?: { es: string; en: string } }> = {
    receipt: { es: 'Enviado al Centro de Revisión', en: 'Sent to Review Center', route: '/expenses', routeLabel: { es: 'Revisar', en: 'Review' } },
    utility_bill: { es: 'Boleta procesada — se sugiere pago recurrente', en: 'Bill processed — recurring payment suggested', route: '/bills', routeLabel: { es: 'Crear Pago Fijo', en: 'Create Fixed Payment' } },
    bank_statement: { es: `${result.transactions?.length || 0} transacciones extraídas`, en: `${result.transactions?.length || 0} transactions extracted`, route: '/banking', routeLabel: { es: 'Banca', en: 'Banking' } },
    income_proof: { es: 'Ingreso detectado — revísalo', en: 'Income detected — review it', route: '/income', routeLabel: { es: 'Ingresos', en: 'Income' } },
    contract: { es: result.analysisError ? 'Contrato guardado (análisis pendiente)' : 'Contrato guardado y analizado', en: result.analysisError ? 'Contract saved (analysis pending)' : 'Contract saved and analyzed', route: '/contracts', routeLabel: { es: 'Contratos', en: 'Contracts' } },
    invoice: { es: 'Factura procesada — enviada al Centro de Revisión', en: 'Invoice processed — sent to Review Center', route: '/expenses', routeLabel: { es: 'Revisar', en: 'Review' } },
    invoice_income: { es: `💰 Ingreso de $${result.amount?.toLocaleString() || '?'} ${result.currency || ''} — pendiente de revisión`, en: `💰 Income of $${result.amount?.toLocaleString() || '?'} ${result.currency || ''} — pending review`, route: '/expenses', routeLabel: { es: 'Revisar', en: 'Review' } },
    invoice_expense: { es: 'Factura (gasto) enviada al Centro de Revisión', en: 'Invoice (expense) sent to Review Center', route: '/expenses', routeLabel: { es: 'Revisar', en: 'Review' } },
    tax_document: { es: 'Documento fiscal guardado', en: 'Tax document saved', route: '/files', routeLabel: { es: 'Archivos', en: 'Files' } },
    medical_receipt: { es: '🏥 Gasto médico — deducible CRA/SII', en: '🏥 Medical expense — CRA/SII deductible', route: '/expenses', routeLabel: { es: 'Revisar', en: 'Review' } },
    donation_receipt: { es: '💝 Donación deducible detectada', en: '💝 Deductible donation detected', route: '/expenses', routeLabel: { es: 'Revisar', en: 'Review' } },
    insurance_policy: { es: '🛡️ Póliza guardada — deducible como negocio', en: '🛡️ Policy saved — business deductible', route: '/expenses', routeLabel: { es: 'Revisar', en: 'Review' } },
    rental_receipt: { es: '🏢 Arriendo procesado — pago recurrente sugerido', en: '🏢 Rent processed — recurring payment suggested', route: '/bills', routeLabel: { es: 'Crear Pago Fijo', en: 'Create Fixed Payment' } },
    investment_statement: { es: '📈 Estado de inversión guardado', en: '📈 Investment statement saved', route: '/investments', routeLabel: { es: 'Inversiones', en: 'Investments' } },
    tax_slip: { es: '📑 Formulario fiscal guardado para declaración', en: '📑 Tax slip saved for filing', route: '/tax-calendar', routeLabel: { es: 'Impuestos', en: 'Taxes' } },
    government_form: { es: '🏛️ Formulario gubernamental guardado', en: '🏛️ Government form saved', route: '/files', routeLabel: { es: 'Archivos', en: 'Files' } },
    unknown: { es: 'Documento guardado para revisión', en: 'Document saved for review', route: '/files', routeLabel: { es: 'Archivos', en: 'Files' } },
    manual_review: { es: 'Guardado para revisión manual', en: 'Saved for manual review', route: '/expenses', routeLabel: { es: 'Revisar', en: 'Review' } },
  };

  const msg = messages[result.type] || messages.manual_review;

  return (
    <div className="mt-2 flex items-center gap-2 flex-wrap">
      <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {msg[language === 'es' ? 'es' : 'en']}
      </span>
      {msg.route && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] text-primary hover:text-primary gap-1 px-2"
          onClick={(e) => { e.stopPropagation(); navigate(msg.route!); }}
        >
          <ArrowUpRight className="h-3 w-3" />
          {msg.routeLabel?.[language === 'es' ? 'es' : 'en']}
        </Button>
      )}
    </div>
  );
}

function DocumentCard({ 
  doc, 
  onProcess, 
  onRemove, 
  onReclassify,
  onRetry,
  onSetDirection,
}: { 
  doc: ClassifiedDocument;
  onProcess: () => void;
  onRemove: () => void;
  onReclassify: (type: DocumentClassificationType) => void;
  onRetry: () => void;
  onSetDirection?: (direction: 'income' | 'expense') => void;
}) {
  const { language } = useLanguage();
  const classification = doc.classification;
  const typeInfo = classification ? TYPE_LABELS[classification.document_type] : null;

  const statusConfig: Record<string, { color: string; pulse?: boolean; label: { es: string; en: string } }> = {
    uploading: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', pulse: true, label: { es: 'Subiendo...', en: 'Uploading...' } },
    classifying: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', pulse: true, label: { es: '🧠 Clasificando con IA...', en: '🧠 AI Classifying...' } },
    classified: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', label: { es: '✅ Listo para procesar', en: '✅ Ready to process' } },
    pending_direction: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', label: { es: '🧾 ¿Ingreso o Gasto?', en: '🧾 Income or Expense?' } },
    processing: { color: 'bg-purple-500/10 text-purple-600 border-purple-500/30', pulse: true, label: { es: '⚙️ Procesando...', en: '⚙️ Processing...' } },
    processed: { color: 'bg-green-500/10 text-green-700 border-green-500/30', label: { es: '🎉 Completado', en: '🎉 Completed' } },
    error: { color: 'bg-destructive/10 text-destructive border-destructive/30', label: { es: '❌ Error', en: '❌ Error' } },
  };

  const status = statusConfig[doc.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.9 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-300",
        doc.status === 'classified' && "ring-1 ring-primary/40 shadow-sm shadow-primary/5",
        doc.status === 'processed' && "opacity-75",
        doc.status === 'error' && "ring-1 ring-destructive/30",
        status.pulse && "animate-pulse-subtle"
      )}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            {/* Thumbnail or type icon */}
            {doc.base64 && doc.fileType.startsWith('image/') ? (
              <Thumbnail doc={doc} />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0 text-xl">
                {typeInfo?.icon || (doc.status === 'uploading' || doc.status === 'classifying' 
                  ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> 
                  : '📎')}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm truncate max-w-[180px]" title={doc.fileName}>
                  {doc.fileName}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatFileSize(doc.fileSize)}
                </span>
              </div>
              
              {/* Status badge */}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-[10px]", status.color)}>
                  {(doc.status === 'classifying' || doc.status === 'processing' || doc.status === 'uploading') && (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  )}
                  {status.label[language === 'es' ? 'es' : 'en']}
                </Badge>
                {classification && <ConfidenceDot confidence={classification.confidence} />}
              </div>

              {/* Classification result */}
              {classification && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs font-medium">
                      {typeInfo?.icon} {typeInfo?.[language === 'es' ? 'es' : 'en']}
                    </Badge>
                    
                    {/* Reclassify dropdown */}
                    {doc.status === 'classified' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Select 
                              value={classification.document_type}
                              onValueChange={(v) => onReclassify(v as DocumentClassificationType)}
                            >
                              <SelectTrigger className="h-6 w-auto text-[10px] border-dashed gap-1 bg-muted/50">
                                <RotateCcw className="h-3 w-3" />
                                <span className="hidden sm:inline">
                                  {language === 'es' ? 'Cambiar' : 'Change'}
                                </span>
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(TYPE_LABELS).map(([key, val]) => (
                                  <SelectItem key={key} value={key} className="text-xs">
                                    {val.icon} {val[language === 'es' ? 'es' : 'en']}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          {language === 'es' ? 'Corregir clasificación si la IA se equivocó' : 'Fix classification if AI was wrong'}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{typeof classification.summary === 'string' ? classification.summary : JSON.stringify(classification.summary)}</p>

                  {/* Preview data badges */}
                  {classification.extracted_preview && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {classification.extracted_preview.vendor && typeof classification.extracted_preview.vendor === 'string' && (
                        <Badge variant="outline" className="text-[10px] bg-muted/30">
                          🏪 {classification.extracted_preview.vendor}
                        </Badge>
                      )}
                      {classification.extracted_preview.amount != null && typeof classification.extracted_preview.amount !== 'object' && (
                        <Badge variant="outline" className="text-[10px] font-mono bg-muted/30">
                          💵 {typeof classification.extracted_preview.currency === 'string' ? classification.extracted_preview.currency : '$'}{Number(classification.extracted_preview.amount).toLocaleString()}
                        </Badge>
                      )}
                      {classification.extracted_preview.date && (
                        <Badge variant="outline" className="text-[10px] bg-muted/30">
                          📅 {classification.extracted_preview.date}
                        </Badge>
                      )}
                      {classification.extracted_preview.is_recurring && (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-500/10">
                          🔄 {classification.extracted_preview.recurrence_frequency || (language === 'es' ? 'Recurrente' : 'Recurring')}
                        </Badge>
                      )}
                      {classification.extracted_preview.parties && classification.extracted_preview.parties.length > 0 && (
                        <Badge variant="outline" className="text-[10px] bg-muted/30">
                          👥 {classification.extracted_preview.parties.join(', ')}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Suggested actions */}
                  {classification.suggested_actions?.length > 0 && doc.status === 'classified' && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {classification.suggested_actions.slice(0, 3).map((action, i) => (
                        <span key={i} className="text-[10px] text-primary/70 flex items-center gap-0.5">
                          <ChevronRight className="h-2.5 w-2.5" /> {action}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Processed result with navigation */}
                  <ProcessedResultMessage doc={doc} language={language} />
                </div>
              )}

              {/* Invoice direction picker */}
              {doc.status === 'pending_direction' && doc.invoiceDirectionSuggestion && onSetDirection && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-2"
                >
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    {language === 'es' ? '🧾 ¿Esta factura es un ingreso o un gasto?' : '🧾 Is this invoice income or expense?'}
                  </p>
                  
                  {doc.invoiceDirectionSuggestion.direction !== 'unknown' && (
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/30">
                        💡 {language === 'es' ? 'Sugerencia' : 'Suggestion'}: {doc.invoiceDirectionSuggestion.direction === 'income' 
                          ? (language === 'es' ? 'Ingreso' : 'Income') 
                          : (language === 'es' ? 'Gasto' : 'Expense')}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        ({doc.invoiceDirectionSuggestion.reason})
                      </span>
                    </div>
                  )}

                  {classification?.extracted_preview && (
                    <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                      {classification.extracted_preview.from_entity && (
                        <span>📤 De: <strong>{classification.extracted_preview.from_entity}</strong></span>
                      )}
                      {classification.extracted_preview.to_entity && (
                        <span>📥 Para: <strong>{classification.extracted_preview.to_entity}</strong></span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant={doc.invoiceDirectionSuggestion.direction === 'income' ? 'default' : 'outline'}
                      className="h-8 text-xs gap-1.5 flex-1"
                      onClick={(e) => { e.stopPropagation(); onSetDirection('income'); }}
                    >
                      💰 {language === 'es' ? 'Es un Ingreso' : 'It\'s Income'}
                      <span className="text-[9px] opacity-70">
                        ({language === 'es' ? 'yo cobro' : 'I get paid'})
                      </span>
                    </Button>
                    <Button
                      size="sm"
                      variant={doc.invoiceDirectionSuggestion.direction === 'expense' ? 'default' : 'outline'}
                      className="h-8 text-xs gap-1.5 flex-1"
                      onClick={(e) => { e.stopPropagation(); onSetDirection('expense'); }}
                    >
                      🧾 {language === 'es' ? 'Es un Gasto' : 'It\'s an Expense'}
                      <span className="text-[9px] opacity-70">
                        ({language === 'es' ? 'yo pago' : 'I pay'})
                      </span>
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Error with retry */}
              {doc.error && (
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-xs text-destructive flex-1">{doc.error}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={(e) => { e.stopPropagation(); onRetry(); }}
                    className="h-6 text-[10px] gap-1 shrink-0"
                  >
                    <RefreshCw className="h-3 w-3" />
                    {language === 'es' ? 'Reintentar' : 'Retry'}
                  </Button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              {doc.status === 'classified' && (
                <Button size="sm" variant="default" onClick={onProcess} className="h-8 text-xs gap-1 shadow-sm">
                  <Zap className="h-3.5 w-3.5" />
                  {language === 'es' ? 'Procesar' : 'Process'}
                </Button>
              )}
              {(doc.status === 'classified' || doc.status === 'pending_direction' || doc.status === 'error' || doc.status === 'processed') && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="ghost" onClick={onRemove} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    {language === 'es' ? 'Quitar de la lista' : 'Remove from list'}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function BatchSummary({ stats, onClear, language }: { stats: any; onClear: () => void; language: string }) {
  if (stats.processed === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {language === 'es' 
                  ? `${stats.processed} documento(s) procesado(s)` 
                  : `${stats.processed} document(s) processed`}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'es' 
                  ? 'Revisa cada sección para confirmar los datos' 
                  : 'Check each section to confirm data'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onClear} className="text-xs gap-1">
            <X className="h-3 w-3" />
            {language === 'es' ? 'Limpiar' : 'Clear'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function HistoryCard({ entry, language }: { entry: HistoryEntry; language: string }) {
  const navigate = useNavigate();
  const typeInfo = TYPE_LABELS[entry.documentType];
  
  const routeMap: Record<string, string> = {
    receipt: '/expenses',
    invoice: '/expenses',
    utility_bill: '/recurring',
    bank_statement: '/banking',
    income_proof: '/income',
    contract: '/contracts',
    tax_document: '/files',
    unknown: '/files',
  };

  const processedDate = new Date(entry.processedAt);
  const timeAgo = getTimeAgo(processedDate, language);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 text-lg">
        {typeInfo?.icon || '📎'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate max-w-[200px]">{entry.fileName}</span>
          <Badge variant="secondary" className="text-[10px] shrink-0">
            {typeInfo?.[language === 'es' ? 'es' : 'en']}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" /> {timeAgo}
          </span>
          <span className="text-[10px] text-muted-foreground">•</span>
          <span className="text-[10px] text-muted-foreground">{formatFileSize(entry.fileSize)}</span>
          {entry.extractedPreview?.amount != null && typeof entry.extractedPreview.amount !== 'object' && (
            <>
              <span className="text-[10px] text-muted-foreground">•</span>
              <span className="text-[10px] font-mono text-foreground/70">
                {typeof entry.extractedPreview.currency === 'string' ? entry.extractedPreview.currency : '$'}{Number(entry.extractedPreview.amount).toLocaleString()}
              </span>
            </>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-[10px] gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => navigate(routeMap[entry.documentType] || '/files')}
      >
        <ArrowUpRight className="h-3 w-3" />
        {language === 'es' ? 'Ver' : 'View'}
      </Button>
    </div>
  );
}

function getTimeAgo(date: Date, language: string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return language === 'es' ? 'Ahora' : 'Just now';
  if (diffMin < 60) return language === 'es' ? `Hace ${diffMin}m` : `${diffMin}m ago`;
  if (diffHours < 24) return language === 'es' ? `Hace ${diffHours}h` : `${diffHours}h ago`;
  return language === 'es' ? `Hace ${diffDays}d` : `${diffDays}d ago`;
}

export function UnifiedChaosInboxPanel() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [historyOpen, setHistoryOpen] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [duplicateQueue, setDuplicateQueue] = useState<Array<{
    matches: DuplicateMatch[];
    newDoc: { vendor?: string; amount?: number; date?: string; description?: string };
    docId: string;
  }>>([]);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateQueueTotal, setDuplicateQueueTotal] = useState(0);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  
  const { checkContent } = useContentDuplicateDetector();
  
  const {
    documents,
    history,
    stats,
    isProcessingBatch,
    uploadAndClassify,
    processDocument: rawProcessDocument,
    processAllClassified: rawProcessAllClassified,
    reclassify,
    setInvoiceDirection,
    retryDocument,
    removeDoc,
    clearProcessed,
    clearHistory,
  } = useUnifiedChaosInbox();

  // Wrap processDocument to add duplicate detection after processing
  const processDocumentWithDupCheck = useCallback(async (docId: string) => {
    const result = await rawProcessDocument(docId);
    if (!result?.processedResult) return;
    
    const pr = result.processedResult;
    const ep = result.extractedPreview || {};
    const dbDocId = pr.docId;
    
    // Extract data for duplicate check
    const vendor = ep.vendor || ep.remit_to?.name || ep.from_entity || '';
    const amount = parseFloat(String(ep.amount || ep.total || '0').replace(/,/g, '')) || 0;
    const date = ep.date || '';
    const description = ep.description || '';
    
    if ((vendor || amount > 0) && dbDocId) {
      setCheckingDuplicates(true);
      try {
        const dupResult = await checkContent({ vendor, amount, date, description }, dbDocId);
        if (dupResult.hasDuplicates) {
          setDuplicateQueue(prev => [...prev, {
            matches: dupResult.matches,
            newDoc: { vendor, amount, date, description },
            docId: dbDocId,
          }]);
        }
      } finally {
        setCheckingDuplicates(false);
      }
    }
  }, [rawProcessDocument, checkContent]);

  // Wrap processAllClassified to use our dup-checking version
  const processAllClassified = useCallback(async () => {
    const classified = documents.filter(d => d.status === 'classified');
    if (classified.length === 0) return;
    
    for (const doc of classified) {
      await processDocumentWithDupCheck(doc.id);
    }
    
    // Open duplicate dialog if queue accumulated items
    setDuplicateQueue(prev => {
      if (prev.length > 0) {
        setDuplicateQueueTotal(prev.length);
        setDuplicateDialogOpen(true);
      }
      return prev;
    });
    
    toast.success(`🎉 ${classified.length} ${language === 'es' ? 'documentos procesados' : 'documents processed'}`);
  }, [documents, processDocumentWithDupCheck, language]);

  const advanceDuplicateQueue = useCallback(() => {
    setDuplicateQueue(prev => {
      const next = prev.slice(1);
      if (next.length === 0) {
        setDuplicateDialogOpen(false);
        toast.success(language === 'es' ? 'Revisión de duplicados completada' : 'Duplicate review complete');
      }
      return next;
    });
  }, [language]);

  const hasClassified = stats.classified > 0;
  const hasPendingDirection = stats.pendingDirection > 0;
  const hasAnyDocs = stats.total > 0;
  const isWorking = stats.uploading > 0 || stats.classifying > 0 || stats.processing > 0;
  const progressPercent = stats.total > 0 ? ((stats.classified + stats.processed) / stats.total) * 100 : 0;
  
  // Show wizard button when there are processed items in history
  const showWizardTrigger = history.length >= 2 && !isWorking;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Drop zone */}
        <DropZone onFiles={uploadAndClassify} />

        {/* Stats bar */}
        {hasAnyDocs && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex items-center justify-between gap-3 flex-wrap"
          >
            <div className="flex items-center gap-2 flex-wrap">
              {stats.byType.map(([type, count]) => (
                <Badge key={type} variant="secondary" className="text-xs gap-1">
                  {TYPE_LABELS[type as DocumentClassificationType]?.icon}
                  <span className="font-mono">{count as number}</span>
                  <span className="text-muted-foreground hidden sm:inline">
                    {TYPE_LABELS[type as DocumentClassificationType]?.[language === 'es' ? 'es' : 'en']}
                  </span>
                </Badge>
              ))}
              
              {isWorking && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <Progress value={progressPercent} className="w-24 h-2" />
                  <span className="text-[10px] text-muted-foreground">{Math.round(progressPercent)}%</span>
                </div>
              )}
              
              {stats.errors > 0 && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {stats.errors} {language === 'es' ? 'error(es)' : 'error(s)'}
                </Badge>
              )}
              {hasPendingDirection && (
                <Badge variant="outline" className="text-xs gap-1 border-amber-500/50 text-amber-600 bg-amber-500/5">
                  🧾 {stats.pendingDirection} {language === 'es' ? 'requiere confirmación' : 'needs confirmation'}
                </Badge>
              )}
            </div>

            {hasClassified && (
              <Button 
                onClick={processAllClassified} 
                disabled={isProcessingBatch}
                className="gap-2 shadow-sm"
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
          </motion.div>
        )}

        {/* Batch summary */}
        <BatchSummary stats={stats} onClear={clearProcessed} language={language} />

        {/* Post-upload wizard trigger */}
        {showWizardTrigger && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Button
              onClick={() => setWizardOpen(true)}
              className="w-full gap-2 bg-gradient-to-r from-primary to-chart-2 hover:opacity-90"
              size="lg"
            >
              <Wand2 className="h-5 w-5" />
              {language === 'es' 
                ? `🧙 Asistente: Organizar ${history.length} documentos procesados`
                : `🧙 Assistant: Organize ${history.length} processed documents`}
            </Button>
          </motion.div>
        )}

        {/* Post-upload wizard dialog */}
        <PostUploadWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          processedHistory={history}
        />

        {/* Document list */}
        {hasAnyDocs && (
          <div className="overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
            <AnimatePresence mode="popLayout">
              <div className="space-y-2 pb-4">
                {documents.map(doc => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onProcess={() => processDocument(doc.id)}
                    onRemove={() => removeDoc(doc.id)}
                    onReclassify={(type) => reclassify(doc.id, type)}
                    onRetry={() => retryDocument(doc.id)}
                    onSetDirection={(dir) => setInvoiceDirection(doc.id, dir)}
                  />
                ))}
              </div>
            </AnimatePresence>
          </div>
        )}

        {/* History section */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
              <Card className="border-muted">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">
                        {language === 'es' ? 'Historial de Procesamiento' : 'Processing History'}
                      </h3>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {history.length}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); clearHistory(); }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {language === 'es' ? 'Limpiar' : 'Clear'}
                      </Button>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        historyOpen && "rotate-180"
                      )} />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-3 px-3">
                    <ScrollArea className="max-h-[300px]">
                      <div className="space-y-1">
                        {history.map((entry) => (
                          <HistoryCard key={entry.id} entry={entry} language={language} />
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </motion.div>
        )}

        {/* Empty state with educational guide */}
        {!hasAnyDocs && history.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-dashed">
              <CardContent className="p-6 space-y-5">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Inbox className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">
                    {language === 'es' ? '¿Cómo funciona?' : 'How does it work?'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-lg mx-auto">
                    {language === 'es'
                      ? 'Sube cualquier tipo de documento financiero. La IA lo clasifica automáticamente y lo envía al lugar correcto de tu app.'
                      : 'Upload any type of financial document. AI automatically classifies it and routes it to the right place in your app.'}
                  </p>
                </div>

                {/* Flow diagram */}
                <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
                  <Badge variant="outline" className="gap-1">
                    <Upload className="h-3 w-3" /> {language === 'es' ? 'Subir' : 'Upload'}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="gap-1">
                    <Sparkles className="h-3 w-3" /> {language === 'es' ? 'IA Clasifica' : 'AI Classifies'}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="gap-1">
                    <Eye className="h-3 w-3" /> {language === 'es' ? 'Confirmar' : 'Confirm'}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" /> {language === 'es' ? 'Listo' : 'Done'}
                  </Badge>
                </div>

                {/* Document types grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(TYPE_LABELS).filter(([k]) => k !== 'unknown').map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-lg">{val.icon}</span>
                      <span className="text-xs text-muted-foreground">{val[language === 'es' ? 'es' : 'en']}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
}
