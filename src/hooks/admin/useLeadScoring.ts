import type { QuizLead } from './useLeadsManagement';

export type LeadPriority = 'hot' | 'warm' | 'cool' | 'cold';

export interface LeadWithScore extends QuizLead {
  calculatedScore: number;
  calculatedPriority: LeadPriority;
}

// Critical obstacles that indicate high need
const CRITICAL_OBSTACLES = [
  'No sé por dónde empezar',
  'Gastos descontrolados',
  'Falta de conocimiento',
  'Deudas abrumadoras',
];

// Ambitious goals that indicate high potential
const AMBITIOUS_GOALS = [
  'Jubilación anticipada (FIRE)',
  'Crecer patrimonio',
  'Independencia financiera',
  'Libertad financiera',
];

// High engagement time values
const HIGH_ENGAGEMENT_TIME = ['1 - 3 horas', 'Más de 3 horas', '1-3 horas', 'Más de 3 horas semanales'];

// Business owner situations
const BUSINESS_OWNER_SITUATIONS = ['Dueño de negocio', 'Empresario', 'Emprendedor'];

/**
 * Calculate lead score based on multiple factors
 * Higher score = Higher priority = More likely to convert
 */
export function calculateLeadScore(lead: QuizLead): number {
  let score = 0;

  // 1. Quiz score bajo = más necesidad de ayuda (max +30)
  if (lead.quiz_score <= 25) {
    score += 30;
  } else if (lead.quiz_score <= 40) {
    score += 25;
  } else if (lead.quiz_score <= 50) {
    score += 20;
  } else if (lead.quiz_score <= 60) {
    score += 10;
  }

  // 2. Comentario personal = interés alto (max +25)
  if (lead.comments && lead.comments.trim().length > 0) {
    score += 25;
    // Bonus for longer comments (more engaged)
    if (lead.comments.length > 50) {
      score += 5;
    }
  }

  // 3. Nivel principiante = urgencia de solución (max +15)
  const level = lead.quiz_level?.toLowerCase();
  if (level === 'principiante') {
    score += 15;
  } else if (level === 'emergente') {
    score += 10;
  } else if (level === 'evolucionando') {
    score += 5;
  }

  // 4. Obstáculos críticos (max +10)
  if (lead.obstacle && CRITICAL_OBSTACLES.some(obs => 
    lead.obstacle.toLowerCase().includes(obs.toLowerCase())
  )) {
    score += 10;
  }

  // 5. Metas ambiciosas (max +10)
  if (lead.goal && AMBITIOUS_GOALS.some(goal => 
    lead.goal.toLowerCase().includes(goal.toLowerCase())
  )) {
    score += 10;
  }

  // 6. Dueño de negocio = mayor poder adquisitivo (max +5)
  if (lead.situation && BUSINESS_OWNER_SITUATIONS.some(sit => 
    lead.situation.toLowerCase().includes(sit.toLowerCase())
  )) {
    score += 5;
  }

  // 7. Tiene teléfono = más fácil de contactar (max +5)
  if (lead.phone && lead.phone.trim().length > 0) {
    score += 5;
  }

  // 8. Tiempo invertido alto = compromiso (max +5)
  if (lead.time_spent && HIGH_ENGAGEMENT_TIME.some(time => 
    lead.time_spent?.toLowerCase().includes(time.toLowerCase())
  )) {
    score += 5;
  }

  // 9. Muchas preguntas fallidas = más oportunidad de venta (max +5)
  if (lead.failed_questions && lead.failed_questions.length >= 5) {
    score += 5;
  }

  return Math.min(100, score);
}

/**
 * Get priority classification based on score
 */
export function getLeadPriority(score: number): LeadPriority {
  if (score >= 80) return 'hot';
  if (score >= 50) return 'warm';
  if (score >= 25) return 'cool';
  return 'cold';
}

/**
 * Get priority label in Spanish
 */
export function getPriorityLabel(priority: LeadPriority): string {
  switch (priority) {
    case 'hot': return 'PRIORIDAD';
    case 'warm': return 'INTERESADO';
    case 'cool': return 'POTENCIAL';
    case 'cold': return 'NUEVO';
  }
}

/**
 * Get priority color classes for styling
 */
export function getPriorityColors(priority: LeadPriority): {
  badge: string;
  row: string;
  border: string;
  text: string;
} {
  switch (priority) {
    case 'hot':
      return {
        badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300',
        row: 'bg-red-50/50 dark:bg-red-900/10',
        border: 'border-l-4 border-l-red-500',
        text: 'text-red-600 dark:text-red-400',
      };
    case 'warm':
      return {
        badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300',
        row: 'bg-orange-50/50 dark:bg-orange-900/10',
        border: 'border-l-4 border-l-orange-500',
        text: 'text-orange-600 dark:text-orange-400',
      };
    case 'cool':
      return {
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300',
        row: 'bg-blue-50/30 dark:bg-blue-900/5',
        border: 'border-l-4 border-l-blue-400',
        text: 'text-blue-600 dark:text-blue-400',
      };
    case 'cold':
      return {
        badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        row: '',
        border: 'border-l-4 border-l-transparent',
        text: 'text-gray-500 dark:text-gray-400',
      };
  }
}

/**
 * Add calculated score and priority to leads
 */
export function enrichLeadsWithScoring(leads: QuizLead[]): LeadWithScore[] {
  return leads.map(lead => {
    const calculatedScore = calculateLeadScore(lead);
    const calculatedPriority = getLeadPriority(calculatedScore);
    return {
      ...lead,
      calculatedScore,
      calculatedPriority,
    };
  });
}

/**
 * Sort leads by priority (hot first) then by score
 */
export function sortLeadsByPriority(leads: LeadWithScore[]): LeadWithScore[] {
  return [...leads].sort((a, b) => b.calculatedScore - a.calculatedScore);
}
