import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { 
  Upload, 
  FileSpreadsheet, 
  Camera, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
  File
} from 'lucide-react';
import { parseCSV, ParsedTransaction, useCreateBankTransactions } from '@/hooks/data/useBankTransactions';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BankImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function BankImportDialog({ open, onClose }: BankImportDialogProps) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'csv' | 'photo' | 'pdf'>('csv');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
  const createTransactions = useCreateBankTransactions();

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsLoading(true);

    try {
      const text = await file.text();
      const transactions = parseCSV(text);
      
      if (transactions.length === 0) {
        toast.error(
          language === 'es'
            ? 'No se encontraron transacciones válidas en el archivo'
            : 'No valid transactions found in the file'
        );
        return;
      }

      setParsedTransactions(transactions);
      toast.success(
        language === 'es'
          ? `${transactions.length} transacciones detectadas`
          : `${transactions.length} transactions detected`
      );
    } catch (error) {
      console.error('CSV parse error:', error);
      toast.error(
        language === 'es'
          ? 'Error al procesar el archivo CSV. Verifica el formato.'
          : 'Error processing CSV file. Please check the format.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsLoading(true);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call edge function to process with AI
      const { data, error } = await supabase.functions.invoke('process-bank-statement', {
        body: { image: base64 }
      });

      if (error) throw error;

      if (data.transactions && data.transactions.length > 0) {
        setParsedTransactions(data.transactions);
        toast.success(
          language === 'es'
            ? `${data.transactions.length} transacciones extraídas`
            : `${data.transactions.length} transactions extracted`
        );
      } else {
        toast.error(
          language === 'es'
            ? 'No se pudieron extraer transacciones de la imagen'
            : 'Could not extract transactions from the image'
        );
      }
    } catch (error) {
      console.error('Photo processing error:', error);
      toast.error(
        language === 'es'
          ? 'Error al procesar la imagen. Intenta con una foto más clara.'
          : 'Error processing image. Try with a clearer photo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsLoading(true);

    try {
      // Convert PDF to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call edge function to process PDF with AI
      const { data, error } = await supabase.functions.invoke('analyze-bank-statement', {
        body: { 
          content: base64, 
          contentType: 'pdf',
          bankName: file.name.replace('.pdf', ''),
        }
      });

      if (error) throw error;

      if (data.transactions && data.transactions.length > 0) {
        setParsedTransactions(data.transactions.map((t: any) => ({
          date: t.date,
          amount: Math.abs(t.amount),
          description: t.description,
        })));
        toast.success(
          language === 'es'
            ? `${data.transactions.length} transacciones extraídas del PDF`
            : `${data.transactions.length} transactions extracted from PDF`
        );
      } else {
        toast.error(
          language === 'es'
            ? 'No se pudieron extraer transacciones del PDF'
            : 'Could not extract transactions from PDF'
        );
      }
    } catch (error) {
      console.error('PDF processing error:', error);
      toast.error(
        language === 'es'
          ? 'Error al procesar el PDF. Verifica que sea un estado de cuenta válido.'
          : 'Error processing PDF. Make sure it is a valid bank statement.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const removeTransaction = (index: number) => {
    setParsedTransactions(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (parsedTransactions.length === 0) return;

    const transactionsToImport = parsedTransactions.map(t => ({
      transaction_date: t.date,
      amount: t.amount,
      description: t.description,
      status: 'pending' as const,
      matched_expense_id: null,
    }));

    await createTransactions.mutateAsync(transactionsToImport);
    handleClose();
  };

  const handleClose = () => {
    setParsedTransactions([]);
    setSelectedFile(null);
    setIsLoading(false);
    onClose();
  };

  const totalAmount = parsedTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Importar Estado Bancario' : 'Import Bank Statement'}
          </DialogTitle>
          <DialogDescription>
            {language === 'es'
              ? 'Sube tu estado de cuenta en CSV o toma una foto para extraer transacciones automáticamente'
              : 'Upload your bank statement as CSV or take a photo to automatically extract transactions'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'csv' | 'photo' | 'pdf')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex items-center gap-2">
              <File className="h-4 w-4" />
              PDF
            </TabsTrigger>
            <TabsTrigger value="photo" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              {language === 'es' ? 'Foto' : 'Photo'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="mt-4">
            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
                <div 
                  className="flex flex-col items-center gap-4 cursor-pointer"
                  onClick={() => csvInputRef.current?.click()}
                >
                  {isLoading ? (
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                  )}
                  <div className="text-center">
                    <p className="font-medium">
                      {language === 'es' 
                        ? 'Arrastra tu archivo CSV aquí' 
                        : 'Drag your CSV file here'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === 'es'
                        ? 'o haz clic para seleccionar'
                        : 'or click to select'}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {language === 'es' ? 'Formatos: CSV, Excel' : 'Formats: CSV, Excel'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">
                {language === 'es' ? '¿Cómo obtener el CSV?' : 'How to get the CSV?'}
              </h4>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>{language === 'es' ? 'Ingresa a tu banca en línea' : 'Log into your online banking'}</li>
                <li>{language === 'es' ? 'Busca "Exportar" o "Descargar transacciones"' : 'Look for "Export" or "Download transactions"'}</li>
                <li>{language === 'es' ? 'Selecciona formato CSV' : 'Select CSV format'}</li>
                <li>{language === 'es' ? 'Sube el archivo aquí' : 'Upload the file here'}</li>
              </ol>
            </div>
          </TabsContent>

          <TabsContent value="pdf" className="mt-4">
            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePDFUpload}
                  className="hidden"
                />
                <div 
                  className="flex flex-col items-center gap-4 cursor-pointer"
                  onClick={() => pdfInputRef.current?.click()}
                >
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">
                        {language === 'es' ? 'Procesando PDF...' : 'Processing PDF...'}
                      </p>
                    </div>
                  ) : (
                    <File className="h-12 w-12 text-muted-foreground" />
                  )}
                  <div className="text-center">
                    <p className="font-medium">
                      {language === 'es' 
                        ? 'Sube el PDF de tu estado de cuenta' 
                        : 'Upload your bank statement PDF'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === 'es'
                        ? 'EvoFinz extraerá y clasificará las transacciones'
                        : 'EvoFinz will extract and classify transactions'}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {language === 'es' ? 'Tecnología Smart' : 'Smart Technology'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">
                {language === 'es' ? 'PDFs compatibles' : 'Compatible PDFs'}
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>{language === 'es' ? 'Estados de cuenta de cualquier banco' : 'Bank statements from any bank'}</li>
                <li>{language === 'es' ? 'Extractos de tarjetas de crédito' : 'Credit card statements'}</li>
                <li>{language === 'es' ? 'Reportes de PayPal, Stripe, etc.' : 'PayPal, Stripe reports, etc.'}</li>
              </ul>
            </div>
          </TabsContent>
          <TabsContent value="photo" className="mt-4">
            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div 
                  className="flex flex-col items-center gap-4 cursor-pointer"
                  onClick={() => photoInputRef.current?.click()}
                >
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">
                        {language === 'es' ? 'Extrayendo datos...' : 'Extracting data...'}
                      </p>
                    </div>
                  ) : (
                    <Camera className="h-12 w-12 text-muted-foreground" />
                  )}
                  <div className="text-center">
                    <p className="font-medium">
                      {language === 'es' 
                        ? 'Toma una foto de tu estado de cuenta' 
                        : 'Take a photo of your bank statement'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === 'es'
                        ? 'EvoFinz extraerá las transacciones automáticamente'
                        : 'EvoFinz will extract transactions automatically'}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {language === 'es' ? 'Tecnología Smart' : 'Smart Technology'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                {language === 'es' ? 'Para mejores resultados' : 'For best results'}
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>{language === 'es' ? 'Asegúrate de que la foto esté bien iluminada' : 'Make sure the photo is well lit'}</li>
                <li>{language === 'es' ? 'Captura toda la tabla de transacciones' : 'Capture the entire transactions table'}</li>
                <li>{language === 'es' ? 'Evita reflejos y sombras' : 'Avoid reflections and shadows'}</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {/* Parsed Transactions Preview */}
        {parsedTransactions.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                {language === 'es' 
                  ? `${parsedTransactions.length} transacciones detectadas`
                  : `${parsedTransactions.length} transactions detected`}
              </h3>
              <Badge variant="outline" className="text-lg">
                ${totalAmount.toFixed(2)}
              </Badge>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {parsedTransactions.map((transaction, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">
                          {transaction.description || (language === 'es' ? 'Sin descripción' : 'No description')}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(transaction.date), 'dd MMM yyyy', { 
                            locale: language === 'es' ? es : undefined 
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-destructive">
                        -${transaction.amount.toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeTransaction(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button 
                onClick={handleImport} 
                className="flex-1 bg-gradient-primary"
                disabled={createTransactions.isPending}
              >
                {createTransactions.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {language === 'es' ? 'Importar Transacciones' : 'Import Transactions'}
              </Button>
            </div>
          </div>
        )}

        {/* Empty state when no file selected */}
        {parsedTransactions.length === 0 && selectedFile && !isLoading && (
          <div className="mt-4 p-4 bg-destructive/10 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-sm">
                {language === 'es' ? 'No se encontraron transacciones' : 'No transactions found'}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'es' 
                  ? 'Verifica que el archivo tenga el formato correcto'
                  : 'Check that the file has the correct format'}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
