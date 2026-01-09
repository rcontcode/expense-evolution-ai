import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
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
import { Target, Sparkles, ListChecks, GraduationCap, BookOpen, TrendingUp, Brain, Coins } from 'lucide-react';
import { MentorQuoteBanner } from '@/components/MentorQuoteBanner';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { motion } from 'framer-motion';

const MENTOR_THEMES = {
  library: {
    gradient: 'from-purple-500/10 via-violet-500/5 to-fuchsia-500/10',
    border: 'border-purple-500/20',
    icon: '📚',
    color: 'text-purple-500',
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

export default function Mentorship() {
  const { language } = useLanguage();

  return (
    <Layout>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <PageHeader
          title={language === 'es' ? '🧠 Mentoría Financiera' : '🧠 Financial Mentorship'}
          description={language === 'es' 
            ? 'Herramientas inspiradas en Kiyosaki, Jim Rohn y Brian Tracy para tu libertad financiera 🚀'
            : 'Tools inspired by Kiyosaki, Jim Rohn, and Brian Tracy for your financial freedom 🚀'}
        />

        {/* Level Banner - Gamification Incentive */}
        <MentorshipLevelBanner />

        <MentorQuoteBanner context="dashboard" />

        <Tabs defaultValue="library" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto bg-muted/50 p-1.5 rounded-xl">
            <TabsTrigger 
              value="library" 
              className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white rounded-lg transition-all"
            >
              <span className="text-lg">📚</span>
              <span className="hidden sm:inline text-sm">{language === 'es' ? 'Biblioteca' : 'Library'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="kiyosaki" 
              className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-lg transition-all"
            >
              <span className="text-lg">💰</span>
              <span className="hidden sm:inline text-sm">Kiyosaki</span>
            </TabsTrigger>
            <TabsTrigger 
              value="rohn" 
              className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg transition-all"
            >
              <span className="text-lg">🌟</span>
              <span className="hidden sm:inline text-sm">Jim Rohn</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tracy" 
              className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg transition-all"
            >
              <span className="text-lg">🎯</span>
              <span className="hidden sm:inline text-sm">Brian Tracy</span>
            </TabsTrigger>
          </TabsList>

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-4 bg-gradient-to-r ${MENTOR_THEMES.library.gradient} border ${MENTOR_THEMES.library.border}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📚</span>
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <GraduationCap className={`h-5 w-5 ${MENTOR_THEMES.library.color}`} />
                    {language === 'es' ? 'Biblioteca de Sabiduría Financiera' : 'Financial Wisdom Library'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'es' 
                      ? '100+ recursos curados para tu educación financiera 🎓'
                      : '100+ curated resources for your financial education 🎓'}
                  </p>
                </div>
              </div>
            </motion.div>
            <FinancialLibrary />
          </TabsContent>

          {/* Kiyosaki Tab */}
          <TabsContent value="kiyosaki" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-4 bg-gradient-to-r ${MENTOR_THEMES.kiyosaki.gradient} border ${MENTOR_THEMES.kiyosaki.border}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">💰</span>
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Coins className={`h-5 w-5 ${MENTOR_THEMES.kiyosaki.color}`} />
                    {language === 'es' ? 'Principios de Robert Kiyosaki' : 'Robert Kiyosaki Principles'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'es' 
                      ? '"Padre Rico, Padre Pobre" - El cuadrante del flujo de dinero y libertad financiera 🏦'
                      : '"Rich Dad Poor Dad" - The cashflow quadrant and financial freedom 🏦'}
                  </p>
                </div>
              </div>
            </motion.div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <CashflowQuadrantCard />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FinancialFreedomCard />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="md:col-span-2"
              >
                <DebtClassificationCard />
              </motion.div>
            </div>
          </TabsContent>

          {/* Jim Rohn Tab */}
          <TabsContent value="rohn" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-4 bg-gradient-to-r ${MENTOR_THEMES.rohn.gradient} border ${MENTOR_THEMES.rohn.border}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🌟</span>
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className={`h-5 w-5 ${MENTOR_THEMES.rohn.color}`} />
                    {language === 'es' ? 'Principios de Jim Rohn' : 'Jim Rohn Principles'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'es' 
                      ? 'Filosofía de desarrollo personal y disciplina financiera ✨'
                      : 'Personal development philosophy and financial discipline ✨'}
                  </p>
                </div>
              </div>
            </motion.div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <PayYourselfFirstCard />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FinancialJournalCard />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <FinancialEducationCard />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <ReadingReminderSettings />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <ReadingPaceComparison />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="md:col-span-2"
              >
                <GlobalLearningChart />
              </motion.div>
            </div>
          </TabsContent>

          {/* Brian Tracy Tab */}
          <TabsContent value="tracy" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-4 bg-gradient-to-r ${MENTOR_THEMES.tracy.gradient} border ${MENTOR_THEMES.tracy.border}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎯</span>
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Target className={`h-5 w-5 ${MENTOR_THEMES.tracy.color}`} />
                    {language === 'es' ? 'Principios de Brian Tracy' : 'Brian Tracy Principles'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'es' 
                      ? 'Los 7 pasos para el éxito, método ABCDE y productividad financiera 🏆'
                      : 'The 7 steps to success, ABCDE method, and financial productivity 🏆'}
                  </p>
                </div>
              </div>
            </motion.div>
            
            {/* Tracy Goal Wizard - Full Width */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <TracyGoalWizard />
            </motion.div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SMARTGoalsCard />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <FinancialHabitsCard />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <FinancialEducationCard />
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
