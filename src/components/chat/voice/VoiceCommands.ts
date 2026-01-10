// Voice navigation commands
export const VOICE_COMMANDS = {
  es: [
    { patterns: ['ir a gastos', 'gastos', 'ver gastos', 'mostrar gastos', 'abrir gastos', 'llévame a gastos', 'llevame a gastos', 'quiero ver gastos', 'abre gastos', 'muéstrame gastos', 'muestrame gastos'], route: '/expenses', name: 'Gastos' },
    { patterns: ['ir a ingresos', 'ingresos', 'ver ingresos', 'mostrar ingresos', 'llévame a ingresos', 'llevame a ingresos', 'quiero ver ingresos', 'abre ingresos', 'muéstrame ingresos'], route: '/income', name: 'Ingresos' },
    { patterns: ['ir a clientes', 'clientes', 'ver clientes', 'mostrar clientes', 'llévame a clientes', 'llevame a clientes', 'quiero ver clientes', 'abre clientes', 'muéstrame clientes'], route: '/clients', name: 'Clientes' },
    { patterns: ['ir a proyectos', 'proyectos', 'ver proyectos', 'llévame a proyectos', 'llevame a proyectos', 'quiero ver proyectos', 'abre proyectos', 'muéstrame proyectos', 'muestrame proyectos'], route: '/projects', name: 'Proyectos' },
    { patterns: ['ir a contratos', 'contratos', 'ver contratos', 'llévame a contratos', 'llevame a contratos', 'quiero ver contratos', 'abre contratos'], route: '/contracts', name: 'Contratos' },
    { patterns: ['ir al dashboard', 'dashboard', 'inicio', 'ir al inicio', 'panel', 'llévame al inicio', 'llevame al inicio', 'quiero ir al inicio', 'abre el dashboard', 'página principal'], route: '/dashboard', name: 'Dashboard' },
    { patterns: ['ir a kilometraje', 'kilometraje', 'millas', 'kilómetros', 'llévame a kilometraje', 'llevame a kilometraje', 'ver kilometraje'], route: '/mileage', name: 'Kilometraje' },
    { patterns: ['ir a patrimonio', 'patrimonio', 'patrimonio neto', 'net worth', 'llévame a patrimonio', 'llevame a patrimonio', 'quiero ver patrimonio', 'mis activos'], route: '/net-worth', name: 'Patrimonio' },
    { patterns: ['ir a banca', 'banca', 'banco', 'transacciones bancarias', 'llévame a banca', 'llevame a banca', 'análisis bancario'], route: '/banking', name: 'Banca' },
    { patterns: ['ir a configuración', 'configuración', 'ajustes', 'settings', 'llévame a configuración', 'llevame a configuración', 'quiero configurar'], route: '/settings', name: 'Configuración' },
    { patterns: ['capturar', 'capturar gasto', 'tomar foto', 'escanear recibo', 'quiero capturar', 'escanea un recibo'], route: '/capture', name: 'Captura Rápida' },
    { patterns: ['agregar gasto', 'nuevo gasto', 'añadir gasto', 'quiero agregar un gasto', 'registrar gasto'], route: '/expenses', action: 'add-expense', name: 'Agregar Gasto' },
    { patterns: ['agregar ingreso', 'nuevo ingreso', 'añadir ingreso', 'quiero agregar un ingreso', 'registrar ingreso'], route: '/income', action: 'add-income', name: 'Agregar Ingreso' },
    { patterns: ['agregar cliente', 'nuevo cliente', 'quiero agregar un cliente', 'registrar cliente'], route: '/clients', action: 'add-client', name: 'Agregar Cliente' },
    { patterns: ['bandeja', 'bandeja de caos', 'revisar recibos', 'chaos inbox', 'recibos pendientes'], route: '/chaos-inbox', name: 'Bandeja de Caos' },
    { patterns: ['reconciliación', 'reconciliar', 'conciliación', 'conciliar cuentas'], route: '/reconciliation', name: 'Reconciliación' },
    { patterns: ['perfil de negocio', 'perfil empresarial', 'mi negocio', 'datos del negocio'], route: '/business-profile', name: 'Perfil de Negocio' },
    { patterns: ['notificaciones', 'alertas', 'ver notificaciones', 'mis alertas'], route: '/notifications', name: 'Notificaciones' },
    { patterns: ['mentoría', 'mentoria', 'ir a mentoría', 'educación financiera', 'aprender finanzas'], route: '/mentorship', name: 'Mentoría' },
    { patterns: ['impuestos', 'calendario fiscal', 'ir a impuestos', 'ver impuestos', 'fechas de impuestos'], route: '/tax-calendar', name: 'Calendario Fiscal' },
  ],
  en: [
    { patterns: ['go to expenses', 'expenses', 'show expenses', 'open expenses', 'take me to expenses', 'i want to see expenses', 'show me expenses'], route: '/expenses', name: 'Expenses' },
    { patterns: ['go to income', 'income', 'show income', 'take me to income', 'i want to see income', 'show me income'], route: '/income', name: 'Income' },
    { patterns: ['go to clients', 'clients', 'show clients', 'take me to clients', 'i want to see clients', 'show me clients'], route: '/clients', name: 'Clients' },
    { patterns: ['go to projects', 'projects', 'show projects', 'take me to projects', 'i want to see projects', 'show me projects'], route: '/projects', name: 'Projects' },
    { patterns: ['go to contracts', 'contracts', 'show contracts', 'take me to contracts', 'i want to see contracts'], route: '/contracts', name: 'Contracts' },
    { patterns: ['go to dashboard', 'dashboard', 'home', 'go home', 'take me home', 'main page', 'i want to go home'], route: '/dashboard', name: 'Dashboard' },
    { patterns: ['go to mileage', 'mileage', 'miles', 'kilometers', 'take me to mileage', 'show mileage'], route: '/mileage', name: 'Mileage' },
    { patterns: ['go to net worth', 'net worth', 'wealth', 'assets', 'take me to net worth', 'show my assets'], route: '/net-worth', name: 'Net Worth' },
    { patterns: ['go to banking', 'banking', 'bank', 'bank transactions', 'take me to banking', 'bank analysis'], route: '/banking', name: 'Banking' },
    { patterns: ['go to settings', 'settings', 'configuration', 'take me to settings', 'i want to configure'], route: '/settings', name: 'Settings' },
    { patterns: ['capture', 'capture expense', 'take photo', 'scan receipt', 'i want to capture', 'scan a receipt'], route: '/capture', name: 'Quick Capture' },
    { patterns: ['add expense', 'new expense', 'create expense', 'i want to add an expense', 'record expense'], route: '/expenses', action: 'add-expense', name: 'Add Expense' },
    { patterns: ['add income', 'new income', 'create income', 'i want to add income', 'record income'], route: '/income', action: 'add-income', name: 'Add Income' },
    { patterns: ['add client', 'new client', 'create client', 'i want to add a client', 'register client'], route: '/clients', action: 'add-client', name: 'Add Client' },
    { patterns: ['inbox', 'chaos inbox', 'review receipts', 'pending receipts'], route: '/chaos-inbox', name: 'Chaos Inbox' },
    { patterns: ['reconciliation', 'reconcile', 'bank reconciliation', 'reconcile accounts'], route: '/reconciliation', name: 'Reconciliation' },
    { patterns: ['business profile', 'my business', 'business data'], route: '/business-profile', name: 'Business Profile' },
    { patterns: ['notifications', 'alerts', 'show notifications', 'my alerts'], route: '/notifications', name: 'Notifications' },
    { patterns: ['mentorship', 'go to mentorship', 'financial education', 'learn finance'], route: '/mentorship', name: 'Mentorship' },
    { patterns: ['taxes', 'tax calendar', 'go to taxes', 'see taxes', 'tax dates'], route: '/tax-calendar', name: 'Tax Calendar' },
  ],
};

// Voice query commands (return data directly)
export type QueryType = 'expenses_month' | 'expenses_year' | 'income_month' | 'income_year' | 'balance' | 'client_count' | 'project_count' | 'pending_receipts' | 'biggest_expense' | 'top_category' | 'tax_summary' | 'tax_owed' | 'deductible_total' | 'billable_total';

export interface VoiceQuery {
  patterns: string[];
  queryType: QueryType;
}

export const VOICE_QUERIES: { es: VoiceQuery[]; en: VoiceQuery[] } = {
  es: [
    { patterns: ['cuánto gasté este mes', 'gastos del mes', 'gastos este mes', 'cuánto he gastado este mes'], queryType: 'expenses_month' },
    { patterns: ['cuánto gasté este año', 'gastos del año', 'gastos este año', 'cuánto he gastado este año'], queryType: 'expenses_year' },
    { patterns: ['cuánto gané este mes', 'ingresos del mes', 'ingresos este mes'], queryType: 'income_month' },
    { patterns: ['cuánto gané este año', 'ingresos del año', 'ingresos este año'], queryType: 'income_year' },
    { patterns: ['mostrar balance', 'cuál es mi balance', 'mi balance', 'balance actual', 'cómo estoy financieramente'], queryType: 'balance' },
    { patterns: ['cuántos clientes tengo', 'número de clientes', 'total de clientes', 'mis clientes'], queryType: 'client_count' },
    { patterns: ['cuántos proyectos tengo', 'número de proyectos', 'total de proyectos', 'mis proyectos'], queryType: 'project_count' },
    { patterns: ['recibos pendientes', 'cuántos recibos pendientes', 'pendientes de revisar'], queryType: 'pending_receipts' },
    { patterns: ['cuál es mi mayor gasto', 'mayor gasto', 'gasto más grande', 'gasto más alto'], queryType: 'biggest_expense' },
    { patterns: ['en qué gasto más', 'categoría más alta', 'dónde gasto más', 'principal categoría'], queryType: 'top_category' },
    { patterns: ['resumen de impuestos', 'resumen fiscal', 'mis impuestos', 'situación fiscal'], queryType: 'tax_summary' },
    { patterns: ['cuánto debo a hacienda', 'cuánto debo de impuestos', 'impuestos por pagar', 'deuda fiscal'], queryType: 'tax_owed' },
    { patterns: ['gastos deducibles', 'cuánto puedo deducir', 'total deducible', 'deducciones'], queryType: 'deductible_total' },
    { patterns: ['gastos facturables', 'cuánto puedo facturar', 'reembolsables', 'por facturar a clientes'], queryType: 'billable_total' },
  ],
  en: [
    { patterns: ['how much did i spend this month', 'monthly expenses', 'expenses this month', 'spending this month'], queryType: 'expenses_month' },
    { patterns: ['how much did i spend this year', 'yearly expenses', 'expenses this year', 'spending this year'], queryType: 'expenses_year' },
    { patterns: ['how much did i earn this month', 'monthly income', 'income this month'], queryType: 'income_month' },
    { patterns: ['how much did i earn this year', 'yearly income', 'income this year'], queryType: 'income_year' },
    { patterns: ['show balance', 'what is my balance', 'my balance', 'current balance', 'how am i doing financially'], queryType: 'balance' },
    { patterns: ['how many clients do i have', 'number of clients', 'total clients', 'my clients count'], queryType: 'client_count' },
    { patterns: ['how many projects do i have', 'number of projects', 'total projects', 'my projects count'], queryType: 'project_count' },
    { patterns: ['pending receipts', 'how many pending receipts', 'receipts to review'], queryType: 'pending_receipts' },
    { patterns: ['what is my biggest expense', 'biggest expense', 'largest expense', 'highest expense'], queryType: 'biggest_expense' },
    { patterns: ['what do i spend most on', 'top category', 'where do i spend most', 'main category'], queryType: 'top_category' },
    { patterns: ['tax summary', 'my taxes', 'tax situation', 'fiscal summary'], queryType: 'tax_summary' },
    { patterns: ['how much do i owe in taxes', 'taxes owed', 'tax debt', 'tax liability'], queryType: 'tax_owed' },
    { patterns: ['deductible expenses', 'how much can i deduct', 'total deductions', 'tax deductions'], queryType: 'deductible_total' },
    { patterns: ['billable expenses', 'reimbursable expenses', 'client billable', 'to bill clients'], queryType: 'billable_total' },
  ],
};

export const QUICK_QUESTIONS = {
  es: [
    { icon: 'HelpCircle', text: "¿Cómo capturo un gasto?" },
    { icon: 'Target', text: "¿Qué gastos puedo deducir?" },
    { icon: 'Lightbulb', text: "¿Cómo facturo a un cliente?" },
    { icon: 'Sparkles', text: "Sugiere cómo mejorar mis finanzas" },
  ],
  en: [
    { icon: 'HelpCircle', text: "How do I capture an expense?" },
    { icon: 'Target', text: "What expenses can I deduct?" },
    { icon: 'Lightbulb', text: "How do I bill a client?" },
    { icon: 'Sparkles', text: "Suggest how to improve my finances" },
  ],
};
