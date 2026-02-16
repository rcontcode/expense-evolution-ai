import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { useMonthlyPlanData } from "@/hooks/data/useMonthlyPlanData";
import { useExpenses } from "@/hooks/data/useExpenses";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

export function BudgetExportWidget() {
  const { language } = useLanguage();
  const l = language === "es";
  const { formatCurrency: fc } = useFormatCurrency();
  const plan = useMonthlyPlanData();
  const now = new Date();
  const { data: expenses } = useExpenses({
    dateRange: { start: startOfMonth(now), end: endOfMonth(now) },
  });
  const [exporting, setExporting] = useState<string | null>(null);

  const monthLabel = format(now, "MMMM yyyy", { locale: l ? es : enUS });

  const exportPDF = async () => {
    setExporting("pdf");
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text(l ? "Plan de Presupuesto Mensual" : "Monthly Budget Plan", 14, 20);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(monthLabel, 14, 28);

      // Summary
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(l ? "Resumen" : "Summary", 14, 40);

      autoTable(doc, {
        startY: 44,
        head: [[l ? "Concepto" : "Item", l ? "Monto" : "Amount"]],
        body: [
          [l ? "Ingresos" : "Income", fc(plan.totalIncome)],
          [l ? "Pagos Fijos" : "Fixed Payments", fc(plan.totalFixed)],
          [l ? "Gastado" : "Spent", fc(plan.totalSpent)],
          [l ? "Disponible" : "Available", fc(plan.freeMoney - plan.totalSpent)],
          [l ? "Presupuesto Diario" : "Daily Budget", fc(plan.dailyBudget)],
          [l ? "Ahorro Proyectado" : "Projected Savings", fc(plan.projectedSavings)],
          [l ? "Tasa de Ahorro" : "Savings Rate", `${plan.savingsRate.toFixed(1)}%`],
          [l ? "Salud Financiera" : "Financial Health", `${plan.healthScore}/100`],
        ],
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129] },
      });

      // Category breakdown
      const familyExpenses = (expenses || []).filter(e => !e.entity_id);
      const catMap: Record<string, number> = {};
      familyExpenses.forEach(e => { catMap[e.category || "other"] = (catMap[e.category || "other"] || 0) + Number(e.amount); });

      if (Object.keys(catMap).length > 0) {
        const catY = (doc as any).lastAutoTable?.finalY || 90;
        doc.text(l ? "Gastos por Categoría" : "Spending by Category", 14, catY + 10);

        autoTable(doc, {
          startY: catY + 14,
          head: [[l ? "Categoría" : "Category", l ? "Gastado" : "Spent"]],
          body: Object.entries(catMap)
            .sort(([, a], [, b]) => b - a)
            .map(([cat, amt]) => [cat, fc(amt)]),
          theme: "grid",
          headStyles: { fillColor: [59, 130, 246] },
        });
      }

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`EvoFinz — ${l ? "Generado" : "Generated"} ${format(now, "PPp", { locale: l ? es : enUS })}`, 14, pageHeight - 10);

      doc.save(`budget-${format(now, "yyyy-MM")}.pdf`);
      toast.success(l ? "PDF exportado" : "PDF exported");
    } catch (err) {
      console.error(err);
      toast.error(l ? "Error al exportar" : "Export failed");
    }
    setExporting(null);
  };

  const exportExcel = async () => {
    setExporting("excel");
    try {
      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();

      // Summary sheet
      const ws = wb.addWorksheet(l ? "Resumen" : "Summary");
      ws.columns = [{ width: 25 }, { width: 20 }];
      ws.addRow([l ? "Plan de Presupuesto" : "Budget Plan", monthLabel]).font = { bold: true, size: 14 };
      ws.addRow([]);
      ws.addRow([l ? "Concepto" : "Item", l ? "Monto" : "Amount"]).font = { bold: true };
      ws.addRow([l ? "Ingresos" : "Income", plan.totalIncome]);
      ws.addRow([l ? "Pagos Fijos" : "Fixed", plan.totalFixed]);
      ws.addRow([l ? "Gastado" : "Spent", plan.totalSpent]);
      ws.addRow([l ? "Disponible" : "Available", plan.freeMoney - plan.totalSpent]);
      ws.addRow([l ? "Presupuesto Diario" : "Daily Budget", plan.dailyBudget]);
      ws.addRow([l ? "Ahorro Proyectado" : "Projected Savings", plan.projectedSavings]);
      ws.addRow([l ? "Tasa de Ahorro" : "Savings Rate", plan.savingsRate / 100]);
      ws.addRow([l ? "Salud Financiera" : "Health Score", plan.healthScore]);

      // Expenses sheet
      const familyExpenses = (expenses || []).filter(e => !e.entity_id);
      if (familyExpenses.length > 0) {
        const ws2 = wb.addWorksheet(l ? "Gastos" : "Expenses");
        ws2.columns = [{ width: 12 }, { width: 30 }, { width: 15 }, { width: 15 }];
        ws2.addRow([l ? "Fecha" : "Date", l ? "Descripción" : "Description", l ? "Categoría" : "Category", l ? "Monto" : "Amount"]).font = { bold: true };
        familyExpenses.forEach(e => {
          ws2.addRow([e.date, e.description || e.vendor || "", e.category || "", Number(e.amount)]);
        });
      }

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `budget-${format(now, "yyyy-MM")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(l ? "Excel exportado" : "Excel exported");
    } catch (err) {
      console.error(err);
      toast.error(l ? "Error al exportar" : "Export failed");
    }
    setExporting(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {l
          ? "Exporta tu plan de presupuesto mensual con resumen, categorías y gastos detallados."
          : "Export your monthly budget plan with summary, categories, and detailed expenses."}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={exportPDF}
          disabled={!!exporting}
        >
          <FileDown className="h-3.5 w-3.5" />
          {exporting === "pdf" ? (l ? "Generando..." : "Generating...") : "PDF"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={exportExcel}
          disabled={!!exporting}
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          {exporting === "excel" ? (l ? "Generando..." : "Generating...") : "Excel"}
        </Button>
      </div>
    </div>
  );
}
