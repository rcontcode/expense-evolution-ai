import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardFiltersProps {
  selectedClient: string;
  selectedStatus: string;
  selectedCategory: string;
  onClientChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onReset: () => void;
  clients: { id: string; name: string }[];
}

export const DashboardFilters = memo(({
  selectedClient,
  selectedStatus,
  selectedCategory,
  onClientChange,
  onStatusChange,
  onCategoryChange,
  onReset,
  clients,
}: DashboardFiltersProps) => {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('filters.dashboardFilters')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>{t('filters.client')}</Label>
            <Select value={selectedClient} onValueChange={onClientChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('filters.allClients')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allClients')}</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('filters.status')}</Label>
            <Select value={selectedStatus} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('filters.allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
                <SelectItem value="deductible">{t('expenses.deductible')}</SelectItem>
                <SelectItem value="reimbursable">{t('expenses.reimbursable')}</SelectItem>
                <SelectItem value="pending">{t('expenses.pending')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('filters.category')}</Label>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('filters.allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allCategories')}</SelectItem>
                <SelectItem value="meals">{t('filters.meals')}</SelectItem>
                <SelectItem value="travel">{t('filters.travel')}</SelectItem>
                <SelectItem value="equipment">{t('filters.equipment')}</SelectItem>
                <SelectItem value="software">{t('filters.software')}</SelectItem>
                <SelectItem value="office_supplies">{t('filters.officeSupplies')}</SelectItem>
                <SelectItem value="utilities">{t('filters.utilities')}</SelectItem>
                <SelectItem value="professional_services">{t('filters.professionalServices')}</SelectItem>
                <SelectItem value="home_office">{t('filters.homeOffice')}</SelectItem>
                <SelectItem value="mileage">{t('filters.mileage')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={onReset} variant="outline" className="w-full">
          {t('filters.resetFilters')}
        </Button>
      </CardContent>
    </Card>
  );
});

DashboardFilters.displayName = 'DashboardFilters';
