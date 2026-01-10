import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClients } from '@/hooks/data/useClients';
import { useProjects } from '@/hooks/data/useProjects';
import { useContractReimbursementSuggestion } from '@/hooks/data/useContractReimbursementSuggestion';
import { EXPENSE_CATEGORIES } from '@/lib/constants/expense-categories';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Check, X, Edit2, MessageSquare, Loader2, ZoomIn, ZoomOut,
  Building2, Landmark, Calendar, DollarSign, Tag, Store,
  AlertTriangle, CheckCircle2, Clock, RotateCcw, Save, Sparkles, Trash2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface ExtractedData {
  vendor?: string;
  amount?: number;
  date?: string;
  category?: string;
  description?: string;
  currency?: string;
  cra_deductible?: boolean;
  cra_deduction_rate?: number;
  typically_reimbursable?: boolean;
  confidence?: 'high' | 'medium' | 'low';
  client_id?: string;
  project_id?: string;
}

export interface ReceiptDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  status: string;
  review_status: string;
  extracted_data: ExtractedData;
  user_corrections: string | null;
  created_at: string;
  reviewed_at: string | null;
  expense_id: string | null;
}

interface ReceiptReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: ReceiptDocument;
  imageUrl: string | null;
  onApprove: (id: string, data: ExtractedData) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onAddComment: (id: string, comment: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isLoading?: boolean;
  onDataExtracted?: (data: ExtractedData) => void;
}

export function ReceiptReviewDialog({ 
  open,
  onOpenChange,
  document, 
  imageUrl, 
  onApprove, 
  onReject,
  onAddComment,
  onDelete,
  isLoading,
  onDataExtracted 
}: ReceiptReviewDialogProps) {
  const { language } = useLanguage();
  const { data: clients = [] } = useClients();
  const { data: projects = [] } = useProjects('active');
  
  const [isEditing, setIsEditing] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState('');
  const [editedData, setEditedData] = useState<ExtractedData>(document.extracted_data || {});
  const [imageZoom, setImageZoom] = useState(1);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // Get reimbursement suggestion from contract terms
  const reimbursementSuggestion = useContractReimbursementSuggestion(
    editedData.client_id,
    editedData.category
  );

  // Check if document has no extracted data
  const hasNoData = !document.extracted_data?.vendor && !document.extracted_data?.amount && !document.extracted_data?.date;

  const handleProcessWithAI = async () => {
    if (!imageUrl) return;
    
    setIsProcessingAI(true);
    try {
      // Get the image as base64
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // Call the AI processing function
      const { data: result, error } = await supabase.functions.invoke('process-receipt', {
        body: { imageBase64: base64 },
      });

      if (error) throw error;

      if (result?.expenses?.length > 0) {
        const extractedData = result.expenses[0];
        
        // Update the document in database
        await supabase
          .from('documents')
          .update({ 
            extracted_data: JSON.parse(JSON.stringify(extractedData)),
            status: 'classified' 
          } as any)
          .eq('id', document.id);

        // Update local state
        setEditedData(extractedData);
        setIsEditing(true);
        
        if (onDataExtracted) {
          onDataExtracted(extractedData);
        }

        toast.success(language === 'es' ? '¡Datos extraídos exitosamente!' : 'Data extracted successfully!');
      } else {
        toast.error(language === 'es' ? 'No se pudieron extraer datos' : 'Could not extract data');
      }
    } catch (err) {
      console.error('AI processing error:', err);
      toast.error(language === 'es' ? 'Error al procesar' : 'Error processing');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleApprove = async () => {
    await onApprove(document.id, editedData);
    setIsEditing(false);
    onOpenChange(false);
  };

  const handleSaveChanges = async () => {
    try {
      // Update the document's extracted_data
      const { error: docError } = await supabase
        .from('documents')
        .update({ extracted_data: JSON.parse(JSON.stringify(editedData)) } as any)
        .eq('id', document.id);

      if (docError) throw docError;

      // If there's an associated expense, update it too
      if (document.expense_id) {
        const expenseUpdates: any = {};
        if (editedData.vendor) expenseUpdates.vendor = editedData.vendor;
        if (editedData.amount) expenseUpdates.amount = editedData.amount;
        if (editedData.date) expenseUpdates.date = editedData.date;
        if (editedData.category) expenseUpdates.category = editedData.category;
        if (editedData.description) expenseUpdates.description = editedData.description;
        if (editedData.client_id) expenseUpdates.client_id = editedData.client_id;
        if (editedData.project_id) expenseUpdates.project_id = editedData.project_id;
        if (editedData.typically_reimbursable !== undefined) {
          expenseUpdates.reimbursement_type = editedData.typically_reimbursable ? 'client_reimbursable' : 
            (editedData.cra_deductible ? 'cra_deductible' : 'personal');
        }

        if (Object.keys(expenseUpdates).length > 0) {
          const { error: expenseError } = await supabase
            .from('expenses')
            .update(expenseUpdates)
            .eq('id', document.expense_id);
          
          if (expenseError) throw expenseError;
        }
      }

      toast.success(language === 'es' ? 'Cambios guardados' : 'Changes saved');
      setIsEditing(false);
      
      if (onDataExtracted) {
        onDataExtracted(editedData);
      }
    } catch (err) {
      console.error('Error saving changes:', err);
      toast.error(language === 'es' ? 'Error al guardar cambios' : 'Error saving changes');
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      setShowCommentInput(true);
      return;
    }
    await onReject(document.id, comment);
    setComment('');
    setShowCommentInput(false);
    onOpenChange(false);
  };

  const handleSaveComment = async () => {
    if (!comment.trim()) return;
    await onAddComment(document.id, comment);
    setComment('');
    setShowCommentInput(false);
  };

  const updateField = (field: keyof ExtractedData, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const resetEdits = () => {
    setEditedData(document.extracted_data || {});
    setIsEditing(false);
  };

  const data = isEditing ? editedData : (document.extracted_data || {});
  const hasChanges = JSON.stringify(editedData) !== JSON.stringify(document.extracted_data);
  const isPending = document.review_status === 'pending_review';

  const getStatusBadge = () => {
    switch (document.review_status) {
      case 'approved':
        return <Badge className="bg-success"><CheckCircle2 className="h-3 w-3 mr-1" />{language === 'es' ? 'Aprobado' : 'Approved'}</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />{language === 'es' ? 'Rechazado' : 'Rejected'}</Badge>;
      case 'needs_correction':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground"><AlertTriangle className="h-3 w-3 mr-1" />{language === 'es' ? 'Requiere Corrección' : 'Needs Correction'}</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{language === 'es' ? 'Pendiente' : 'Pending'}</Badge>;
    }
  };

  const getConfidenceBadge = () => {
    const confidence = data.confidence;
    if (!confidence) return null;
    
    const config = {
      high: { color: 'bg-green-500/20 text-green-700', label: language === 'es' ? 'Alta confianza' : 'High confidence' },
      medium: { color: 'bg-yellow-500/20 text-yellow-700', label: language === 'es' ? 'Confianza media' : 'Medium confidence' },
      low: { color: 'bg-red-500/20 text-red-700', label: language === 'es' ? 'Baja confianza' : 'Low confidence' },
    };
    
    return <Badge className={config[confidence].color}>{config[confidence].label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[85vh] overflow-hidden flex flex-col p-6">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                {language === 'es' ? 'Revisar Recibo' : 'Review Receipt'}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {document.file_name} • {format(new Date(document.created_at), "dd MMM yyyy HH:mm", { locale: language === 'es' ? es : undefined })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getConfidenceBadge()}
              {getStatusBadge()}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Receipt Image */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {language === 'es' ? 'Imagen del recibo' : 'Receipt image'}
              </span>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.25))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(imageZoom * 100)}%</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setImageZoom(Math.min(3, imageZoom + 0.25))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-muted rounded-lg overflow-auto relative">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={document.file_name}
                  className="transition-transform origin-top-left"
                  style={{ transform: `scale(${imageZoom})` }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Right: Extracted Data & Actions */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                {language === 'es' ? 'Datos extraídos' : 'Extracted data'}
              </span>
              {!isEditing && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setIsEditing(true); setEditedData(document.extracted_data || {}); }}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  {language === 'es' ? 'Editar' : 'Edit'}
                </Button>
              )}
              {isEditing && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={resetEdits}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  {language === 'es' ? 'Descartar' : 'Discard'}
                </Button>
              )}
            </div>

            {/* Scrollable data area */}
            <div className="flex-1 overflow-y-auto pr-2">

            {/* Alert for no data */}
            {hasNoData && !isProcessingAI && (
              <Alert className="mb-4 border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className="text-amber-700 dark:text-amber-300">
                    {language === 'es' 
                      ? 'No se detectaron datos. ¿Deseas procesar la imagen?' 
                      : 'No data detected. Would you like to process the image?'}
                  </span>
                  <Button 
                    size="sm" 
                    onClick={handleProcessWithAI}
                    disabled={!imageUrl || isProcessingAI}
                    className="shrink-0"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    {language === 'es' ? 'Procesar' : 'Process'}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {isProcessingAI && (
              <Alert className="mb-4 border-primary/50 bg-primary/5">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <AlertDescription className="text-primary">
                  {language === 'es' 
                    ? 'Procesando imagen... Esto puede tomar unos segundos.' 
                    : 'Processing image... This may take a few seconds.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Data Fields */}
            <div className="space-y-4 flex-1">
              {/* Vendor */}
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  {language === 'es' ? 'Proveedor' : 'Vendor'}
                </label>
                {isEditing ? (
                  <Input 
                    value={editedData.vendor || ''} 
                    onChange={(e) => updateField('vendor', e.target.value)}
                    placeholder="Ej: Shell, Starbucks..."
                  />
                ) : (
                  <div className="p-3 bg-muted/50 rounded-md font-medium">
                    {data.vendor || <span className="text-muted-foreground italic">{language === 'es' ? 'Sin proveedor' : 'No vendor'}</span>}
                  </div>
                )}
              </div>

              {/* Amount & Date Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    {language === 'es' ? 'Monto' : 'Amount'}
                  </label>
                  {isEditing ? (
                    <Input 
                      type="number"
                      step="0.01"
                      value={editedData.amount || ''} 
                      onChange={(e) => updateField('amount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-md font-bold text-lg">
                      ${data.amount?.toFixed(2) || <span className="text-muted-foreground font-normal italic">0.00</span>}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {language === 'es' ? 'Fecha' : 'Date'}
                  </label>
                  {isEditing ? (
                    <Input 
                      type="date"
                      value={editedData.date || ''} 
                      onChange={(e) => updateField('date', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-md">
                      {data.date || <span className="text-muted-foreground italic">{language === 'es' ? 'Sin fecha' : 'No date'}</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {language === 'es' ? 'Categoría' : 'Category'}
                </label>
                {isEditing ? (
                  <Select value={editedData.category || 'other'} onValueChange={(v) => updateField('category', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <Badge variant="secondary">
                      {EXPENSE_CATEGORIES.find(c => c.value === data.category)?.label || data.category || 'Sin categoría'}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Client & Project Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {language === 'es' ? 'Cliente' : 'Client'}
                  </label>
                  {isEditing ? (
                    <Select 
                      value={editedData.client_id || 'none'} 
                      onValueChange={(v) => updateField('client_id', v === 'none' ? undefined : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'es' ? 'Sin cliente' : 'No client'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{language === 'es' ? 'Sin cliente' : 'No client'}</SelectItem>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-md">
                      {data.client_id 
                        ? clients.find(c => c.id === data.client_id)?.name 
                        : <span className="text-muted-foreground italic">{language === 'es' ? 'Sin cliente' : 'No client'}</span>
                      }
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    {language === 'es' ? 'Proyecto' : 'Project'}
                  </label>
                  {isEditing ? (
                    <Select 
                      value={editedData.project_id || 'none'} 
                      onValueChange={(v) => updateField('project_id', v === 'none' ? undefined : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'es' ? 'Sin proyecto' : 'No project'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{language === 'es' ? 'Sin proyecto' : 'No project'}</SelectItem>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-md">
                      {data.project_id 
                        ? projects.find(p => p.id === data.project_id)?.name 
                        : <span className="text-muted-foreground italic">{language === 'es' ? 'Sin proyecto' : 'No project'}</span>
                      }
                    </div>
                  )}
                </div>
              </div>

              {/* Reimbursement classification */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {language === 'es' ? 'Clasificación fiscal' : 'Tax classification'}
                </label>
                
                {/* Reimbursement Suggestion from Contract */}
                {reimbursementSuggestion && isEditing && (
                  <div className={cn(
                    "flex items-start gap-2 p-2 rounded text-xs mb-2",
                    reimbursementSuggestion.isReimbursable 
                      ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                      : "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
                  )}>
                    <Sparkles className={cn(
                      "h-3.5 w-3.5 flex-shrink-0 mt-0.5",
                      reimbursementSuggestion.isReimbursable ? "text-green-600" : "text-amber-600"
                    )} />
                    <div className="flex-1">
                      <p className={cn(
                        reimbursementSuggestion.isReimbursable 
                          ? "text-green-700 dark:text-green-300" 
                          : "text-amber-700 dark:text-amber-300"
                      )}>
                        {language === 'es' ? reimbursementSuggestion.reason : reimbursementSuggestion.reasonEn}
                      </p>
                      {reimbursementSuggestion.isReimbursable && !editedData.typically_reimbursable && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 mt-1 text-green-700 hover:bg-green-100"
                          onClick={() => updateField('typically_reimbursable', true)}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {language === 'es' ? 'Aplicar sugerencia' : 'Apply suggestion'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {isEditing ? (
                  <div className="space-y-2 p-3 bg-muted/30 rounded-md">
                    <div className="flex items-center justify-between">
                      <label className="text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-green-600" />
                        {language === 'es' ? 'Reembolsable por cliente' : 'Client reimbursable'}
                      </label>
                      <input
                        type="checkbox"
                        checked={editedData.typically_reimbursable || false}
                        onChange={(e) => updateField('typically_reimbursable', e.target.checked)}
                        className="h-4 w-4 rounded border-input"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-blue-600" />
                        {language === 'es' ? 'Deducible Fiscal' : 'Tax Deductible'}
                      </label>
                      <input
                        type="checkbox"
                        checked={editedData.cra_deductible || false}
                        onChange={(e) => updateField('cra_deductible', e.target.checked)}
                        className="h-4 w-4 rounded border-input"
                      />
                    </div>
                    {editedData.cra_deductible && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-muted-foreground">
                          {language === 'es' ? 'Tasa de deducción:' : 'Deduction rate:'}
                        </span>
                        <Select 
                          value={String(editedData.cra_deduction_rate || 100)}
                          onValueChange={(v) => updateField('cra_deduction_rate', parseInt(v))}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50">50%</SelectItem>
                            <SelectItem value="100">100%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-md">
                    {data.typically_reimbursable && (
                      <Badge className="bg-green-600">
                        <Building2 className="h-3 w-3 mr-1" />
                        {language === 'es' ? 'Reembolsable por cliente' : 'Client reimbursable'}
                      </Badge>
                    )}
                    {data.cra_deductible && (
                      <Badge className="bg-blue-600">
                        <Landmark className="h-3 w-3 mr-1" />
                        CRA {data.cra_deduction_rate}%
                      </Badge>
                    )}
                    {!data.typically_reimbursable && !data.cra_deductible && (
                      <span className="text-muted-foreground italic text-sm">
                        {language === 'es' ? 'Gasto personal' : 'Personal expense'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {language === 'es' ? 'Descripción' : 'Description'}
                </label>
                {isEditing ? (
                  <Textarea 
                    value={editedData.description || ''} 
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder={language === 'es' ? 'Descripción del gasto...' : 'Expense description...'}
                    className="min-h-[80px]"
                  />
                ) : (
                  <div className="p-3 bg-muted/50 rounded-md min-h-[60px]">
                    {data.description || <span className="text-muted-foreground italic">{language === 'es' ? 'Sin descripción' : 'No description'}</span>}
                  </div>
                )}
              </div>

              {/* Previous corrections */}
              {document.user_corrections && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="font-medium text-amber-800 mb-1 text-sm">
                    {language === 'es' ? 'Correcciones previas:' : 'Previous corrections:'}
                  </p>
                  <p className="text-amber-700 text-sm">{document.user_corrections}</p>
                </div>
              )}

              {/* Comment Input */}
              {showCommentInput && (
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg border">
                  <label className="text-sm font-medium">
                    {language === 'es' ? 'Añadir comentario o corrección:' : 'Add comment or correction:'}
                  </label>
                  <Textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={language === 'es' 
                      ? 'Ej: El monto correcto es $200, no $2000. O: Este gasto no es reembolsable por el cliente.'
                      : 'E.g., The correct amount is $200, not $2000. Or: This expense is not reimbursable by the client.'}
                    className="min-h-[100px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveComment} disabled={!comment.trim() || isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                      {language === 'es' ? 'Guardar' : 'Save'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowCommentInput(false); setComment(''); }}>
                      {language === 'es' ? 'Cancelar' : 'Cancel'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            {/* End scrollable area */}
            </div>

            {/* Action Buttons - Always visible at bottom */}
            <div className="flex gap-3 pt-4 border-t mt-4 shrink-0 bg-background pb-1">
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {language === 'es' ? '¿Eliminar este recibo?' : 'Delete this receipt?'}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {language === 'es' 
                          ? 'Esta acción no se puede deshacer. El recibo será eliminado permanentemente.'
                          : 'This action cannot be undone. The receipt will be permanently deleted.'}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{language === 'es' ? 'Cancelar' : 'Cancel'}</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={async () => {
                          await onDelete(document.id);
                          onOpenChange(false);
                        }}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {language === 'es' ? 'Eliminar' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              
              {isPending && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCommentInput(!showCommentInput)}
                    className="flex-1"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Comentar' : 'Comment'}
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Rechazar' : 'Reject'}
                  </Button>
                  <Button 
                    onClick={handleApprove} 
                    disabled={isLoading}
                    className="flex-1 bg-success hover:bg-success/90"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                    {isEditing && hasChanges 
                      ? (language === 'es' ? 'Guardar y Aprobar' : 'Save & Approve')
                      : (language === 'es' ? 'Aprobar' : 'Approve')}
                  </Button>
                </>
              )}

              {/* Save button for non-pending (already approved/rejected) receipts */}
              {!isPending && isEditing && hasChanges && (
                <Button 
                  onClick={handleSaveChanges} 
                  disabled={isLoading}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {language === 'es' ? 'Guardar Cambios' : 'Save Changes'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
