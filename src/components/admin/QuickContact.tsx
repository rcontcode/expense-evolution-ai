import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { MessageCircle, Mail, Phone, Send } from 'lucide-react';
import type { QuizLead } from '@/hooks/admin/useLeadsManagement';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuickContactProps {
  lead: QuizLead;
  variant?: 'dropdown' | 'buttons';
  size?: 'sm' | 'default';
}

type AppKey = 'evofinz' | 'fokuspark' | 'universmind';

const APP_BRANDS: Record<AppKey, { name: string; emoji: string; tagline: { es: string; en: string } }> = {
  evofinz: { name: 'EvoFinz', emoji: '🔥', tagline: { es: 'finanzas personales con IA', en: 'personal finance with AI' } },
  fokuspark: { name: 'Fokuspark', emoji: '🧠', tagline: { es: 'productividad y enfoque', en: 'productivity and focus' } },
  universmind: { name: 'UniversMind', emoji: '🌌', tagline: { es: 'bienestar mental y crecimiento personal', en: 'mental wellness and personal growth' } },
};

function detectAppFromSource(source?: string): AppKey {
  if (!source) return 'evofinz';
  const s = source.toLowerCase().replace(/[_\- ]/g, '');
  if (s.includes('fokuspark')) return 'fokuspark';
  if (s.includes('universmind')) return 'universmind';
  return 'evofinz';
}

function detectLeadLanguage(lead: QuizLead): 'es' | 'en' {
  const country = lead.country?.toLowerCase() || '';
  if (country === 'canada' || country === 'ca') return 'en';
  return 'es';
}

function generateWhatsAppMessage(lead: QuizLead): string {
  const firstName = lead.name.split(' ')[0];
  const lang = detectLeadLanguage(lead);
  const app = detectAppFromSource(lead.source);
  const brand = APP_BRANDS[app];

  if (lang === 'en') {
    return encodeURIComponent(
      `Hi ${firstName}! ${brand.emoji}\n\nI'm from the ${brand.name} team. I saw you completed our quiz and mentioned your goal is "${lead.goal}" but your main obstacle is "${lead.obstacle}".\n\nWould you like us to help you create a personalized plan? 🎯`
    );
  }

  const messages: Record<AppKey, string> = {
    evofinz: `¡Hola ${firstName}! 🔥\n\nSoy del equipo de EvoFinz. Vi que completaste nuestro quiz financiero y mencionaste que tu meta es "${lead.goal}" pero tu obstáculo principal es "${lead.obstacle}".\n\n¿Te gustaría que te ayudemos a crear un plan personalizado para superar ese obstáculo? 🎯`,
    fokuspark: `¡Hola ${firstName}! 🧠\n\nSoy del equipo de Fokuspark. Vi que te interesa mejorar tu productividad y mencionaste que tu meta es "${lead.goal}" pero tu obstáculo es "${lead.obstacle}".\n\n¿Te gustaría que te ayudemos con herramientas de enfoque y productividad? 🎯`,
    universmind: `¡Hola ${firstName}! 🌌\n\nSoy del equipo de UniversMind. Vi que te interesa el bienestar mental y mencionaste que tu meta es "${lead.goal}" pero tu obstáculo es "${lead.obstacle}".\n\n¿Te gustaría explorar herramientas de meditación y crecimiento personal? 🎯`,
  };

  return encodeURIComponent(messages[app]);
}

function generateEmailContent(lead: QuizLead): { subject: string; body: string } {
  const firstName = lead.name.split(' ')[0];
  const lang = detectLeadLanguage(lead);
  const app = detectAppFromSource(lead.source);
  const brand = APP_BRANDS[app];

  if (lang === 'en') {
    return {
      subject: encodeURIComponent(`${firstName}, your personalized plan from ${brand.name} is ready`),
      body: encodeURIComponent(
        `Hi ${firstName},\n\nYou completed our quiz with a score of ${lead.quiz_score}%.\nYour current level is "${lead.quiz_level}" and we noticed your main obstacle is "${lead.obstacle}".\n\nWe have specific recommendations to help you achieve your goal of "${lead.goal}".\n\nWould you like to schedule a 15-minute call to review them?\n\nBest regards,\nThe ${brand.name} Team`
      ),
    };
  }

  const subjects: Record<AppKey, string> = {
    evofinz: `${firstName}, tu plan financiero personalizado está listo`,
    fokuspark: `${firstName}, tu plan de productividad personalizado está listo`,
    universmind: `${firstName}, tu plan de bienestar personalizado está listo`,
  };

  return {
    subject: encodeURIComponent(subjects[app]),
    body: encodeURIComponent(
      `Hola ${firstName},\n\nCompletaste nuestro quiz con un score de ${lead.quiz_score}%.\nTu nivel actual es "${lead.quiz_level}" y notamos que tu principal obstáculo es "${lead.obstacle}".\n\nTenemos recomendaciones específicas de ${brand.name} para ayudarte a alcanzar tu meta de "${lead.goal}".\n\n¿Te gustaría agendar una llamada de 15 minutos para revisarlas?\n\nSaludos,\nEl equipo de ${brand.name}`
    ),
  };
}

function formatPhoneForWhatsApp(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function QuickContact({ lead, variant = 'buttons', size = 'default' }: QuickContactProps) {
  const { language } = useLanguage();
  const es = language === 'es';
  const hasPhone = lead.phone && lead.phone.trim().length > 0;
  const whatsappUrl = hasPhone
    ? `https://wa.me/${formatPhoneForWhatsApp(lead.phone!).replace(/^\+/, '')}?text=${generateWhatsAppMessage(lead)}`
    : null;
  const isEmbeddedPreview = typeof window !== 'undefined' && window.self !== window.top;
  const whatsappTarget = isEmbeddedPreview ? '_top' : '_blank';

  const handleWhatsApp = () => {
    if (whatsappUrl) return;
    toast.error(
      es ? 'Este lead no tiene teléfono registrado. Usa email para contactarlo.' : 'This lead has no phone number. Use email to contact them.',
      {
        action: {
          label: es ? 'Enviar Email' : 'Send Email',
          onClick: handleEmail,
        },
      }
    );
  };

  const handleEmail = () => {
    const { subject, body } = generateEmailContent(lead);
    window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`, '_blank', 'noopener,noreferrer');
  };

  const handleCall = () => {
    if (!hasPhone) {
      toast.error(es ? 'Este lead no tiene teléfono registrado. Usa email para contactarlo.' : 'This lead has no phone number. Use email to contact them.');
      return;
    }
    window.open(`tel:${lead.phone}`, '_blank');
  };

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={size}>
            <Send className="mr-2 h-4 w-4" />
            {es ? 'Contactar' : 'Contact'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {whatsappUrl ? (
            <DropdownMenuItem asChild>
              <a href={whatsappUrl} target={whatsappTarget} rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
                {es ? 'Enviar WhatsApp' : 'Send WhatsApp'}
              </a>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleWhatsApp}>
              <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
              {es ? 'Enviar WhatsApp' : 'Send WhatsApp'}
              <span className="ml-2 text-xs text-muted-foreground">({es ? 'sin teléfono' : 'no phone'})</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleEmail}>
            <Mail className="mr-2 h-4 w-4 text-blue-600" />
            {es ? 'Enviar Email' : 'Send Email'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCall}>
            <Phone className="mr-2 h-4 w-4 text-purple-600" />
            {es ? 'Llamar' : 'Call'}
            {!hasPhone && <span className="ml-2 text-xs text-muted-foreground">({es ? 'sin teléfono' : 'no phone'})</span>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            {whatsappUrl ? (
              <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
                <a href={whatsappUrl} target={whatsappTarget} rel="noopener noreferrer" aria-label="WhatsApp">
                  <MessageCircle className="h-4 w-4" />
                </a>
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50" onClick={handleWhatsApp}>
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
          </TooltipTrigger>
          <TooltipContent>{hasPhone ? 'WhatsApp' : (es ? 'Sin teléfono' : 'No phone')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={handleEmail}>
              <Mail className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Email</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost" size="icon"
              className={`h-8 w-8 ${hasPhone ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50' : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50'}`}
              onClick={handleCall}
            >
              <Phone className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{hasPhone ? (es ? 'Llamar' : 'Call') : (es ? 'Sin teléfono' : 'No phone')}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
