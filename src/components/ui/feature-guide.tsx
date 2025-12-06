import * as React from "react";
import { 
  Lightbulb, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen,
  Sparkles,
  X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface FeatureGuideProps {
  title: string;
  subtitle: string;
  steps: Step[];
  tips?: string[];
  onGetStarted?: () => void;
  getStartedLabel?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'inline';
  dismissible?: boolean;
  storageKey?: string;
}

export function FeatureGuide({
  title,
  subtitle,
  steps,
  tips,
  onGetStarted,
  getStartedLabel,
  className,
  variant = 'default',
  dismissible = true,
  storageKey,
}: FeatureGuideProps) {
  const { language } = useLanguage();
  const [dismissed, setDismissed] = React.useState(() => {
    if (storageKey) {
      return localStorage.getItem(`guide-dismissed-${storageKey}`) === 'true';
    }
    return false;
  });

  const handleDismiss = () => {
    setDismissed(true);
    if (storageKey) {
      localStorage.setItem(`guide-dismissed-${storageKey}`, 'true');
    }
  };

  if (dismissed) return null;

  if (variant === 'compact') {
    return (
      <Card className={cn("border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5", className)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <Lightbulb className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-sm">{title}</h4>
                {dismissible && (
                  <button 
                    onClick={handleDismiss}
                    className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              {onGetStarted && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="mt-2 h-7 text-xs text-primary hover:text-primary"
                  onClick={onGetStarted}
                >
                  {getStartedLabel || (language === 'es' ? 'Comenzar' : 'Get Started')}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-dashed border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden",
      className
    )}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <BookOpen className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{title}</h3>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {language === 'es' ? 'Guía' : 'Guide'}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">{subtitle}</p>
            </div>
          </div>
          {dismissible && (
            <button 
              onClick={handleDismiss}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Steps */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="relative p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all group"
            >
              <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {index + 1}
              </div>
              <div className="flex items-start gap-3 pt-1">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{step.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        {tips && tips.length > 0 && (
          <div className="bg-accent/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">
                {language === 'es' ? 'Consejos útiles' : 'Helpful tips'}
              </span>
            </div>
            <ul className="space-y-2">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        {onGetStarted && (
          <div className="flex justify-center">
            <Button 
              onClick={onGetStarted}
              className="bg-gradient-primary hover:opacity-90 shadow-glow"
            >
              {getStartedLabel || (language === 'es' ? 'Comenzar ahora' : 'Get started now')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Empty state with guide
interface EmptyStateWithGuideProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  guideTitle?: string;
  steps?: Step[];
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export function EmptyStateWithGuide({
  icon,
  title,
  description,
  guideTitle,
  steps,
  onAction,
  actionLabel,
  className,
}: EmptyStateWithGuideProps) {
  const { language } = useLanguage();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Empty State */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            {icon}
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">{description}</p>
          {onAction && (
            <Button 
              onClick={onAction}
              className="mt-6 bg-gradient-primary hover:opacity-90"
            >
              {actionLabel || (language === 'es' ? 'Comenzar' : 'Get Started')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Guide Steps */}
      {steps && steps.length > 0 && (
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6 border border-primary/10">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">
              {guideTitle || (language === 'es' ? '¿Cómo funciona?' : 'How does it work?')}
            </h4>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-card/50"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{index + 1}</span>
                </div>
                <div>
                  <h5 className="font-medium text-sm">{step.title}</h5>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
