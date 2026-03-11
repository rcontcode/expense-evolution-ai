import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { 
  Brain, Flame, Clock, TrendingUp, AlertTriangle, PartyPopper,
  PhoneCall, RotateCcw, Zap, Timer, Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { QuizLead } from '@/hooks/admin/useLeadsManagement';
import { 
  useLeadIntelligence, 
  type ActionSuggestion 
} from '@/hooks/admin/useLeadIntelligence';

interface Props {
  leads: QuizLead[];
  onLeadClick?: (leadId: string) => void;
}

const suggestionIcons: Record<ActionSuggestion['type'], typeof Flame> = {
  urgent: AlertTriangle,
  opportunity: PhoneCall,
  reactivate: RotateCcw,
  celebrate: PartyPopper,
};

const suggestionColors: Record<ActionSuggestion['type'], string> = {
  urgent: 'border-red-300 bg-red-50/50 dark:bg-red-900/10',
  opportunity: 'border-amber-300 bg-amber-50/50 dark:bg-amber-900/10',
  reactivate: 'border-blue-300 bg-blue-50/50 dark:bg-blue-900/10',
  celebrate: 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-900/10',
};

export function CRMIntelligenceDashboard({ leads, onLeadClick }: Props) {
  const { actionSuggestions, cohorts, decayStats } = useLeadIntelligence(leads);

  const cohortChartData = useMemo(() => 
    cohorts.filter(c => c.totalLeads > 0).map(c => ({
      week: c.weekLabel,
      leads: c.totalLeads,
      contactados24h: c.contactedIn24h,
      convertidos: c.converted,
      rateContact: Math.round(c.contactRate24h),
      rateConversion: Math.round(c.conversionRate),
    })),
  [cohorts]);

  const totalDecay = decayStats.fresh + decayStats.aging + decayStats.stale + decayStats.critical;

  return (
    <div className="space-y-4">
      {/* Action Suggestions — Full Automation */}
      {actionSuggestions.length > 0 && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Acciones Recomendadas por IA
            </CardTitle>
            <CardDescription>Sugerencias automáticas basadas en el estado de tus leads</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {actionSuggestions.map((suggestion, i) => {
              const Icon = suggestionIcons[suggestion.type];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${suggestionColors[suggestion.type]} cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => suggestion.leadId && onLeadClick?.(suggestion.leadId)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{suggestion.icon} {suggestion.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
                  </div>
                  {suggestion.leadId && (
                    <Button size="sm" variant="ghost" className="flex-shrink-0 text-xs">
                      Ver lead →
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Lead Health / Decay Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Frescos (<24h)', value: decayStats.fresh, color: 'text-emerald-600', icon: Zap, pct: totalDecay > 0 ? (decayStats.fresh / totalDecay) * 100 : 0, barColor: 'bg-emerald-500' },
          { label: 'Envejeciendo (1-3d)', value: decayStats.aging, color: 'text-amber-600', icon: Timer, pct: totalDecay > 0 ? (decayStats.aging / totalDecay) * 100 : 0, barColor: 'bg-amber-500' },
          { label: 'Estancados (3-7d)', value: decayStats.stale, color: 'text-orange-600', icon: Clock, pct: totalDecay > 0 ? (decayStats.stale / totalDecay) * 100 : 0, barColor: 'bg-orange-500' },
          { label: 'Críticos (>7d)', value: decayStats.critical, color: 'text-red-600', icon: AlertTriangle, pct: totalDecay > 0 ? (decayStats.critical / totalDecay) * 100 : 0, barColor: 'bg-red-500' },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-xs text-muted-foreground">{Math.round(item.pct)}%</span>
                </div>
                <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
                <Progress value={item.pct} className={`h-1 mt-2`} />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Cohort Analysis */}
      {cohortChartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Cohortes Semanales — Volumen
              </CardTitle>
              <CardDescription className="text-xs">Leads nuevos vs contactados en {'<'}24h vs convertidos</CardDescription>
            </CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cohortChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="leads" name="Leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.3} />
                  <Bar dataKey="contactados24h" name="Contactados <24h" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="convertidos" name="Convertidos" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Cohortes Semanales — Tasas
              </CardTitle>
              <CardDescription className="text-xs">Velocidad de contacto y tasa de conversión por semana</CardDescription>
            </CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={cohortChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Area type="monotone" dataKey="rateContact" name="Contacto <24h" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" dataKey="rateConversion" name="Conversión" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
