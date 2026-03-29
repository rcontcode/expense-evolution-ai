import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AtomicHabitsCard,
  CashflowQuadrantCard, 
  FinancialFreedomCard, 
  PayYourselfFirstCard,
  DebtClassificationCard,
  FinancialJournalCard,
  FinancialHabitsCard,
  FinancialEducationCard,
  FinancialLibrary,
  GlobalLearningChart,
  ReadingReminderSettings,
  ReadingPaceComparison,
  SMARTGoalsCard,
  TracyGoalWizard,
  WeeklyChallengesCard,
  MentorshipProgressSummary,
  LearningPathCard,
} from '@/components/mentorship';
import { WeeklySummaryBadge } from '@/components/mentorship/WeeklySummaryBadge';
import { TracyQuickStats } from '@/components/mentorship/TracyQuickStats';
import { KiyosakiQuickStats } from '@/components/mentorship/KiyosakiQuickStats';
import { MentorshipLevelBanner } from '@/components/mentorship/MentorshipLevelBanner';
import { Target, Sparkles, GraduationCap, Brain, Coins, Atom, BookOpen, ChevronDown } from 'lucide-react';
import { LegalDisclaimer } from '@/components/ui/legal-disclaimer';
import { MentorQuoteBanner } from '@/components/MentorQuoteBanner';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { FinancialBreathingExercise } from '@/components/ecosystem/FinancialBreathingExercise';
import { FinancialFocusTimer } from '@/components/ecosystem/FinancialFocusTimer';
import { FinancialWorryDump } from '@/components/ecosystem/FinancialWorryDump';
import { UnifiedQuoteBanner } from '@/components/ecosystem/UnifiedQuoteBanner';
import { EcosystemPromoCard } from '@/components/ecosystem/EcosystemPromoCard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const MENTOR_THEMES = {
  library: {
    gradient: 'from-purple-500/10 via-violet-500/5 to-fuchsia-500/10',
    border: 'border-purple-500/20',
    icon: '📚',
    color: 'text-purple-500',
  },
  atomic: {
    gradient: 'from-cyan-500/10 via-sky-500/5 to-blue-500/10',
    border: 'border-cyan-500/20',
    icon: '⚛️',
    color: 'text-cyan-500',
  },
  kiyosaki: {
    gradient: 'from-emerald-500/10 via-teal-500/5 to-cyan-500/10',
    border: 'border-emerald-500/20',
    icon: '💰',
    color: 'text-emerald-500',
  },
  rohn: {
    gradient: 'from-amber-500/10 via-orange-500/5 to-yellow-500/10',
    border: 'border-amber-500/20',
    icon: '🌟',
    color: 'text-amber-500',
  },
  tracy: {
    gradient: 'from-blue-500/10 via-indigo-500/5 to-violet-500/10',
    border: 'border-blue-500/20',
    icon: '🎯',
    color: 'text-blue-500',
  },
  wellbeing: {
    gradient: 'from-pink-500/10 via-rose-500/5 to-violet-500/10',
    border: 'border-pink-500/20',
    icon: '🧘',
    color: 'text-pink-500',
  },
};

const MENTOR_TABS = [
  { value: 'library', icon: '📚', labelEs: 'Biblioteca', labelEn: 'Library' },
  { value: 'atomic', icon: '⚛️', labelEs: 'Hábitos', labelEn: 'Habits' },
  { value: 'kiyosaki', icon: '💰', labelEs: 'Activos', labelEn: 'Assets' },
  { value: 'rohn', icon: '🌟', labelEs: 'Journal', labelEn: 'Journal' },
  { value: 'tracy', icon: '🎯', labelEs: 'Metas', labelEn: 'Goals' },
  { value: 'wellbeing', icon: '🧘', labelEs: 'Bienestar', labelEn: 'Wellbeing' },
];

// Mentor micro-tips that rotate on each visit
const MENTOR_TIPS: Record<string, { es: string[]; en: string[] }> = {
  library: {
    es: [
      '💡 Leer 15 minutos diarios de finanzas cambia tu vida en 1 año',
      '💡 Un libro puede ahorrarte años de errores financieros',
      '💡 Los millonarios leen en promedio 2 libros al mes',
    ],
    en: [
      '💡 Reading 15 min of finance daily changes your life in 1 year',
      '💡 One book can save you years of financial mistakes',
      '💡 Millionaires read an average of 2 books per month',
    ],
  },
  atomic: {
    es: [
      '💡 "No subes al nivel de tus metas, caes al nivel de tus sistemas" — James Clear',
      '💡 Mejora 1% cada día: en un año serás 37 veces mejor',
      '💡 Vincula un hábito nuevo a uno que ya tienes (habit stacking)',
    ],
    en: [
      '💡 "You don\'t rise to the level of your goals, you fall to the level of your systems" — Clear',
      '💡 Improve 1% daily: in a year you\'ll be 37x better',
      '💡 Link a new habit to one you already have (habit stacking)',
    ],
  },
  kiyosaki: {
    es: [
      '💡 "¿Este gasto es un activo o un pasivo?" — Pregúntate siempre',
      '💡 Los ricos compran activos, los pobres compran pasivos',
      '💡 Tu casa no es un activo si no genera ingreso pasivo',
    ],
    en: [
      '💡 "Is this expense an asset or a liability?" — Always ask yourself',
      '💡 The rich buy assets, the poor buy liabilities',
      '💡 Your home isn\'t an asset if it doesn\'t generate passive income',
    ],
  },
  rohn: {
    es: [
      '💡 "La disciplina es el puente entre metas y logros" — Jim Rohn',
      '💡 Eres el promedio de las 5 personas con las que más convives',
      '💡 Cuida tu mente como cuidas tu cuenta bancaria',
    ],
    en: [
      '💡 "Discipline is the bridge between goals and accomplishments" — Jim Rohn',
      '💡 You\'re the average of the 5 people you spend the most time with',
      '💡 Guard your mind like you guard your bank account',
    ],
  },
  tracy: {
    es: [
      '💡 "El 3% más rico tiene metas escritas; el resto solo deseos" — Brian Tracy',
      '💡 Usa el método ABCDE para priorizar tus tareas financieras',
      '💡 Una meta sin plazo es solo un sueño',
    ],
    en: [
      '💡 "The top 3% have written goals; the rest only have wishes" — Brian Tracy',
      '💡 Use the ABCDE method to prioritize your financial tasks',
      '💡 A goal without a deadline is just a dream',
    ],
  },
  wellbeing: {
    es: [
      '💡 La ansiedad financiera reduce tu capacidad de tomar buenas decisiones',
      '💡 5 minutos de respiración antes de decisiones financieras grandes',
      '💡 Escribir tus preocupaciones financieras las hace más manejables',
    ],
    en: [
      '💡 Financial anxiety reduces your ability to make good decisions',
      '💡 5 minutes of breathing before big financial decisions',
      '💡 Writing your financial worries makes them more manageable',
    ],
  },
};

function getRotatingTip(tab: string, lang: 'es' | 'en'): string {
  const tips = MENTOR_TIPS[tab]?.[lang] || [];
  if (tips.length === 0) return '';
  // Rotate based on current date so it changes daily
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return tips[dayIndex % tips.length];
}

function TabBanner({ tab, isMobile }: { tab: string; isMobile: boolean }) {
  const { language } = useLanguage();
  const theme = MENTOR_THEMES[tab as keyof typeof MENTOR_THEMES];
  const tip = getRotatingTip(tab, language === 'es' ? 'es' : 'en');

  const ICONS: Record<string, React.ReactNode> = {
    library: <GraduationCap className={`h-4 w-4 sm:h-5 sm:w-5 ${theme.color}`} />,
    atomic: <Atom className={`h-4 w-4 sm:h-5 sm:w-5 ${theme.color}`} />,
    kiyosaki: <Coins className={`h-4 w-4 sm:h-5 sm:w-5 ${theme.color}`} />,
    rohn: <Sparkles className={`h-4 w-4 sm:h-5 sm:w-5 ${theme.color}`} />,
    tracy: <Target className={`h-4 w-4 sm:h-5 sm:w-5 ${theme.color}`} />,
    wellbeing: <Brain className={`h-4 w-4 sm:h-5 sm:w-5 ${theme.color}`} />,
  };

  const TITLES: Record<string, { es: string; en: string }> = {
    library: { es: 'Biblioteca Financiera', en: 'Financial Library' },
    atomic: { es: 'Hábitos Financieros', en: 'Financial Habits' },
    kiyosaki: { es: 'Activos y Flujo de Caja', en: 'Assets & Cashflow' },
    rohn: { es: 'Journal y Lectura', en: 'Journal & Reading' },
    tracy: { es: 'Metas SMART', en: 'SMART Goals' },
    wellbeing: { es: 'Bienestar Financiero', en: 'Financial Wellbeing' },
  };

  const SUBTITLES: Record<string, { es: string; en: string }> = {
    atomic: { es: 'Método Atomic Habits', en: 'Atomic Habits Method' },
    kiyosaki: { es: 'Método Rich Dad', en: 'Rich Dad Method' },
    rohn: { es: 'Filosofía Jim Rohn', en: 'Jim Rohn Philosophy' },
    tracy: { es: 'Método Brian Tracy', en: 'Brian Tracy Method' },
  };

  const DESCS: Record<string, { es: string; en: string }> = {
    library: { es: '100+ recursos curados para tu educación financiera 🎓', en: '100+ curated resources for your financial education 🎓' },
    atomic: { es: 'Las 4 leyes del cambio de comportamiento aplicadas a tus finanzas 🧬', en: 'The 4 laws of behavior change applied to your finances 🧬' },
    kiyosaki: { es: '"Padre Rico, Padre Pobre" - Cuadrante y libertad financiera 🏦', en: '"Rich Dad Poor Dad" - Cashflow quadrant and freedom 🏦' },
    rohn: { es: 'Filosofía de desarrollo personal y disciplina financiera ✨', en: 'Personal development philosophy and financial discipline ✨' },
    tracy: { es: 'Los 7 pasos para el éxito, método ABCDE y productividad financiera 🏆', en: 'The 7 steps to success, ABCDE method, and financial productivity 🏆' },
    wellbeing: { es: 'Calma tu mente para tomar mejores decisiones financieras 🧠', en: 'Calm your mind to make better financial decisions 🧠' },
  };

  const es = language === 'es';
  const title = TITLES[tab] || { es: '', en: '' };
  const desc = DESCS[tab] || { es: '', en: '' };

  return (
    <motion.div
      initial={isMobile ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-gradient-to-r ${theme.gradient} border ${theme.border}`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-2xl sm:text-3xl">{theme.icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-lg font-bold flex items-center gap-2">
            {ICONS[tab]}
            <span className="truncate">{es ? title.es : title.en}</span>
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
            {es ? desc.es : desc.en}
          </p>
          {tip && (
            <p className="text-xs text-muted-foreground/80 mt-1 italic hidden sm:block">
              {tip}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Mentorship() {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const { isEnabled } = useFeatureFlags();
  const [searchParams, setSearchParams] = useSearchParams();

  const showWellbeing = isEnabled('ecosystem_wellbeing_tab');
  const visibleTabs = showWellbeing ? MENTOR_TABS : MENTOR_TABS.filter(t => t.value !== 'wellbeing');
  const gridCols = showWellbeing ? 'grid-cols-6' : 'grid-cols-5';

  const validTabValues = visibleTabs.map(t => t.value);
  const tabFromUrl = searchParams.get('tab');
  const activeTab = tabFromUrl && validTabValues.includes(tabFromUrl) ? tabFromUrl : 'library';

  const handleTabChange = (value: string) => {
    if (value === 'library') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: value }, { replace: true });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <PageHeader
          title={language === 'es' ? '🧠 Mentoría Financiera' : '🧠 Financial Mentorship'}
          description={!isMobile ? (language === 'es' 
            ? 'Herramientas para hábitos, metas, activos y crecimiento financiero 🚀'
            : 'Tools for habits, goals, assets, and financial growth 🚀') : undefined}
        />

        {/* Level Banner */}
        <div data-highlight="mentorship-level">
          <MentorshipLevelBanner />
        </div>

        {!isMobile && <MentorQuoteBanner context="dashboard" />}

        {/* Progress Summary + Learning Path */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <MentorshipProgressSummary />
          <LearningPathCard />
        </div>

        {/* Weekly Summary Badge */}
        <WeeklySummaryBadge />

        {/* Weekly Challenges - visible across all tabs */}
        <WeeklyChallengesCard />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6" data-highlight="mentorship-tabs">
          <TooltipProvider>
            <TabsList className={`grid ${gridCols} w-full max-w-3xl mx-auto bg-muted/50 p-1 sm:p-1.5 rounded-xl`} data-highlight="mentor-selector">
              {visibleTabs.map((tab) => (
                <Tooltip key={tab.value}>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value={tab.value} 
                      className="gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-lg transition-all min-h-[44px]"
                    >
                      <span className="text-base sm:text-lg">{tab.icon}</span>
                      <span className="hidden sm:inline text-xs">{language === 'es' ? tab.labelEs : tab.labelEn}</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  {isMobile && (
                    <TooltipContent side="bottom">
                      {language === 'es' ? tab.labelEs : tab.labelEn}
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </TabsList>
          </TooltipProvider>

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-4 sm:space-y-6">
            <TabBanner tab="library" isMobile={isMobile} />
            <div id="mentorship-library" data-highlight="financial-library">
              <FinancialLibrary />
            </div>
          </TabsContent>

          {/* Atomic Habits Tab */}
          <TabsContent value="atomic" className="space-y-4 sm:space-y-6">
            <TabBanner tab="atomic" isMobile={isMobile} />
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <div id="mentorship-habits" className="lg:col-span-2">
                <AtomicHabitsCard />
              </div>
              <FinancialHabitsCard />
              <div id="mentorship-pay-yourself">
                <PayYourselfFirstCard />
              </div>
            </div>
          </TabsContent>

          {/* Kiyosaki Tab */}
          <TabsContent value="kiyosaki" className="space-y-4 sm:space-y-6">
            <TabBanner tab="kiyosaki" isMobile={isMobile} />
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <div id="mentorship-cashflow">
                <CashflowQuadrantCard />
              </div>
              <div id="mentorship-freedom">
                <FinancialFreedomCard />
              </div>
              <KiyosakiQuickStats />
              <div id="mentorship-debt" className="md:col-span-2">
                <DebtClassificationCard />
              </div>
            </div>
          </TabsContent>

          {/* Jim Rohn Tab */}
          <TabsContent value="rohn" className="space-y-4 sm:space-y-6">
            <TabBanner tab="rohn" isMobile={isMobile} />
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <div id="mentorship-journal">
                <FinancialJournalCard />
              </div>
              <div id="mentorship-education">
                <FinancialEducationCard />
              </div>
              <div className="md:col-span-2" id="mentorship-reading-tools">
                <Collapsible defaultOpen={false}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
                    <BookOpen className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium flex-1 text-left">
                      {language === 'es' ? '📖 Herramientas de Lectura' : '📖 Reading Tools'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                      <div id="mentorship-reading-reminder">
                        <ReadingReminderSettings />
                      </div>
                      <div id="mentorship-reading-pace">
                        <ReadingPaceComparison />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
              <div className="md:col-span-2">
                <GlobalLearningChart />
              </div>
            </div>
          </TabsContent>

          {/* Brian Tracy Tab */}
          <TabsContent value="tracy" className="space-y-4 sm:space-y-6">
            <TabBanner tab="tracy" isMobile={isMobile} />
            <div id="mentorship-goal-wizard">
              <TracyGoalWizard />
            </div>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <div id="mentorship-smart-goals">
                <SMARTGoalsCard />
              </div>
              <TracyQuickStats />
            </div>
          </TabsContent>

          {/* Wellbeing Tab */}
          {showWellbeing && (
            <TabsContent value="wellbeing" className="space-y-4 sm:space-y-6">
              <TabBanner tab="wellbeing" isMobile={isMobile} />
              <UnifiedQuoteBanner />
              <EcosystemPromoCard />
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isEnabled('ecosystem_breathing') && <FinancialBreathingExercise />}
                {isEnabled('ecosystem_focus_timer') && <FinancialFocusTimer />}
                {isEnabled('ecosystem_worry_dump') && <FinancialWorryDump />}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Legal disclaimer */}
        <LegalDisclaimer variant="education" size="compact" className="mt-4" />
      </div>
    </Layout>
  );
}
