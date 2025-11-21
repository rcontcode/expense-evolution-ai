import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { useDeleteContract, useContractUrl } from '@/hooks/data/useContracts';
import { ContractWithClient } from '@/types/contract.types';
import { MoreVertical, Eye, Trash2, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
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

export function ContractsTable({ contracts }: ContractsTableProps) {
  const { t, language } = useLanguage();
  const deleteContract = useDeleteContract();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewPath, setPreviewPath] = useState<string | null>(null);

  const { data: previewUrl } = useContractUrl(previewPath);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteContract.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data } = await useContractUrl(filePath);
    if (data) {
      const link = document.createElement('a');
      link.href = data;
      link.download = fileName;
      link.click();
    }
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
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('contracts.fileName')}</TableHead>
              <TableHead>{t('contracts.client')}</TableHead>
              <TableHead>{t('contracts.status')}</TableHead>
              <TableHead>{t('contracts.uploadDate')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell className="font-medium">{contract.file_name}</TableCell>
                <TableCell>{contract.client?.name || '-'}</TableCell>
                <TableCell>
                  <Badge variant={statusVariants[contract.status || 'uploaded']}>
                    {t(`contracts.statuses.${contract.status}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(contract.created_at), 'PP', { locale })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreviewPath(contract.file_path)}>
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
            ))}
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

      {previewUrl && (
        <Dialog open={!!previewPath} onOpenChange={() => setPreviewPath(null)}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>{t('contracts.preview')}</DialogTitle>
            </DialogHeader>
            <iframe src={previewUrl} className="w-full h-full" />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
