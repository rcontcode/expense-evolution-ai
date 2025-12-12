import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Asset, ASSET_CATEGORIES, useDeleteAsset } from '@/hooks/data/useNetWorth';
import { Plus, Pencil, Trash2, Wallet, TrendingUp, Home, Car, PiggyBank, Bitcoin, Gem, Building2, Package, Droplets } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface AssetsListProps {
  assets: Asset[];
  onAdd: () => void;
  onEdit: (asset: Asset) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wallet, TrendingUp, Home, Car, PiggyBank, Bitcoin, Gem, Building2, Package
};

export function AssetsList({ assets, onAdd, onEdit }: AssetsListProps) {
  const deleteAsset = useDeleteAsset();

  const formatCurrency = (value: number, currency: string = 'CAD') => {
    return new Intl.NumberFormat('es-CA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalAssets = assets.reduce((sum, a) => sum + a.current_value, 0);
  const liquidAssets = assets.filter(a => a.is_liquid).reduce((sum, a) => sum + a.current_value, 0);

  const getCategoryInfo = (categoryValue: string) => {
    return ASSET_CATEGORIES.find(c => c.value === categoryValue) || ASSET_CATEGORIES[ASSET_CATEGORIES.length - 1];
  };

  const getGainLoss = (asset: Asset) => {
    if (!asset.purchase_value) return null;
    const diff = asset.current_value - asset.purchase_value;
    const percent = (diff / asset.purchase_value) * 100;
    return { diff, percent };
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Activos
            </CardTitle>
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <span>Total: <span className="font-semibold text-primary">{formatCurrency(totalAssets)}</span></span>
              <span className="flex items-center gap-1">
                <Droplets className="h-3 w-3" />
                Líquidos: {formatCurrency(liquidAssets)}
              </span>
            </div>
          </div>
          <Button onClick={onAdd} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {assets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No tienes activos registrados</p>
            <p className="text-sm">Agrega tus cuentas, inversiones y propiedades</p>
          </div>
        ) : (
          assets.map((asset) => {
            const category = getCategoryInfo(asset.category);
            const IconComponent = iconMap[category.icon] || Package;
            const gainLoss = getGainLoss(asset);

            return (
              <div
                key={asset.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <IconComponent className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{asset.name}</span>
                      {asset.is_liquid && (
                        <Badge variant="outline" className="text-xs">
                          <Droplets className="h-3 w-3 mr-1" />
                          Líquido
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{category.label}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(asset.current_value, asset.currency)}</div>
                    {gainLoss && (
                      <div className={`text-xs ${gainLoss.diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {gainLoss.diff >= 0 ? '+' : ''}{formatCurrency(gainLoss.diff, asset.currency)} ({gainLoss.percent.toFixed(1)}%)
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(asset)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar activo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará "{asset.name}" permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteAsset.mutate(asset.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
