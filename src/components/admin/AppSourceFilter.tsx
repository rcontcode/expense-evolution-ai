import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  value: string;
  onChange: (value: string) => void;
  language: 'es' | 'en';
}

const APP_OPTIONS = [
  { value: 'all', labelEs: '🌐 Todas las apps', labelEn: '🌐 All apps' },
  { value: 'evofinz', labelEs: '💰 EvoFinz', labelEn: '💰 EvoFinz' },
  { value: 'fokuspark', labelEs: '🧘 FokusPark', labelEn: '🧘 FokusPark' },
  { value: 'universmind', labelEs: '🧠 UniversMind', labelEn: '🧠 UniversMind' },
];

export const AppSourceFilter = ({ value, onChange, language }: Props) => {
  const isEs = language === 'es';
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[160px] h-9 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {APP_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {isEs ? opt.labelEs : opt.labelEn}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const filterLeadsByApp = (leads: any[], appFilter: string): any[] => {
  if (appFilter === 'all') return leads;
  return leads.filter((l) => l.source?.toLowerCase().includes(appFilter.toLowerCase()));
};
