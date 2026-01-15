import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  ArrowLeftRight, 
  History,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ConversationExchange {
  id: string;
  userMessage: string;
  assistantResponse: string;
  intent?: string;
  action?: string;
  timestamp: number;
}

interface ConversationContextProps {
  exchanges: ConversationExchange[];
  lastTopic: string | null;
  onClearMemory: () => void;
  language: 'es' | 'en';
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const ConversationContext: React.FC<ConversationContextProps> = ({
  exchanges,
  lastTopic,
  onClearMemory,
  language,
  isExpanded,
  onToggleExpand,
}) => {
  const isSpanish = language === 'es';

  if (exchanges.length === 0) return null;

  const recentExchanges = exchanges.slice(-3);
  const topicLabel = getTopicLabel(lastTopic, language);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-border/50"
    >
      {/* Collapsed header */}
      <button
        onClick={onToggleExpand}
        className={cn(
          "w-full flex items-center justify-between p-2 text-xs",
          "hover:bg-muted/30 transition-colors"
        )}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <History className="h-3 w-3" />
          <span>
            {isSpanish 
              ? `${exchanges.length} intercambio${exchanges.length !== 1 ? 's' : ''} reciente${exchanges.length !== 1 ? 's' : ''}` 
              : `${exchanges.length} recent exchange${exchanges.length !== 1 ? 's' : ''}`}
          </span>
          {topicLabel && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span className="text-primary/70">{topicLabel}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearMemory();
                }}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isSpanish ? 'Limpiar historial' : 'Clear history'}
            </TooltipContent>
          </Tooltip>
          {isExpanded ? (
            <ChevronUp className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-2 pb-2 space-y-1"
          >
            {recentExchanges.map((exchange) => (
              <div 
                key={exchange.id}
                className="flex items-start gap-2 text-xs p-1.5 rounded bg-muted/20"
              >
                <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground truncate">
                    {exchange.userMessage.length > 40 
                      ? exchange.userMessage.substring(0, 40) + '...' 
                      : exchange.userMessage}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <ArrowLeftRight className="h-2.5 w-2.5 text-primary/50" />
                    <p className="text-primary/70 truncate">
                      {exchange.assistantResponse.length > 50 
                        ? exchange.assistantResponse.substring(0, 50) + '...' 
                        : exchange.assistantResponse}
                    </p>
                  </div>
                </div>
                {exchange.intent && (
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full shrink-0",
                    getIntentStyle(exchange.intent)
                  )}>
                    {exchange.intent}
                  </span>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

function getTopicLabel(topic: string | null, language: 'es' | 'en'): string | null {
  if (!topic) return null;

  const topicLabels: Record<string, { es: string; en: string }> = {
    gastos: { es: 'Gastos', en: 'Expenses' },
    ingresos: { es: 'Ingresos', en: 'Income' },
    clientes: { es: 'Clientes', en: 'Clients' },
    proyectos: { es: 'Proyectos', en: 'Projects' },
    impuestos: { es: 'Impuestos', en: 'Taxes' },
    patrimonio: { es: 'Patrimonio', en: 'Net Worth' },
    inversiones: { es: 'Inversiones', en: 'Investments' },
    ahorro: { es: 'Ahorro', en: 'Savings' },
  };

  return topicLabels[topic]?.[language] || topic;
}

function getIntentStyle(intent: string): string {
  const styles: Record<string, string> = {
    navigate: 'bg-blue-500/20 text-blue-400',
    query: 'bg-emerald-500/20 text-emerald-400',
    clarify: 'bg-amber-500/20 text-amber-400',
    conversational: 'bg-purple-500/20 text-purple-400',
  };
  return styles[intent] || 'bg-muted text-muted-foreground';
}
