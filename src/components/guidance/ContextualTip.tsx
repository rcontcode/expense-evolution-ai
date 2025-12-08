import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Lightbulb,
  X,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface ContextualTipProps {
  tipKey: string;
  title: { es: string; en: string };
  description: { es: string; en: string };
  action?: { es: string; en: string };
  actionPath?: string;
  onAction?: () => void;
  variant?: 'info' | 'success' | 'warning';
  dismissible?: boolean;
  className?: string;
}

export function ContextualTip({
  tipKey,
  title,
  description,
  action,
  actionPath,
  onAction,
  variant = 'info',
  dismissible = true,
  className
}: ContextualTipProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = React.useState(() => {
    return localStorage.getItem(`tip-${tipKey}-dismissed`) === 'true';
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(`tip-${tipKey}-dismissed`, 'true');
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionPath) {
      navigate(actionPath);
    }
  };

  const variantStyles = {
    info: {
      container: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50",
      icon: "text-blue-600 dark:text-blue-400",
      title: "text-blue-900 dark:text-blue-100",
      text: "text-blue-700 dark:text-blue-300",
      button: "border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
    },
    success: {
      container: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50",
      icon: "text-green-600 dark:text-green-400",
      title: "text-green-900 dark:text-green-100",
      text: "text-green-700 dark:text-green-300",
      button: "border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900"
    },
    warning: {
      container: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50",
      icon: "text-amber-600 dark:text-amber-400",
      title: "text-amber-900 dark:text-amber-100",
      text: "text-amber-700 dark:text-amber-300",
      button: "border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900"
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border",
      styles.container,
      className
    )}>
      <Lightbulb className={cn("h-4 w-4 flex-shrink-0 mt-0.5", styles.icon)} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", styles.title)}>
          {title[language]}
        </p>
        <p className={cn("text-xs mt-0.5", styles.text)}>
          {description[language]}
        </p>
        {action && (
          <Button
            size="sm"
            variant="outline"
            className={cn("mt-2 h-7 text-xs", styles.button)}
            onClick={handleAction}
          >
            {action[language]}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        )}
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className={cn("p-1 rounded hover:bg-black/5 dark:hover:bg-white/5", styles.text)}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
