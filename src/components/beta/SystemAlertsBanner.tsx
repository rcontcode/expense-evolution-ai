import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Wrench, 
  Bug, 
  Zap, 
  Info, 
  X,
  Clock,
  Shield,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBetaSystem } from '@/hooks/data/useBetaSystem';
import { useLanguage } from '@/contexts/LanguageContext';

const alertConfig = {
  maintenance: { icon: Wrench, color: 'from-amber-500 to-orange-500', emoji: '🔧' },
  bug: { icon: Bug, color: 'from-rose-500 to-pink-500', emoji: '🐛' },
  outage: { icon: AlertTriangle, color: 'from-red-600 to-rose-600', emoji: '🚨' },
  update: { icon: Zap, color: 'from-violet-500 to-purple-500', emoji: '✨' },
  info: { icon: Info, color: 'from-blue-500 to-cyan-500', emoji: 'ℹ️' },
};

const severityColors = {
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

export const SystemAlertsBanner = () => {
  const { language } = useLanguage();
  const { activeAlerts } = useBetaSystem();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const t = {
    es: {
      dataIsSafe: '🔒 Tus datos están seguros',
      estimatedResolution: '⏱️ Resolución estimada:',
      affectedFeatures: '📋 Características afectadas:',
      dismiss: 'Entendido',
      severity: {
        low: '🟢 Bajo',
        medium: '🟡 Medio',
        high: '🟠 Alto',
        critical: '🔴 Crítico',
      },
    },
    en: {
      dataIsSafe: '🔒 Your data is safe',
      estimatedResolution: '⏱️ Estimated resolution:',
      affectedFeatures: '📋 Affected features:',
      dismiss: 'Got it',
      severity: {
        low: '🟢 Low',
        medium: '🟡 Medium',
        high: '🟠 High',
        critical: '🔴 Critical',
      },
    },
  };

  const text = t[language];

  const visibleAlerts = (activeAlerts || []).filter(
    alert => !dismissedIds.has(alert.id)
  );

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      <AnimatePresence>
        {visibleAlerts.map((alert) => {
          const config = alertConfig[alert.alert_type];
          const Icon = config.icon;
          const title = language === 'en' && alert.title_en ? alert.title_en : alert.title;
          const message = language === 'en' && alert.message_en ? alert.message_en : alert.message;
          const resolution = language === 'en' && alert.estimated_resolution_en 
            ? alert.estimated_resolution_en 
            : alert.estimated_resolution;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`relative overflow-hidden rounded-xl border-2 shadow-lg`}
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-r ${config.color} opacity-10`} />
              
              <div className="relative p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className={`p-3 rounded-xl bg-gradient-to-br ${config.color} text-white shadow-lg`}
                  >
                    <Icon className="h-6 w-6" />
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl">{config.emoji}</span>
                      <h3 className="font-bold text-lg">{title}</h3>
                      <Badge className={`${severityColors[alert.severity]} border font-medium`}>
                        {text.severity[alert.severity]}
                      </Badge>
                    </div>

                    <p className="text-muted-foreground">{message}</p>

                    {/* Data safety reassurance */}
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-lg w-fit">
                      <Shield className="h-4 w-4" />
                      {text.dataIsSafe}
                    </div>

                    {/* Estimated resolution */}
                    {resolution && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {text.estimatedResolution} <span className="font-medium">{resolution}</span>
                      </div>
                    )}

                    {/* Affected features */}
                    {alert.affected_features && alert.affected_features.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        <span className="text-muted-foreground">{text.affectedFeatures}</span>
                        {alert.affected_features.map((feature, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dismiss button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDismissedIds(prev => new Set([...prev, alert.id]))}
                    className="shrink-0"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    {text.dismiss}
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
