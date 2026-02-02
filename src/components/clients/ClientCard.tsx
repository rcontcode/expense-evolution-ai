import { memo } from 'react';
import { Client } from '@/types/expense.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  MapPin,
  CircleDot,
  CheckCircle2,
  AlertCircle,
  Zap,
  PieChart,
  FlaskConical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  calculateClientCompleteness,
  CLIENT_STATUS_CONFIG,
  ClientStatus,
} from '@/lib/constants/client-completeness';

interface ClientCardProps {
  client: Client;
  hasTestData: boolean;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onViewFinancial: (client: Client) => void;
  onDeleteTestData?: (id: string) => void;
}

const STATUS_ICONS: Record<ClientStatus, React.ElementType> = {
  incomplete: AlertCircle,
  in_progress: CircleDot,
  complete: CheckCircle2,
  active: Zap,
};

export const ClientCard = memo(function ClientCard({ 
  client, 
  hasTestData,
  onEdit, 
  onDelete,
  onViewFinancial,
  onDeleteTestData,
}: ClientCardProps) {
  const { t, language } = useLanguage();
  
  const completeness = calculateClientCompleteness(client, hasTestData);
  const statusConfig = CLIENT_STATUS_CONFIG[completeness.status];
  const StatusIcon = STATUS_ICONS[completeness.status];

  return (
    <Card className={cn(
      "transition-all hover:shadow-md relative overflow-hidden",
      completeness.status === 'incomplete' && "border-l-4 border-l-yellow-500"
    )}>
      {/* Status indicator bar */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        statusConfig.bgColor.replace('/30', '')
      )} />
      
      <CardContent className="p-3 pt-4">
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div className={cn(
            "shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
            statusConfig.bgColor
          )}>
            <StatusIcon className={cn("h-5 w-5", statusConfig.color)} />
          </div>
          
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header row: Name + Status */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-semibold text-sm truncate">{client.name}</h4>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">
                    {client.province && `${client.province}, `}
                    {client.country || 'Canada'}
                  </span>
                </div>
              </div>
              <Badge className={cn(
                statusConfig.bgColor,
                statusConfig.color,
                'border-0 text-[10px] px-1.5 py-0 shrink-0'
              )}>
                {completeness.percentage}%
              </Badge>
            </div>
            
            {/* Progress bar */}
            <div className="space-y-0.5">
              <Progress value={completeness.percentage} className="h-1" />
              {completeness.missingFields.length > 0 && (
                <p className="text-[10px] text-muted-foreground truncate">
                  {language === 'es' ? 'Falta' : 'Missing'}: {
                    completeness.missingFields.slice(0, 2).map(f => 
                      language === 'es' ? f.label : f.labelEn
                    ).join(', ')
                  }
                  {completeness.missingFields.length > 2 && ` +${completeness.missingFields.length - 2}`}
                </p>
              )}
            </div>
            
            {/* Test data indicator */}
            {hasTestData && (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <FlaskConical className="h-3 w-3" />
                <span>{t('clients.hasTestData')}</span>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewFinancial(client)}>
                  <PieChart className="mr-2 h-4 w-4" />
                  {language === 'es' ? 'Panorama' : 'Overview'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(client)}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                {hasTestData && onDeleteTestData && (
                  <DropdownMenuItem 
                    onClick={() => onDeleteTestData(client.id)}
                    className="text-amber-600"
                  >
                    <FlaskConical className="mr-2 h-4 w-4" />
                    {t('clients.deleteTestData')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(client.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
