// Voice navigation commands
// IMPORTANT: Include variations with "la sección de", "enséñame", "muéstrame" for better matching
export const VOICE_COMMANDS = {
  es: [
    // Gastos - EXTENSIVE patterns including "enséñame", "muéstrame", "llévame"
    { patterns: [
      'ir a gastos', 'gastos', 'ver gastos', 'mostrar gastos', 'abrir gastos', 
      'llévame a gastos', 'llevame a gastos', 'quiero ver gastos', 'abre gastos', 
      'muéstrame gastos', 'muestrame gastos', 'muéstrame los gastos', 'muestrame los gastos',
      'llévame a la sección de gastos', 'llevame a la seccion de gastos', 
      'sección de gastos', 'seccion de gastos', 'a la sección de gastos',
      'muéstrame mis gastos', 'muestrame mis gastos', 'ver mis gastos', 'mostrar mis gastos', 
      'quiero ver mis gastos', 'enséñame mis gastos', 'ensename mis gastos', 'enséñame los gastos', 'ensename los gastos',
      'mis gastos', 'dame mis gastos', 'enseñame gastos', 'enséñame la sección de gastos',
      'muestra gastos', 'enseña gastos', 'quiero gastos', 'abreme gastos', 'abre los gastos'
    ], route: '/expenses', name: 'Gastos' },
    
    // Ingresos
    { patterns: [
      'ir a ingresos', 'ingresos', 'ver ingresos', 'mostrar ingresos', 
      'llévame a ingresos', 'llevame a ingresos', 'quiero ver ingresos', 'abre ingresos', 
      'muéstrame ingresos', 'muestrame ingresos', 'muéstrame los ingresos', 'muestrame los ingresos',
      'llévame a la sección de ingresos', 'llevame a la seccion de ingresos', 
      'sección de ingresos', 'seccion de ingresos', 'a la sección de ingresos', 
      'muéstrame mis ingresos', 'muestrame mis ingresos', 'ver mis ingresos', 'mostrar mis ingresos', 
      'mis ingresos', 'enséñame ingresos', 'ensename ingresos', 'enséñame los ingresos', 'ensename los ingresos',
      'enséñame la sección de ingresos', 'enseñame mis ingresos', 'muestra ingresos', 'quiero ingresos'
    ], route: '/income', name: 'Ingresos' },
    
    // Clientes
    { patterns: [
      'ir a clientes', 'clientes', 'ver clientes', 'mostrar clientes', 
      'llévame a clientes', 'llevame a clientes', 'quiero ver clientes', 'abre clientes', 
      'muéstrame clientes', 'muestrame clientes', 'muéstrame los clientes', 'muestrame los clientes',
      'llévame a la sección de clientes', 'llevame a la seccion de clientes', 
      'sección de clientes', 'seccion de clientes', 'a la sección de clientes', 
      'muéstrame mis clientes', 'muestrame mis clientes', 'ver mis clientes', 'mis clientes',
      'enséñame clientes', 'ensename clientes', 'enséñame los clientes', 'ensename los clientes',
      'enséñame la sección de clientes', 'enséñame mis clientes', 'muestra clientes', 'quiero clientes'
    ], route: '/clients', name: 'Clientes' },
    
    // Proyectos
    { patterns: [
      'ir a proyectos', 'proyectos', 'ver proyectos', 
      'llévame a proyectos', 'llevame a proyectos', 'quiero ver proyectos', 'abre proyectos', 
      'muéstrame proyectos', 'muestrame proyectos', 'muéstrame los proyectos', 'muestrame los proyectos',
      'llévame a la sección de proyectos', 'llevame a la seccion de proyectos', 
      'sección de proyectos', 'seccion de proyectos', 'a la sección de proyectos',
      'enséñame proyectos', 'ensename proyectos', 'enséñame los proyectos', 'enséñame la sección de proyectos',
      'muestra proyectos', 'quiero proyectos', 'mis proyectos'
    ], route: '/projects', name: 'Proyectos' },
    
    // Contratos
    { patterns: [
      'ir a contratos', 'contratos', 'ver contratos', 
      'llévame a contratos', 'llevame a contratos', 'quiero ver contratos', 'abre contratos', 
      'muéstrame contratos', 'muestrame contratos', 'muéstrame los contratos', 'muestrame los contratos',
      'llévame a la sección de contratos', 'llevame a la seccion de contratos', 
      'sección de contratos', 'seccion de contratos', 'a la sección de contratos',
      'enséñame contratos', 'ensename contratos', 'enséñame los contratos', 'enséñame la sección de contratos',
      'muestra contratos', 'quiero contratos', 'mis contratos'
    ], route: '/contracts', name: 'Contratos' },
    
    // Dashboard
    { patterns: [
      'ir al dashboard', 'dashboard', 'inicio', 'ir al inicio', 'panel', 
      'llévame al inicio', 'llevame al inicio', 'quiero ir al inicio', 'abre el dashboard', 
      'página principal', 'pagina principal', 'llévame al panel', 'llevame al panel',
      'muéstrame el dashboard', 'muestrame el dashboard', 'enséñame el dashboard', 'ensename el dashboard',
      'muestra el inicio', 'quiero el inicio', 'abre inicio', 'pantalla principal'
    ], route: '/dashboard', name: 'Dashboard' },
    
    // Kilometraje
    { patterns: [
      'ir a kilometraje', 'kilometraje', 'millas', 'kilómetros', 'kilometros', 
      'llévame a kilometraje', 'llevame a kilometraje', 'ver kilometraje', 
      'llévame a la sección de kilometraje', 'llevame a la seccion de kilometraje', 
      'sección de kilometraje', 'seccion de kilometraje', 'a la sección de kilometraje', 
      'abre kilometraje', 'muéstrame kilometraje', 'muestrame kilometraje', 'quiero ver kilometraje', 
      'mis viajes', 'viajes de trabajo', 'enséñame kilometraje', 'ensename kilometraje',
      'enséñame los viajes', 'muéstrame los viajes', 'muestra kilometraje', 'quiero kilometraje',
      'enséñame el kilometraje', 'enséñame la sección de kilometraje'
    ], route: '/mileage', name: 'Kilometraje' },
    
    // Patrimonio
    { patterns: [
      'ir a patrimonio', 'patrimonio', 'patrimonio neto', 'net worth', 
      'llévame a patrimonio', 'llevame a patrimonio', 'quiero ver patrimonio', 'mis activos', 
      'llévame a la sección de patrimonio', 'llevame a la seccion de patrimonio', 
      'sección de patrimonio', 'seccion de patrimonio', 'a la sección de patrimonio', 
      'abre patrimonio', 'muéstrame patrimonio', 'muestrame patrimonio',
      'enséñame patrimonio', 'ensename patrimonio', 'enséñame el patrimonio', 'enséñame mis activos',
      'muestra patrimonio', 'quiero patrimonio', 'enséñame la sección de patrimonio'
    ], route: '/net-worth', name: 'Patrimonio' },
    
    // Banca
    { patterns: [
      'ir a banca', 'banca', 'banco', 'transacciones bancarias', 
      'llévame a banca', 'llevame a banca', 'análisis bancario', 'analisis bancario', 
      'llévame a la sección de banca', 'llevame a la seccion de banca', 
      'sección de banca', 'seccion de banca', 'a la sección de banca', 
      'abre banca', 'estados de cuenta', 'muéstrame banca', 'muestrame banca',
      'enséñame banca', 'ensename banca', 'enséñame la banca', 'enséñame el banco',
      'muestra banca', 'quiero banca', 'enséñame la sección de banca'
    ], route: '/banking', name: 'Banca' },
    
    // Configuración
    { patterns: [
      'ir a configuración', 'configuración', 'configuracion', 'ajustes', 'settings', 
      'llévame a configuración', 'llevame a configuración', 'llevame a configuracion', 'quiero configurar', 
      'llévame a la sección de configuración', 'sección de configuración', 
      'abre configuración', 'abre configuracion', 'muéstrame configuración', 'muestrame configuracion',
      'enséñame configuración', 'ensename configuracion', 'enséñame los ajustes',
      'muestra configuración', 'quiero configuración'
    ], route: '/settings', name: 'Configuración' },
    
    // Captura
    { patterns: [
      'capturar', 'capturar gasto', 'tomar foto', 'escanear recibo', 'quiero capturar', 'escanea un recibo',
      'foto de recibo', 'fotografiar recibo', 'captura rápida', 'captura rapida'
    ], route: '/capture', name: 'Captura Rápida' },
    
    // Acciones específicas
    { patterns: ['agregar gasto', 'nuevo gasto', 'añadir gasto', 'quiero agregar un gasto', 'registrar gasto'], route: '/expenses', action: 'add-expense', name: 'Agregar Gasto' },
    { patterns: ['agregar ingreso', 'nuevo ingreso', 'añadir ingreso', 'quiero agregar un ingreso', 'registrar ingreso'], route: '/income', action: 'add-income', name: 'Agregar Ingreso' },
    { patterns: ['agregar cliente', 'nuevo cliente', 'quiero agregar un cliente', 'registrar cliente'], route: '/clients', action: 'add-client', name: 'Agregar Cliente' },
    
    // Bandeja de Caos
    { patterns: [
      'bandeja', 'bandeja de caos', 'revisar recibos', 'chaos inbox', 'recibos pendientes', 
      'llévame a la bandeja', 'llevame a la bandeja', 'sección de bandeja',
      'muéstrame la bandeja', 'enséñame la bandeja', 'abre la bandeja'
    ], route: '/chaos-inbox', name: 'Bandeja de Caos' },
    
    // Reconciliación
    { patterns: [
      'reconciliación', 'reconciliacion', 'reconciliar', 'conciliación', 'conciliacion', 'conciliar cuentas', 
      'llévame a reconciliación', 'llevame a reconciliacion', 'sección de reconciliación',
      'muéstrame reconciliación', 'enséñame reconciliación'
    ], route: '/reconciliation', name: 'Reconciliación' },
    
    // Perfil de Negocio
    { patterns: [
      'perfil de negocio', 'perfil empresarial', 'mi negocio', 'datos del negocio', 
      'llévame al perfil de negocio', 'llevame al perfil de negocio', 'sección de negocio',
      'muéstrame mi negocio', 'enséñame mi negocio'
    ], route: '/business-profile', name: 'Perfil de Negocio' },
    
    // Notificaciones
    { patterns: [
      'notificaciones', 'alertas', 'ver notificaciones', 'mis alertas', 
      'llévame a notificaciones', 'llevame a notificaciones', 'sección de notificaciones', 'abre notificaciones',
      'muéstrame notificaciones', 'enséñame notificaciones', 'muéstrame las alertas'
    ], route: '/notifications', name: 'Notificaciones' },
    
    // Mentoría
    { patterns: [
      'mentoría', 'mentoria', 'ir a mentoría', 'ir a mentoria', 'educación financiera', 'educacion financiera', 
      'aprender finanzas', 'llévame a mentoría', 'llevame a mentoria', 
      'sección de mentoría', 'seccion de mentoria', 'llévame a la sección de mentoría', 
      'abre mentoría', 'abre mentoria', 'muéstrame mentoría', 'muestrame mentoria',
      'enséñame mentoría', 'ensename mentoria', 'enséñame la mentoría', 'enséñame la sección de mentoría',
      'muestra mentoría', 'quiero mentoría', 'educación', 'biblioteca'
    ], route: '/mentorship', name: 'Mentoría' },
    
    // Impuestos
    { patterns: [
      'impuestos', 'calendario fiscal', 'ir a impuestos', 'ver impuestos', 'fechas de impuestos', 
      'llévame a impuestos', 'llevame a impuestos', 'sección de impuestos', 'seccion de impuestos', 
      'llévame a la sección de impuestos', 'calendario de impuestos', 'abre impuestos',
      'muéstrame impuestos', 'muestrame impuestos', 'enséñame impuestos', 'ensename impuestos',
      'enséñame los impuestos', 'enséñame la sección de impuestos', 'muestra impuestos', 'quiero impuestos',
      'fiscal', 'tax', 'taxes'
    ], route: '/tax-calendar', name: 'Calendario Fiscal' },
  ],
  en: [
    // Expenses - EXTENSIVE patterns
    { patterns: [
      'go to expenses', 'expenses', 'show expenses', 'open expenses', 
      'take me to expenses', 'i want to see expenses', 'show me expenses', 
      'take me to the expenses section', 'expenses section', 'the expenses section', 
      'show me my expenses', 'my expenses', 'view my expenses', 'let me see my expenses', 'display my expenses',
      'teach me expenses', 'teach me the expenses section', 'show expenses section',
      'bring up expenses', 'expenses please', 'display expenses'
    ], route: '/expenses', name: 'Expenses' },
    
    // Income
    { patterns: [
      'go to income', 'income', 'show income', 
      'take me to income', 'i want to see income', 'show me income', 
      'take me to the income section', 'income section', 'the income section', 
      'show me my income', 'my income', 'view my income',
      'teach me income', 'teach me the income section', 'display income'
    ], route: '/income', name: 'Income' },
    
    // Clients
    { patterns: [
      'go to clients', 'clients', 'show clients', 
      'take me to clients', 'i want to see clients', 'show me clients', 
      'take me to the clients section', 'clients section', 'the clients section', 
      'show me my clients', 'my clients', 'view my clients',
      'teach me clients', 'teach me the clients section', 'display clients'
    ], route: '/clients', name: 'Clients' },
    
    // Projects
    { patterns: [
      'go to projects', 'projects', 'show projects', 
      'take me to projects', 'i want to see projects', 'show me projects', 
      'take me to the projects section', 'projects section', 'the projects section',
      'teach me projects', 'my projects', 'display projects'
    ], route: '/projects', name: 'Projects' },
    
    // Contracts
    { patterns: [
      'go to contracts', 'contracts', 'show contracts', 
      'take me to contracts', 'i want to see contracts', 
      'take me to the contracts section', 'contracts section', 'the contracts section',
      'teach me contracts', 'my contracts', 'display contracts'
    ], route: '/contracts', name: 'Contracts' },
    
    // Dashboard
    { patterns: [
      'go to dashboard', 'dashboard', 'home', 'go home', 'take me home', 
      'main page', 'i want to go home', 'take me to the dashboard',
      'show me the dashboard', 'teach me the dashboard', 'display dashboard'
    ], route: '/dashboard', name: 'Dashboard' },
    
    // Mileage
    { patterns: [
      'go to mileage', 'mileage', 'miles', 'kilometers', 
      'take me to mileage', 'show mileage', 
      'take me to the mileage section', 'mileage section', 'the mileage section', 
      'work trips', 'my trips', 'trip tracking',
      'teach me mileage', 'show me my trips', 'display mileage'
    ], route: '/mileage', name: 'Mileage' },
    
    // Net Worth
    { patterns: [
      'go to net worth', 'net worth', 'wealth', 'assets', 
      'take me to net worth', 'show my assets', 
      'take me to the net worth section', 'net worth section', 'the net worth section', 
      'my wealth', 'teach me net worth', 'show me my net worth', 'display net worth'
    ], route: '/net-worth', name: 'Net Worth' },
    
    // Banking
    { patterns: [
      'go to banking', 'banking', 'bank', 'bank transactions', 
      'take me to banking', 'bank analysis', 
      'take me to the banking section', 'banking section', 'the banking section', 
      'bank statements', 'teach me banking', 'show me banking', 'display banking'
    ], route: '/banking', name: 'Banking' },
    
    // Settings
    { patterns: [
      'go to settings', 'settings', 'configuration', 
      'take me to settings', 'i want to configure', 
      'take me to the settings section', 'settings section', 'the settings section', 
      'preferences', 'teach me settings', 'show me settings', 'display settings'
    ], route: '/settings', name: 'Settings' },
    
    // Capture
    { patterns: [
      'capture', 'capture expense', 'take photo', 'scan receipt', 'i want to capture', 'scan a receipt',
      'quick capture', 'photo receipt'
    ], route: '/capture', name: 'Quick Capture' },
    
    // Actions
    { patterns: ['add expense', 'new expense', 'create expense', 'i want to add an expense', 'record expense'], route: '/expenses', action: 'add-expense', name: 'Add Expense' },
    { patterns: ['add income', 'new income', 'create income', 'i want to add income', 'record income'], route: '/income', action: 'add-income', name: 'Add Income' },
    { patterns: ['add client', 'new client', 'create client', 'i want to add a client', 'register client'], route: '/clients', action: 'add-client', name: 'Add Client' },
    
    // Chaos Inbox
    { patterns: [
      'inbox', 'chaos inbox', 'review receipts', 'pending receipts', 
      'take me to inbox', 'inbox section', 'show me inbox', 'teach me inbox'
    ], route: '/chaos-inbox', name: 'Chaos Inbox' },
    
    // Reconciliation
    { patterns: [
      'reconciliation', 'reconcile', 'bank reconciliation', 'reconcile accounts', 
      'take me to reconciliation', 'reconciliation section', 'show me reconciliation'
    ], route: '/reconciliation', name: 'Reconciliation' },
    
    // Business Profile
    { patterns: [
      'business profile', 'my business', 'business data', 
      'take me to business profile', 'business section', 'show me my business'
    ], route: '/business-profile', name: 'Business Profile' },
    
    // Notifications
    { patterns: [
      'notifications', 'alerts', 'show notifications', 'my alerts', 
      'take me to notifications', 'notifications section', 'show me alerts'
    ], route: '/notifications', name: 'Notifications' },
    
    // Mentorship
    { patterns: [
      'mentorship', 'go to mentorship', 'financial education', 'learn finance', 
      'take me to mentorship', 'mentorship section', 'the mentorship section',
      'teach me mentorship', 'education', 'library', 'show me mentorship'
    ], route: '/mentorship', name: 'Mentorship' },
    
    // Taxes
    { patterns: [
      'taxes', 'tax calendar', 'go to taxes', 'see taxes', 'tax dates', 
      'take me to taxes', 'taxes section', 'the taxes section', 'tax deadlines',
      'teach me taxes', 'show me taxes', 'fiscal calendar'
    ], route: '/tax-calendar', name: 'Tax Calendar' },
  ],
};

// Voice query commands (return data directly)
export type QueryType = 
  | 'expenses_month' | 'expenses_year' | 'income_month' | 'income_year' 
  | 'balance' | 'client_count' | 'project_count' | 'pending_receipts' 
  | 'biggest_expense' | 'top_category' | 'tax_summary' | 'tax_owed' 
  | 'deductible_total' | 'billable_total'
  // NEW QUERIES
  | 'month_comparison' | 'subscriptions_list' | 'savings_needed' 
  | 'cash_flow_projection' | 'expense_by_category' | 'income_by_source'
  | 'net_worth_summary' | 'fire_progress' | 'mileage_summary';

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
    // NEW SPANISH QUERIES
    { patterns: ['comparar este mes', 'comparar mes anterior', 'diferencia con mes pasado', 'cómo voy vs mes anterior', 'comparación mensual'], queryType: 'month_comparison' },
    { patterns: ['mis suscripciones', 'mostrar suscripciones', 'cuánto pago en suscripciones', 'pagos recurrentes', 'lista de suscripciones'], queryType: 'subscriptions_list' },
    { patterns: ['cuánto debo ahorrar', 'cuánto necesito ahorrar', 'meta de ahorro', 'ahorro necesario para'], queryType: 'savings_needed' },
    { patterns: ['proyección de flujo', 'flujo de caja', 'proyección financiera', 'cómo me irá', 'pronóstico'], queryType: 'cash_flow_projection' },
    { patterns: ['gastos por categoría', 'desglose de gastos', 'distribución de gastos'], queryType: 'expense_by_category' },
    { patterns: ['ingresos por fuente', 'desglose de ingresos', 'de dónde viene mi dinero'], queryType: 'income_by_source' },
    { patterns: ['mi patrimonio', 'patrimonio neto', 'cuánto tengo en total', 'activos menos pasivos'], queryType: 'net_worth_summary' },
    { patterns: ['progreso fire', 'cuánto falta para fire', 'libertad financiera progreso', 'cómo voy con fire'], queryType: 'fire_progress' },
    { patterns: ['resumen de kilometraje', 'kilómetros recorridos', 'viajes de trabajo total', 'deducción por auto'], queryType: 'mileage_summary' },
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
    // NEW ENGLISH QUERIES
    { patterns: ['compare this month', 'compare to last month', 'difference from last month', 'how am i vs last month', 'monthly comparison'], queryType: 'month_comparison' },
    { patterns: ['my subscriptions', 'show subscriptions', 'how much do i pay in subscriptions', 'recurring payments', 'list subscriptions'], queryType: 'subscriptions_list' },
    { patterns: ['how much should i save', 'how much do i need to save', 'savings goal', 'savings needed for'], queryType: 'savings_needed' },
    { patterns: ['cash flow projection', 'financial projection', 'how will i do', 'forecast'], queryType: 'cash_flow_projection' },
    { patterns: ['expenses by category', 'expense breakdown', 'expense distribution'], queryType: 'expense_by_category' },
    { patterns: ['income by source', 'income breakdown', 'where does my money come from'], queryType: 'income_by_source' },
    { patterns: ['my net worth', 'net worth summary', 'total assets', 'assets minus liabilities'], queryType: 'net_worth_summary' },
    { patterns: ['fire progress', 'how far from fire', 'financial freedom progress', 'how am i doing with fire'], queryType: 'fire_progress' },
    { patterns: ['mileage summary', 'kilometers driven', 'work trips total', 'car deduction'], queryType: 'mileage_summary' },
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
