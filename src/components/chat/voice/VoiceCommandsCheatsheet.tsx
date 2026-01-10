import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Navigation, Database, Mic, Globe, PlusCircle, FileSearch } from 'lucide-react';
import { VOICE_COMMANDS, VOICE_QUERIES } from './VoiceCommands';
import { useLanguage } from '@/contexts/LanguageContext';

interface VoiceCommandsCheatsheetProps {
  trigger?: React.ReactNode;
}

export const VoiceCommandsCheatsheet: React.FC<VoiceCommandsCheatsheetProps> = ({ trigger }) => {
  const { language } = useLanguage();

  const navigationCommands = VOICE_COMMANDS[language as 'es' | 'en'] || VOICE_COMMANDS.es;
  const queryCommands = VOICE_QUERIES[language as 'es' | 'en'] || VOICE_QUERIES.es;

  const sections = [
    {
      icon: Navigation,
      title: language === 'es' ? 'Navegación' : 'Navigation',
      description: language === 'es' 
        ? 'Di cualquiera de estas frases para navegar' 
        : 'Say any of these phrases to navigate',
      commands: navigationCommands.filter(c => !c.action).slice(0, 12).map(cmd => ({
        example: cmd.patterns[0],
        result: cmd.name,
      })),
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      icon: PlusCircle,
      title: language === 'es' ? 'Acciones Rápidas' : 'Quick Actions',
      description: language === 'es' 
        ? 'Crea registros directamente con tu voz' 
        : 'Create records directly with your voice',
      commands: navigationCommands.filter(c => c.action).map(cmd => ({
        example: cmd.patterns[0],
        result: cmd.name,
      })),
      color: 'bg-green-500/10 text-green-600 dark:text-green-400',
    },
    {
      icon: Database,
      title: language === 'es' ? 'Consultas de Datos' : 'Data Queries',
      description: language === 'es' 
        ? 'Pregunta sobre tus finanzas' 
        : 'Ask about your finances',
      commands: queryCommands.slice(0, 10).map(q => ({
        example: q.patterns[0],
        result: language === 'es' ? 'Respuesta con datos' : 'Data response',
      })),
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      icon: Mic,
      title: language === 'es' ? 'Crear Gastos/Ingresos' : 'Create Expenses/Income',
      description: language === 'es' 
        ? 'Dicta gastos o ingresos naturalmente' 
        : 'Dictate expenses or income naturally',
      commands: [
        { 
          example: language === 'es' ? '"Gasté 50 dólares en Uber hoy"' : '"Spent 50 dollars on Uber today"',
          result: language === 'es' ? 'Crea gasto automáticamente' : 'Creates expense automatically',
        },
        { 
          example: language === 'es' ? '"Recibí 1000 del cliente ABC"' : '"Received 1000 from client ABC"',
          result: language === 'es' ? 'Crea ingreso automáticamente' : 'Creates income automatically',
        },
        { 
          example: language === 'es' ? '"Pagué 25 en restaurante"' : '"Paid 25 at restaurant"',
          result: language === 'es' ? 'Detecta categoría automática' : 'Auto-detects category',
        },
      ],
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    },
    {
      icon: Globe,
      title: language === 'es' ? 'Cambiar Idioma' : 'Change Language',
      description: language === 'es' 
        ? 'Cambia el idioma del asistente' 
        : 'Change assistant language',
      commands: [
        { 
          example: language === 'es' ? '"Cambiar a inglés"' : '"Switch to Spanish"',
          result: language === 'es' ? 'Cambia idioma' : 'Switches language',
        },
        { 
          example: language === 'es' ? '"Habla en inglés"' : '"Speak in Spanish"',
          result: language === 'es' ? 'Cambia idioma' : 'Switches language',
        },
      ],
      color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    },
    {
      icon: FileSearch,
      title: language === 'es' ? 'Ayuda Contextual' : 'Contextual Help',
      description: language === 'es' 
        ? 'Pregunta qué puedes hacer en cada página' 
        : 'Ask what you can do on each page',
      commands: [
        { 
          example: language === 'es' ? '"¿Qué puedo hacer aquí?"' : '"What can I do here?"',
          result: language === 'es' ? 'Explica la página actual' : 'Explains current page',
        },
        { 
          example: language === 'es' ? '"¿Cómo uso esta página?"' : '"How do I use this page?"',
          result: language === 'es' ? 'Guía paso a paso' : 'Step-by-step guide',
        },
        { 
          example: language === 'es' ? '"Ayuda"' : '"Help"',
          result: language === 'es' ? 'Ayuda general' : 'General help',
        },
      ],
      color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <HelpCircle className="h-4 w-4" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Comandos de Voz' : 'Voice Commands'}
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
          <div className="space-y-6">
            {sections.map((section, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${section.color}`}>
                    <section.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{section.title}</h3>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                </div>
                
                <div className="grid gap-2 pl-10">
                  {section.commands.map((cmd, cmdIdx) => (
                    <div 
                      key={cmdIdx} 
                      className="flex items-center justify-between gap-2 text-sm p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <span className="text-muted-foreground italic">
                        "{cmd.example}"
                      </span>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {cmd.result}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Tips section */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                💡 {language === 'es' ? 'Consejos' : 'Tips'}
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• {language === 'es' 
                  ? 'Habla naturalmente, el sistema entiende variaciones' 
                  : 'Speak naturally, the system understands variations'}</li>
                <li>• {language === 'es' 
                  ? 'Usa Ctrl+M para activar el micrófono' 
                  : 'Use Ctrl+M to toggle microphone'}</li>
                <li>• {language === 'es' 
                  ? 'Usa Escape para detener la voz' 
                  : 'Use Escape to stop speaking'}</li>
                <li>• {language === 'es' 
                  ? 'Usa Ctrl+J para modo continuo' 
                  : 'Use Ctrl+J for continuous mode'}</li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default VoiceCommandsCheatsheet;
