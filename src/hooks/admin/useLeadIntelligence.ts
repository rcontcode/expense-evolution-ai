import { useMemo } from 'react';
import { differenceInDays, differenceInHours, startOfWeek, format, subWeeks } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import type { QuizLead } from './useLeadsManagement';
import { calculateLeadScore, getLeadPriority, type LeadPriority } from './useLeadScoring';

// ── Lead Aging & Decay ──────────────────────────────────────────

export type AgingLevel = 'fresh' | 'aging' | 'stale' | 'critical';

export interface LeadAging {
  daysSinceCreation: number;
  daysSinceContact: number | null;
  agingLevel: AgingLevel;
  decayPenalty: number;
  adjustedScore: number;
  urgencyMessage: string;
}

export function calculateLeadAging(lead: QuizLead): LeadAging {
  const now = new Date();
  const daysSinceCreation = differenceInDays(now, new Date(lead.created_at));
  const daysSinceContact = lead.contacted_at 
    ? differenceInDays(now, new Date(lead.contacted_at)) 
    : null;

  // Decay: after 3 days without contact, lose 2 points/day (max -30)
  const relevantDays = daysSinceContact ?? daysSinceCreation;
  const decayDays = Math.max(0, relevantDays - 3);
  const decayPenalty = Math.min(30, decayDays * 2);
  
  const baseScore = calculateLeadScore(lead);
  const adjustedScore = Math.max(0, baseScore - decayPenalty);

  let agingLevel: AgingLevel;
  let urgencyMessage: string;

  if (relevantDays <= 1) {
    agingLevel = 'fresh';
    urgencyMessage = '🟢 Fresco — contactar hoy';
  } else if (relevantDays <= 3) {
    agingLevel = 'aging';
    urgencyMessage = `🟡 ${relevantDays}d sin atención`;
  } else if (relevantDays <= 7) {
    agingLevel = 'stale';
    urgencyMessage = `🟠 ${relevantDays}d — perdiendo interés (-${decayPenalty}pts)`;
  } else {
    agingLevel = 'critical';
    urgencyMessage = `🔴 ${relevantDays}d — riesgo de pérdida (-${decayPenalty}pts)`;
  }

  return { daysSinceCreation, daysSinceContact, agingLevel, decayPenalty, adjustedScore, urgencyMessage };
}

export function getAgingColors(level: AgingLevel) {
  switch (level) {
    case 'fresh': return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-300' };
    case 'aging': return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300' };
    case 'stale': return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-300' };
    case 'critical': return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-300' };
  }
}

// ── Conversion Probability ──────────────────────────────────────

export interface ConversionProbability {
  probability: number;
  confidence: 'low' | 'medium' | 'high';
  factors: { label: string; impact: 'positive' | 'negative' | 'neutral'; weight: number }[];
  recommendedPlan: string;
  talkingPoints: string[];
}

export function calculateConversionProbability(lead: QuizLead, allLeads: QuizLead[]): ConversionProbability {
  const convertedLeads = allLeads.filter(l => l.converted_to_user);
  const nonConvertedLeads = allLeads.filter(l => !l.converted_to_user && l.contacted_at);
  
  const factors: ConversionProbability['factors'] = [];
  let probability = 30; // base

  // Factor 1: Quiz score pattern
  const avgConvertedScore = convertedLeads.length > 0 
    ? convertedLeads.reduce((sum, l) => sum + l.quiz_score, 0) / convertedLeads.length 
    : 50;
  const scoreDiff = Math.abs(lead.quiz_score - avgConvertedScore);
  if (scoreDiff < 15) {
    probability += 15;
    factors.push({ label: 'Quiz score similar a usuarios convertidos', impact: 'positive', weight: 15 });
  } else if (scoreDiff > 30) {
    probability -= 5;
    factors.push({ label: 'Quiz score atípico vs convertidos', impact: 'negative', weight: -5 });
  }

  // Factor 2: Has personal comment (high engagement signal)
  if (lead.comments && lead.comments.trim().length > 0) {
    probability += 20;
    factors.push({ label: 'Dejó comentario personal', impact: 'positive', weight: 20 });
  }

  // Factor 3: Has phone (contactability)
  if (lead.phone) {
    probability += 10;
    factors.push({ label: 'Proporcionó teléfono', impact: 'positive', weight: 10 });
  }

  // Factor 4: Level match — beginners convert more
  if (lead.quiz_level?.toLowerCase() === 'principiante') {
    probability += 12;
    factors.push({ label: 'Nivel principiante (alta necesidad)', impact: 'positive', weight: 12 });
  } else if (lead.quiz_level?.toLowerCase() === 'emergente') {
    probability += 8;
    factors.push({ label: 'Nivel emergente', impact: 'positive', weight: 8 });
  }

  // Factor 5: Obstacle severity
  const criticalObstacles = ['Gastos descontrolados', 'No sé por dónde empezar', 'Deudas abrumadoras'];
  if (lead.obstacle && criticalObstacles.some(o => lead.obstacle.toLowerCase().includes(o.toLowerCase()))) {
    probability += 10;
    factors.push({ label: 'Obstáculo crítico detectado', impact: 'positive', weight: 10 });
  }

  // Factor 5b: Metadata — producto recomendado de alto valor
  const precio = lead.metadata?.precio_producto as number;
  if (precio && precio >= 100) {
    probability += 8;
    factors.push({ label: `Producto recomendado $${precio} (alto valor)`, impact: 'positive', weight: 8 });
  }

  // Factor 5c: Metadata — conocimiento previo bajo
  const conocimiento = (lead.metadata?.conocimiento_previo as string)?.toLowerCase();
  if (conocimiento && (conocimiento.includes('no tengo') || conocimiento.includes('principiante') || conocimiento.includes('poco'))) {
    probability += 6;
    factors.push({ label: 'Conocimiento previo bajo (alta necesidad)', impact: 'positive', weight: 6 });
  }

  // Factor 6: Time since creation (freshness)
  const daysSince = differenceInDays(new Date(), new Date(lead.created_at));
  if (daysSince <= 2) {
    probability += 8;
    factors.push({ label: 'Lead reciente (<48h)', impact: 'positive', weight: 8 });
  } else if (daysSince > 14) {
    probability -= 15;
    factors.push({ label: `Lead antiguo (${daysSince}d)`, impact: 'negative', weight: -15 });
  }

  // Factor 7: Country conversion rates
  const sameCountryConverted = convertedLeads.filter(l => l.country === lead.country).length;
  const sameCountryTotal = allLeads.filter(l => l.country === lead.country).length;
  if (sameCountryTotal >= 3) {
    const countryRate = sameCountryConverted / sameCountryTotal;
    if (countryRate > 0.15) {
      probability += 5;
      factors.push({ label: `País con buena tasa de conversión (${(countryRate * 100).toFixed(0)}%)`, impact: 'positive', weight: 5 });
    }
  }

  probability = Math.max(5, Math.min(95, probability));

  const confidence = allLeads.length > 30 ? 'high' : allLeads.length > 10 ? 'medium' : 'low';

  // Recommended plan based on profile
  let recommendedPlan = 'Premium';
  if (lead.situation && ['Dueño de negocio', 'Empresario', 'Emprendedor'].some(s => lead.situation.includes(s))) {
    recommendedPlan = 'Pro';
  }
  if (lead.goal && ['Jubilación anticipada', 'FIRE'].some(g => lead.goal.includes(g))) {
    recommendedPlan = 'Pro';
  }
  if (lead.quiz_score <= 30) {
    recommendedPlan = 'Premium'; // needs basics first
  }

  // Auto-generated talking points
  const talkingPoints: string[] = [];
  
  if (lead.failed_questions && lead.failed_questions.length > 0) {
    const weaknesses = lead.failed_questions.slice(0, 3);
    talkingPoints.push(`Debilidades del quiz: preguntas ${weaknesses.join(', ')} — abordar estas áreas primero`);
  }
  
  if (lead.obstacle) {
    talkingPoints.push(`Obstáculo principal: "${lead.obstacle}" — mostrar cómo EvoFinz lo resuelve directamente`);
  }
  
  if (lead.goal) {
    talkingPoints.push(`Meta declarada: "${lead.goal}" — conectar features del plan ${recommendedPlan} con esta meta`);
  }

  if (lead.quiz_score <= 40) {
    talkingPoints.push(`Score bajo (${lead.quiz_score}%) — enfatizar que es normal y que la app lo guía paso a paso`);
  }

  if (lead.comments) {
    talkingPoints.push(`Mencionó: "${lead.comments.substring(0, 80)}${lead.comments.length > 80 ? '...' : ''}" — personalizar respuesta`);
  }

  talkingPoints.push(`Plan recomendado: ${recommendedPlan} — destacar ROI específico para su situación`);

  return { probability, confidence, factors, recommendedPlan, talkingPoints };
}

// ── Cohort Analysis ─────────────────────────────────────────────

export interface WeeklyCohort {
  weekLabel: string;
  weekStart: Date;
  totalLeads: number;
  contactedIn24h: number;
  contactedIn48h: number;
  contactedTotal: number;
  converted: number;
  contactRate24h: number;
  conversionRate: number;
  avgScoreAtEntry: number;
}

export function calculateCohortAnalysis(leads: QuizLead[], weeksBack: number = 12): WeeklyCohort[] {
  const now = new Date();
  const cohorts: WeeklyCohort[] = [];

  for (let i = weeksBack - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const weekEnd = startOfWeek(subWeeks(now, i - 1), { weekStartsOn: 1 });

    const weekLeads = leads.filter(l => {
      const d = new Date(l.created_at);
      return d >= weekStart && d < weekEnd;
    });

    if (weekLeads.length === 0) {
      cohorts.push({
        weekLabel: format(weekStart, 'dd MMM', { locale: esLocale }),
        weekStart,
        totalLeads: 0,
        contactedIn24h: 0,
        contactedIn48h: 0,
        contactedTotal: 0,
        converted: 0,
        contactRate24h: 0,
        conversionRate: 0,
        avgScoreAtEntry: 0,
      });
      continue;
    }

    const contactedIn24h = weekLeads.filter(l => {
      if (!l.contacted_at) return false;
      return differenceInHours(new Date(l.contacted_at), new Date(l.created_at)) <= 24;
    }).length;

    const contactedIn48h = weekLeads.filter(l => {
      if (!l.contacted_at) return false;
      return differenceInHours(new Date(l.contacted_at), new Date(l.created_at)) <= 48;
    }).length;

    const contactedTotal = weekLeads.filter(l => l.contacted_at).length;
    const converted = weekLeads.filter(l => l.converted_to_user).length;
    const avgScore = weekLeads.reduce((sum, l) => sum + l.quiz_score, 0) / weekLeads.length;

    cohorts.push({
      weekLabel: format(weekStart, 'dd MMM', { locale: esLocale }),
      weekStart,
      totalLeads: weekLeads.length,
      contactedIn24h,
      contactedIn48h,
      contactedTotal,
      converted,
      contactRate24h: weekLeads.length > 0 ? (contactedIn24h / weekLeads.length) * 100 : 0,
      conversionRate: weekLeads.length > 0 ? (converted / weekLeads.length) * 100 : 0,
      avgScoreAtEntry: Math.round(avgScore),
    });
  }

  return cohorts;
}

// ── Action Suggestions (Full Automation) ────────────────────────

export interface ActionSuggestion {
  type: 'urgent' | 'opportunity' | 'reactivate' | 'celebrate';
  icon: string;
  title: string;
  description: string;
  leadId?: string;
  leadName?: string;
}

export function generateActionSuggestions(leads: QuizLead[]): ActionSuggestion[] {
  const suggestions: ActionSuggestion[] = [];

  // 1. HOT leads not contacted within 24h
  const hotUncontacted = leads.filter(l => {
    if (l.contacted_at || l.converted_to_user) return false;
    const score = calculateLeadScore(l);
    const priority = getLeadPriority(score);
    return priority === 'hot';
  }).sort((a, b) => differenceInDays(new Date(), new Date(b.created_at)) - differenceInDays(new Date(), new Date(a.created_at)));

  hotUncontacted.forEach(lead => {
    const days = differenceInDays(new Date(), new Date(lead.created_at));
    suggestions.push({
      type: 'urgent',
      icon: '🔥',
      title: `¡Contacta a ${lead.name} HOY!`,
      description: `Lead HOT sin contactar hace ${days}d. Score: ${calculateLeadScore(lead)}. ${lead.comments ? 'Dejó comentario personal.' : ''}`,
      leadId: lead.id,
      leadName: lead.name,
    });
  });

  // 2. Contacted but not converted (>7 days ago) — follow-up needed
  const needsFollowUp = leads.filter(l => {
    if (!l.contacted_at || l.converted_to_user) return false;
    const daysSinceContact = differenceInDays(new Date(), new Date(l.contacted_at));
    return daysSinceContact >= 5 && daysSinceContact <= 14;
  });

  if (needsFollowUp.length > 0) {
    suggestions.push({
      type: 'opportunity',
      icon: '📞',
      title: `${needsFollowUp.length} leads necesitan segundo contacto`,
      description: `Contactados hace 5-14 días pero no convertidos. El follow-up aumenta conversión 40%.`,
    });
  }

  // 3. Stale leads with high score — reactivation candidates
  const reactivation = leads.filter(l => {
    if (l.converted_to_user) return false;
    const aging = calculateLeadAging(l);
    const baseScore = calculateLeadScore(l);
    return aging.agingLevel === 'critical' && baseScore >= 50;
  });

  if (reactivation.length > 0) {
    suggestions.push({
      type: 'reactivate',
      icon: '♻️',
      title: `${reactivation.length} leads de alto valor para reactivar`,
      description: `Score alto pero inactivos >7d. Enviar oferta especial o contenido de valor.`,
    });
  }

  // 4. Recent conversions — celebrate
  const recentConversions = leads.filter(l => {
    if (!l.converted_to_user || !l.contacted_at) return false;
    const daysSince = differenceInDays(new Date(), new Date(l.contacted_at));
    return daysSince <= 7;
  });

  if (recentConversions.length > 0) {
    suggestions.push({
      type: 'celebrate',
      icon: '🎉',
      title: `${recentConversions.length} conversiones esta semana`,
      description: `¡Gran trabajo! Analiza qué tácticas usaste para replicar.`,
    });
  }

  return suggestions;
}

// ── Composite Hook ──────────────────────────────────────────────

export function useLeadIntelligence(leads: QuizLead[]) {
  const actionSuggestions = useMemo(() => generateActionSuggestions(leads), [leads]);
  const cohorts = useMemo(() => calculateCohortAnalysis(leads), [leads]);
  
  const decayStats = useMemo(() => {
    const fresh = leads.filter(l => calculateLeadAging(l).agingLevel === 'fresh').length;
    const aging = leads.filter(l => calculateLeadAging(l).agingLevel === 'aging').length;
    const stale = leads.filter(l => calculateLeadAging(l).agingLevel === 'stale').length;
    const critical = leads.filter(l => calculateLeadAging(l).agingLevel === 'critical').length;
    return { fresh, aging, stale, critical };
  }, [leads]);

  return { actionSuggestions, cohorts, decayStats };
}
