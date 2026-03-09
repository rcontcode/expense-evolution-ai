import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { REWARDS_CONFIG } from '@/hooks/data/useBetaGamification';
import { adminTranslations } from '../adminTranslations';

interface Redemption {
  id: string;
  user_id: string;
  reward_type: string;
  points_spent: number;
  tier_at_redemption: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface Props {
  allRedemptions: Redemption[] | undefined;
  redemptionProfiles: Record<string, { name: string; email: string }> | undefined;
  language: 'es' | 'en';
}

export const AdminRewardsTab = ({ allRedemptions, redemptionProfiles, language }: Props) => {
  const text = adminTranslations[language];
  const [rewardActionLoading, setRewardActionLoading] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleApproveReward = async (redemptionId: string) => {
    setRewardActionLoading(redemptionId);
    try {
      const { error } = await supabase.rpc('apply_beta_reward', { p_redemption_id: redemptionId });
      if (error) throw error;
      toast.success(text.applied);
      queryClient.invalidateQueries({ queryKey: ['admin-beta-redemptions'] });
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setRewardActionLoading(null);
    }
  };

  const handleRejectReward = async (redemptionId: string) => {
    setRewardActionLoading(redemptionId);
    try {
      const { error } = await supabase
        .from('beta_reward_redemptions')
        .update({ status: 'rejected', admin_notes: 'Rechazado por admin' })
        .eq('id', redemptionId);
      if (error) throw error;
      toast.success(text.rejected);
      queryClient.invalidateQueries({ queryKey: ['admin-beta-redemptions'] });
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setRewardActionLoading(null);
    }
  };

  return (
    <Card className="border-2 border-yellow-100 dark:border-yellow-900/50 shadow-xl">
      <CardHeader className="border-b bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
            <Gift className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <CardTitle>{text.rewardRequests}</CardTitle>
            <CardDescription>{text.rewardRequestsDesc}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {allRedemptions && allRedemptions.length > 0 ? (
          <div className="space-y-4">
            {allRedemptions.map((redemption) => {
              const profile = redemptionProfiles?.[redemption.user_id];
              const rewardConfig = REWARDS_CONFIG[redemption.reward_type as keyof typeof REWARDS_CONFIG];
              const isPending = redemption.status === 'pending';

              return (
                <motion.div key={redemption.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 border-2 rounded-xl space-y-3 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{profile?.name || redemption.user_id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    </div>
                    <Badge variant={redemption.status === 'rejected' ? 'destructive' : redemption.status === 'pending' ? 'secondary' : 'default'}>
                      {text[redemption.status as 'pending' | 'approved' | 'applied' | 'rejected'] || redemption.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <span className="text-2xl">{rewardConfig?.labelEs?.split(' ')[0] || '🎁'}</span>
                    <div>
                      <p className="font-medium">{rewardConfig?.[language === 'es' ? 'labelEs' : 'labelEn'] || redemption.reward_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {redemption.points_spent} pts • Tier: {redemption.tier_at_redemption} • {format(new Date(redemption.created_at), 'PPP', { locale: language === 'es' ? esLocale : undefined })}
                      </p>
                    </div>
                  </div>
                  {isPending && (
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApproveReward(redemption.id)} disabled={rewardActionLoading === redemption.id}>
                        <CheckCircle className="h-4 w-4" /> {text.approveApply}
                      </Button>
                      <Button size="sm" variant="destructive" className="flex-1 gap-1" onClick={() => handleRejectReward(redemption.id)} disabled={rewardActionLoading === redemption.id}>
                        <XCircle className="h-4 w-4" /> {text.reject}
                      </Button>
                    </div>
                  )}
                  {redemption.admin_notes && <p className="text-xs text-muted-foreground italic">📝 {redemption.admin_notes}</p>}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Gift className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{text.noRewards}</p>
            <p className="text-sm text-muted-foreground/70">{text.noRewardsHint}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
