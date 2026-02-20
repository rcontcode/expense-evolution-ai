import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useRecurringBills, useBillPayments } from '@/hooks/data/useRecurringBills';
import { getBillCategoryLabel, getBillFrequencyLabel, getPaymentMethodLabel } from '@/lib/constants/bill-categories';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { toast } from 'sonner';

export function BillsExportButtons() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();
  const { data: bills } = useRecurringBills();
  const { data: payments } = useBillPayments();
  const [exporting, setExporting] = useState<string | null>(null);

  const activeBills = bills?.filter(b => b.status === 'active') || [];
  const lang = l ? 'es' : 'en';
  const now = new Date();

  const exportPDF = async () => {
    if (activeBills.length === 0) { toast.info(l ? 'No hay pagos para exportar' : 'No bills to export'); return; }
    setExporting('pdf');
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text(l ? 'Pagos Recurrentes' : 'Recurring Bills', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`EvoFinz — ${format(now, 'PPp', { locale: l ? es : enUS })}`, 14, 27);

      // Summary
      const totalMonthly = activeBills.reduce((s, b) => {
        const mult = b.frequency === 'weekly' ? 4.33 : b.frequency === 'biweekly' ? 2.17 : b.frequency === 'quarterly' ? 1/3 : b.frequency === 'semiannual' ? 1/6 : b.frequency === 'annual' ? 1/12 : 1;
        return s + b.amount * mult;
      }, 0);

      doc.setFontSize(12);
      doc.setTextColor(0);
      autoTable(doc, {
        startY: 34,
        head: [[l ? 'Resumen' : 'Summary', '']],
        body: [
          [l ? 'Total Pagos Activos' : 'Active Bills', String(activeBills.length)],
          [l ? 'Costo Mensual Estimado' : 'Est. Monthly Cost', fc(totalMonthly)],
          [l ? 'Costo Anual Estimado' : 'Est. Annual Cost', fc(totalMonthly * 12)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
      });

      // Bills table
      const billsY = (doc as any).lastAutoTable?.finalY || 70;
      autoTable(doc, {
        startY: billsY + 6,
        head: [[
          l ? 'Nombre' : 'Name',
          l ? 'Categoría' : 'Category',
          l ? 'Monto' : 'Amount',
          l ? 'Frecuencia' : 'Frequency',
          l ? 'Próximo Vencimiento' : 'Next Due',
          l ? 'Método' : 'Method',
        ]],
        body: activeBills.map(b => [
          b.name,
          getBillCategoryLabel(b.category, lang),
          fc(b.amount),
          getBillFrequencyLabel(b.frequency, lang),
          format(new Date(b.next_due_date), 'dd MMM yyyy', { locale: l ? es : enUS }),
          getPaymentMethodLabel(b.payment_method_type, lang),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 },
      });

      // Footer
      const ph = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`EvoFinz — ${l ? 'Generado' : 'Generated'} ${format(now, 'PPp', { locale: l ? es : enUS })}`, 14, ph - 10);

      doc.save(`bills-${format(now, 'yyyy-MM-dd')}.pdf`);
      toast.success(l ? 'PDF exportado' : 'PDF exported');
    } catch (err) {
      console.error(err);
      toast.error(l ? 'Error al exportar' : 'Export failed');
    }
    setExporting(null);
  };

  const exportExcel = async () => {
    if (activeBills.length === 0) { toast.info(l ? 'No hay pagos para exportar' : 'No bills to export'); return; }
    setExporting('excel');
    try {
      const ExcelJS = await import('exceljs');
      const wb = new ExcelJS.Workbook();

      // Bills sheet
      const ws = wb.addWorksheet(l ? 'Pagos Recurrentes' : 'Recurring Bills');
      ws.columns = [
        { header: l ? 'Nombre' : 'Name', width: 25 },
        { header: l ? 'Categoría' : 'Category', width: 18 },
        { header: l ? 'Monto' : 'Amount', width: 14 },
        { header: l ? 'Frecuencia' : 'Frequency', width: 14 },
        { header: l ? 'Próximo Vencimiento' : 'Next Due', width: 16 },
        { header: l ? 'Método de Pago' : 'Payment Method', width: 16 },
        { header: l ? 'Banco' : 'Bank', width: 16 },
        { header: l ? 'Beneficiario' : 'Beneficiary', width: 20 },
        { header: l ? 'Auto-pago' : 'Auto-pay', width: 10 },
        { header: l ? 'Notas' : 'Notes', width: 25 },
      ];
      ws.getRow(1).font = { bold: true };

      activeBills.forEach(b => {
        ws.addRow([
          b.name,
          getBillCategoryLabel(b.category, lang),
          b.amount,
          getBillFrequencyLabel(b.frequency, lang),
          b.next_due_date,
          getPaymentMethodLabel(b.payment_method_type, lang),
          b.bank_name || '',
          b.beneficiary || '',
          b.auto_pay ? (l ? 'Sí' : 'Yes') : 'No',
          b.notes || '',
        ]);
      });

      // Payments history sheet
      if (payments && payments.length > 0) {
        const ws2 = wb.addWorksheet(l ? 'Historial de Pagos' : 'Payment History');
        ws2.columns = [
          { header: l ? 'Pago' : 'Bill', width: 25 },
          { header: l ? 'Fecha' : 'Date', width: 14 },
          { header: l ? 'Monto Pagado' : 'Amount Paid', width: 14 },
          { header: l ? 'Notas' : 'Notes', width: 30 },
        ];
        ws2.getRow(1).font = { bold: true };

        const billMap = new Map(bills?.map(b => [b.id, b.name]) || []);
        payments.forEach(p => {
          ws2.addRow([
            billMap.get(p.bill_id) || p.bill_id,
            p.paid_date,
            p.amount_paid,
            p.notes || '',
          ]);
        });
      }

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bills-${format(now, 'yyyy-MM-dd')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(l ? 'Excel exportado' : 'Excel exported');
    } catch (err) {
      console.error(err);
      toast.error(l ? 'Error al exportar' : 'Export failed');
    }
    setExporting(null);
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="gap-1.5" onClick={exportPDF} disabled={!!exporting}>
        <FileDown className="h-3.5 w-3.5" />
        {exporting === 'pdf' ? '...' : 'PDF'}
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={exportExcel} disabled={!!exporting}>
        <FileSpreadsheet className="h-3.5 w-3.5" />
        {exporting === 'excel' ? '...' : 'Excel'}
      </Button>
    </div>
  );
}
