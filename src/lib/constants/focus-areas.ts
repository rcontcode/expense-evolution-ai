export type FocusAreaId = 'negocio' | 'familia' | 'diadia' | 'crecimiento' | 'impuestos';

export interface FocusArea {
  id: FocusAreaId;
  name: { es: string; en: string };
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: { es: string; en: string };
  tabs: string[];
  sidebarItems: string[];
}

export const FOCUS_AREAS: Record<FocusAreaId, FocusArea> = {
  negocio: {
    id: 'negocio',
    name: { es: 'Mi Negocio', en: 'My Business' },
    emoji: '💼',
    color: 'hsl(var(--chart-1))',
    bgColor: 'hsl(var(--chart-1) / 0.1)',
    borderColor: 'hsl(var(--chart-1) / 0.3)',
    description: { 
      es: 'Clientes, contratos, facturación, kilometraje', 
      en: 'Clients, contracts, billing, mileage' 
    },
    tabs: ['charts', 'tax', 'mileage'],
    sidebarItems: ['clients', 'projects', 'contracts', 'income', 'mileage']
  },
  familia: {
    id: 'familia',
    name: { es: 'Mi Familia', en: 'My Family' },
    emoji: '👨‍👩‍👧',
    color: 'hsl(var(--chart-2))',
    bgColor: 'hsl(var(--chart-2) / 0.1)',
    borderColor: 'hsl(var(--chart-2) / 0.3)',
    description: { 
      es: 'Presupuesto, ahorro, patrimonio, deudas', 
      en: 'Budget, savings, net worth, debts' 
    },
    tabs: ['budgets', 'subscriptions', 'debt', 'portfolio'],
    sidebarItems: ['net-worth', 'settings']
  },
  diadia: {
    id: 'diadia',
    name: { es: 'Día a Día', en: 'Day to Day' },
    emoji: '📝',
    color: 'hsl(var(--chart-3))',
    bgColor: 'hsl(var(--chart-3) / 0.1)',
    borderColor: 'hsl(var(--chart-3) / 0.3)',
    description: { 
      es: 'Captura rápida, gastos, etiquetas', 
      en: 'Quick capture, expenses, tags' 
    },
    tabs: ['charts'],
    sidebarItems: ['expenses', 'chaos-inbox', 'tags', 'mobile-capture']
  },
  crecimiento: {
    id: 'crecimiento',
    name: { es: 'Crecimiento', en: 'Growth' },
    emoji: '📈',
    color: 'hsl(var(--chart-4))',
    bgColor: 'hsl(var(--chart-4) / 0.1)',
    borderColor: 'hsl(var(--chart-4) / 0.3)',
    description: { 
      es: 'Inversiones, FIRE, mentoría financiera', 
      en: 'Investments, FIRE, financial mentorship' 
    },
    tabs: ['fire', 'investments', 'mentorship', 'education'],
    sidebarItems: ['mentorship']
  },
  impuestos: {
    id: 'impuestos',
    name: { es: 'Impuestos', en: 'Taxes' },
    emoji: '💰',
    color: 'hsl(var(--chart-5))',
    bgColor: 'hsl(var(--chart-5) / 0.1)',
    borderColor: 'hsl(var(--chart-5) / 0.3)',
    description: { 
      es: 'Optimización fiscal, calendario CRA/SII', 
      en: 'Tax optimization, CRA/SII calendar' 
    },
    tabs: ['tax', 'analytics'],
    sidebarItems: ['tax-calendar', 'banking', 'reconciliation']
  }
};

export const FOCUS_AREA_ORDER: FocusAreaId[] = ['negocio', 'familia', 'diadia', 'crecimiento', 'impuestos'];

export const DEFAULT_DISPLAY_PREFERENCES = {
  view_mode: 'classic' as const,
  active_areas: FOCUS_AREA_ORDER,
  collapsed_areas: [] as FocusAreaId[],
  show_focus_dialog: false
};

export type ViewMode = 'classic' | 'organized';

export interface DisplayPreferences {
  view_mode: ViewMode;
  active_areas: FocusAreaId[];
  collapsed_areas: FocusAreaId[];
  show_focus_dialog: boolean;
}
