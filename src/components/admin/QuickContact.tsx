import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MessageCircle, Mail, Phone, Send } from 'lucide-react';
import type { QuizLead } from '@/hooks/admin/useLeadsManagement';
import { toast } from 'sonner';

interface QuickContactProps {
  lead: QuizLead;
  variant?: 'dropdown' | 'buttons';
  size?: 'sm' | 'default';
}

/**
 * Detect lead language based on country
 */
function detectLeadLanguage(lead: QuizLead): 'es' | 'en' {
  const country = lead.country?.toLowerCase() || '';
  // Canada = English, everything else = Spanish
  if (country === 'canada' || country === 'ca') {
    return 'en';
  }
  return 'es';
}

/**
 * Generate WhatsApp message template (bilingual)
 */
function generateWhatsAppMessage(lead: QuizLead): string {
  const firstName = lead.name.split(' ')[0];
  const lang = detectLeadLanguage(lead);
  
  if (lang === 'en') {
    return encodeURIComponent(
      `Hi ${firstName}! 👋

I'm from the EvoFinz team. I saw you completed our financial quiz and mentioned your goal is "${lead.goal}" but your main obstacle is "${lead.obstacle}".

Would you like us to help you create a personalized plan to overcome that obstacle? 🎯`
    );
  }
  
  return encodeURIComponent(
    `¡Hola ${firstName}! 👋

Soy del equipo de EvoFinz. Vi que completaste nuestro quiz financiero y mencionaste que tu meta es "${lead.goal}" pero tu obstáculo principal es "${lead.obstacle}".

¿Te gustaría que te ayudemos a crear un plan personalizado para superar ese obstáculo? 🎯`
  );
}

/**
 * Generate Email subject and body (bilingual)
 */
function generateEmailContent(lead: QuizLead): { subject: string; body: string } {
  const firstName = lead.name.split(' ')[0];
  const lang = detectLeadLanguage(lead);
  
  if (lang === 'en') {
    const subject = encodeURIComponent(
      `${firstName}, your personalized financial plan is ready`
    );
    
    const body = encodeURIComponent(
      `Hi ${firstName},

You completed our Financial Phoenix Quiz with a score of ${lead.quiz_score}%.
Your current level is "${lead.quiz_level}" and we noticed your main obstacle is "${lead.obstacle}".

We have specific recommendations to help you achieve your goal of "${lead.goal}".

Would you like to schedule a 15-minute call to review them?

Best regards,
The EvoFinz Team`
    );
    
    return { subject, body };
  }
  
  const subject = encodeURIComponent(
    `${firstName}, tu plan financiero personalizado está listo`
  );
  
  const body = encodeURIComponent(
    `Hola ${firstName},

Completaste nuestro Financial Phoenix Quiz con un score de ${lead.quiz_score}%.
Tu nivel actual es "${lead.quiz_level}" y notamos que tu principal obstáculo es "${lead.obstacle}".

Tenemos recomendaciones específicas para ayudarte a alcanzar tu meta de "${lead.goal}".

¿Te gustaría agendar una llamada de 15 minutos para revisarlas?

Saludos,
El equipo de EvoFinz`
  );
  
  return { subject, body };
}

/**
 * Format phone for WhatsApp (remove spaces, dashes, etc)
 */
function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-numeric characters except +
  return phone.replace(/[^\d+]/g, '');
}

export function QuickContact({ lead, variant = 'buttons', size = 'default' }: QuickContactProps) {
  const hasPhone = lead.phone && lead.phone.trim().length > 0;
  const whatsappUrl = hasPhone
    ? `https://wa.me/${formatPhoneForWhatsApp(lead.phone!).replace(/^\+/, '')}?text=${generateWhatsAppMessage(lead)}`
    : null;
  const isEmbeddedPreview = typeof window !== 'undefined' && window.self !== window.top;
  const whatsappTarget = isEmbeddedPreview ? '_top' : '_blank';

  const handleWhatsApp = () => {
    if (whatsappUrl) return;

    toast.error('Este lead no tiene teléfono registrado. Usa email para contactarlo.', {
      action: {
        label: 'Enviar Email',
        onClick: handleEmail,
      },
    });
  };

  const handleEmail = () => {
    const { subject, body } = generateEmailContent(lead);
    window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`, '_blank', 'noopener,noreferrer');
  };

  const handleCall = () => {
    if (!hasPhone) {
      toast.error('Este lead no tiene teléfono registrado. Usa email para contactarlo.');
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
            Contactar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {whatsappUrl ? (
            <DropdownMenuItem asChild>
              <a href={whatsappUrl} target={whatsappTarget} rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
                Enviar WhatsApp
              </a>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleWhatsApp}>
              <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
              Enviar WhatsApp
              <span className="ml-2 text-xs text-muted-foreground">(sin teléfono)</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleEmail}>
            <Mail className="mr-2 h-4 w-4 text-blue-600" />
            Enviar Email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCall}>
            <Phone className="mr-2 h-4 w-4 text-purple-600" />
            Llamar
            {!hasPhone && <span className="ml-2 text-xs text-muted-foreground">(sin teléfono)</span>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Buttons variant
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            {whatsappUrl ? (
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Enviar WhatsApp">
                  <MessageCircle className="h-4 w-4" />
                </a>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50"
                onClick={handleWhatsApp}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
          </TooltipTrigger>
          <TooltipContent>
            {hasPhone ? 'Enviar WhatsApp' : 'Sin teléfono (click para ver opciones)'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={handleEmail}
            >
              <Mail className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Enviar Email</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${hasPhone ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50' : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50'}`}
              onClick={handleCall}
            >
              <Phone className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hasPhone ? 'Llamar' : 'Sin teléfono (click para ver opciones)'}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
