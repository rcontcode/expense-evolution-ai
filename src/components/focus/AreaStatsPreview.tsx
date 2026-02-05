 import { memo, useMemo } from 'react';
 import { FocusAreaId } from '@/lib/constants/focus-areas';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useDashboardStats } from '@/hooks/data/useDashboardStats';
 import { useMileageSummary } from '@/hooks/data/useMileage';
 import { Badge } from '@/components/ui/badge';
 import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface AreaStatsPreviewProps {
   areaId: FocusAreaId;
 }
 
 // Quick stats shown when area is collapsed
 export const AreaStatsPreview = memo(({ areaId }: AreaStatsPreviewProps) => {
   const { language } = useLanguage();
   const { data: stats } = useDashboardStats({});
   const { data: mileage } = useMileageSummary();
 
   const previewData = useMemo(() => {
     switch (areaId) {
       case 'negocio': {
         const totalClients = stats?.clientBreakdown?.length || 0;
         const totalKm = mileage?.totalKilometers || 0;
         return {
           stats: [
             { label: language === 'es' ? 'Clientes' : 'Clients', value: totalClients },
             { label: 'Km', value: totalKm.toFixed(0) },
           ],
           status: totalClients > 0 ? 'success' : 'info',
         };
       }
       case 'familia': {
         const categories = stats?.categoryBreakdown?.length || 0;
         return {
           stats: [
             { label: language === 'es' ? 'Categorías' : 'Categories', value: categories },
           ],
           status: 'info' as const,
         };
       }
       case 'diadia': {
         const pending = 0; // Could hook into documents pending review
         return {
           stats: [
             { label: language === 'es' ? 'Pendientes' : 'Pending', value: pending },
           ],
           status: pending > 5 ? 'warning' : 'success',
         };
       }
       case 'crecimiento': {
         return {
           stats: [
             { label: language === 'es' ? 'Metas activas' : 'Active goals', value: '—' },
           ],
           status: 'info' as const,
         };
       }
       case 'impuestos': {
         return {
           stats: [
             { label: language === 'es' ? 'Deducciones' : 'Deductions', value: '—' },
           ],
           status: 'info' as const,
         };
       }
       default:
         return { stats: [], status: 'info' as const };
     }
   }, [areaId, stats, mileage, language]);
 
   const statusIcon = {
     success: <CheckCircle2 className="h-3 w-3 text-[hsl(var(--chart-2))]" />,
     warning: <AlertCircle className="h-3 w-3 text-[hsl(var(--chart-4))]" />,
     info: <Clock className="h-3 w-3 text-muted-foreground" />,
   };
 
   if (previewData.stats.length === 0) return null;
 
   return (
     <div className="flex items-center gap-2 flex-wrap">
       {statusIcon[previewData.status]}
       {previewData.stats.map((stat, i) => (
         <Badge 
           key={i} 
           variant="secondary" 
           className="text-xs font-normal bg-muted/50"
         >
           {stat.value} {stat.label}
         </Badge>
       ))}
     </div>
   );
 });
 
 AreaStatsPreview.displayName = 'AreaStatsPreview';