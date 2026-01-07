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
  Receipt, Car, Utensils, Briefcase, MessageSquare, Save,
  Users, Quote, Languages, Handshake, UserCheck, User
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

interface ImportantAgreement {
  topic: string;
  summary: string;
  who_benefits: 'client' | 'contractor' | 'both';
  original_quote?: string;
}

interface ExtractedTerms {
  contract_summary?: string;
  contract_summary_detailed?: string;
  original_language?: string;
  parties?: {
    party_count?: number;
    client?: string;
    client_role?: string;
    contractor?: string;
    contractor_role?: string;
    relationship_summary?: string;
  };
  reimbursement_policy?: {
    summary?: string;
    original_quotes?: string[];
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
    original_quotes?: string[];
  };
  key_clauses?: KeyClause[];
  important_agreements?: ImportantAgreement[];
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

      // Call AI analysis function with target language
      const { data: result, error } = await supabase.functions.invoke('analyze-contract', {
        body: { 
          documentBase64: base64,
          documentType: fileType,
          contractTitle: title,
          targetLanguage: language,
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
                : (language === 'es' ? 'Analizar Smart' : 'Smart Analyze')
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
                ? 'No se han extraído términos de este contrato. Haz clic en "Analizar Smart" para extraer automáticamente los términos de reembolso y facturación.'
                : 'No terms have been extracted from this contract. Click "Smart Analyze" to automatically extract reimbursement and billing terms.'}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Original Language Notice */}
            {terms.original_language && terms.original_language.toLowerCase() !== (language === 'es' ? 'spanish' : 'english') && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                <Languages className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {language === 'es' 
                    ? `Contrato original en ${terms.original_language} - Traducido a español para su comprensión`
                    : `Original contract in ${terms.original_language} - Translated to English for understanding`}
                </span>
              </div>
            )}

            {/* Contract Summary */}
            {terms.contract_summary && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-medium mb-1">
                  {language === 'es' ? 'Resumen' : 'Summary'}
                </p>
                <p className="text-sm text-muted-foreground">{terms.contract_summary}</p>
                {terms.contract_summary_detailed && (
                  <p className="text-sm text-muted-foreground mt-2 pt-2 border-t border-border/50">
                    {terms.contract_summary_detailed}
                  </p>
                )}
              </div>
            )}

            {/* Parties Section */}
            {terms.parties && (terms.parties.party_count && terms.parties.party_count >= 2) && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-primary" />
                  {language === 'es' ? 'Partes del Contrato' : 'Contract Parties'}
                  <Badge variant="outline" className="ml-auto">
                    {terms.parties.party_count} {language === 'es' ? 'partes' : 'parties'}
                  </Badge>
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  {terms.parties.client && (
                    <div className="p-2 bg-background rounded border">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{terms.parties.client}</span>
                      </div>
                      {terms.parties.client_role && (
                        <p className="text-xs text-muted-foreground">{terms.parties.client_role}</p>
                      )}
                    </div>
                  )}
                  {terms.parties.contractor && (
                    <div className="p-2 bg-background rounded border">
                      <div className="flex items-center gap-2 mb-1">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{terms.parties.contractor}</span>
                      </div>
                      {terms.parties.contractor_role && (
                        <p className="text-xs text-muted-foreground">{terms.parties.contractor_role}</p>
                      )}
                    </div>
                  )}
                </div>
                {terms.parties.relationship_summary && (
                  <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                    {terms.parties.relationship_summary}
                  </p>
                )}
              </div>
            )}

            {/* Important Agreements */}
            {Array.isArray(terms.important_agreements) && terms.important_agreements.length > 0 && (
              <Collapsible defaultOpen>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-3 h-auto bg-amber-50/50 dark:bg-amber-950/20">
                    <span className="flex items-center gap-2 font-medium">
                      <Handshake className="h-4 w-4 text-amber-600" />
                      {language === 'es' ? 'Acuerdos Importantes' : 'Important Agreements'}
                      <Badge variant="secondary" className="ml-1">{terms.important_agreements.length}</Badge>
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2 px-3">
                  {terms.important_agreements.map((agreement, idx) => (
                    <div key={idx} className="p-3 bg-muted/30 rounded-lg border">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-medium text-sm">{agreement.topic}</span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {agreement.who_benefits === 'client' 
                            ? (language === 'es' ? 'Beneficia: Cliente' : 'Benefits: Client')
                            : agreement.who_benefits === 'contractor'
                              ? (language === 'es' ? 'Beneficia: Contratista' : 'Benefits: Contractor')
                              : (language === 'es' ? 'Beneficia: Ambos' : 'Benefits: Both')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{agreement.summary}</p>
                      {agreement.original_quote && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs italic flex gap-2 items-start">
                          <Quote className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />
                          <span className="text-muted-foreground">"{agreement.original_quote}"</span>
                        </div>
                      )}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
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

                  {/* Original Quotes for Reimbursement */}
                  {Array.isArray(terms.reimbursement_policy.original_quotes) && 
                   terms.reimbursement_policy.original_quotes.length > 0 && (
                    <div className="mx-3 p-2 bg-muted/30 rounded border-l-2 border-primary/50">
                      <p className="text-xs font-medium mb-1 flex items-center gap-1">
                        <Quote className="h-3 w-3" />
                        {language === 'es' ? 'Texto original extraído:' : 'Original extracted text:'}
                      </p>
                      {terms.reimbursement_policy.original_quotes.map((quote, idx) => (
                        <p key={idx} className="text-xs italic text-muted-foreground">"{quote}"</p>
                      ))}
                    </div>
                  )}

                  {/* Reimbursable Categories */}
                  {Array.isArray(terms.reimbursement_policy.reimbursable_categories) && 
                   terms.reimbursement_policy.reimbursable_categories.length > 0 && (
                    <div className="space-y-2 px-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        {language === 'es' ? 'Gastos Reembolsables' : 'Reimbursable Expenses'}
                      </p>
                      <div className="grid gap-2">
                        {terms.reimbursement_policy.reimbursable_categories.map((cat, idx) => {
                          const catData = typeof cat === 'string' ? { category: cat, description: '', rate: '100%' } : cat;
                          const Icon = categoryIcons[catData.category] || categoryIcons.default;
                          return (
                            <div key={idx} className="p-2 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-900">
                              <div className="flex items-center gap-2 mb-1">
                                <Icon className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-sm capitalize">{catData.category}</span>
                                {catData.rate && <Badge variant="outline" className="text-xs">{catData.rate}</Badge>}
                              </div>
                              {catData.description && <p className="text-xs text-muted-foreground">{catData.description}</p>}
                              {catData.limits && (
                                <p className="text-xs text-amber-600 mt-1">⚠️ {catData.limits}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Non-Reimbursable */}
                  {Array.isArray(terms.reimbursement_policy.non_reimbursable) && 
                   terms.reimbursement_policy.non_reimbursable.length > 0 && (
                    <div className="space-y-2 px-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <X className="h-4 w-4 text-red-600" />
                        {language === 'es' ? 'NO Reembolsable' : 'NOT Reimbursable'}
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        {terms.reimbursement_policy.non_reimbursable.map((item, idx) => (
                          <li key={idx}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Documentation Required */}
                  {Array.isArray(terms.reimbursement_policy.documentation_required) && 
                   terms.reimbursement_policy.documentation_required.length > 0 && (
                    <div className="space-y-2 px-3">
                      <p className="text-sm font-medium">
                        {language === 'es' ? 'Documentación Requerida' : 'Required Documentation'}
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        {terms.reimbursement_policy.documentation_required.map((item, idx) => (
                          <li key={idx}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
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
