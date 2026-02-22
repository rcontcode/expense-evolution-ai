// User Guide Content - Bilingual (ES/EN)
// Structured data for the interactive user manual

export interface GuideStep {
  es: string;
  en: string;
}

export interface GuideFAQ {
  question: { es: string; en: string };
  answer: { es: string; en: string };
}

export interface GuideSection {
  id: string;
  emoji: string;
  title: { es: string; en: string };
  shortDesc: { es: string; en: string };
  purpose: { es: string; en: string };
  steps: GuideStep[];
  tips: GuideStep[];
  faq: GuideFAQ[];
  connections: { es: string; en: string }[];
  color: string; // tailwind border color class
}

// ─── BLOQUE 1: VISIÓN GENERAL ───────────────────────────────

export const heroContent = {
  title: { es: 'Manual de Usuario EvoFinz', en: 'EvoFinz User Manual' },
  subtitle: {
    es: 'Tu centro de comando financiero personal — todo lo que necesitas saber para dominar tus finanzas.',
    en: 'Your personal financial command center — everything you need to master your finances.'
  },
  whatIs: {
    title: { es: '¿Qué es EvoFinz?', en: 'What is EvoFinz?' },
    desc: {
      es: 'EvoFinz es una plataforma integral de gestión financiera personal y profesional diseñada para freelancers, autónomos, pequeñas empresas y cualquier persona que quiera tomar el control total de sus finanzas. Combina en una sola herramienta lo que normalmente necesitarías 5-10 apps separadas.',
      en: 'EvoFinz is a comprehensive personal and professional financial management platform designed for freelancers, self-employed professionals, small businesses, and anyone who wants to take full control of their finances. It combines in one tool what would normally require 5-10 separate apps.'
    }
  },
  forWhom: {
    title: { es: '¿Para quién es?', en: 'Who is it for?' },
    items: [
      { emoji: '💼', es: 'Freelancers y trabajadores independientes', en: 'Freelancers and independent workers' },
      { emoji: '🏪', es: 'Dueños de pequeños negocios', en: 'Small business owners' },
      { emoji: '📊', es: 'Personas que quieren organizar sus finanzas', en: 'People who want to organize their finances' },
      { emoji: '🌍', es: 'Profesionales que operan en múltiples países', en: 'Professionals operating in multiple countries' },
      { emoji: '🔥', es: 'Aspirantes al movimiento FIRE', en: 'FIRE movement aspirants' },
      { emoji: '📱', es: 'Cualquiera que guarde recibos en el cajón', en: 'Anyone who keeps receipts in a drawer' },
    ]
  },
  mission: {
    title: { es: 'Nuestra Misión', en: 'Our Mission' },
    desc: {
      es: 'Democratizar la gestión financiera inteligente. Que cada persona, sin importar su nivel de experiencia financiera, pueda tomar decisiones informadas, ahorrar tiempo, maximizar deducciones y construir riqueza a largo plazo.',
      en: 'Democratize intelligent financial management. So every person, regardless of financial experience, can make informed decisions, save time, maximize deductions, and build long-term wealth.'
    }
  },
  advantages: {
    title: { es: '¿Por qué EvoFinz vs. no usar nada?', en: 'Why EvoFinz vs. using nothing?' },
    items: [
      { emoji: '⏰', es: 'Ahorra 5-10 horas mensuales en organización financiera', en: 'Save 5-10 hours monthly on financial organization' },
      { emoji: '💸', es: 'Descubre deducciones fiscales que no sabías que tenías', en: 'Discover tax deductions you didn\'t know you had' },
      { emoji: '📸', es: 'Nunca más pierdas un recibo importante', en: 'Never lose an important receipt again' },
      { emoji: '🧠', es: 'Decisiones financieras basadas en datos, no en intuición', en: 'Financial decisions based on data, not intuition' },
      { emoji: '🔗', es: 'Todo conectado: gastos, ingresos, clientes, impuestos, patrimonio', en: 'Everything connected: expenses, income, clients, taxes, net worth' },
      { emoji: '📱', es: 'Acceso desde cualquier dispositivo, en cualquier momento', en: 'Access from any device, anytime' },
    ]
  },
  habit: {
    title: { es: 'El Hábito EvoFinz', en: 'The EvoFinz Habit' },
    desc: {
      es: 'La clave del éxito financiero no es una acción grande, sino pequeñas acciones diarias. EvoFinz está diseñada para que registrar un gasto tome menos de 30 segundos. Con el hábito de registrar cada transacción, tendrás una foto perfecta de tus finanzas en todo momento.',
      en: 'The key to financial success isn\'t one big action, but small daily actions. EvoFinz is designed so recording an expense takes less than 30 seconds. With the habit of recording every transaction, you\'ll have a perfect picture of your finances at all times.'
    },
    steps: [
      { emoji: '☀️', es: 'Mañana: Revisa tu Dashboard (2 min)', en: 'Morning: Check your Dashboard (2 min)' },
      { emoji: '🧾', es: 'Durante el día: Fotografía cada recibo al instante', en: 'During the day: Photograph every receipt instantly' },
      { emoji: '🌙', es: 'Noche: Revisa gastos del día y clasifica pendientes (3 min)', en: 'Evening: Review day\'s expenses and classify pending ones (3 min)' },
      { emoji: '📅', es: 'Semanal: Revisa presupuesto y metas', en: 'Weekly: Review budget and goals' },
      { emoji: '📊', es: 'Mensual: Reconcilia con el banco y analiza tendencias', en: 'Monthly: Reconcile with bank and analyze trends' },
    ]
  },
  improvement: {
    title: { es: 'Mejora Continua Contigo', en: 'Continuous Improvement With You' },
    desc: {
      es: 'EvoFinz evoluciona constantemente basándose en el feedback real de nuestros usuarios. Cada sugerencia, cada reporte de bug y cada opinión contribuye a hacer la plataforma mejor para todos. Tú eres parte fundamental de esta evolución.',
      en: 'EvoFinz constantly evolves based on real user feedback. Every suggestion, every bug report, and every opinion contributes to making the platform better for everyone. You are a fundamental part of this evolution.'
    }
  }
};

// ─── BLOQUE 2: SECCIONES ────────────────────────────────────

export const guideSections: GuideSection[] = [
  {
    id: 'dashboard',
    emoji: '📊',
    title: { es: 'Dashboard', en: 'Dashboard' },
    shortDesc: { es: 'Tu centro de comando financiero', en: 'Your financial command center' },
    purpose: {
      es: 'El Dashboard es tu vista panorámica. De un vistazo ves ingresos vs gastos, presupuestos, metas, calendario fiscal y tendencias. Es el primer lugar que revisas cada mañana.',
      en: 'The Dashboard is your panoramic view. At a glance you see income vs expenses, budgets, goals, tax calendar, and trends. It\'s the first place you check every morning.'
    },
    steps: [
      { es: 'Al ingresar, verás un resumen del mes actual con ingresos y gastos', en: 'Upon entering, you\'ll see a summary of the current month with income and expenses' },
      { es: 'Las tarjetas superiores muestran métricas clave: balance, gastos pendientes, próximos vencimientos', en: 'Top cards show key metrics: balance, pending expenses, upcoming deadlines' },
      { es: 'Los gráficos muestran tendencias mensuales y distribución por categorías', en: 'Charts show monthly trends and distribution by categories' },
      { es: 'Usa las pestañas para acceder a vistas especializadas (Impuestos, FIRE, Portafolio)', en: 'Use tabs to access specialized views (Taxes, FIRE, Portfolio)' },
    ],
    tips: [
      { es: 'Revísalo cada mañana — 2 minutos bastan para mantenerte al día', en: 'Check it every morning — 2 minutes are enough to stay on top' },
      { es: 'Personaliza la entidad activa para ver datos de diferentes negocios/países', en: 'Customize the active entity to see data from different businesses/countries' },
    ],
    faq: [
      {
        question: { es: '¿Puedo ver datos de meses anteriores?', en: 'Can I see data from previous months?' },
        answer: { es: 'Sí, usa los filtros de fecha en la parte superior para navegar entre períodos.', en: 'Yes, use the date filters at the top to navigate between periods.' }
      },
    ],
    connections: [
      { es: 'Se alimenta de Gastos, Ingresos, Presupuesto y Patrimonio Neto', en: 'Feeds from Expenses, Income, Budget, and Net Worth' },
    ],
    color: 'border-blue-500/30',
  },
  {
    id: 'expenses',
    emoji: '🧾',
    title: { es: 'Gastos', en: 'Expenses' },
    shortDesc: { es: 'Registro completo de todos tus gastos', en: 'Complete record of all your expenses' },
    purpose: {
      es: 'Registra cada peso/dólar que sale de tu bolsillo. Categoriza, adjunta recibos, marca deducciones fiscales y asocia gastos a clientes o proyectos. Es la base de tu salud financiera.',
      en: 'Record every penny that leaves your pocket. Categorize, attach receipts, mark tax deductions, and associate expenses with clients or projects. It\'s the foundation of your financial health.'
    },
    steps: [
      { es: 'Haz clic en "+ Gasto" o usa la captura rápida desde el móvil', en: 'Click "+ Expense" or use quick capture from mobile' },
      { es: 'Llena monto, fecha, categoría y descripción', en: 'Fill in amount, date, category, and description' },
      { es: 'Opcionalmente adjunta un recibo (foto o PDF)', en: 'Optionally attach a receipt (photo or PDF)' },
      { es: 'Marca si es deducible de impuestos y asócialo a un cliente/proyecto', en: 'Mark if it\'s tax-deductible and associate it with a client/project' },
      { es: 'Usa filtros para encontrar gastos por categoría, fecha o monto', en: 'Use filters to find expenses by category, date, or amount' },
    ],
    tips: [
      { es: 'Registra gastos al instante — si lo dejas para después, lo olvidas', en: 'Record expenses instantly — if you leave it for later, you\'ll forget' },
      { es: 'Usa tags para agrupar gastos por proyecto o propósito específico', en: 'Use tags to group expenses by project or specific purpose' },
      { es: 'Revisa las categorías periódicamente para detectar patrones de gasto', en: 'Review categories periodically to detect spending patterns' },
    ],
    faq: [
      {
        question: { es: '¿Puedo editar un gasto después de crearlo?', en: 'Can I edit an expense after creating it?' },
        answer: { es: 'Sí, haz clic en cualquier gasto de la lista para editarlo. Todos los campos son modificables.', en: 'Yes, click on any expense in the list to edit it. All fields are modifiable.' }
      },
      {
        question: { es: '¿Qué pasa si borro un gasto por error?', en: 'What if I delete an expense by mistake?' },
        answer: { es: 'Los gastos eliminados van a la Papelera donde puedes restaurarlos dentro de 30 días.', en: 'Deleted expenses go to the Trash where you can restore them within 30 days.' }
      },
    ],
    connections: [
      { es: 'Se refleja en Dashboard, Presupuesto, Reconciliación e Informes Fiscales', en: 'Reflects in Dashboard, Budget, Reconciliation, and Tax Reports' },
      { es: 'Puede asociarse a Clientes, Proyectos y Contratos', en: 'Can be associated with Clients, Projects, and Contracts' },
    ],
    color: 'border-red-500/30',
  },
  {
    id: 'income',
    emoji: '💰',
    title: { es: 'Ingresos', en: 'Income' },
    shortDesc: { es: 'Controla todo el dinero que entra', en: 'Track all money coming in' },
    purpose: {
      es: 'Registra todos tus ingresos: facturación, salarios, inversiones, freelance. Asocia ingresos a clientes para saber quién te genera más valor y planifica tu flujo de caja.',
      en: 'Record all your income: billing, salaries, investments, freelance. Associate income with clients to know who generates the most value and plan your cash flow.'
    },
    steps: [
      { es: 'Crea un nuevo ingreso con monto, fecha, tipo y fuente', en: 'Create a new income with amount, date, type, and source' },
      { es: 'Selecciona el tipo: facturación, salario, inversión, freelance, etc.', en: 'Select the type: billing, salary, investment, freelance, etc.' },
      { es: 'Asocia al cliente que te pagó (opcional pero recomendado)', en: 'Associate the client who paid you (optional but recommended)' },
      { es: 'Configura recurrencia si es un ingreso fijo mensual', en: 'Set recurrence if it\'s a fixed monthly income' },
    ],
    tips: [
      { es: 'Asocia siempre ingresos a clientes para análisis de rentabilidad', en: 'Always associate income with clients for profitability analysis' },
      { es: 'Marca ingresos gravables para preparar mejor tu declaración fiscal', en: 'Mark taxable income to better prepare your tax return' },
    ],
    faq: [
      {
        question: { es: '¿Puedo registrar ingresos en diferentes monedas?', en: 'Can I register income in different currencies?' },
        answer: { es: 'Sí, EvoFinz soporta múltiples monedas y convierte automáticamente según tasas de cambio.', en: 'Yes, EvoFinz supports multiple currencies and converts automatically based on exchange rates.' }
      },
    ],
    connections: [
      { es: 'Alimenta Dashboard, Patrimonio Neto y análisis de rentabilidad por cliente', en: 'Feeds Dashboard, Net Worth, and profitability analysis by client' },
    ],
    color: 'border-green-500/30',
  },
  {
    id: 'clients',
    emoji: '👥',
    title: { es: 'Clientes', en: 'Clients' },
    shortDesc: { es: 'Gestión completa de tus clientes', en: 'Complete client management' },
    purpose: {
      es: 'Centraliza toda la información de tus clientes: datos de contacto, historial de facturación, contratos asociados y rentabilidad. Sabe exactamente cuánto te genera cada cliente.',
      en: 'Centralize all client information: contact data, billing history, associated contracts, and profitability. Know exactly how much each client generates.'
    },
    steps: [
      { es: 'Agrega un cliente con nombre, email, teléfono y datos fiscales', en: 'Add a client with name, email, phone, and tax data' },
      { es: 'Asocia gastos e ingresos al cliente para tracking de rentabilidad', en: 'Associate expenses and income with the client for profitability tracking' },
      { es: 'Vincula contratos activos al perfil del cliente', en: 'Link active contracts to the client profile' },
      { es: 'Revisa el historial completo de transacciones por cliente', en: 'Review the complete transaction history by client' },
    ],
    tips: [
      { es: 'Completa los datos fiscales del cliente para facturación automática', en: 'Complete client tax data for automatic invoicing' },
      { es: 'Usa el perfil de facturación para generar documentos pre-llenados', en: 'Use the billing profile to generate pre-filled documents' },
    ],
    faq: [
      {
        question: { es: '¿Puedo tener clientes de diferentes países?', en: 'Can I have clients from different countries?' },
        answer: { es: 'Sí, cada cliente puede tener su propia moneda y país, ideal para freelancers internacionales.', en: 'Yes, each client can have their own currency and country, ideal for international freelancers.' }
      },
    ],
    connections: [
      { es: 'Se vincula con Ingresos, Gastos, Contratos y Proyectos', en: 'Links with Income, Expenses, Contracts, and Projects' },
    ],
    color: 'border-purple-500/30',
  },
  {
    id: 'contracts',
    emoji: '📄',
    title: { es: 'Contratos', en: 'Contracts' },
    shortDesc: { es: 'Seguimiento de todos tus acuerdos', en: 'Track all your agreements' },
    purpose: {
      es: 'Sube tus contratos, monitorea fechas de vencimiento, renovaciones automáticas y valores. Nunca más te toma por sorpresa un contrato que se renueva sin que lo sepas.',
      en: 'Upload your contracts, monitor expiration dates, auto-renewals, and values. Never again be surprised by a contract that renews without you knowing.'
    },
    steps: [
      { es: 'Sube el archivo del contrato (PDF, imagen)', en: 'Upload the contract file (PDF, image)' },
      { es: 'Completa título, cliente, valor y fechas de inicio/fin', en: 'Fill in title, client, value, and start/end dates' },
      { es: 'Configura alertas de renovación para no perder fechas límite', en: 'Set renewal alerts to never miss deadlines' },
      { es: 'Asocia gastos reembolsables al contrato', en: 'Associate reimbursable expenses with the contract' },
    ],
    tips: [
      { es: 'Revisa contratos próximos a vencer cada semana desde el Dashboard', en: 'Review contracts about to expire weekly from the Dashboard' },
      { es: 'Usa notas para registrar acuerdos verbales o modificaciones', en: 'Use notes to record verbal agreements or modifications' },
    ],
    faq: [
      {
        question: { es: '¿Puedo adjuntar múltiples archivos a un contrato?', en: 'Can I attach multiple files to a contract?' },
        answer: { es: 'Cada contrato tiene un archivo principal. Para documentos adicionales, usa la sección de Archivos.', en: 'Each contract has a main file. For additional documents, use the Files section.' }
      },
    ],
    connections: [
      { es: 'Se vincula con Clientes, Gastos (reembolsables) y Calendario Fiscal', en: 'Links with Clients, Expenses (reimbursable), and Tax Calendar' },
    ],
    color: 'border-amber-500/30',
  },
  {
    id: 'budget',
    emoji: '🎯',
    title: { es: 'Presupuesto', en: 'Budget' },
    shortDesc: { es: 'Metas de gasto, pagos fijos y ahorro', en: 'Spending goals, fixed payments, and savings' },
    purpose: {
      es: 'Define cuánto quieres gastar por categoría cada mes, registra tus pagos fijos recurrentes y establece metas de ahorro. El sistema te alerta cuando te acercas a tus límites.',
      en: 'Define how much you want to spend per category each month, record your recurring fixed payments, and set savings goals. The system alerts you when you approach your limits.'
    },
    steps: [
      { es: 'Define presupuestos mensuales por categoría (ej: Alimentación $500)', en: 'Set monthly budgets by category (e.g., Food $500)' },
      { es: 'Registra pagos fijos recurrentes (ej: Internet $50/mes)', en: 'Record recurring fixed payments (e.g., Internet $50/month)' },
      { es: 'Establece metas de ahorro con plazos y montos', en: 'Set savings goals with deadlines and amounts' },
      { es: 'Monitorea el progreso visual de cada categoría durante el mes', en: 'Monitor the visual progress of each category during the month' },
    ],
    tips: [
      { es: 'Empieza con pocas categorías e incrementa gradualmente', en: 'Start with few categories and gradually increase' },
      { es: 'Los pagos fijos como Agua, Internet, Electricidad te dan una base clara', en: 'Fixed payments like Water, Internet, Electricity give you a clear base' },
      { es: 'Configura alertas al 80% del presupuesto para reaccionar a tiempo', en: 'Set alerts at 80% of budget to react in time' },
    ],
    faq: [
      {
        question: { es: '¿El presupuesto se reinicia cada mes?', en: 'Does the budget reset every month?' },
        answer: { es: 'Sí, cada mes inicia con tus límites definidos. Puedes configurar rollover para acumular lo no gastado.', en: 'Yes, each month starts with your defined limits. You can configure rollover to accumulate unspent amounts.' }
      },
    ],
    connections: [
      { es: 'Se alimenta de Gastos y muestra progreso en el Dashboard', en: 'Feeds from Expenses and shows progress in the Dashboard' },
    ],
    color: 'border-cyan-500/30',
  },
  {
    id: 'mileage',
    emoji: '🚗',
    title: { es: 'Kilometraje', en: 'Mileage' },
    shortDesc: { es: 'Viajes de trabajo y deducciones', en: 'Work trips and deductions' },
    purpose: {
      es: 'Registra tus viajes de trabajo para deducir kilometraje en impuestos. Calcula automáticamente la deducción según las tasas oficiales de tu país.',
      en: 'Record your work trips to deduct mileage on taxes. Automatically calculates the deduction based on your country\'s official rates.'
    },
    steps: [
      { es: 'Registra un viaje: origen, destino, distancia y propósito', en: 'Record a trip: origin, destination, distance, and purpose' },
      { es: 'Selecciona si es ida/vuelta o solo ida', en: 'Select if it\'s round trip or one-way' },
      { es: 'El sistema calcula la deducción fiscal automáticamente', en: 'The system automatically calculates the tax deduction' },
      { es: 'Revisa el resumen mensual de kilómetros deducibles', en: 'Review the monthly summary of deductible kilometers' },
    ],
    tips: [
      { es: 'Registra cada viaje de trabajo — los montos se acumulan significativamente al año', en: 'Record every work trip — amounts accumulate significantly over the year' },
      { es: 'Guarda un registro del vehículo para respaldar tus deducciones', en: 'Keep a vehicle record to support your deductions' },
    ],
    faq: [
      {
        question: { es: '¿Qué tasa por kilómetro usa EvoFinz?', en: 'What rate per kilometer does EvoFinz use?' },
        answer: { es: 'Usa las tasas oficiales del CRA (Canadá) y puede configurarse para otros países.', en: 'Uses the official CRA rates (Canada) and can be configured for other countries.' }
      },
    ],
    connections: [
      { es: 'Genera gastos deducibles automáticos que aparecen en informes fiscales', en: 'Generates automatic deductible expenses that appear in tax reports' },
    ],
    color: 'border-orange-500/30',
  },
  {
    id: 'tax-calendar',
    emoji: '📅',
    title: { es: 'Calendario Fiscal', en: 'Tax Calendar' },
    shortDesc: { es: 'Fechas límite y recordatorios', en: 'Deadlines and reminders' },
    purpose: {
      es: 'Nunca más pierdas una fecha límite fiscal. El calendario te muestra todas las fechas importantes de declaración, pagos y reportes según tu país y tipo de entidad.',
      en: 'Never miss a tax deadline again. The calendar shows you all important filing, payment, and reporting dates based on your country and entity type.'
    },
    steps: [
      { es: 'Revisa las fechas marcadas según tu país y entidad fiscal', en: 'Review dates marked according to your country and tax entity' },
      { es: 'Los eventos urgentes aparecen destacados con alertas visuales', en: 'Urgent events appear highlighted with visual alerts' },
      { es: 'Marca eventos como completados una vez que cumplas con la obligación', en: 'Mark events as completed once you fulfill the obligation' },
      { es: 'Configura recordatorios previos para no llegar al último momento', en: 'Set advance reminders to avoid last-minute rushes' },
    ],
    tips: [
      { es: 'Revísalo el primer día de cada mes para planificar obligaciones', en: 'Check it on the first day of each month to plan obligations' },
      { es: 'Las fechas varían según tu provincia/estado — mantén tu perfil actualizado', en: 'Dates vary by province/state — keep your profile updated' },
    ],
    faq: [
      {
        question: { es: '¿El calendario se adapta a mi país?', en: 'Does the calendar adapt to my country?' },
        answer: { es: 'Sí, muestra fechas fiscales relevantes según el país configurado en tu entidad fiscal activa.', en: 'Yes, it shows relevant tax dates based on the country configured in your active tax entity.' }
      },
    ],
    connections: [
      { es: 'Se alimenta del Perfil de Negocio y conecta con el Dashboard', en: 'Feeds from Business Profile and connects with the Dashboard' },
    ],
    color: 'border-rose-500/30',
  },
  {
    id: 'banking',
    emoji: '🏦',
    title: { es: 'Banking', en: 'Banking' },
    shortDesc: { es: 'Importación de estados de cuenta', en: 'Bank statement import' },
    purpose: {
      es: 'Importa tus estados de cuenta bancarios para tener una visión completa de tus movimientos financieros. Facilita la reconciliación entre lo que registraste y lo que el banco reporta.',
      en: 'Import your bank statements for a complete view of your financial movements. Facilitates reconciliation between what you recorded and what the bank reports.'
    },
    steps: [
      { es: 'Descarga tu estado de cuenta del banco (CSV, Excel)', en: 'Download your bank statement (CSV, Excel)' },
      { es: 'Importa el archivo en la sección Banking', en: 'Import the file in the Banking section' },
      { es: 'El sistema mapea las columnas automáticamente', en: 'The system maps columns automatically' },
      { es: 'Revisa y confirma las transacciones importadas', en: 'Review and confirm imported transactions' },
    ],
    tips: [
      { es: 'Importa mensualmente para mantener datos actualizados', en: 'Import monthly to keep data updated' },
      { es: 'Después de importar, ve a Reconciliación para cruzar datos', en: 'After importing, go to Reconciliation to cross-reference data' },
    ],
    faq: [
      {
        question: { es: '¿Qué formatos acepta?', en: 'What formats does it accept?' },
        answer: { es: 'Soporta archivos CSV y Excel (.xlsx) de la mayoría de bancos.', en: 'Supports CSV and Excel (.xlsx) files from most banks.' }
      },
    ],
    connections: [
      { es: 'Se conecta directamente con Reconciliación para cruzar transacciones', en: 'Connects directly with Reconciliation to cross-reference transactions' },
    ],
    color: 'border-indigo-500/30',
  },
  {
    id: 'net-worth',
    emoji: '📈',
    title: { es: 'Patrimonio Neto', en: 'Net Worth' },
    shortDesc: { es: 'Activos, deudas y meta FIRE', en: 'Assets, debts, and FIRE goal' },
    purpose: {
      es: 'Lleva un registro de todo lo que tienes (activos) y todo lo que debes (deudas). Calcula tu patrimonio neto real y proyecta tu camino hacia la independencia financiera (FIRE).',
      en: 'Keep track of everything you own (assets) and everything you owe (debts). Calculate your real net worth and project your path to financial independence (FIRE).'
    },
    steps: [
      { es: 'Agrega tus activos: propiedades, inversiones, ahorros, vehículos, etc.', en: 'Add your assets: properties, investments, savings, vehicles, etc.' },
      { es: 'Registra tus deudas: hipoteca, préstamos, tarjetas de crédito', en: 'Record your debts: mortgage, loans, credit cards' },
      { es: 'El sistema calcula automáticamente tu patrimonio neto (activos - deudas)', en: 'The system automatically calculates your net worth (assets - debts)' },
      { es: 'Configura tu meta FIRE y ve cuánto falta para la independencia financiera', en: 'Set your FIRE goal and see how far you are from financial independence' },
    ],
    tips: [
      { es: 'Actualiza valores de activos trimestralmente para mantener precisión', en: 'Update asset values quarterly to maintain accuracy' },
      { es: 'Incluye activos intangibles como portafolios de inversión y criptomonedas', en: 'Include intangible assets like investment portfolios and cryptocurrencies' },
    ],
    faq: [
      {
        question: { es: '¿Qué es FIRE?', en: 'What is FIRE?' },
        answer: { es: 'Financial Independence, Retire Early. Un movimiento que busca alcanzar suficiente patrimonio para vivir de inversiones sin necesidad de trabajar.', en: 'Financial Independence, Retire Early. A movement seeking to accumulate enough wealth to live off investments without needing to work.' }
      },
    ],
    connections: [
      { es: 'Se alimenta de Ingresos y Gastos para proyecciones de ahorro', en: 'Feeds from Income and Expenses for savings projections' },
    ],
    color: 'border-emerald-500/30',
  },
  {
    id: 'capture',
    emoji: '📸',
    title: { es: 'Captura Rápida', en: 'Quick Capture' },
    shortDesc: { es: 'Fotos de recibos al instante', en: 'Instant receipt photos' },
    purpose: {
      es: 'Fotografía cualquier recibo desde tu móvil y se guarda inmediatamente en el Chaos Inbox para clasificar después. La idea: captura rápido, organiza después.',
      en: 'Photograph any receipt from your phone and it\'s immediately saved in the Chaos Inbox to classify later. The idea: capture fast, organize later.'
    },
    steps: [
      { es: 'Abre la captura rápida (botón de cámara en navegación móvil)', en: 'Open quick capture (camera button in mobile navigation)' },
      { es: 'Toma la foto del recibo o selecciona una imagen existente', en: 'Take a photo of the receipt or select an existing image' },
      { es: 'Se sube automáticamente al Chaos Inbox', en: 'It automatically uploads to the Chaos Inbox' },
      { es: 'Desde el Chaos Inbox, clasifica en gastos, ingresos o archivos', en: 'From the Chaos Inbox, classify into expenses, income, or files' },
    ],
    tips: [
      { es: 'Toma la foto inmediatamente al recibir el ticket — no esperes', en: 'Take the photo immediately upon receiving the ticket — don\'t wait' },
      { es: 'Asegúrate de buena iluminación para que el texto sea legible', en: 'Ensure good lighting so the text is legible' },
    ],
    faq: [
      {
        question: { es: '¿Se pierde calidad de imagen?', en: 'Is image quality lost?' },
        answer: { es: 'Las imágenes se comprimen inteligentemente manteniendo legibilidad del texto.', en: 'Images are smartly compressed while maintaining text legibility.' }
      },
    ],
    connections: [
      { es: 'Los recibos capturados llegan al Chaos Inbox → se clasifican en Gastos', en: 'Captured receipts arrive in Chaos Inbox → classified into Expenses' },
    ],
    color: 'border-pink-500/30',
  },
  {
    id: 'projects-tags',
    emoji: '🏷️',
    title: { es: 'Proyectos y Tags', en: 'Projects & Tags' },
    shortDesc: { es: 'Organización avanzada de datos', en: 'Advanced data organization' },
    purpose: {
      es: 'Crea proyectos para agrupar gastos e ingresos por iniciativa específica. Los tags te dan flexibilidad adicional para etiquetar transacciones con criterios personalizados.',
      en: 'Create projects to group expenses and income by specific initiative. Tags give you additional flexibility to label transactions with custom criteria.'
    },
    steps: [
      { es: 'Crea un proyecto con nombre, descripción y presupuesto opcional', en: 'Create a project with name, description, and optional budget' },
      { es: 'Asocia gastos e ingresos al proyecto al registrarlos', en: 'Associate expenses and income with the project when recording them' },
      { es: 'Crea tags personalizados (ej: "deducible", "urgente", "vacaciones")', en: 'Create custom tags (e.g., "deductible", "urgent", "vacation")' },
      { es: 'Filtra y reporta por proyecto o tag para análisis específicos', en: 'Filter and report by project or tag for specific analysis' },
    ],
    tips: [
      { es: 'Usa proyectos para trabajos grandes y tags para clasificaciones cruzadas', en: 'Use projects for big jobs and tags for cross-classifications' },
    ],
    faq: [
      {
        question: { es: '¿Cuál es la diferencia entre proyecto y tag?', en: 'What\'s the difference between project and tag?' },
        answer: { es: 'Un proyecto agrupa gastos/ingresos de una iniciativa. Un tag es una etiqueta flexible que puede aplicarse a cualquier transacción sin importar el proyecto.', en: 'A project groups expenses/income of an initiative. A tag is a flexible label applicable to any transaction regardless of project.' }
      },
    ],
    connections: [
      { es: 'Se aplican a Gastos e Ingresos, y se visualizan en informes', en: 'Applied to Expenses and Income, visualized in reports' },
    ],
    color: 'border-violet-500/30',
  },
  {
    id: 'reconciliation',
    emoji: '🔄',
    title: { es: 'Reconciliación', en: 'Reconciliation' },
    shortDesc: { es: 'Cruza banco vs registros', en: 'Cross-reference bank vs records' },
    purpose: {
      es: 'Compara las transacciones importadas del banco con tus registros manuales. Identifica discrepancias, gastos faltantes y errores para mantener tus finanzas 100% precisas.',
      en: 'Compare imported bank transactions with your manual records. Identify discrepancies, missing expenses, and errors to keep your finances 100% accurate.'
    },
    steps: [
      { es: 'Asegúrate de haber importado transacciones bancarias en Banking', en: 'Make sure you\'ve imported bank transactions in Banking' },
      { es: 'Abre Reconciliación para ver transacciones sin emparejar', en: 'Open Reconciliation to see unmatched transactions' },
      { es: 'Empareja manualmente o deja que el sistema sugiera coincidencias', en: 'Match manually or let the system suggest matches' },
      { es: 'Resuelve discrepancias creando los gastos/ingresos faltantes', en: 'Resolve discrepancies by creating missing expenses/income' },
    ],
    tips: [
      { es: 'Reconcilia al menos una vez al mes para detectar errores temprano', en: 'Reconcile at least once a month to detect errors early' },
    ],
    faq: [
      {
        question: { es: '¿El sistema puede reconciliar automáticamente?', en: 'Can the system reconcile automatically?' },
        answer: { es: 'Sugiere coincidencias basadas en montos y fechas similares, pero la confirmación final es manual para mayor precisión.', en: 'It suggests matches based on similar amounts and dates, but final confirmation is manual for greater precision.' }
      },
    ],
    connections: [
      { es: 'Requiere datos de Banking y Gastos para funcionar', en: 'Requires data from Banking and Expenses to work' },
    ],
    color: 'border-teal-500/30',
  },
  {
    id: 'files',
    emoji: '📁',
    title: { es: 'Archivos', en: 'Files' },
    shortDesc: { es: 'Almacenamiento de documentos', en: 'Document storage' },
    purpose: {
      es: 'Almacena documentos financieros importantes: facturas, contratos, declaraciones, comprobantes. Todo organizado y accesible desde un solo lugar.',
      en: 'Store important financial documents: invoices, contracts, declarations, receipts. Everything organized and accessible from one place.'
    },
    steps: [
      { es: 'Sube documentos arrastrándolos o usando el botón de upload', en: 'Upload documents by dragging or using the upload button' },
      { es: 'Los documentos se organizan por tipo y fecha', en: 'Documents are organized by type and date' },
      { es: 'Busca cualquier documento por nombre o contenido', en: 'Search any document by name or content' },
    ],
    tips: [
      { es: 'Sube declaraciones de impuestos anuales como respaldo', en: 'Upload annual tax returns as backup' },
    ],
    faq: [
      {
        question: { es: '¿Cuánto espacio de almacenamiento tengo?', en: 'How much storage space do I have?' },
        answer: { es: 'El espacio depende de tu plan. Los archivos se almacenan de forma segura en la nube.', en: 'Storage depends on your plan. Files are securely stored in the cloud.' }
      },
    ],
    connections: [
      { es: 'Los recibos de Gastos y archivos de Contratos se almacenan aquí', en: 'Receipts from Expenses and Contract files are stored here' },
    ],
    color: 'border-sky-500/30',
  },
  {
    id: 'business-profile',
    emoji: '🏢',
    title: { es: 'Perfil de Negocio', en: 'Business Profile' },
    shortDesc: { es: 'Configuración de entidades fiscales', en: 'Tax entity configuration' },
    purpose: {
      es: 'Configura tus entidades fiscales (persona natural, empresa, LLC) con datos de país, provincia, moneda y régimen fiscal. Esto personaliza toda la experiencia según tu situación.',
      en: 'Configure your tax entities (individual, company, LLC) with country, province, currency, and tax regime data. This personalizes the entire experience to your situation.'
    },
    steps: [
      { es: 'Crea tu entidad fiscal principal con país y tipo', en: 'Create your main tax entity with country and type' },
      { es: 'Agrega datos fiscales: RFC/RUT/NIT, régimen, moneda', en: 'Add tax data: RFC/RUT/NIT, regime, currency' },
      { es: 'Si operas en múltiples países, crea entidades adicionales', en: 'If you operate in multiple countries, create additional entities' },
      { es: 'Selecciona la entidad activa para filtrar datos por contexto', en: 'Select the active entity to filter data by context' },
    ],
    tips: [
      { es: 'Configura tu perfil completo al inicio — esto personaliza calendarios fiscales y monedas', en: 'Complete your profile at the start — this personalizes tax calendars and currencies' },
    ],
    faq: [
      {
        question: { es: '¿Puedo tener múltiples entidades?', en: 'Can I have multiple entities?' },
        answer: { es: 'Sí, puedes crear varias entidades fiscales y cambiar entre ellas. Cada una tiene su propia configuración fiscal y moneda.', en: 'Yes, you can create multiple tax entities and switch between them. Each has its own tax configuration and currency.' }
      },
    ],
    connections: [
      { es: 'Afecta Calendario Fiscal, moneda predeterminada y filtros de datos', en: 'Affects Tax Calendar, default currency, and data filters' },
    ],
    color: 'border-slate-500/30',
  },
  {
    id: 'settings',
    emoji: '⚙️',
    title: { es: 'Configuración', en: 'Settings' },
    shortDesc: { es: 'Preferencias y personalización', en: 'Preferences and customization' },
    purpose: {
      es: 'Personaliza tu experiencia: idioma, tema visual, notificaciones, exportación de datos, y gestión de cuenta. Todo lo que necesitas para que EvoFinz funcione a tu medida.',
      en: 'Customize your experience: language, visual theme, notifications, data export, and account management. Everything you need for EvoFinz to work your way.'
    },
    steps: [
      { es: 'Cambia entre idioma español e inglés', en: 'Switch between Spanish and English' },
      { es: 'Selecciona tu tema visual preferido (claro, oscuro, automático)', en: 'Select your preferred visual theme (light, dark, auto)' },
      { es: 'Configura preferencias de notificaciones', en: 'Configure notification preferences' },
      { es: 'Exporta tus datos en diferentes formatos', en: 'Export your data in different formats' },
    ],
    tips: [
      { es: 'El tema oscuro es ideal para uso nocturno y ahorra batería en OLED', en: 'Dark theme is ideal for nighttime use and saves battery on OLED' },
    ],
    faq: [
      {
        question: { es: '¿Puedo exportar todos mis datos?', en: 'Can I export all my data?' },
        answer: { es: 'Sí, desde Configuración puedes exportar gastos, ingresos y más en formato Excel o PDF.', en: 'Yes, from Settings you can export expenses, income, and more in Excel or PDF format.' }
      },
    ],
    connections: [
      { es: 'Configuraciones globales que afectan toda la experiencia de la app', en: 'Global settings that affect the entire app experience' },
    ],
    color: 'border-gray-500/30',
  },
];

// ─── BLOQUE 3: FAQ GLOBAL ───────────────────────────────────

export const globalFAQ: GuideFAQ[] = [
  {
    question: { es: '¿Mis datos están seguros?', en: 'Is my data secure?' },
    answer: { es: 'Sí. Toda la información se almacena encriptada en servidores seguros. Solo tú tienes acceso a tus datos financieros.', en: 'Yes. All information is stored encrypted on secure servers. Only you have access to your financial data.' }
  },
  {
    question: { es: '¿Puedo usar EvoFinz en el celular?', en: 'Can I use EvoFinz on my phone?' },
    answer: { es: 'Sí, EvoFinz es una aplicación web progresiva (PWA). Puedes instalarla en tu celular como una app nativa desde el navegador.', en: 'Yes, EvoFinz is a progressive web application (PWA). You can install it on your phone as a native app from the browser.' }
  },
  {
    question: { es: '¿Funciona sin internet?', en: 'Does it work offline?' },
    answer: { es: 'La app requiere conexión para sincronizar datos. Sin embargo, puedes ver información previamente cargada.', en: 'The app requires a connection to sync data. However, you can view previously loaded information.' }
  },
  {
    question: { es: '¿Puedo usar EvoFinz para múltiples negocios?', en: 'Can I use EvoFinz for multiple businesses?' },
    answer: { es: 'Sí, con la funcionalidad de Entidades Fiscales puedes gestionar múltiples negocios y países desde una sola cuenta.', en: 'Yes, with the Tax Entities feature you can manage multiple businesses and countries from a single account.' }
  },
  {
    question: { es: '¿Cómo importo datos de otra herramienta?', en: 'How do I import data from another tool?' },
    answer: { es: 'Puedes importar gastos e ingresos desde archivos Excel/CSV. También puedes importar estados de cuenta bancarios desde la sección Banking.', en: 'You can import expenses and income from Excel/CSV files. You can also import bank statements from the Banking section.' }
  },
  {
    question: { es: '¿EvoFinz calcula mis impuestos?', en: 'Does EvoFinz calculate my taxes?' },
    answer: { es: 'EvoFinz te ayuda a organizar y categorizar información fiscal, identificar deducciones y cumplir con fechas límite. No reemplaza a un contador, pero le hace la vida mucho más fácil.', en: 'EvoFinz helps you organize and categorize tax information, identify deductions, and meet deadlines. It doesn\'t replace an accountant, but makes their life much easier.' }
  },
  {
    question: { es: '¿Puedo compartir datos con mi contador?', en: 'Can I share data with my accountant?' },
    answer: { es: 'Sí, puedes exportar informes detallados en Excel o PDF que tu contador puede usar directamente.', en: 'Yes, you can export detailed reports in Excel or PDF that your accountant can use directly.' }
  },
];

// ─── DIAGRAMA DE INTERCONEXIONES ────────────────────────────

export const connectionsDiagram = {
  title: { es: '¿Cómo fluye la información?', en: 'How does information flow?' },
  flows: [
    { from: '📸 Captura', to: '📥 Chaos Inbox', to2: '🧾 Gastos', es: 'Foto → Inbox → Gasto clasificado', en: 'Photo → Inbox → Classified expense' },
    { from: '🧾 Gastos', to: '📊 Dashboard', to2: '🎯 Presupuesto', es: 'Cada gasto actualiza métricas y presupuestos', en: 'Each expense updates metrics and budgets' },
    { from: '💰 Ingresos', to: '📊 Dashboard', to2: '📈 Patrimonio', es: 'Ingresos alimentan balance y proyecciones', en: 'Income feeds balance and projections' },
    { from: '👥 Clientes', to: '💰 Ingresos', to2: '📄 Contratos', es: 'Clientes se vinculan a cobros y acuerdos', en: 'Clients link to payments and agreements' },
    { from: '🏦 Banking', to: '🔄 Reconciliación', to2: '🧾 Gastos', es: 'Datos bancarios se cruzan con registros manuales', en: 'Bank data cross-references manual records' },
    { from: '🏢 Perfil', to: '📅 Calendario Fiscal', to2: '💱 Monedas', es: 'Tu perfil personaliza fechas y moneda predeterminada', en: 'Your profile customizes dates and default currency' },
  ]
};
