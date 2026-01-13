import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBetaGamification, TIER_CONFIG } from '@/hooks/data/useBetaGamification';

export const ProgressChart = () => {
  const { language } = useLanguage();
  const { userPoints, goalsWithProgress } = useBetaGamification();

  if (!userPoints) return null;

  const totalPoints = userPoints.total_points;
  const maxPoints = 2000; // Pro 1 Year reward
  const percentage = Math.min((totalPoints / maxPoints) * 100, 100);

  // Calculate stats
  const feedbackPercent = (userPoints.feedback_points / totalPoints) * 100 || 0;
  const bugsPercent = (userPoints.bug_report_points / totalPoints) * 100 || 0;
  const referralsPercent = (userPoints.referral_points / totalPoints) * 100 || 0;
  const usagePercent = (userPoints.feature_usage_points / totalPoints) * 100 || 0;

  const categories = [
    { key: 'feedback', color: '#8b5cf6', percent: feedbackPercent, label: language === 'es' ? 'Feedback' : 'Feedback' },
    { key: 'bugs', color: '#f43f5e', percent: bugsPercent, label: language === 'es' ? 'Bugs' : 'Bugs' },
    { key: 'referrals', color: '#10b981', percent: referralsPercent, label: language === 'es' ? 'Referidos' : 'Referrals' },
    { key: 'usage', color: '#3b82f6', percent: usagePercent, label: language === 'es' ? 'Uso' : 'Usage' },
  ];

  // Milestones
  const milestones = [
    { points: 500, label: 'Silver', icon: '🥈' },
    { points: 1000, label: 'Gold', icon: '🥇' },
    { points: 1500, label: 'Platinum', icon: '💎' },
    { points: 2000, label: 'Diamond', icon: '👑' },
  ];

  return (
    <div className="space-y-6">
      {/* Main Progress Ring */}
      <div className="relative flex items-center justify-center">
        <svg className="w-48 h-48 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="96"
            cy="96"
            r="80"
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-muted/20"
          />
          {/* Progress circle */}
          <motion.circle
            cx="96"
            cy="96"
            r="80"
            stroke="url(#progressGradient)"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDasharray: '0 502' }}
            animate={{ strokeDasharray: `${(percentage / 100) * 502} 502` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
          {/* Animated glow */}
          <motion.circle
            cx="96"
            cy="96"
            r="80"
            stroke="url(#progressGradient)"
            strokeWidth="16"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDasharray: '0 502', opacity: 0 }}
            animate={{ 
              strokeDasharray: `${(percentage / 100) * 502} 502`,
              opacity: [0, 0.3, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="blur-sm"
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="text-4xl"
          >
            {TIER_CONFIG[userPoints.tier].icon}
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-3xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
          >
            {totalPoints}
          </motion.p>
          <p className="text-xs text-muted-foreground">
            {language === 'es' ? 'puntos totales' : 'total points'}
          </p>
        </div>
      </div>

      {/* Category breakdown bars */}
      <div className="space-y-3">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{cat.label}</span>
              <span className="font-semibold">{Math.round(cat.percent)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: cat.color }}
                initial={{ width: 0 }}
                animate={{ width: `${cat.percent}%` }}
                transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Milestones timeline - Fixed layout */}
      <div className="relative pt-6 pb-2">
        {/* Background track */}
        <div className="absolute left-[5%] right-[5%] h-1.5 bg-muted top-2 rounded-full" />
        
        {/* Progress track */}
        <motion.div
          className="absolute left-[5%] h-1.5 bg-gradient-to-r from-primary to-accent top-2 rounded-full"
          style={{ maxWidth: '90%' }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage * 0.9, 90)}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        
        {/* Milestone markers */}
        <div className="relative flex justify-between px-[5%]">
          {milestones.map((milestone, i) => {
            const isReached = totalPoints >= milestone.points;
            
            return (
              <motion.div
                key={milestone.points}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 + i * 0.15, type: 'spring' }}
                className="flex flex-col items-center"
              >
                <motion.div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-md border-2 ${
                    isReached 
                      ? 'bg-gradient-to-br from-primary to-accent border-primary/30' 
                      : 'bg-muted border-muted-foreground/20'
                  }`}
                  animate={isReached ? { 
                    scale: [1, 1.1, 1],
                  } : {}}
                  transition={{ duration: 2, repeat: isReached ? Infinity : 0 }}
                >
                  {milestone.icon}
                </motion.div>
                <p className={`text-[10px] mt-1 ${isReached ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                  {milestone.points}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};