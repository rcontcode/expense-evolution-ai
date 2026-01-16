import React from 'react';
import { cn } from '@/lib/utils';
import { 
  X, 
  Minimize2, 
  HelpCircle, 
  History, 
  Settings,
  Radio,
} from 'lucide-react';
import { PhoenixLogo } from '@/components/ui/phoenix-logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AssistantHeaderProps {
  language: 'es' | 'en';
  userName: string;
  isSpeaking: boolean;
  isListening: boolean;
  isContinuousMode: boolean;
  isAwaitingClarification: boolean;
  isVoiceSupported: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onOpenSettings?: () => void;
  onOpenHistory?: () => void;
  onOpenCheatsheet?: () => void;
  onToggleContinuousMode?: () => void;
}

export const AssistantHeader: React.FC<AssistantHeaderProps> = ({
  language,
  userName,
  isSpeaking,
  isListening,
  isContinuousMode,
  isAwaitingClarification,
  isVoiceSupported,
  onClose,
  onMinimize,
  onOpenSettings,
  onOpenHistory,
  onOpenCheatsheet,
  onToggleContinuousMode,
}) => {
  const getStatusMessage = () => {
    if (isAwaitingClarification) {
      return language === 'es' ? '🤔 Esperando tu elección...' : '🤔 Waiting for your choice...';
    }
    if (isContinuousMode) {
      return language === 'es' 
        ? '🎙️ Modo continuo activo' 
        : '🎙️ Continuous mode active';
    }
    if (isListening) {
      return language === 'es' ? '🎤 Escuchando...' : '🎤 Listening...';
    }
    if (isSpeaking) {
      return language === 'es' ? '🔊 Hablando...' : '🔊 Speaking...';
    }
    return language === 'es' 
      ? `Hola ${userName}, ¿en qué te ayudo?` 
      : `Hi ${userName}, how can I help?`;
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-primary/5">
      <div className="flex items-center gap-3">
        <PhoenixLogo 
          variant="mini" 
          state={isSpeaking ? "rebirth" : "auto"} 
          showEffects={isSpeaking}
          className={cn(isSpeaking && "animate-pulse")}
        />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">
              {language === 'es' ? 'Asistente Financiero' : 'Financial Assistant'}
            </h3>
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-1">
              {language === 'es' ? '🇪🇸' : '🇬🇧'} {language.toUpperCase()}
            </Badge>
            {isContinuousMode && (
              <Badge variant="default" className="text-[10px] h-5 px-1.5 gap-1 bg-red-500">
                <Radio className="h-3 w-3 animate-pulse" />
                LIVE
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {getStatusMessage()}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {/* Voice Commands Cheatsheet */}
        {isVoiceSupported && onOpenCheatsheet && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={onOpenCheatsheet}
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {language === 'es' ? 'Comandos de voz' : 'Voice commands'}
            </TooltipContent>
          </Tooltip>
        )}

        {/* History button */}
        {onOpenHistory && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onOpenHistory}
                className="h-8 w-8"
              >
                <History className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {language === 'es' ? 'Historial' : 'History'}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Settings button */}
        {onOpenSettings && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onOpenSettings}
                className="h-8 w-8"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {language === 'es' ? 'Configuración' : 'Settings'}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Continuous mode toggle */}
        {isVoiceSupported && onToggleContinuousMode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={isContinuousMode ? "default" : "ghost"}
                size="icon" 
                onClick={onToggleContinuousMode}
                className={cn(
                  "h-8 w-8",
                  isContinuousMode && "bg-red-500 hover:bg-red-600 text-white"
                )}
              >
                <Radio className={cn("h-4 w-4", isContinuousMode && "animate-pulse")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isContinuousMode 
                ? (language === 'es' ? 'Detener modo continuo' : 'Stop continuous mode')
                : (language === 'es' ? 'Activar modo continuo' : 'Start continuous mode')
              }
            </TooltipContent>
          </Tooltip>
        )}

        {/* Minimize button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMinimize}
              className="h-8 w-8"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {language === 'es' ? 'Minimizar' : 'Minimize'}
          </TooltipContent>
        </Tooltip>

        {/* Close button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
