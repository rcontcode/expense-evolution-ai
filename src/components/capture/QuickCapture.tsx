import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Mic, MicOff, Upload, Loader2, Sparkles, Check, X, ImageIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoiceInput } from '@/hooks/utils/useVoiceInput';
import { useReceiptProcessor, ExtractedExpenseData } from '@/hooks/data/useReceiptProcessor';
import { useCreateExpense } from '@/hooks/data/useExpenses';
import { useClients } from '@/hooks/data/useClients';
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
  const [extractedData, setExtractedData] = useState<ExtractedExpenseData | null>(null);
  const [editedData, setEditedData] = useState<Partial<ExtractedExpenseData>>({});

  const { processReceipt, isProcessing } = useReceiptProcessor();
  const createExpense = useCreateExpense();
  const { data: clients } = useClients();

  const { 
    isListening, 
    transcript, 
    isSupported: voiceSupported,
    toggleListening,
    setTranscript,
  } = useVoiceInput({
    onResult: (text) => {
      console.log('Voice result:', text);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProcess = async () => {
    const result = await processReceipt(imageBase64 || undefined, transcript || undefined);
    if (result) {
      setExtractedData(result);
      setEditedData(result);
    }
  };

  const handleSaveExpense = async () => {
    if (!editedData.vendor || !editedData.amount) return;

    try {
      // user_id is added automatically by useCreateExpense hook
      await createExpense.mutateAsync({
        vendor: editedData.vendor || 'Unknown',
        amount: editedData.amount || 0,
        date: editedData.date || new Date().toISOString().split('T')[0],
        category: editedData.category || 'other',
        description: editedData.description || '',
        status: 'pending',
      } as any);
      
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create expense:', error);
    }
  };

  const updateField = (field: keyof ExtractedExpenseData, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      high: 'default',
      medium: 'secondary',
      low: 'destructive',
    };
    return <Badge variant={variants[confidence] || 'secondary'}>{confidence}</Badge>;
  };

  const clearAll = () => {
    setImagePreview(null);
    setImageBase64(null);
    setExtractedData(null);
    setEditedData({});
    setTranscript('');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {t('quickCapture.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!extractedData ? (
          <>
            {/* Image Upload */}
            <div className="space-y-3">
              <label className="text-sm font-medium">{t('quickCapture.uploadReceipt')}</label>
              <div 
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  imagePreview ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="space-y-3">
                    <img 
                      src={imagePreview} 
                      alt="Receipt preview" 
                      className="max-h-48 mx-auto rounded-lg object-contain"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagePreview(null);
                        setImageBase64(null);
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      {t('common.remove')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t('quickCapture.dropOrClick')}
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Voice Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium">{t('quickCapture.orDescribe')}</label>
              <div className="flex gap-2">
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder={t('quickCapture.voicePlaceholder')}
                  className="min-h-[80px]"
                />
                {voiceSupported && (
                  <Button
                    type="button"
                    variant={isListening ? 'destructive' : 'outline'}
                    size="icon"
                    className="shrink-0 h-[80px] w-12"
                    onClick={toggleListening}
                  >
                    {isListening ? (
                      <MicOff className="h-5 w-5 animate-pulse" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </Button>
                )}
              </div>
              {isListening && (
                <p className="text-sm text-primary animate-pulse">
                  {t('quickCapture.listening')}...
                </p>
              )}
            </div>

            {/* Process Button */}
            <div className="flex gap-3 pt-4">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} className="flex-1">
                  {t('common.cancel')}
                </Button>
              )}
              <Button 
                onClick={handleProcess}
                disabled={isProcessing || (!imageBase64 && !transcript)}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('quickCapture.processing')}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t('quickCapture.analyze')}
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Extracted Data Review */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {t('quickCapture.aiExtracted')}
                </p>
                {extractedData.confidence && getConfidenceBadge(extractedData.confidence)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('expenses.vendorLabel')}</label>
                  <Input
                    value={editedData.vendor || ''}
                    onChange={(e) => updateField('vendor', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('expenses.amountLabel')}</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editedData.amount || ''}
                    onChange={(e) => updateField('amount', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('expenses.dateLabel')}</label>
                  <Input
                    type="date"
                    value={editedData.date || ''}
                    onChange={(e) => updateField('date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('expenses.categoryLabel')}</label>
                  <Select 
                    value={editedData.category || 'other'} 
                    onValueChange={(val) => updateField('category', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('expenses.descriptionLabel')}</label>
                <Textarea
                  value={editedData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={clearAll} className="flex-1">
                <X className="mr-2 h-4 w-4" />
                {t('quickCapture.startOver')}
              </Button>
              <Button 
                onClick={handleSaveExpense}
                disabled={createExpense.isPending || !editedData.vendor || !editedData.amount}
                className="flex-1"
              >
                {createExpense.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {t('quickCapture.saveExpense')}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
