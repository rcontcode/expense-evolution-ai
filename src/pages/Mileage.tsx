import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Car, Plus } from 'lucide-react';

export default function Mileage() {
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('nav.mileage')}</h1>
            <p className="text-muted-foreground mt-2">Track your business mileage</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Trip
          </Button>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No mileage records</p>
            <p className="text-sm text-muted-foreground">Start tracking your business trips</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}