import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Loader2, Sparkles, Check, X, ImageIcon, ChevronLeft, ChevronRight, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoiceInput } from '@/hooks/utils/useVoiceInput';
import { useReceiptProcessor, ExtractedExpenseData } from '@/hooks/data/useReceiptProcessor';
import { useCreateExpense } from '@/hooks/data/useExpenses';
import { EXPENSE_CATEGORIES } from '@/lib/constants/expense-categories';
import { cn } from '@/lib/utils';

interface QuickCaptureProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

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
      'comida': 'meals', 'meals': 'meals', 'food': 'meals', 'almuerzo': 'meals',
      'viaje': 'travel', 'travel': 'travel', 'uber': 'travel', 'taxi': 'travel',
      'equipo': 'equipment', 'equipment': 'equipment', 'materiales': 'equipment', 'materials': 'equipment',
      'software': 'software', 'gasolina': 'mileage', 'gas': 'mileage', 'fuel': 'mileage', 'bencina': 'mileage',
      'oficina': 'office_supplies', 'otro': 'other', 'other': 'other',
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
    await createExpense.mutateAsync({ vendor: currentExpense.vendor, amount: currentExpense.amount, date: currentExpense.date, category: currentExpense.category, description: currentExpense.description, status: 'pending' } as any);
    setSavedCount(prev => prev + 1);
    if (currentIndex < editedExpenses.length - 1) setCurrentIndex(prev => prev + 1);
    else onSuccess?.();
  };

  const handleRemoveCurrentExpense = () => {
    if (editedExpenses.length === 1) { clearAll(); return; }
    setEditedExpenses(prev => prev.filter((_, idx) => idx !== currentIndex));
    if (currentIndex >= editedExpenses.length - 1) setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const clearAll = () => { setImagePreview(null); setImageBase64(null); setEditedExpenses([]); setCurrentIndex(0); setSavedCount(0); setTranscript(''); setShowCategoryTextInput(false); };

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
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t('quickCapture.aiExtracted')}</p>
                  <div className="flex items-center gap-2">
                    {currentExpense.typically_reimbursable ? <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Reembolsable</Badge> : <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Solo CRA</Badge>}
                    <Badge variant={currentExpense.confidence === 'high' ? 'default' : currentExpense.confidence === 'low' ? 'destructive' : 'secondary'}>{currentExpense.confidence}</Badge>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-sm"><div className="flex justify-between"><span>Deducible CRA:</span><span className="font-medium">{currentExpense.cra_deductible ? `${currentExpense.cra_deduction_rate}%` : 'No'}</span></div></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-sm font-medium">{t('expenses.vendorLabel')}</label><Input value={currentExpense.vendor || ''} onChange={(e) => updateCurrentExpense('vendor', e.target.value)} /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">{t('expenses.amountLabel')}</label><Input type="number" step="0.01" value={currentExpense.amount || ''} onChange={(e) => updateCurrentExpense('amount', parseFloat(e.target.value))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-sm font-medium">{t('expenses.dateLabel')}</label><Input type="date" value={currentExpense.date || ''} onChange={(e) => updateCurrentExpense('date', e.target.value)} /></div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('expenses.categoryLabel')}</label>
                    <Select value={currentExpense.category || 'other'} onValueChange={(val) => updateCurrentExpense('category', val)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EXPENSE_CATEGORIES.map((cat) => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}</SelectContent></Select>
                    <div className="flex gap-2 mt-2">
                      {showCategoryTextInput ? (<div className="flex gap-1 flex-1"><Input value={categoryTextInput} onChange={(e) => setCategoryTextInput(e.target.value)} placeholder="ej: comida, gasolina..." className="text-sm" onKeyDown={(e) => e.key === 'Enter' && handleCategoryFromText(categoryTextInput)} /><Button size="sm" variant="ghost" onClick={() => handleCategoryFromText(categoryTextInput)}><Check className="h-4 w-4" /></Button><Button size="sm" variant="ghost" onClick={() => setShowCategoryTextInput(false)}><X className="h-4 w-4" /></Button></div>) : (<><Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => setShowCategoryTextInput(true)}>Escribir categoría</Button>{categoryVoiceSupported && <Button variant={isCategoryListening ? 'destructive' : 'outline'} size="sm" onClick={toggleCategoryListening}>{isCategoryListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}</Button>}</>)}
                    </div>
                    {isCategoryListening && <p className="text-xs text-primary animate-pulse mt-1">Di la categoría...</p>}
                  </div>
                </div>
                <div className="space-y-2"><label className="text-sm font-medium">{t('expenses.descriptionLabel')}</label><Textarea value={currentExpense.description || ''} onChange={(e) => updateCurrentExpense('description', e.target.value)} className="min-h-[60px]" /></div>
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={clearAll} size="sm"><X className="mr-1 h-4 w-4" />{t('quickCapture.startOver')}</Button>
              {editedExpenses.length > 1 && <Button variant="ghost" onClick={handleRemoveCurrentExpense} size="sm" className="text-destructive"><Trash2 className="mr-1 h-4 w-4" />Omitir</Button>}
              <Button onClick={handleSaveCurrentExpense} disabled={createExpense.isPending || !currentExpense?.vendor || !currentExpense?.amount} className="flex-1">{createExpense.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}{editedExpenses.length > 1 ? 'Guardar y Siguiente' : t('quickCapture.saveExpense')}</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
