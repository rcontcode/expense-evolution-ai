import { Tutorial, TutorialStep } from '@/hooks/utils/useTutorialRunner';

// ============================================================================
// TUTORIAL DEFINITIONS
// Step-by-step interactive guides for app features
// ============================================================================

export const TUTORIALS: Record<string, Tutorial> = {
  'add-expense': {
    id: 'add-expense',
    name: {
      es: 'Agregar un gasto',
      en: 'Add an expense',
    },
    description: {
      es: 'Aprende a registrar un gasto paso a paso',
      en: 'Learn how to record an expense step by step',
    },
    steps: [
      {
        route: '/expenses',
        highlight: 'add-expense-button',
        narration: 'Primero, haz clic en el botón "Agregar Gasto" para abrir el formulario.',
      },
      {
        highlight: 'expense-form-vendor',
        narration: 'Aquí escribes el nombre del comercio o proveedor donde realizaste el gasto.',
        waitForClick: true,
      },
      {
        highlight: 'expense-form-amount',
        narration: 'Ingresa el monto total del gasto.',
      },
      {
        highlight: 'expense-form-category',
        narration: 'Selecciona la categoría que mejor describe el gasto. Esto ayuda con deducciones fiscales.',
      },
      {
        highlight: 'expense-form-date',
        narration: 'Verifica la fecha del gasto. Por defecto es hoy.',
      },
      {
        highlight: 'expense-form-submit',
        narration: 'Finalmente, haz clic en Guardar para registrar el gasto. ¡Listo!',
      },
    ],
  },

  'quick-capture': {
    id: 'quick-capture',
    name: {
      es: 'Captura rápida de recibos',
      en: 'Quick receipt capture',
    },
    description: {
      es: 'Escanea recibos con tu cámara',
      en: 'Scan receipts with your camera',
    },
    steps: [
      {
        route: '/expenses',
        highlight: 'quick-capture',
        narration: 'Usa el botón de Captura Rápida para escanear un recibo con tu cámara.',
      },
      {
        highlight: 'capture-photo-button',
        narration: 'Toma una foto del recibo. La IA extraerá automáticamente el monto, fecha y comercio.',
      },
      {
        highlight: 'capture-confirm',
        narration: 'Revisa los datos extraídos y confirma para crear el gasto automáticamente.',
      },
    ],
  },

  'add-income': {
    id: 'add-income',
    name: {
      es: 'Registrar un ingreso',
      en: 'Record income',
    },
    description: {
      es: 'Aprende a registrar ingresos',
      en: 'Learn how to record income',
    },
    steps: [
      {
        route: '/income',
        highlight: 'add-income-button',
        narration: 'Haz clic en el botón "Agregar Ingreso" para registrar un nuevo ingreso.',
      },
      {
        highlight: 'income-form-amount',
        narration: 'Ingresa el monto que recibiste.',
      },
      {
        highlight: 'income-form-type',
        narration: 'Selecciona el tipo: pago de cliente, salario, freelance, etc.',
      },
      {
        highlight: 'income-form-client',
        narration: 'Opcionalmente, asocia el ingreso a un cliente para mejor seguimiento.',
      },
    ],
  },

  'add-client': {
    id: 'add-client',
    name: {
      es: 'Agregar un cliente',
      en: 'Add a client',
    },
    description: {
      es: 'Registra clientes para facturación',
      en: 'Register clients for billing',
    },
    steps: [
      {
        route: '/clients',
        highlight: 'add-client-button',
        narration: 'Haz clic en "Agregar Cliente" para registrar un nuevo cliente.',
      },
      {
        highlight: 'client-form-name',
        narration: 'Ingresa el nombre de la empresa o persona.',
      },
      {
        highlight: 'client-form-contact',
        narration: 'Agrega información de contacto: email y teléfono.',
      },
      {
        highlight: 'client-form-address',
        narration: 'La dirección es útil para calcular kilometraje de viajes de trabajo.',
      },
    ],
  },

  'add-mileage': {
    id: 'add-mileage',
    name: {
      es: 'Registrar un viaje',
      en: 'Record a trip',
    },
    description: {
      es: 'Registra viajes para deducción de kilometraje',
      en: 'Record trips for mileage deduction',
    },
    steps: [
      {
        route: '/mileage',
        highlight: 'add-trip-button',
        narration: 'Haz clic en "Agregar Viaje" para registrar un viaje de trabajo.',
      },
      {
        highlight: 'mileage-form-route',
        narration: 'Describe la ruta: de dónde a dónde viajaste.',
      },
      {
        highlight: 'mileage-form-km',
        narration: 'Ingresa los kilómetros recorridos.',
      },
      {
        highlight: 'mileage-form-purpose',
        narration: 'Explica el propósito del viaje (reunión con cliente, entrega, etc).',
      },
    ],
  },

  'navigate-app': {
    id: 'navigate-app',
    name: {
      es: 'Tour de la aplicación',
      en: 'App tour',
    },
    description: {
      es: 'Conoce las secciones principales',
      en: 'Learn the main sections',
    },
    steps: [
      {
        route: '/dashboard',
        highlight: 'balance-card',
        narration: 'Este es tu Dashboard. Aquí ves el balance general de tus finanzas.',
      },
      {
        route: '/expenses',
        highlight: 'add-expense-button',
        narration: 'En Gastos registras todos tus gastos de negocio para deducciones fiscales.',
      },
      {
        route: '/income',
        highlight: 'add-income-button',
        narration: 'En Ingresos registras pagos de clientes, salario y otras fuentes de dinero.',
      },
      {
        route: '/clients',
        highlight: 'clients-grid',
        narration: 'En Clientes gestionas la información de tus clientes para facturación.',
      },
      {
        route: '/mileage',
        highlight: 'mileage-summary',
        narration: 'En Kilometraje registras viajes de trabajo para deducción fiscal.',
      },
      {
        route: '/dashboard',
        highlight: 'chat-assistant',
        narration: 'Y yo soy tu asistente. Puedes preguntarme cualquier cosa o pedirme que navegue por ti.',
      },
    ],
  },

  'filter-expenses': {
    id: 'filter-expenses',
    name: {
      es: 'Filtrar gastos',
      en: 'Filter expenses',
    },
    description: {
      es: 'Aprende a buscar y filtrar gastos',
      en: 'Learn to search and filter expenses',
    },
    steps: [
      {
        route: '/expenses',
        highlight: 'expense-filters',
        narration: 'Usa los filtros para buscar gastos específicos.',
      },
      {
        highlight: 'filter-date-range',
        narration: 'Filtra por rango de fechas para ver gastos de un período específico.',
      },
      {
        highlight: 'filter-category',
        narration: 'Filtra por categoría para ver solo gastos de cierto tipo.',
      },
      {
        highlight: 'filter-client',
        narration: 'Filtra por cliente para ver gastos asociados a un cliente específico.',
      },
    ],
  },
};

// ============================================================================
// TUTORIAL FINDER
// Match user requests to tutorials
// ============================================================================

const TUTORIAL_KEYWORDS: Record<string, string[]> = {
  'add-expense': ['agregar gasto', 'registrar gasto', 'nuevo gasto', 'crear gasto', 'add expense', 'create expense', 'cómo registro un gasto', 'cómo agrego un gasto'],
  'quick-capture': ['escanear recibo', 'captura rápida', 'foto de recibo', 'scan receipt', 'quick capture', 'cámara'],
  'add-income': ['agregar ingreso', 'registrar ingreso', 'nuevo ingreso', 'add income', 'record income', 'cómo registro un ingreso'],
  'add-client': ['agregar cliente', 'nuevo cliente', 'add client', 'create client', 'cómo agrego un cliente'],
  'add-mileage': ['agregar viaje', 'registrar viaje', 'kilometraje', 'add trip', 'mileage', 'cómo registro un viaje'],
  'navigate-app': ['tour', 'recorrido', 'enséñame la app', 'muéstrame todo', 'cómo funciona', 'app tour', 'show me around'],
  'filter-expenses': ['filtrar gastos', 'buscar gastos', 'filter expenses', 'search expenses', 'cómo filtro'],
};

export function findTutorialByQuery(query: string): Tutorial | null {
  const normalizedQuery = query.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const [tutorialId, keywords] of Object.entries(TUTORIAL_KEYWORDS)) {
    for (const keyword of keywords) {
      const normalizedKeyword = keyword.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      
      if (normalizedQuery.includes(normalizedKeyword)) {
        return TUTORIALS[tutorialId] || null;
      }
    }
  }

  return null;
}

export function getTutorialById(id: string): Tutorial | null {
  return TUTORIALS[id] || null;
}

export function getAllTutorials(): Tutorial[] {
  return Object.values(TUTORIALS);
}
