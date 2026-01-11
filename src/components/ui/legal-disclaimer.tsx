import { AlertTriangle, Info, Scale, BookOpen, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

type DisclaimerVariant = 'tax' | 'investment' | 'education' | 'general';
type DisclaimerSize = 'default' | 'compact';

interface LegalDisclaimerProps {
  variant?: DisclaimerVariant;
  size?: DisclaimerSize;
  className?: string;
  showLearnMore?: boolean;
}

const DISCLAIMER_CONTENT = {
  general: {
    es: {
      title: 'Aviso Legal',
      text: 'La información proporcionada por EvoFinz es únicamente con fines educativos e informativos. NO constituye asesoría financiera, fiscal, legal ni de inversión.',
      compact: 'Solo con fines educativos. No es asesoría profesional.',
    },
    en: {
      title: 'Legal Notice',
      text: 'The information provided by EvoFinz is for educational and informational purposes only. It does NOT constitute financial, tax, legal, or investment advice.',
      compact: 'For educational purposes only. Not professional advice.',
    },
  },
  tax: {
    es: {
      title: 'Aviso sobre Información Fiscal',
      text: 'Las estimaciones fiscales son aproximadas y basadas en tasas vigentes. Para una declaración precisa, consulte a un contador profesional certificado (CPA) y las fuentes oficiales (CRA/SII).',
      compact: 'Estimaciones aproximadas. Consulte un CPA para su situación específica.',
    },
    en: {
      title: 'Tax Information Notice',
      text: 'Tax estimates are approximate and based on current rates. For an accurate filing, consult a certified professional accountant (CPA) and official sources (CRA/SII).',
      compact: 'Approximate estimates. Consult a CPA for your specific situation.',
    },
  },
  investment: {
    es: {
      title: 'Aviso sobre Inversiones',
      text: 'Las proyecciones son hipotéticas basadas en rendimientos históricos promedio. Los rendimientos pasados no garantizan resultados futuros. Toda inversión conlleva riesgo de pérdida.',
      compact: 'Proyecciones hipotéticas. Rendimientos pasados no garantizan resultados futuros.',
    },
    en: {
      title: 'Investment Notice',
      text: 'Projections are hypothetical based on historical average returns. Past performance does not guarantee future results. All investments carry risk of loss.',
      compact: 'Hypothetical projections. Past performance does not guarantee future results.',
    },
  },
  education: {
    es: {
      title: 'Contenido Educativo',
      text: 'Contenido educativo inspirado en principios de finanzas personales. Las referencias a autores son con fines de atribución. No reemplaza asesoramiento profesional.',
      compact: 'Inspirado en expertos. No afiliado. Solo fines educativos.',
    },
    en: {
      title: 'Educational Content',
      text: 'Educational content inspired by personal finance principles. Author references are for attribution purposes. Does not replace professional advice.',
      compact: 'Inspired by experts. Not affiliated. Educational purposes only.',
    },
  },
};

const VARIANT_ICONS = {
  general: Shield,
  tax: AlertTriangle,
  investment: Scale,
  education: BookOpen,
};

const VARIANT_STYLES = {
  general: 'bg-muted/50 border-muted-foreground/20',
  tax: 'bg-amber-500/10 border-amber-500/30',
  investment: 'bg-blue-500/10 border-blue-500/30',
  education: 'bg-purple-500/10 border-purple-500/30',
};

const ICON_STYLES = {
  general: 'text-muted-foreground',
  tax: 'text-amber-500',
  investment: 'text-blue-500',
  education: 'text-purple-500',
};

export function LegalDisclaimer({ 
  variant = 'general', 
  size = 'default',
  className,
  showLearnMore = true,
}: LegalDisclaimerProps) {
  const { language } = useLanguage();
  const content = DISCLAIMER_CONTENT[variant][language];
  const Icon = VARIANT_ICONS[variant];
  
  const isCompact = size === 'compact';

  return (
    <Alert className={cn(
      VARIANT_STYLES[variant],
      isCompact && 'py-2',
      className
    )}>
      <Icon className={cn(
        isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4',
        ICON_STYLES[variant]
      )} />
      <AlertDescription className={cn(
        isCompact ? 'text-xs' : 'text-sm',
        'text-muted-foreground'
      )}>
        {isCompact ? content.compact : content.text}
        {showLearnMore && (
          <Link 
            to="/legal" 
            className={cn(
              'ml-1 underline underline-offset-2 hover:text-foreground transition-colors',
              isCompact ? 'text-xs' : 'text-sm'
            )}
          >
            {language === 'es' ? 'Más información' : 'Learn more'}
          </Link>
        )}
      </AlertDescription>
    </Alert>
  );
}
