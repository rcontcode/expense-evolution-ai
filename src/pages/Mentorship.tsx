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
  GlobalLearningChart,
  ReadingReminderSettings,
  ReadingPaceComparison,
  SMARTGoalsCard,
  TracyGoalWizard,
} from '@/components/mentorship';
import { Target, Sparkles, PiggyBank, Scale, BookOpen, ListChecks, GraduationCap } from 'lucide-react';
import { MentorQuoteBanner } from '@/components/MentorQuoteBanner';

export default function Mentorship() {
  const { language } = useLanguage();

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          {language === 'es' ? 'Mentoría Financiera' : 'Financial Mentorship'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'es' 
            ? 'Herramientas inspiradas en Kiyosaki, Jim Rohn y Brian Tracy'
            : 'Tools inspired by Kiyosaki, Jim Rohn, and Brian Tracy'}
        </p>
      </div>

      <MentorQuoteBanner context="dashboard" />

      <Tabs defaultValue="kiyosaki" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="kiyosaki" className="text-xs md:text-sm">
            Kiyosaki
          </TabsTrigger>
          <TabsTrigger value="rohn" className="text-xs md:text-sm">
            Jim Rohn
          </TabsTrigger>
          <TabsTrigger value="tracy" className="text-xs md:text-sm">
            Brian Tracy
          </TabsTrigger>
        </TabsList>

        {/* Kiyosaki Tab */}
        <TabsContent value="kiyosaki" className="space-y-6">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Target className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Principios de Robert Kiyosaki' : 'Robert Kiyosaki Principles'}
          </div>
          <p className="text-sm text-muted-foreground -mt-4">
            {language === 'es' 
              ? 'Autor de "Padre Rico, Padre Pobre" - El cuadrante del flujo de dinero y libertad financiera'
              : 'Author of "Rich Dad Poor Dad" - The cashflow quadrant and financial freedom'}
          </p>
          
          <div className="grid gap-6 md:grid-cols-2">
            <CashflowQuadrantCard />
            <FinancialFreedomCard />
            <DebtClassificationCard />
          </div>
        </TabsContent>

        {/* Jim Rohn Tab */}
        <TabsContent value="rohn" className="space-y-6">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Principios de Jim Rohn' : 'Jim Rohn Principles'}
          </div>
          <p className="text-sm text-muted-foreground -mt-4">
            {language === 'es' 
              ? 'Filosofía de desarrollo personal y disciplina financiera'
              : 'Personal development philosophy and financial discipline'}
          </p>
          
          <div className="grid gap-6 md:grid-cols-2">
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
        <TabsContent value="tracy" className="space-y-6">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <ListChecks className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Principios de Brian Tracy' : 'Brian Tracy Principles'}
          </div>
          <p className="text-sm text-muted-foreground -mt-4">
            {language === 'es' 
              ? 'Los 7 pasos para el éxito, método ABCDE y productividad financiera'
              : 'The 7 steps to success, ABCDE method, and financial productivity'}
          </p>
          
          {/* Tracy Goal Wizard - Full Width */}
          <TracyGoalWizard />
          
          <div className="grid gap-6 md:grid-cols-2">
            <SMARTGoalsCard />
            <FinancialHabitsCard />
            <FinancialEducationCard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
