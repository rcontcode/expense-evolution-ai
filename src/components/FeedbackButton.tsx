import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquarePlus, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { language } = useLanguage();
  const { user } = useAuth();

  const content = {
    es: {
      title: 'Enviar comentarios',
      description: 'Tu opinión nos ayuda a mejorar EvoFinz.',
      type: 'Tipo de comentario',
      typePlaceholder: 'Selecciona un tipo',
      types: {
        bug: '🐛 Reportar un error',
        feature: '💡 Sugerir una función',
        improvement: '✨ Sugerir mejora',
        other: '💬 Otro',
      },
      message: 'Tu mensaje',
      messagePlaceholder: 'Describe tu comentario en detalle...',
      email: 'Tu email (opcional)',
      emailPlaceholder: 'Para recibir una respuesta',
      submit: 'Enviar',
      cancel: 'Cancelar',
      success: '¡Gracias por tu comentario!',
      error: 'Error al enviar. Intenta de nuevo.',
    },
    en: {
      title: 'Send feedback',
      description: 'Your feedback helps us improve EvoFinz.',
      type: 'Feedback type',
      typePlaceholder: 'Select a type',
      types: {
        bug: '🐛 Report a bug',
        feature: '💡 Suggest a feature',
        improvement: '✨ Suggest improvement',
        other: '💬 Other',
      },
      message: 'Your message',
      messagePlaceholder: 'Describe your feedback in detail...',
      email: 'Your email (optional)',
      emailPlaceholder: 'To receive a response',
      submit: 'Submit',
      cancel: 'Cancel',
      success: 'Thank you for your feedback!',
      error: 'Error sending. Please try again.',
    },
  };

  const t = content[language];

  const handleSubmit = async () => {
    if (!type || !message.trim()) {
      toast.error(language === 'es' ? 'Por favor completa todos los campos' : 'Please fill all fields');
      return;
    }

    setLoading(true);
    
    try {
      // Create mailto link with feedback
      const subject = encodeURIComponent(`[EvoFinz Feedback] ${type}`);
      const body = encodeURIComponent(
        `Type: ${type}\n` +
        `Message: ${message}\n\n` +
        `---\n` +
        `User: ${user?.email || 'Anonymous'}\n` +
        `Reply to: ${email || 'N/A'}\n` +
        `URL: ${window.location.href}\n` +
        `Time: ${new Date().toISOString()}\n` +
        `Language: ${language}`
      );
      
      // Open email client
      window.location.href = `mailto:feedback@evofinz.com?subject=${subject}&body=${body}`;
      
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setType('');
        setMessage('');
        setEmail('');
      }, 2000);
      
      toast.success(t.success);
    } catch (error) {
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105 transition-all"
          title={t.title}
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        
        {success ? (
          <div className="py-8 flex flex-col items-center gap-4 animate-fade-in">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-center font-medium">{t.success}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.type}</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder={t.typePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">{t.types.bug}</SelectItem>
                  <SelectItem value="feature">{t.types.feature}</SelectItem>
                  <SelectItem value="improvement">{t.types.improvement}</SelectItem>
                  <SelectItem value="other">{t.types.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{t.message}</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.messagePlaceholder}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {message.length}/1000
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>{t.email}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t.cancel}
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={loading || !type || !message.trim()}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {t.submit}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
