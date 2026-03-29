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
import { ContractWithClient } from '@/types/contract.types';
import { MoreVertical, Eye, Trash2, Download, FileText, CheckCircle2, AlertTriangle, XCircle, Calendar, Sparkles, User, Files } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ContractCardProps {
  contract: ContractWithClient;
  pageCount?: number;
  onView: (contract: ContractWithClient) => void;
  onDownload: (filePath: string, fileName: string) => void;
  onDelete: (id: string) => void;
}

type ValidityStatus = 'active' | 'expiring_soon' | 'expired' | 'not_set';

interface ValidityResult {
  status: ValidityStatus;
  daysRemaining?: number;
  daysExpired?: number;
}

function calculateValidity(startDate: string | null, endDate: string | null, noticeDays: number = 30): ValidityResult {
  if (!endDate) {
    return { status: 'not_set' };
  }

  const today = new Date();
  const end = new Date(endDate);
  const daysRemaining = differenceInDays(end, today);

  if (isPast(end)) {
    return { status: 'expired', daysExpired: Math.abs(daysRemaining) };
  }

  if (daysRemaining <= noticeDays) {
    return { status: 'expiring_soon', daysRemaining };
  }

  return { status: 'active', daysRemaining };
}

const VALIDITY_CONFIG: Record<ValidityStatus, { 
  icon: React.ElementType; 
  color: string; 
  bgColor: string;
}> = {
  active: { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  expiring_soon: { icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  expired: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  not_set: { icon: Calendar, color: 'text-muted-foreground', bgColor: 'bg-muted' },
};

export function ContractCard({ contract, pageCount = 1, onView, onDownload, onDelete }: ContractCardProps) {
  const { language } = useLanguage();
  const { t } = useLanguage();
  const locale = language === 'es' ? es : enUS;
  
  const validity = calculateValidity(
    contract.start_date, 
    contract.end_date, 
    contract.renewal_notice_days || 30
  );
  const validityConfig = VALIDITY_CONFIG[validity.status];
  const ValidityIcon = validityConfig.icon;

  return (
    <Card className="overflow-hidden active:scale-[0.99] transition-transform">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-sm truncate">
                  {contract.title || contract.file_name}
                </p>
                {pageCount > 1 && (
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 gap-0.5 shrink-0">
                    <Files className="h-3 w-3" />
                    {pageCount}
                  </Badge>
                )}
              </div>
              {contract.client?.name && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <User className="h-3 w-3" />
                  <span className="truncate">{contract.client.name}</span>
                </div>
              )}
              
              {/* Dates row */}
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                {contract.start_date && (
                  <span>{format(new Date(contract.start_date), 'dd MMM yy', { locale })}</span>
                )}
                {contract.start_date && contract.end_date && <span>→</span>}
                {contract.end_date && (
                  <span>{format(new Date(contract.end_date), 'dd MMM yy', { locale })}</span>
                )}
              </div>
              
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <Badge className={cn(
                  validityConfig.bgColor, 
                  validityConfig.color, 
                  "border-0 text-[10px] h-5 px-1.5 gap-0.5"
                )}>
                  <ValidityIcon className="h-3 w-3" />
                  {validity.status === 'active' && (language === 'es' ? 'Activo' : 'Active')}
                  {validity.status === 'expiring_soon' && (language === 'es' ? 'Por vencer' : 'Expiring')}
                  {validity.status === 'expired' && (language === 'es' ? 'Vencido' : 'Expired')}
                  {validity.status === 'not_set' && (language === 'es' ? 'Sin fecha' : 'No date')}
                </Badge>
                
                {contract.ai_processed_at ? (
                  <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-0 text-[10px] h-5 px-1.5 gap-0.5">
                    <Sparkles className="h-3 w-3" />
                    IA
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                    {language === 'es' ? 'Pendiente' : 'Pending'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(contract)}>
                <Eye className="mr-2 h-4 w-4" />
                {t('contracts.preview')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload(contract.file_path, contract.file_name)}>
                <Download className="mr-2 h-4 w-4" />
                {t('contracts.download')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(contract.id)}
                className="text-destructive"
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
