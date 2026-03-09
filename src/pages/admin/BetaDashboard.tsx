import React from 'react';
import { motion } from 'framer-motion';
import { AdminSystemMetrics } from '@/components/admin/AdminSystemMetrics';
import { AdminQuickActions } from '@/components/admin/AdminQuickActions';
import { AdminRecentActivity } from '@/components/admin/AdminRecentActivity';
import { AdminDataHealth } from '@/components/admin/AdminDataHealth';
import { AdminUserOverview } from '@/components/admin/AdminUserOverview';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Star, Bug, Activity, MessageSquare, BarChart3,
  Crown, Sparkles, Heart, Zap, Target, Flame, Gift, Quote,
  TrendingUp, CreditCard, Users2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBetaFeedback } from '@/hooks/data/useBetaFeedback';
import { useBetaCodes } from '@/hooks/data/useBetaCodes';
import { Layout } from '@/components/Layout';
import { PhoenixLogo } from '@/components/ui/phoenix-logo';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { adminTranslations } from '@/components/admin/adminTranslations';

// Tab components
import { AdminTestersTab } from '@/components/admin/tabs/AdminTestersTab';
import { AdminFeedbackTab } from '@/components/admin/tabs/AdminFeedbackTab';
import { AdminBugsTab } from '@/components/admin/tabs/AdminBugsTab';
import { AdminRewardsTab } from '@/components/admin/tabs/AdminRewardsTab';
import { AdminTestimonialsTab } from '@/components/admin/tabs/AdminTestimonialsTab';
import { AdminUsageTab } from '@/components/admin/tabs/AdminUsageTab';
import { AdminSubscriptionsTab } from '@/components/admin/tabs/AdminSubscriptionsTab';
import { AdminLeadsTab } from '@/components/admin/tabs/AdminLeadsTab';

const StatCard = ({ title, value, icon: Icon, trend, gradient, emoji }: {
  title: string; value: string | number; icon: React.ElementType; trend?: string; gradient: string; emoji?: string;
}) => (
  <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} whileHover={{ scale: 1.02, y: -2 }} transition={{ type: 'spring', stiffness: 300 }}>
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardContent className="p-0">
        <div className={`p-6 bg-gradient-to-br ${gradient} text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80 font-medium">{title}</p>
              <div className="flex items-center gap-2 mt-1">
                {emoji && <span className="text-3xl">{emoji}</span>}
                <p className="text-4xl font-black">{value}</p>
              </div>
              {trend && <p className="text-xs text-white/70 mt-2 flex items-center gap-1"><TrendingUp className="h-3 w-3" />{trend}</p>}
            </div>
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm"><Icon className="h-8 w-8 text-white" /></div>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const BetaDashboard = () => {
  const { language } = useLanguage();
  const text = adminTranslations[language];
  const {
    allFeedback, bugReports, featureUsage, userStats,
    feedbackStats, bugStats, updateBugReport, toggleTestimonialPublish, isLoading,
  } = useBetaFeedback();
  const { stats: codeStats } = useBetaCodes();

  const { data: allRedemptions } = useQuery({
    queryKey: ['admin-beta-redemptions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('beta_reward_redemptions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: redemptionProfiles } = useQuery({
    queryKey: ['admin-redemption-profiles', allRedemptions?.map(r => r.user_id)],
    queryFn: async () => {
      if (!allRedemptions || allRedemptions.length === 0) return {};
      const userIds = [...new Set(allRedemptions.map(r => r.user_id))];
      const { data } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds);
      const map: Record<string, { name: string; email: string }> = {};
      for (const p of data || []) {
        map[p.id] = { name: (p as any).full_name || 'Sin nombre', email: (p as any).email || '' };
      }
      return map;
    },
    enabled: !!allRedemptions && allRedemptions.length > 0,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-muted rounded-full" />
              <div className="space-y-2"><div className="h-6 w-64 bg-muted rounded" /><div className="h-4 w-48 bg-muted rounded" /></div>
            </div>
            <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-muted rounded-xl" />)}</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
              <PhoenixLogo variant="sidebar" state="auto" showEffects={true} />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">{text.title}</h1>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 font-bold"><Crown className="h-3 w-3 mr-1" /> {text.admin}</Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-500" />{text.subtitle}</p>
            </div>
          </div>
          <Badge variant="outline" className="px-3 py-1.5 text-sm"><Activity className="h-4 w-4 mr-1 text-emerald-500" />{text.systemActive}</Badge>
        </motion.div>

        <AdminSystemMetrics />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AdminQuickActions />
          <AdminRecentActivity />
          <div className="space-y-4"><AdminDataHealth /><AdminUserOverview /></div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title={text.betaTesters} value={userStats?.length || 0} icon={Users} trend={`${codeStats.activeCodes} ${text.activeCodes}`} gradient="from-violet-500 via-purple-500 to-indigo-600" emoji="👥" />
          <StatCard title={text.avgRating} value={feedbackStats.avgRating} icon={Star} trend={`${feedbackStats.totalFeedback} ${text.evaluations}`} gradient="from-amber-500 via-orange-500 to-yellow-500" />
          <StatCard title={text.bugsReported} value={bugStats.total} icon={Bug} trend={`${bugStats.new} ${text.newBugs}, ${bugStats.resolved} ${text.resolved}`} gradient="from-rose-500 via-pink-500 to-red-500" />
          <StatCard title={text.featuresUsed} value={featureUsage?.length || 0} icon={Activity} trend={text.featuresExplored} gradient="from-emerald-500 via-teal-500 to-cyan-500" />
        </div>

        {/* Health Indicators */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50"><Heart className="h-5 w-5 text-emerald-600" /></div>
              <div><p className="text-xs text-muted-foreground">{text.wouldRecommend}</p><p className="text-2xl font-black text-emerald-600">{feedbackStats.wouldRecommend}%</p></div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50"><Zap className="h-5 w-5 text-blue-600" /></div>
              <div><p className="text-xs text-muted-foreground">{text.easeOfUse}</p><p className="text-2xl font-black text-blue-600">{feedbackStats.avgEaseOfUse}/5</p></div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50"><Target className="h-5 w-5 text-amber-600" /></div>
              <div><p className="text-xs text-muted-foreground">{text.usefulness}</p><p className="text-2xl font-black text-amber-600">{feedbackStats.avgUsefulness}/5</p></div>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50"><Flame className="h-5 w-5 text-purple-600" /></div>
              <div><p className="text-xs text-muted-foreground">{text.design}</p><p className="text-2xl font-black text-purple-600">{feedbackStats.avgRating}/5</p></div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 p-1 bg-muted/50 rounded-xl h-14">
              <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg font-semibold">
                <Users className="h-4 w-4" />{text.testersTab}
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg font-semibold">
                <MessageSquare className="h-4 w-4" />{text.feedbackTab}
              </TabsTrigger>
              <TabsTrigger value="bugs" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg font-semibold">
                <Bug className="h-4 w-4" />{text.bugsTab}
              </TabsTrigger>
              <TabsTrigger value="rewards" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-amber-600 data-[state=active]:text-white rounded-lg font-semibold">
                <Gift className="h-4 w-4" />{text.rewardsTab}
              </TabsTrigger>
              <TabsTrigger value="testimonials" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg font-semibold">
                <Quote className="h-4 w-4" />{text.testimonialsTab}
              </TabsTrigger>
              <TabsTrigger value="usage" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-lg font-semibold">
                <BarChart3 className="h-4 w-4" />{text.usageTab}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <AdminTestersTab userStats={userStats} language={language} />
            </TabsContent>
            <TabsContent value="feedback">
              <AdminFeedbackTab allFeedback={allFeedback as any} language={language} />
            </TabsContent>
            <TabsContent value="bugs">
              <AdminBugsTab bugReports={bugReports as any} bugStats={bugStats as any} updateBugReport={updateBugReport} language={language} />
            </TabsContent>
            <TabsContent value="rewards">
              <AdminRewardsTab allRedemptions={allRedemptions} redemptionProfiles={redemptionProfiles} language={language} />
            </TabsContent>
            <TabsContent value="testimonials">
              <AdminTestimonialsTab allFeedback={allFeedback as any} toggleTestimonialPublish={toggleTestimonialPublish} language={language} />
            </TabsContent>
            <TabsContent value="usage">
              <AdminUsageTab featureUsage={featureUsage as any} language={language} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
};

export default BetaDashboard;
