import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link, Upload, Image, Check, FileText, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface OrphanDocument {
  id: string;
  file_name: string;
  file_path: string;
  extracted_data: any;
  created_at: string;
}

interface LinkReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  expenseIds: string[];
}

export function LinkReceiptDialog({ open, onClose, expenseIds }: LinkReceiptDialogProps) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [orphanDocs, setOrphanDocs] = useState<OrphanDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from('documents')
      .select('id, file_name, file_path, extracted_data, created_at')
      .is('expense_id', null)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setOrphanDocs((data as OrphanDocument[]) || []);
        setLoading(false);
      });
  }, [open]);

  const handleLink = async (docId: string, expenseId: string) => {
    setLinking(docId);
    try {
      await supabase.from('expenses').update({ document_id: docId }).eq('id', expenseId);
      await supabase.from('documents').update({ expense_id: expenseId } as any).eq('id', docId);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(language === 'es' ? 'Recibo vinculado' : 'Receipt linked');
      setOrphanDocs(prev => prev.filter(d => d.id !== docId));
    } catch {
      toast.error(language === 'es' ? 'Error al vincular' : 'Error linking');
    } finally {
      setLinking(null);
    }
  };

  const getDocInfo = (doc: OrphanDocument) => {
    const data = doc.extracted_data || {};
    return {
      vendor: data.vendor || data.store_name || '—',
      amount: data.total || data.amount || null,
    };
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Vincular Recibos' : 'Link Receipts'}
          </DialogTitle>
          <DialogDescription>
            {language === 'es'
              ? 'Selecciona un documento para vincular a tus gastos sin recibo'
              : 'Select a document to link to your expenses without receipts'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-400">
            {language === 'es'
              ? `Tienes ${expenseIds.length} gastos sin recibo. Aquí puedes vincular documentos ya subidos (fotos de recibos) que no están asociados a ningún gasto.`
              : `You have ${expenseIds.length} expenses without receipts. Here you can link uploaded documents (receipt photos) that aren't associated with any expense.`}
          </p>
        </div>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            {language === 'es' ? 'Buscando documentos...' : 'Searching documents...'}
          </div>
        ) : orphanDocs.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              {language === 'es'
                ? 'No hay documentos sin vincular. Sube fotos de recibos desde Captura Rápida.'
                : 'No unlinked documents found. Upload receipt photos from Quick Capture.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {language === 'es' ? `${orphanDocs.length} documentos disponibles` : `${orphanDocs.length} documents available`}
            </p>
            {orphanDocs.map(doc => {
              const info = getDocInfo(doc);
              return (
                <Card key={doc.id} className="border hover:border-primary/30 transition-colors">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="shrink-0 p-2 rounded-lg bg-muted">
                      <Image className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {info.vendor !== '—' && <span>{info.vendor}</span>}
                        {info.amount && <span>${Number(info.amount).toFixed(2)}</span>}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={linking === doc.id}
                      onClick={() => {
                        if (expenseIds.length === 1) {
                          handleLink(doc.id, expenseIds[0]);
                        } else {
                          // For multiple expenses, link to the first unlinked one
                          handleLink(doc.id, expenseIds[0]);
                        }
                      }}
                      className="shrink-0"
                    >
                      {linking === doc.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <>
                          <Link className="h-3 w-3 mr-1" />
                          {language === 'es' ? 'Vincular' : 'Link'}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
