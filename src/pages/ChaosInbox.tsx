import { useState, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, FileText, Camera, Loader2, RefreshCw, 
  CheckCircle2, Clock, AlertTriangle, X, Sparkles,
  Smartphone, Monitor, Video
} from 'lucide-react';
import { toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { InfoTooltip, TOOLTIP_CONTENT } from '@/components/ui/info-tooltip';
import { ReceiptReviewCard, ReceiptDocument, ExtractedData } from '@/components/capture/ReceiptReviewCard';
import { 
  useDocumentsForReview, 
  useDocumentReviewActions, 
  useRealtimeDocuments,
  useDocumentImageUrl 
} from '@/hooks/data/useDocumentReview';
import { ContinuousCameraDialog, CapturedPhoto } from '@/components/capture/ContinuousCameraDialog';
import { cn } from '@/lib/utils';

function DocumentImageWrapper({ document, onApprove, onReject, onAddComment, isLoading }: {
  document: ReceiptDocument;
  onApprove: (id: string, data: ExtractedData) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onAddComment: (id: string, comment: string) => Promise<void>;
  isLoading?: boolean;
}) {
  const imageUrl = useDocumentImageUrl(document.file_path);
  
  return (
    <ReceiptReviewCard
      document={document}
      imageUrl={imageUrl}
      onApprove={onApprove}
      onReject={onReject}
      onAddComment={onAddComment}
      isLoading={isLoading}
    />
  );
}

export default function ChaosInbox() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const { data: documents = [], isLoading, refetch } = useDocumentsForReview();
  const { approveDocument, rejectDocument, addComment } = useDocumentReviewActions();
  
  // Enable realtime sync
  useRealtimeDocuments();

  const pendingDocs = documents.filter(d => d.review_status === 'pending_review');
  const approvedDocs = documents.filter(d => d.review_status === 'approved');
  const needsCorrectionDocs = documents.filter(d => d.review_status === 'needs_correction');
  const rejectedDocs = documents.filter(d => d.review_status === 'rejected');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('expense-documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Convert to base64 for AI processing
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        // Create document record
        const { data: doc, error: dbError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            file_path: fileName,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            status: 'pending',
            review_status: 'pending_review',
          })
          .select()
          .single();

        if (dbError) throw dbError;

        // Process with AI
        if (doc) {
          setProcessing(doc.id);
          try {
            const { data: result, error: aiError } = await supabase.functions.invoke('process-receipt', {
              body: { imageBase64: base64 },
            });

            if (!aiError && result?.expenses?.length > 0) {
              const extractedData: ExtractedData = result.expenses[0];
              
              await supabase
                .from('documents')
                .update({ 
                  extracted_data: JSON.parse(JSON.stringify(extractedData)),
                  status: 'classified' 
                } as any)
                .eq('id', doc.id);
            }
          } catch (aiErr) {
            console.error('AI processing failed:', aiErr);
          } finally {
            setProcessing(null);
          }
        }
      }

      toast.success(
        language === 'es' 
          ? `${files.length} recibo(s) subido(s) - revisa los datos extraídos`
          : `${files.length} receipt(s) uploaded - review extracted data`
      );
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApprove = async (id: string, data: ExtractedData) => {
    await approveDocument.mutateAsync({ id, data });
  };

  const handleReject = async (id: string, reason: string) => {
    await rejectDocument.mutateAsync({ id, reason });
  };

  const handleAddComment = async (id: string, comment: string) => {
    await addComment.mutateAsync({ id, comment });
  };

  const handleCameraPhotos = async (photos: CapturedPhoto[]) => {
    if (!user || photos.length === 0) return;

    setUploading(true);

    try {
      for (const photo of photos) {
        // Convert dataUrl to blob
        const response = await fetch(photo.dataUrl);
        const blob = await response.blob();
        
        const fileName = `${user.id}/${Date.now()}.jpg`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('expense-documents')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        // Create document record
        const { data: doc, error: dbError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            file_path: fileName,
            file_name: `receipt-${Date.now()}.jpg`,
            file_type: 'image/jpeg',
            file_size: blob.size,
            status: 'pending',
            review_status: 'pending_review',
          })
          .select()
          .single();

        if (dbError) throw dbError;

        // Process with AI
        if (doc) {
          setProcessing(doc.id);
          try {
            const { data: result, error: aiError } = await supabase.functions.invoke('process-receipt', {
              body: { imageBase64: photo.dataUrl },
            });

            if (!aiError && result?.expenses?.length > 0) {
              const extractedData: ExtractedData = result.expenses[0];
              
              await supabase
                .from('documents')
                .update({ 
                  extracted_data: JSON.parse(JSON.stringify(extractedData)),
                  status: 'classified' 
                } as any)
                .eq('id', doc.id);
            }
          } catch (aiErr) {
            console.error('AI processing failed:', aiErr);
          } finally {
            setProcessing(null);
          }
        }
      }

      toast.success(
        language === 'es' 
          ? `${photos.length} recibo(s) capturado(s) - revisa los datos extraídos`
          : `${photos.length} receipt(s) captured - review extracted data`
      );
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <TooltipProvider>
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Sparkles className="h-8 w-8 text-primary" />
                  {language === 'es' ? 'Bandeja de Recibos' : 'Receipt Inbox'}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {language === 'es' 
                    ? 'Sube fotos desde tu celular y revisa los datos extraídos aquí'
                    : 'Upload photos from your phone and review extracted data here'}
                </p>
              </div>
              <InfoTooltip content={TOOLTIP_CONTENT.chaosInbox} />
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                {language === 'es' ? 'Actualizar' : 'Refresh'}
              </Button>
              
              {/* Continuous Camera Button - Mobile optimized */}
              <Button
                variant="outline"
                onClick={() => setCameraDialogOpen(true)}
                className="bg-primary/10 border-primary/30 hover:bg-primary/20"
              >
                <Video className="mr-2 h-4 w-4" />
                {language === 'es' ? 'Cámara Continua' : 'Continuous Camera'}
              </Button>
              
              <label htmlFor="file-upload">
                <Button disabled={uploading} asChild className="bg-gradient-primary">
                  <span className="cursor-pointer">
                    {uploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="mr-2 h-4 w-4" />
                    )}
                    {uploading 
                      ? (language === 'es' ? 'Subiendo...' : 'Uploading...')
                      : (language === 'es' ? 'Subir Recibos' : 'Upload Receipts')}
                  </span>
                </Button>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Mobile/Desktop Sync Info */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-primary">
                  <Smartphone className="h-5 w-5" />
                  <span className="text-lg">→</span>
                  <Monitor className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">
                    {language === 'es' 
                      ? 'Sincronización en tiempo real' 
                      : 'Real-time sync'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'es' 
                      ? 'Toma fotos con tu celular y aparecerán automáticamente aquí para revisión en tu laptop'
                      : 'Take photos with your phone and they will automatically appear here for review on your laptop'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 mx-auto text-warning mb-2" />
                <p className="text-2xl font-bold">{pendingDocs.length}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'es' ? 'Por Revisar' : 'Pending Review'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-6 w-6 mx-auto text-amber-500 mb-2" />
                <p className="text-2xl font-bold">{needsCorrectionDocs.length}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'es' ? 'Con Comentarios' : 'With Comments'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="h-6 w-6 mx-auto text-success mb-2" />
                <p className="text-2xl font-bold">{approvedDocs.length}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'es' ? 'Aprobados' : 'Approved'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <X className="h-6 w-6 mx-auto text-destructive mb-2" />
                <p className="text-2xl font-bold">{rejectedDocs.length}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'es' ? 'Rechazados' : 'Rejected'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {language === 'es' ? 'Por Revisar' : 'Pending'} ({pendingDocs.length})
              </TabsTrigger>
              <TabsTrigger value="corrections" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {language === 'es' ? 'Correcciones' : 'Corrections'} ({needsCorrectionDocs.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {language === 'es' ? 'Aprobados' : 'Approved'} ({approvedDocs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingDocs.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">
                      {language === 'es' ? 'No hay recibos pendientes' : 'No pending receipts'}
                    </p>
                    <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
                      {language === 'es' 
                        ? 'Sube fotos de tus recibos desde tu celular o computadora para que la IA extraiga los datos automáticamente'
                        : 'Upload photos of your receipts from your phone or computer for AI to automatically extract the data'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {pendingDocs.map((doc) => (
                    <DocumentImageWrapper
                      key={doc.id}
                      document={doc}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onAddComment={handleAddComment}
                      isLoading={approveDocument.isPending || processing === doc.id}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="corrections">
              {needsCorrectionDocs.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-success mb-4" />
                    <p className="text-lg font-medium">
                      {language === 'es' ? 'Sin correcciones pendientes' : 'No pending corrections'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {needsCorrectionDocs.map((doc) => (
                    <DocumentImageWrapper
                      key={doc.id}
                      document={doc}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onAddComment={handleAddComment}
                      isLoading={approveDocument.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved">
              {approvedDocs.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">
                      {language === 'es' ? 'Aún no has aprobado recibos' : 'No approved receipts yet'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {approvedDocs.map((doc) => (
                    <DocumentImageWrapper
                      key={doc.id}
                      document={doc}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onAddComment={handleAddComment}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </TooltipProvider>

      {/* Continuous Camera Dialog */}
      <ContinuousCameraDialog
        open={cameraDialogOpen}
        onOpenChange={setCameraDialogOpen}
        onSubmitPhotos={handleCameraPhotos}
      />
    </Layout>
  );
}
