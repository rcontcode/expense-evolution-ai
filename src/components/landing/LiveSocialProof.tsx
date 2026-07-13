import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Star, Globe, TrendingUp, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface SocialStats {
  userCount: number;
  avgRating: number;
  countriesCount: number;
  weeklySignups: number;
}

const MIN_VISIBLE_USERS = 5;

export const LiveSocialProof = memo(function LiveSocialProof() {
  const { language } = useLanguage();
  const [stats, setStats] = useState<SocialStats | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real stats from database
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Hide component if fewer than MIN_VISIBLE_USERS
        if (!userCount || userCount < MIN_VISIBLE_USERS) {
          setStats(null);
          setIsLoading(false);
          return;
        }

        const { data: statsRow } = await (supabase as any).rpc('get_public_feedback_stats');
        const avgRating = statsRow && statsRow[0] ? Number(statsRow[0].avg_rating) : 0;

        const { data: countries } = await supabase
          .from('profiles')
          .select('country')
          .not('country', 'is', null);

        const uniqueCountries = new Set(countries?.map(c => c.country).filter(Boolean));

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const { count: weeklySignups } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString());

        setStats({
          userCount: userCount || 0,
          avgRating: Number((avgRating || 0).toFixed(1)),
          countriesCount: uniqueCountries.size,
          weeklySignups: weeklySignups || 0
        });
      } catch (error) {
        console.error('Error fetching social proof stats:', error);
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  // Rotate through stats
  useEffect(() => {
    if (!stats) return;
    const rotateInterval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(rotateInterval);
  }, [stats]);

  // Don't render if loading or not enough users
  if (isLoading || !stats) return null;

  const statsConfig = [
    {
      icon: Flame,
      value: stats.weeklySignups,
      label: language === 'es' ? 'se unieron esta semana' : 'joined this week',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      prefix: '',
      show: stats.weeklySignups > 0
    },
    {
      icon: Star,
      value: stats.avgRating,
      label: language === 'es' ? 'calificación promedio' : 'average rating',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      prefix: '',
      suffix: '/5',
      show: stats.avgRating > 0
    },
    {
      icon: Users,
      value: stats.userCount,
      label: language === 'es' ? 'usuarios registrados' : 'registered users',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      prefix: '',
      show: true
    },
    {
      icon: Globe,
      value: stats.countriesCount,
      label: language === 'es' ? 'países' : 'countries',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      prefix: '',
      show: stats.countriesCount > 0
    }
  ].filter(s => s.show);

  if (statsConfig.length === 0) return null;

  const safeIndex = activeIndex % statsConfig.length;
  const currentStat = statsConfig[safeIndex];
  const Icon = currentStat.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
    >
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={safeIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <div className={`p-2.5 rounded-xl ${currentStat.bgColor}`}>
              <Icon className={`h-5 w-5 ${currentStat.color}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${currentStat.color}`}>
                {currentStat.prefix}
                <motion.span
                  key={currentStat.value}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {currentStat.value}
                </motion.span>
                {(currentStat as any).suffix || ''}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {currentStat.label}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center gap-1.5 mt-3">
          {statsConfig.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === safeIndex
                  ? `w-6 ${statsConfig[idx].color.replace('text-', 'bg-')}`
                  : 'w-1.5 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
});
