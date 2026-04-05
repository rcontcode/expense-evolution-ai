import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useFinancialNarrative } from '@/hooks/data/useFinancialNarrative';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
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
  CheckCircle2,
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

const DONUT_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  'hsl(262, 80%, 55%)',
  'hsl(35, 90%, 50%)',
  'hsl(180, 60%, 45%)',
];

const EXPENSE_CATEGORY_LABELS: Record<string, Record<string, string>> = {
  es: {
    housing: 'Vivienda', utilities: 'Servicios', insurance: 'Seguros', subscriptions: 'Suscripciones',
    transport: 'Transporte', food: 'Comida', health: 'Salud', education: 'Educación', other: 'Otro',
    entertainment: 'Entretenimiento', communication: 'Comunicación', taxes: 'Impuestos',
  },
  en: {
    housing: 'Housing', utilities: 'Utilities', insurance: 'Insurance', subscriptions: 'Subscriptions',
    transport: 'Transport', food: 'Food', health: 'Health', education: 'Education', other: 'Other',
    entertainment: 'Entertainment', communication: 'Communication', taxes: 'Taxes',
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

function SavingsGauge({ rate, l }: { rate: number; l: boolean }) {
  const clampedRate = Math.max(0, Math.min(100, rate));
  const radius = 36;
  const strokeWidth = 7;
  const circumference = Math.PI * radius;
  const offset = circumference - (clampedRate / 100) * circumference;
  const color = rate >= 20 ? 'hsl(var(--primary))' : rate >= 10 ? 'hsl(45, 90%, 50%)' : 'hsl(var(--destructive))';

  return (
    <div className="flex flex-col items-center">
      <svg width="84" height="50" viewBox="0 0 84 50" className="overflow-visible">
        <path
          d={`M 6,46 A ${radius} ${radius} 0 0 1 78,46`}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M 6,46 A ${radius} ${radius} 0 0 1 78,46`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
        <text x="42" y="40" textAnchor="middle" className="fill-foreground text-sm font-bold">{rate}%</text>
      </svg>
      <span className="text-[10px] text-muted-foreground mt-0.5">{l ? 'Tasa de ahorro' : 'Savings rate'}</span>
    </div>
  );
}

function CompletionBar({ narrative, l }: { narrative: ReturnType<typeof useFinancialNarrative>; l: boolean }) {
  const sections = [
    { key: 'profile', filled: narrative.workTypes.length > 0, label: l ? 'Perfil' : 'Profile' },
    { key: 'income', filled: narrative.incomeStreams.length > 0, label: l ? 'Ingresos' : 'Income' },
    { key: 'expenses', filled: narrative.fixedExpenses.length > 0, label: l ? 'Gastos' : 'Expenses' },
    { key: 'banking', filled: narrative.bankingSummary.total > 0, label: l ? 'Banca' : 'Banking' },
    { key: 'docs', filled: narrative.documentSources.receipts > 0, label: l ? 'Docs' : 'Docs' },
  ];
  const filled = sections.filter(s => s.filled).length;
  const pct = Math.round((filled / sections.length) * 100);

  return (
    <div className="flex items-center gap-2 px-1 py-1.5">
      <div className="flex gap-0.5 flex-1">
        {sections.map(s => (
          <div
            key={s.key}
            className={`h-1.5 flex-1 rounded-full transition-colors ${s.filled ? 'bg-primary' : 'bg-muted'}`}
            title={s.label}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
        {filled}/{sections.length} {l ? 'secciones' : 'sections'} · {pct}%
      </span>
    </div>
  );
}

export function FinancialNarrativeCard() {
  const { language } = useLanguage();
  const l = language === 'es';
  const fmt = useFormatCurrency();
  const navigate = useNavigate();
  const [periodMonths, setPeriodMonths] = useState(3);
  const narrative = useFinancialNarrative(periodMonths);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    profile: true,
    income: true,
    expenses: true,
    banking: false,
    balance: true,
    sources: false,
  });

  const toggle = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Donut data for expense categories
  const donutData = useMemo(() => {
    const catMap: Record<string, number> = {};
    narrative.fixedExpenses.forEach(e => {
      const cat = e.category || 'other';
      catMap[cat] = (catMap[cat] || 0) + e.amount;
    });
    return Object.entries(catMap)
      .map(([cat, amount]) => ({
        name: (EXPENSE_CATEGORY_LABELS[language] || EXPENSE_CATEGORY_LABELS.es)[cat] || cat,
        value: amount,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [narrative.fixedExpenses, language]);

  const maxIncome = useMemo(() => Math.max(...narrative.incomeStreams.map(s => s.amount), 1), [narrative.incomeStreams]);

  const periodLabel = periodMonths === 0
    ? (l ? 'Todo el historial' : 'All history')
    : (l ? `Últimos ${periodMonths} ${periodMonths === 1 ? 'mes' : 'meses'}` : `Last ${periodMonths} month${periodMonths > 1 ? 's' : ''}`);

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
      <CardHeader className="pb-1 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            {narrative.userName
              ? `${l ? 'Hola' : 'Hello'} ${narrative.userName.split(' ')[0]} 👋`
              : l ? 'Tu Panorama Financiero' : 'Your Financial Overview'}
          </CardTitle>
          <Select value={String(periodMonths)} onValueChange={v => setPeriodMonths(Number(v))}>
            <SelectTrigger className="h-7 w-auto min-w-[100px] text-xs border-primary/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{l ? '1 mes' : '1 month'}</SelectItem>
              <SelectItem value="3">{l ? '3 meses' : '3 months'}</SelectItem>
              <SelectItem value="6">{l ? '6 meses' : '6 months'}</SelectItem>
              <SelectItem value="12">{l ? '12 meses' : '12 months'}</SelectItem>
              <SelectItem value="0">{l ? 'Todo' : 'All'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{periodLabel}</p>
      </CardHeader>

      <CardContent className="space-y-1 pt-2">
        {/* COMPLETION */}
        <CompletionBar narrative={narrative} l={l} />

        {/* PROFILE */}
        {(narrative.workTypes.length > 0 || narrative.clients.length > 0) && (
          <Collapsible open={openSections.profile}>
            <SectionToggle title={l ? 'Perfil' : 'Profile'} icon={User} open={openSections.profile} onToggle={() => toggle('profile')} />
            <CollapsibleContent className="pl-6 pb-2 text-sm text-muted-foreground">
              {narrative.workTypes.length > 0 && (
                <span>{l ? `Eres persona natural, trabajas como ${workLabels}.` : `You work as ${workLabels}.`} </span>
              )}
              {narrative.clients.length > 0 && (
                <span>
                  {l ? `Tienes ${narrative.clients.length} cliente${narrative.clients.length > 1 ? 's' : ''}` : `You have ${narrative.clients.length} client${narrative.clients.length > 1 ? 's' : ''}`}
                  : {narrative.clients.map(c =>
                    c.totalIncome > 0
                      ? c.name
                      : <span key={c.name} className="text-muted-foreground/60 italic">{c.name} ({l ? 'sin actividad reciente' : 'no recent activity'})</span>
                  ).reduce<React.ReactNode[]>((acc, el, i) => i === 0 ? [el] : [...acc, ', ', el], [])}.
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
          <CollapsibleContent className="pl-6 pb-2 text-sm space-y-1.5">
            {narrative.incomeStreams.length === 0 ? (
              <p className="text-muted-foreground">{l ? 'Sin ingresos registrados aún.' : 'No income recorded yet.'}</p>
            ) : (
              narrative.incomeStreams.map((stream, i) => {
                const typeLabel = (INCOME_TYPE_LABELS[language] || INCOME_TYPE_LABELS.es)[stream.type] || stream.type;
                const barWidth = Math.max(8, (stream.amount / maxIncome) * 100);
                return (
                  <div key={i} className="space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm truncate">
                        <span className="font-medium">{stream.clientName || typeLabel}</span>
                        {stream.dayOfMonth && (
                          <span className="text-muted-foreground text-xs ml-1">
                            ({l ? `día ${stream.dayOfMonth}` : `day ${stream.dayOfMonth}`})
                          </span>
                        )}
                      </span>
                      <span className="text-primary font-semibold text-sm whitespace-nowrap">{fmt.formatCurrency(stream.amount)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
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
              <div className="flex items-start gap-4">
                {/* Donut */}
                {donutData.length > 0 && (
                  <div className="shrink-0">
                    <PieChart width={70} height={70}>
                      <Pie
                        data={donutData}
                        cx={35}
                        cy={35}
                        innerRadius={18}
                        outerRadius={32}
                        paddingAngle={2}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {donutData.map((_, idx) => (
                          <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => fmt.formatCurrency(value)}
                        contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </div>
                )}
                {/* List */}
                <div className="flex-1 space-y-0.5">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {narrative.fixedExpenses.slice(0, 8).map((exp, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: DONUT_COLORS[
                            donutData.findIndex(d => d.name === ((EXPENSE_CATEGORY_LABELS[language] || EXPENSE_CATEGORY_LABELS.es)[exp.category] || exp.category)) % DONUT_COLORS.length
                          ] || DONUT_COLORS[0] }}
                        />
                        <span className="text-muted-foreground">{exp.name}:</span>{' '}
                        <span className="font-medium">{fmt.formatCurrency(exp.amount)}</span>
                      </span>
                    ))}
                    {narrative.fixedExpenses.length > 8 && (
                      <span className="text-muted-foreground">+{narrative.fixedExpenses.length - 8} {l ? 'más' : 'more'}</span>
                    )}
                  </div>
                </div>
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
          <CollapsibleContent className="pl-6 pb-2 text-sm text-muted-foreground space-y-2">
            {narrative.bankingSummary.total === 0 ? (
              <p>{l ? 'Sin transacciones bancarias importadas.' : 'No bank transactions imported.'}</p>
            ) : (
              <>
                <p>
                  {narrative.bankingSummary.total} {l ? 'registradas' : 'recorded'}
                  {narrative.bankingSummary.banks.length > 0 && ` (${narrative.bankingSummary.banks.join(', ')})`}.
                </p>
                {/* Segmented bar */}
                <div className="space-y-1">
                  <div className="flex h-3 rounded-full overflow-hidden bg-muted/50 border border-border/50">
                    <div
                      className="bg-primary/70 transition-all duration-500"
                      style={{ width: `${(narrative.bankingSummary.matched / Math.max(narrative.bankingSummary.total, 1)) * 100}%` }}
                      title={l ? 'Clasificadas' : 'Classified'}
                    />
                    <div
                      className="bg-amber-400/70 transition-all duration-500"
                      style={{ width: `${(narrative.bankingSummary.pending / Math.max(narrative.bankingSummary.total, 1)) * 100}%` }}
                      title={l ? 'Pendientes' : 'Pending'}
                    />
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary/70" />
                      {narrative.bankingSummary.matched} {l ? 'clasificadas' : 'classified'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400/70" />
                      {narrative.bankingSummary.pending} {l ? 'pendientes' : 'pending'}
                    </span>
                  </div>
                </div>
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
          <CollapsibleContent className="pl-6 pb-2 text-sm space-y-3">
            <div className="flex items-center gap-6">
              {/* Gauge */}
              <SavingsGauge rate={narrative.savingsRate} l={l} />
              {/* Numbers */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary/70" />
                  <span className="text-muted-foreground text-xs">{l ? 'Ingresos' : 'Income'}</span>
                  <span className="text-primary font-semibold ml-auto">{fmt.formatCurrency(narrative.totalMonthlyIncome)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-destructive/60" />
                  <span className="text-muted-foreground text-xs">{l ? 'Gastos' : 'Expenses'}</span>
                  <span className="text-destructive font-semibold ml-auto">{fmt.formatCurrency(narrative.monthlyExpenses)}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  <span className="text-muted-foreground text-xs">{l ? 'Balance' : 'Balance'}</span>
                  <span className={`font-bold ml-auto ${narrative.balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {narrative.balance >= 0 ? '+' : ''}{fmt.formatCurrency(narrative.balance)}
                  </span>
                </div>
              </div>
            </div>
            {/* Proportion bar */}
            {narrative.totalMonthlyIncome > 0 && (
              <div className="flex h-3 rounded-full overflow-hidden bg-muted/50 border border-border/50">
                <div
                  className="bg-primary/70 transition-all duration-500"
                  style={{ width: `${Math.min(100, (narrative.totalMonthlyIncome / (narrative.totalMonthlyIncome + narrative.monthlyExpenses)) * 100)}%` }}
                />
                <div
                  className="bg-destructive/60 transition-all duration-500"
                  style={{ width: `${Math.min(100, (narrative.monthlyExpenses / (narrative.totalMonthlyIncome + narrative.monthlyExpenses)) * 100)}%` }}
                />
              </div>
            )}
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
