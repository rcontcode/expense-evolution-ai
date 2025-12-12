import { HelpCircle, Lightbulb, BookOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { FINANCIAL_GLOSSARY, GlossaryTerm } from '@/lib/constants/financial-glossary';
import { cn } from '@/lib/utils';

interface GlossaryTermProps {
  termKey: string;
  children?: React.ReactNode;
  showIcon?: boolean;
  variant?: 'inline' | 'label' | 'standalone';
  className?: string;
}

export function GlossaryTermTooltip({
  termKey,
  children,
  showIcon = true,
  variant = 'inline',
  className,
}: GlossaryTermProps) {
  const { language } = useLanguage();
  const term = FINANCIAL_GLOSSARY[termKey];

  if (!term) {
    return <>{children}</>;
  }

  const displayTerm = language === 'es' ? term.term : term.termEn;
  const definition = language === 'es' ? term.definition : term.definitionEn;
  const example = language === 'es' ? term.example : term.exampleEn;
  const tip = language === 'es' ? term.tip : term.tipEn;

  const content = children || displayTerm;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span 
          className={cn(
            "inline-flex items-center gap-1 cursor-help",
            variant === 'inline' && "border-b border-dashed border-muted-foreground/50 hover:border-primary",
            variant === 'label' && "font-medium",
            className
          )}
        >
          {content}
          {showIcon && (
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-primary transition-colors" />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="max-w-sm p-4 space-y-2"
        sideOffset={5}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">{displayTerm}</span>
        </div>
        
        <p className="text-xs text-muted-foreground leading-relaxed">
          {definition}
        </p>
        
        {example && (
          <div className="bg-muted/50 p-2 rounded text-xs">
            <span className="font-medium text-muted-foreground">
              {language === 'es' ? 'Ejemplo: ' : 'Example: '}
            </span>
            {example}
          </div>
        )}
        
        {tip && (
          <div className="flex items-start gap-1.5 pt-1 border-t border-border/50">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {tip}
            </p>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

// Component to display just the term with definition inline
export function GlossaryLabel({
  termKey,
  children,
  className,
  showIcon = true,
}: {
  termKey: string;
  children?: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}) {
  return (
    <GlossaryTermTooltip 
      termKey={termKey} 
      variant="label" 
      showIcon={showIcon}
      className={className}
    >
      {children}
    </GlossaryTermTooltip>
  );
}

// Simple inline help for a term
export function TermHelp({ termKey }: { termKey: string }) {
  const { language } = useLanguage();
  const term = FINANCIAL_GLOSSARY[termKey];

  if (!term) return null;

  const definition = language === 'es' ? term.definition : term.definitionEn;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors focus:outline-none"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs p-3">
        <p className="text-xs leading-relaxed">{definition}</p>
      </TooltipContent>
    </Tooltip>
  );
}
