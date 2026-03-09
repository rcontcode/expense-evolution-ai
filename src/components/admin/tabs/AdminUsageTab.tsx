import { motion } from 'framer-motion';
import { Activity, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { adminTranslations } from '../adminTranslations';

interface FeatureUsageItem {
  feature_name: string;
}

interface Props {
  featureUsage: FeatureUsageItem[] | undefined;
  language: 'es' | 'en';
}

export const AdminUsageTab = ({ featureUsage, language }: Props) => {
  const text = adminTranslations[language];

  const featureCounts = (featureUsage || []).reduce((acc, log) => {
    acc[log.feature_name] = (acc[log.feature_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxCount = Math.max(...Object.values(featureCounts), 1);
  const sortedFeatures = Object.entries(featureCounts).sort(([, a], [, b]) => b - a);

  return (
    <Card className="border-2 border-emerald-100 dark:border-emerald-900/50 shadow-xl">
      <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <CardTitle>{text.featureUsage}</CardTitle>
            <CardDescription>{text.featureUsageDesc}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {sortedFeatures.length > 0 ? (
            sortedFeatures.map(([feature, count], index) => (
              <motion.div key={feature} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {index === 0 && <span className="text-lg">🥇</span>}
                    {index === 1 && <span className="text-lg">🥈</span>}
                    {index === 2 && <span className="text-lg">🥉</span>}
                    <span className="font-medium">{feature}</span>
                  </div>
                  <Badge variant="secondary" className="font-bold">{count} {text.uses}</Badge>
                </div>
                <Progress value={(count / maxCount) * 100} className="h-3" />
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">{text.noUsage}</p>
              <p className="text-sm text-muted-foreground/70">{text.noUsageHint}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
