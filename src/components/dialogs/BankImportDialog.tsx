import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { 
  Upload, FileSpreadsheet, Camera, Loader2, CheckCircle2, AlertCircle,
  Trash2, Calendar, DollarSign, File, ArrowRight, ArrowDownCircle,
  ArrowUpCircle, RotateCcw, AlertTriangle, Sparkles, Check
} from 'lucide-react';
import { parseCSV, ParsedTransaction } from '@/hooks/data/useBankTransactions';
import { useBankImportFlow, EnrichedTransaction } from '@/hooks/data/useBankImportFlow';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BankImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function BankImportDialog({ open, onClose }: BankImportDialogProps) {
  const { language } = useLanguage();
  const l = language === 'es';
  const [activeTab, setActiveTab] = useState<'csv' | 'photo' | 'pdf'>('csv');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<EnrichedTransaction[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
  const importFlow = useBankImportFlow();
  const { state } = importFlow;

  // Track source type when files are selected
  const trackSource = (type: 'csv' | 'pdf' | 'photo', fileName: string) => {
    importFlow.setSource(type, fileName);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setIsLoading(true);
    try {
      const text = await file.text();
      const transactions = parseCSV(text);
      if (transactions.length === 0) {
        toast.error(l ? 'No se encontraron transacciones válidas' : 'No valid transactions found');
        return;
      }
      setParsedTransactions(transactions.map(t => ({
        ...t,
        original_amount: t.amount,
      })));
      toast.success(l ? `${transactions.length} transacciones detectadas` : `${transactions.length} transactions detected`);
    } catch (error) {
      console.error('CSV parse error:', error);
      toast.error(l ? 'Error al procesar el CSV' : 'Error processing CSV');
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
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke('process-bank-statement', { body: { image: base64 } });
      if (error) throw error;
      if (data.transactions?.length > 0) {
        setParsedTransactions(data.transactions.map((t: ParsedTransaction) => ({
          ...t, original_amount: t.amount,
        })));
        toast.success(l ? `${data.transactions.length} transacciones extraídas` : `${data.transactions.length} transactions extracted`);
      } else {
        toast.error(l ? 'No se pudieron extraer transacciones' : 'Could not extract transactions');
      }
    } catch (error) {
      console.error('Photo error:', error);
      toast.error(l ? 'Error al procesar la imagen' : 'Error processing image');
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
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke('analyze-bank-statement', {
        body: { content: base64, contentType: 'pdf', bankName: file.name.replace('.pdf', '') },
      });
      if (error) throw error;
      if (data.transactions?.length > 0) {
        setParsedTransactions(data.transactions.map((t: any) => ({
          date: t.date,
          amount: Math.abs(t.amount),
          description: t.description,
          original_amount: t.amount,
          transaction_type: t.type === 'credit' ? 'income' : 'expense',
          category: t.category,
          is_recurring: t.isRecurring || false,
          recurring_type: t.recurringType || null,
          bank_name: t.bank || undefined,
        })));
        toast.success(l ? `${data.transactions.length} transacciones extraídas del PDF` : `${data.transactions.length} transactions extracted from PDF`);
      } else {
        toast.error(l ? 'No se pudieron extraer transacciones del PDF' : 'Could not extract transactions from PDF');
      }
    } catch (error) {
      console.error('PDF error:', error);
      toast.error(l ? 'Error al procesar el PDF' : 'Error processing PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const removeTransaction = (index: number) => {
    setParsedTransactions(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartImport = async () => {
    if (parsedTransactions.length === 0) return;
    await importFlow.checkDuplicates(parsedTransactions);
  };

  const handleClose = () => {
    setParsedTransactions([]);
    setSelectedFile(null);
    setIsLoading(false);
    importFlow.reset();
    onClose();
  };

  const totalAmount = parsedTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Render based on import flow step
  if (state.step === 'duplicates') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              {l ? 'Duplicados Detectados' : 'Duplicates Detected'}
            </DialogTitle>
            <DialogDescription>
              {l
                ? `Se encontraron ${state.duplicates.length} transacciones que ya existen en tu cuenta.`
                : `Found ${state.duplicates.length} transactions that already exist in your account.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {state.duplicates.slice(0, 10).map((dup, i) => (
              <Card key={i} className="p-3 border-warning/30 bg-warning/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{dup.transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {dup.transaction.date} • ${dup.transaction.amount.toFixed(2)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-warning border-warning/50">
                    {l ? 'Duplicado' : 'Duplicate'}
                  </Badge>
                </div>
              </Card>
            ))}
            {state.duplicates.length > 10 && (
              <p className="text-sm text-muted-foreground text-center">
                +{state.duplicates.length - 10} {l ? 'más' : 'more'}...
              </p>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium">{l ? 'Resumen:' : 'Summary:'}</p>
            <p className="text-muted-foreground">
              {l
                ? `${state.newTransactions.length} nuevas + ${state.duplicates.length} duplicadas = ${state.transactions.length} total`
                : `${state.newTransactions.length} new + ${state.duplicates.length} duplicates = ${state.transactions.length} total`}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => importFlow.proceedWithImport(false)} className="flex-1">
              {l ? `Importar solo ${state.newTransactions.length} nuevas` : `Import only ${state.newTransactions.length} new`}
            </Button>
            <Button onClick={() => importFlow.proceedWithImport(true)} className="flex-1">
              {l ? 'Importar todas' : 'Import all'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (state.step === 'classifying') {
    const progress = state.classifyProgress.total > 0
      ? (state.classifyProgress.current / state.classifyProgress.total) * 100
      : 0;

    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              {l ? 'Clasificando con IA...' : 'AI Classifying...'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-center text-muted-foreground">
              {state.classifyProgress.total > 0
                ? (l
                  ? `Lote ${state.classifyProgress.current} de ${state.classifyProgress.total}`
                  : `Batch ${state.classifyProgress.current} of ${state.classifyProgress.total}`)
                : (l ? 'Insertando transacciones...' : 'Inserting transactions...')}
            </p>
            <p className="text-xs text-center text-muted-foreground">
              {l
                ? 'Detectando ingresos, gastos, categorías y pagos recurrentes...'
                : 'Detecting income, expenses, categories, and recurring payments...'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (state.step === 'summary' && state.classifiedSummary) {
    const s = state.classifiedSummary;
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              {l ? 'Clasificación Completa' : 'Classification Complete'}
            </DialogTitle>
            <DialogDescription>
              {l
                ? `${state.insertedIds.length} transacciones importadas y clasificadas`
                : `${state.insertedIds.length} transactions imported and classified`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-2">
            <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium">{l ? 'Ingresos' : 'Income'}</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{s.incomeCount}</p>
              <p className="text-xs text-muted-foreground">${s.incomeTotal.toFixed(2)}</p>
            </Card>

            <Card className="p-4 bg-red-500/10 border-red-500/20">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">{l ? 'Gastos' : 'Expenses'}</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{s.expenseCount}</p>
              <p className="text-xs text-muted-foreground">${s.expenseTotal.toFixed(2)}</p>
            </Card>

            <Card className="p-4 bg-primary/10 border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <RotateCcw className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{l ? 'Recurrentes' : 'Recurring'}</span>
              </div>
              <p className="text-2xl font-bold">{s.recurringCount}</p>
            </Card>

            {s.unclassifiedCount > 0 && (
              <Card className="p-4 bg-warning/10 border-warning/20">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium">{l ? 'Sin clasificar' : 'Unclassified'}</span>
                </div>
                <p className="text-2xl font-bold">{s.unclassifiedCount}</p>
              </Card>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              {l ? 'Solo importar' : 'Import only'}
            </Button>
            <Button onClick={() => importFlow.autoCreateRecords()} className="flex-1 bg-gradient-primary">
              <Check className="h-4 w-4 mr-2" />
              {l ? 'Crear gastos e ingresos' : 'Create expenses & income'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {l
              ? 'Esto creará registros de gastos e ingresos automáticamente desde las transacciones bancarias'
              : 'This will auto-create expense and income records from bank transactions'}
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  if (state.step === 'done') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold text-center">
              {l ? '¡Importación completa!' : 'Import complete!'}
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              {l
                ? 'Tus transacciones bancarias han sido importadas, clasificadas y vinculadas automáticamente.'
                : 'Your bank transactions have been imported, classified and linked automatically.'}
            </p>
            <Button onClick={handleClose} className="w-full">
              {l ? 'Cerrar' : 'Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Default: Upload step
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            {l ? 'Importar Estado Bancario' : 'Import Bank Statement'}
          </DialogTitle>
          <DialogDescription>
            {l
              ? 'Sube tu estado de cuenta y EvoFinz clasificará todo automáticamente'
              : 'Upload your bank statement and EvoFinz will classify everything automatically'}
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
              {l ? 'Foto' : 'Photo'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="mt-4">
            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <input ref={csvInputRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
                <div className="flex flex-col items-center gap-4 cursor-pointer" onClick={() => csvInputRef.current?.click()}>
                  {isLoading ? (
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                  )}
                  <div className="text-center">
                    <p className="font-medium">{l ? 'Sube tu archivo CSV' : 'Upload your CSV file'}</p>
                    <p className="text-sm text-muted-foreground mt-1">{l ? 'o haz clic para seleccionar' : 'or click to select'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pdf" className="mt-4">
            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <input ref={pdfInputRef} type="file" accept=".pdf" onChange={handlePDFUpload} className="hidden" />
                <div className="flex flex-col items-center gap-4 cursor-pointer" onClick={() => pdfInputRef.current?.click()}>
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">{l ? 'Procesando PDF...' : 'Processing PDF...'}</p>
                    </div>
                  ) : (
                    <File className="h-12 w-12 text-muted-foreground" />
                  )}
                  <div className="text-center">
                    <p className="font-medium">{l ? 'Sube el PDF de tu estado de cuenta' : 'Upload your bank statement PDF'}</p>
                    <p className="text-sm text-muted-foreground mt-1">{l ? 'EvoFinz clasificará todo automáticamente' : 'EvoFinz will classify everything automatically'}</p>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {l ? 'IA Smart' : 'Smart AI'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photo" className="mt-4">
            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <input ref={photoInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
                <div className="flex flex-col items-center gap-4 cursor-pointer" onClick={() => photoInputRef.current?.click()}>
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">{l ? 'Extrayendo datos...' : 'Extracting data...'}</p>
                    </div>
                  ) : (
                    <Camera className="h-12 w-12 text-muted-foreground" />
                  )}
                  <div className="text-center">
                    <p className="font-medium">{l ? 'Toma una foto de tu estado de cuenta' : 'Take a photo of your bank statement'}</p>
                    <p className="text-sm text-muted-foreground mt-1">{l ? 'EvoFinz extraerá todo automáticamente' : 'EvoFinz will extract everything automatically'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Parsed Transactions Preview */}
        {parsedTransactions.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                {l
                  ? `${parsedTransactions.length} transacciones detectadas`
                  : `${parsedTransactions.length} transactions detected`}
              </h3>
              <Badge variant="outline" className="text-lg">${totalAmount.toFixed(2)}</Badge>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {parsedTransactions.map((transaction, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.transaction_type === 'income'
                          ? 'bg-emerald-500/10'
                          : 'bg-red-500/10'
                      }`}>
                        {transaction.transaction_type === 'income'
                          ? <ArrowDownCircle className="h-5 w-5 text-emerald-600" />
                          : <ArrowUpCircle className="h-5 w-5 text-red-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">
                          {transaction.description || (l ? 'Sin descripción' : 'No description')}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(transaction.date), 'dd MMM yyyy', { locale: l ? es : undefined })}
                          {transaction.category && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              {transaction.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${
                        transaction.transaction_type === 'income'
                          ? 'text-emerald-600'
                          : 'text-destructive'
                      }`}>
                        {transaction.transaction_type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
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
                {l ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button onClick={handleStartImport} className="flex-1 bg-gradient-primary">
                <ArrowRight className="h-4 w-4 mr-2" />
                {l ? 'Importar y Clasificar' : 'Import & Classify'}
              </Button>
            </div>
          </div>
        )}

        {parsedTransactions.length === 0 && selectedFile && !isLoading && (
          <div className="mt-4 p-4 bg-destructive/10 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-sm">{l ? 'No se encontraron transacciones' : 'No transactions found'}</p>
              <p className="text-xs text-muted-foreground">{l ? 'Verifica que el archivo tenga el formato correcto' : 'Check that the file has the correct format'}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
