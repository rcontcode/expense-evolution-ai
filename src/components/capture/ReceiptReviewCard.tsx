import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClients } from '@/hooks/data/useClients';
import { EXPENSE_CATEGORIES } from '@/lib/constants/expense-categories';
import { 
  Check, X, Edit2, MessageSquare, Loader2, ZoomIn, 
  Building2, Landmark, Calendar, DollarSign, Tag, Store,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';
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

interface ReceiptReviewCardProps {
  document: ReceiptDocument;
  imageUrl: string | null;
  onApprove: (id: string, data: ExtractedData) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onAddComment: (id: string, comment: string) => Promise<void>;
  isLoading?: boolean;
}

export function ReceiptReviewCard({ 
  document, 
  imageUrl, 
  onApprove, 
  onReject,
  onAddComment,
  isLoading 
}: ReceiptReviewCardProps) {
  const { language } = useLanguage();
  const { data: clients = [] } = useClients();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [comment, setComment] = useState('');
  const [editedData, setEditedData] = useState<ExtractedData>(document.extracted_data || {});

  const handleApprove = async () => {
    await onApprove(document.id, editedData);
    setIsEditing(false);
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      setShowCommentInput(true);
      return;
    }
    await onReject(document.id, comment);
    setComment('');
    setShowCommentInput(false);
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

  const data = isEditing ? editedData : (document.extracted_data || {});
  const hasChanges = JSON.stringify(editedData) !== JSON.stringify(document.extracted_data);

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

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base truncate flex-1">{document.file_name}</CardTitle>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-muted-foreground">
            {format(new Date(document.created_at), "dd MMM yyyy HH:mm", { locale: language === 'es' ? es : undefined })}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Image and Data Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Receipt Image */}
            <div 
              className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => imageUrl && setShowImageZoom(true)}
            >
              {imageUrl ? (
                <>
                  <img 
                    src={imageUrl} 
                    alt={document.file_name}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="h-8 w-8 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Extracted Data */}
            <div className="space-y-3">
              {isEditing ? (
                // Edit Mode
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium flex items-center gap-1">
                      <Store className="h-3 w-3" /> {language === 'es' ? 'Proveedor' : 'Vendor'}
                    </label>
                    <Input 
                      value={editedData.vendor || ''} 
                      onChange={(e) => updateField('vendor', e.target.value)}
                      placeholder="Ej: Shell, Starbucks..."
                      className="h-8 text-sm"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> {language === 'es' ? 'Monto' : 'Amount'}
                      </label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={editedData.amount || ''} 
                        onChange={(e) => updateField('amount', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {language === 'es' ? 'Fecha' : 'Date'}
                      </label>
                      <Input 
                        type="date"
                        value={editedData.date || ''} 
                        onChange={(e) => updateField('date', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium flex items-center gap-1">
                      <Tag className="h-3 w-3" /> {language === 'es' ? 'Categoría' : 'Category'}
                    </label>
                    <Select value={editedData.category || 'other'} onValueChange={(v) => updateField('category', v)}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">{language === 'es' ? 'Descripción' : 'Description'}</label>
                    <Textarea 
                      value={editedData.description || ''} 
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder={language === 'es' ? 'Descripción del gasto...' : 'Expense description...'}
                      className="min-h-[60px] text-sm"
                    />
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{data.vendor || 'Sin proveedor'}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold">${data.amount?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{data.date || 'Sin fecha'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">
                      {EXPENSE_CATEGORIES.find(c => c.value === data.category)?.label || data.category || 'Sin categoría'}
                    </Badge>
                  </div>

                  {/* Reimbursement badges */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {data.typically_reimbursable && (
                      <Badge className="bg-green-600 text-xs">
                        <Building2 className="h-3 w-3 mr-1" />Reembolsable
                      </Badge>
                    )}
                    {data.cra_deductible && (
                      <Badge className="bg-blue-600 text-xs">
                        <Landmark className="h-3 w-3 mr-1" />CRA {data.cra_deduction_rate}%
                      </Badge>
                    )}
                  </div>

                  {data.description && (
                    <p className="text-xs text-muted-foreground p-2 bg-muted/30 rounded italic">
                      {data.description}
                    </p>
                  )}

                  {/* Previous corrections */}
                  {document.user_corrections && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                      <p className="font-medium text-amber-800 mb-1">
                        {language === 'es' ? 'Correcciones previas:' : 'Previous corrections:'}
                      </p>
                      <p className="text-amber-700">{document.user_corrections}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Comment Input */}
          {showCommentInput && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <label className="text-sm font-medium">
                {language === 'es' ? 'Describe el error o corrección:' : 'Describe the error or correction:'}
              </label>
              <Textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={language === 'es' 
                  ? 'Ej: El monto correcto es $200, no $2000. O: Este gasto no es reembolsable por el cliente.'
                  : 'E.g., The correct amount is $200, not $2000. Or: This expense is not reimbursable by the client.'}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveComment} disabled={!comment.trim() || isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                  {language === 'es' ? 'Guardar Comentario' : 'Save Comment'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowCommentInput(false); setComment(''); }}>
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {document.review_status === 'pending_review' && (
            <div className="flex gap-2 pt-2">
              {isEditing ? (
                <>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => { setIsEditing(false); setEditedData(document.extracted_data || {}); }}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-1" />
                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleApprove} 
                    disabled={isLoading || !hasChanges}
                    className="flex-1 bg-success hover:bg-success/90"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                    {language === 'es' ? 'Guardar y Aprobar' : 'Save & Approve'}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowCommentInput(!showCommentInput)}
                    className="flex-1"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {language === 'es' ? 'Comentar' : 'Comment'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    onClick={() => { setIsEditing(true); setEditedData(document.extracted_data || {}); }}
                    className="flex-1"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    {language === 'es' ? 'Editar' : 'Edit'}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleApprove} 
                    disabled={isLoading}
                    className="flex-1 bg-success hover:bg-success/90"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                    {language === 'es' ? 'Aprobar' : 'Approve'}
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Zoom Dialog */}
      <Dialog open={showImageZoom} onOpenChange={setShowImageZoom}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{document.file_name}</DialogTitle>
          </DialogHeader>
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt={document.file_name}
              className="w-full h-auto max-h-[75vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
