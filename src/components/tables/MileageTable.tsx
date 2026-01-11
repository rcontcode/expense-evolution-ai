import { format } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2, MapPin } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MileageWithClient, useDeleteMileage, calculateMileageDeduction } from '@/hooks/data/useMileage';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { MileageRoutePreview } from '@/components/mileage/MileageRoutePreview';
import { TooltipProvider } from '@/components/ui/tooltip';

interface MileageTableProps {
  data: MileageWithClient[];
  onEdit: (mileage: MileageWithClient) => void;
}

export const MileageTable = ({ data, onEdit }: MileageTableProps) => {
  const { t } = useLanguage();
  const deleteMileage = useDeleteMileage();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Calculate running YTD for deduction display
  const dataWithDeductions = data.map((record, index) => {
    // Get all records before this one in chronological order
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const recordIndex = sortedData.findIndex(r => r.id === record.id);
    const ytdKm = sortedData
      .slice(0, recordIndex)
      .reduce((sum, r) => sum + parseFloat(r.kilometers.toString()), 0);
    
    const km = parseFloat(record.kilometers.toString());
    const { deductible, rate } = calculateMileageDeduction(km, ytdKm);
    
    return { ...record, deductible, rate };
  });

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMileage.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  // Check if record is sample data
  const isSample = (route: string) => route.includes('[SAMPLE]');

  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('mileage.date')}</TableHead>
              <TableHead>{t('mileage.route')}</TableHead>
              <TableHead className="text-right">{t('mileage.kilometers')}</TableHead>
              <TableHead className="text-right">{t('mileage.deduction')}</TableHead>
              <TableHead>{t('mileage.client')}</TableHead>
              <TableHead>{t('mileage.purpose')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataWithDeductions.map((record) => (
              <TableRow key={record.id} className={isSample(record.route) ? 'bg-muted/30' : ''}>
                <TableCell className="font-medium">
                  {format(new Date(record.date), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <MileageRoutePreview
                      startAddress={(record as any).start_address}
                      endAddress={(record as any).end_address}
                      startLat={(record as any).start_lat}
                      startLng={(record as any).start_lng}
                      endLat={(record as any).end_lat}
                      endLng={(record as any).end_lng}
                      kilometers={parseFloat(record.kilometers.toString())}
                      route={record.route}
                      compact
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="max-w-[180px] truncate text-sm font-medium">
                        {record.route.replace('[SAMPLE] ', '')}
                      </span>
                      {isSample(record.route) && (
                        <Badge variant="outline" className="text-xs w-fit mt-1">
                          SAMPLE
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {parseFloat(record.kilometers.toString()).toFixed(1)} km
                </TableCell>
                <TableCell className="text-right">
                  <div className="space-y-1">
                    <div className="font-medium text-chart-1">
                      ${record.deductible.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${record.rate.toFixed(2)}/km
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {record.client?.name ? (
                    <Badge variant="outline">{record.client.name.replace('[SAMPLE] ', '')}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[150px] truncate text-muted-foreground">
                  {record.purpose || '-'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
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
                        onClick={() => setDeleteId(record.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('mileage.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('mileage.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};
