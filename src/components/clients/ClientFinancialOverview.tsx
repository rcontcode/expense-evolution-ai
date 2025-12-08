import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Building2, 
  Landmark, 
  Wallet, 
  Receipt,
  Car,
  Utensils,
  Briefcase,
  Info,
  ArrowRight,
  Percent,
  Calculator,
  Lightbulb,
  FileText,
  FolderKanban
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useContracts } from '@/hooks/data/useContracts';
import { useProjectsWithClients } from '@/hooks/data/useProjectClients';

// CRA deduction rates by category
const CRA_RATES: Record<string, { rate: number; description: string; descriptionEn: string }> = {
  meals: { rate: 50, description: 'Comidas de negocios (50% deducible)', descriptionEn: 'Business meals (50% deductible)' },
  travel: { rate: 100, description: 'Gastos de viaje de negocios', descriptionEn: 'Business travel expenses' },
  equipment: { rate: 100, description: 'Equipos y herramientas de trabajo', descriptionEn: 'Work equipment and tools' },
  software: { rate: 100, description: 'Software y suscripciones', descriptionEn: 'Software and subscriptions' },
  mileage: { rate: 100, description: 'Kilometraje ($0.70/km primeros 5000km)', descriptionEn: 'Mileage ($0.70/km first 5000km)' },
  fuel: { rate: 100, description: 'Combustible para uso de negocios', descriptionEn: 'Fuel for business use' },
  home_office: { rate: 100, description: 'Oficina en casa (proporcional)', descriptionEn: 'Home office (proportional)' },
  professional_services: { rate: 100, description: 'Servicios profesionales', descriptionEn: 'Professional services' },
  office_supplies: { rate: 100, description: 'Suministros de oficina', descriptionEn: 'Office supplies' },
  utilities: { rate: 100, description: 'Servicios (proporcional)', descriptionEn: 'Utilities (proportional)' },
  other: { rate: 100, description: 'Otros gastos de negocios', descriptionEn: 'Other business expenses' },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  meals: Utensils,
  travel: Car,
  equipment: Briefcase,
  fuel: Car,
  mileage: Car,
  other: Receipt,
};

const HST_RATE = 0.13;

interface ClientFinancialOverviewProps {
  clientId: string;
  clientName: string;
}

export function ClientFinancialOverview({ clientId, clientName }: ClientFinancialOverviewProps) {
  const { language } = useLanguage();
  const { data: allExpenses } = useExpenses();
  const { data: contracts } = useContracts();
  const { data: projects } = useProjectsWithClients();

  const clientExpenses = useMemo(() => 
    allExpenses?.filter(e => e.client_id === clientId) || [],
    [allExpenses, clientId]
  );

  const clientContracts = useMemo(() =>
    contracts?.filter(c => c.client_id === clientId) || [],
    [contracts, clientId]
  );

  const clientProjects = useMemo(() =>
    projects?.filter(p => 
      p.client_id === clientId || 
      p.clients?.some((c: any) => c.id === clientId)
    ) || [],
    [projects, clientId]
  );

  // Group expenses by reimbursement type
  const expenseBreakdown = useMemo(() => {
    const clientReimbursable: typeof clientExpenses = [];
    const craDeductible: typeof clientExpenses = [];
    const personal: typeof clientExpenses = [];
    const pendingClassification: typeof clientExpenses = [];

    clientExpenses.forEach(expense => {
      switch (expense.reimbursement_type) {
        case 'client_reimbursable':
          clientReimbursable.push(expense);
          break;
        case 'cra_deductible':
          craDeductible.push(expense);
          break;
        case 'personal':
          personal.push(expense);
          break;
        default:
          pendingClassification.push(expense);
      }
    });

    return { clientReimbursable, craDeductible, personal, pendingClassification };
  }, [clientExpenses]);

  // Calculate totals and benefits
  const financialSummary = useMemo(() => {
    const clientTotal = expenseBreakdown.clientReimbursable.reduce(
      (sum, e) => sum + Number(e.amount), 0
    );

    const craByCategory: Record<string, { total: number; deductible: number; count: number }> = {};
    let totalCraExpenses = 0;
    let totalCraDeductible = 0;

    [...expenseBreakdown.craDeductible, ...expenseBreakdown.clientReimbursable].forEach(expense => {
      const category = expense.category || 'other';
      const rate = CRA_RATES[category]?.rate || 100;
      const amount = Number(expense.amount);
      const deductibleAmount = (amount * rate) / 100;

      if (!craByCategory[category]) {
        craByCategory[category] = { total: 0, deductible: 0, count: 0 };
      }
      craByCategory[category].total += amount;
      craByCategory[category].deductible += deductibleAmount;
      craByCategory[category].count += 1;
      totalCraExpenses += amount;
      totalCraDeductible += deductibleAmount;
    });

    const estimatedITC = totalCraDeductible * HST_RATE;
    const personalTotal = expenseBreakdown.personal.reduce(
      (sum, e) => sum + Number(e.amount), 0
    );
    const pendingTotal = expenseBreakdown.pendingClassification.reduce(
      (sum, e) => sum + Number(e.amount), 0
    );
    const estimatedTaxBenefit = totalCraDeductible * 0.30;

    return {
      clientTotal,
      clientCount: expenseBreakdown.clientReimbursable.length,
      craByCategory,
      totalCraExpenses,
      totalCraDeductible,
      estimatedITC,
      estimatedTaxBenefit,
      personalTotal,
      personalCount: expenseBreakdown.personal.length,
      pendingTotal,
      pendingCount: expenseBreakdown.pendingClassification.length,
      totalBenefit: clientTotal + estimatedTaxBenefit + estimatedITC,
    };
  }, [expenseBreakdown]);

  const totalExpenses = clientExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const recoveryRate = totalExpenses > 0 
    ? ((financialSummary.totalBenefit / totalExpenses) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Main Overview Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Panorama Financiero' : 'Financial Overview'}
          </CardTitle>
          <CardDescription>
            {language === 'es' 
              ? `Resumen financiero de gastos con ${clientName}`
              : `Financial summary of expenses with ${clientName}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Recovery Rate */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {language === 'es' ? 'Tasa de Recuperación Total' : 'Total Recovery Rate'}
              </span>
              <span className="text-2xl font-bold text-primary">{recoveryRate.toFixed(0)}%</span>
            </div>
            <Progress value={Math.min(recoveryRate, 100)} className="h-3" />
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'es' 
                ? `De $${totalExpenses.toFixed(2)} en gastos, recuperas ~$${financialSummary.totalBenefit.toFixed(2)} entre reembolsos y beneficios fiscales`
                : `Of $${totalExpenses.toFixed(2)} in expenses, you recover ~$${financialSummary.totalBenefit.toFixed(2)} between reimbursements and tax benefits`}
            </p>
          </div>

          {/* Three Columns Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700 dark:text-green-300">
                  {language === 'es' ? 'Cliente te Paga' : 'Client Pays You'}
                </span>
              </div>
              <p className="text-3xl font-bold text-green-600">
                ${financialSummary.clientTotal.toFixed(2)}
              </p>
              <p className="text-xs text-green-600/80 mt-1">
                {financialSummary.clientCount} {language === 'es' ? 'gastos' : 'expenses'}
              </p>
              <Badge variant="outline" className="mt-2 bg-green-100 text-green-700 border-green-300">
                100% {language === 'es' ? 'reembolso' : 'reimbursement'}
              </Badge>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
              <div className="flex items-center gap-2 mb-2">
                <Landmark className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  {language === 'es' ? 'Beneficio Fiscal (CRA)' : 'Tax Benefit (CRA)'}
                </span>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                ${(financialSummary.estimatedTaxBenefit + financialSummary.estimatedITC).toFixed(2)}
              </p>
              <div className="text-xs text-blue-600/80 mt-1 space-y-0.5">
                <p>${financialSummary.estimatedTaxBenefit.toFixed(2)} {language === 'es' ? 'ahorro impuestos' : 'tax savings'}</p>
                <p>${financialSummary.estimatedITC.toFixed(2)} ITC (HST/GST)</p>
              </div>
              <Badge variant="outline" className="mt-2 bg-blue-100 text-blue-700 border-blue-300">
                ~30% {language === 'es' ? 'retorno' : 'return'}
              </Badge>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">
                  {language === 'es' ? 'Gasto Personal' : 'Personal Expense'}
                </span>
              </div>
              <p className="text-3xl font-bold text-muted-foreground">
                ${financialSummary.personalTotal.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {financialSummary.personalCount} {language === 'es' ? 'gastos' : 'expenses'}
              </p>
              <Badge variant="outline" className="mt-2">
                0% {language === 'es' ? 'beneficio' : 'benefit'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Associated Projects */}
      {clientProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderKanban className="h-5 w-5 text-primary" />
              {language === 'es' ? 'Proyectos Asociados' : 'Associated Projects'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {clientProjects.map(project => (
                <div 
                  key={project.id} 
                  className="p-3 rounded-lg bg-muted/30 border flex items-center gap-3"
                >
                  <div 
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: project.color || '#3B82F6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{project.name}</p>
                    {project.status && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {project.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Classification Alert */}
      {financialSummary.pendingCount > 0 && (
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-700 dark:text-amber-300">
            {language === 'es' ? 'Gastos Pendientes de Clasificar' : 'Expenses Pending Classification'}
          </AlertTitle>
          <AlertDescription className="text-amber-600">
            {language === 'es' 
              ? `Tienes ${financialSummary.pendingCount} gastos ($${financialSummary.pendingTotal.toFixed(2)}) sin clasificar.`
              : `You have ${financialSummary.pendingCount} expenses ($${financialSummary.pendingTotal.toFixed(2)}) unclassified.`}
          </AlertDescription>
        </Alert>
      )}

      {/* CRA Deduction Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Detalle para Declaración CRA (T2125)' : 'CRA Declaration Details (T2125)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(financialSummary.craByCategory)
              .sort((a, b) => b[1].deductible - a[1].deductible)
              .map(([category, data]) => {
                const Icon = CATEGORY_ICONS[category] || Receipt;
                const rateInfo = CRA_RATES[category] || CRA_RATES.other;
                
                return (
                  <div key={category} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">{category.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">
                            {data.count} {language === 'es' ? 'gastos' : 'expenses'} • 
                            {language === 'es' ? rateInfo.description : rateInfo.descriptionEn}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        <Percent className="h-3 w-3 mr-1" />
                        {rateInfo.rate}%
                      </Badge>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">{language === 'es' ? 'Gastado' : 'Spent'}</p>
                        <p className="font-medium">${data.total.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">{language === 'es' ? 'Deducible' : 'Deductible'}</p>
                        <p className="font-medium text-blue-600">${data.deductible.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">{language === 'es' ? 'Ahorro Est.' : 'Est. Savings'}</p>
                        <p className="font-medium text-green-600">${(data.deductible * 0.30).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {Object.keys(financialSummary.craByCategory).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{language === 'es' ? 'No hay gastos deducibles aún' : 'No deductible expenses yet'}</p>
            </div>
          )}

          <Separator className="my-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">${financialSummary.totalCraExpenses.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{language === 'es' ? 'Total Gastos' : 'Total Expenses'}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">${financialSummary.totalCraDeductible.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{language === 'es' ? 'Total Deducible' : 'Total Deductible'}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">${financialSummary.estimatedTaxBenefit.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{language === 'es' ? 'Ahorro Impuestos' : 'Tax Savings'}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">${financialSummary.estimatedITC.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">ITC (HST/GST)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts */}
      {clientContracts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              {language === 'es' ? 'Contratos con este Cliente' : 'Contracts with this Client'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clientContracts.map(contract => (
                <div key={contract.id} className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-medium">{contract.title || contract.file_name}</p>
                  {contract.user_notes && (
                    <p className="text-sm text-muted-foreground mt-1 italic">
                      "{contract.user_notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            {language === 'es' ? 'Consejos para Optimizar' : 'Optimization Tips'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {financialSummary.pendingCount > 0 && (
              <li className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>
                  {language === 'es' 
                    ? `Clasifica los ${financialSummary.pendingCount} gastos pendientes para maximizar beneficios`
                    : `Classify the ${financialSummary.pendingCount} pending expenses to maximize benefits`}
                </span>
              </li>
            )}
            {clientContracts.length === 0 && (
              <li className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>
                  {language === 'es' 
                    ? 'Sube un contrato para identificar automáticamente gastos reembolsables'
                    : 'Upload a contract to automatically identify reimbursable expenses'}
                </span>
              </li>
            )}
            <li className="flex items-start gap-2 text-sm">
              <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>
                {language === 'es' 
                  ? 'Revisa que todos los gastos de negocio estén categorizados correctamente'
                  : 'Review that all business expenses are correctly categorized'}
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
