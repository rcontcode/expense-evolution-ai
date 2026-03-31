export type ChallengeMentor = 'kiyosaki' | 'rohn' | 'tracy' | 'atomic';
export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface MentorshipChallenge {
  id: string;
  mentor: ChallengeMentor;
  difficulty: ChallengeDifficulty;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  targetCount: number;
  xpReward: number;
  icon: string;
  actionKeyword: string;
  route: string;
  buttonLabelEs: string;
  buttonLabelEn: string;
}

export const MENTORSHIP_CHALLENGES: MentorshipChallenge[] = [
  // === KIYOSAKI ===
  { id: 'k-assets-3', mentor: 'kiyosaki', difficulty: 'beginner', titleEs: 'Identifica 3 activos', titleEn: 'Identify 3 assets', descriptionEs: 'Registra 3 activos en tu patrimonio esta semana', descriptionEn: 'Register 3 assets in your net worth this week', targetCount: 3, xpReward: 50, icon: '💰', actionKeyword: 'register_asset', route: '/net-worth', buttonLabelEs: 'Ir a Patrimonio', buttonLabelEn: 'Go to Net Worth' },
  { id: 'k-debts', mentor: 'kiyosaki', difficulty: 'beginner', titleEs: 'Clasifica tus deudas', titleEn: 'Classify your debts', descriptionEs: 'Revisa y clasifica al menos 2 deudas como buenas o malas', descriptionEn: 'Review and classify at least 2 debts as good or bad', targetCount: 2, xpReward: 40, icon: '📊', actionKeyword: 'classify_debt', route: '/net-worth', buttonLabelEs: 'Ir a Patrimonio', buttonLabelEn: 'Go to Net Worth' },
  { id: 'k-quadrant', mentor: 'kiyosaki', difficulty: 'intermediate', titleEs: 'Analiza tu cuadrante', titleEn: 'Analyze your quadrant', descriptionEs: 'Reflexiona sobre tu posición en el cuadrante del flujo de efectivo', descriptionEn: 'Reflect on your position in the cashflow quadrant', targetCount: 1, xpReward: 60, icon: '🧭', actionKeyword: 'analyze_quadrant', route: '/mentorship?tab=kiyosaki', buttonLabelEs: 'Ir a Activos', buttonLabelEn: 'Go to Assets' },
  { id: 'k-freedom', mentor: 'kiyosaki', difficulty: 'advanced', titleEs: 'Plan de libertad financiera', titleEn: 'Financial freedom plan', descriptionEs: 'Calcula tu índice de libertad financiera y establece un plan', descriptionEn: 'Calculate your financial freedom index and set a plan', targetCount: 1, xpReward: 100, icon: '🏆', actionKeyword: 'freedom_plan', route: '/mentorship?tab=kiyosaki', buttonLabelEs: 'Ir a Activos', buttonLabelEn: 'Go to Assets' },
  { id: 'k-income-5', mentor: 'kiyosaki', difficulty: 'intermediate', titleEs: 'Registra 5 ingresos', titleEn: 'Log 5 income entries', descriptionEs: 'Registra 5 fuentes de ingreso esta semana', descriptionEn: 'Log 5 income sources this week', targetCount: 5, xpReward: 75, icon: '💵', actionKeyword: 'log_income', route: '/income', buttonLabelEs: 'Ir a Ingresos', buttonLabelEn: 'Go to Income' },

  // === ROHN ===
  { id: 'r-journal-5', mentor: 'rohn', difficulty: 'beginner', titleEs: 'Escribe 5 días en tu journal', titleEn: 'Write in your journal 5 days', descriptionEs: 'Reflexiona sobre tus finanzas durante 5 días esta semana', descriptionEn: 'Reflect on your finances for 5 days this week', targetCount: 5, xpReward: 60, icon: '📝', actionKeyword: 'journal_entry', route: '/mentorship?tab=rohn', buttonLabelEs: 'Ir al Journal', buttonLabelEn: 'Go to Journal' },
  { id: 'r-read-30', mentor: 'rohn', difficulty: 'beginner', titleEs: 'Lee 30 minutos diarios', titleEn: 'Read 30 minutes daily', descriptionEs: 'Dedica 30 minutos a educación financiera durante 5 días', descriptionEn: 'Dedicate 30 minutes to financial education for 5 days', targetCount: 5, xpReward: 50, icon: '📖', actionKeyword: 'read_session', route: '/mentorship?tab=rohn', buttonLabelEs: 'Ir a Educación', buttonLabelEn: 'Go to Education' },
  { id: 'r-lesson', mentor: 'rohn', difficulty: 'intermediate', titleEs: 'Registra 3 lecciones aprendidas', titleEn: 'Log 3 lessons learned', descriptionEs: 'Documenta 3 lecciones financieras en tu journal', descriptionEn: 'Document 3 financial lessons in your journal', targetCount: 3, xpReward: 70, icon: '💡', actionKeyword: 'log_lesson', route: '/mentorship?tab=rohn', buttonLabelEs: 'Ir al Journal', buttonLabelEn: 'Go to Journal' },
  { id: 'r-book', mentor: 'rohn', difficulty: 'intermediate', titleEs: 'Completa un recurso educativo', titleEn: 'Complete an educational resource', descriptionEs: 'Termina de leer un libro o curso financiero', descriptionEn: 'Finish reading a financial book or course', targetCount: 1, xpReward: 100, icon: '🎓', actionKeyword: 'complete_resource', route: '/mentorship?tab=rohn', buttonLabelEs: 'Ir a Biblioteca', buttonLabelEn: 'Go to Library' },
  { id: 'r-payfirst', mentor: 'rohn', difficulty: 'advanced', titleEs: 'Págate primero 7 días', titleEn: 'Pay yourself first 7 days', descriptionEs: 'Aparta dinero para ahorro/inversión cada día de la semana', descriptionEn: 'Set aside money for savings/investment every day', targetCount: 7, xpReward: 120, icon: '🥇', actionKeyword: 'pay_yourself', route: '/mentorship?tab=rohn', buttonLabelEs: 'Págate Primero', buttonLabelEn: 'Pay Yourself First' },

  // === TRACY ===
  { id: 't-smart-1', mentor: 'tracy', difficulty: 'beginner', titleEs: 'Define 1 meta SMART', titleEn: 'Define 1 SMART goal', descriptionEs: 'Crea una meta específica, medible y con plazo', descriptionEn: 'Create a specific, measurable goal with a deadline', targetCount: 1, xpReward: 50, icon: '🎯', actionKeyword: 'create_smart_goal', route: '/budget?tab=savings', buttonLabelEs: 'Ir a Metas', buttonLabelEn: 'Go to Goals' },
  { id: 't-abcde', mentor: 'tracy', difficulty: 'intermediate', titleEs: 'Prioriza con método ABCDE', titleEn: 'Prioritize with ABCDE method', descriptionEs: 'Clasifica 5 tareas financieras por prioridad ABCDE', descriptionEn: 'Classify 5 financial tasks by ABCDE priority', targetCount: 5, xpReward: 60, icon: '📋', actionKeyword: 'prioritize_task', route: '/mentorship?tab=tracy', buttonLabelEs: 'Ir a Metas', buttonLabelEn: 'Go to Goals' },
  { id: 't-review', mentor: 'tracy', difficulty: 'beginner', titleEs: 'Revisa tus metas 3 veces', titleEn: 'Review your goals 3 times', descriptionEs: 'Revisa el progreso de tus metas financieras 3 veces esta semana', descriptionEn: 'Review your financial goals progress 3 times this week', targetCount: 3, xpReward: 40, icon: '🔄', actionKeyword: 'review_goals', route: '/budget?tab=savings', buttonLabelEs: 'Ver Metas', buttonLabelEn: 'View Goals' },
  { id: 't-habits-3', mentor: 'tracy', difficulty: 'intermediate', titleEs: 'Completa 3 hábitos diarios', titleEn: 'Complete 3 daily habits', descriptionEs: 'Cumple con 3 hábitos financieros cada día por 5 días', descriptionEn: 'Complete 3 financial habits every day for 5 days', targetCount: 5, xpReward: 80, icon: '✅', actionKeyword: 'daily_habits', route: '/mentorship?tab=atomic', buttonLabelEs: 'Ir a Hábitos', buttonLabelEn: 'Go to Habits' },
  { id: 't-7steps', mentor: 'tracy', difficulty: 'advanced', titleEs: 'Completa los 7 pasos del éxito', titleEn: 'Complete the 7 steps to success', descriptionEs: 'Completa el wizard de los 7 pasos para el éxito financiero', descriptionEn: 'Complete the 7-step wizard for financial success', targetCount: 1, xpReward: 150, icon: '🏅', actionKeyword: 'complete_7steps', route: '/mentorship?tab=tracy', buttonLabelEs: 'Ir a Metas', buttonLabelEn: 'Go to Goals' },

  // === ATOMIC (Micro-Hábitos) ===
  { id: 'a-habit-1', mentor: 'atomic', difficulty: 'beginner', titleEs: 'Crea 1 hábito nuevo', titleEn: 'Create 1 new habit', descriptionEs: 'Define un nuevo hábito financiero atómico', descriptionEn: 'Define a new atomic financial habit', targetCount: 1, xpReward: 40, icon: '⚛️', actionKeyword: 'create_habit', route: '/mentorship?tab=atomic', buttonLabelEs: 'Crear Hábito', buttonLabelEn: 'Create Habit' },
  { id: 'a-streak-5', mentor: 'atomic', difficulty: 'intermediate', titleEs: 'Racha de 5 días', titleEn: '5-day streak', descriptionEs: 'Mantén tu racha de hábitos financieros por 5 días consecutivos', descriptionEn: 'Keep your financial habit streak for 5 consecutive days', targetCount: 5, xpReward: 70, icon: '🔥', actionKeyword: 'habit_streak', route: '/mentorship?tab=atomic', buttonLabelEs: 'Ver Hábitos', buttonLabelEn: 'View Habits' },
  { id: 'a-stack', mentor: 'atomic', difficulty: 'intermediate', titleEs: 'Apila 2 hábitos', titleEn: 'Stack 2 habits', descriptionEs: 'Crea 2 hábitos que se conecten entre sí (habit stacking)', descriptionEn: 'Create 2 habits that connect to each other (habit stacking)', targetCount: 2, xpReward: 60, icon: '🧱', actionKeyword: 'stack_habits', route: '/mentorship?tab=atomic', buttonLabelEs: 'Crear Hábito', buttonLabelEn: 'Create Habit' },
  { id: 'a-1percent', mentor: 'atomic', difficulty: 'advanced', titleEs: 'Mejora 1% cada día por 7 días', titleEn: '1% better every day for 7 days', descriptionEs: 'Registra un micro-hábito financiero cada día de la semana', descriptionEn: 'Log a financial micro-habit every day of the week', targetCount: 7, xpReward: 100, icon: '📈', actionKeyword: 'daily_1percent', route: '/mentorship?tab=atomic', buttonLabelEs: 'Ver Hábitos', buttonLabelEn: 'View Habits' },
  { id: 'a-payfirst', mentor: 'atomic', difficulty: 'beginner', titleEs: 'Registra tu "págate primero"', titleEn: 'Log your "pay yourself first"', descriptionEs: 'Usa la herramienta de Págate Primero al menos 3 veces', descriptionEn: 'Use the Pay Yourself First tool at least 3 times', targetCount: 3, xpReward: 45, icon: '💎', actionKeyword: 'pay_first_log', route: '/mentorship?tab=rohn', buttonLabelEs: 'Págate Primero', buttonLabelEn: 'Pay Yourself First' },
];

export function getWeekKey(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNum}`;
}

export function getChallengesForWeek(weekKey: string, difficulty: ChallengeDifficulty): MentorshipChallenge[] {
  const filtered = MENTORSHIP_CHALLENGES.filter(c => c.difficulty === difficulty);
  const weekNum = parseInt(weekKey.split('W')[1] || '1');
  const mentors: ChallengeMentor[] = ['kiyosaki', 'rohn', 'tracy', 'atomic'];
  
  return mentors.map(mentor => {
    const mentorChallenges = filtered.filter(c => c.mentor === mentor);
    if (mentorChallenges.length === 0) return null;
    const idx = weekNum % mentorChallenges.length;
    return mentorChallenges[idx];
  }).filter(Boolean) as MentorshipChallenge[];
}
