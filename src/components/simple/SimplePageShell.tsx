import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Optional action shown in the header (e.g. "+ Add"). */
  primaryAction?: ReactNode;
}

/**
 * Wrapper for every Simple-mode page. Keeps the same width as the rest of
 * the app (page-container set by the parent page), big readable title,
 * a single Back button, and one optional primary action.
 */
export function SimplePageShell({ title, subtitle, children, primaryAction }: Props) {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <div className="w-full max-w-6xl mx-auto pb-10 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="h-9 px-2 gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
            aria-label={language === 'es' ? 'Volver al inicio' : 'Back to home'}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">
              {language === 'es' ? 'Volver' : 'Back'}
            </span>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {primaryAction && <div className="shrink-0">{primaryAction}</div>}
      </div>
      {children}
    </div>
  );
}
