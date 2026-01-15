import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { MessageSquare, Send, Loader2, CheckCircle } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  trigger?: React.ReactNode;
}

export function ContactForm({ trigger }: ContactFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { language } = useLanguage();

  const content = {
    es: {
      title: 'Contáctanos',
      description: '¿Tienes preguntas, sugerencias o necesitas ayuda? Estamos aquí para ti.',
      name: 'Nombre',
      namePlaceholder: 'Tu nombre',
      email: 'Correo electrónico',
      emailPlaceholder: 'tu@email.com',
      subject: 'Asunto',
      subjectPlaceholder: '¿En qué podemos ayudarte?',
      message: 'Mensaje',
      messagePlaceholder: 'Cuéntanos más detalles...',
      send: 'Enviar mensaje',
      sending: 'Enviando...',
      successTitle: '¡Mensaje enviado!',
      successMessage: 'Gracias por contactarnos. Te responderemos lo antes posible.',
      close: 'Cerrar',
      contact: 'Contacto',
    },
    en: {
      title: 'Contact Us',
      description: 'Have questions, suggestions, or need help? We\'re here for you.',
      name: 'Name',
      namePlaceholder: 'Your name',
      email: 'Email',
      emailPlaceholder: 'you@email.com',
      subject: 'Subject',
      subjectPlaceholder: 'How can we help you?',
      message: 'Message',
      messagePlaceholder: 'Tell us more details...',
      send: 'Send message',
      sending: 'Sending...',
      successTitle: 'Message sent!',
      successMessage: 'Thank you for contacting us. We\'ll get back to you as soon as possible.',
      close: 'Close',
      contact: 'Contact',
    },
  };

  const t = content[language];

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      // For now, we'll simulate sending - in production this would call an edge function
      // The edge function would use Resend to send the email
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Log the contact attempt for potential future processing
      console.log('[Contact Form] Submission:', data);
      
      // Store in localStorage for potential future sync when email is configured
      const submissions = JSON.parse(localStorage.getItem('evofinz_contact_submissions') || '[]');
      submissions.push({
        ...data,
        timestamp: Date.now(),
        status: 'pending'
      });
      localStorage.setItem('evofinz_contact_submissions', JSON.stringify(submissions));
      
      setIsSubmitted(true);
      form.reset();
      
      toast({
        title: t.successTitle,
        description: t.successMessage,
      });
    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: language === 'es' 
          ? 'No pudimos enviar tu mensaje. Por favor, intenta de nuevo.'
          : 'We couldn\'t send your message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setIsSubmitted(false);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            {t.contact}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {t.title}
          </DialogTitle>
          <DialogDescription>
            {t.description}
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{t.successTitle}</h3>
              <p className="text-muted-foreground text-sm mt-1">{t.successMessage}</p>
            </div>
            <Button onClick={() => handleOpenChange(false)} variant="outline">
              {t.close}
            </Button>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.name}</Label>
                <Input
                  id="name"
                  placeholder={t.namePlaceholder}
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t.emailPlaceholder}
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">{t.subject}</Label>
              <Input
                id="subject"
                placeholder={t.subjectPlaceholder}
                {...form.register('subject')}
              />
              {form.formState.errors.subject && (
                <p className="text-xs text-destructive">{form.formState.errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t.message}</Label>
              <Textarea
                id="message"
                placeholder={t.messagePlaceholder}
                rows={4}
                {...form.register('message')}
              />
              {form.formState.errors.message && (
                <p className="text-xs text-destructive">{form.formState.errors.message.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.sending}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {t.send}
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
