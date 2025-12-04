import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mic, MicOff, Loader2, Sparkles, Check, X, ImageIcon, ChevronLeft, ChevronRight, 
  Trash2, AlertCircle, CheckCircle, Save, Building2, Landmark, User, AlertTriangle,
  Utensils, Plane, Monitor, Code, Paperclip, Briefcase, Zap, Home, Car, HelpCircle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoiceInput } from '@/hooks/utils/useVoiceInput';
import { useReceiptProcessor, ExtractedExpenseData } from '@/hooks/data/useReceiptProcessor';
import { useCreateExpense } from '@/hooks/data/useExpenses';
import { useClients } from '@/hooks/data/useClients';
import { EXPENSE_CATEGORIES } from '@/lib/constants/expense-categories';
import { ExpenseSummary } from './ExpenseSummary';
import { cn } from '@/lib/utils';

interface QuickCaptureProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  meals: Utensils,
  travel: Plane,
  equipment: Monitor,
  software: Code,
  office_supplies: Paperclip,
  professional_services: Briefcase,
  utilities: Zap,
  home_office: Home,
  mileage: Car,
  other: HelpCircle,
};

export function QuickCapture({ onSuccess, onCancel }: QuickCaptureProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [editedExpenses, setEditedExpenses] = useState<ExtractedExpenseData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [categoryTextInput, setCategoryTextInput] = useState('');
  const [showCategoryTextInput, setShowCategoryTextInput] = useState(false);

  const { processReceipt, isProcessing } = useReceiptProcessor();
  const createExpense = useCreateExpense();
  const { data: clients = [] } = useClients();

  const { isListening, transcript, isSupported: voiceSupported, toggleListening, setTranscript } = useVoiceInput({ onResult: () => {} });
  const { isListening: isCategoryListening, isSupported: categoryVoiceSupported, toggleListening: toggleCategoryListening, setTranscript: setCategoryTranscript } = useVoiceInput({
    onResult: (text) => { handleCategoryFromText(text); setCategoryTranscript(''); },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onloadend = () => setImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleProcess = async () => {
    const result = await processReceipt(imageBase64 || undefined, transcript || undefined);
    if (result?.expenses?.length) {
      setEditedExpenses(result.expenses);
      setCurrentIndex(0);
      setSavedCount(0);
    }
  };

  const handleCategoryFromText = (text: string) => {
    const lowered = text.toLowerCase().trim();
    const map: Record<string, string> = {
      'comida': 'meals', 'meals': 'meals', 'food': 'meals', 'almuerzo': 'meals', 'cena': 'meals', 'desayuno': 'meals',
      'viaje': 'travel', 'travel': 'travel', 'uber': 'travel', 'taxi': 'travel', 'avion': 'travel', 'vuelo': 'travel',
      'equipo': 'equipment', 'equipment': 'equipment', 'materiales': 'equipment', 'materials': 'equipment',
      'software': 'software', 'app': 'software', 'suscripcion': 'software',
      'gasolina': 'mileage', 'gas': 'mileage', 'fuel': 'mileage', 'bencina': 'mileage', 'combustible': 'mileage', 'nafta': 'mileage',
      'oficina': 'office_supplies', 'papeleria': 'office_supplies',
      'otro': 'other', 'other': 'other',
    };
    for (const [k, v] of Object.entries(map)) {
      if (lowered.includes(k)) { updateCurrentExpense('category', v); setShowCategoryTextInput(false); setCategoryTextInput(''); return; }
    }
  };

  const currentExpense = editedExpenses[currentIndex];
  const updateCurrentExpense = (field: keyof ExtractedExpenseData, value: any) => {
    setEditedExpenses(prev => prev.map((exp, idx) => idx === currentIndex ? { ...exp, [field]: value } : exp));
  };

  const handleSaveCurrentExpense = async () => {
    if (!currentExpense?.vendor || !currentExpense?.amount) return;
    try {
      await createExpense.mutateAsync({ 
        vendor: currentExpense.vendor, 
        amount: currentExpense.amount, 
        date: currentExpense.date, 
        category: currentExpense.category, 
        description: currentExpense.description, 
        client_id: currentExpense.client_id || null,
        status: 'pending' 
      } as any);
      setSavedCount(prev => prev + 1);
      if (currentIndex < editedExpenses.length - 1) setCurrentIndex(prev => prev + 1);
      else onSuccess?.();
    } catch (e) { console.error(e); }
  };

  const handleSaveAll = async () => {
    for (const exp of editedExpenses) {
      if (!exp.vendor || !exp.amount) continue;
      try {
        await createExpense.mutateAsync({ 
          vendor: exp.vendor, 
          amount: exp.amount, 
          date: exp.date, 
          category: exp.category, 
          description: exp.description, 
          client_id: exp.client_id || null,
          status: 'pending' 
        } as any);
      } catch (e) { console.error(e); }
    }
    onSuccess?.();
  };

  const handleRemoveCurrentExpense = () => {
    if (editedExpenses.length === 1) { clearAll(); return; }
    setEditedExpenses(prev => prev.filter((_, idx) => idx !== currentIndex));
    if (currentIndex >= editedExpenses.length - 1) setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const clearAll = () => { setImagePreview(null); setImageBase64(null); setEditedExpenses([]); setCurrentIndex(0); setSavedCount(0); setTranscript(''); setShowCategoryTextInput(false); };

  // Get category icon for current expense
  const CurrentCategoryIcon = currentExpense ? (CATEGORY_ICONS[currentExpense.category] || HelpCircle) : HelpCircle;

  // Check for missing information
  const getMissingInfo = (exp: ExtractedExpenseData | undefined) => {
    if (!exp) return [];
    const missing: string[] = [];
    if (!exp.vendor || exp.vendor === 'Unknown') missing.push('Proveedor');
    if (!exp.date || exp.date === 'YYYY-MM-DD') missing.push('Fecha');
    if (!exp.amount || exp.amount === 0) missing.push('Monto');
    return missing;
  };

  const missingInfo = getMissingInfo(currentExpense);
  const hasClients = clients.length > 0;

  return (
    <Card className="w-full">
      <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />{t('quickCapture.title')}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        {editedExpenses.length === 0 ? (
          <>
            <div className="space-y-3">
              <label className="text-sm font-medium">{t('quickCapture.uploadReceipt')}</label>
              <div className={cn("border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors", imagePreview ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50")} onClick={() => fileInputRef.current?.click()}>
                {imagePreview ? (<div className="space-y-3"><img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" /><Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageBase64(null); }}><X className="h-4 w-4 mr-1" />{t('common.remove')}</Button></div>) : (<div className="space-y-2"><ImageIcon className="h-10 w-10 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">{t('quickCapture.dropOrClick')}</p></div>)}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">{t('quickCapture.orDescribe')}</label>
              <div className="flex gap-2">
                <Textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder={t('quickCapture.voicePlaceholder')} className="min-h-[80px]" />
                {voiceSupported && <Button type="button" variant={isListening ? 'destructive' : 'outline'} size="icon" className="shrink-0 h-[80px] w-12" onClick={toggleListening}>{isListening ? <MicOff className="h-5 w-5 animate-pulse" /> : <Mic className="h-5 w-5" />}</Button>}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              {onCancel && <Button variant="outline" onClick={onCancel} className="flex-1">{t('common.cancel')}</Button>}
              <Button onClick={handleProcess} disabled={isProcessing || (!imageBase64 && !transcript)} className="flex-1">{isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('quickCapture.processing')}</> : <><Sparkles className="mr-2 h-4 w-4" />{t('quickCapture.analyze')}</>}</Button>
            </div>
          </>
        ) : (
          <>
            {editedExpenses.length > 1 && (
              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                <Button variant="ghost" size="sm" onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-sm font-medium">Gasto {currentIndex + 1} de {editedExpenses.length} {savedCount > 0 && <span className="text-green-600 ml-2">({savedCount} guardados)</span>}</span>
                <Button variant="ghost" size="sm" onClick={() => setCurrentIndex(prev => Math.min(editedExpenses.length - 1, prev + 1))} disabled={currentIndex === editedExpenses.length - 1}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            )}

            {currentExpense && (
              <div className="space-y-4">
                {/* Category Icon and Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CurrentCategoryIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{EXPENSE_CATEGORIES.find(c => c.value === currentExpense.category)?.label || 'Otro'}</p>
                      <p className="text-xs text-muted-foreground">{t('quickCapture.aiExtracted')}</p>
                    </div>
                  </div>
                  <Badge variant={currentExpense.confidence === 'high' ? 'default' : currentExpense.confidence === 'low' ? 'destructive' : 'secondary'}>
                    {currentExpense.confidence === 'high' ? 'Alta' : currentExpense.confidence === 'medium' ? 'Media' : 'Baja'} confianza
                  </Badge>
                </div>

                {/* Reimbursement Status Badges */}
                <div className="flex flex-wrap gap-2">
                  {currentExpense.typically_reimbursable ? (
                    <Badge variant="default" className="bg-green-600">
                      <Building2 className="h-3 w-3 mr-1" />Reembolsable por Cliente
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <User className="h-3 w-3 mr-1" />No Reembolsable
                    </Badge>
                  )}
                  {currentExpense.cra_deductible ? (
                    <Badge variant="default" className="bg-blue-600">
                      <Landmark className="h-3 w-3 mr-1" />Deducible CRA {currentExpense.cra_deduction_rate}%
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <X className="h-3 w-3 mr-1" />No Deducible CRA
                    </Badge>
                  )}
                </div>

                {/* Missing Information Alert */}
                {missingInfo.length > 0 && (
                  <Alert variant="destructive" className="border-amber-200 bg-amber-50 text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Información faltante:</strong> {missingInfo.join(', ')}. Por favor completa estos campos para un registro preciso.
                    </AlertDescription>
                  </Alert>
                )}

                {/* No Client Warning */}
                {!hasClients && currentExpense.typically_reimbursable && (
                  <Alert className="border-blue-200 bg-blue-50 text-blue-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Sin clientes configurados:</strong> Para calcular reembolsos necesitas agregar clientes en la sección "Clientes". Este gasto se marcó como potencialmente reembolsable, pero no hay acuerdos de cliente para verificar.
                    </AlertDescription>
                  </Alert>
                )}

                {hasClients && currentExpense.typically_reimbursable && (
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Este gasto puede ser reembolsable según tu acuerdo con el cliente. Verifica las políticas específicas de reembolso.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1">
                      {t('expenses.vendorLabel')}
                      {(!currentExpense.vendor || currentExpense.vendor === 'Unknown') && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                    </label>
                    <Input 
                      value={currentExpense.vendor || ''} 
                      onChange={(e) => updateCurrentExpense('vendor', e.target.value)} 
                      placeholder="Ej: Starbucks, Shell..."
                      className={cn(!currentExpense.vendor || currentExpense.vendor === 'Unknown' ? 'border-amber-300' : '')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1">
                      {t('expenses.amountLabel')}
                      {!currentExpense.amount && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                    </label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={currentExpense.amount || ''} 
                      onChange={(e) => updateCurrentExpense('amount', parseFloat(e.target.value))} 
                      placeholder="0.00"
                      className={cn(!currentExpense.amount ? 'border-amber-300' : '')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1">
                      {t('expenses.dateLabel')}
                      {(!currentExpense.date || currentExpense.date === 'YYYY-MM-DD') && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                    </label>
                    <Input 
                      type="date" 
                      value={currentExpense.date && currentExpense.date !== 'YYYY-MM-DD' ? currentExpense.date : ''} 
                      onChange={(e) => updateCurrentExpense('date', e.target.value)} 
                      className={cn(!currentExpense.date || currentExpense.date === 'YYYY-MM-DD' ? 'border-amber-300' : '')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('expenses.categoryLabel')}</label>
                    <Select value={currentExpense.category || 'other'} onValueChange={(val) => updateCurrentExpense('category', val)}>
                      <SelectTrigger>
                        <SelectValue>
                          <span className="flex items-center gap-2">
                            <CurrentCategoryIcon className="h-4 w-4" />
                            {EXPENSE_CATEGORIES.find(c => c.value === currentExpense.category)?.label || 'Otro'}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((cat) => {
                          const CatIcon = CATEGORY_ICONS[cat.value] || HelpCircle;
                          return (
                            <SelectItem key={cat.value} value={cat.value}>
                              <span className="flex items-center gap-2">
                                <CatIcon className="h-4 w-4" />
                                {cat.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2 mt-2">
                      {showCategoryTextInput ? (
                        <div className="flex gap-1 flex-1">
                          <Input value={categoryTextInput} onChange={(e) => setCategoryTextInput(e.target.value)} placeholder="ej: comida, gasolina..." className="text-sm" onKeyDown={(e) => e.key === 'Enter' && handleCategoryFromText(categoryTextInput)} />
                          <Button size="sm" variant="ghost" onClick={() => handleCategoryFromText(categoryTextInput)}><Check className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => setShowCategoryTextInput(false)}><X className="h-4 w-4" /></Button>
                        </div>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => setShowCategoryTextInput(true)}>Escribir categoría</Button>
                          {categoryVoiceSupported && <Button variant={isCategoryListening ? 'destructive' : 'outline'} size="sm" onClick={toggleCategoryListening}>{isCategoryListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}</Button>}
                        </>
                      )}
                    </div>
                    {isCategoryListening && <p className="text-xs text-primary animate-pulse mt-1">Di la categoría...</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('expenses.descriptionLabel')}</label>
                  <Textarea value={currentExpense.description || ''} onChange={(e) => updateCurrentExpense('description', e.target.value)} className="min-h-[60px]" placeholder="Descripción del gasto..." />
                </div>

                {/* Client Selector for Reimbursable Expenses */}
                {currentExpense.typically_reimbursable && hasClients && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-green-600" />
                      Asociar a Cliente (Reembolso)
                    </label>
                    <Select 
                      value={currentExpense.client_id || ''} 
                      onValueChange={(val) => updateCurrentExpense('client_id', val || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente para reembolso..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin cliente</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Selecciona el cliente para solicitar reembolso de este gasto
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Summary Panel */}
            <ExpenseSummary expenses={editedExpenses} hasClients={hasClients} clientCount={clients.length} />

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={clearAll} size="sm"><X className="mr-1 h-4 w-4" />{t('quickCapture.startOver')}</Button>
              {editedExpenses.length > 1 && <Button variant="ghost" onClick={handleRemoveCurrentExpense} size="sm" className="text-destructive"><Trash2 className="mr-1 h-4 w-4" />Omitir</Button>}
              <Button onClick={handleSaveCurrentExpense} disabled={createExpense.isPending || !currentExpense?.vendor || !currentExpense?.amount || currentExpense?.vendor === 'Unknown'} className="flex-1">{createExpense.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}{editedExpenses.length > 1 ? 'Guardar y Siguiente' : t('quickCapture.saveExpense')}</Button>
            </div>
            {editedExpenses.length > 1 && savedCount === 0 && (
              <Button variant="secondary" onClick={handleSaveAll} disabled={createExpense.isPending} className="w-full">
                <Save className="mr-2 h-4 w-4" />Guardar Todos ({editedExpenses.length} gastos)
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
