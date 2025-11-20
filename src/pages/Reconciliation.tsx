import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { RefreshCw } from 'lucide-react';

export default function Reconciliation() {
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{t('nav.reconciliation')}</h1>
          <p className="text-muted-foreground mt-2">Match bank transactions with expenses</p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No bank transactions</p>
            <p className="text-sm text-muted-foreground">Upload your bank statement to start reconciling</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}