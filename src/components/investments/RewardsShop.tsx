import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRewards, usePurchaseReward, useEquipReward, REWARDS, RARITY_COLORS, RARITY_LABELS, Reward } from '@/hooks/data/useRewards';
import { Sparkles, Palette, Award, Star, Zap, Lock, Check, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_ICONS = {
  theme: Palette,
  badge: Award,
  title: Star,
  feature: Zap,
};

const TYPE_LABELS = {
  theme: { es: 'Temas', en: 'Themes' },
  badge: { es: 'Badges', en: 'Badges' },
  title: { es: 'Títulos', en: 'Titles' },
  feature: { es: 'Funciones', en: 'Features' },
};

export function RewardsShop() {
  const { t, language } = useLanguage();
  const { rewards, unlockedRewards, userXP, isRewardUnlocked, canAffordReward, getRewardsByType } = useRewards();
  const { purchaseReward } = usePurchaseReward();
  const { equipReward } = useEquipReward();
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handlePurchase = () => {
    if (selectedReward) {
      purchaseReward(selectedReward);
      setConfirmDialogOpen(false);
      setSelectedReward(null);
    }
  };

  const handleEquipToggle = (reward: Reward) => {
    const isEquipped = unlockedRewards[reward.id]?.equipped;
    equipReward(reward.id, !isEquipped);
  };

  const renderRewardCard = (reward: Reward) => {
    const isUnlocked = isRewardUnlocked(reward.id);
    const canAfford = canAffordReward(reward);
    const isEquipped = unlockedRewards[reward.id]?.equipped;
    const Icon = TYPE_ICONS[reward.type];

    return (
      <Card 
        key={reward.id} 
        className={cn(
          "relative overflow-hidden transition-all hover:shadow-lg",
          isUnlocked ? "border-primary/50 bg-primary/5" : "",
          !isUnlocked && !canAfford ? "opacity-60" : ""
        )}
      >
        {/* Rarity indicator */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1",
          RARITY_COLORS[reward.rarity]
        )} />
        
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{reward.icon}</span>
              <div>
                <CardTitle className="text-sm">
                  {language === 'es' ? reward.name_es : reward.name_en}
                </CardTitle>
                <Badge variant="outline" className="text-xs mt-1">
                  {RARITY_LABELS[reward.rarity][language === 'es' ? 'es' : 'en']}
                </Badge>
              </div>
            </div>
            {isUnlocked ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {language === 'es' ? reward.description_es : reward.description_en}
          </p>
          
          {/* Theme preview */}
          {reward.type === 'theme' && reward.preview && (
            <div 
              className="h-8 rounded-md" 
              style={{ background: reward.preview }}
            />
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{reward.xp_cost} XP</span>
            </div>
            
            {isUnlocked ? (
              <Button 
                size="sm" 
                variant={isEquipped ? "default" : "outline"}
                onClick={() => handleEquipToggle(reward)}
              >
                {isEquipped ? t('rewards.equipped') : t('rewards.equip')}
              </Button>
            ) : (
              <Button 
                size="sm" 
                disabled={!canAfford}
                onClick={() => {
                  setSelectedReward(reward);
                  setConfirmDialogOpen(true);
                }}
              >
                <ShoppingBag className="h-3 w-3 mr-1" />
                {t('rewards.redeem')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const unlockedCount = Object.keys(unlockedRewards).length;
  const totalRewards = REWARDS.length;
  const progressPercent = (unlockedCount / totalRewards) * 100;

  return (
    <div className="space-y-6">
      {/* XP Balance & Progress */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Sparkles className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('rewards.yourXP')}
                </p>
                <p className="text-3xl font-bold">{userXP.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {t('rewards.rewardsUnlocked')}
              </p>
              <p className="text-lg font-semibold">{unlockedCount} / {totalRewards}</p>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {Math.round(progressPercent)}% {t('rewards.unlocked')}
          </p>
        </CardContent>
      </Card>

      {/* Rewards by category */}
      <Tabs defaultValue="theme" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          {(['theme', 'badge', 'title', 'feature'] as const).map(type => {
            const Icon = TYPE_ICONS[type];
            const typeRewards = getRewardsByType(type);
            const unlockedInType = typeRewards.filter(r => isRewardUnlocked(r.id)).length;
            
            return (
              <TabsTrigger key={type} value={type} className="flex items-center gap-1">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{TYPE_LABELS[type][language === 'es' ? 'es' : 'en']}</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {unlockedInType}/{typeRewards.length}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(['theme', 'badge', 'title', 'feature'] as const).map(type => (
          <TabsContent key={type} value={type}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getRewardsByType(type).map(renderRewardCard)}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Purchase confirmation dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedReward?.icon}</span>
              {t('rewards.redeemQuestion')}
            </DialogTitle>
            <DialogDescription>
              {selectedReward && (
                <div className="space-y-3 mt-2">
                  <p className="font-medium">
                    {language === 'es' ? selectedReward.name_es : selectedReward.name_en}
                  </p>
                  <p className="text-sm">
                    {language === 'es' ? selectedReward.description_es : selectedReward.description_en}
                  </p>
                  
                  {selectedReward.type === 'theme' && selectedReward.preview && (
                    <div 
                      className="h-12 rounded-md" 
                      style={{ background: selectedReward.preview }}
                    />
                  )}
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>{t('rewards.cost')}:</span>
                    <div className="flex items-center gap-1 font-bold">
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                      {selectedReward.xp_cost} XP
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>{t('rewards.yourBalance')}:</span>
                    <span className="font-bold">{userXP} XP</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>{t('rewards.after')}:</span>
                    <span className="font-bold text-green-600">
                      {userXP - selectedReward.xp_cost} XP
                    </span>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              {t('rewards.cancel')}
            </Button>
            <Button onClick={handlePurchase}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              {t('rewards.redeem')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
