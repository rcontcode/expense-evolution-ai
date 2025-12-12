import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  useAssets, 
  useLiabilities, 
  useNetWorthSnapshots,
  useCreateSnapshot,
  Asset,
  Liability
} from '@/hooks/data/useNetWorth';
import { NetWorthSummary } from '@/components/net-worth/NetWorthSummary';
import { NetWorthChart } from '@/components/net-worth/NetWorthChart';
import { AssetsList } from '@/components/net-worth/AssetsList';
import { LiabilitiesList } from '@/components/net-worth/LiabilitiesList';
import { AssetDialog } from '@/components/net-worth/AssetDialog';
import { LiabilityDialog } from '@/components/net-worth/LiabilityDialog';
import { OnboardingGuide } from '@/components/ui/onboarding-guide';
import { Skeleton } from '@/components/ui/skeleton';
import { Scale, Lightbulb } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function NetWorth() {
  const { t } = useLanguage();
  const { data: assets = [], isLoading: assetsLoading } = useAssets();
  const { data: liabilities = [], isLoading: liabilitiesLoading } = useLiabilities();
  const { data: snapshots = [], isLoading: snapshotsLoading } = useNetWorthSnapshots();
  const createSnapshot = useCreateSnapshot();

  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [liabilityDialogOpen, setLiabilityDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);

  const totalAssets = useMemo(() => 
    assets.reduce((sum, a) => sum + a.current_value, 0), 
    [assets]
  );

  const totalLiabilities = useMemo(() => 
    liabilities.reduce((sum, l) => sum + l.current_balance, 0), 
    [liabilities]
  );

  const netWorth = totalAssets - totalLiabilities;

  // Auto-save snapshot when data changes
  useEffect(() => {
    if (assets.length > 0 || liabilities.length > 0) {
      const timer = setTimeout(() => {
        createSnapshot.mutate({
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
          net_worth: netWorth,
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [totalAssets, totalLiabilities]);

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetDialogOpen(true);
  };

  const handleEditLiability = (liability: Liability) => {
    setEditingLiability(liability);
    setLiabilityDialogOpen(true);
  };

  const handleAddAsset = () => {
    setEditingAsset(null);
    setAssetDialogOpen(true);
  };

  const handleAddLiability = () => {
    setEditingLiability(null);
    setLiabilityDialogOpen(true);
  };

  const isLoading = assetsLoading || liabilitiesLoading || snapshotsLoading;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              Patrimonio Neto
            </h1>
            <p className="text-muted-foreground">
              Visualiza y administra tus activos y pasivos
            </p>
          </div>
        </div>

        {/* Onboarding */}
        <OnboardingGuide pageKey="dashboard" />

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-[350px]" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <NetWorthSummary 
              totalAssets={totalAssets}
              totalLiabilities={totalLiabilities}
              snapshots={snapshots}
            />

            {/* Tip */}
            {assets.length > 0 && liabilities.length > 0 && (
              <Alert className="border-primary/20 bg-primary/5">
                <Lightbulb className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <strong>Tip:</strong> Para aumentar tu patrimonio neto, enfócate en reducir deudas con alto interés 
                  primero (método avalancha) y luego invierte la diferencia en activos que generen ingresos pasivos.
                </AlertDescription>
              </Alert>
            )}

            {/* Evolution Chart */}
            <NetWorthChart 
              snapshots={snapshots}
              currentNetWorth={netWorth}
              currentAssets={totalAssets}
              currentLiabilities={totalLiabilities}
            />

            {/* Assets and Liabilities Lists */}
            <div className="grid gap-6 lg:grid-cols-2">
              <AssetsList 
                assets={assets}
                onAdd={handleAddAsset}
                onEdit={handleEditAsset}
              />
              <LiabilitiesList 
                liabilities={liabilities}
                onAdd={handleAddLiability}
                onEdit={handleEditLiability}
              />
            </div>
          </>
        )}

        {/* Dialogs */}
        <AssetDialog
          open={assetDialogOpen}
          onOpenChange={setAssetDialogOpen}
          editingAsset={editingAsset}
        />
        <LiabilityDialog
          open={liabilityDialogOpen}
          onOpenChange={setLiabilityDialogOpen}
          editingLiability={editingLiability}
        />
      </div>
    </Layout>
  );
}
