import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Plus, Tag as TagIcon, Edit, Trash2, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTags, useDeleteTag, useSeedDefaultTags } from '@/hooks/data/useTags';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TagDialog } from '@/components/dialogs/TagDialog';
import { Tag } from '@/types/expense.types';
import { TooltipProvider } from '@/components/ui/tooltip';
import { InfoTooltip, TOOLTIP_CONTENT } from '@/components/ui/info-tooltip';
import { TAG_COLOR_PALETTE } from '@/lib/constants/default-tags';
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

export default function Tags() {
  const { t, language } = useLanguage();
  const { data: tags, isLoading } = useTags();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteMutation = useDeleteTag();
  const seedDefaultTags = useSeedDefaultTags();

  const handleEdit = (tag: Tag) => {
    setSelectedTag(tag);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedTag(undefined);
  };

  const handleCreate = () => {
    setSelectedTag(undefined);
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <Layout>
      <TooltipProvider>
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-3xl font-bold">{t('tags.title')}</h1>
                <p className="text-muted-foreground mt-2">{t('tags.description')}</p>
              </div>
              <InfoTooltip {...TOOLTIP_CONTENT.tags} />
            </div>
            <InfoTooltip {...TOOLTIP_CONTENT.createTag} variant="wrapper">
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t('tags.createTag')}
              </Button>
            </InfoTooltip>
          </div>

          {isLoading ? (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">{t('common.loading')}</p>
              </CardContent>
            </Card>
          ) : tags && tags.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.map((tag) => (
                <Card key={tag.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <Badge
                        style={{ backgroundColor: tag.color || '#3B82F6' }}
                        className="text-white text-base px-3 py-1"
                      >
                        {tag.name}
                      </Badge>
                      <div className="flex gap-2">
                        <InfoTooltip {...TOOLTIP_CONTENT.editAction} variant="wrapper">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(tag)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </InfoTooltip>
                        <InfoTooltip {...TOOLTIP_CONTENT.deleteAction} variant="wrapper">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(tag.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </InfoTooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TagIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">{t('tags.noTags')}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('tags.createFirst')}
                </p>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => seedDefaultTags.mutate()}
                    disabled={seedDefaultTags.isPending}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {language === 'es' ? 'Crear Predeterminadas' : 'Create Defaults'}
                  </Button>
                  <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('tags.createTag')}
                  </Button>
                </div>
                
                {/* Color Palette Preview */}
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2 text-center">
                    {language === 'es' ? 'Paleta de colores disponibles' : 'Available color palette'}
                  </p>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {TAG_COLOR_PALETTE.map((item) => (
                      <div 
                        key={item.color} 
                        className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                        style={{ backgroundColor: item.color }}
                        title={language === 'es' ? item.name : item.nameEn}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <TagDialog open={dialogOpen} onClose={handleClose} tag={selectedTag} />

          <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('tags.deleteConfirm')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('tags.deleteTagWarning')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>{t('common.delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TooltipProvider>
    </Layout>
  );
}
