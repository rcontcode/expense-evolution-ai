import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, Sparkles, Zap, ArrowRight, Receipt, 
  TrendingUp, Camera, Users, FolderOpen, Calendar 
} from 'lucide-react';
import { usePlanLimits, PlanType } from '@/hooks/data/usePlanLimits';
import { useState } from 'react';
import { UpgradePrompt } from './UpgradePrompt';
import { useNavigate } from 'react-router-dom';

const planIcons = {
  free: Zap,
  premium: Sparkles,
  pro: Crown,
};

const planColors = {
  free: 'from-slate-500 to-slate-600',
  premium: 'from-amber-500 via-orange-500 to-red-500',
  pro: 'from-violet-600 via-purple-600 to-indigo-600',
};

const planNames = {
  free: 'Free',
  premium: 'Premium',
  pro: 'Pro',
};

export function PlanUsageCard() {
  const navigate = useNavigate();
  const { 
    planType, 
    usage, 
    limits, 
    clientCount, 
    projectCount,
    getUsagePercentage,
    getRemainingUsage,
    getUpgradePlan,
    isLoading,
  } = usePlanLimits();

  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<string>('expenses');

  const Icon = planIcons[planType];
  const upgradePlan = getUpgradePlan();

  const openUpgradeDialog = (feature: string) => {
    setUpgradeFeature(feature);
    setUpgradeDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </CardContent>
      </Card>
    );
  }

  const usageItems = [
    {
      label: 'Gastos este mes',
      current: usage.expenses_count,
      limit: limits.expenses_per_month,
      icon: Receipt,
      feature: 'expenses',
    },
    {
      label: 'Ingresos este mes',
      current: usage.incomes_count,
      limit: limits.incomes_per_month,
      icon: TrendingUp,
      feature: 'incomes',
    },
    {
      label: 'Escaneos OCR',
      current: usage.ocr_scans_count,
      limit: limits.ocr_scans_per_month,
      icon: Camera,
      feature: 'ocr',
    },
    {
      label: 'Clientes',
      current: clientCount,
      limit: limits.clients,
      icon: Users,
      feature: 'clients',
    },
    {
      label: 'Proyectos',
      current: projectCount,
      limit: limits.projects,
      icon: FolderOpen,
      feature: 'projects',
    },
  ];

  // Get next reset date
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className={`pb-3 bg-gradient-to-r ${planColors[planType]} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Plan {planNames[planType]}</CardTitle>
                <p className="text-xs text-white/80">
                  {planType === 'free' ? 'Gratis para siempre' : 'Facturación mensual'}
                </p>
              </div>
            </div>
            {upgradePlan && (
              <Button 
                size="sm" 
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={() => setUpgradeDialogOpen(true)}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Upgrade
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-4 space-y-4">
          {/* Usage bars */}
          {usageItems.map((item) => {
            const isUnlimited = item.limit === Infinity;
            const percentage = isUnlimited ? 0 : (item.current / item.limit) * 100;
            const isNearLimit = percentage >= 80;
            const isAtLimit = !isUnlimited && item.current >= item.limit;
            const ItemIcon = item.icon;

            return (
              <div key={item.feature} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <ItemIcon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {isUnlimited ? (
                    <Badge variant="secondary" className="text-xs font-normal">
                      ∞ Ilimitado
                    </Badge>
                  ) : (
                    <span className={`font-medium ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-amber-600' : ''}`}>
                      {item.current} / {item.limit}
                    </span>
                  )}
                </div>
                {!isUnlimited && (
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className={`h-1.5 flex-1 ${
                        isAtLimit 
                          ? '[&>div]:bg-destructive' 
                          : isNearLimit 
                            ? '[&>div]:bg-amber-500' 
                            : ''
                      }`}
                    />
                    {isAtLimit && upgradePlan && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => openUpgradeDialog(item.feature)}
                        className="text-xs h-6 px-2 text-primary hover:text-primary"
                      >
                        <Zap className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Reset info */}
          <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Límites se reinician en {daysUntilReset} días
            </span>
            <Button 
              variant="link" 
              size="sm" 
              className="h-auto p-0 text-xs"
              onClick={() => navigate('/settings?tab=subscription')}
            >
              Ver detalles
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <UpgradePrompt
        isOpen={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
        feature={upgradeFeature}
        currentPlan={planType}
        requiredPlan={upgradePlan || undefined}
        usageType={upgradeFeature as 'expenses' | 'incomes' | 'ocr' | 'clients' | 'projects'}
        currentUsage={
          upgradeFeature === 'expenses' ? usage.expenses_count :
          upgradeFeature === 'incomes' ? usage.incomes_count :
          upgradeFeature === 'ocr' ? usage.ocr_scans_count :
          upgradeFeature === 'clients' ? clientCount :
          projectCount
        }
        limit={
          upgradeFeature === 'expenses' ? (limits.expenses_per_month === Infinity ? 0 : limits.expenses_per_month) :
          upgradeFeature === 'incomes' ? (limits.incomes_per_month === Infinity ? 0 : limits.incomes_per_month) :
          upgradeFeature === 'ocr' ? (limits.ocr_scans_per_month === Infinity ? 0 : limits.ocr_scans_per_month) :
          upgradeFeature === 'clients' ? (limits.clients === Infinity ? 0 : limits.clients) :
          (limits.projects === Infinity ? 0 : limits.projects)
        }
      />
    </>
  );
}
