import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, AlertTriangle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ChecklistItem {
  id: string;
  labelEs: string;
  labelEn: string;
  descEs: string;
  descEn: string;
  icon: string;
  country: 'CA' | 'CL' | 'both';
  documentTypes: string[]; // document classifications that satisfy this
  priority: 'high' | 'medium' | 'low';
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Canada-specific
  { id: 'ca-t4', labelEs: 'T4 — Empleo', labelEn: 'T4 — Employment', descEs: 'Formulario de ingresos por empleo', descEn: 'Employment income slip', icon: '📑', country: 'CA', documentTypes: ['tax_slip'], priority: 'high' },
  { id: 'ca-t5', labelEs: 'T5 — Inversiones', labelEn: 'T5 — Investments', descEs: 'Ingresos por dividendos e intereses', descEn: 'Dividend and interest income', icon: '📑', country: 'CA', documentTypes: ['tax_slip', 'investment_statement'], priority: 'high' },
  { id: 'ca-rrsp', labelEs: 'Recibos RRSP', labelEn: 'RRSP Receipts', descEs: 'Contribuciones a plan de retiro registrado', descEn: 'Registered retirement savings contributions', icon: '📈', country: 'CA', documentTypes: ['tax_slip', 'investment_statement'], priority: 'high' },
  { id: 'ca-t2202', labelEs: 'T2202 — Educación', labelEn: 'T2202 — Tuition', descEs: 'Crédito por matrícula universitaria', descEn: 'Tuition tax credit', icon: '🎓', country: 'CA', documentTypes: ['tax_slip'], priority: 'medium' },
  { id: 'ca-rent', labelEs: 'Recibos de Arriendo', labelEn: 'Rent Receipts', descEs: 'Crédito de arriendo (BC, ON, MB)', descEn: 'Renter tax credit (BC, ON, MB)', icon: '🏢', country: 'CA', documentTypes: ['rental_receipt'], priority: 'medium' },
  
  // Chile-specific
  { id: 'cl-afp', labelEs: 'Certificado AFP', labelEn: 'AFP Certificate', descEs: 'Cotizaciones previsionales del año', descEn: 'Pension fund contributions', icon: '📑', country: 'CL', documentTypes: ['tax_slip'], priority: 'high' },
  { id: 'cl-apv', labelEs: 'Certificado APV', labelEn: 'APV Certificate', descEs: 'Ahorro previsional voluntario', descEn: 'Voluntary pension savings', icon: '📈', country: 'CL', documentTypes: ['tax_slip', 'investment_statement'], priority: 'high' },
  { id: 'cl-isapre', labelEs: 'Certificado Isapre/Fonasa', labelEn: 'Isapre/Fonasa Certificate', descEs: 'Cotizaciones de salud', descEn: 'Health insurance contributions', icon: '🏥', country: 'CL', documentTypes: ['tax_slip', 'insurance_policy'], priority: 'high' },
  { id: 'cl-hipotecario', labelEs: 'Certificado Intereses Hipotecarios', labelEn: 'Mortgage Interest Certificate', descEs: 'Intereses de crédito hipotecario', descEn: 'Mortgage interest deduction', icon: '🏠', country: 'CL', documentTypes: ['tax_slip', 'investment_statement'], priority: 'medium' },
  
  // Both countries
  { id: 'both-receipts', labelEs: 'Recibos de Gastos', labelEn: 'Expense Receipts', descEs: 'Recibos de compras deducibles', descEn: 'Deductible purchase receipts', icon: '🧾', country: 'both', documentTypes: ['receipt'], priority: 'high' },
  { id: 'both-invoices', labelEs: 'Facturas', labelEn: 'Invoices', descEs: 'Facturas emitidas y recibidas', descEn: 'Issued and received invoices', icon: '🧾', country: 'both', documentTypes: ['invoice'], priority: 'high' },
  { id: 'both-medical', labelEs: 'Gastos Médicos', labelEn: 'Medical Expenses', descEs: 'Recibos de gastos médicos deducibles', descEn: 'Deductible medical expense receipts', icon: '🏥', country: 'both', documentTypes: ['medical_receipt'], priority: 'high' },
  { id: 'both-donations', labelEs: 'Recibos de Donaciones', labelEn: 'Donation Receipts', descEs: 'Donaciones con beneficio tributario', descEn: 'Tax-deductible donation receipts', icon: '💝', country: 'both', documentTypes: ['donation_receipt'], priority: 'medium' },
  { id: 'both-bank', labelEs: 'Extractos Bancarios', labelEn: 'Bank Statements', descEs: 'Cartolas y extractos del año fiscal', descEn: 'Bank statements for tax year', icon: '🏦', country: 'both', documentTypes: ['bank_statement'], priority: 'medium' },
  { id: 'both-contracts', labelEs: 'Contratos', labelEn: 'Contracts', descEs: 'Contratos laborales y de servicio', descEn: 'Employment and service contracts', icon: '📄', country: 'both', documentTypes: ['contract'], priority: 'medium' },
  { id: 'both-insurance', labelEs: 'Pólizas de Seguro', labelEn: 'Insurance Policies', descEs: 'Seguros de negocio deducibles', descEn: 'Deductible business insurance', icon: '🛡️', country: 'both', documentTypes: ['insurance_policy'], priority: 'low' },
  { id: 'both-investments', labelEs: 'Estados de Inversión', labelEn: 'Investment Statements', descEs: 'Fondos mutuos, RRSP, TFSA, APV', descEn: 'Mutual funds, RRSP, TFSA, APV', icon: '📈', country: 'both', documentTypes: ['investment_statement'], priority: 'low' },
];

export function TaxDocumentChecklist() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get user's country from fiscal entities
  const { data: entities } = useQuery({
    queryKey: ['fiscal-entities-country', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('fiscal_entities')
        .select('country')
        .eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Get uploaded documents to check which types exist
  const { data: documents } = useQuery({
    queryKey: ['documents-checklist', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('documents')
        .select('extracted_data, status')
        .eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const countries = new Set(entities?.map(e => e.country?.toUpperCase()) || []);
  const hasCA = countries.has('CA') || countries.size === 0; // default to CA
  const hasCL = countries.has('CL');

  // Filter checklist by user's countries
  const relevantItems = CHECKLIST_ITEMS.filter(item => {
    if (item.country === 'both') return true;
    if (item.country === 'CA' && hasCA) return true;
    if (item.country === 'CL' && hasCL) return true;
    return false;
  });

  // Check which document types exist
  const uploadedTypes = new Set<string>();
  documents?.forEach(doc => {
    const extracted = doc.extracted_data as Record<string, any> | null;
    if (extracted?.document_classification) {
      uploadedTypes.add(extracted.document_classification);
    }
  });

  // Also count receipts/invoices by document status
  const hasAnyDocs = (documents?.length || 0) > 0;

  const getItemStatus = (item: ChecklistItem): 'done' | 'missing' => {
    // Simple check: does any uploaded doc match any of the required types?
    for (const docType of item.documentTypes) {
      if (uploadedTypes.has(docType)) return 'done';
    }
    // Fallback: check if common types exist based on count
    if (item.documentTypes.includes('receipt') && hasAnyDocs) return 'done';
    return 'missing';
  };

  const doneCount = relevantItems.filter(item => getItemStatus(item) === 'done').length;
  const totalCount = relevantItems.length;
  const percentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {language === 'es' ? 'Checklist de Preparación Fiscal' : 'Tax Preparation Checklist'}
            </CardTitle>
          </div>
          <Badge variant={percentage === 100 ? 'default' : percentage >= 50 ? 'secondary' : 'destructive'}>
            {doneCount}/{totalCount} ({percentage}%)
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {language === 'es'
            ? 'Documentos necesarios para tu declaración de impuestos'
            : 'Documents needed for your tax return'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {(['high', 'medium', 'low'] as const).map(priority => {
            const items = relevantItems.filter(i => i.priority === priority);
            if (items.length === 0) return null;
            return (
              <div key={priority}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-1.5">
                  {priority === 'high' 
                    ? (language === 'es' ? '🔴 Prioridad Alta' : '🔴 High Priority')
                    : priority === 'medium'
                    ? (language === 'es' ? '🟡 Prioridad Media' : '🟡 Medium Priority')
                    : (language === 'es' ? '🟢 Opcional' : '🟢 Optional')}
                </p>
                {items.map(item => {
                  const status = getItemStatus(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate('/chaos-inbox')}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                    >
                      {status === 'done' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className="text-base mr-1">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${status === 'done' ? 'text-muted-foreground line-through' : ''}`}>
                          {language === 'es' ? item.labelEs : item.labelEn}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {language === 'es' ? item.descEs : item.descEn}
                        </p>
                      </div>
                      {status === 'missing' && priority === 'high' && (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
