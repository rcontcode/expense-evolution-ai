import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDeleteContract, useContracts } from '@/hooks/data/useContracts';
import { ContractWithClient } from '@/types/contract.types';
import { ContractDetailDialog } from '@/components/contracts/ContractDetailDialog';
import { supabase } from '@/integrations/supabase/client';
import { MoreVertical, Eye, Trash2, Download, FileText, CheckCircle2, AlertTriangle, XCircle, Calendar, Clock, Sparkles } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface ContractsTableProps {
  contracts: ContractWithClient[];
}

const statusVariants = {
  uploaded: 'default',
  reviewed: 'secondary',
  approved: 'success',
  rejected: 'destructive',
} as const;

type ValidityStatus = 'active' | 'expiring_soon' | 'expired' | 'not_set';

interface ValidityResult {
  status: ValidityStatus;
  daysRemaining?: number;
  daysExpired?: number;
}

const VALIDITY_CONFIG: Record<ValidityStatus, { 
  icon: React.ElementType; 
  color: string; 
  bgColor: string;
  labelKey: string;
}> = {
  active: { 
    icon: CheckCircle2, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    labelKey: 'contracts.validityActive'
  },
  expiring_soon: { 
    icon: AlertTriangle, 
    color: 'text-yellow-600', 
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    labelKey: 'contracts.validityExpiringSoon'
  },
  expired: { 
    icon: XCircle, 
    color: 'text-red-600', 
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    labelKey: 'contracts.validityExpired'
  },
  not_set: { 
    icon: Calendar, 
    color: 'text-muted-foreground', 
    bgColor: 'bg-muted',
    labelKey: 'contracts.validityNotSet'
  },
};

function calculateValidity(startDate: string | null, endDate: string | null, noticeDays: number = 30): ValidityResult {
  if (!endDate) {
    return { status: 'not_set' };
  }

  const today = new Date();
  const end = new Date(endDate);
  const daysRemaining = differenceInDays(end, today);

  if (isPast(end)) {
    return { 
      status: 'expired', 
      daysExpired: Math.abs(daysRemaining) 
    };
  }

  if (daysRemaining <= noticeDays) {
    return { 
      status: 'expiring_soon', 
      daysRemaining 
    };
  }

  return { 
    status: 'active', 
    daysRemaining 
  };
}

export function ContractsTable({ contracts }: ContractsTableProps) {
  const { t, language } = useLanguage();
  const deleteContract = useDeleteContract();
  const { refetch } = useContracts();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<ContractWithClient | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteContract.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data } = await supabase.storage
      .from('contracts')
      .createSignedUrl(filePath, 3600);
    if (data?.signedUrl) {
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = fileName;
      link.click();
    }
  };

  const handleContractUpdate = () => {
    refetch();
    setSelectedContract(null);
  };

  const locale = language === 'es' ? es : enUS;

  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">{t('contracts.noContracts')}</p>
        <p className="text-sm text-muted-foreground">{t('contracts.uploadFirst')}</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('contracts.fileName')}</TableHead>
              <TableHead>{t('contracts.client')}</TableHead>
              <TableHead>{t('contracts.startDate')}</TableHead>
              <TableHead>{t('contracts.endDate')}</TableHead>
              <TableHead>{t('contracts.validity')}</TableHead>
              <TableHead>{t('contracts.status')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => {
              const validity = calculateValidity(
                contract.start_date, 
                contract.end_date, 
                contract.renewal_notice_days || 30
              );
              const validityConfig = VALIDITY_CONFIG[validity.status];
              const ValidityIcon = validityConfig.icon;

              return (
                <TableRow key={contract.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{contract.title || contract.file_name}</div>
                      {contract.title && (
                        <div className="text-xs text-muted-foreground">{contract.file_name}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{contract.client?.name || '-'}</TableCell>
                  <TableCell>
                    {contract.start_date ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {format(new Date(contract.start_date), 'dd MMM yyyy', { locale })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contract.end_date ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {format(new Date(contract.end_date), 'dd MMM yyyy', { locale })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">{t('contracts.noEndDate')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className={`${validityConfig.bgColor} ${validityConfig.color} border-0 gap-1.5 cursor-default`}>
                          <ValidityIcon className="h-3.5 w-3.5" />
                          <span>{t(validityConfig.labelKey)}</span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        {validity.status === 'active' && validity.daysRemaining !== undefined && (
                          <p>{validity.daysRemaining} {t('contracts.daysRemaining')}</p>
                        )}
                        {validity.status === 'expiring_soon' && validity.daysRemaining !== undefined && (
                          <p className="text-yellow-600 font-medium">
                            ⚠️ {validity.daysRemaining} {t('contracts.daysRemaining')}
                          </p>
                        )}
                        {validity.status === 'expired' && validity.daysExpired !== undefined && (
                          <p className="text-red-600 font-medium">
                            {t('contracts.expiredDaysAgo')} {validity.daysExpired} {t('contracts.days')}
                          </p>
                        )}
                        {validity.status === 'not_set' && (
                          <p>{t('contracts.noEndDate')}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[contract.status || 'uploaded']}>
                      {t(`contracts.statuses.${contract.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedContract(contract)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t('contracts.preview')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(contract.file_path, contract.file_name)}>
                          <Download className="mr-2 h-4 w-4" />
                          {t('contracts.download')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(contract.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('contracts.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('contracts.deleteWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedContract && (
        <ContractDetailDialog
          open={!!selectedContract}
          onOpenChange={(open) => !open && setSelectedContract(null)}
          contract={selectedContract}
          onContractUpdate={handleContractUpdate}
        />
      )}
    </TooltipProvider>
  );
}