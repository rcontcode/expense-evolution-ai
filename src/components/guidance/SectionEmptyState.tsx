import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useGenerateSampleDataBySection } from '@/hooks/data/useGenerateSampleData';
import { 
  ArrowRight, Sparkles, Receipt, TrendingUp, Users, MapPin, 
  FileText, Landmark, Database, LucideIcon, PlusCircle, BookOpen, Loader2
} from 'lucide-react';

type IconName = 'Receipt' | 'TrendingUp' | 'Users' | 'MapPin' | 'FileText' | 'Landmark' | 'Database' | 'BookOpen';

const ICON_MAP: Record<IconName, LucideIcon> = {
  Receipt,
  TrendingUp,
  Users,
  MapPin,
  FileText,
  Landmark,
  Database,
  BookOpen
};

interface EmptyStateConfig {
  icon: IconName;
  title: { es: string; en: string };
  description: { es: string; en: string };
  actionLabel: { es: string; en: string };
  tips: { es: string[]; en: string[] };
  gradient: string;
}

// Pre-configured empty states for common sections
export const EMPTY_STATE_CONFIGS: Record<string, EmptyStateConfig> = {
  expenses: {
    icon: 'Receipt',
    title: { es: '¡Comienza a registrar tus gastos!', en: 'Start tracking your expenses!' },
    description: {
      es: 'Captura gastos con foto, voz o texto. La IA categoriza automáticamente.',
      en: 'Capture expenses with photo, voice, or text. AI categorizes automatically.'
    },
    actionLabel: { es: 'Agregar primer gasto', en: 'Add first expense' },
    tips: {
      es: ['Fotografía recibos', 'Dicta por voz', 'Categorización IA'],
      en: ['Photograph receipts', 'Dictate by voice', 'AI categorization']
    },
    gradient: 'from-blue-500 to-cyan-500'
  },
  income: {
    icon: 'TrendingUp',
    title: { es: 'Registra tus ingresos', en: 'Record your income' },
    description: {
      es: 'Trackea salarios, pagos de clientes, inversiones y más.',
      en: 'Track salaries, client payments, investments and more.'
    },
    actionLabel: { es: 'Agregar primer ingreso', en: 'Add first income' },
    tips: {
      es: ['Múltiples tipos', 'Pagos recurrentes', 'Por cliente/proyecto'],
      en: ['Multiple types', 'Recurring payments', 'By client/project']
    },
    gradient: 'from-emerald-500 to-green-600'
  },
  clients: {
    icon: 'Users',
    title: { es: 'Agrega tus clientes', en: 'Add your clients' },
    description: {
      es: 'Gestiona clientes para asignar gastos, ingresos y proyectos.',
      en: 'Manage clients to assign expenses, income and projects.'
    },
    actionLabel: { es: 'Agregar primer cliente', en: 'Add first client' },
    tips: {
      es: ['Perfil de facturación', 'Rentabilidad', 'Reportes'],
      en: ['Billing profile', 'Profitability', 'Reports']
    },
    gradient: 'from-purple-500 to-violet-600'
  },
  mileage: {
    icon: 'MapPin',
    title: { es: 'Registra tus viajes de negocios', en: 'Log your business trips' },
    description: {
      es: 'Calcula deducciones CRA automáticamente con las tasas 2024.',
      en: 'Calculate CRA deductions automatically with 2024 rates.'
    },
    actionLabel: { es: 'Agregar primer viaje', en: 'Add first trip' },
    tips: {
      es: ['$0.70/km primeros 5,000', 'Rutas con mapa', 'Por cliente'],
      en: ['$0.70/km first 5,000', 'Routes with map', 'By client']
    },
    gradient: 'from-orange-500 to-amber-500'
  },
  contracts: {
    icon: 'FileText',
    title: { es: 'Sube tus contratos', en: 'Upload your contracts' },
    description: {
      es: 'La IA extrae términos de reembolso y fechas importantes.',
      en: 'AI extracts reimbursement terms and important dates.'
    },
    actionLabel: { es: 'Subir primer contrato', en: 'Upload first contract' },
    tips: {
      es: ['Análisis IA', 'Alertas de vencimiento', 'Términos de reembolso'],
      en: ['AI analysis', 'Expiry alerts', 'Reimbursement terms']
    },
    gradient: 'from-amber-500 to-orange-600'
  },
  netWorth: {
    icon: 'Landmark',
    title: { es: 'Calcula tu patrimonio neto', en: 'Calculate your net worth' },
    description: {
      es: 'Registra activos y pasivos para ver tu progreso financiero.',
      en: 'Record assets and liabilities to see your financial progress.'
    },
    actionLabel: { es: 'Agregar primer activo', en: 'Add first asset' },
    tips: {
      es: ['Clasificación Kiyosaki', 'Proyecciones', 'Historial'],
      en: ['Kiyosaki classification', 'Projections', 'History']
    },
    gradient: 'from-teal-500 to-cyan-600'
  },
  education: {
    icon: 'BookOpen',
    title: { es: 'Comienza tu educación financiera', en: 'Start your financial education' },
    description: {
      es: 'Trackea libros, cursos y podcasts con métricas de progreso.',
      en: 'Track books, courses and podcasts with progress metrics.'
    },
    actionLabel: { es: 'Agregar primer recurso', en: 'Add first resource' },
    tips: {
      es: ['Progreso de lectura', 'Rachas de aprendizaje', 'Lecciones clave'],
      en: ['Reading progress', 'Learning streaks', 'Key lessons']
    },
    gradient: 'from-pink-500 to-rose-600'
  }
};

interface SectionEmptyStateProps {
  section: keyof typeof EMPTY_STATE_CONFIGS;
  onAction: () => void;
  secondaryAction?: {
    label: { es: string; en: string };
    onClick: () => void;
  };
  showSampleDataButton?: boolean;
  className?: string;
}

export function SectionEmptyState({
  section,
  onAction,
  secondaryAction,
  showSampleDataButton = false,
  className = ''
}: SectionEmptyStateProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const generateSampleSection = useGenerateSampleDataBySection();
  const lang = language as 'es' | 'en';
  
  const config = EMPTY_STATE_CONFIGS[section];
  if (!config) return null;
  
  const Icon = ICON_MAP[config.icon];
  const isGenerating = generateSampleSection.isPending;

  const handleGenerateSamples = () => {
    generateSampleSection.mutate(section);
  };

  return (
    <Card className={`border-dashed border-2 border-muted-foreground/20 bg-gradient-to-br from-background to-muted/20 ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        {/* Icon with gradient background */}
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br ${config.gradient} mb-8 shadow-xl transform hover:scale-105 transition-transform`}>
          <Icon className="h-12 w-12 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold mb-3">{config.title[lang]}</h3>
        <p className="text-muted-foreground max-w-md mb-8 text-lg">{config.description[lang]}</p>

        {/* Feature tips */}
        {config.tips[lang].length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {config.tips[lang].map((tip, index) => (
              <Badge 
                key={index}
                variant="secondary"
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary/10 text-primary border-primary/20"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {tip}
              </Badge>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Button onClick={onAction} size="lg" className="gap-2 px-8 shadow-lg">
            <PlusCircle className="h-5 w-5" />
            {config.actionLabel[lang]}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          
          {secondaryAction && (
            <Button 
              variant="outline" 
              onClick={secondaryAction.onClick}
              size="lg"
            >
              {secondaryAction.label[lang]}
            </Button>
          )}
        </div>

        {/* Sample data - direct load for this section */}
        {showSampleDataButton && (
          <div className="mt-8 pt-6 border-t border-border/50 w-full max-w-md">
            <p className="text-sm text-muted-foreground mb-3">
              {lang === 'es' 
                ? '¿Quieres ver cómo funciona primero?' 
                : 'Want to see how it works first?'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button 
                variant="secondary" 
                onClick={handleGenerateSamples}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                {lang === 'es' 
                  ? isGenerating ? 'Cargando...' : 'Cargar ejemplos aquí' 
                  : isGenerating ? 'Loading...' : 'Load samples here'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/settings')}
                className="text-sm gap-2"
              >
                {lang === 'es' ? 'Cargar todo en Settings' : 'Load all in Settings'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Simple inline empty state for smaller contexts
interface InlineEmptyStateProps {
  message: { es: string; en: string };
  actionLabel?: { es: string; en: string };
  onAction?: () => void;
  icon?: LucideIcon;
}

export function InlineEmptyState({ message, actionLabel, onAction, icon: CustomIcon }: InlineEmptyStateProps) {
  const { language } = useLanguage();
  const lang = language as 'es' | 'en';
  const Icon = CustomIcon || Receipt;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground mb-4">{message[lang]}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" size="sm" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          {actionLabel[lang]}
        </Button>
      )}
    </div>
  );
}
