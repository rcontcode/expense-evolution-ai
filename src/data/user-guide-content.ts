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
      es: 'EvoFinz es una plataforma integral de gestión financiera personal y profesional diseñada para freelancers, autónomos, pequeñas empresas y cualquier persona que quiera tomar el control total de sus finanzas. Combina en una sola herramienta lo que normalmente necesitarías 5-10 apps separadas: control de gastos, facturación, presupuestos, calendario fiscal, patrimonio neto, análisis bancario inteligente, asistente financiero con IA, gamificación, educación financiera y mucho más.',
      en: 'EvoFinz is a comprehensive personal and professional financial management platform designed for freelancers, self-employed professionals, small businesses, and anyone who wants to take full control of their finances. It combines in one tool what would normally require 5-10 separate apps: expense tracking, invoicing, budgets, tax calendar, net worth, smart bank analysis, AI financial assistant, gamification, financial education, and much more.'
    }
  },
  forWhom: {
    title: { es: '¿Para quién es?', en: 'Who is it for?' },
    items: [
      { emoji: '💼', es: 'Freelancers y trabajadores independientes', en: 'Freelancers and independent workers' },
      { emoji: '🏪', es: 'Dueños de pequeños negocios', en: 'Small business owners' },
      { emoji: '📊', es: 'Personas que quieren organizar sus finanzas', en: 'People who want to organize their finances' },
      { emoji: '🌍', es: 'Profesionales que operan en múltiples países', en: 'Professionals operating in multiple countries' },
      { emoji: '🔥', es: 'Aspirantes al movimiento FIRE (Independencia Financiera)', en: 'FIRE movement aspirants (Financial Independence)' },
      { emoji: '📱', es: 'Cualquiera que guarde recibos en el cajón y quiera orden', en: 'Anyone who keeps receipts in a drawer and wants order' },
      { emoji: '🧮', es: 'Contadores y asesores fiscales de clientes independientes', en: 'Accountants and tax advisors of independent clients' },
      { emoji: '🎓', es: 'Personas que quieren aprender a manejar mejor su dinero', en: 'People who want to learn to manage their money better' },
    ]
  },
  mission: {
    title: { es: 'Nuestra Misión', en: 'Our Mission' },
    desc: {
      es: 'Democratizar la gestión financiera inteligente. Que cada persona, sin importar su nivel de experiencia financiera, pueda tomar decisiones informadas, ahorrar tiempo, maximizar deducciones y construir riqueza a largo plazo. Creemos que la tecnología debe simplificar lo complejo, no complicar lo simple.',
      en: 'Democratize intelligent financial management. So every person, regardless of financial experience, can make informed decisions, save time, maximize deductions, and build long-term wealth. We believe technology should simplify the complex, not complicate the simple.'
    }
  },
  advantages: {
    title: { es: '¿Por qué EvoFinz vs. no usar nada o usar herramientas separadas?', en: 'Why EvoFinz vs. using nothing or separate tools?' },
    items: [
      { emoji: '⏰', es: 'Ahorra 5-10 horas mensuales en organización financiera manual', en: 'Save 5-10 hours monthly on manual financial organization' },
      { emoji: '💸', es: 'Descubre deducciones fiscales que no sabías que tenías (kilometraje, home office, etc.)', en: 'Discover tax deductions you didn\'t know you had (mileage, home office, etc.)' },
      { emoji: '📸', es: 'Nunca más pierdas un recibo — captura instantánea con IA que clasifica por ti', en: 'Never lose a receipt again — instant capture with AI that classifies for you' },
      { emoji: '🧠', es: 'Decisiones basadas en datos reales, no en intuición ni hojas de cálculo dispersas', en: 'Decisions based on real data, not intuition or scattered spreadsheets' },
      { emoji: '🔗', es: 'Todo conectado: gastos, ingresos, clientes, impuestos, patrimonio, presupuesto, banco', en: 'Everything connected: expenses, income, clients, taxes, net worth, budget, bank' },
      { emoji: '📱', es: 'Acceso desde cualquier dispositivo — PWA instalable como app nativa', en: 'Access from any device — installable PWA like a native app' },
      { emoji: '🤖', es: 'Asistente financiero con IA que responde preguntas sobre TUS datos', en: 'AI financial assistant that answers questions about YOUR data' },
      { emoji: '🎮', es: 'Gamificación que convierte el control financiero en una aventura motivante', en: 'Gamification that turns financial control into a motivating adventure' },
      { emoji: '🌐', es: 'Multi-moneda y multi-país: ideal para nómadas digitales y negocios internacionales', en: 'Multi-currency and multi-country: ideal for digital nomads and international businesses' },
      { emoji: '📊', es: 'Informes inteligentes con comparaciones mes a mes generados por IA', en: 'Smart reports with month-to-month comparisons generated by AI' },
      { emoji: '🏦', es: 'Análisis inteligente de estados de cuenta bancarios con detección de anomalías', en: 'Smart bank statement analysis with anomaly detection' },
      { emoji: '📚', es: 'Módulo de educación financiera integrado para crecer mientras gestionas', en: 'Integrated financial education module to grow while you manage' },
    ]
  },
  habit: {
    title: { es: 'El Hábito EvoFinz — 5 Minutos que Cambian tu Vida', en: 'The EvoFinz Habit — 5 Minutes that Change Your Life' },
    desc: {
      es: 'La clave del éxito financiero no es una acción grande, sino pequeñas acciones diarias consistentes. EvoFinz está diseñada para que registrar un gasto tome menos de 30 segundos — puedes dictarlo por voz, escribirlo en lenguaje natural o fotografiar el recibo. Con el hábito de registrar cada transacción, tendrás una foto perfecta de tus finanzas en todo momento.',
      en: 'The key to financial success isn\'t one big action, but small consistent daily actions. EvoFinz is designed so recording an expense takes less than 30 seconds — you can dictate it by voice, write it in natural language, or photograph the receipt. With the habit of recording every transaction, you\'ll have a perfect picture of your finances at all times.'
    },
    steps: [
      { emoji: '☀️', es: 'Mañana: Revisa tu Dashboard (2 min) — ve el panorama del día', en: 'Morning: Check your Dashboard (2 min) — see the day\'s overview' },
      { emoji: '🧾', es: 'Durante el día: Fotografía o dicta cada gasto al instante (30 seg c/u)', en: 'During the day: Photograph or dictate each expense instantly (30 sec each)' },
      { emoji: '🌙', es: 'Noche: Revisa la Bandeja del Caos y clasifica pendientes (3 min)', en: 'Evening: Review the Chaos Inbox and classify pending items (3 min)' },
      { emoji: '📅', es: 'Semanal: Revisa presupuesto, metas y próximas fechas fiscales', en: 'Weekly: Review budget, goals, and upcoming tax dates' },
      { emoji: '📊', es: 'Mensual: Reconcilia con el banco, analiza tendencias y lee tu informe IA', en: 'Monthly: Reconcile with bank, analyze trends, and read your AI report' },
      { emoji: '🏆', es: 'Gana XP y sube de nivel con cada acción — la gamificación te motiva', en: 'Earn XP and level up with each action — gamification keeps you motivated' },
    ]
  },
  improvement: {
    title: { es: 'Mejora Continua Contigo', en: 'Continuous Improvement With You' },
    desc: {
      es: 'EvoFinz evoluciona constantemente basándose en el feedback real de nuestros usuarios. Cada sugerencia y cada opinión contribuye directamente a hacer la plataforma mejor. Puedes reportar problemas, sugerir mejoras y dar feedback desde dentro de la app. Tú eres parte fundamental de esta evolución — y lo valoramos profundamente.',
      en: 'EvoFinz constantly evolves based on real user feedback. Every suggestion and every opinion directly contributes to making the platform better. You can report issues, suggest improvements, and give feedback from within the app. You are a fundamental part of this evolution — and we deeply value it.'
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
      es: 'El Dashboard es tu vista panorámica. De un vistazo ves ingresos vs gastos, presupuestos, metas, calendario fiscal y tendencias. Es el primer lugar que revisas cada mañana para tomar el pulso a tus finanzas. Incluye vistas especializadas como Impuestos, FIRE, Portafolio y el Centro de Control Avanzado con áreas temáticas expandibles.',
      en: 'The Dashboard is your panoramic view. At a glance you see income vs expenses, budgets, goals, tax calendar, and trends. It\'s the first place you check every morning to take the pulse of your finances. Includes specialized views like Taxes, FIRE, Portfolio, and the Advanced Command Center with expandable thematic areas.'
    },
    steps: [
      { es: 'Al ingresar, verás un resumen del mes actual con ingresos, gastos y balance', en: 'Upon entering, you\'ll see a summary of the current month with income, expenses, and balance' },
      { es: 'Las tarjetas superiores muestran métricas clave: balance, gastos pendientes, próximos vencimientos fiscales', en: 'Top cards show key metrics: balance, pending expenses, upcoming tax deadlines' },
      { es: 'Los gráficos muestran tendencias mensuales y distribución por categorías', en: 'Charts show monthly trends and distribution by categories' },
      { es: 'Usa las pestañas para acceder a vistas especializadas (Impuestos, FIRE, Portafolio)', en: 'Use tabs to access specialized views (Taxes, FIRE, Portfolio)' },
      { es: 'Accede al Centro de Control Avanzado con áreas: Negocio, Familia, Día a Día, Crecimiento e Impuestos', en: 'Access the Advanced Command Center with areas: Business, Family, Daily, Growth, and Taxes' },
    ],
    tips: [
      { es: 'Revísalo cada mañana — 2 minutos bastan para mantenerte al día', en: 'Check it every morning — 2 minutes are enough to stay on top' },
      { es: 'Personaliza la entidad activa para ver datos de diferentes negocios/países', en: 'Customize the active entity to see data from different businesses/countries' },
      { es: 'El Centro de Control permite reordenar áreas arrastrándolas según tu prioridad', en: 'The Command Center lets you reorder areas by dragging them per your priority' },
    ],
    faq: [
      {
        question: { es: '¿Puedo ver datos de meses anteriores?', en: 'Can I see data from previous months?' },
        answer: { es: 'Sí, usa los filtros de fecha en la parte superior para navegar entre períodos.', en: 'Yes, use the date filters at the top to navigate between periods.' }
      },
      {
        question: { es: '¿Qué es el Centro de Control Avanzado?', en: 'What is the Advanced Command Center?' },
        answer: { es: 'Es una vista organizada en 5 áreas temáticas (Negocio, Familia, Día a Día, Crecimiento, Impuestos) con KPIs, gráficos y accesos rápidos expandibles. Puedes reordenar las áreas y ver previsualizaciones sin expandirlas.', en: 'It\'s a view organized in 5 thematic areas (Business, Family, Daily, Growth, Taxes) with KPIs, charts, and expandable quick access. You can reorder areas and see previews without expanding them.' }
      },
    ],
    connections: [
      { es: 'Se alimenta de Gastos, Ingresos, Presupuesto, Patrimonio Neto y Calendario Fiscal', en: 'Feeds from Expenses, Income, Budget, Net Worth, and Tax Calendar' },
    ],
    color: 'border-blue-500/30',
  },
  {
    id: 'chaos-inbox',
    emoji: '📥',
    title: { es: 'Bandeja del Caos', en: 'Chaos Inbox' },
    shortDesc: { es: 'Enrutador central de documentos con IA', en: 'AI-powered central document router' },
    purpose: {
      es: 'La Bandeja del Caos es tu punto de entrada universal. Sube cualquier documento financiero (recibos, facturas, contratos, estados de cuenta) y la IA lo clasifica automáticamente en 8 categorías: recibo, factura, contrato, estado de cuenta, comprobante fiscal, nómina, póliza y otro. Para facturas, detecta inteligentemente si es un Ingreso o un Gasto cruzando con tu base de clientes. Captura todo rápido, organiza después.',
      en: 'The Chaos Inbox is your universal entry point. Upload any financial document (receipts, invoices, contracts, bank statements) and AI automatically classifies it into 8 categories: receipt, invoice, contract, bank statement, tax voucher, payroll, policy, and other. For invoices, it intelligently detects if it\'s Income or Expense by cross-referencing your client database. Capture everything fast, organize later.'
    },
    steps: [
      { es: 'Sube uno o múltiples archivos (fotos, PDFs, imágenes) desde cualquier dispositivo', en: 'Upload one or multiple files (photos, PDFs, images) from any device' },
      { es: 'La IA (Gemini 3 Flash) analiza cada documento y extrae datos: monto, fecha, proveedor, categoría', en: 'AI (Gemini 3 Flash) analyzes each document and extracts data: amount, date, vendor, category' },
      { es: 'Revisa la clasificación sugerida y confirma o ajusta', en: 'Review the suggested classification and confirm or adjust' },
      { es: 'Para facturas, el sistema detecta si es Ingreso o Gasto cruzando con tus clientes', en: 'For invoices, the system detects if it\'s Income or Expense by cross-referencing your clients' },
      { es: 'El Centro de Revisión te permite validar y editar metadatos antes de la inserción final', en: 'The Review Center lets you validate and edit metadata before final insertion' },
      { es: 'Al procesar múltiples archivos, se activa el Mago de Configuración automáticamente', en: 'When processing multiple files, the Setup Wizard activates automatically' },
    ],
    tips: [
      { es: 'Sube TODO aquí — no te preocupes por clasificar al momento, la IA lo hace por ti', en: 'Upload EVERYTHING here — don\'t worry about classifying at the moment, AI does it for you' },
      { es: 'Toma fotos de recibos apenas los recibas y súbelos al Caos — clasifica después en la noche', en: 'Take photos of receipts as soon as you get them and upload to Chaos — classify later at night' },
      { es: 'El Mago de Configuración post-subida sugiere presupuestos y metas basados en tus datos', en: 'The post-upload Setup Wizard suggests budgets and goals based on your data' },
      { es: 'Revisa el historial de procesamiento para verificar documentos anteriores', en: 'Check the processing history to verify previous documents' },
    ],
    faq: [
      {
        question: { es: '¿Qué es el Mago de Configuración?', en: 'What is the Setup Wizard?' },
        answer: { es: 'Se activa después de procesar múltiples archivos y te guía en 6 pasos: resumen de procesamiento, verificación de ingresos, detección de recurrencias, asignación a proyectos/clientes, propuesta automática de presupuesto (promedio 3 meses + 10%), y sugerencia de metas de ahorro (20% de capacidad real).', en: 'It activates after processing multiple files and guides you through 6 steps: processing summary, income verification, recurrence detection, project/client assignment, automatic budget proposal (3-month average + 10%), and savings goal suggestion (20% of real capacity).' }
      },
      {
        question: { es: '¿Qué formatos acepta la Bandeja del Caos?', en: 'What formats does the Chaos Inbox accept?' },
        answer: { es: 'Acepta fotos (JPG, PNG, HEIC), documentos PDF, y archivos de Excel/CSV. Incluso puede extraer texto de imágenes borrosas mediante OCR avanzado.', en: 'Accepts photos (JPG, PNG, HEIC), PDF documents, and Excel/CSV files. It can even extract text from blurry images through advanced OCR.' }
      },
      {
        question: { es: '¿Cómo sabe si una factura es ingreso o gasto?', en: 'How does it know if an invoice is income or expense?' },
        answer: { es: 'Cruza el nombre del emisor con tu base de datos de clientes. Si coincide con un cliente registrado, sugiere que es un Ingreso (pago de cliente). Si no, sugiere Gasto. Siempre pide confirmación manual para mayor precisión.', en: 'Cross-references the issuer name with your client database. If it matches a registered client, it suggests Income (client payment). If not, it suggests Expense. Always asks for manual confirmation for greater precision.' }
      },
    ],
    connections: [
      { es: 'Recibe archivos de Captura Rápida y Captura Inteligente', en: 'Receives files from Quick Capture and Smart Capture' },
      { es: 'Envía documentos clasificados a Gastos, Ingresos, Contratos o Archivos', en: 'Sends classified documents to Expenses, Income, Contracts, or Files' },
      { es: 'El Mago de Configuración genera presupuestos y metas automáticas', en: 'The Setup Wizard generates automatic budgets and goals' },
    ],
    color: 'border-yellow-500/30',
  },
  {
    id: 'voice-assistant',
    emoji: '🎤',
    title: { es: 'Asistente Phoenix', en: 'Phoenix Assistant' },
    shortDesc: { es: 'Tu asistente financiero con voz e IA', en: 'Your AI-powered voice financial assistant' },
    purpose: {
      es: 'Phoenix es tu asistente financiero personal. Puedes hablarle por voz o escribirle en lenguaje natural para registrar gastos, consultar tus datos, pedir análisis y más. Usa síntesis de voz de alta calidad (ElevenLabs) con fallback automático, y entiende contexto financiero completo.',
      en: 'Phoenix is your personal financial assistant. Talk to it by voice or type in natural language to record expenses, query your data, request analyses, and more. Uses high-quality voice synthesis (ElevenLabs) with automatic fallback, and understands full financial context.'
    },
    steps: [
      { es: 'Abre el asistente desde el botón flotante en cualquier pantalla', en: 'Open the assistant from the floating button on any screen' },
      { es: 'Escribe o mantén presionado el micrófono para hablar', en: 'Type or hold the microphone button to speak' },
      { es: 'Pide cosas como "registra un gasto de $50 en comida" o "¿cuánto gasté este mes?"', en: 'Ask things like "record a $50 food expense" or "how much did I spend this month?"' },
      { es: 'Configura tu voz preferida en el selector de voces (20 opciones premium)', en: 'Configure your preferred voice in the voice selector (20 premium options)' },
      { es: 'El asistente recuerda el contexto de la conversación para respuestas más inteligentes', en: 'The assistant remembers conversation context for smarter responses' },
    ],
    tips: [
      { es: 'Usa Push-to-Talk para mejor precisión — mantén presionado mientras hablas', en: 'Use Push-to-Talk for better accuracy — hold while speaking' },
      { es: 'Puedes dictar gastos e ingresos completos por voz, Phoenix los crea automáticamente', en: 'You can dictate complete expenses and income by voice, Phoenix creates them automatically' },
      { es: 'Pregúntale análisis como "¿cuál es mi cliente más rentable?" o "¿estoy dentro del presupuesto?"', en: 'Ask for analyses like "which is my most profitable client?" or "am I within budget?"' },
    ],
    faq: [
      { question: { es: '¿El asistente de voz funciona en todos los navegadores?', en: 'Does the voice assistant work in all browsers?' }, answer: { es: 'Sí, usa Web Speech API con fallback automático. Para la mejor experiencia de voz, usa Chrome. La síntesis premium (ElevenLabs) funciona en todos los navegadores.', en: 'Yes, it uses Web Speech API with automatic fallback. For the best voice experience, use Chrome. Premium synthesis (ElevenLabs) works in all browsers.' } },
    ],
    connections: [
      { es: 'Crea gastos e ingresos directamente por voz', en: 'Creates expenses and income directly by voice' },
      { es: 'Consulta datos del Dashboard, presupuesto y patrimonio', en: 'Queries Dashboard, budget, and net worth data' },
      { es: 'Disponible en toda la aplicación como botón flotante', en: 'Available throughout the app as a floating button' },
    ],
    color: 'border-violet-500/30',
  },
  {
    id: 'tax-optimizer',
    emoji: '🧮',
    title: { es: 'Optimizador Fiscal', en: 'Tax Optimizer' },
    shortDesc: { es: 'Maximiza tus deducciones y ahorro fiscal', en: 'Maximize your deductions and tax savings' },
    purpose: {
      es: 'Analiza todos tus gastos deducibles, identifica oportunidades de ahorro fiscal que podrías estar perdiendo, y proyecta cuánto puedes ahorrar con estrategias como RRSP, TFSA (Canadá) o APV (Chile). Incluye countdown para fechas límite y checklist de documentos.',
      en: 'Analyzes all your deductible expenses, identifies tax-saving opportunities you might be missing, and projects how much you can save with strategies like RRSP, TFSA (Canada) or APV (Chile). Includes deadline countdown and document checklist.'
    },
    steps: [
      { es: 'Accede desde el menú Impuestos → Optimizador Fiscal', en: 'Access from the Taxes menu → Tax Optimizer' },
      { es: 'Revisa el resumen de deducciones identificadas automáticamente', en: 'Review the summary of automatically identified deductions' },
      { es: 'Explora las proyecciones de ahorro por categoría (RRSP, home office, kilometraje)', en: 'Explore savings projections by category (RRSP, home office, mileage)' },
      { es: 'Verifica el countdown para tu próxima fecha límite fiscal', en: 'Check the countdown for your next tax deadline' },
      { es: 'Completa el checklist de documentos necesarios para tu declaración', en: 'Complete the checklist of documents needed for your tax return' },
    ],
    tips: [
      { es: 'Revisa el optimizador mensualmente para no perder deducciones al cierre del año', en: 'Review the optimizer monthly so you don\'t miss deductions at year-end' },
      { es: 'Las proyecciones se basan en tus datos reales — mientras más registres, más preciso es', en: 'Projections are based on your real data — the more you record, the more accurate it gets' },
    ],
    faq: [
      { question: { es: '¿Esto reemplaza a mi contador?', en: 'Does this replace my accountant?' }, answer: { es: 'No, complementa su trabajo. El optimizador identifica oportunidades y organiza documentos para que tu contador trabaje más eficientemente.', en: 'No, it complements their work. The optimizer identifies opportunities and organizes documents so your accountant works more efficiently.' } },
    ],
    connections: [
      { es: 'Lee gastos deducibles de Gastos e Ingresos', en: 'Reads deductible items from Expenses and Income' },
      { es: 'Se conecta con el Flujo de Reporte Fiscal para exportar', en: 'Connects with Tax Report Flow for export' },
      { es: 'Usa las fechas del Calendario Fiscal para el countdown', en: 'Uses Tax Calendar dates for the countdown' },
    ],
    color: 'border-amber-500/30',
  },
  {
    id: 'tax-report-flow',
    emoji: '📋',
    title: { es: 'Flujo de Reporte al Contador', en: 'Accountant Report Flow' },
    shortDesc: { es: 'Preparación fiscal guiada en 5 pasos', en: 'Guided tax preparation in 5 steps' },
    purpose: {
      es: 'Un centro de mando guiado que te lleva paso a paso desde la captura de datos hasta la generación del reporte final para tu contador. Soporta CRA (Canadá) y SII (Chile). Incluye seguimiento de progreso en tiempo real, detección de cuellos de botella y cuenta regresiva para la fecha límite.',
      en: 'A guided command center that takes you step by step from data capture to generating the final report for your accountant. Supports CRA (Canada) and SII (Chile). Includes real-time progress tracking, bottleneck detection, and deadline countdown.'
    },
    steps: [
      { es: 'Paso 1 — Capturar: Asegura que todos tus gastos e ingresos estén registrados', en: 'Step 1 — Capture: Ensure all your expenses and income are recorded' },
      { es: 'Paso 2 — Categorizar: Clasifica los items pendientes en la categoría correcta', en: 'Step 2 — Categorize: Classify pending items into the correct category' },
      { es: 'Paso 3 — Revisar: Verifica que no haya inconsistencias ni registros duplicados', en: 'Step 3 — Review: Verify there are no inconsistencies or duplicate records' },
      { es: 'Paso 4 — Optimizar: Maximiza tus deducciones antes de declarar', en: 'Step 4 — Optimize: Maximize your deductions before filing' },
      { es: 'Paso 5 — Exportar: Genera el reporte Excel/PDF listo para tu contador', en: 'Step 5 — Export: Generate the Excel/PDF report ready for your accountant' },
    ],
    tips: [
      { es: 'Comienza este flujo al menos 2 semanas antes de la fecha límite', en: 'Start this flow at least 2 weeks before the deadline' },
      { es: 'El sistema detecta automáticamente qué pasos tienen items pendientes', en: 'The system automatically detects which steps have pending items' },
    ],
    faq: [
      { question: { es: '¿Qué formatos de reporte genera?', en: 'What report formats does it generate?' }, answer: { es: 'Genera reportes en Excel (.xlsx) con hojas separadas por categoría, periodo y tipo. También puede exportar en PDF con gráficos incluidos.', en: 'It generates Excel (.xlsx) reports with separate sheets by category, period, and type. It can also export in PDF with charts included.' } },
    ],
    connections: [
      { es: 'Agrega datos de Gastos, Ingresos y Bandeja del Caos', en: 'Aggregates data from Expenses, Income, and Chaos Inbox' },
      { es: 'Usa el Optimizador Fiscal para el paso de optimización', en: 'Uses Tax Optimizer for the optimization step' },
      { es: 'Exporta a Configuración → Exportar', en: 'Exports to Settings → Export' },
    ],
    color: 'border-orange-500/30',
  },
  {
    id: 'subscriptions',
    emoji: '🔍',
    title: { es: 'Suscripciones y Detector de Fantasmas', en: 'Subscriptions & Ghost Detector' },
    shortDesc: { es: 'Encuentra y elimina suscripciones que ya no usas', en: 'Find and eliminate subscriptions you no longer use' },
    purpose: {
      es: 'Analiza tus gastos recurrentes para detectar suscripciones "fantasma" — servicios que sigues pagando pero no usas. Muestra patrones de pago, agrupa por proveedor y te ayuda a decidir qué cancelar para ahorrar dinero.',
      en: 'Analyzes your recurring expenses to detect "ghost" subscriptions — services you keep paying for but don\'t use. Shows payment patterns, groups by vendor, and helps you decide what to cancel to save money.'
    },
    steps: [
      { es: 'Accede desde el menú lateral → Suscripciones', en: 'Access from the sidebar → Subscriptions' },
      { es: 'Revisa la lista de suscripciones detectadas automáticamente', en: 'Review the list of automatically detected subscriptions' },
      { es: 'Identifica las marcadas como "fantasma" (pagos sin uso detectado)', en: 'Identify those marked as "ghost" (payments with no detected usage)' },
      { es: 'Convierte suscripciones a pagos fijos recurrentes si las quieres mantener', en: 'Convert subscriptions to recurring fixed payments if you want to keep them' },
    ],
    tips: [
      { es: 'Revisa las suscripciones fantasma mensualmente — puedes ahorrar $50-200/mes', en: 'Review ghost subscriptions monthly — you can save $50-200/month' },
      { es: 'El detector mejora con más datos — registra todos tus gastos para mejor detección', en: 'The detector improves with more data — record all expenses for better detection' },
    ],
    faq: [
      { question: { es: '¿Cómo detecta suscripciones fantasma?', en: 'How does it detect ghost subscriptions?' }, answer: { es: 'Analiza patrones de gasto recurrente por proveedor y monto. Si detecta un patrón mensual/anual consistente, lo marca como suscripción y evalúa si hay indicadores de uso activo.', en: 'It analyzes recurring spending patterns by vendor and amount. If it detects a consistent monthly/annual pattern, it marks it as a subscription and evaluates whether there are active usage indicators.' } },
    ],
    connections: [
      { es: 'Lee datos de Gastos para detectar patrones recurrentes', en: 'Reads Expenses data to detect recurring patterns' },
      { es: 'Se conecta con Pagos Fijos para convertir suscripciones activas', en: 'Connects with Recurring Bills to convert active subscriptions' },
      { es: 'Alimenta el Presupuesto con gastos fijos identificados', en: 'Feeds Budget with identified fixed expenses' },
    ],
    color: 'border-red-500/30',
  },
  {
    id: 'data-health',
    emoji: '🩺',
    title: { es: 'Salud de Datos', en: 'Data Health' },
    shortDesc: { es: 'Auditoría de calidad y consistencia de tus registros', en: 'Quality and consistency audit of your records' },
    purpose: {
      es: 'Herramienta de diagnóstico que revisa todos tus datos financieros buscando problemas: gastos sin categoría, registros con clientes o proyectos eliminados, ingresos sin entidad fiscal, y más. Te da un score de salud y te guía para corregir cada problema.',
      en: 'Diagnostic tool that reviews all your financial data looking for issues: uncategorized expenses, records with deleted clients or projects, income without fiscal entity, and more. Gives you a health score and guides you to fix each issue.'
    },
    steps: [
      { es: 'Accede desde Herramientas Avanzadas → Salud de Datos', en: 'Access from Advanced Tools → Data Health' },
      { es: 'Revisa el score general de salud de tus datos', en: 'Review the overall health score of your data' },
      { es: 'Explora los problemas agrupados por tipo (sin categoría, referencias rotas, etc.)', en: 'Explore issues grouped by type (uncategorized, broken references, etc.)' },
      { es: 'Haz clic en cada problema para ir directamente al registro y corregirlo', en: 'Click each issue to go directly to the record and fix it' },
    ],
    tips: [
      { es: 'Ejecuta la auditoría de salud mensualmente para mantener datos limpios', en: 'Run the health audit monthly to keep data clean' },
      { es: 'Los datos limpios generan reportes fiscales más precisos y mejores análisis IA', en: 'Clean data generates more accurate tax reports and better AI analyses' },
    ],
    faq: [
      { question: { es: '¿Qué tipos de problemas detecta?', en: 'What types of issues does it detect?' }, answer: { es: 'Detecta gastos sin categoría, referencias rotas (cliente/proyecto eliminado), ingresos sin entidad fiscal, registros duplicados potenciales y más.', en: 'It detects uncategorized expenses, broken references (deleted client/project), income without fiscal entity, potential duplicate records, and more.' } },
    ],
    connections: [
      { es: 'Analiza datos de Gastos, Ingresos, Clientes y Proyectos', en: 'Analyzes data from Expenses, Income, Clients, and Projects' },
      { es: 'Complementa el Flujo de Reporte Fiscal (paso de Revisión)', en: 'Complements Tax Report Flow (Review step)' },
    ],
    color: 'border-teal-500/30',
  },
  {
    id: 'mentorship',
    emoji: '🧙',
    title: { es: 'Mentoría Financiera', en: 'Financial Mentorship' },
    shortDesc: { es: 'Sistema de niveles con sabiduría de expertos', en: 'Level system with expert wisdom' },
    purpose: {
      es: 'Un sistema de mentoría progresivo donde subes de nivel según tu actividad financiera. En cada nivel recibes tips rotativos de expertos financieros reconocidos (Robert Kiyosaki, Dave Ramsey, Jim Rohn, Brian Tracy). Incluye logros desbloqueables, metas de progreso y celebraciones épicas.',
      en: 'A progressive mentorship system where you level up based on your financial activity. At each level you receive rotating tips from recognized financial experts (Robert Kiyosaki, Dave Ramsey, Jim Rohn, Brian Tracy). Includes unlockable achievements, progress goals, and epic celebrations.'
    },
    steps: [
      { es: 'Accede desde el menú → Mentoría o desde el banner en el Dashboard', en: 'Access from the menu → Mentorship or from the Dashboard banner' },
      { es: 'Revisa tu nivel actual y los tips del experto del momento', en: 'Review your current level and tips from the current expert' },
      { es: 'Completa los Desafíos Semanales — retos automáticos que miden tu progreso real', en: 'Complete Weekly Challenges — automatic challenges that measure your real progress' },
      { es: 'Usa el Acompañante de Lectura (tab Rohn → Educación) para trackear tu ritmo de lectura vs promedio global', en: 'Use the Reading Companion (Rohn tab → Education) to track your reading pace vs global average' },
      { es: 'Sigue tu Ruta de Aprendizaje personalizada con sugerencias dinámicas', en: 'Follow your personalized Learning Path with dynamic suggestions' },
      { es: 'Los tips rotan cada 8 segundos con sabiduría práctica aplicable', en: 'Tips rotate every 8 seconds with practical applicable wisdom' },
    ],
    tips: [
      { es: 'Cada acción financiera te da XP — registrar gastos, crear clientes, importar datos', en: 'Every financial action gives you XP — recording expenses, creating clients, importing data' },
      { es: 'Los Desafíos Semanales se completan automáticamente cuando realizas las acciones en la app', en: 'Weekly Challenges complete automatically when you perform the actions in the app' },
      { es: 'El Acompañante de Lectura muestra gráficas de tu ritmo y predicción de finalización', en: 'The Reading Companion shows charts of your pace and completion prediction' },
      { es: 'Aplica los tips de los expertos a tu vida real — es la verdadera transformación', en: 'Apply expert tips to your real life — that\'s the real transformation' },
    ],
    faq: [
      { question: { es: '¿Cómo subo de nivel?', en: 'How do I level up?' }, answer: { es: 'Ganas XP con cada acción financiera: registrar gastos/ingresos, categorizar, importar datos bancarios, mantener rachas diarias, completar hábitos financieros, etc. Al acumular suficiente XP, subes de nivel automáticamente.', en: 'You earn XP with every financial action: recording expenses/income, categorizing, importing bank data, maintaining daily streaks, completing financial habits, etc. When you accumulate enough XP, you level up automatically.' } },
    ],
    connections: [
      { es: 'Lee tu progreso de Gamificación y XP acumulado', en: 'Reads your Gamification progress and accumulated XP' },
      { es: 'Conectado con Hábitos Financieros y Educación', en: 'Connected with Financial Habits and Education' },
      { es: 'Las celebraciones aparecen en cualquier pantalla al desbloquear logros', en: 'Celebrations appear on any screen when unlocking achievements' },
    ],
    color: 'border-purple-500/30',
  },
  {
    id: 'expenses',
    emoji: '🧾',
    title: { es: 'Gastos', en: 'Expenses' },
    shortDesc: { es: 'Registro completo de todos tus gastos', en: 'Complete record of all your expenses' },
    purpose: {
      es: 'Registra cada peso/dólar que sale de tu bolsillo. Categoriza, adjunta recibos, marca deducciones fiscales y asocia gastos a clientes, proyectos o contratos. Es la base de tu salud financiera. Incluye soft-delete (papelera), multi-moneda con conversión automática, y tags personalizados para organización avanzada.',
      en: 'Record every penny that leaves your pocket. Categorize, attach receipts, mark tax deductions, and associate expenses with clients, projects, or contracts. It\'s the foundation of your financial health. Includes soft-delete (trash), multi-currency with auto-conversion, and custom tags for advanced organization.'
    },
    steps: [
      { es: 'Crea un gasto: "+ Gasto", captura rápida, texto natural o voz al Asistente', en: 'Create an expense: "+ Expense", quick capture, natural text, or voice to Assistant' },
      { es: 'Llena monto, fecha, categoría, descripción y proveedor', en: 'Fill in amount, date, category, description, and vendor' },
      { es: 'Adjunta recibo (foto o PDF) — queda vinculado al gasto permanentemente', en: 'Attach receipt (photo or PDF) — stays linked to the expense permanently' },
      { es: 'Marca si es deducible de impuestos y el tipo de reembolso si aplica', en: 'Mark if tax-deductible and reimbursement type if applicable' },
      { es: 'Asocia a cliente, proyecto y/o contrato para tracking de rentabilidad', en: 'Associate with client, project, and/or contract for profitability tracking' },
      { es: 'Aplica tags para clasificaciones personalizadas cruzadas', en: 'Apply tags for custom cross-classifications' },
      { es: 'Usa filtros avanzados por categoría, fecha, monto, cliente o tag', en: 'Use advanced filters by category, date, amount, client, or tag' },
    ],
    tips: [
      { es: 'Registra gastos al instante — si lo dejas para después, lo olvidas', en: 'Record expenses instantly — if you leave it for later, you\'ll forget' },
      { es: 'Usa tags para agrupar gastos por propósito: "deducible", "reembolsable", "personal"', en: 'Use tags to group expenses by purpose: "deductible", "reimbursable", "personal"' },
      { es: 'Revisa categorías mensualmente para detectar patrones de gasto y oportunidades de ahorro', en: 'Review categories monthly to detect spending patterns and savings opportunities' },
      { es: 'Los gastos en moneda extranjera se convierten automáticamente a tu moneda base', en: 'Foreign currency expenses are automatically converted to your base currency' },
    ],
    faq: [
      {
        question: { es: '¿Puedo editar un gasto después de crearlo?', en: 'Can I edit an expense after creating it?' },
        answer: { es: 'Sí, haz clic en cualquier gasto de la lista para editarlo. Todos los campos son modificables incluyendo recibos adjuntos.', en: 'Yes, click on any expense in the list to edit it. All fields are modifiable including attached receipts.' }
      },
      {
        question: { es: '¿Qué pasa si borro un gasto por error?', en: 'What if I delete an expense by mistake?' },
        answer: { es: 'Los gastos eliminados van a la Papelera (soft-delete) donde puedes restaurarlos dentro de 30 días antes de la eliminación permanente.', en: 'Deleted expenses go to the Trash (soft-delete) where you can restore them within 30 days before permanent deletion.' }
      },
      {
        question: { es: '¿Puedo registrar gastos en diferentes monedas?', en: 'Can I record expenses in different currencies?' },
        answer: { es: 'Sí, selecciona la moneda original del gasto y el sistema usa tasas de cambio actualizadas para convertir a tu moneda base. La tasa utilizada queda registrada para auditoría.', en: 'Yes, select the original currency of the expense and the system uses updated exchange rates to convert to your base currency. The rate used is recorded for auditing.' }
      },
    ],
    connections: [
      { es: 'Se refleja en Dashboard, Presupuesto, Reconciliación e Informes Fiscales', en: 'Reflects in Dashboard, Budget, Reconciliation, and Tax Reports' },
      { es: 'Puede asociarse a Clientes, Proyectos, Contratos y Tags', en: 'Can be associated with Clients, Projects, Contracts, and Tags' },
      { es: 'Alimenta la Puntuación de Impulso Monetario y las Alertas Inteligentes', en: 'Feeds the Money Momentum Score and Smart Alerts' },
    ],
    color: 'border-red-500/30',
  },
  {
    id: 'income',
    emoji: '💰',
    title: { es: 'Ingresos', en: 'Income' },
    shortDesc: { es: 'Controla todo el dinero que entra', en: 'Track all money coming in' },
    purpose: {
      es: 'Registra todos tus ingresos: facturación a clientes, salarios, inversiones, freelance, dividendos, alquileres y más. Asocia ingresos a clientes para saber exactamente quién te genera más valor. Configura recurrencia para ingresos fijos y marca gravabilidad fiscal para preparar declaraciones.',
      en: 'Record all your income: client billing, salaries, investments, freelance, dividends, rentals, and more. Associate income with clients to know exactly who generates the most value. Configure recurrence for fixed income and mark tax liability for preparing returns.'
    },
    steps: [
      { es: 'Crea un nuevo ingreso con monto, fecha, tipo y fuente', en: 'Create a new income with amount, date, type, and source' },
      { es: 'Selecciona tipo: facturación, salario, inversión, freelance, dividendo, alquiler, etc.', en: 'Select type: billing, salary, investment, freelance, dividend, rental, etc.' },
      { es: 'Asocia al cliente que te pagó (muy recomendado para análisis de rentabilidad)', en: 'Associate the client who paid you (highly recommended for profitability analysis)' },
      { es: 'Configura recurrencia si es ingreso fijo: mensual, quincenal, semanal', en: 'Set recurrence for fixed income: monthly, bi-weekly, weekly' },
      { es: 'Marca si es gravable para cálculos fiscales automáticos', en: 'Mark if taxable for automatic tax calculations' },
      { es: 'Asocia a proyecto específico si aplica', en: 'Associate with specific project if applicable' },
    ],
    tips: [
      { es: 'Asocia siempre ingresos a clientes — el análisis de rentabilidad te revela quién vale la pena', en: 'Always associate income with clients — profitability analysis reveals who\'s worth it' },
      { es: 'Marca ingresos gravables para que el informe fiscal sea preciso', en: 'Mark taxable income so the tax report is accurate' },
      { es: 'Usa la recurrencia para ingresos fijos y evita registrarlos cada mes manualmente', en: 'Use recurrence for fixed income to avoid registering them manually each month' },
    ],
    faq: [
      {
        question: { es: '¿Puedo registrar ingresos en diferentes monedas?', en: 'Can I register income in different currencies?' },
        answer: { es: 'Sí, EvoFinz soporta múltiples monedas y convierte automáticamente según tasas de cambio. Ideal para freelancers que cobran en USD, EUR, CAD, etc.', en: 'Yes, EvoFinz supports multiple currencies and converts automatically based on exchange rates. Ideal for freelancers billing in USD, EUR, CAD, etc.' }
      },
      {
        question: { es: '¿Cómo funciona la recurrencia?', en: 'How does recurrence work?' },
        answer: { es: 'Al marcar un ingreso como recurrente, el sistema genera automáticamente un registro cada período (mensual, quincenal, etc.) hasta la fecha de fin que configures.', en: 'When marking income as recurring, the system automatically generates a record each period (monthly, bi-weekly, etc.) until the end date you configure.' }
      },
    ],
    connections: [
      { es: 'Alimenta Dashboard, Patrimonio Neto y análisis de rentabilidad por cliente', en: 'Feeds Dashboard, Net Worth, and profitability analysis by client' },
      { es: 'Vinculado con Clientes para tracking de pagos y cobros', en: 'Linked with Clients for payment and billing tracking' },
      { es: 'Alimenta cálculos fiscales y proyecciones FIRE', en: 'Feeds tax calculations and FIRE projections' },
    ],
    color: 'border-green-500/30',
  },
  {
    id: 'clients',
    emoji: '👥',
    title: { es: 'Clientes', en: 'Clients' },
    shortDesc: { es: 'Gestión completa de tus clientes', en: 'Complete client management' },
    purpose: {
      es: 'Centraliza toda la información de tus clientes: datos de contacto, ubicación geográfica, historial de facturación, contratos asociados y análisis de rentabilidad. Incluye perfiles de facturación pre-configurados, soporte multi-moneda por cliente, y tipo de cliente (persona/empresa). Sabe exactamente cuánto te genera cada cliente y cuánto gastas en servirlo.',
      en: 'Centralize all client information: contact data, geographic location, billing history, associated contracts, and profitability analysis. Includes pre-configured billing profiles, per-client multi-currency support, and client type (individual/company). Know exactly how much each client generates and how much you spend serving them.'
    },
    steps: [
      { es: 'Agrega cliente con nombre, email, teléfono, dirección y datos fiscales (RUT para Chile o Business Number para Canadá)', en: 'Add client with name, email, phone, address, and tax data (RUT for Chile or Business Number for Canada)' },
      { es: 'Configura país, provincia, moneda y condiciones de pago (30, 60, 90 días)', en: 'Configure country, province, currency, and payment terms (30, 60, 90 days)' },
      { es: 'Asocia gastos e ingresos al cliente para tracking de rentabilidad', en: 'Associate expenses and income with client for profitability tracking' },
      { es: 'Vincula contratos activos al perfil del cliente', en: 'Link active contracts to client profile' },
      { es: 'Usa el mapa de ubicación para visualizar distribución geográfica de clientes', en: 'Use the location map to visualize geographic distribution of clients' },
      { es: 'Revisa historial completo de transacciones y rentabilidad por cliente', en: 'Review complete transaction history and profitability per client' },
    ],
    tips: [
      { es: 'Completa datos fiscales del cliente para facturación y reportes automáticos', en: 'Complete client tax data for automatic invoicing and reports' },
      { es: 'Usa el perfil de facturación para generar documentos pre-llenados rápidamente', en: 'Use billing profile to quickly generate pre-filled documents' },
      { es: 'La Bandeja del Caos cruza facturas con tu base de clientes — mantén tus clientes actualizados', en: 'Chaos Inbox cross-references invoices with your client base — keep clients updated' },
    ],
    faq: [
      {
        question: { es: '¿Puedo tener clientes de diferentes países?', en: 'Can I have clients from different countries?' },
        answer: { es: 'Sí, cada cliente tiene su propia moneda, país y provincia. Ideal para freelancers internacionales y nómadas digitales.', en: 'Yes, each client has their own currency, country, and province. Ideal for international freelancers and digital nomads.' }
      },
      {
        question: { es: '¿Puedo ver la rentabilidad de cada cliente?', en: 'Can I see each client\'s profitability?' },
        answer: { es: 'Sí, al asociar gastos e ingresos a un cliente, el sistema calcula automáticamente cuánto te genera vs cuánto te cuesta servirlo.', en: 'Yes, by associating expenses and income to a client, the system automatically calculates how much they generate vs how much it costs to serve them.' }
      },
    ],
    connections: [
      { es: 'Se vincula con Ingresos, Gastos, Contratos, Proyectos y Bandeja del Caos', en: 'Links with Income, Expenses, Contracts, Projects, and Chaos Inbox' },
    ],
    color: 'border-purple-500/30',
  },
  {
    id: 'contracts',
    emoji: '📄',
    title: { es: 'Contratos', en: 'Contracts' },
    shortDesc: { es: 'Seguimiento de todos tus acuerdos', en: 'Track all your agreements' },
    purpose: {
      es: 'Sube tus contratos y la IA puede extraer términos clave automáticamente. Monitorea fechas de vencimiento, renovaciones automáticas, valores y gastos reembolsables asociados. Incluye alertas proactivas para contratos que se acercan a su fecha de renovación. Nunca más te toma por sorpresa un contrato.',
      en: 'Upload your contracts and AI can automatically extract key terms. Monitor expiration dates, auto-renewals, values, and associated reimbursable expenses. Includes proactive alerts for contracts approaching renewal. Never be caught off guard by a contract again.'
    },
    steps: [
      { es: 'Sube el archivo del contrato (PDF, imagen) — la IA extrae términos clave', en: 'Upload the contract file (PDF, image) — AI extracts key terms' },
      { es: 'Completa o verifica: título, cliente, valor, fechas de inicio/fin', en: 'Complete or verify: title, client, value, start/end dates' },
      { es: 'Configura auto-renovación y días de aviso previo', en: 'Configure auto-renewal and advance notice days' },
      { es: 'Asocia gastos reembolsables al contrato para tracking', en: 'Associate reimbursable expenses with contract for tracking' },
      { es: 'Agrega notas y términos de reembolso si aplica', en: 'Add notes and reimbursement terms if applicable' },
    ],
    tips: [
      { es: 'Configura alertas de renovación con suficiente antelación para negociar', en: 'Set renewal alerts with enough advance time to negotiate' },
      { es: 'Usa notas para registrar acuerdos verbales o modificaciones post-firma', en: 'Use notes to record verbal agreements or post-signing modifications' },
      { es: 'Sube contratos a la Bandeja del Caos y se clasifican automáticamente', en: 'Upload contracts to the Chaos Inbox and they\'re classified automatically' },
    ],
    faq: [
      {
        question: { es: '¿La IA puede leer mis contratos?', en: 'Can AI read my contracts?' },
        answer: { es: 'Sí, la IA puede extraer información clave como partes involucradas, fechas, valores, cláusulas de renovación y términos de pago. Siempre puedes verificar y editar lo extraído.', en: 'Yes, AI can extract key information like involved parties, dates, values, renewal clauses, and payment terms. You can always verify and edit what was extracted.' }
      },
    ],
    connections: [
      { es: 'Se vincula con Clientes, Gastos (reembolsables), Calendario Fiscal y Bandeja del Caos', en: 'Links with Clients, Expenses (reimbursable), Tax Calendar, and Chaos Inbox' },
    ],
    color: 'border-amber-500/30',
  },
  {
    id: 'budget',
    emoji: '🎯',
    title: { es: 'Presupuesto y Pagos Fijos', en: 'Budget & Fixed Payments' },
    shortDesc: { es: 'Metas de gasto, pagos recurrentes y ahorro', en: 'Spending goals, recurring payments, and savings' },
    purpose: {
      es: 'Define cuánto quieres gastar por categoría cada mes, registra tus pagos fijos recurrentes (servicios, suscripciones, seguros) y establece metas de ahorro con plazos. El sistema te alerta cuando te acercas a tus límites (configurables al 80%, 90% o 100%). Incluye rollover automático de lo no gastado y generación automática de presupuestos sugeridos por el Mago de Configuración.',
      en: 'Define how much you want to spend per category each month, record recurring fixed payments (services, subscriptions, insurance), and set savings goals with deadlines. The system alerts when you approach limits (configurable at 80%, 90%, or 100%). Includes automatic rollover of unspent amounts and automatic budget generation suggested by the Setup Wizard.'
    },
    steps: [
      { es: 'Define presupuestos mensuales por categoría (ej: Alimentación $500, Transporte $200)', en: 'Set monthly budgets by category (e.g., Food $500, Transportation $200)' },
      { es: 'Registra pagos fijos recurrentes: luz, agua, internet, seguros, suscripciones', en: 'Record recurring fixed payments: electricity, water, internet, insurance, subscriptions' },
      { es: 'Establece metas de ahorro con plazo, monto objetivo y contribución mensual', en: 'Set savings goals with deadline, target amount, and monthly contribution' },
      { es: 'Configura alertas de umbral para reaccionar antes de sobrepasar el límite', en: 'Configure threshold alerts to react before exceeding the limit' },
      { es: 'Monitorea barras de progreso visual por categoría durante el mes', en: 'Monitor visual progress bars by category during the month' },
      { es: 'Marca pagos fijos como pagados cada mes (o crea el gasto asociado automáticamente)', en: 'Mark fixed payments as paid each month (or auto-create the associated expense)' },
    ],
    tips: [
      { es: 'Empieza con pocas categorías e incrementa gradualmente según aprendas tus patrones', en: 'Start with few categories and gradually increase as you learn your patterns' },
      { es: 'El Mago de Configuración puede sugerir presupuestos basados en tu promedio de 3 meses + 10%', en: 'The Setup Wizard can suggest budgets based on your 3-month average + 10%' },
      { es: 'Configura alertas al 80% para tener margen de maniobra', en: 'Set alerts at 80% to have room to maneuver' },
      { es: 'Usa la Captura Inteligente para crear pagos fijos desde fotos de boletas de servicios', en: 'Use Smart Capture to create fixed payments from service bill photos' },
    ],
    faq: [
      {
        question: { es: '¿Qué es el rollover de presupuesto?', en: 'What is budget rollover?' },
        answer: { es: 'Si no gastas todo tu presupuesto de una categoría, lo no gastado puede acumularse para el mes siguiente. Configurable por categoría.', en: 'If you don\'t spend your entire budget for a category, the unspent amount can roll over to the next month. Configurable per category.' }
      },
      {
        question: { es: '¿Puedo crear pagos fijos desde una foto?', en: 'Can I create fixed payments from a photo?' },
        answer: { es: 'Sí, la Captura Inteligente detecta proveedores de servicios en boletas y sugiere crear pagos fijos recurrentes automáticamente con el monto y proveedor detectados.', en: 'Yes, Smart Capture detects service providers in bills and suggests creating recurring fixed payments automatically with the detected amount and vendor.' }
      },
    ],
    connections: [
      { es: 'Se alimenta de Gastos y se visualiza en el Dashboard', en: 'Feeds from Expenses and displays in Dashboard' },
      { es: 'Pagos fijos se crean desde Captura Inteligente y Asistente Phoenix', en: 'Fixed payments are created from Smart Capture and Phoenix Assistant' },
      { es: 'El Mago de Configuración genera presupuestos sugeridos automáticamente', en: 'The Setup Wizard generates suggested budgets automatically' },
    ],
    color: 'border-cyan-500/30',
  },
  {
    id: 'mileage',
    emoji: '🚗',
    title: { es: 'Kilometraje', en: 'Mileage' },
    shortDesc: { es: 'Viajes de trabajo y deducciones fiscales', en: 'Work trips and tax deductions' },
    purpose: {
      es: 'Registra tus viajes de trabajo para deducir kilometraje en impuestos. Calcula automáticamente la deducción según las tasas oficiales de tu país (CRA para Canadá, SII para Chile). Incluye mapa de ubicaciones de clientes, ida/vuelta automática, y resúmenes mensuales/anuales de kilómetros deducibles.',
      en: 'Record your work trips to deduct mileage on taxes. Automatically calculates deduction based on official rates (CRA for Canada, SII for Chile). Includes client location map, automatic round trip, and monthly/annual deductible kilometer summaries.'
    },
    steps: [
      { es: 'Registra un viaje: origen, destino, distancia en km y propósito del viaje', en: 'Record a trip: origin, destination, distance in km, and trip purpose' },
      { es: 'Selecciona si es ida/vuelta o solo ida', en: 'Select if round trip or one-way' },
      { es: 'Asocia el viaje a un cliente si aplica', en: 'Associate the trip with a client if applicable' },
      { es: 'El sistema calcula la deducción fiscal automáticamente según tasas oficiales', en: 'The system automatically calculates tax deduction based on official rates' },
      { es: 'Revisa resúmenes mensuales y anuales de kilómetros deducibles', en: 'Review monthly and annual deductible kilometer summaries' },
    ],
    tips: [
      { es: 'Registra CADA viaje de trabajo — $0.70/km se acumula significativamente al año', en: 'Record EVERY work trip — $0.70/km accumulates significantly over the year' },
      { es: 'Usa el mapa de clientes para ver distancias frecuentes y optimizar rutas', en: 'Use the client map to see frequent distances and optimize routes' },
      { es: 'Ganas XP en Aventura Financiera por cada viaje registrado', en: 'You earn XP in Financial Adventure for each recorded trip' },
    ],
    faq: [
      {
        question: { es: '¿Qué tasa por kilómetro usa EvoFinz?', en: 'What rate per kilometer does EvoFinz use?' },
        answer: { es: 'Usa las tasas oficiales del CRA (Canadá) y SII (Chile) actualizadas anualmente. Más países próximamente.', en: 'Uses official CRA (Canada) and SII (Chile) rates updated annually. More countries coming soon.' }
      },
    ],
    connections: [
      { es: 'Genera gastos deducibles que aparecen en informes fiscales y Dashboard', en: 'Generates deductible expenses that appear in tax reports and Dashboard' },
      { es: 'Se vincula con Clientes para asociar viajes a visitas específicas', en: 'Links with Clients to associate trips with specific visits' },
    ],
    color: 'border-orange-500/30',
  },
  {
    id: 'tax-calendar',
    emoji: '📅',
    title: { es: 'Calendario Fiscal', en: 'Tax Calendar' },
    shortDesc: { es: 'Fechas límite, recordatorios y alertas fiscales', en: 'Deadlines, reminders, and tax alerts' },
    purpose: {
      es: 'Nunca más pierdas una fecha límite fiscal. El calendario muestra todas las fechas importantes de declaración, pagos trimestrales y reportes según tu país, provincia y tipo de entidad fiscal. Incluye alertas proactivas con animaciones de urgencia (pulso, resplandor) cuando se acercan las fechas límite.',
      en: 'Never miss a tax deadline again. The calendar shows all important filing dates, quarterly payments, and reports based on your country, province, and tax entity type. Includes proactive alerts with urgency animations (pulse, glow) when deadlines approach.'
    },
    steps: [
      { es: 'Las fechas fiscales se cargan automáticamente según tu país y entidad', en: 'Tax dates are loaded automatically based on your country and entity' },
      { es: 'Los eventos urgentes aparecen con alertas visuales animadas', en: 'Urgent events appear with animated visual alerts' },
      { es: 'Marca eventos como completados una vez que cumplas con la obligación', en: 'Mark events as completed once you fulfill the obligation' },
      { es: 'Configura recordatorios previos (7, 14, 30 días antes)', en: 'Set advance reminders (7, 14, 30 days before)' },
      { es: 'Ve un roadmap visual de tu cumplimiento fiscal del año', en: 'See a visual roadmap of your tax compliance for the year' },
    ],
    tips: [
      { es: 'Revísalo el primer día de cada mes para planificar obligaciones', en: 'Check it on the first day of each month to plan obligations' },
      { es: 'Las fechas varían según tu provincia/estado — mantén tu Perfil de Negocio actualizado', en: 'Dates vary by province/state — keep your Business Profile updated' },
      { es: 'Las alertas usan didáctica visual con emojis y colores para comunicar urgencia', en: 'Alerts use visual didactics with emojis and colors to communicate urgency' },
    ],
    faq: [
      {
        question: { es: '¿El calendario se adapta a mi país?', en: 'Does the calendar adapt to my country?' },
        answer: { es: 'Sí, muestra fechas fiscales relevantes según el país y provincia configurados en tu entidad fiscal activa. Soporta Canadá, USA, México, Colombia, Argentina y más.', en: 'Yes, it shows relevant tax dates based on country and province configured in your active tax entity. Supports Canada, USA, Mexico, Colombia, Argentina, and more.' }
      },
    ],
    connections: [
      { es: 'Se alimenta del Perfil de Negocio y muestra alertas en el Dashboard', en: 'Feeds from Business Profile and shows alerts in Dashboard' },
      { es: 'Conectado con el sistema de Notificaciones para recordatorios proactivos', en: 'Connected with the Notifications system for proactive reminders' },
    ],
    color: 'border-rose-500/30',
  },
  {
    id: 'banking',
    emoji: '🏦',
    title: { es: 'Banking y Análisis Inteligente', en: 'Banking & Smart Analysis' },
    shortDesc: { es: 'Importación y análisis avanzado de estados de cuenta', en: 'Import and advanced bank statement analysis' },
    purpose: {
      es: 'Importa estados de cuenta bancarios (CSV, Excel, PDF con IA) para una visión completa de tus movimientos. El módulo de Análisis Inteligente va más allá: detecta anomalías (cargos inusuales, duplicados, picos de gasto), identifica pagos recurrentes con frecuencia y costo anualizado, muestra tendencias de gasto por categoría, y ofrece un chat inteligente para preguntas en lenguaje natural sobre tus transacciones bancarias.',
      en: 'Import bank statements (CSV, Excel, PDF with AI) for a complete view of your movements. The Smart Analysis module goes further: detects anomalies (unusual charges, duplicates, spending spikes), identifies recurring payments with frequency and annualized cost, shows spending trends by category, and offers a smart chat for natural language questions about your bank transactions.'
    },
    steps: [
      { es: 'Descarga tu estado de cuenta del banco (CSV, Excel o PDF)', en: 'Download your bank statement (CSV, Excel, or PDF)' },
      { es: 'Importa el archivo — para PDF, la IA extrae datos automáticamente', en: 'Import the file — for PDF, AI extracts data automatically' },
      { es: 'El sistema mapea columnas automáticamente (o ajusta manualmente)', en: 'The system maps columns automatically (or adjust manually)' },
      { es: 'Accede al Análisis Inteligente para ver anomalías, recurrencias y tendencias', en: 'Access Smart Analysis to see anomalies, recurrences, and trends' },
      { es: 'Usa el chat inteligente: "¿cuál banco me cobra internet?" o "¿cuánto pago mensual en servicios?"', en: 'Use smart chat: "which bank charges my internet?" or "how much do I pay monthly for services?"' },
      { es: 'Revisa alertas de cargos inusuales, duplicados o picos de gasto', en: 'Review alerts for unusual charges, duplicates, or spending spikes' },
    ],
    tips: [
      { es: 'Importa mensualmente de TODOS tus bancos para una vista completa', en: 'Import monthly from ALL your banks for a complete view' },
      { es: 'El análisis de recurrencias te muestra suscripciones que quizás olvidaste cancelar', en: 'Recurrence analysis shows subscriptions you may have forgotten to cancel' },
      { es: 'Pregúntale al chat: "¿cuáles son mis cargos más altos de los últimos 3 meses?"', en: 'Ask the chat: "what are my highest charges in the last 3 months?"' },
      { es: 'Después de importar, ve a Reconciliación para cruzar con tus registros manuales', en: 'After importing, go to Reconciliation to cross-reference with your manual records' },
    ],
    faq: [
      {
        question: { es: '¿Puede leer PDFs de estados de cuenta?', en: 'Can it read bank statement PDFs?' },
        answer: { es: 'Sí, la IA (Gemini 2.5 Flash) extrae datos de PDFs bancarios automáticamente. El formato varía por banco, pero el sistema se adapta a la mayoría.', en: 'Yes, AI (Gemini 2.5 Flash) extracts data from bank PDFs automatically. Format varies by bank, but the system adapts to most.' }
      },
      {
        question: { es: '¿Qué tipo de anomalías detecta?', en: 'What types of anomalies does it detect?' },
        answer: { es: 'Detecta: cargos inusuales vs tu patrón normal, posibles duplicados (mismo monto/fecha), picos de gasto en categorías específicas, y cobros recurrentes no reconocidos.', en: 'It detects: unusual charges vs your normal pattern, possible duplicates (same amount/date), spending spikes in specific categories, and unrecognized recurring charges.' }
      },
    ],
    connections: [
      { es: 'Se conecta directamente con Reconciliación para cruzar transacciones', en: 'Connects directly with Reconciliation to cross-reference transactions' },
      { es: 'Las recurrencias detectadas alimentan sugerencias de Pagos Fijos', en: 'Detected recurrences feed Fixed Payment suggestions' },
      { es: 'El análisis de tendencias complementa los gráficos del Dashboard', en: 'Trend analysis complements Dashboard charts' },
    ],
    color: 'border-indigo-500/30',
  },
  {
    id: 'net-worth',
    emoji: '📈',
    title: { es: 'Patrimonio Neto y FIRE', en: 'Net Worth & FIRE' },
    shortDesc: { es: 'Activos, deudas, metas de inversión y libertad financiera', en: 'Assets, debts, investment goals, and financial freedom' },
    purpose: {
      es: 'Lleva un registro de todo lo que tienes (activos: propiedades, inversiones, ahorros, vehículos, cripto) y todo lo que debes (deudas: hipoteca, préstamos, tarjetas). Calcula tu patrimonio neto real, establece metas de inversión SMART, y proyecta tu camino hacia la independencia financiera (FIRE) con simulaciones de escenarios. Incluye seguimiento de metas de inversión con fechas, montos objetivo y niveles de riesgo.',
      en: 'Track everything you own (assets: properties, investments, savings, vehicles, crypto) and everything you owe (debts: mortgage, loans, cards). Calculate your real net worth, set SMART investment goals, and project your path to financial independence (FIRE) with scenario simulations. Includes investment goal tracking with dates, target amounts, and risk levels.'
    },
    steps: [
      { es: 'Agrega activos por categoría: propiedades, inversiones, ahorros, vehículos, criptomonedas', en: 'Add assets by category: properties, investments, savings, vehicles, cryptocurrencies' },
      { es: 'Registra deudas: hipoteca, préstamos personales, tarjetas de crédito, líneas de crédito', en: 'Record debts: mortgage, personal loans, credit cards, credit lines' },
      { es: 'El sistema calcula tu patrimonio neto = activos - deudas automáticamente', en: 'The system calculates net worth = assets - debts automatically' },
      { es: 'Crea metas de inversión SMART: específicas, medibles, alcanzables, relevantes, con plazo', en: 'Create SMART investment goals: specific, measurable, achievable, relevant, time-bound' },
      { es: 'Configura tu meta FIRE y ve la proyección de cuántos años faltan', en: 'Set your FIRE goal and see the projection of how many years remain' },
      { es: 'Simula escenarios: "¿Qué pasa si ahorro $500 más al mes?"', en: 'Simulate scenarios: "What if I save $500 more per month?"' },
    ],
    tips: [
      { es: 'Actualiza valores de activos trimestralmente para precisión en tus métricas', en: 'Update asset values quarterly for precision in your metrics' },
      { es: 'Incluye TODOS tus activos — hasta los pequeños suman para la foto completa', en: 'Include ALL your assets — even small ones add up for the complete picture' },
      { es: 'Las metas SMART con la checkbox de relevancia te ayudan a priorizar', en: 'SMART goals with the relevance checkbox help you prioritize' },
    ],
    faq: [
      {
        question: { es: '¿Qué es FIRE?', en: 'What is FIRE?' },
        answer: { es: 'Financial Independence, Retire Early. Un movimiento que busca acumular suficiente patrimonio (generalmente 25x tus gastos anuales) para vivir de inversiones sin necesidad de trabajar. EvoFinz calcula tu progreso y proyecta tu fecha de independencia.', en: 'Financial Independence, Retire Early. A movement seeking to accumulate enough wealth (typically 25x your annual expenses) to live off investments without working. EvoFinz calculates your progress and projects your independence date.' }
      },
      {
        question: { es: '¿Puedo incluir criptomonedas?', en: 'Can I include cryptocurrencies?' },
        answer: { es: 'Sí, puedes agregar criptomonedas como activos y actualizar su valor según el mercado. Se clasifican como activos de inversión.', en: 'Yes, you can add cryptocurrencies as assets and update their value based on the market. They\'re classified as investment assets.' }
      },
    ],
    connections: [
      { es: 'Se alimenta de Ingresos y Gastos para proyecciones de ahorro', en: 'Feeds from Income and Expenses for savings projections' },
      { es: 'Alimenta simulaciones FIRE y metas de inversión en el Dashboard', en: 'Feeds FIRE simulations and investment goals in the Dashboard' },
      { es: 'Conectado con Transferencias Cross-Border para activos internacionales', en: 'Connected with Cross-Border Transfers for international assets' },
    ],
    color: 'border-emerald-500/30',
  },
  {
    id: 'capture',
    emoji: '📸',
    title: { es: 'Captura Rápida', en: 'Quick Capture' },
    shortDesc: { es: 'Fotos de recibos al instante desde el móvil', en: 'Instant receipt photos from mobile' },
    purpose: {
      es: 'Fotografía cualquier recibo desde tu móvil en un toque y se sube automáticamente a la Bandeja del Caos. No necesitas clasificar ni llenar formularios — solo captura. Es el punto de entrada más rápido para no perder ningún gasto. Accesible desde el botón de cámara en la navegación móvil o el FAB (botón flotante de acción).',
      en: 'Photograph any receipt from your phone in one tap and it uploads automatically to the Chaos Inbox. No need to classify or fill forms — just capture. It\'s the fastest entry point so you never miss an expense. Accessible from the camera button in mobile navigation or the FAB (floating action button).'
    },
    steps: [
      { es: 'Toca el botón de cámara (📸) en la navegación móvil inferior', en: 'Tap the camera button (📸) in the bottom mobile navigation' },
      { es: 'Toma la foto del recibo o selecciona una imagen existente de la galería', en: 'Take a photo of the receipt or select an existing image from gallery' },
      { es: 'Se sube automáticamente al Chaos Inbox — ¡listo!', en: 'It automatically uploads to Chaos Inbox — done!' },
      { es: 'La IA procesa el recibo y extrae datos para tu revisión posterior', en: 'AI processes the receipt and extracts data for your later review' },
    ],
    tips: [
      { es: 'Toma la foto INMEDIATAMENTE al recibir el ticket — si esperas, lo pierdes', en: 'Take the photo IMMEDIATELY upon receiving the ticket — if you wait, you lose it' },
      { es: 'Buena iluminación = mejor extracción de datos por la IA', en: 'Good lighting = better data extraction by AI' },
      { es: 'Puedes subir múltiples fotos a la vez y el Mago de Configuración se activa automáticamente', en: 'You can upload multiple photos at once and the Setup Wizard activates automatically' },
    ],
    faq: [
      {
        question: { es: '¿Se pierde calidad de imagen?', en: 'Is image quality lost?' },
        answer: { es: 'Las imágenes se comprimen inteligentemente manteniendo legibilidad del texto. El original se conserva como respaldo.', en: 'Images are smartly compressed maintaining text legibility. The original is kept as backup.' }
      },
    ],
    connections: [
      { es: 'Los recibos capturados llegan a Bandeja del Caos → clasificación IA → Gastos/Ingresos', en: 'Captured receipts go to Chaos Inbox → AI classification → Expenses/Income' },
      { es: 'Integrado con Captura Inteligente para flujo completo de automatización', en: 'Integrated with Smart Capture for complete automation flow' },
    ],
    color: 'border-pink-500/30',
  },
  {
    id: 'gamification',
    emoji: '🎮',
    title: { es: 'Aventura Financiera', en: 'Financial Adventure' },
    shortDesc: { es: 'Gamificación que convierte tus finanzas en una aventura', en: 'Gamification that turns your finances into an adventure' },
    purpose: {
      es: 'La Aventura Financiera transforma la gestión financiera en un juego motivante. Ganas XP (puntos de experiencia) por cada acción financiera: registrar gastos, importar extractos, crear clientes, completar metas de ahorro. Subes de nivel, desbloqueas logros, mantienes rachas diarias, y recibes celebraciones épicas por hitos importantes. El sistema de progresión unificado combina XP Financiero y Puntos Beta en un Mapa de Niveles visual.',
      en: 'Financial Adventure transforms financial management into a motivating game. You earn XP (experience points) for every financial action: recording expenses, importing statements, creating clients, completing savings goals. You level up, unlock achievements, maintain daily streaks, and receive epic celebrations for important milestones. The unified progression system combines Financial XP and Beta Points in a visual Level Map.'
    },
    steps: [
      { es: 'Registra gastos, ingresos, clientes y más para ganar XP automáticamente', en: 'Record expenses, income, clients, and more to earn XP automatically' },
      { es: 'Mantén rachas diarias de uso — las rachas multiplican tus puntos', en: 'Maintain daily usage streaks — streaks multiply your points' },
      { es: 'Revisa tu progreso en la Tarjeta de Progresión Unificada', en: 'Check your progress in the Unified Progression Card' },
      { es: 'Desbloquea logros por acciones específicas: primer gasto, primera meta, racha de 7 días', en: 'Unlock achievements for specific actions: first expense, first goal, 7-day streak' },
      { es: 'Sube de nivel y recibe celebraciones épicas con efectos visuales (confeti, destellos, frases épicas)', en: 'Level up and receive epic celebrations with visual effects (confetti, sparkles, epic phrases)' },
      { es: 'Explora el Mapa de Niveles para ver tu recorrido completo', en: 'Explore the Level Map to see your complete journey' },
    ],
    tips: [
      { es: 'La constancia importa más que la cantidad — 1 acción diaria mantiene tu racha', en: 'Consistency matters more than quantity — 1 daily action maintains your streak' },
      { es: 'Las celebraciones épicas incluyen frases como "¡LEGENDARIO!" con efectos de confeti', en: 'Epic celebrations include phrases like "LEGENDARY!" with confetti effects' },
      { es: 'Los Puntos Beta por feedback y reportes de bugs también suman a tu nivel', en: 'Beta Points from feedback and bug reports also count toward your level' },
    ],
    faq: [
      {
        question: { es: '¿Cómo gano XP?', en: 'How do I earn XP?' },
        answer: { es: 'Automáticamente al: registrar gastos/ingresos, crear clientes, registrar kilometraje, completar metas de ahorro, importar extractos bancarios, y más. Cada acción tiene su recompensa de XP.', en: 'Automatically by: recording expenses/income, creating clients, recording mileage, completing savings goals, importing bank statements, and more. Each action has its XP reward.' }
      },
      {
        question: { es: '¿Las rachas se pierden si no uso la app un día?', en: 'Do streaks reset if I skip a day?' },
        answer: { es: 'Sí, las rachas se reinician si no realizas ninguna acción financiera en un día. Pero tu mejor racha queda registrada como logro personal.', en: 'Yes, streaks reset if you don\'t perform any financial action in a day. But your best streak is recorded as a personal achievement.' }
      },
    ],
    connections: [
      { es: 'Se alimenta de TODAS las secciones: cada acción financiera genera XP', en: 'Feeds from ALL sections: every financial action generates XP' },
      { es: 'Los logros y niveles se muestran en el Dashboard y perfil', en: 'Achievements and levels are shown in Dashboard and profile' },
      { es: 'Integrado con el sistema de feedback para puntos adicionales', en: 'Integrated with the feedback system for additional points' },
    ],
    color: 'border-amber-500/30',
  },
  {
    id: 'financial-education',
    emoji: '📚',
    title: { es: 'Educación Financiera', en: 'Financial Education' },
    shortDesc: { es: 'Aprende mientras gestionas tu dinero', en: 'Learn while managing your money' },
    purpose: {
      es: 'Un módulo completo de aprendizaje financiero integrado directamente en tu flujo de trabajo. Registra libros, cursos, podcasts y videos que consumes. Establece metas diarias de lectura/estudio, lleva un diario de práctica para aplicar lo aprendido, y mide el impacto de tu educación en tus finanzas reales. Crece como gestor financiero mientras gestionas.',
      en: 'A complete financial learning module integrated directly into your workflow. Track books, courses, podcasts, and videos you consume. Set daily reading/study goals, keep a practice diary to apply what you learn, and measure the impact of your education on your real finances. Grow as a financial manager while you manage.'
    },
    steps: [
      { es: 'Agrega recursos de aprendizaje: libros, cursos, podcasts, videos, artículos', en: 'Add learning resources: books, courses, podcasts, videos, articles' },
      { es: 'Establece metas diarias de lectura (páginas) o estudio (minutos)', en: 'Set daily reading (pages) or study (minutes) goals' },
      { es: 'Activa el Acompañante de Lectura: ve a Mentoría → tab Rohn → Educación Financiera → selecciona un recurso "En progreso"', en: 'Activate the Reading Companion: go to Mentorship → Rohn tab → Financial Education → select an "In progress" resource' },
      { es: 'El tracker muestra tu ritmo de lectura, predicción de finalización y comparación con promedio global', en: 'The tracker shows your reading pace, completion prediction, and comparison with global average' },
      { es: 'Registra tu progreso diario con notas y reflexiones', en: 'Log your daily progress with notes and reflections' },
      { es: 'Crea entradas en el Diario de Práctica para aplicar lo aprendido', en: 'Create Practice Diary entries to apply what you\'ve learned' },
      { es: 'Califica el impacto de cada recurso y lección aprendida', en: 'Rate the impact of each resource and lesson learned' },
    ],
    tips: [
      { es: '15 minutos diarios de educación financiera transforman tu relación con el dinero en meses', en: '15 daily minutes of financial education transforms your money relationship in months' },
      { es: 'Usa el Acompañante de Lectura para visualizar tu ritmo vs promedio global — motiva mantener la constancia', en: 'Use the Reading Companion to visualize your pace vs global average — motivates consistency' },
      { es: 'El Diario de Práctica te obliga a aplicar — leer sin practicar es olvidar', en: 'The Practice Diary forces you to apply — reading without practicing is forgetting' },
      { es: 'Califica cada recurso para crear tu biblioteca personal de mejores materiales', en: 'Rate each resource to build your personal library of best materials' },
    ],
    faq: [
      {
        question: { es: '¿Qué tipos de recursos puedo registrar?', en: 'What types of resources can I track?' },
        answer: { es: 'Libros, cursos online, podcasts, videos, artículos y cualquier material de aprendizaje financiero. Cada tipo tiene campos específicos: páginas para libros, minutos para videos/podcasts.', en: 'Books, online courses, podcasts, videos, articles, and any financial learning material. Each type has specific fields: pages for books, minutes for videos/podcasts.' }
      },
    ],
    connections: [
      { es: 'El Diario de Práctica puede vincularse a gastos o ingresos específicos', en: 'Practice Diary can link to specific expenses or income' },
      { es: 'El progreso de estudio contribuye a la Aventura Financiera (XP)', en: 'Study progress contributes to Financial Adventure (XP)' },
    ],
    color: 'border-blue-500/30',
  },
  {
    id: 'financial-journal',
    emoji: '📝',
    title: { es: 'Diario Financiero', en: 'Financial Journal' },
    shortDesc: { es: 'Reflexiones y aprendizajes sobre tus decisiones financieras', en: 'Reflections and learnings about your financial decisions' },
    purpose: {
      es: 'Un espacio para reflexionar sobre tus decisiones financieras, registrar lecciones aprendidas, y conectar tus emociones con tus gastos. El diario financiero te ayuda a entender POR QUÉ gastas como gastas, identificar patrones emocionales, y tomar mejores decisiones a futuro.',
      en: 'A space to reflect on your financial decisions, record lessons learned, and connect your emotions with your spending. The financial journal helps you understand WHY you spend the way you do, identify emotional patterns, and make better future decisions.'
    },
    steps: [
      { es: 'Crea una entrada de diario: reflexión, decisión, lección o gratitud financiera', en: 'Create a journal entry: reflection, decision, lesson, or financial gratitude' },
      { es: 'Selecciona tu estado de ánimo al escribir (optimista, preocupado, motivado, etc.)', en: 'Select your mood when writing (optimistic, worried, motivated, etc.)' },
      { es: 'Vincula la entrada a un gasto o ingreso específico si aplica', en: 'Link the entry to a specific expense or income if applicable' },
      { es: 'Registra lecciones aprendidas para referencia futura', en: 'Record lessons learned for future reference' },
    ],
    tips: [
      { es: 'Escribe después de cada gasto grande o decisión financiera importante', en: 'Write after each large expense or important financial decision' },
      { es: 'Revisa tus entradas anteriores para detectar patrones de comportamiento', en: 'Review past entries to detect behavioral patterns' },
    ],
    faq: [
      {
        question: { es: '¿Es privado mi diario?', en: 'Is my journal private?' },
        answer: { es: 'Absolutamente. Tus entradas de diario son 100% privadas y solo tú puedes verlas. Están protegidas con las mismas medidas de seguridad que todos tus datos financieros.', en: 'Absolutely. Your journal entries are 100% private and only you can see them. They\'re protected with the same security measures as all your financial data.' }
      },
    ],
    connections: [
      { es: 'Puede vincularse a Gastos e Ingresos específicos para contexto', en: 'Can link to specific Expenses and Income for context' },
      { es: 'Complementa el módulo de Educación Financiera como práctica reflexiva', en: 'Complements the Financial Education module as reflective practice' },
    ],
    color: 'border-violet-500/30',
  },
  {
    id: 'financial-habits',
    emoji: '🔄',
    title: { es: 'Hábitos Financieros', en: 'Financial Habits' },
    shortDesc: { es: 'Construye hábitos que transforman tus finanzas', en: 'Build habits that transform your finances' },
    purpose: {
      es: 'Define y rastrea hábitos financieros positivos con sistema de rachas, recompensas XP y frecuencia configurable. Desde "revisar gastos diariamente" hasta "ahorrar antes de gastar" o "negociar precios". Los hábitos se vinculan al sistema de gamificación para máxima motivación.',
      en: 'Define and track positive financial habits with streak system, XP rewards, and configurable frequency. From "review expenses daily" to "save before spending" or "negotiate prices." Habits link to the gamification system for maximum motivation.'
    },
    steps: [
      { es: 'Crea un hábito: nombre, descripción, frecuencia (diaria, semanal, mensual)', en: 'Create a habit: name, description, frequency (daily, weekly, monthly)' },
      { es: 'Define la meta por período (ej: 1 vez al día, 3 veces por semana)', en: 'Set the goal per period (e.g., 1 time daily, 3 times weekly)' },
      { es: 'Marca el hábito como completado cada vez que lo realizas', en: 'Check the habit as completed each time you perform it' },
      { es: 'Mantén la racha para ganar bonificaciones de XP crecientes', en: 'Maintain the streak to earn growing XP bonuses' },
    ],
    tips: [
      { es: 'Empieza con 1-2 hábitos fáciles y agrega más cuando sean automáticos', en: 'Start with 1-2 easy habits and add more when they become automatic' },
      { es: 'La racha es tu mejor aliada — no la rompas, el XP bonus se acumula', en: 'The streak is your best ally — don\'t break it, XP bonus accumulates' },
    ],
    faq: [
      {
        question: { es: '¿Qué hábitos recomiendan?', en: 'What habits do you recommend?' },
        answer: { es: 'Los más impactantes: registrar cada gasto al instante, revisar el Dashboard cada mañana, reconciliar semanalmente, y revisar presupuesto antes de compras grandes.', en: 'The most impactful: record every expense instantly, check Dashboard every morning, reconcile weekly, and review budget before large purchases.' }
      },
    ],
    connections: [
      { es: 'Alimenta el sistema de Aventura Financiera con XP por completar hábitos', en: 'Feeds Financial Adventure system with XP for completing habits' },
      { es: 'Se vincula con el Diario Financiero para reflexiones sobre el progreso', en: 'Links with Financial Journal for reflections on progress' },
    ],
    color: 'border-teal-500/30',
  },
  {
    id: 'advanced-tools',
    emoji: '🧪',
    title: { es: 'Herramientas Avanzadas de IA', en: 'Advanced AI Tools' },
    shortDesc: { es: 'Simulador, Momentum, Negociación, Informes y Alertas', en: 'Simulator, Momentum, Negotiation, Reports & Alerts' },
    purpose: {
      es: 'El Centro de Comando Financiero Avanzado incluye 5 herramientas potenciadas por IA que van más allá del tracking básico: (1) Simulador "Qué Pasa Si" para planificación de escenarios financieros, (2) Puntuación de Impulso Monetario que mide tu salud financiera holística, (3) Generador de Guiones de Negociación para reducir gastos proactivamente, (4) Informe Mensual Inteligente con comparaciones y recomendaciones por IA, y (5) Alertas Inteligentes Proactivas en tiempo real sobre gastos y ahorros.',
      en: 'The Advanced Financial Command Center includes 5 AI-powered tools that go beyond basic tracking: (1) "What If" Simulator for financial scenario planning, (2) Money Momentum Score measuring your holistic financial health, (3) Negotiation Script Generator for proactive expense reduction, (4) Smart Monthly Report with AI comparisons and recommendations, and (5) Proactive Smart Alerts in real-time about spending and savings.'
    },
    steps: [
      { es: 'Simulador: Cambia variables (ingresos, gastos, ahorro) y ve el impacto en tu futuro financiero', en: 'Simulator: Change variables (income, expenses, savings) and see the impact on your financial future' },
      { es: 'Momentum: Revisa tu puntuación de salud financiera — considera ingresos, gastos, ahorro, deuda y hábitos', en: 'Momentum: Check your financial health score — considers income, expenses, savings, debt, and habits' },
      { es: 'Negociación: Selecciona un gasto recurrente y obtén un guión personalizado para negociar mejor precio', en: 'Negotiation: Select a recurring expense and get a personalized script to negotiate better price' },
      { es: 'Informe: Cada mes la IA genera un análisis comparativo con insights y recomendaciones', en: 'Report: Each month AI generates a comparative analysis with insights and recommendations' },
      { es: 'Alertas: Recibe notificaciones inteligentes sobre gastos inusuales, metas en riesgo y oportunidades', en: 'Alerts: Receive smart notifications about unusual spending, at-risk goals, and opportunities' },
    ],
    tips: [
      { es: 'El Simulador es perfecto para decisiones grandes: "¿Me conviene cambiar de auto?"', en: 'The Simulator is perfect for big decisions: "Should I switch cars?"' },
      { es: 'Los guiones de negociación incluyen argumentos basados en precios de mercado', en: 'Negotiation scripts include arguments based on market prices' },
      { es: 'Lee el Informe Mensual el primer día de cada mes para tomar dirección', en: 'Read the Monthly Report on the first of each month to set direction' },
    ],
    faq: [
      {
        question: { es: '¿El informe mensual es automático?', en: 'Is the monthly report automatic?' },
        answer: { es: 'Se genera bajo demanda usando tus datos del mes. La IA compara con el mes anterior, identifica tendencias, y da recomendaciones personalizadas basadas en tu situación real.', en: 'It\'s generated on demand using your monthly data. AI compares with the previous month, identifies trends, and gives personalized recommendations based on your real situation.' }
      },
      {
        question: { es: '¿Qué mide la Puntuación de Impulso Monetario?', en: 'What does the Money Momentum Score measure?' },
        answer: { es: 'Es un índice compuesto que considera: ratio ingreso/gasto, cumplimiento de presupuesto, progreso en metas de ahorro, gestión de deuda, consistencia de registros, y hábitos financieros. Un número de 0-100 que te da una foto rápida de tu salud financiera.', en: 'It\'s a composite index that considers: income/expense ratio, budget compliance, savings goal progress, debt management, record consistency, and financial habits. A 0-100 number giving you a quick snapshot of your financial health.' }
      },
    ],
    connections: [
      { es: 'Se alimenta de TODOS tus datos: gastos, ingresos, presupuesto, metas, patrimonio', en: 'Feeds from ALL your data: expenses, income, budget, goals, net worth' },
      { es: 'Las alertas inteligentes se muestran en Dashboard y Notificaciones', en: 'Smart alerts show in Dashboard and Notifications' },
      { es: 'El informe mensual conecta con el Diario Financiero para reflexiones', en: 'Monthly report connects with Financial Journal for reflections' },
    ],
    color: 'border-fuchsia-500/30',
  },
  {
    id: 'cross-border',
    emoji: '💱',
    title: { es: 'Transferencias Cross-Border', en: 'Cross-Border Transfers' },
    shortDesc: { es: 'Gestión de transferencias entre países y monedas', en: 'Multi-country and multi-currency transfer management' },
    purpose: {
      es: 'Registra y rastrea transferencias de dinero entre tus cuentas en diferentes países y monedas. Ideal para freelancers internacionales y nómadas digitales que mueven dinero entre entidades fiscales. Registra tipo de cambio utilizado, propósito de la transferencia y entidades origen/destino.',
      en: 'Record and track money transfers between your accounts in different countries and currencies. Ideal for international freelancers and digital nomads moving money between tax entities. Records exchange rate used, transfer purpose, and origin/destination entities.'
    },
    steps: [
      { es: 'Registra la transferencia: monto origen, monto destino, tipo de cambio', en: 'Record the transfer: source amount, destination amount, exchange rate' },
      { es: 'Selecciona moneda origen y destino (ej: USD → CAD)', en: 'Select source and destination currency (e.g., USD → CAD)' },
      { es: 'Vincula las entidades fiscales de origen y destino', en: 'Link source and destination tax entities' },
      { es: 'Agrega propósito y notas para documentación fiscal', en: 'Add purpose and notes for tax documentation' },
    ],
    tips: [
      { es: 'Registra siempre el tipo de cambio real usado — no el de mercado — para precisión fiscal', en: 'Always record the real exchange rate used — not market rate — for tax accuracy' },
      { es: 'Mantén notas del propósito para respaldar ante auditorías', en: 'Keep purpose notes to support during audits' },
    ],
    faq: [
      {
        question: { es: '¿Soporta múltiples monedas?', en: 'Does it support multiple currencies?' },
        answer: { es: 'Sí, soporta cualquier par de monedas. El tipo de cambio se registra junto con la transferencia para auditoría y reportes fiscales precisos.', en: 'Yes, supports any currency pair. Exchange rate is recorded with the transfer for auditing and accurate tax reporting.' }
      },
    ],
    connections: [
      { es: 'Se vincula con Entidades Fiscales para tracking por país', en: 'Links with Tax Entities for per-country tracking' },
      { es: 'Los tipos de cambio se reflejan en Patrimonio Neto', en: 'Exchange rates are reflected in Net Worth' },
    ],
    color: 'border-sky-500/30',
  },
  {
    id: 'projects-tags',
    emoji: '🏷️',
    title: { es: 'Proyectos y Tags', en: 'Projects & Tags' },
    shortDesc: { es: 'Organización avanzada de datos', en: 'Advanced data organization' },
    purpose: {
      es: 'Crea proyectos para agrupar gastos e ingresos por iniciativa específica (ej: "Remodelación oficina", "Proyecto cliente X", "Vacaciones 2025"). Los tags dan flexibilidad adicional para etiquetar transacciones con criterios personalizados cruzados (ej: "deducible", "reembolsable", "urgente"). Ambos se pueden filtrar y reportar independientemente.',
      en: 'Create projects to group expenses and income by specific initiative (e.g., "Office remodel", "Client X project", "Vacation 2025"). Tags give additional flexibility to label transactions with custom cross-criteria (e.g., "deductible", "reimbursable", "urgent"). Both can be independently filtered and reported.'
    },
    steps: [
      { es: 'Crea un proyecto con nombre, descripción, cliente asociado y presupuesto opcional', en: 'Create a project with name, description, associated client, and optional budget' },
      { es: 'Asocia gastos e ingresos al proyecto al registrarlos', en: 'Associate expenses and income with project when recording' },
      { es: 'Crea tags personalizados ilimitados (ej: "deducible", "urgente", "vacaciones")', en: 'Create unlimited custom tags (e.g., "deductible", "urgent", "vacation")' },
      { es: 'Filtra y genera reportes por proyecto o tag para análisis específicos', en: 'Filter and generate reports by project or tag for specific analysis' },
    ],
    tips: [
      { es: 'Usa proyectos para trabajos grandes con presupuesto, y tags para clasificaciones flexibles', en: 'Use projects for big jobs with budget, and tags for flexible classifications' },
      { es: 'Los tags son perfectos para marcar gastos deducibles sin importar el proyecto', en: 'Tags are perfect for marking deductible expenses regardless of project' },
    ],
    faq: [
      {
        question: { es: '¿Cuál es la diferencia entre proyecto y tag?', en: 'What\'s the difference between project and tag?' },
        answer: { es: 'Un proyecto agrupa gastos/ingresos de una iniciativa con presupuesto. Un tag es una etiqueta libre aplicable a cualquier transacción sin importar el proyecto — permiten clasificación cruzada.', en: 'A project groups expenses/income of an initiative with budget. A tag is a free label applicable to any transaction regardless of project — they allow cross-classification.' }
      },
    ],
    connections: [
      { es: 'Se aplican a Gastos e Ingresos, visibles en informes y Dashboard', en: 'Applied to Expenses and Income, visible in reports and Dashboard' },
      { es: 'Los proyectos se vinculan con Clientes para rentabilidad por proyecto', en: 'Projects link with Clients for per-project profitability' },
    ],
    color: 'border-violet-500/30',
  },
  {
    id: 'reconciliation',
    emoji: '🔄',
    title: { es: 'Reconciliación', en: 'Reconciliation' },
    shortDesc: { es: 'Cruza banco vs registros manuales', en: 'Cross-reference bank vs manual records' },
    purpose: {
      es: 'Compara las transacciones importadas del banco con tus registros manuales. Identifica discrepancias, gastos faltantes y errores para mantener tus finanzas 100% precisas. El sistema sugiere coincidencias automáticas basadas en montos y fechas similares, pero la confirmación final es manual para máxima precisión.',
      en: 'Compare imported bank transactions with your manual records. Identify discrepancies, missing expenses, and errors to keep finances 100% accurate. The system suggests automatic matches based on similar amounts and dates, but final confirmation is manual for maximum precision.'
    },
    steps: [
      { es: 'Asegúrate de haber importado transacciones bancarias en Banking', en: 'Make sure you\'ve imported bank transactions in Banking' },
      { es: 'Abre Reconciliación para ver transacciones sin emparejar de ambos lados', en: 'Open Reconciliation to see unmatched transactions from both sides' },
      { es: 'Acepta las coincidencias sugeridas o empareja manualmente', en: 'Accept suggested matches or match manually' },
      { es: 'Para transacciones bancarias sin registro, crea el gasto/ingreso faltante directamente', en: 'For bank transactions without records, create the missing expense/income directly' },
      { es: 'Revisa el porcentaje de reconciliación para saber qué tan completos están tus registros', en: 'Check the reconciliation percentage to know how complete your records are' },
    ],
    tips: [
      { es: 'Reconcilia al menos una vez al mes — idealmente la primera semana del mes siguiente', en: 'Reconcile at least once a month — ideally the first week of the following month' },
      { es: 'Una reconciliación del 95%+ indica excelente disciplina de registro', en: 'A 95%+ reconciliation indicates excellent recording discipline' },
    ],
    faq: [
      {
        question: { es: '¿Cuánta precisión tienen las coincidencias automáticas?', en: 'How accurate are automatic matches?' },
        answer: { es: 'El sistema es conservador: solo sugiere coincidencias con alta probabilidad (mismo monto ±5% y fechas cercanas). Preferimos que confirmes manualmente a crear falsos positivos.', en: 'The system is conservative: only suggests matches with high probability (same amount ±5% and nearby dates). We prefer you confirm manually over creating false positives.' }
      },
    ],
    connections: [
      { es: 'Requiere datos de Banking (importaciones) y Gastos (registros manuales)', en: 'Requires data from Banking (imports) and Expenses (manual records)' },
      { es: 'Los gastos faltantes creados aquí alimentan Dashboard y Presupuesto', en: 'Missing expenses created here feed Dashboard and Budget' },
    ],
    color: 'border-teal-500/30',
  },
  {
    id: 'files',
    emoji: '📁',
    title: { es: 'Archivos', en: 'Files' },
    shortDesc: { es: 'Almacenamiento seguro de documentos financieros', en: 'Secure financial document storage' },
    purpose: {
      es: 'Almacena todos tus documentos financieros importantes en un solo lugar seguro: facturas, contratos, declaraciones de impuestos, comprobantes, estados de cuenta y más. Todo organizado por tipo y fecha, con búsqueda por nombre y contenido. Los recibos adjuntos a gastos y archivos de contratos se almacenan aquí automáticamente.',
      en: 'Store all your important financial documents in one secure place: invoices, contracts, tax returns, receipts, bank statements, and more. Everything organized by type and date, with search by name and content. Receipts attached to expenses and contract files are stored here automatically.'
    },
    steps: [
      { es: 'Sube documentos arrastrándolos o usando el botón de upload', en: 'Upload documents by dragging or using the upload button' },
      { es: 'Los documentos se organizan automáticamente por tipo y fecha', en: 'Documents are automatically organized by type and date' },
      { es: 'Busca cualquier documento por nombre, tipo o fecha', en: 'Search any document by name, type, or date' },
      { es: 'Los recibos adjuntos a gastos se almacenan aquí con vínculo directo', en: 'Receipts attached to expenses are stored here with direct link' },
    ],
    tips: [
      { es: 'Sube declaraciones de impuestos anuales como respaldo digital', en: 'Upload annual tax returns as digital backup' },
      { es: 'Usa la Bandeja del Caos para subir múltiples documentos y que se clasifiquen automáticamente', en: 'Use Chaos Inbox to upload multiple documents for automatic classification' },
    ],
    faq: [
      {
        question: { es: '¿Mis documentos están seguros?', en: 'Are my documents secure?' },
        answer: { es: 'Sí, todos los documentos se almacenan encriptados en servidores seguros con acceso exclusivo para tu cuenta. Nadie más puede ver tus archivos.', en: 'Yes, all documents are stored encrypted on secure servers with exclusive access for your account. No one else can see your files.' }
      },
    ],
    connections: [
      { es: 'Recibe archivos de Gastos (recibos), Contratos y Bandeja del Caos', en: 'Receives files from Expenses (receipts), Contracts, and Chaos Inbox' },
      { es: 'Los documentos fiscales alimentan el Calendario Fiscal y preparación de declaraciones', en: 'Tax documents feed Tax Calendar and return preparation' },
    ],
    color: 'border-sky-500/30',
  },
  {
    id: 'business-profile',
    emoji: '🏢',
    title: { es: 'Perfil de Negocio y Entidades Fiscales', en: 'Business Profile & Tax Entities' },
    shortDesc: { es: 'Configuración multi-entidad y multi-país', en: 'Multi-entity and multi-country configuration' },
    purpose: {
      es: 'Configura tus entidades fiscales (persona natural, empresa, LLC, sociedad) con datos de país, provincia, moneda, régimen fiscal y ID fiscal (RUT para Chile o Business Number para Canadá). Puedes tener múltiples entidades para diferentes negocios o países y cambiar entre ellas. Esto personaliza toda la experiencia: calendario fiscal, moneda predeterminada, tasas de kilometraje y filtros de datos. Actualmente soportamos Canadá y Chile, con más jurisdicciones próximamente.',
      en: 'Configure your tax entities (individual, company, LLC, partnership) with country, province, currency, tax regime, and tax ID (RUT for Chile or Business Number for Canada). You can have multiple entities for different businesses or countries and switch between them. This personalizes the entire experience: tax calendar, default currency, mileage rates, and data filters. Currently supporting Canada and Chile, with more jurisdictions coming soon.'
    },
    steps: [
      { es: 'Crea tu entidad fiscal principal: país, tipo de entidad, régimen fiscal', en: 'Create your main tax entity: country, entity type, tax regime' },
      { es: 'Agrega tu ID fiscal (RUT o Business Number según tu jurisdicción)', en: 'Add your tax ID (RUT or Business Number depending on your jurisdiction)' },
      { es: 'Configura moneda predeterminada y fin del año fiscal', en: 'Configure default currency and fiscal year end' },
      { es: 'Si operas en múltiples países, crea entidades adicionales', en: 'If you operate in multiple countries, create additional entities' },
      { es: 'Marca una como primaria y selecciona la entidad activa para filtrar datos', en: 'Mark one as primary and select active entity to filter data' },
      { es: 'Personaliza con color e icono para identificar rápidamente cada entidad', en: 'Customize with color and icon for quick entity identification' },
    ],
    tips: [
      { es: 'Configura tu perfil COMPLETO al inicio — esto personaliza calendarios, monedas y tasas', en: 'Complete your FULL profile at the start — this personalizes calendars, currencies, and rates' },
      { es: 'Cada entidad filtra datos independientemente — ideal para separar personal de negocio', en: 'Each entity filters data independently — ideal for separating personal from business' },
    ],
    faq: [
      {
        question: { es: '¿Puedo tener una entidad personal y otra empresarial?', en: 'Can I have a personal and business entity?' },
        answer: { es: 'Sí, es el uso ideal. Crea una entidad "Persona Natural" para tus finanzas personales y una "Empresa" para tu negocio. Cambia entre ellas y cada una tiene su propia vista de datos.', en: 'Yes, that\'s the ideal use. Create an "Individual" entity for personal finances and a "Company" for your business. Switch between them and each has its own data view.' }
      },
    ],
    connections: [
      { es: 'Afecta Calendario Fiscal, moneda predeterminada, tasas de kilometraje y filtros globales', en: 'Affects Tax Calendar, default currency, mileage rates, and global filters' },
      { es: 'Vinculado con Transferencias Cross-Border para movimientos entre entidades', en: 'Linked with Cross-Border Transfers for movements between entities' },
    ],
    color: 'border-slate-500/30',
  },
  {
    id: 'notifications',
    emoji: '🔔',
    title: { es: 'Notificaciones', en: 'Notifications' },
    shortDesc: { es: 'Hub de alertas, logros y orientación educativa', en: 'Alert hub, achievements, and educational guidance' },
    purpose: {
      es: 'El centro de notificaciones funciona como un hub de orientación educativa además de alertas. Incluye: alertas fiscales (fechas límite), logros desbloqueados (gamificación), alertas de presupuesto (umbrales), recordatorios de contratos (renovaciones), y alertas inteligentes proactivas. Cada notificación tiene un propósito educativo que te ayuda a entender su importancia.',
      en: 'The notification center works as an educational guidance hub beyond alerts. Includes: tax alerts (deadlines), unlocked achievements (gamification), budget alerts (thresholds), contract reminders (renewals), and proactive smart alerts. Each notification has an educational purpose helping you understand its importance.'
    },
    steps: [
      { es: 'Las notificaciones se generan automáticamente según tus datos y fechas', en: 'Notifications are generated automatically based on your data and dates' },
      { es: 'Filtra por tipo: fiscales, logros, presupuesto, contratos, alertas IA', en: 'Filter by type: tax, achievements, budget, contracts, AI alerts' },
      { es: 'Toca una notificación para navegar directamente a la sección relevante', en: 'Tap a notification to navigate directly to the relevant section' },
      { es: 'Configura preferencias desde Configuración → Notificaciones', en: 'Configure preferences from Settings → Notifications' },
    ],
    tips: [
      { es: 'Las alertas fiscales tienen prioridad visual con colores de urgencia', en: 'Tax alerts have visual priority with urgency colors' },
      { es: 'Los logros te motivan a mantener el hábito — cada uno tiene un propósito', en: 'Achievements motivate you to maintain the habit — each has a purpose' },
    ],
    faq: [
      {
        question: { es: '¿Puedo silenciar cierto tipo de notificaciones?', en: 'Can I mute certain notification types?' },
        answer: { es: 'Sí, desde Configuración → Notificaciones puedes personalizar qué tipos recibir y cuáles silenciar.', en: 'Yes, from Settings → Notifications you can customize which types to receive and which to mute.' }
      },
    ],
    connections: [
      { es: 'Recibe alertas de Calendario Fiscal, Presupuesto, Contratos, Gamificación y Alertas IA', en: 'Receives alerts from Tax Calendar, Budget, Contracts, Gamification, and AI Alerts' },
    ],
    color: 'border-orange-500/30',
  },
  {
    id: 'settings',
    emoji: '⚙️',
    title: { es: 'Configuración y Preferencias', en: 'Settings & Preferences' },
    shortDesc: { es: 'Personalización completa de tu experiencia', en: 'Complete customization of your experience' },
    purpose: {
      es: 'Personaliza tu experiencia completa: idioma (español/inglés), tema visual (claro, oscuro, automático), notificaciones, exportación de datos en múltiples formatos, gestión de cuenta y configuración de alertas. Incluye acceso al Manual de Usuario y configuración del sistema de gamificación.',
      en: 'Customize your complete experience: language (Spanish/English), visual theme (light, dark, auto), notifications, data export in multiple formats, account management, and alert configuration. Includes access to User Manual and gamification system settings.'
    },
    steps: [
      { es: 'Cambia entre español e inglés en tiempo real', en: 'Switch between Spanish and English in real-time' },
      { es: 'Selecciona tema visual: claro, oscuro o automático (según tu dispositivo)', en: 'Select visual theme: light, dark, or auto (based on your device)' },
      { es: 'Configura preferencias de notificaciones por tipo', en: 'Configure notification preferences by type' },
      { es: 'Exporta datos en Excel, CSV o PDF para tu contador o respaldo', en: 'Export data in Excel, CSV, or PDF for your accountant or backup' },
      { es: 'Gestiona tu cuenta y datos personales', en: 'Manage your account and personal data' },
    ],
    tips: [
      { es: 'El tema oscuro ahorra batería en pantallas OLED y es más cómodo de noche', en: 'Dark theme saves battery on OLED screens and is more comfortable at night' },
      { es: 'Exporta datos trimestralmente como respaldo y para tu asesor fiscal', en: 'Export data quarterly as backup and for your tax advisor' },
    ],
    faq: [
      {
        question: { es: '¿Puedo exportar todos mis datos?', en: 'Can I export all my data?' },
        answer: { es: 'Sí, exporta gastos, ingresos, clientes, presupuesto y más en Excel (.xlsx), CSV o PDF con gráficos. Ideal para compartir con tu contador.', en: 'Yes, export expenses, income, clients, budget, and more in Excel (.xlsx), CSV, or PDF with charts. Ideal for sharing with your accountant.' }
      },
    ],
    connections: [
      { es: 'Configuraciones globales que afectan toda la experiencia de la app', en: 'Global settings that affect the entire app experience' },
      { es: 'Acceso directo al Manual de Usuario, Beta Guide y reporte de bugs', en: 'Direct access to User Manual, Beta Guide, and bug reporting' },
    ],
    color: 'border-gray-500/30',
  },
];

// ─── BLOQUE 3: FAQ GLOBAL ───────────────────────────────────

export const globalFAQ: GuideFAQ[] = [
  {
    question: { es: '¿Mis datos están seguros?', en: 'Is my data secure?' },
    answer: { es: 'Sí. Toda la información se almacena encriptada en servidores seguros con políticas de seguridad a nivel de fila (RLS). Solo tú tienes acceso a tus datos financieros — ni siquiera nosotros podemos verlos.', en: 'Yes. All information is stored encrypted on secure servers with row-level security (RLS) policies. Only you have access to your financial data — not even we can see it.' }
  },
  {
    question: { es: '¿Puedo usar EvoFinz en el celular?', en: 'Can I use EvoFinz on my phone?' },
    answer: { es: 'Sí, EvoFinz es una aplicación web progresiva (PWA) optimizada para móvil. Puedes instalarla en tu celular como una app nativa desde el navegador (Agregar a pantalla de inicio). Incluye navegación inferior adaptada, captura rápida de fotos y experiencia táctil completa.', en: 'Yes, EvoFinz is a progressive web app (PWA) optimized for mobile. Install it on your phone as a native app from the browser (Add to Home Screen). Includes adapted bottom navigation, quick photo capture, and full touch experience.' }
  },
  {
    question: { es: '¿Funciona sin internet?', en: 'Does it work offline?' },
    answer: { es: 'La app requiere conexión para sincronizar datos en tiempo real. Sin embargo, la PWA permite ver información previamente cargada cuando pierdes conexión temporalmente.', en: 'The app requires connection to sync data in real-time. However, the PWA allows viewing previously loaded information when you temporarily lose connection.' }
  },
  {
    question: { es: '¿Puedo usar EvoFinz para múltiples negocios?', en: 'Can I use EvoFinz for multiple businesses?' },
    answer: { es: 'Sí, con Entidades Fiscales puedes gestionar múltiples negocios, países y monedas desde una sola cuenta. Cada entidad tiene sus propios datos, calendario fiscal y configuración independiente.', en: 'Yes, with Tax Entities you can manage multiple businesses, countries, and currencies from one account. Each entity has its own data, tax calendar, and independent configuration.' }
  },
  {
    question: { es: '¿Cómo importo datos de otra herramienta?', en: 'How do I import data from another tool?' },
    answer: { es: 'Puedes importar gastos e ingresos desde Excel/CSV. Para estados de cuenta bancarios, usa la sección Banking que acepta CSV, Excel y PDF (con extracción IA). Para documentos, usa la Bandeja del Caos para subida y clasificación masiva automática.', en: 'Import expenses and income from Excel/CSV. For bank statements, use Banking which accepts CSV, Excel, and PDF (with AI extraction). For documents, use Chaos Inbox for automatic bulk upload and classification.' }
  },
  {
    question: { es: '¿EvoFinz calcula mis impuestos?', en: 'Does EvoFinz calculate my taxes?' },
    answer: { es: 'EvoFinz te ayuda a organizar y categorizar información fiscal, identificar deducciones (incluyendo kilometraje), cumplir con fechas límite y generar reportes listos para tu contador. No reemplaza a un profesional fiscal, pero le hace la vida mucho más fácil — y la tuya también.', en: 'EvoFinz helps organize and categorize tax info, identify deductions (including mileage), meet deadlines, and generate reports ready for your accountant. It doesn\'t replace a tax professional, but makes their life much easier — and yours too.' }
  },
  {
    question: { es: '¿Puedo compartir datos con mi contador?', en: 'Can I share data with my accountant?' },
    answer: { es: 'Sí, exporta informes detallados en Excel o PDF con gráficos desde Configuración → Exportar. Tu contador recibe datos organizados por categoría, periodo y tipo — listos para declaraciones.', en: 'Yes, export detailed reports in Excel or PDF with charts from Settings → Export. Your accountant receives data organized by category, period, and type — ready for returns.' }
  },
  {
    question: { es: '¿Cómo funciona la gamificación?', en: 'How does gamification work?' },
    answer: { es: 'Cada acción financiera (registrar gasto, crear cliente, importar extracto) te da XP. Subes de nivel, mantienes rachas diarias, desbloqueas logros y recibes celebraciones épicas. Es la motivación que necesitas para convertir la gestión financiera en un hábito diario.', en: 'Every financial action (recording expense, creating client, importing statement) gives you XP. You level up, maintain daily streaks, unlock achievements, and receive epic celebrations. It\'s the motivation you need to turn financial management into a daily habit.' }
  },
  {
    question: { es: '¿Cómo funciona el Asistente Phoenix?', en: 'How does the Phoenix Assistant work?' },
    answer: { es: 'Phoenix es un asistente con IA y voz integrado en toda la app. Puedes hablarle o escribirle en lenguaje natural para registrar transacciones, consultar tus datos, pedir análisis y más. Usa síntesis de voz premium (ElevenLabs) con 20 voces disponibles y funciona con Push-to-Talk.', en: 'Phoenix is an AI and voice assistant integrated throughout the app. You can talk to it or type in natural language to record transactions, query your data, request analyses, and more. Uses premium voice synthesis (ElevenLabs) with 20 available voices and works with Push-to-Talk.' }
  },
  {
    question: { es: '¿Qué pasa si cometo un error?', en: 'What if I make a mistake?' },
    answer: { es: 'Todo es editable y los registros eliminados van a la Papelera (soft-delete) donde puedes restaurarlos. EvoFinz está diseñada para ser tolerante a errores — siempre hay forma de corregir.', en: 'Everything is editable and deleted records go to Trash (soft-delete) where you can restore them. EvoFinz is designed to be error-tolerant — there\'s always a way to correct.' }
  },
  {
    question: { es: '¿Cómo reporto un problema o sugiero una mejora?', en: 'How do I report a problem or suggest an improvement?' },
    answer: { es: 'Desde el sistema de feedback integrado puedes reportar bugs con screenshots, sugerir mejoras y dar tu opinión. ¡Tu contribución nos ayuda a mejorar!', en: 'From the integrated feedback system you can report bugs with screenshots, suggest improvements, and give your opinion. Your contribution helps us improve!' }
  },
];

// ─── DIAGRAMA DE INTERCONEXIONES ────────────────────────────

export const connectionsDiagram = {
  title: { es: '¿Cómo fluye la información?', en: 'How does information flow?' },
  flows: [
    { from: '📸 Captura', to: '📥 Chaos Inbox', to2: '🧾 Gastos', es: 'Foto → IA clasifica → Gasto/Ingreso creado automáticamente', en: 'Photo → AI classifies → Expense/Income created automatically' },
    { from: '🧾 Gastos', to: '📊 Dashboard', to2: '🎯 Presupuesto', es: 'Cada gasto actualiza métricas, presupuestos y alertas en tiempo real', en: 'Each expense updates metrics, budgets, and alerts in real-time' },
    { from: '💰 Ingresos', to: '📊 Dashboard', to2: '📈 Patrimonio', es: 'Ingresos alimentan balance, proyecciones FIRE y rentabilidad por cliente', en: 'Income feeds balance, FIRE projections, and per-client profitability' },
    { from: '👥 Clientes', to: '💰 Ingresos', to2: '📄 Contratos', es: 'Clientes se vinculan a cobros, contratos y análisis de rentabilidad', en: 'Clients link to payments, contracts, and profitability analysis' },
    { from: '🏦 Banking', to: '🔄 Reconciliación', to2: '🧪 Análisis IA', es: 'Datos bancarios → detección de anomalías → cruce con registros manuales', en: 'Bank data → anomaly detection → cross-reference with manual records' },
    { from: '🏢 Perfil', to: '📅 Calendario Fiscal', to2: '💱 Monedas', es: 'Tu perfil personaliza fechas fiscales, moneda y tasas de deducción', en: 'Your profile customizes tax dates, currency, and deduction rates' },
    { from: '🎮 Gamificación', to: '📊 Dashboard', to2: '🔔 Notificaciones', es: 'XP por cada acción → niveles, logros y celebraciones épicas', en: 'XP for every action → levels, achievements, and epic celebrations' },
    { from: '📚 Educación', to: '📝 Diario', to2: '🔄 Hábitos', es: 'Aprendizaje → práctica aplicada → hábitos financieros → transformación', en: 'Learning → applied practice → financial habits → transformation' },
    { from: '🎤 Phoenix', to: '🧾 Gastos', to2: '💰 Ingresos', es: 'Voz/texto natural → crea gastos e ingresos automáticamente', en: 'Voice/natural text → creates expenses and income automatically' },
    { from: '🧮 Tax Optimizer', to: '📊 Dashboard', to2: '📋 Tax Report', es: 'Análisis de deducciones → optimización → reporte para contador', en: 'Deduction analysis → optimization → report for accountant' },
    { from: '🔍 Suscripciones', to: '📅 Pagos Fijos', to2: '🎯 Presupuesto', es: 'Detector de fantasmas → identifica gastos recurrentes innecesarios', en: 'Ghost detector → identifies unnecessary recurring expenses' },
  ]
};
