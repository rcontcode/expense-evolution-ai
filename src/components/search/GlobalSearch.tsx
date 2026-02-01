import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  Users,
  FolderKanban,
  FileText,
  Car,
  Tag,
  Scale,
  Building2,
  RefreshCw,
  GraduationCap,
  Sparkles,
  Settings,
  Inbox,
  Camera,
  Plus,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuickCapture?: () => void;
}

interface NavigationItem {
  icon: typeof LayoutDashboard;
  label: { es: string; en: string };
  path: string;
  keywords?: string[];
}

interface ActionItem {
  icon: typeof Plus;
  label: { es: string; en: string };
  action: () => void;
  keywords?: string[];
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  { 
    icon: LayoutDashboard, 
    label: { es: 'Dashboard', en: 'Dashboard' }, 
    path: '/dashboard',
    keywords: ['inicio', 'home', 'principal', 'resumen', 'overview']
  },
  { 
    icon: Receipt, 
    label: { es: 'Gastos', en: 'Expenses' }, 
    path: '/expenses',
    keywords: ['expense', 'gasto', 'compra', 'purchase', 'factura', 'invoice']
  },
  { 
    icon: TrendingUp, 
    label: { es: 'Ingresos', en: 'Income' }, 
    path: '/income',
    keywords: ['income', 'ingreso', 'pago', 'payment', 'cobro', 'revenue']
  },
  { 
    icon: Inbox, 
    label: { es: 'Centro de Revisión', en: 'Review Center' }, 
    path: '/chaos',
    keywords: ['chaos', 'inbox', 'pendiente', 'revisar', 'review', 'clasificar']
  },
  { 
    icon: Users, 
    label: { es: 'Clientes', en: 'Clients' }, 
    path: '/clients',
    keywords: ['client', 'cliente', 'customer', 'contacto', 'contact']
  },
  { 
    icon: FolderKanban, 
    label: { es: 'Proyectos', en: 'Projects' }, 
    path: '/projects',
    keywords: ['project', 'proyecto', 'trabajo', 'job']
  },
  { 
    icon: FileText, 
    label: { es: 'Contratos', en: 'Contracts' }, 
    path: '/contracts',
    keywords: ['contract', 'contrato', 'acuerdo', 'agreement']
  },
  { 
    icon: Car, 
    label: { es: 'Kilometraje', en: 'Mileage' }, 
    path: '/mileage',
    keywords: ['mileage', 'kilometraje', 'viaje', 'trip', 'auto', 'car']
  },
  { 
    icon: Tag, 
    label: { es: 'Etiquetas', en: 'Tags' }, 
    path: '/tags',
    keywords: ['tag', 'etiqueta', 'categoria', 'category']
  },
  { 
    icon: Scale, 
    label: { es: 'Patrimonio Neto', en: 'Net Worth' }, 
    path: '/net-worth',
    keywords: ['networth', 'patrimonio', 'wealth', 'activo', 'asset', 'pasivo', 'liability']
  },
  { 
    icon: Building2, 
    label: { es: 'Banca', en: 'Banking' }, 
    path: '/banking',
    keywords: ['bank', 'banco', 'cuenta', 'account', 'transferencia']
  },
  { 
    icon: RefreshCw, 
    label: { es: 'Conciliación', en: 'Reconciliation' }, 
    path: '/reconciliation',
    keywords: ['reconciliation', 'conciliacion', 'match', 'coincidencia']
  },
  { 
    icon: GraduationCap, 
    label: { es: 'Mentoría', en: 'Mentorship' }, 
    path: '/mentorship',
    keywords: ['mentor', 'mentoria', 'aprender', 'learn', 'educacion', 'education']
  },
  { 
    icon: Sparkles, 
    label: { es: 'Notificaciones', en: 'Notifications' }, 
    path: '/notifications',
    keywords: ['notification', 'notificacion', 'alerta', 'alert']
  },
  { 
    icon: Settings, 
    label: { es: 'Configuración', en: 'Settings' }, 
    path: '/settings',
    keywords: ['settings', 'configuracion', 'preferencias', 'preferences', 'opciones']
  },
];

export function GlobalSearch({ open, onOpenChange, onQuickCapture }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [search, setSearch] = useState('');

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  const handleSelect = useCallback((path: string) => {
    navigate(path);
    onOpenChange(false);
  }, [navigate, onOpenChange]);

  const handleAction = useCallback((action: () => void) => {
    action();
    onOpenChange(false);
  }, [onOpenChange]);

  const quickActions: ActionItem[] = [
    {
      icon: Camera,
      label: { es: 'Captura Rápida', en: 'Quick Capture' },
      action: () => onQuickCapture?.(),
      keywords: ['capture', 'captura', 'foto', 'photo', 'recibo', 'receipt', 'escanear', 'scan']
    },
    {
      icon: Plus,
      label: { es: 'Agregar Gasto', en: 'Add Expense' },
      action: () => navigate('/expenses'),
      keywords: ['add', 'agregar', 'nuevo', 'new', 'gasto', 'expense']
    },
    {
      icon: Plus,
      label: { es: 'Agregar Ingreso', en: 'Add Income' },
      action: () => navigate('/income'),
      keywords: ['add', 'agregar', 'nuevo', 'new', 'ingreso', 'income']
    },
    {
      icon: Plus,
      label: { es: 'Agregar Cliente', en: 'Add Client' },
      action: () => navigate('/clients'),
      keywords: ['add', 'agregar', 'nuevo', 'new', 'cliente', 'client']
    },
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder={language === 'es' ? 'Buscar páginas, acciones...' : 'Search pages, actions...'} 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {language === 'es' ? 'No se encontraron resultados.' : 'No results found.'}
        </CommandEmpty>
        
        {/* Quick Actions */}
        <CommandGroup heading={language === 'es' ? '⚡ Acciones Rápidas' : '⚡ Quick Actions'}>
          {quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.label.en}
                value={`${item.label.es} ${item.label.en} ${item.keywords?.join(' ') || ''}`}
                onSelect={() => handleAction(item.action)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span>{item.label[language as 'es' | 'en']}</span>
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
        
        <CommandSeparator />
        
        {/* Navigation */}
        <CommandGroup heading={language === 'es' ? '📍 Navegación' : '📍 Navigation'}>
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.path}
                value={`${item.label.es} ${item.label.en} ${item.keywords?.join(' ') || ''}`}
                onSelect={() => handleSelect(item.path)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-sm">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span>{item.label[language as 'es' | 'en']}</span>
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
