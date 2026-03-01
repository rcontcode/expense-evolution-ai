import { useLanguage } from '@/contexts/LanguageContext';
import { BillsDashboard } from '@/components/bills/BillsDashboard';

export default function Bills() {
  const { language } = useLanguage();
  const l = language === 'es';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {l ? '📅 Pagos Fijos' : '📅 Recurring Bills'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {l ? 'Gestiona tus obligaciones recurrentes: agua, luz, internet y más.' : 'Manage your recurring obligations: water, electricity, internet and more.'}
        </p>
      </div>
      <BillsDashboard />
    </div>
  );
}
