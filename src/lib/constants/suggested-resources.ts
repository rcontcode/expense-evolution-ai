// Suggested financial education resources with summaries, practical tips, and motivational content

export interface SuggestedResource {
  id: string;
  type: 'book' | 'course' | 'podcast' | 'video' | 'article';
  title: string;
  author: string;
  summaryEs: string;
  summaryEn: string;
  practicalTipsEs: string[];
  practicalTipsEn: string[];
  totalPages?: number;
  totalMinutes?: number;
  category: 'mindset' | 'investing' | 'business' | 'habits' | 'wealth' | 'entrepreneurship' | 'fire';
}

export const SUGGESTED_RESOURCES: SuggestedResource[] = [
  // ========== ROBERT KIYOSAKI ==========
  {
    id: 'rich-dad-poor-dad',
    type: 'book',
    title: 'Padre Rico, Padre Pobre',
    author: 'Robert Kiyosaki',
    summaryEs: 'Aprende la diferencia entre activos y pasivos. Los ricos compran activos que generan ingresos, los pobres compran pasivos que drenan dinero.',
    summaryEn: 'Learn the difference between assets and liabilities. The rich buy assets that generate income, the poor buy liabilities that drain money.',
    practicalTipsEs: [
      'Haz una lista de tus activos vs pasivos hoy mismo',
      'Identifica un activo que puedas comprar este mes',
      'Reduce un pasivo innecesario esta semana',
      'Calcula cuánto ingreso pasivo necesitas para cubrir gastos'
    ],
    practicalTipsEn: [
      'Make a list of your assets vs liabilities today',
      'Identify one asset you can buy this month',
      'Reduce one unnecessary liability this week',
      'Calculate how much passive income you need to cover expenses'
    ],
    totalPages: 336,
    category: 'mindset'
  },
  {
    id: 'cashflow-quadrant',
    type: 'book',
    title: 'El Cuadrante del Flujo de Dinero',
    author: 'Robert Kiyosaki',
    summaryEs: 'Existen 4 formas de generar ingresos: Empleado (E), Autoempleado (S), Dueño de negocio (B) e Inversionista (I). La libertad financiera está en B e I.',
    summaryEn: 'There are 4 ways to generate income: Employee (E), Self-employed (S), Business owner (B) and Investor (I). Financial freedom is in B and I.',
    practicalTipsEs: [
      'Identifica en qué cuadrante estás ahora',
      'Define un plan para moverte hacia B o I',
      'Invierte al menos 1 hora semanal en educación financiera',
      'Busca una fuente de ingreso pasivo para empezar'
    ],
    practicalTipsEn: [
      'Identify which quadrant you are in now',
      'Define a plan to move towards B or I',
      'Invest at least 1 hour weekly in financial education',
      'Look for a passive income source to start'
    ],
    totalPages: 272,
    category: 'wealth'
  },
  {
    id: 'guide-to-investing',
    type: 'book',
    title: 'Guía para Invertir',
    author: 'Robert Kiyosaki',
    summaryEs: 'Descubre en qué invierten los ricos que los pobres y clase media no. Aprende a reducir riesgos y maximizar retornos.',
    summaryEn: 'Discover what the rich invest in that the poor and middle class do not. Learn to reduce risks and maximize returns.',
    practicalTipsEs: [
      'Estudia una inversión nueva cada semana',
      'Busca un mentor que ya tenga inversiones exitosas',
      'Empieza con inversiones pequeñas para aprender',
      'Diversifica tus inversiones gradualmente'
    ],
    practicalTipsEn: [
      'Study one new investment each week',
      'Find a mentor who already has successful investments',
      'Start with small investments to learn',
      'Gradually diversify your investments'
    ],
    totalPages: 480,
    category: 'investing'
  },
  {
    id: 'retire-young-retire-rich',
    type: 'book',
    title: 'Retírate Joven y Rico',
    author: 'Robert Kiyosaki',
    summaryEs: 'El poder del apalancamiento: cómo usar el dinero, tiempo y esfuerzo de otros para acelerar tu camino a la riqueza.',
    summaryEn: 'The power of leverage: how to use other people\'s money, time and effort to accelerate your path to wealth.',
    practicalTipsEs: [
      'Identifica 3 formas de apalancamiento disponibles para ti',
      'Busca socios que complementen tus habilidades',
      'Automatiza una tarea que haces manualmente',
      'Calcula cuánto tiempo te tomaría retirarte sin apalancamiento'
    ],
    practicalTipsEn: [
      'Identify 3 forms of leverage available to you',
      'Find partners who complement your skills',
      'Automate a task you do manually',
      'Calculate how long it would take to retire without leverage'
    ],
    totalPages: 336,
    category: 'fire'
  },

  // ========== JAMES CLEAR ==========
  {
    id: 'atomic-habits',
    type: 'book',
    title: 'Hábitos Atómicos',
    author: 'James Clear',
    summaryEs: 'Pequeños cambios producen resultados extraordinarios. El 1% de mejora diaria te hace 37 veces mejor en un año.',
    summaryEn: 'Small changes produce extraordinary results. 1% daily improvement makes you 37 times better in a year.',
    practicalTipsEs: [
      'Empieza con un hábito financiero de 2 minutos',
      'Vincula un nuevo hábito a uno existente',
      'Haz visible tu meta de ahorro cada día',
      'Celebra cada pequeña victoria financiera'
    ],
    practicalTipsEn: [
      'Start with a 2-minute financial habit',
      'Link a new habit to an existing one',
      'Make your savings goal visible every day',
      'Celebrate every small financial victory'
    ],
    totalPages: 320,
    category: 'habits'
  },

  // ========== BRIAN TRACY ==========
  {
    id: 'goals-brian-tracy',
    type: 'book',
    title: 'Metas',
    author: 'Brian Tracy',
    summaryEs: 'Un sistema probado para establecer y alcanzar objetivos. Escribe tus metas, planifica y actúa con determinación.',
    summaryEn: 'A proven system for setting and achieving goals. Write your goals, plan and act with determination.',
    practicalTipsEs: [
      'Escribe 10 metas financieras que quieres lograr',
      'Elige la meta más importante y enfócate en ella',
      'Crea un plan de acción con pasos diarios',
      'Revisa tus metas cada mañana y noche'
    ],
    practicalTipsEn: [
      'Write 10 financial goals you want to achieve',
      'Choose the most important goal and focus on it',
      'Create an action plan with daily steps',
      'Review your goals every morning and night'
    ],
    totalPages: 288,
    category: 'mindset'
  },
  {
    id: 'eat-that-frog',
    type: 'book',
    title: '¡Tráguese Ese Sapo!',
    author: 'Brian Tracy',
    summaryEs: 'Haz primero lo más difícil. 21 estrategias para vencer la procrastinación y ser más productivo.',
    summaryEn: 'Do the hardest thing first. 21 strategies to overcome procrastination and be more productive.',
    practicalTipsEs: [
      'Identifica tu "sapo" financiero más grande hoy',
      'Hazlo a primera hora de la mañana',
      'Divide tareas grandes en pasos pequeños',
      'Elimina distracciones durante tareas importantes'
    ],
    practicalTipsEn: [
      'Identify your biggest financial "frog" today',
      'Do it first thing in the morning',
      'Break big tasks into small steps',
      'Eliminate distractions during important tasks'
    ],
    totalPages: 144,
    category: 'habits'
  },
  {
    id: 'psychology-of-selling',
    type: 'book',
    title: 'Psicología de Ventas',
    author: 'Brian Tracy',
    summaryEs: 'Cómo vender más, más fácil y rápidamente. Domina la psicología detrás de cada venta exitosa.',
    summaryEn: 'How to sell more, easier and faster. Master the psychology behind every successful sale.',
    practicalTipsEs: [
      'Practica escuchar más de lo que hablas',
      'Identifica las necesidades reales de tus clientes',
      'Construye relaciones antes de vender',
      'Maneja objeciones con empatía'
    ],
    practicalTipsEn: [
      'Practice listening more than talking',
      'Identify the real needs of your clients',
      'Build relationships before selling',
      'Handle objections with empathy'
    ],
    totalPages: 240,
    category: 'business'
  },
  {
    id: 'maximum-achievement',
    type: 'book',
    title: 'Logro Máximo',
    author: 'Brian Tracy',
    summaryEs: 'Estrategias y habilidades para desbloquear tu potencial oculto y alcanzar el éxito en todas las áreas.',
    summaryEn: 'Strategies and skills to unlock your hidden potential and achieve success in all areas.',
    practicalTipsEs: [
      'Define tu propósito de vida claramente',
      'Invierte en tu desarrollo personal diariamente',
      'Rodéate de personas exitosas',
      'Toma 100% responsabilidad de tu vida financiera'
    ],
    practicalTipsEn: [
      'Define your life purpose clearly',
      'Invest in your personal development daily',
      'Surround yourself with successful people',
      'Take 100% responsibility for your financial life'
    ],
    totalPages: 352,
    category: 'mindset'
  },
  {
    id: 'no-excuses',
    type: 'book',
    title: 'Sin Excusas',
    author: 'Brian Tracy',
    summaryEs: 'El poder de la autodisciplina para el éxito. Elimina las excusas y toma control total de tu vida.',
    summaryEn: 'The power of self-discipline for success. Eliminate excuses and take total control of your life.',
    practicalTipsEs: [
      'Identifica tus 3 excusas financieras más comunes',
      'Reemplaza cada excusa con una acción',
      'Practica autodisciplina en algo pequeño hoy',
      'Mide tu progreso semanalmente'
    ],
    practicalTipsEn: [
      'Identify your 3 most common financial excuses',
      'Replace each excuse with an action',
      'Practice self-discipline in something small today',
      'Measure your progress weekly'
    ],
    totalPages: 304,
    category: 'habits'
  },

  // ========== JIM ROHN ==========
  {
    id: '7-strategies-wealth-happiness',
    type: 'book',
    title: 'Las 7 Estrategias para la Riqueza y la Felicidad',
    author: 'Jim Rohn',
    summaryEs: 'Ideas poderosas del filósofo empresarial más importante de América. Aprende a mejorar tu vida en todas las áreas.',
    summaryEn: 'Powerful ideas from America\'s foremost business philosopher. Learn to improve your life in all areas.',
    practicalTipsEs: [
      'Desarrolla un plan de lectura diario',
      'Mejora tus habilidades de comunicación',
      'Trabaja más duro en ti mismo que en tu trabajo',
      'Lleva un diario de tus ideas y reflexiones'
    ],
    practicalTipsEn: [
      'Develop a daily reading plan',
      'Improve your communication skills',
      'Work harder on yourself than on your job',
      'Keep a journal of your ideas and reflections'
    ],
    totalPages: 176,
    category: 'wealth'
  },
  {
    id: 'art-exceptional-living',
    type: 'book',
    title: 'El Arte de la Vida Excepcional',
    author: 'Jim Rohn',
    summaryEs: 'Principios probados para vivir una vida extraordinaria. Tu nivel de éxito rara vez excederá tu nivel de desarrollo personal.',
    summaryEn: 'Proven principles for living an extraordinary life. Your level of success will rarely exceed your level of personal development.',
    practicalTipsEs: [
      'Invierte 1 hora diaria en tu desarrollo personal',
      'Rodéate de las 5 personas que quieres ser',
      'Establece estándares más altos para ti mismo',
      'Practica la gratitud diariamente'
    ],
    practicalTipsEn: [
      'Invest 1 hour daily in your personal development',
      'Surround yourself with the 5 people you want to become',
      'Set higher standards for yourself',
      'Practice gratitude daily'
    ],
    totalPages: 160,
    category: 'mindset'
  },
  {
    id: 'five-major-pieces',
    type: 'book',
    title: 'Las Cinco Piezas del Rompecabezas de la Vida',
    author: 'Jim Rohn',
    summaryEs: 'Filosofía, Actitud, Actividad, Resultados y Estilo de Vida - los 5 pilares fundamentales para una vida exitosa.',
    summaryEn: 'Philosophy, Attitude, Activity, Results and Lifestyle - the 5 fundamental pillars for a successful life.',
    practicalTipsEs: [
      'Examina tu filosofía personal sobre el dinero',
      'Ajusta tu actitud hacia los desafíos',
      'Enfócate en actividades que producen resultados',
      'Diseña el estilo de vida que deseas'
    ],
    practicalTipsEn: [
      'Examine your personal philosophy about money',
      'Adjust your attitude towards challenges',
      'Focus on activities that produce results',
      'Design the lifestyle you desire'
    ],
    totalPages: 128,
    category: 'mindset'
  },
  {
    id: 'leading-inspired-life',
    type: 'book',
    title: 'Vivir una Vida Inspirada',
    author: 'Jim Rohn',
    summaryEs: 'La guía definitiva para el desarrollo personal y el éxito. Despierta tu potencial máximo.',
    summaryEn: 'The ultimate guide to personal development and success. Awaken your maximum potential.',
    practicalTipsEs: [
      'Encuentra tu "por qué" más profundo',
      'Crea una visión inspiradora para tu futuro',
      'Actúa con propósito cada día',
      'Comparte tu conocimiento con otros'
    ],
    practicalTipsEn: [
      'Find your deepest "why"',
      'Create an inspiring vision for your future',
      'Act with purpose every day',
      'Share your knowledge with others'
    ],
    totalPages: 240,
    category: 'mindset'
  },
  {
    id: 'seasons-of-life',
    type: 'book',
    title: 'Las Estaciones de la Vida',
    author: 'Jim Rohn',
    summaryEs: 'Aprende a abrazar los ciclos de la vida para el crecimiento y la prosperidad. Cada estación tiene su propósito.',
    summaryEn: 'Learn to embrace life\'s cycles for growth and prosperity. Each season has its purpose.',
    practicalTipsEs: [
      'Identifica en qué estación financiera estás',
      'Prepárate durante el verano para el invierno',
      'Siembra en primavera, cosecha en otoño',
      'Acepta los desafíos como oportunidades de crecimiento'
    ],
    practicalTipsEn: [
      'Identify which financial season you are in',
      'Prepare during summer for winter',
      'Plant in spring, harvest in fall',
      'Accept challenges as growth opportunities'
    ],
    totalPages: 112,
    category: 'mindset'
  },

  // ========== OTHER CLASSICS ==========
  {
    id: 'intelligent-investor',
    type: 'book',
    title: 'El Inversor Inteligente',
    author: 'Benjamin Graham',
    summaryEs: 'Invierte con margen de seguridad, distingue entre inversión y especulación. El mercado es tu sirviente, no tu guía.',
    summaryEn: 'Invest with a margin of safety, distinguish between investment and speculation. The market is your servant, not your guide.',
    practicalTipsEs: [
      'Nunca inviertas dinero que necesitas a corto plazo',
      'Diversifica tus inversiones en al menos 3 sectores',
      'Mantén un fondo de emergencia de 6 meses',
      'Ignora las fluctuaciones diarias del mercado'
    ],
    practicalTipsEn: [
      'Never invest money you need in the short term',
      'Diversify your investments in at least 3 sectors',
      'Keep an emergency fund of 6 months',
      'Ignore daily market fluctuations'
    ],
    totalPages: 640,
    category: 'investing'
  },
  {
    id: 'think-and-grow-rich',
    type: 'book',
    title: 'Piense y Hágase Rico',
    author: 'Napoleon Hill',
    summaryEs: 'El éxito comienza con un deseo ardiente, una meta definida y fe inquebrantable. Tu mente subconsciente es tu aliado más poderoso.',
    summaryEn: 'Success begins with a burning desire, a defined goal and unwavering faith. Your subconscious mind is your most powerful ally.',
    practicalTipsEs: [
      'Escribe tu meta financiera específica y fecha límite',
      'Lee tu meta en voz alta cada mañana y noche',
      'Crea un grupo mastermind de 3-5 personas',
      'Visualiza tu éxito financiero 10 minutos diarios'
    ],
    practicalTipsEn: [
      'Write your specific financial goal and deadline',
      'Read your goal aloud every morning and night',
      'Create a mastermind group of 3-5 people',
      'Visualize your financial success 10 minutes daily'
    ],
    totalPages: 320,
    category: 'mindset'
  },
  {
    id: 'psychology-of-money',
    type: 'book',
    title: 'La Psicología del Dinero',
    author: 'Morgan Housel',
    summaryEs: 'El éxito financiero no es ciencia, es comportamiento. Tu relación emocional con el dinero importa más que tu conocimiento.',
    summaryEn: 'Financial success is not science, it is behavior. Your emotional relationship with money matters more than your knowledge.',
    practicalTipsEs: [
      'Identifica tus creencias limitantes sobre el dinero',
      'Ahorra para objetivos, no solo por ahorrar',
      'Define tu "suficiente" personal',
      'Construye riqueza que te deje dormir tranquilo'
    ],
    practicalTipsEn: [
      'Identify your limiting beliefs about money',
      'Save for goals, not just for saving',
      'Define your personal "enough"',
      'Build wealth that lets you sleep well'
    ],
    totalPages: 256,
    category: 'mindset'
  },
  {
    id: 'millionaire-next-door',
    type: 'book',
    title: 'El Millonario de al Lado',
    author: 'Thomas J. Stanley',
    summaryEs: 'Los millonarios reales viven por debajo de sus posibilidades, evitan el lujo ostentoso y priorizan la acumulación de riqueza sobre el estatus.',
    summaryEn: 'Real millionaires live below their means, avoid conspicuous luxury and prioritize wealth accumulation over status.',
    practicalTipsEs: [
      'Calcula tu patrimonio neto esperado según tu edad e ingresos',
      'Gasta menos del 50% de tus ingresos en estilo de vida',
      'Evita compras para impresionar a otros',
      'Invierte tiempo en planificar tu futuro financiero'
    ],
    practicalTipsEn: [
      'Calculate your expected net worth based on age and income',
      'Spend less than 50% of your income on lifestyle',
      'Avoid purchases to impress others',
      'Invest time in planning your financial future'
    ],
    totalPages: 272,
    category: 'wealth'
  },
  {
    id: '4-hour-workweek',
    type: 'book',
    title: 'La Semana Laboral de 4 Horas',
    author: 'Tim Ferriss',
    summaryEs: 'Diseña tu estilo de vida antes de tu carrera. Automatiza, delega y elimina para crear tiempo y libertad.',
    summaryEn: 'Design your lifestyle before your career. Automate, delegate and eliminate to create time and freedom.',
    practicalTipsEs: [
      'Identifica las tareas del 20% que generan el 80% de resultados',
      'Automatiza una tarea repetitiva esta semana',
      'Practica decir NO a compromisos no esenciales',
      'Crea una fuente de ingreso que no requiera tu tiempo'
    ],
    practicalTipsEn: [
      'Identify the 20% tasks that generate 80% of results',
      'Automate one repetitive task this week',
      'Practice saying NO to non-essential commitments',
      'Create an income source that does not require your time'
    ],
    totalPages: 416,
    category: 'entrepreneurship'
  },
  {
    id: 'total-money-makeover',
    type: 'book',
    title: 'La Transformación Total de su Dinero',
    author: 'Dave Ramsey',
    summaryEs: 'Los 7 pasos bebé hacia la libertad financiera: fondo de emergencia, pagar deudas, ahorrar para retiro, educación hijos, pagar casa.',
    summaryEn: 'The 7 baby steps to financial freedom: emergency fund, pay off debt, save for retirement, kids education, pay off house.',
    practicalTipsEs: [
      'Crea un fondo de emergencia de $1,000 primero',
      'Lista todas tus deudas de menor a mayor',
      'Usa el método bola de nieve para pagar deudas',
      'Vive con un presupuesto base cero cada mes'
    ],
    practicalTipsEn: [
      'Create a $1,000 emergency fund first',
      'List all your debts from smallest to largest',
      'Use the snowball method to pay off debt',
      'Live on a zero-based budget each month'
    ],
    totalPages: 288,
    category: 'wealth'
  },
  {
    id: 'profit-first',
    type: 'book',
    title: 'Profit First',
    author: 'Mike Michalowicz',
    summaryEs: 'Toma tu ganancia primero, antes de pagar gastos. Usa cuentas separadas para diferentes propósitos financieros.',
    summaryEn: 'Take your profit first, before paying expenses. Use separate accounts for different financial purposes.',
    practicalTipsEs: [
      'Abre una cuenta separada solo para ahorros/ganancias',
      'Transfiere el 1% de cada ingreso a tu cuenta de ganancia',
      'Revisa tus finanzas cada 10 y 25 del mes',
      'Reduce gastos operativos un 10% este trimestre'
    ],
    practicalTipsEn: [
      'Open a separate account just for savings/profit',
      'Transfer 1% of every income to your profit account',
      'Review your finances every 10th and 25th of the month',
      'Reduce operating expenses by 10% this quarter'
    ],
    totalPages: 224,
    category: 'business'
  }
];

export const MOTIVATIONAL_QUOTES = [
  {
    textEs: '¡Cada página que lees es un paso hacia la libertad financiera!',
    textEn: 'Every page you read is a step towards financial freedom!',
    author: 'Tu mentor financiero'
  },
  {
    textEs: 'Los líderes son lectores. Warren Buffett lee 5 horas al día.',
    textEn: 'Leaders are readers. Warren Buffett reads 5 hours a day.',
    author: 'Warren Buffett'
  },
  {
    textEs: 'La inversión más importante es en ti mismo.',
    textEn: 'The most important investment is in yourself.',
    author: 'Warren Buffett'
  },
  {
    textEs: '¡Vas increíble! El conocimiento que adquieres hoy te pagará dividendos mañana.',
    textEn: 'You are doing great! The knowledge you acquire today will pay dividends tomorrow.',
    author: 'Tu mentor financiero'
  },
  {
    textEs: 'Lee 20 minutos al día y serás experto en cualquier tema en 1 año.',
    textEn: 'Read 20 minutes a day and you will be an expert on any topic in 1 year.',
    author: 'Brian Tracy'
  },
  {
    textEs: '¡No te detengas! Cada concepto que aprendes te acerca más a tu meta.',
    textEn: 'Do not stop! Every concept you learn brings you closer to your goal.',
    author: 'Tu mentor financiero'
  },
  {
    textEs: 'El conocimiento es el nuevo dinero. Invierte en tu mente primero.',
    textEn: 'Knowledge is the new money. Invest in your mind first.',
    author: 'Robert Kiyosaki'
  },
  {
    textEs: '¡Excelente progreso! Los ricos nunca dejan de aprender.',
    textEn: 'Excellent progress! The rich never stop learning.',
    author: 'Tu mentor financiero'
  }
];

export const PRACTICE_SUGGESTIONS = {
  mindset: {
    es: [
      'Escribe 3 creencias limitantes sobre el dinero que tienes',
      'Define tu visión financiera a 5 años en papel',
      'Identifica 3 hábitos de personas exitosas que quieres adoptar'
    ],
    en: [
      'Write 3 limiting beliefs about money you have',
      'Define your 5-year financial vision on paper',
      'Identify 3 habits of successful people you want to adopt'
    ]
  },
  investing: {
    es: [
      'Investiga 3 acciones que te interesen y anota sus fundamentales',
      'Calcula cuánto dinero puedes invertir mensualmente',
      'Abre una cuenta de inversión si no tienes una'
    ],
    en: [
      'Research 3 stocks that interest you and note their fundamentals',
      'Calculate how much money you can invest monthly',
      'Open an investment account if you do not have one'
    ]
  },
  business: {
    es: [
      'Identifica un problema que puedas resolver con un negocio',
      'Crea un presupuesto para tu negocio o proyecto',
      'Automatiza una tarea repetitiva de tu trabajo'
    ],
    en: [
      'Identify a problem you can solve with a business',
      'Create a budget for your business or project',
      'Automate a repetitive task from your work'
    ]
  },
  habits: {
    es: [
      'Implementa el hábito de revisar tus finanzas cada domingo',
      'Crea un recordatorio para registrar tus gastos diarios',
      'Establece una meta de ahorro automático mensual'
    ],
    en: [
      'Implement the habit of reviewing your finances every Sunday',
      'Create a reminder to record your daily expenses',
      'Set an automatic monthly savings goal'
    ]
  },
  wealth: {
    es: [
      'Calcula tu patrimonio neto actual (activos - pasivos)',
      'Define cuánto necesitas para tu independencia financiera',
      'Crea un plan para aumentar tu patrimonio un 10% este año'
    ],
    en: [
      'Calculate your current net worth (assets - liabilities)',
      'Define how much you need for your financial independence',
      'Create a plan to increase your net worth by 10% this year'
    ]
  },
  entrepreneurship: {
    es: [
      'Identifica una habilidad que puedas monetizar',
      'Crea un MVP de tu idea de negocio esta semana',
      'Busca 3 mentores potenciales en tu industria'
    ],
    en: [
      'Identify a skill you can monetize',
      'Create an MVP of your business idea this week',
      'Find 3 potential mentors in your industry'
    ]
  }
};
