import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Sparkles, Loader2, ChevronDown, ChevronUp, Check, X, 
  FileText, DollarSign, Clock, AlertTriangle, Building2,
  Receipt, Car, Utensils, Briefcase, MessageSquare, Save
} from 'lucide-react';

interface ReimbursableCategory {
  category: string;
  description: string;
  rate: string;
  limits?: string;
  conditions?: string;
}

interface KeyClause {
  title: string;
  summary: string;
  importance: 'high' | 'medium' | 'low';
}

interface ExtractedTerms {
  contract_summary?: string;
  parties?: {
    client?: string;
    contractor?: string;
  };
  reimbursement_policy?: {
    summary?: string;
    reimbursable_categories?: ReimbursableCategory[];
    non_reimbursable?: string[];
    documentation_required?: string[];
    submission_deadline?: string;
    approval_process?: string;
  };
  billing_terms?: {
    rate?: string;
    payment_terms?: string;
    invoicing_frequency?: string;
    currency?: string;
  };
  key_clauses?: KeyClause[];
  confidence?: 'high' | 'medium' | 'low';
  notes?: string;
}

interface ContractTermsViewerProps {
  contractId: string;
  filePath: string;
  fileType: string | null;
  title: string | null;
  extractedTerms: ExtractedTerms | null;
  userNotes: string | null;
  aiProcessedAt: string | null;
  onUpdate: () => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  travel: Car,
  meals: Utensils,
  equipment: Briefcase,
  mileage: Car,
  fuel: Car,
  lodging: Building2,
  default: Receipt,
};

export function ContractTermsViewer({
  contractId,
  filePath,
  fileType,
  title,
  extractedTerms,
  userNotes,
  aiProcessedAt,
  onUpdate,
}: ContractTermsViewerProps) {
  const { language } = useLanguage();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(userNotes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      // Get signed URL for the document
      const { data: signedUrlData } = await supabase.storage
        .from('contracts')
        .createSignedUrl(filePath, 60);

      if (!signedUrlData?.signedUrl) {
        throw new Error('Could not get document URL');
      }

      // Fetch document and convert to base64
      const response = await fetch(signedUrlData.signedUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // Call AI analysis function
      const { data: result, error } = await supabase.functions.invoke('analyze-contract', {
        body: { 
          documentBase64: base64,
          documentType: fileType,
          contractTitle: title,
        },
      });

      if (error) throw error;

      // Save extracted terms to database
      const { error: updateError } = await supabase
        .from('contracts')
        .update({ 
          extracted_terms: result,
          ai_processed_at: new Date().toISOString(),
        })
        .eq('id', contractId);

      if (updateError) throw updateError;

      toast.success(language === 'es' ? '¡Contrato analizado exitosamente!' : 'Contract analyzed successfully!');
      onUpdate();
    } catch (err) {
      console.error('Error analyzing contract:', err);
      toast.error(language === 'es' ? 'Error al analizar el contrato' : 'Error analyzing contract');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ user_notes: notes })
        .eq('id', contractId);

      if (error) throw error;

      toast.success(language === 'es' ? 'Notas guardadas' : 'Notes saved');
      setEditingNotes(false);
      onUpdate();
    } catch (err) {
      console.error('Error saving notes:', err);
      toast.error(language === 'es' ? 'Error al guardar notas' : 'Error saving notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const terms = extractedTerms || {};
  const hasTerms = Object.keys(terms).length > 0 && terms.contract_summary;

  const getConfidenceBadge = () => {
    if (!terms.confidence) return null;
    const config = {
      high: { color: 'bg-green-500/20 text-green-700', label: language === 'es' ? 'Alta confianza' : 'High confidence' },
      medium: { color: 'bg-yellow-500/20 text-yellow-700', label: language === 'es' ? 'Confianza media' : 'Medium confidence' },
      low: { color: 'bg-red-500/20 text-red-700', label: language === 'es' ? 'Baja confianza' : 'Low confidence' },
    };
    return <Badge className={config[terms.confidence].color}>{config[terms.confidence].label}</Badge>;
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {language === 'es' ? 'Términos del Acuerdo' : 'Agreement Terms'}
            </CardTitle>
            {getConfidenceBadge()}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              {hasTerms 
                ? (language === 'es' ? 'Re-analizar' : 'Re-analyze')
                : (language === 'es' ? 'Analizar con IA' : 'Analyze with AI')
              }
            </Button>
          </div>
        </div>
        {aiProcessedAt && (
          <CardDescription>
            {language === 'es' ? 'Analizado: ' : 'Analyzed: '}
            {new Date(aiProcessedAt).toLocaleDateString()}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasTerms ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {language === 'es' 
                ? 'No se han extraído términos de este contrato. Haz clic en "Analizar con IA" para extraer automáticamente los términos de reembolso y facturación.'
                : 'No terms have been extracted from this contract. Click "Analyze with AI" to automatically extract reimbursement and billing terms.'}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Contract Summary */}
            {terms.contract_summary && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-1">
                  {language === 'es' ? 'Resumen' : 'Summary'}
                </p>
                <p className="text-sm text-muted-foreground">{terms.contract_summary}</p>
              </div>
            )}

            {/* Parties */}
            {terms.parties && (
              <div className="flex gap-4 text-sm">
                {terms.parties.client && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{language === 'es' ? 'Cliente:' : 'Client:'}</span>
                    <span className="font-medium">{terms.parties.client}</span>
                  </div>
                )}
              </div>
            )}

            {/* Reimbursement Policy */}
            {terms.reimbursement_policy && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <Receipt className="h-4 w-4" />
                      {language === 'es' ? 'Política de Reembolso' : 'Reimbursement Policy'}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  {terms.reimbursement_policy.summary && (
                    <p className="text-sm text-muted-foreground px-3">
                      {terms.reimbursement_policy.summary}
                    </p>
                  )}

                  {/* Reimbursable Categories */}
                  {terms.reimbursement_policy.reimbursable_categories && 
                   terms.reimbursement_policy.reimbursable_categories.length > 0 && (
                    <div className="space-y-2 px-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        {language === 'es' ? 'Gastos Reembolsables' : 'Reimbursable Expenses'}
                      </p>
                      <div className="grid gap-2">
                        {terms.reimbursement_policy.reimbursable_categories.map((cat, idx) => {
                          const Icon = categoryIcons[cat.category] || categoryIcons.default;
                          return (
                            <div key={idx} className="p-2 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-900">
                              <div className="flex items-center gap-2 mb-1">
                                <Icon className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-sm capitalize">{cat.category}</span>
                                <Badge variant="outline" className="text-xs">{cat.rate}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{cat.description}</p>
                              {cat.limits && (
                                <p className="text-xs text-amber-600 mt-1">⚠️ {cat.limits}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Non-Reimbursable */}
                  {terms.reimbursement_policy.non_reimbursable && 
                   terms.reimbursement_policy.non_reimbursable.length > 0 && (
                    <div className="space-y-2 px-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <X className="h-4 w-4 text-red-600" />
                        {language === 'es' ? 'NO Reembolsable' : 'NOT Reimbursable'}
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        {terms.reimbursement_policy.non_reimbursable.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Documentation Required */}
                  {terms.reimbursement_policy.documentation_required && 
                   terms.reimbursement_policy.documentation_required.length > 0 && (
                    <div className="space-y-2 px-3">
                      <p className="text-sm font-medium">
                        {language === 'es' ? 'Documentación Requerida' : 'Required Documentation'}
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        {terms.reimbursement_policy.documentation_required.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Billing Terms */}
            {terms.billing_terms && (
              <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {language === 'es' ? 'Términos de Facturación' : 'Billing Terms'}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {terms.billing_terms.rate && (
                    <div>
                      <span className="text-muted-foreground">{language === 'es' ? 'Tarifa:' : 'Rate:'}</span>
                      <span className="ml-1 font-medium">{terms.billing_terms.rate}</span>
                    </div>
                  )}
                  {terms.billing_terms.payment_terms && (
                    <div>
                      <span className="text-muted-foreground">{language === 'es' ? 'Pago:' : 'Payment:'}</span>
                      <span className="ml-1 font-medium">{terms.billing_terms.payment_terms}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Notes */}
            {terms.notes && (
              <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  {terms.notes}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* User Notes/Corrections */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {language === 'es' ? 'Notas y Correcciones' : 'Notes & Corrections'}
            </p>
            {!editingNotes && (
              <Button variant="ghost" size="sm" onClick={() => setEditingNotes(true)}>
                {language === 'es' ? 'Editar' : 'Edit'}
              </Button>
            )}
          </div>
          
          {editingNotes ? (
            <div className="space-y-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={language === 'es' 
                  ? 'Agrega correcciones o notas sobre los términos del contrato...'
                  : 'Add corrections or notes about the contract terms...'}
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveNotes} disabled={isSavingNotes}>
                  {isSavingNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  {language === 'es' ? 'Guardar' : 'Save'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setEditingNotes(false); setNotes(userNotes || ''); }}>
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground p-2 bg-muted/30 rounded min-h-[60px]">
              {userNotes || (language === 'es' ? 'Sin notas. Haz clic en editar para agregar correcciones.' : 'No notes. Click edit to add corrections.')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
