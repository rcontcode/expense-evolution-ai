import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useFinancialNarrative } from '@/hooks/data/useFinancialNarrative';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  User,
  TrendingUp,
  TrendingDown,
  Landmark,
  FileText,
  BarChart3,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const WORK_TYPE_LABELS: Record<string, Record<string, string>> = {
  es: {
    employee: 'empleado',
    contractor: 'contratista independiente',
    freelancer: 'freelancer',
    business_owner: 'dueño de negocio',
    self_employed: 'trabajador independiente',
  },
  en: {
    employee: 'employee',
    contractor: 'independent contractor',
    freelancer: 'freelancer',
    business_owner: 'business owner',
    self_employed: 'self-employed',
  },
};

const INCOME_TYPE_LABELS: Record<string, Record<string, string>> = {
  es: {
    salary: 'Sueldo',
    client_payment: 'Pago de cliente',
    bonus: 'Bono',
    gift: 'Regalo',
    refund: 'Reembolso',
    investment_stocks: 'Inversiones',
    other: 'Otro ingreso',
  },
  en: {
    salary: 'Salary',
    client_payment: 'Client payment',
    bonus: 'Bonus',
    gift: 'Gift',
    refund: 'Refund',
    investment_stocks: 'Investments',
    other: 'Other income',
  },
};

function SectionToggle({ title, icon: Icon, open, onToggle, badge }: {
  title: string;
  icon: React.ElementType;
  open: boolean;
  onToggle: () => void;
  badge?: string;
}) {
  return (
    <CollapsibleTrigger asChild onClick={onToggle}>
      <button className="flex items-center gap-2 w-full text-left py-2 px-1 rounded-lg hover:bg-muted/50 transition-colors group">
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <span className="font-medium text-sm flex-1">{title}</span>
        {badge && (
          <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{badge}</span>
        )}
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
    </CollapsibleTrigger>
  );
}

export function FinancialNarrativeCard() {
  const { language } = useLanguage();
  const l = language === 'es';
  const fmt = useFormatCurrency();
  const navigate = useNavigate();
  const narrative = useFinancialNarrative();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    profile: true,
    income: true,
    expenses: true,
    banking: false,
    balance: true,
    sources: false,
  });

  const toggle = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  if (narrative.isLoading) {
    return <Skeleton className="h-[300px] rounded-xl" />;
  }

  if (!narrative.hasData) {
    return (
      <Card className="border-dashed" data-section="financial-narrative">
        <CardContent className="py-8 text-center space-y-3">
          <Sparkles className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {l
              ? 'Cuando registres ingresos, gastos o importes un estado de cuenta, aquí aparecerá tu panorama financiero personalizado.'
              : 'Once you add income, expenses, or import a bank statement, your personalized financial overview will appear here.'}
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button variant="outline" size="sm" onClick={() => navigate('/income')}>
              {l ? 'Agregar ingreso' : 'Add income'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/chaos')}>
              {l ? 'Subir documento' : 'Upload document'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const workLabels = narrative.workTypes
    .map(wt => (WORK_TYPE_LABELS[language] || WORK_TYPE_LABELS.es)[wt] || wt)
    .join(` ${l ? 'y' : 'and'} `);

  return (
    <Card className="overflow-hidden" data-section="financial-narrative">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          {narrative.userName
            ? `${l ? 'Hola' : 'Hello'} ${narrative.userName.split(' ')[0]} 👋 — ${l ? 'Tu Panorama Financiero' : 'Your Financial Overview'}`
            : l ? 'Tu Panorama Financiero' : 'Your Financial Overview'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-2">
        {/* PROFILE */}
        {narrative.workTypes.length > 0 && (
          <Collapsible open={openSections.profile}>
            <SectionToggle title={l ? 'Perfil' : 'Profile'} icon={User} open={openSections.profile} onToggle={() => toggle('profile')} />
            <CollapsibleContent className="pl-6 pb-2 text-sm text-muted-foreground">
              {l
                ? `Eres persona natural, trabajas como ${workLabels}.`
                : `You work as ${workLabels}.`}
              {narrative.clients.length > 0 && (
                <span>
                  {' '}{l ? `Tienes ${narrative.clients.length} cliente${narrative.clients.length > 1 ? 's' : ''} activo${narrative.clients.length > 1 ? 's' : ''}` : `You have ${narrative.clients.length} active client${narrative.clients.length > 1 ? 's' : ''}`}
                  : {narrative.clients.map(c => c.name).join(', ')}.
                </span>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* INCOME */}
        <Collapsible open={openSections.income}>
          <SectionToggle
            title={`📥 ${l ? 'Ingresos' : 'Income'}`}
            icon={TrendingUp}
            open={openSections.income}
            onToggle={() => toggle('income')}
            badge={fmt.formatCurrency(narrative.totalMonthlyIncome) + (l ? '/mes' : '/mo')}
          />
          <CollapsibleContent className="pl-6 pb-2 text-sm space-y-1">
            {narrative.incomeStreams.length === 0 ? (
              <p className="text-muted-foreground">{l ? 'Sin ingresos registrados aún.' : 'No income recorded yet.'}</p>
            ) : (
              narrative.incomeStreams.map((stream, i) => {
                const typeLabel = (INCOME_TYPE_LABELS[language] || INCOME_TYPE_LABELS.es)[stream.type] || stream.type;
                return (
                  <div key={i} className="flex items-start gap-1">
                    <span className="text-muted-foreground">•</span>
                    <span>
                      <span className="font-medium">{stream.clientName || typeLabel}</span>
                      {': '}
                      <span className="text-primary font-semibold">{fmt.formatCurrency(stream.amount)}</span>
                      {stream.dayOfMonth && (
                        <span className="text-muted-foreground">
                          {' '}({l ? `día ${stream.dayOfMonth}` : `day ${stream.dayOfMonth}`})
                        </span>
                      )}
                    </span>
                  </div>
                );
              })
            )}
            <Button variant="ghost" size="sm" className="h-6 text-xs px-1 text-primary" onClick={() => navigate('/income')}>
              {l ? 'Ver todos' : 'View all'} <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* FIXED EXPENSES */}
        <Collapsible open={openSections.expenses}>
          <SectionToggle
            title={`📤 ${l ? 'Gastos fijos' : 'Fixed expenses'}`}
            icon={TrendingDown}
            open={openSections.expenses}
            onToggle={() => toggle('expenses')}
            badge={fmt.formatCurrency(narrative.totalFixedExpenses) + (l ? '/mes' : '/mo')}
          />
          <CollapsibleContent className="pl-6 pb-2 text-sm">
            {narrative.fixedExpenses.length === 0 ? (
              <p className="text-muted-foreground">{l ? 'Sin pagos recurrentes configurados.' : 'No recurring payments set up.'}</p>
            ) : (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {narrative.fixedExpenses.slice(0, 8).map((exp, i) => (
                  <span key={i}>
                    <span className="text-muted-foreground">{exp.name}:</span>{' '}
                    <span className="font-medium">{fmt.formatCurrency(exp.amount)}</span>
                  </span>
                ))}
                {narrative.fixedExpenses.length > 8 && (
                  <span className="text-muted-foreground">+{narrative.fixedExpenses.length - 8} {l ? 'más' : 'more'}</span>
                )}
              </div>
            )}
            <Button variant="ghost" size="sm" className="h-6 text-xs px-1 text-primary mt-1" onClick={() => navigate('/bills')}>
              {l ? 'Ver pagos fijos' : 'View fixed payments'} <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* BANKING */}
        <Collapsible open={openSections.banking}>
          <SectionToggle
            title={`💳 ${l ? 'Transacciones bancarias' : 'Bank transactions'}`}
            icon={Landmark}
            open={openSections.banking}
            onToggle={() => toggle('banking')}
            badge={String(narrative.bankingSummary.total)}
          />
          <CollapsibleContent className="pl-6 pb-2 text-sm text-muted-foreground">
            {narrative.bankingSummary.total === 0 ? (
              <p>{l ? 'Sin transacciones bancarias importadas.' : 'No bank transactions imported.'}</p>
            ) : (
              <>
                <p>
                  {narrative.bankingSummary.total} {l ? 'registradas' : 'recorded'}
                  {narrative.bankingSummary.banks.length > 0 && ` (${narrative.bankingSummary.banks.join(', ')})`}.
                  {' '}{narrative.bankingSummary.matched} {l ? 'clasificadas' : 'classified'},
                  {' '}{narrative.bankingSummary.pending} {l ? 'pendientes' : 'pending'}.
                </p>
                {narrative.bankingSummary.lastImport && (
                  <p className="text-xs">
                    {l ? 'Última importación' : 'Last import'}: {new Date(narrative.bankingSummary.lastImport).toLocaleDateString(language === 'es' ? 'es-CL' : 'en-CA')}
                  </p>
                )}
              </>
            )}
            <Button variant="ghost" size="sm" className="h-6 text-xs px-1 text-primary" onClick={() => navigate('/banking')}>
              {l ? 'Ir a banca' : 'Go to banking'} <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* BALANCE */}
        <Collapsible open={openSections.balance}>
          <SectionToggle
            title={`📊 ${l ? 'Balance mensual' : 'Monthly balance'}`}
            icon={BarChart3}
            open={openSections.balance}
            onToggle={() => toggle('balance')}
            badge={`${narrative.balance >= 0 ? '+' : ''}${fmt.formatCurrency(narrative.balance)}`}
          />
          <CollapsibleContent className="pl-6 pb-2 text-sm">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span>
                <span className="text-muted-foreground">{l ? 'Ingresos' : 'Income'}:</span>{' '}
                <span className="text-primary font-semibold">{fmt.formatCurrency(narrative.totalMonthlyIncome)}</span>
              </span>
              <span>
                <span className="text-muted-foreground">{l ? 'Gastos' : 'Expenses'}:</span>{' '}
                <span className="text-destructive font-semibold">{fmt.formatCurrency(narrative.monthlyExpenses)}</span>
              </span>
              <span>
                <span className="text-muted-foreground">{l ? 'Ahorro' : 'Savings'}:</span>{' '}
                <span className={`font-semibold ${narrative.savingsRate >= 20 ? 'text-primary' : narrative.savingsRate >= 0 ? 'text-accent-foreground' : 'text-destructive'}`}>
                  {narrative.savingsRate}%
                </span>
              </span>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* DATA SOURCES */}
        <Collapsible open={openSections.sources}>
          <SectionToggle
            title={`📁 ${l ? 'Fuentes de datos' : 'Data sources'}`}
            icon={FileText}
            open={openSections.sources}
            onToggle={() => toggle('sources')}
          />
          <CollapsibleContent className="pl-6 pb-2 text-sm text-muted-foreground space-y-1">
            <p>
              {narrative.documentSources.bankSessions} {l ? 'importaciones bancarias' : 'bank imports'} ·{' '}
              {narrative.documentSources.receipts} {l ? 'documentos' : 'documents'} ·{' '}
              {narrative.documentSources.contracts} {l ? 'contratos' : 'contracts'}
            </p>
            <p className="text-xs">
              {l
                ? 'Si algo no cuadra, revisa y corrige en:'
                : 'If something doesn\'t match, review and correct in:'}
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => navigate('/chaos')}>
                {l ? 'Bandeja del Caos' : 'Chaos Inbox'}
              </Button>
              <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => navigate('/banking')}>
                {l ? 'Centro Bancario' : 'Bank Center'}
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

export default FinancialNarrativeCard;
