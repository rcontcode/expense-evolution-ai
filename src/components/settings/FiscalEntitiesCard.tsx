import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, Plus, Globe, Edit2, Trash2, Star, StarOff, 
  MoreHorizontal, Check, X, AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  useFiscalEntities, 
  useDeleteFiscalEntity, 
  useSetPrimaryEntity,
  useUpdateFiscalEntity,
  type FiscalEntity 
} from '@/hooks/data/useFiscalEntities';
import { FiscalEntityDialog } from './FiscalEntityDialog';
import { getCountryConfig, type CountryCode } from '@/lib/constants/country-tax-config';
import { CountryFlag } from '@/components/ui/country-flag';

export function FiscalEntitiesCard() {
  const { language } = useLanguage();
  const { data: entities, isLoading } = useFiscalEntities();
  const deleteEntity = useDeleteFiscalEntity();
  const setPrimary = useSetPrimaryEntity();
  const updateEntity = useUpdateFiscalEntity();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<FiscalEntity | null>(null);
  const [deleteConfirmEntity, setDeleteConfirmEntity] = useState<FiscalEntity | null>(null);

  const handleEdit = (entity: FiscalEntity) => {
    setEditingEntity(entity);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingEntity(null);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteConfirmEntity) {
      await deleteEntity.mutateAsync(deleteConfirmEntity.id);
      setDeleteConfirmEntity(null);
    }
  };

  const handleToggleActive = async (entity: FiscalEntity) => {
    await updateEntity.mutateAsync({ 
      id: entity.id, 
      is_active: !entity.is_active 
    });
  };


  const getEntityTypeLabel = (entity: FiscalEntity) => {
    const config = getCountryConfig(entity.country as CountryCode);
    const workType = config.workTypes.find(wt => wt.value === entity.entity_type);
    return workType?.label[language as 'es' | 'en'] || entity.entity_type;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasEntities = entities && entities.length > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>
                  {language === 'es' ? 'Jurisdicciones Fiscales' : 'Fiscal Jurisdictions'}
                </CardTitle>
                <CardDescription>
                  {language === 'es' 
                    ? 'Gestiona tus entidades fiscales en diferentes países'
                    : 'Manage your fiscal entities across different countries'}
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleCreate} size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              {language === 'es' ? 'Agregar' : 'Add'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!hasEntities ? (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">
                  {language === 'es' ? 'Sin entidades fiscales' : 'No fiscal entities'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'es' 
                    ? 'Crea tu primera entidad fiscal para comenzar a organizar tus finanzas por jurisdicción'
                    : 'Create your first fiscal entity to start organizing your finances by jurisdiction'}
                </p>
              </div>
              <Button onClick={handleCreate} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                {language === 'es' ? 'Crear Primera Entidad' : 'Create First Entity'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {entities.map(entity => (
                <div
                  key={entity.id}
                  className={`p-4 rounded-lg border transition-all ${
                    entity.is_active 
                      ? 'bg-card hover:bg-accent/50' 
                      : 'bg-muted/50 opacity-60'
                  }`}
                  style={{ borderLeftWidth: 4, borderLeftColor: entity.color || '#3b82f6' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                        style={{ backgroundColor: `${entity.color || '#3b82f6'}20` }}
                      >
                        {entity.icon || '🏢'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium truncate">{entity.name}</h4>
                          {entity.is_primary && (
                            <Badge variant="default" className="gap-1 text-xs">
                              <Star className="h-3 w-3" />
                              {language === 'es' ? 'Principal' : 'Primary'}
                            </Badge>
                          )}
                          {!entity.is_active && (
                            <Badge variant="secondary" className="text-xs">
                              {language === 'es' ? 'Inactiva' : 'Inactive'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
                          <span className="flex items-center gap-1"><CountryFlag code={entity.country} size="xs" /> {entity.country}</span>
                          <span>•</span>
                          <span>{getEntityTypeLabel(entity)}</span>
                          {entity.tax_id && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-xs">{entity.tax_id}</span>
                            </>
                          )}
                        </div>
                        {entity.province && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {entity.province} • {entity.default_currency}
                          </p>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(entity)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          {language === 'es' ? 'Editar' : 'Edit'}
                        </DropdownMenuItem>
                        {!entity.is_primary && (
                          <DropdownMenuItem onClick={() => setPrimary.mutate(entity.id)}>
                            <Star className="h-4 w-4 mr-2" />
                            {language === 'es' ? 'Establecer como Principal' : 'Set as Primary'}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleToggleActive(entity)}>
                          {entity.is_active ? (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              {language === 'es' ? 'Desactivar' : 'Deactivate'}
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              {language === 'es' ? 'Activar' : 'Activate'}
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteConfirmEntity(entity)}
                          className="text-destructive focus:text-destructive"
                          disabled={entity.is_primary}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {language === 'es' ? 'Eliminar' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasEntities && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                {language === 'es' 
                  ? 'La entidad principal se usa por defecto al crear transacciones. Puedes filtrar el dashboard por entidad o ver todas consolidadas.'
                  : 'The primary entity is used by default when creating transactions. You can filter the dashboard by entity or view all consolidated.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <FiscalEntityDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entity={editingEntity}
        isFirstEntity={!hasEntities}
      />

      <AlertDialog open={!!deleteConfirmEntity} onOpenChange={() => setDeleteConfirmEntity(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'es' ? '¿Eliminar entidad fiscal?' : 'Delete fiscal entity?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'es' 
                ? `Esta acción eliminará "${deleteConfirmEntity?.name}". Los gastos e ingresos asociados quedarán sin asignar.`
                : `This will delete "${deleteConfirmEntity?.name}". Associated expenses and income will become unassigned.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'es' ? 'Eliminar' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
