import { useLanguage } from '@/contexts/LanguageContext';
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
} from '@/components/mentorship';
import { MentorshipLevelBanner } from '@/components/mentorship/MentorshipLevelBanner';
import { Target, Sparkles, ListChecks, GraduationCap, BookOpen, TrendingUp, Brain, Coins, Atom } from 'lucide-react';
import { MentorQuoteBanner } from '@/components/MentorQuoteBanner';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
};

const MENTOR_TABS = [
  { value: 'library', icon: '📚', labelEs: 'Biblioteca', labelEn: 'Library' },
  { value: 'atomic', icon: '⚛️', labelEs: 'Atómicos', labelEn: 'Atomic' },
  { value: 'kiyosaki', icon: '💰', labelEs: 'Kiyosaki', labelEn: 'Kiyosaki' },
  { value: 'rohn', icon: '🌟', labelEs: 'Jim Rohn', labelEn: 'Jim Rohn' },
  { value: 'tracy', icon: '🎯', labelEs: 'Tracy', labelEn: 'Tracy' },
];

export default function Mentorship() {
  const { language } = useLanguage();
  const isMobile = useIsMobile();

  return (
    <Layout>
      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <PageHeader
          title={language === 'es' ? '🧠 Mentoría Financiera' : '🧠 Financial Mentorship'}
          description={!isMobile ? (language === 'es' 
            ? 'Herramientas inspiradas en Kiyosaki, Jim Rohn y Brian Tracy para tu libertad financiera 🚀'
            : 'Tools inspired by Kiyosaki, Jim Rohn, and Brian Tracy for your financial freedom 🚀') : undefined}
        />

        {/* Level Banner - Gamification Incentive */}
        <div data-highlight="mentorship-level">
          <MentorshipLevelBanner />
        </div>

        {!isMobile && <MentorQuoteBanner context="dashboard" />}

        <Tabs defaultValue="library" className="space-y-4 sm:space-y-6" data-highlight="mentorship-tabs">
          {/* Mobile: Icon-only tabs with tooltips */}
          <TooltipProvider>
            <TabsList className="grid grid-cols-5 w-full max-w-3xl mx-auto bg-muted/50 p-1 sm:p-1.5 rounded-xl" data-highlight="mentor-selector">
              {MENTOR_TABS.map((tab) => (
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
            <motion.div
              initial={isMobile ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-gradient-to-r ${MENTOR_THEMES.library.gradient} border ${MENTOR_THEMES.library.border}`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl">📚</span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-lg font-bold flex items-center gap-2">
                    <GraduationCap className={`h-4 w-4 sm:h-5 sm:w-5 ${MENTOR_THEMES.library.color}`} />
                    <span className="truncate">{language === 'es' ? 'Biblioteca Financiera' : 'Financial Library'}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    {language === 'es' 
                      ? '100+ recursos curados para tu educación financiera 🎓'
                      : '100+ curated resources for your financial education 🎓'}
                  </p>
                </div>
              </div>
            </motion.div>
            <div data-highlight="financial-library">
              <FinancialLibrary />
            </div>
          </TabsContent>

          {/* Atomic Habits Tab - James Clear */}
          <TabsContent value="atomic" className="space-y-4 sm:space-y-6">
            <motion.div
              initial={isMobile ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-gradient-to-r ${MENTOR_THEMES.atomic.gradient} border ${MENTOR_THEMES.atomic.border}`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl">⚛️</span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-lg font-bold flex items-center gap-2">
                    <Atom className={`h-4 w-4 sm:h-5 sm:w-5 ${MENTOR_THEMES.atomic.color}`} />
                    <span className="truncate">{language === 'es' ? 'Hábitos Atómicos' : 'Atomic Habits'}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    {language === 'es' 
                      ? 'Las 4 leyes del cambio de comportamiento aplicadas a tus finanzas 🧬'
                      : 'The 4 laws of behavior change applied to your finances 🧬'}
                  </p>
                </div>
              </div>
            </motion.div>
            
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <AtomicHabitsCard />
              </div>
              <FinancialHabitsCard />
              <PayYourselfFirstCard />
            </div>
          </TabsContent>

          {/* Kiyosaki Tab */}
          <TabsContent value="kiyosaki" className="space-y-4 sm:space-y-6">
            <motion.div
              initial={isMobile ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-gradient-to-r ${MENTOR_THEMES.kiyosaki.gradient} border ${MENTOR_THEMES.kiyosaki.border}`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl">💰</span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-lg font-bold flex items-center gap-2">
                    <Coins className={`h-4 w-4 sm:h-5 sm:w-5 ${MENTOR_THEMES.kiyosaki.color}`} />
                    <span className="truncate">{language === 'es' ? 'Kiyosaki' : 'Kiyosaki'}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    {language === 'es' 
                      ? '"Padre Rico, Padre Pobre" - Cuadrante y libertad financiera 🏦'
                      : '"Rich Dad Poor Dad" - Cashflow quadrant and freedom 🏦'}
                  </p>
                </div>
              </div>
            </motion.div>
            
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <CashflowQuadrantCard />
              <FinancialFreedomCard />
              <div className="md:col-span-2">
                <DebtClassificationCard />
              </div>
            </div>
          </TabsContent>

          {/* Jim Rohn Tab */}
          <TabsContent value="rohn" className="space-y-4 sm:space-y-6">
            <motion.div
              initial={isMobile ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-gradient-to-r ${MENTOR_THEMES.rohn.gradient} border ${MENTOR_THEMES.rohn.border}`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl">🌟</span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-lg font-bold flex items-center gap-2">
                    <Sparkles className={`h-4 w-4 sm:h-5 sm:w-5 ${MENTOR_THEMES.rohn.color}`} />
                    <span className="truncate">{language === 'es' ? 'Jim Rohn' : 'Jim Rohn'}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    {language === 'es' 
                      ? 'Filosofía de desarrollo personal y disciplina financiera ✨'
                      : 'Personal development philosophy and financial discipline ✨'}
                  </p>
                </div>
              </div>
            </motion.div>
            
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <PayYourselfFirstCard />
              <FinancialJournalCard />
              <FinancialEducationCard />
              <ReadingReminderSettings />
              <ReadingPaceComparison />
              <div className="md:col-span-2">
                <GlobalLearningChart />
              </div>
            </div>
          </TabsContent>

          {/* Brian Tracy Tab */}
          <TabsContent value="tracy" className="space-y-4 sm:space-y-6">
            <motion.div
              initial={isMobile ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-gradient-to-r ${MENTOR_THEMES.tracy.gradient} border ${MENTOR_THEMES.tracy.border}`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl">🎯</span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-lg font-bold flex items-center gap-2">
                    <Target className={`h-4 w-4 sm:h-5 sm:w-5 ${MENTOR_THEMES.tracy.color}`} />
                    <span className="truncate">{language === 'es' ? 'Brian Tracy' : 'Brian Tracy'}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    {language === 'es' 
                      ? 'Los 7 pasos para el éxito, método ABCDE y productividad financiera 🏆'
                      : 'The 7 steps to success, ABCDE method, and financial productivity 🏆'}
                  </p>
                </div>
              </div>
            </motion.div>
            
            {/* Tracy Goal Wizard - Full Width */}
            <TracyGoalWizard />
            
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <SMARTGoalsCard />
              <FinancialHabitsCard />
              <FinancialEducationCard />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
