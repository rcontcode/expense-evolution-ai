import { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface MonthlyReportData {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number;
  focusMinutes: number;
  focusSessions: number;
  worryEntries: number;
  topCategories: { category: string; amount: number }[];
  healthScore: number;
}

export const EcosystemMonthlyReport = memo(() => {
  const { language } = useLanguage();
  const { hasBundleAccess, isEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const { user } = useAuth();
  const isEs = language === 'es';
  const [generating, setGenerating] = useState(false);

  const lastMonth = subMonths(new Date(), 1);
  const monthStart = startOfMonth(lastMonth);
  const monthEnd = endOfMonth(lastMonth);
  const monthLabel = format(lastMonth, 'MMMM yyyy', { locale: isEs ? es : enUS });

  const { data: report, isLoading } = useQuery({
    queryKey: ['ecosystem-monthly-report', user?.id, format(monthStart, 'yyyy-MM')],
    queryFn: async (): Promise<MonthlyReportData | null> => {
      if (!user?.id) return null;

      const startStr = format(monthStart, 'yyyy-MM-dd');
      const endStr = format(monthEnd, 'yyyy-MM-dd');
      const startIso = monthStart.toISOString();
      const endIso = monthEnd.toISOString();

      const [incomeRes, expensesRes, focusRes, worriesRes] = await Promise.all([
        supabase.from('income').select('amount')
          .eq('user_id', user.id).is('deleted_at', null)
          .gte('date', startStr).lte('date', endStr),
        supabase.from('expenses').select('amount, category')
          .eq('user_id', user.id).is('deleted_at', null)
          .gte('date', startStr).lte('date', endStr),
        supabase.from('financial_focus_sessions').select('duration_minutes')
          .eq('user_id', user.id)
          .gte('created_at', startIso).lte('created_at', endIso),
        supabase.from('financial_worry_entries').select('id')
          .eq('user_id', user.id)
          .gte('created_at', startIso).lte('created_at', endIso),
      ]);

      const totalIncome = (incomeRes.data || []).reduce((a, i) => a + (i.amount || 0), 0);
      const totalExpenses = (expensesRes.data || []).reduce((a, e) => a + (e.amount || 0), 0);
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
      const focusData = focusRes.data || [];
      const focusMinutes = focusData.reduce((a, s) => a + (s.duration_minutes || 0), 0);

      // Top categories
      const catMap = new Map<string, number>();
      for (const e of (expensesRes.data || [])) {
        const cat = e.category || (isEs ? 'Sin categoría' : 'Uncategorized');
        catMap.set(cat, (catMap.get(cat) || 0) + (e.amount || 0));
      }
      const topCategories = Array.from(catMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Simple health score
      const savingsScore = Math.min(30, Math.max(0, savingsRate));
      const focusScore = Math.min(25, (focusMinutes / 120) * 25);
      const worryCount = (worriesRes.data || []).length;
      const worryScore = Math.max(0, 20 - worryCount * 3);
      const stabilityScore = totalIncome > 0 ? Math.min(25, ((1 - Math.abs(totalExpenses - totalIncome) / totalIncome)) * 25) : 10;
      const healthScore = Math.min(100, Math.max(0, Math.round(savingsScore + focusScore + worryScore + stabilityScore)));

      return {
        month: monthLabel,
        totalIncome,
        totalExpenses,
        savingsRate,
        focusMinutes,
        focusSessions: focusData.length,
        worryEntries: worryCount,
        topCategories,
        healthScore,
      };
    },
    enabled: !!user?.id && hasBundleAccess,
    staleTime: 1000 * 60 * 30,
  });

  const generatePDF = useCallback(async () => {
    if (!report) return;
    setGenerating(true);

    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(20);
      doc.setTextColor(99, 102, 241); // primary-ish
      doc.text('Evo Ecosystem', 20, 25);
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(isEs ? `Reporte Mensual — ${report.month}` : `Monthly Report — ${report.month}`, 20, 33);

      // Divider
      doc.setDrawColor(230, 230, 230);
      doc.line(20, 37, pageWidth - 20, 37);

      // Summary section
      doc.setFontSize(14);
      doc.setTextColor(30, 30, 30);
      doc.text(isEs ? 'Resumen Financiero' : 'Financial Summary', 20, 48);

      const fmtCurrency = (n: number) => `$${n.toLocaleString(isEs ? 'es-ES' : 'en-US', { minimumFractionDigits: 2 })}`;

      autoTable(doc, {
        startY: 52,
        head: [[isEs ? 'Métrica' : 'Metric', isEs ? 'Valor' : 'Value']],
        body: [
          [isEs ? 'Ingresos' : 'Income', fmtCurrency(report.totalIncome)],
          [isEs ? 'Gastos' : 'Expenses', fmtCurrency(report.totalExpenses)],
          [isEs ? 'Balance' : 'Balance', fmtCurrency(report.totalIncome - report.totalExpenses)],
          [isEs ? 'Tasa de Ahorro' : 'Savings Rate', `${report.savingsRate.toFixed(1)}%`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] },
        margin: { left: 20, right: 20 },
      });

      // Top categories
      const catY = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(14);
      doc.text(isEs ? 'Top Categorías de Gasto' : 'Top Spending Categories', 20, catY);

      if (report.topCategories.length > 0) {
        autoTable(doc, {
          startY: catY + 4,
          head: [[isEs ? 'Categoría' : 'Category', isEs ? 'Monto' : 'Amount']],
          body: report.topCategories.map(c => [c.category, fmtCurrency(c.amount)]),
          theme: 'grid',
          headStyles: { fillColor: [99, 102, 241] },
          margin: { left: 20, right: 20 },
        });
      }

      // Wellness section
      const wellY = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(14);
      doc.text(isEs ? 'Bienestar & Enfoque' : 'Wellness & Focus', 20, wellY);

      autoTable(doc, {
        startY: wellY + 4,
        head: [[isEs ? 'Métrica' : 'Metric', isEs ? 'Valor' : 'Value']],
        body: [
          [isEs ? 'Minutos de Enfoque' : 'Focus Minutes', `${report.focusMinutes} min`],
          [isEs ? 'Sesiones de Enfoque' : 'Focus Sessions', `${report.focusSessions}`],
          [isEs ? 'Entradas de Preocupación' : 'Worry Entries', `${report.worryEntries}`],
          [isEs ? 'Health Score' : 'Health Score', `${report.healthScore}/100`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: 20, right: 20 },
      });

      // Footer
      const footY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(
        isEs ? 'Generado por Evo Ecosystem — EvoFinz + Fokuspark' : 'Generated by Evo Ecosystem — EvoFinz + Fokuspark',
        pageWidth / 2,
        footY,
        { align: 'center' }
      );

      doc.save(`evo-ecosystem-${format(monthStart, 'yyyy-MM')}.pdf`);
      toast.success(isEs ? 'Reporte descargado' : 'Report downloaded');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error(isEs ? 'Error al generar el reporte' : 'Error generating report');
    } finally {
      setGenerating(false);
    }
  }, [report, isEs, monthStart]);

  if (flagsLoading || !hasBundleAccess || !isEnabled('ecosystem_insights')) return null;
  if (isLoading || !report) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/15">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs font-bold flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-primary" />
            {isEs ? 'Reporte Mensual del Ecosistema' : 'Ecosystem Monthly Report'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          <p className="text-[11px] text-muted-foreground capitalize">{report.month}</p>
          
          <div className="grid grid-cols-4 gap-1.5">
            <div className="p-1.5 rounded-lg bg-primary/5 text-center">
              <p className="text-[10px] font-bold text-foreground">${(report.totalIncome / 1000).toFixed(1)}k</p>
              <p className="text-[8px] text-muted-foreground">{isEs ? 'Ingr.' : 'Inc.'}</p>
            </div>
            <div className="p-1.5 rounded-lg bg-destructive/5 text-center">
              <p className="text-[10px] font-bold text-foreground">${(report.totalExpenses / 1000).toFixed(1)}k</p>
              <p className="text-[8px] text-muted-foreground">{isEs ? 'Gast.' : 'Exp.'}</p>
            </div>
            <div className="p-1.5 rounded-lg bg-accent/5 text-center">
              <p className="text-[10px] font-bold text-foreground">{report.focusMinutes}m</p>
              <p className="text-[8px] text-muted-foreground">{isEs ? 'Enf.' : 'Focus'}</p>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-500/5 text-center">
              <p className="text-[10px] font-bold text-foreground">{report.healthScore}</p>
              <p className="text-[8px] text-muted-foreground">Score</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-8 gap-2"
            onClick={generatePDF}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {generating
              ? (isEs ? 'Generando...' : 'Generating...')
              : (isEs ? 'Descargar PDF' : 'Download PDF')}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
});

EcosystemMonthlyReport.displayName = 'EcosystemMonthlyReport';
