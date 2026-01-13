import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle2, Hourglass } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { differenceInDays, differenceInHours, format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';

interface BetaExpirationBadgeProps {
  expiresAt: string | null;
  showDetailed?: boolean;
}

export const BetaExpirationBadge = ({ expiresAt, showDetailed = false }: BetaExpirationBadgeProps) => {
  const { language } = useLanguage();

  const t = {
    es: {
      expires: 'Vence',
      daysLeft: 'días restantes',
      hoursLeft: 'horas restantes',
      expired: 'Vencido',
      neverExpires: 'Sin vencimiento',
      expiresIn: 'Tu acceso beta vence en',
      keepParticipating: '¡Sigue participando para ganarte más tiempo!',
      almostExpired: '¡Tu acceso está por vencer!',
      expiringSoon: 'Quedan pocos días',
    },
    en: {
      expires: 'Expires',
      daysLeft: 'days left',
      hoursLeft: 'hours left',
      expired: 'Expired',
      neverExpires: 'No expiration',
      expiresIn: 'Your beta access expires in',
      keepParticipating: 'Keep participating to earn more time!',
      almostExpired: 'Your access is expiring soon!',
      expiringSoon: 'Few days left',
    },
  };

  const text = t[language];

  if (!expiresAt) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <Clock className="h-3 w-3" />
        {text.neverExpires}
      </Badge>
    );
  }

  const expirationDate = new Date(expiresAt);
  const now = new Date();
  const daysLeft = differenceInDays(expirationDate, now);
  const hoursLeft = differenceInHours(expirationDate, now);
  const isExpired = expirationDate < now;
  const isUrgent = daysLeft <= 7 && !isExpired;
  const isWarning = daysLeft <= 14 && daysLeft > 7;

  if (isExpired) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        {text.expired}
      </Badge>
    );
  }

  const getBadgeStyle = () => {
    if (isUrgent) return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800';
    if (isWarning) return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800';
  };

  const getIcon = () => {
    if (isUrgent) return <AlertTriangle className="h-3 w-3" />;
    if (isWarning) return <Hourglass className="h-3 w-3" />;
    return <CheckCircle2 className="h-3 w-3" />;
  };

  const getTimeDisplay = () => {
    if (daysLeft === 0) {
      return `${hoursLeft} ${text.hoursLeft}`;
    }
    return `${daysLeft} ${text.daysLeft}`;
  };

  if (showDetailed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl border-2 ${
          isUrgent 
            ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20' 
            : isWarning 
              ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className={`p-2 rounded-lg ${
                isUrgent 
                  ? 'bg-red-100 dark:bg-red-900/50' 
                  : isWarning 
                    ? 'bg-amber-100 dark:bg-amber-900/50'
                    : 'bg-emerald-100 dark:bg-emerald-900/50'
              }`}
            >
              {isUrgent ? (
                <AlertTriangle className={`h-5 w-5 ${isUrgent ? 'text-red-600' : 'text-amber-600'}`} />
              ) : (
                <Clock className="h-5 w-5 text-emerald-600" />
              )}
            </motion.div>
            <div>
              <p className={`font-semibold ${
                isUrgent ? 'text-red-700 dark:text-red-400' : isWarning ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
              }`}>
                {isUrgent ? text.almostExpired : text.expiresIn}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(expirationDate, "d 'de' MMMM, yyyy", { locale: language === 'es' ? esLocale : undefined })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <motion.p
              animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
              className={`text-3xl font-black ${
                isUrgent ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {daysLeft === 0 ? hoursLeft : daysLeft}
            </motion.p>
            <p className="text-xs text-muted-foreground">
              {daysLeft === 0 ? text.hoursLeft : text.daysLeft}
            </p>
          </div>
        </div>
        {(isUrgent || isWarning) && (
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
            <span>💡</span> {text.keepParticipating}
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <Badge className={`gap-1 border ${getBadgeStyle()}`}>
      {getIcon()}
      {getTimeDisplay()}
    </Badge>
  );
};
