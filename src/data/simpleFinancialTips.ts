// Pool of financial-education tips for the Simple Mode dashboard.
// Rotates daily based on the day of month so the message stays stable
// within a single day but feels fresh over time.
// Strict policy: education only — never advice. A "Consult a professional"
// disclaimer is rendered alongside the tip in the UI.

export type TipContext = 'empty' | 'deficit' | 'high_spend' | 'healthy';

type Bilingual = { es: string; en: string };

const POOLS: Record<TipContext, Bilingual[]> = {
  empty: [
    {
      es: 'Registrar tus movimientos durante 30 días seguidos te da una imagen real de tu salud financiera y te ayuda a detectar fugas invisibles.',
      en: 'Logging your activity for 30 days in a row gives you a real picture of your financial health and helps spot hidden leaks.',
    },
    {
      es: 'Empezar es lo más difícil. Un solo gasto o ingreso registrado hoy ya es más información de la que tenías ayer.',
      en: 'Starting is the hardest part. A single expense or income logged today is already more insight than you had yesterday.',
    },
    {
      es: 'Las personas que revisan sus finanzas cada semana suelen ahorrar más, no porque ganen más, sino porque deciden con datos.',
      en: 'People who review their finances weekly tend to save more — not because they earn more, but because they decide with data.',
    },
    {
      es: 'Capturar un recibo toma 5 segundos. Reconstruir un mes sin registros toma horas.',
      en: 'Capturing a receipt takes 5 seconds. Reconstructing a month with no records takes hours.',
    },
    {
      es: 'No necesitas presupuesto perfecto para empezar. Necesitas registros honestos durante un mes.',
      en: 'You don\'t need a perfect budget to start. You need honest records for one month.',
    },
    {
      es: 'Ver a dónde va tu dinero suele ser más revelador que decidir a dónde debería ir.',
      en: 'Seeing where your money goes is usually more revealing than deciding where it should go.',
    },
  ],
  deficit: [
    {
      es: 'Estás gastando más de lo que ingresas este mes. Revisa tus categorías mayores y considera consultar a un profesional.',
      en: "You're spending more than you earn this month. Review your top categories and consider consulting a professional.",
    },
    {
      es: 'Un mes en déficit no define tu salud financiera, pero tres seguidos sí. Identifica qué cambió.',
      en: 'One month in deficit doesn\'t define your finances, but three in a row do. Identify what changed.',
    },
    {
      es: 'Cuando los gastos superan a los ingresos, suele haber 2 o 3 categorías que explican el 80% del problema.',
      en: 'When expenses exceed income, usually 2 or 3 categories explain 80% of the gap.',
    },
    {
      es: 'Los gastos recurrentes (suscripciones, servicios) son los primeros que conviene auditar en un mes deficitario.',
      en: 'Recurring expenses (subscriptions, services) are the first to audit in a deficit month.',
    },
    {
      es: 'Revisa tus movimientos bancarios: muchas veces hay cobros olvidados que se pueden cancelar hoy mismo.',
      en: 'Check your bank movements — there are often forgotten charges you can cancel today.',
    },
    {
      es: 'Antes de recortar, mide. Saber exactamente cuánto se va en cada categoría reduce decisiones impulsivas.',
      en: 'Before cutting, measure. Knowing exactly how much each category takes reduces impulsive decisions.',
    },
  ],
  high_spend: [
    {
      es: 'Has usado más del 80% de tus ingresos este mes. Cuida los gastos restantes.',
      en: "You've used more than 80% of your income this month. Watch the remaining expenses.",
    },
    {
      es: 'A esta altura del mes, cada gasto pequeño cuenta. Pregúntate "¿lo necesito esta semana?" antes de pagar.',
      en: 'At this point in the month, every small expense counts. Ask "do I need it this week?" before paying.',
    },
    {
      es: 'Un mes con 80% de gasto suele significar poco margen para imprevistos. Considera apartar lo que sobre.',
      en: 'A month at 80% spend usually means little room for surprises. Consider setting aside whatever\'s left.',
    },
    {
      es: 'Cuando el gasto se acerca al ingreso, los gastos hormiga (café, delivery, antojos) son los primeros candidatos a revisar.',
      en: 'When spending nears income, small recurring expenses (coffee, delivery, treats) are the first to review.',
    },
    {
      es: 'Si esto se repite cada mes, no es mala suerte: es un patrón. Vale la pena revisar el presupuesto.',
      en: 'If this repeats every month, it\'s not bad luck — it\'s a pattern. Worth reviewing your budget.',
    },
  ],
  healthy: [
    {
      es: 'Vas bien este mes. Mantén el ritmo y revisa tu presupuesto cada semana.',
      en: "You're doing well this month. Keep the pace and review your budget weekly.",
    },
    {
      es: 'Un mes sano es buen momento para apartar parte del excedente antes de que se diluya en gastos pequeños.',
      en: 'A healthy month is a good time to set aside part of the surplus before it dissolves into small expenses.',
    },
    {
      es: 'Tener margen no significa gastar más. Significa tener opciones cuando aparezca un imprevisto.',
      en: 'Having margin doesn\'t mean spending more. It means having options when something unexpected shows up.',
    },
    {
      es: 'Aprovecha los meses estables para revisar suscripciones y servicios que ya no usas.',
      en: 'Use stable months to review subscriptions and services you no longer use.',
    },
    {
      es: 'La constancia importa más que el monto: ahorrar poco cada mes supera ahorrar mucho una vez al año.',
      en: 'Consistency matters more than amount: saving a little each month beats saving a lot once a year.',
    },
    {
      es: 'Buen mes para mirar hacia adelante: ¿qué gasto grande viene en los próximos 90 días?',
      en: 'Good month to look ahead: what big expense is coming in the next 90 days?',
    },
  ],
};

export function getDailyTip(context: TipContext, language: 'es' | 'en'): string {
  const pool = POOLS[context];
  const idx = new Date().getDate() % pool.length;
  return pool[idx][language];
}
