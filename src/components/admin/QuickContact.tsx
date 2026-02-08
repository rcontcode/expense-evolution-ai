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
 * Generate WhatsApp message template
 */
function generateWhatsAppMessage(lead: QuizLead): string {
  const firstName = lead.name.split(' ')[0];
  
  return encodeURIComponent(
    `¡Hola ${firstName}! 👋

Soy del equipo de EvoFinz. Vi que completaste nuestro quiz financiero y mencionaste que tu meta es "${lead.goal}" pero tu obstáculo principal es "${lead.obstacle}".

¿Te gustaría que te ayudemos a crear un plan personalizado para superar ese obstáculo? 🎯`
  );
}

/**
 * Generate Email subject and body
 */
function generateEmailContent(lead: QuizLead): { subject: string; body: string } {
  const firstName = lead.name.split(' ')[0];
  
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

  const handleWhatsApp = () => {
    if (!hasPhone) {
      toast.error('Este lead no tiene teléfono registrado');
      return;
    }
    
    const phone = formatPhoneForWhatsApp(lead.phone!);
    const message = generateWhatsAppMessage(lead);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleEmail = () => {
    const { subject, body } = generateEmailContent(lead);
    window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleCall = () => {
    if (!hasPhone) {
      toast.error('Este lead no tiene teléfono registrado');
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
          <DropdownMenuItem onClick={handleWhatsApp} disabled={!hasPhone}>
            <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
            Enviar WhatsApp
            {!hasPhone && <span className="ml-2 text-xs text-muted-foreground">(sin teléfono)</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEmail}>
            <Mail className="mr-2 h-4 w-4 text-blue-600" />
            Enviar Email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCall} disabled={!hasPhone}>
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={handleWhatsApp}
              disabled={!hasPhone}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hasPhone ? 'Enviar WhatsApp' : 'Sin teléfono'}
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
              className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              onClick={handleCall}
              disabled={!hasPhone}
            >
              <Phone className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hasPhone ? 'Llamar' : 'Sin teléfono'}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
