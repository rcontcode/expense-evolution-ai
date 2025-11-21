import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TagForm } from '@/components/forms/TagForm';
import { useCreateTag, useUpdateTag } from '@/hooks/data/useTags';
import { Tag, TagInsert } from '@/types/expense.types';
import { useLanguage } from '@/contexts/LanguageContext';

interface TagDialogProps {
  open: boolean;
  onClose: () => void;
  tag?: Tag;
}

export function TagDialog({ open, onClose, tag }: TagDialogProps) {
  const { t } = useLanguage();
  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();

  const handleSubmit = async (data: { name: string; color: string }) => {
    try {
      if (tag) {
        await updateMutation.mutateAsync({ id: tag.id, updates: data as Partial<TagInsert> });
      } else {
        await createMutation.mutateAsync(data as TagInsert);
      }
      onClose();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tag ? t('tags.editTag') : t('tags.createTag')}</DialogTitle>
        </DialogHeader>
        <TagForm
          tag={tag}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
