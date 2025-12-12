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
import { useConversionReminders } from '@/hooks/data/useConversionReminders';
import { NetWorthSummary } from '@/components/net-worth/NetWorthSummary';
import { NetWorthChart } from '@/components/net-worth/NetWorthChart';
import { AssetsList } from '@/components/net-worth/AssetsList';
import { LiabilitiesList } from '@/components/net-worth/LiabilitiesList';
import { AssetDialog } from '@/components/net-worth/AssetDialog';
import { LiabilityDialog } from '@/components/net-worth/LiabilityDialog';
import { InvestmentOnboardingWizard } from '@/components/investments/InvestmentOnboardingWizard';
import { OnboardingGuide } from '@/components/ui/onboarding-guide';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Scale, Lightbulb, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function NetWorth() {
  const { t, language } = useLanguage();
  const { data: assets = [], isLoading: assetsLoading } = useAssets();
  const { data: liabilities = [], isLoading: liabilitiesLoading } = useLiabilities();
  const { data: snapshots = [], isLoading: snapshotsLoading } = useNetWorthSnapshots();
  const createSnapshot = useCreateSnapshot();
  
  // Enable conversion reminders - checks and creates notifications for stale conversions
  useConversionReminders();

  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [liabilityDialogOpen, setLiabilityDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  
  // Investment onboarding state
  const [showInvestmentOnboarding, setShowInvestmentOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem('investment-onboarding-completed') === 'true';
  });

  // Check if user has investment assets
  const investmentCategories = ['stocks', 'crypto', 'bonds', 'mutual_funds', 'etf', 'commodities', 'investments', 'retirement'];
  const hasInvestmentAssets = assets.some(a => 
    investmentCategories.some(cat => a.category.toLowerCase().includes(cat))
  );

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

  const handleCompleteOnboarding = () => {
    localStorage.setItem('investment-onboarding-completed', 'true');
    setHasCompletedOnboarding(true);
    setShowInvestmentOnboarding(false);
  };

  const handleSkipOnboarding = () => {
    setShowInvestmentOnboarding(false);
  };

  const handleStartOnboarding = () => {
    setShowInvestmentOnboarding(true);
  };

  const isLoading = assetsLoading || liabilitiesLoading || snapshotsLoading;

  // Show investment onboarding wizard
  if (showInvestmentOnboarding) {
    return (
      <Layout>
        <div className="py-8">
          <InvestmentOnboardingWizard 
            onComplete={handleCompleteOnboarding}
            onSkip={handleSkipOnboarding}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              {language === 'es' ? 'Patrimonio Neto' : 'Net Worth'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'es' 
                ? 'Visualiza y administra tus activos y pasivos'
                : 'View and manage your assets and liabilities'}
            </p>
          </div>
          
          {/* Investment Onboarding Button */}
          {!hasInvestmentAssets && !hasCompletedOnboarding && (
            <Button 
              onClick={handleStartOnboarding}
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Configurar Inversiones' : 'Setup Investments'}
            </Button>
          )}
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
