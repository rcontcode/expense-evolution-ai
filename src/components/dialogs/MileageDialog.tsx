import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MileageForm } from '@/components/forms/MileageForm';
import { MileageFormValues } from '@/lib/validations/mileage.schema';
import { useCreateMileage, useUpdateMileage, MileageWithClient } from '@/hooks/data/useMileage';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

interface MileageDialogProps {
  open: boolean;
  onClose: () => void;
  mileage?: MileageWithClient | null;
  yearToDateKm?: number;
}

export const MileageDialog = ({ open, onClose, mileage, yearToDateKm = 0 }: MileageDialogProps) => {
  const { t } = useLanguage();
  const createMileage = useCreateMileage();
  const updateMileage = useUpdateMileage();

  const isEditing = !!mileage;
  const isLoading = createMileage.isPending || updateMileage.isPending;

  const handleSubmit = async (data: MileageFormValues) => {
    const payload = {
      date: format(data.date, 'yyyy-MM-dd'),
      kilometers: data.kilometers,
      route: data.route,
      purpose: data.purpose || null,
      client_id: data.client_id || null,
    };

    if (isEditing && mileage) {
      await updateMileage.mutateAsync({ id: mileage.id, ...payload });
    } else {
      await createMileage.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('mileage.editTrip') : t('mileage.addTrip')}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t('mileage.editDescription') : t('mileage.addDescription')}
          </DialogDescription>
        </DialogHeader>
        <MileageForm
          initialData={mileage}
          yearToDateKm={yearToDateKm}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};
