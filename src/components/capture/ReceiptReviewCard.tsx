import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { EXPENSE_CATEGORIES } from '@/lib/constants/expense-categories';
import { 
  Check, X, Loader2, Eye,
  AlertTriangle, CheckCircle2, Clock, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ReceiptReviewDialog } from './ReceiptReviewDialog';

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

interface ReceiptReviewCardProps {
  document: ReceiptDocument;
  imageUrl: string | null;
  onApprove: (id: string, data: ExtractedData) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onAddComment: (id: string, comment: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isLoading?: boolean;
  onDataExtracted?: () => void;
}

export function ReceiptReviewCard({ 
  document, 
  imageUrl, 
  onApprove, 
  onReject,
  onAddComment,
  onDelete,
  isLoading,
  onDataExtracted 
}: ReceiptReviewCardProps) {
  const { language } = useLanguage();
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  const data = document.extracted_data || {};
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

  return (
    <>
      <Card 
        className={cn(
          "overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:border-primary/50",
          isPending && "ring-2 ring-primary/20"
        )}
        onClick={() => setShowReviewDialog(true)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm truncate flex-1">{document.file_name}</CardTitle>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-muted-foreground">
            {format(new Date(document.created_at), "dd MMM yyyy HH:mm", { locale: language === 'es' ? es : undefined })}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Thumbnail Image */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
            {imageUrl ? (
              <>
                <img 
                  src={imageUrl} 
                  alt={document.file_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="h-6 w-6 text-white" />
                  <span className="text-white ml-2 text-sm font-medium">
                    {language === 'es' ? 'Ver y revisar' : 'View & review'}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Quick Data Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate">{data.vendor || 'Sin proveedor'}</span>
              <span className="font-bold">${data.amount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{data.date || 'Sin fecha'}</span>
              <Badge variant="secondary" className="text-xs">
                {EXPENSE_CATEGORIES.find(c => c.value === data.category)?.label || 'Sin categoría'}
              </Badge>
            </div>
          </div>

          {/* Quick Action Buttons */}
          {isPending && (
            <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowReviewDialog(true)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-1" />
                {language === 'es' ? 'Revisar' : 'Review'}
              </Button>
              <Button 
                size="sm" 
                onClick={async (e) => {
                  e.stopPropagation();
                  await onApprove(document.id, data);
                }} 
                disabled={isLoading}
                className="flex-1 bg-success hover:bg-success/90"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                {language === 'es' ? 'Aprobar' : 'Approve'}
              </Button>
            </div>
          )}

          {/* Delete Button - Always visible */}
          {onDelete && (
            <div className="pt-2" onClick={(e) => e.stopPropagation()}>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (window.confirm(language === 'es' ? '¿Eliminar este recibo?' : 'Delete this receipt?')) {
                    await onDelete(document.id);
                  }
                }} 
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {language === 'es' ? 'Eliminar' : 'Delete'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <ReceiptReviewDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        document={document}
        imageUrl={imageUrl}
        onApprove={onApprove}
        onReject={onReject}
        onAddComment={onAddComment}
        onDelete={onDelete}
        isLoading={isLoading}
        onDataExtracted={onDataExtracted ? () => onDataExtracted() : undefined}
      />
    </>
  );
}
