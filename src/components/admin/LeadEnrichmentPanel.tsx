import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, Target, AlertTriangle, Lightbulb, 
  TrendingUp, Shield, MessageSquare, Star
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { QuizLead } from '@/hooks/admin/useLeadsManagement';
import { 
  calculateConversionProbability, 
  calculateLeadAging,
  getAgingColors,
  type ConversionProbability 
} from '@/hooks/admin/useLeadIntelligence';

const failedQuestionLabels: Record<number, { label: string; area: string }> = {
  1: { label: 'Presupuesto mensual', area: 'Planificación' },
  2: { label: 'Fondo de emergencia', area: 'Ahorro' },
  3: { label: 'Revisión de gastos', area: 'Gastos' },
  4: { label: 'Deudas de alto interés', area: 'Deudas' },
  5: { label: 'Inversión para retiro', area: 'Inversión' },
  6: { label: 'Metas financieras claras', area: 'Planificación' },
  7: { label: 'Seguro de vida/salud', area: 'Protección' },
  8: { label: 'Educación financiera', area: 'Educación' },
  9: { label: 'Diversificación de ingresos', area: 'Ingresos' },
  10: { label: 'Plan de sucesión', area: 'Planificación' },
};

interface Props {
  lead: QuizLead;
  allLeads: QuizLead[];
}

export function LeadEnrichmentPanel({ lead, allLeads }: Props) {
  const conversion = useMemo(() => calculateConversionProbability(lead, allLeads), [lead, allLeads]);
  const aging = useMemo(() => calculateLeadAging(lead), [lead]);
  const agingColors = getAgingColors(aging.agingLevel);

  // Group failed questions by area
  const weaknessAreas = useMemo(() => {
    if (!lead.failed_questions || lead.failed_questions.length === 0) return [];
    const areas: Record<string, string[]> = {};
    lead.failed_questions.forEach(q => {
      const info = failedQuestionLabels[q];
      if (info) {
        if (!areas[info.area]) areas[info.area] = [];
        areas[info.area].push(info.label);
      }
    });
    return Object.entries(areas).sort((a, b) => b[1].length - a[1].length);
  }, [lead.failed_questions]);

  const probabilityColor = conversion.probability >= 60 
    ? 'text-emerald-600' 
    : conversion.probability >= 35 
      ? 'text-amber-600' 
      : 'text-red-600';

  return (
    <div className="space-y-4">
      {/* Aging Alert */}
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${agingColors.border} ${agingColors.bg}`}>
        <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${agingColors.text}`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${agingColors.text}`}>{aging.urgencyMessage}</p>
          {aging.decayPenalty > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Score ajustado: {aging.adjustedScore} (original - {aging.decayPenalty} por inactividad)
            </p>
          )}
        </div>
      </div>

      {/* Conversion Probability */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Probabilidad de Conversión
            <Badge variant="outline" className="text-[10px] ml-auto">
              Confianza: {conversion.confidence}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <span className={`text-3xl font-black ${probabilityColor}`}>{conversion.probability}%</span>
            <div className="flex-1">
              <Progress value={conversion.probability} className="h-2" />
            </div>
          </div>

          {/* Factors */}
          <div className="space-y-1">
            {conversion.factors.map((factor, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  factor.impact === 'positive' ? 'bg-emerald-500' : factor.impact === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                }`} />
                <span className="text-muted-foreground flex-1">{factor.label}</span>
                <span className={`font-mono font-bold ${factor.weight > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {factor.weight > 0 ? '+' : ''}{factor.weight}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Plan */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">Plan Recomendado</span>
          </div>
          <Badge className={`text-sm px-3 py-1 ${
            conversion.recommendedPlan === 'Pro' 
              ? 'bg-violet-600 text-white' 
              : 'bg-amber-500 text-white'
          }`}>
            {conversion.recommendedPlan}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            Basado en situación ({lead.situation}), meta ({lead.goal}) y quiz score ({lead.quiz_score}%)
          </p>
        </CardContent>
      </Card>

      {/* Quiz Weakness Visualization */}
      {weaknessAreas.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-500" />
              Mapa de Debilidades ({lead.failed_questions?.length || 0} áreas)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {weaknessAreas.map(([area, questions], i) => (
              <motion.div
                key={area}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px]">{area}</Badge>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                      style={{ width: `${(questions.length / 3) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{questions.length}</span>
                </div>
                <div className="flex flex-wrap gap-1 ml-2">
                  {questions.map(q => (
                    <span key={q} className="text-[10px] text-muted-foreground">• {q}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Fokuspark Quiz Answers */}
      {lead.metadata && Array.isArray((lead.metadata as Record<string, unknown>).quiz_answers) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              Respuestas del Quiz ({((lead.metadata as Record<string, unknown>).quiz_answers as Array<{ question: string; answer_value: number; answer_label: string }>).length} preguntas)
              <Badge variant="outline" className="text-[10px] ml-auto">Fokuspark</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {((lead.metadata as Record<string, unknown>).quiz_answers as Array<{ question: string; answer_value: number; answer_label: string }>).map((qa, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-2 text-xs"
              >
                <span className="text-muted-foreground flex-1 truncate" title={qa.question}>
                  {i + 1}. {qa.question.length > 60 ? qa.question.substring(0, 57) + '...' : qa.question}
                </span>
                <Badge variant={qa.answer_value >= 8 ? 'default' : qa.answer_value >= 5 ? 'secondary' : 'destructive'} className="text-[10px] shrink-0">
                  {qa.answer_label} ({qa.answer_value})
                </Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Auto-generated Talking Points */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Puntos de Conversación (Auto-generados)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {conversion.talkingPoints.map((point, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2 text-xs"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-muted-foreground leading-relaxed">{point}</span>
              </motion.li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
