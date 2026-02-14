import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, Calendar, KanbanSquare, ListChecks, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { BillsSummaryCards } from './BillsSummaryCards';
import { BillsManager } from './BillsManager';
import { PaymentCalendar } from './PaymentCalendar';
import { BillsKanban } from './BillsKanban';
import { PaymentChecklist } from './PaymentChecklist';
import { CashFlowProjection } from './CashFlowProjection';
import { cn } from '@/lib/utils';

export function BillsDashboard() {
  const { language } = useLanguage();
  const l = language === 'es';
  const [view, setView] = useState('overview');

  return (
    <div className="space-y-6">
      <BillsSummaryCards />

      <Tabs value={view} onValueChange={setView} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1 gap-1">
          <TabsTrigger value="overview" className={cn("flex items-center gap-2 py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground")}>
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">{l ? 'Lista' : 'List'}</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className={cn("flex items-center gap-2 py-2.5 text-xs sm:text-sm data-[state=active]:bg-chart-4 data-[state=active]:text-white")}>
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">{l ? 'Calendario' : 'Calendar'}</span>
          </TabsTrigger>
          <TabsTrigger value="kanban" className={cn("flex items-center gap-2 py-2.5 text-xs sm:text-sm data-[state=active]:bg-chart-2 data-[state=active]:text-white")}>
            <KanbanSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Kanban</span>
          </TabsTrigger>
          <TabsTrigger value="checklist" className={cn("flex items-center gap-2 py-2.5 text-xs sm:text-sm data-[state=active]:bg-chart-3 data-[state=active]:text-white")}>
            <ListChecks className="h-4 w-4" />
            <span className="hidden sm:inline">Checklist</span>
          </TabsTrigger>
          <TabsTrigger value="projection" className={cn("flex items-center gap-2 py-2.5 text-xs sm:text-sm data-[state=active]:bg-chart-1 data-[state=active]:text-white")}>
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">{l ? 'Proyección' : 'Projection'}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <BillsManager />
        </TabsContent>
        <TabsContent value="calendar">
          <PaymentCalendar />
        </TabsContent>
        <TabsContent value="kanban">
          <BillsKanban />
        </TabsContent>
        <TabsContent value="checklist">
          <PaymentChecklist />
        </TabsContent>
        <TabsContent value="projection">
          <CashFlowProjection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
