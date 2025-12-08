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
  TrendingUp, 
  Receipt,
  Car,
  Utensils,
  Briefcase,
  Info,
  CheckCircle2,
  ArrowRight,
  Percent,
  DollarSign,
  Calculator,
  Lightbulb,
  PiggyBank,
  FileText,
  AlertTriangle,
  Handshake,
  Home,
  Wifi,
  CreditCard,
  Package
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useContracts } from '@/hooks/data/useContracts';
import { useClients } from '@/hooks/data/useClients';
import { useProjects } from '@/hooks/data/useProjects';

// CRA deduction rates by category with icons
const CRA_RATES: Record<string, { rate: number; description: string; descriptionEn: string; icon: React.ElementType }> = {
  meals: { rate: 50, description: 'Comidas de negocios (50% deducible)', descriptionEn: 'Business meals (50% deductible)', icon: Utensils },
  travel: { rate: 100, description: 'Gastos de viaje de negocios', descriptionEn: 'Business travel expenses', icon: Car },
  equipment: { rate: 100, description: 'Equipos y herramientas de trabajo', descriptionEn: 'Work equipment and tools', icon: Briefcase },
  software: { rate: 100, description: 'Software y suscripciones', descriptionEn: 'Software and subscriptions', icon: CreditCard },
  mileage: { rate: 100, description: 'Kilometraje ($0.70/km primeros 5000km)', descriptionEn: 'Mileage ($0.70/km first 5000km)', icon: Car },
  fuel: { rate: 100, description: 'Combustible para uso de negocios', descriptionEn: 'Fuel for business use', icon: Car },
  home_office: { rate: 100, description: 'Oficina en casa (proporcional)', descriptionEn: 'Home office (proportional)', icon: Home },
  professional_services: { rate: 100, description: 'Servicios profesionales', descriptionEn: 'Professional services', icon: Briefcase },
  office_supplies: { rate: 100, description: 'Suministros de oficina', descriptionEn: 'Office supplies', icon: Package },
  utilities: { rate: 100, description: 'Internet, teléfono (proporcional)', descriptionEn: 'Internet, phone (proportional)', icon: Wifi },
  vehicle_interest: { rate: 100, description: 'Intereses de préstamo de vehículo', descriptionEn: 'Vehicle loan interest', icon: Car },
  insurance: { rate: 100, description: 'Seguros de negocio', descriptionEn: 'Business insurance', icon: FileText },
  other: { rate: 100, description: 'Otros gastos de negocios', descriptionEn: 'Other business expenses', icon: Receipt },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  meals: Utensils,
  travel: Car,
  equipment: Briefcase,
  fuel: Car,
  mileage: Car,
  other: Receipt,
};

const HST_RATE = 0.13; // 13% HST

interface ProjectFinancialOverviewProps {
  projectId: string;
  projectName: string;
}

export function ProjectFinancialOverview({ projectId, projectName }: ProjectFinancialOverviewProps) {
  const { language } = useLanguage();
  const { data: allExpenses } = useExpenses();
  const { data: contracts } = useContracts();
  const { data: clients } = useClients();
  const { data: projects } = useProjects();

  // Get project details including client_id
  const project = useMemo(() => 
    projects?.find(p => p.id === projectId),
    [projects, projectId]
  );

  // Get contracts associated with project's client
  const projectContracts = useMemo(() => {
    if (!project?.client_id) return [];
    return contracts?.filter(c => c.client_id === project.client_id) || [];
  }, [contracts, project?.client_id]);

  // Get expenses for this project OR for the project's client
  const projectExpenses = useMemo(() => 
    allExpenses?.filter(e => 
      e.project_id === projectId || 
      (project?.client_id && e.client_id === project.client_id)
    ) || [],
    [allExpenses, projectId, project?.client_id]
  );

  // Count unassigned expenses that could belong to this project
  const unassignedExpenses = useMemo(() => 
    allExpenses?.filter(e => !e.project_id && !e.client_id) || [],
    [allExpenses]
  );

  // Group expenses by reimbursement type
  const expenseBreakdown = useMemo(() => {
    const clientReimbursable: typeof projectExpenses = [];
    const craDeductible: typeof projectExpenses = [];
    const personal: typeof projectExpenses = [];
    const pendingClassification: typeof projectExpenses = [];

    projectExpenses.forEach(expense => {
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
  }, [projectExpenses]);

  // Calculate totals and benefits
  const financialSummary = useMemo(() => {
    // Client reimbursable
    const clientTotal = expenseBreakdown.clientReimbursable.reduce(
      (sum, e) => sum + Number(e.amount), 0
    );

    // CRA deductible with rates
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

    // HST/ITC calculations (simplified - ITC on deductible portion)
    const estimatedITC = totalCraDeductible * HST_RATE;

    // Personal expenses (no benefit)
    const personalTotal = expenseBreakdown.personal.reduce(
      (sum, e) => sum + Number(e.amount), 0
    );

    // Pending classification
    const pendingTotal = expenseBreakdown.pendingClassification.reduce(
      (sum, e) => sum + Number(e.amount), 0
    );

    // Tax benefit estimation (assuming marginal rate of ~30%)
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

  const totalExpenses = projectExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
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
              ? 'Resumen de cómo se tratan los gastos de este proyecto'
              : 'Summary of how expenses in this project are treated'}
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
            {/* Client Reimbursable */}
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

            {/* CRA Deductible */}
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

            {/* Personal (No Benefit) */}
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

      {/* Unassigned Expenses Alert */}
      {unassignedExpenses.length > 0 && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950/30">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-700 dark:text-red-300">
            {language === 'es' ? 'Gastos Sin Asignar a Proyecto/Cliente' : 'Expenses Not Assigned to Project/Client'}
          </AlertTitle>
          <AlertDescription className="text-red-600">
            {language === 'es' 
              ? `Tienes ${unassignedExpenses.length} gastos ($${unassignedExpenses.reduce((s, e) => s + Number(e.amount), 0).toFixed(2)}) que no están asignados a ningún proyecto o cliente. Ve a Gastos para asignarlos.`
              : `You have ${unassignedExpenses.length} expenses ($${unassignedExpenses.reduce((s, e) => s + Number(e.amount), 0).toFixed(2)}) not assigned to any project or client. Go to Expenses to assign them.`}
          </AlertDescription>
        </Alert>
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
              ? `Tienes ${financialSummary.pendingCount} gastos ($${financialSummary.pendingTotal.toFixed(2)}) sin clasificar. Clasifícalos para ver los beneficios correctamente.`
              : `You have ${financialSummary.pendingCount} expenses ($${financialSummary.pendingTotal.toFixed(2)}) unclassified. Classify them to see benefits correctly.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Contract Agreements - What Client Reimburses */}
      {projectContracts.length > 0 && (
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="bg-green-50 dark:bg-green-950/30">
            <CardTitle className="flex items-center gap-2 text-lg text-green-700 dark:text-green-300">
              <Handshake className="h-5 w-5" />
              {language === 'es' ? 'Acuerdos con el Cliente (Reembolsos)' : 'Client Agreements (Reimbursements)'}
            </CardTitle>
            <CardDescription>
              {language === 'es' 
                ? 'Lo que el cliente acordó reembolsarte según los contratos'
                : 'What the client agreed to reimburse you according to contracts'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {projectContracts.map(contract => (
                <div key={contract.id} className="p-4 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{contract.title || contract.file_name}</span>
                  </div>
                  {contract.user_notes && (
                    <div className="mt-2 p-3 bg-green-100 dark:bg-green-900/30 rounded border-l-4 border-green-500">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                        {language === 'es' ? 'Tu nota sobre el acuerdo:' : 'Your note about the agreement:'}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 italic">
                        "{contract.user_notes}"
                      </p>
                    </div>
                  )}
                  {/* Show categories typically reimbursed by client */}
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">
                      {language === 'es' ? 'Categorías típicamente reembolsables por cliente:' : 'Categories typically reimbursable by client:'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['equipment', 'office_supplies', 'software', 'travel'].map(cat => (
                        <Badge key={cat} variant="outline" className="bg-green-100 text-green-700 border-green-300">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {cat.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CRA Deduction Reference - Always Show All Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Landmark className="h-5 w-5 text-blue-600" />
            {language === 'es' ? 'Categorías Deducibles CRA (T2125)' : 'CRA Deductible Categories (T2125)'}
          </CardTitle>
          <CardDescription>
            {language === 'es' 
              ? 'Estos gastos de negocio son deducibles en tu declaración de impuestos'
              : 'These business expenses are deductible on your tax return'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(CRA_RATES).map(([category, rateInfo]) => {
              const Icon = rateInfo.icon;
              const categoryData = financialSummary.craByCategory[category];
              const hasExpenses = categoryData && categoryData.count > 0;
              
              return (
                <div 
                  key={category} 
                  className={`p-3 rounded-lg border ${hasExpenses ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' : 'bg-muted/30 border-border'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${hasExpenses ? 'bg-blue-100 dark:bg-blue-900' : 'bg-muted'}`}>
                        <Icon className={`h-4 w-4 ${hasExpenses ? 'text-blue-600' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <p className={`font-medium capitalize text-sm ${hasExpenses ? 'text-blue-700 dark:text-blue-300' : ''}`}>
                          {category.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {language === 'es' ? rateInfo.description : rateInfo.descriptionEn}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`font-mono ${rateInfo.rate === 50 ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-blue-100 text-blue-700 border-blue-300'}`}
                    >
                      {rateInfo.rate}%
                    </Badge>
                  </div>
                  {hasExpenses && (
                    <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">{language === 'es' ? 'Gastado' : 'Spent'}</p>
                        <p className="font-medium">${categoryData.total.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{language === 'es' ? 'Deducible' : 'Deductible'}</p>
                        <p className="font-medium text-blue-600">${categoryData.deductible.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{language === 'es' ? 'Ahorro' : 'Savings'}</p>
                        <p className="font-medium text-green-600">${(categoryData.deductible * 0.30).toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Footer */}
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
            {unassignedExpenses.length > 0 && (
              <li className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
                <span className="text-red-600">
                  {language === 'es' 
                    ? `¡Importante! Tienes ${unassignedExpenses.length} gastos sin asignar a proyecto/cliente. Asígnalos para verlos aquí.`
                    : `Important! You have ${unassignedExpenses.length} expenses not assigned to project/client. Assign them to see them here.`}
                </span>
              </li>
            )}
            {financialSummary.pendingCount > 0 && (
              <li className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>
                  {language === 'es' 
                    ? `Clasifica los ${financialSummary.pendingCount} gastos pendientes para maximizar tus beneficios`
                    : `Classify the ${financialSummary.pendingCount} pending expenses to maximize your benefits`}
                </span>
              </li>
            )}
            <li className="flex items-start gap-2 text-sm">
              <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>
                {language === 'es' 
                  ? 'Guarda todos los recibos - los gastos sin comprobante no son deducibles'
                  : 'Keep all receipts - expenses without proof are not deductible'}
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>
                {language === 'es' 
                  ? 'Las comidas de negocios solo son 50% deducibles - considera cocinar o comprar en supermercado'
                  : 'Business meals are only 50% deductible - consider cooking or buying at supermarket'}
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>
                {language === 'es' 
                  ? 'Según tu contrato, los materiales/insumos son reembolsables por el cliente - marca esos gastos como "Reembolsable por Cliente"'
                  : 'According to your contract, materials/supplies are reimbursable by client - mark those expenses as "Client Reimbursable"'}
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>
                {language === 'es' 
                  ? 'Vincula gastos a contratos para validar qué es reembolsable por el cliente'
                  : 'Link expenses to contracts to validate what is reimbursable by the client'}
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Contract Terms Reference */}
      {projectContracts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              {language === 'es' ? 'Contratos Asociados' : 'Associated Contracts'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projectContracts.map(contract => {
                const client = clients?.find(c => c.id === contract.client_id);
                const terms = contract.extracted_terms as any;
                
                return (
                  <div key={contract.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{contract.title || contract.file_name}</span>
                      {client && <Badge variant="outline">{client.name}</Badge>}
                    </div>
                    {terms?.reimbursement_policy?.summary && (
                      <p className="text-sm text-muted-foreground">
                        {terms.reimbursement_policy.summary}
                      </p>
                    )}
                    {contract.user_notes && (
                      <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded text-xs">
                        <span className="font-medium">{language === 'es' ? 'Notas:' : 'Notes:'}</span> {contract.user_notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
