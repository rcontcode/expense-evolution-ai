/**
 * Highlight Detection System
 * Detects UI elements mentioned in assistant responses and triggers visual highlighting
 */

import { HIGHLIGHTABLE_ELEMENTS, HighlightTarget } from '@/contexts/HighlightContext';

// Keywords that map to highlightable elements
const HIGHLIGHT_KEYWORDS: Record<string, { es: string[]; en: string[] }> = {
  'add-trip-button': {
    es: ['agregar viaje', 'nuevo viaje', 'registrar viaje', 'añadir viaje', 'crear viaje', 'botón de viaje', 'registrar un viaje', 'añadir un viaje'],
    en: ['add trip', 'new trip', 'register trip', 'create trip', 'trip button', 'add a trip'],
  },
  'mileage-table': {
    es: ['tabla de viajes', 'lista de viajes', 'historial de viajes', 'viajes registrados', 'tus viajes'],
    en: ['trip table', 'trip list', 'trip history', 'registered trips', 'your trips'],
  },
  'mileage-summary': {
    es: ['resumen de kilometraje', 'total de kilómetros', 'deducción de kilometraje'],
    en: ['mileage summary', 'total kilometers', 'mileage deduction'],
  },
  'year-selector': {
    es: ['selector de año', 'cambiar año', 'filtrar por año', 'año fiscal'],
    en: ['year selector', 'change year', 'filter by year', 'fiscal year'],
  },
  'import-button': {
    es: ['importar', 'importación masiva', 'cargar viajes', 'subir archivo'],
    en: ['import', 'bulk import', 'upload trips', 'upload file'],
  },
  'add-expense-button': {
    es: ['agregar gasto', 'nuevo gasto', 'registrar gasto', 'añadir gasto', 'crear gasto', 'botón de gasto'],
    en: ['add expense', 'new expense', 'register expense', 'create expense', 'expense button'],
  },
  'expenses-table': {
    es: ['tabla de gastos', 'lista de gastos', 'historial de gastos', 'gastos registrados', 'tus gastos'],
    en: ['expense table', 'expense list', 'expense history', 'registered expenses', 'your expenses'],
  },
  'expense-filters': {
    es: ['filtros', 'filtrar gastos', 'buscar gastos', 'filtros de gastos'],
    en: ['filters', 'filter expenses', 'search expenses', 'expense filters'],
  },
  'quick-capture': {
    es: ['captura rápida', 'escanear recibo', 'fotografiar recibo', 'cámara', 'capturar con cámara'],
    en: ['quick capture', 'scan receipt', 'photograph receipt', 'camera', 'capture with camera'],
  },
  'add-income-button': {
    es: ['agregar ingreso', 'nuevo ingreso', 'registrar ingreso', 'añadir ingreso'],
    en: ['add income', 'new income', 'register income', 'create income'],
  },
  'income-table': {
    es: ['tabla de ingresos', 'lista de ingresos', 'historial de ingresos', 'ingresos registrados'],
    en: ['income table', 'income list', 'income history', 'registered income'],
  },
  'balance-card': {
    es: ['tarjeta de balance', 'balance general', 'resumen financiero', 'tu balance'],
    en: ['balance card', 'general balance', 'financial summary', 'your balance'],
  },
  'control-center': {
    es: ['centro de control', 'panel de control', 'herramientas', 'pestañas'],
    en: ['control center', 'control panel', 'tools', 'tabs'],
  },
  'timeline-chart': {
    es: ['línea de tiempo', 'gráfico anual', 'evolución', 'tendencia anual'],
    en: ['timeline', 'annual chart', 'evolution', 'annual trend'],
  },
  'add-client-button': {
    es: ['agregar cliente', 'nuevo cliente', 'registrar cliente', 'añadir cliente'],
    en: ['add client', 'new client', 'register client', 'create client'],
  },
  'clients-grid': {
    es: ['lista de clientes', 'clientes registrados', 'tus clientes', 'tarjetas de clientes'],
    en: ['client list', 'registered clients', 'your clients', 'client cards'],
  },
  'add-project-button': {
    es: ['agregar proyecto', 'nuevo proyecto', 'crear proyecto', 'añadir proyecto'],
    en: ['add project', 'new project', 'create project', 'register project'],
  },
  'projects-grid': {
    es: ['lista de proyectos', 'proyectos registrados', 'tus proyectos', 'tarjetas de proyectos'],
    en: ['project list', 'registered projects', 'your projects', 'project cards'],
  },
  'assets-section': {
    es: ['sección de activos', 'tus activos', 'lista de activos', 'agregar activo'],
    en: ['assets section', 'your assets', 'asset list', 'add asset'],
  },
  'liabilities-section': {
    es: ['sección de pasivos', 'tus pasivos', 'lista de pasivos', 'deudas', 'agregar pasivo'],
    en: ['liabilities section', 'your liabilities', 'liability list', 'debts', 'add liability'],
  },
  'net-worth-chart': {
    es: ['gráfico de patrimonio', 'evolución del patrimonio', 'patrimonio neto'],
    en: ['net worth chart', 'net worth evolution', 'net worth'],
  },
  'sidebar-nav': {
    es: ['menú lateral', 'navegación', 'barra lateral', 'menú de navegación'],
    en: ['sidebar', 'navigation', 'side menu', 'nav menu'],
  },
  'entity-selector': {
    es: ['selector de entidad', 'entidad fiscal', 'cambiar entidad', 'jurisdicción'],
    en: ['entity selector', 'fiscal entity', 'change entity', 'jurisdiction'],
  },
  'chat-assistant': {
    es: ['asistente', 'chat', 'ayuda por voz', 'asistente financiero'],
    en: ['assistant', 'chat', 'voice help', 'financial assistant'],
  },
  // Add more page-specific elements
  'capture-photo-button': {
    es: ['tomar foto', 'fotografiar', 'usar cámara', 'escanear'],
    en: ['take photo', 'photograph', 'use camera', 'scan'],
  },
  'capture-file-button': {
    es: ['subir archivo', 'cargar documento', 'adjuntar archivo'],
    en: ['upload file', 'load document', 'attach file'],
  },
  'capture-voice-button': {
    es: ['entrada por voz', 'dictar', 'micrófono', 'voz'],
    en: ['voice input', 'dictate', 'microphone', 'voice'],
  },
  'bulk-assign-button': {
    es: ['asignar masivamente', 'asignación masiva', 'bulk assign'],
    en: ['bulk assign', 'mass assign', 'batch assign'],
  },
  'reimbursement-report': {
    es: ['reporte de reembolso', 'informe de reembolso', 'generar reporte'],
    en: ['reimbursement report', 'generate report', 'expense report'],
  },
  'export-button': {
    es: ['exportar', 'descargar datos', 'exportar a excel'],
    en: ['export', 'download data', 'export to excel'],
  },
  // Banking page
  'bank-import-guide': {
    es: ['importar estado de cuenta', 'subir estado bancario', 'importar banco', 'cargar extracto'],
    en: ['import bank statement', 'upload statement', 'import bank', 'load extract'],
  },
  'bank-analysis-dashboard': {
    es: ['análisis bancario', 'dashboard bancario', 'panel de bancos', 'ver análisis'],
    en: ['bank analysis', 'bank dashboard', 'bank panel', 'view analysis'],
  },
  // Contracts page
  'upload-contract-button': {
    es: ['subir contrato', 'nuevo contrato', 'agregar contrato', 'cargar contrato'],
    en: ['upload contract', 'new contract', 'add contract', 'load contract'],
  },
  'contracts-table': {
    es: ['tabla de contratos', 'lista de contratos', 'contratos registrados', 'tus contratos'],
    en: ['contracts table', 'contract list', 'registered contracts', 'your contracts'],
  },
  // Mentorship page
  'mentorship-level': {
    es: ['nivel de mentoría', 'tu nivel', 'progreso de mentoría', 'experiencia'],
    en: ['mentorship level', 'your level', 'mentorship progress', 'experience'],
  },
  'mentorship-tabs': {
    es: ['pestañas de mentoría', 'secciones de mentoría', 'mentores'],
    en: ['mentorship tabs', 'mentorship sections', 'mentors'],
  },
  'mentor-selector': {
    es: ['selector de mentor', 'elegir mentor', 'kiyosaki', 'jim rohn', 'brian tracy'],
    en: ['mentor selector', 'choose mentor', 'kiyosaki', 'jim rohn', 'brian tracy'],
  },
  'financial-library': {
    es: ['biblioteca financiera', 'libros', 'recursos educativos', 'biblioteca'],
    en: ['financial library', 'books', 'educational resources', 'library'],
  },
  // Tax Calendar page
  'tax-status-cards': {
    es: ['tarjetas de estado fiscal', 'resumen fiscal', 'estado tributario'],
    en: ['tax status cards', 'tax summary', 'tax status'],
  },
  'tax-tabs': {
    es: ['pestañas de impuestos', 'secciones fiscales', 'herramientas fiscales'],
    en: ['tax tabs', 'tax sections', 'tax tools'],
  },
  'tax-estimator': {
    es: ['estimador de impuestos', 'calculadora fiscal', 'calcular impuestos', 'estimar impuestos'],
    en: ['tax estimator', 'tax calculator', 'calculate taxes', 'estimate taxes'],
  },
  'tax-tab-list': {
    es: ['línea de tiempo', 'fechas límite', 'guía fiscal', 'recursos fiscales'],
    en: ['timeline', 'deadlines', 'tax guide', 'tax resources'],
  },
  // Settings page
  'voice-preferences': {
    es: ['preferencias de voz', 'configuración de voz', 'asistente de voz', 'velocidad de voz'],
    en: ['voice preferences', 'voice settings', 'voice assistant', 'voice speed'],
  },
  'theme-settings': {
    es: ['tema', 'apariencia', 'modo oscuro', 'modo claro', 'colores'],
    en: ['theme', 'appearance', 'dark mode', 'light mode', 'colors'],
  },
  'language-settings': {
    es: ['idioma', 'cambiar idioma', 'español', 'inglés'],
    en: ['language', 'change language', 'spanish', 'english'],
  },
  'fiscal-entities': {
    es: ['entidades fiscales', 'jurisdicciones', 'países fiscales', 'multi-país'],
    en: ['fiscal entities', 'jurisdictions', 'tax countries', 'multi-country'],
  },
  'subscription-settings': {
    es: ['suscripción', 'plan', 'premium', 'pro', 'actualizar plan'],
    en: ['subscription', 'plan', 'premium', 'pro', 'upgrade plan'],
  },
};

// Detect which elements should be highlighted based on assistant response text
export function detectHighlightTargets(
  text: string,
  language: 'es' | 'en' = 'es'
): HighlightTarget[] {
  const normalizedText = text.toLowerCase();
  const targets: HighlightTarget[] = [];
  const addedSelectors = new Set<string>();

  for (const [elementId, keywords] of Object.entries(HIGHLIGHT_KEYWORDS)) {
    const langKeywords = keywords[language] || keywords.es;
    
    for (const keyword of langKeywords) {
      if (normalizedText.includes(keyword.toLowerCase()) && !addedSelectors.has(elementId)) {
        targets.push({
          selector: elementId,
          label: keyword,
        });
        addedSelectors.add(elementId);
        break; // Only add each element once
      }
    }
  }

  return targets;
}

// Get page-specific highlight elements
export function getPageHighlightElements(pathname: string): string[] {
  const pageElements: Record<string, string[]> = {
    '/mileage': ['add-trip-button', 'import-button', 'mileage-table', 'year-selector', 'mileage-summary'],
    '/expenses': ['add-expense-button', 'quick-capture', 'expense-filters', 'expenses-table', 'export-button', 'bulk-assign-button', 'reimbursement-report'],
    '/income': ['add-income-button', 'income-table'],
    '/dashboard': ['balance-card', 'timeline-chart', 'control-center'],
    '/clients': ['add-client-button', 'clients-grid'],
    '/projects': ['add-project-button', 'projects-grid'],
    '/net-worth': ['assets-section', 'liabilities-section', 'net-worth-chart'],
    '/banking': ['bank-import-guide', 'bank-analysis-dashboard'],
    '/contracts': ['upload-contract-button', 'contracts-table'],
    '/mentorship': ['mentorship-level', 'mentorship-tabs', 'mentor-selector', 'financial-library'],
    '/tax-calendar': ['tax-status-cards', 'tax-tabs', 'tax-estimator', 'tax-tab-list'],
    '/settings': ['voice-preferences', 'theme-settings', 'language-settings', 'fiscal-entities', 'subscription-settings'],
  };

  return pageElements[pathname] || [];
}

// Check if navigation to a page should trigger any automatic highlights
export function getNavigationHighlights(pathname: string, language: 'es' | 'en' = 'es'): HighlightTarget[] {
  const navigationHighlights: Record<string, HighlightTarget[]> = {
    '/mileage': [
      { selector: 'add-trip-button', label: language === 'es' ? 'Agregar viaje' : 'Add trip' },
    ],
    '/expenses': [
      { selector: 'add-expense-button', label: language === 'es' ? 'Agregar gasto' : 'Add expense' },
      { selector: 'quick-capture', label: language === 'es' ? 'Captura rápida' : 'Quick capture' },
    ],
    '/income': [
      { selector: 'add-income-button', label: language === 'es' ? 'Agregar ingreso' : 'Add income' },
    ],
    '/clients': [
      { selector: 'add-client-button', label: language === 'es' ? 'Agregar cliente' : 'Add client' },
    ],
    '/projects': [
      { selector: 'add-project-button', label: language === 'es' ? 'Agregar proyecto' : 'Add project' },
    ],
    '/net-worth': [
      { selector: 'assets-section', label: language === 'es' ? 'Activos' : 'Assets' },
    ],
    '/banking': [
      { selector: 'bank-import-guide', label: language === 'es' ? 'Importar estados' : 'Import statements' },
    ],
    '/contracts': [
      { selector: 'upload-contract-button', label: language === 'es' ? 'Subir contrato' : 'Upload contract' },
    ],
    '/mentorship': [
      { selector: 'mentorship-level', label: language === 'es' ? 'Tu nivel' : 'Your level' },
      { selector: 'mentor-selector', label: language === 'es' ? 'Elegir mentor' : 'Choose mentor' },
    ],
    '/tax-calendar': [
      { selector: 'tax-status-cards', label: language === 'es' ? 'Estado fiscal' : 'Tax status' },
      { selector: 'tax-estimator', label: language === 'es' ? 'Estimador' : 'Estimator' },
    ],
    '/settings': [
      { selector: 'voice-preferences', label: language === 'es' ? 'Preferencias de voz' : 'Voice preferences' },
    ],
  };

  return navigationHighlights[pathname] || [];
}
