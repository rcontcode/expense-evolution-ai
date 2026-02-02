import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { MileageWithClient, calculateMileageDeduction } from '@/hooks/data/useMileage';
import { MoreHorizontal, Pencil, Trash2, MapPin, Calendar, Car, DollarSign, User } from 'lucide-react';

interface MileageCardProps {
  record: MileageWithClient;
  ytdKm: number;
  onEdit: (record: MileageWithClient) => void;
  onDelete: (id: string) => void;
}

export function MileageCard({ record, ytdKm, onEdit, onDelete }: MileageCardProps) {
  const { t } = useLanguage();
  
  const km = parseFloat(record.kilometers.toString());
  const { deductible, rate } = calculateMileageDeduction(km, ytdKm);
  const isSample = record.route.includes('[SAMPLE]');
  
  return (
    <Card className={`overflow-hidden active:scale-[0.99] transition-transform ${isSample ? 'bg-muted/30' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Car className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              {/* Route */}
              <p className="font-medium text-sm truncate">
                {record.route.replace('[SAMPLE] ', '')}
              </p>
              
              {/* Date and Client */}
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(record.date), 'dd/MM/yy')}
                </div>
                {record.client?.name && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1 truncate">
                      <User className="h-3 w-3" />
                      <span className="truncate">{record.client.name.replace('[SAMPLE] ', '')}</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* Purpose if exists */}
              {record.purpose && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {record.purpose}
                </p>
              )}
              
              {/* Stats row */}
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline" className="text-xs h-6 gap-1">
                  <MapPin className="h-3 w-3" />
                  {km.toFixed(1)} km
                </Badge>
                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-0 text-xs h-6 gap-1">
                  <DollarSign className="h-3 w-3" />
                  ${deductible.toFixed(2)}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  ${rate.toFixed(2)}/km
                </span>
              </div>
              
              {isSample && (
                <Badge variant="outline" className="text-[10px] mt-2">
                  SAMPLE
                </Badge>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(record)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(record.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
