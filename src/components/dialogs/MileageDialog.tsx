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
import { useEntity } from '@/contexts/EntityContext';
import { format } from 'date-fns';

interface MileageDialogProps {
  open: boolean;
  onClose: () => void;
  mileage?: MileageWithClient | null;
  yearToDateKm?: number;
}

export const MileageDialog = ({ open, onClose, mileage, yearToDateKm = 0 }: MileageDialogProps) => {
  const { t } = useLanguage();
  const { currentEntity } = useEntity();
  const createMileage = useCreateMileage(currentEntity?.id);
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
      start_address: data.start_address || null,
      end_address: data.end_address || null,
      start_lat: data.start_lat || null,
      start_lng: data.start_lng || null,
      end_lat: data.end_lat || null,
      end_lng: data.end_lng || null,
      entity_id: data.entity_id || currentEntity?.id || null,
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
