import { useState, useMemo } from 'react';
import { 
  MessageSquare, Send, Link2, Copy, Mail, 
  CheckCircle2, AlertTriangle, Bug, Star, Gift, 
  Users, Trophy, Shield, Smartphone, BookOpen
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface BetaCode {
  id: string;
  code: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
}

type TemplateKey = 'whatsapp_es' | 'whatsapp_en' | 'email_es' | 'email_en';

const TEMPLATES: Record<TemplateKey, { label: string; icon: React.ReactNode; subjectLine?: string; fn: (code: string) => string }> = {
  whatsapp_es: {
    label: '📱 WhatsApp (Español)',
    icon: <Smartphone className="h-4 w-4" />,
    fn: (code) => `🔥 ¡Te invito a probar EvoFinz antes que nadie!

EvoFinz es una plataforma de finanzas personales que te ayuda a:
✅ Registrar gastos e ingresos fácilmente
✅ Escanear facturas y tickets con tu cámara
✅ Controlar tu presupuesto en tiempo real
✅ Gestionar contratos y suscripciones
✅ Visualizar tu patrimonio neto
✅ Calendario fiscal para tus obligaciones

🎯 Como beta tester recibes acceso GRATIS a todas las funciones Pro.

📋 ¿Qué necesitas hacer?
• Enviar al menos 4 reportes cada 14 días (feedback o bugs)
• Al menos 1 debe ser un reporte de bug
• Ir a "Beta Feedback" en el menú para calificar secciones o reportar errores
• ¡Ganas puntos por cada reporte y subes de nivel!

🏆 Niveles: Bronze → Silver → Gold → Platinum → Diamond
🎁 Canjea puntos por suscripciones reales (¡hasta 1 año de Pro gratis!)

👉 Regístrate aquí: https://evofinz.com/auth?beta=${code}
🔑 Tu código de acceso: ${code}

🔍 ¿Quieres ver más antes de registrarte?
• Mira qué hace la app: https://evofinz.com/landing
• Haz tu diagnóstico financiero gratis: https://evofinz.com/quiz

📋 Pasos:
1. Click en el link → crea tu cuenta con el código
2. Explora la app libremente (14 días de gracia sin obligaciones)
3. Ve a "Beta Feedback" en el menú lateral y empieza a reportar
4. ¡Gana puntos y desbloquea recompensas!

Una vez dentro, también podrás invitar a tus amigos con tu propio código de referido. ¿Te animas? 🚀`,
  },
  whatsapp_en: {
    label: '📱 WhatsApp (English)',
    icon: <Smartphone className="h-4 w-4" />,
    fn: (code) => `🔥 You're invited to try EvoFinz before anyone else!

EvoFinz is a personal finance platform that helps you:
✅ Easily track your expenses & income
✅ Scan receipts & invoices with your camera
✅ Monitor your budget in real time
✅ Manage contracts & subscriptions
✅ Track your net worth
✅ Fiscal calendar for your obligations

🎯 As a beta tester you get FREE access to all Pro features.

📋 What do you need to do?
• Submit at least 4 reports every 14 days (feedback or bugs)
• At least 1 must be a bug report
• Go to "Beta Feedback" in the menu to rate sections or report bugs
• Earn points for every report and level up!

🏆 Levels: Bronze → Silver → Gold → Platinum → Diamond
🎁 Redeem points for real subscriptions (up to 1 year of Pro for free!)

👉 Sign up here: https://evofinz.com/auth?beta=${code}
🔑 Your access code: ${code}

📋 Steps:
1. Click the link → create your account with the code
2. Explore the app freely (14-day grace period, no obligations)
3. Go to "Beta Feedback" in the sidebar and start reporting
4. Earn points and unlock rewards!

Once inside, you can also invite your friends with your own referral code. Are you in? 🚀`,
  },
  email_es: {
    label: '📧 Email (Español)',
    icon: <Mail className="h-4 w-4" />,
    subjectLine: '[Invitación Exclusiva] Prueba EvoFinz antes que nadie',
    fn: (code) => `Asunto sugerido: [Invitación Exclusiva] Prueba EvoFinz antes que nadie

¡Hola!

Te escribo porque me gustaría invitarte a probar EvoFinz, una plataforma de finanzas personales que estamos desarrollando. Estamos en fase beta y buscamos personas que nos ayuden a mejorar la app con su feedback.

¿Qué es EvoFinz?
Una herramienta para tomar control total de tus finanzas:
• Registro de gastos e ingresos con categorías inteligentes
• Escaneo de facturas y tickets con la cámara
• Control de presupuesto en tiempo real con alertas
• Gestión de contratos y suscripciones
• Visualización de patrimonio neto y progreso financiero
• Calendario fiscal para obligaciones importantes

¿Qué obtienes como beta tester?
• Acceso GRATIS a todas las funciones Pro durante tu período beta
• Sistema de puntos: ganas puntos por cada feedback y bug report
• Niveles: Bronze → Silver → Gold → Platinum → Diamond
• Recompensas canjeables: hasta 1 año de suscripción Pro gratis

¿Qué se espera de ti?
• Usar la app regularmente
• Enviar al menos 4 reportes cada 14 días (feedback sobre secciones + al menos 1 reporte de bug)
• Los comentarios deben tener al menos 80 caracteres para garantizar calidad
• Los primeros 14 días son de gracia para que explores sin presión

¿Cómo empezar?
1. Entra a: https://evofinz.com/auth?beta=${code}
2. Crea tu cuenta usando el código: ${code}
3. Explora la app y ve a "Beta Feedback" en el menú lateral
4. Califica las secciones que uses y reporta cualquier error

Una vez dentro, podrás generar tu propio código de referido para invitar a tus amigos (¡y ganar 100 puntos extra por cada uno!).

¡Espero que te animes!

Saludos`,
  },
  email_en: {
    label: '📧 Email (English)',
    icon: <Mail className="h-4 w-4" />,
    subjectLine: '[Exclusive Invitation] Try EvoFinz before anyone else',
    fn: (code) => `Suggested subject: [Exclusive Invitation] Try EvoFinz before anyone else

Hi there!

I'd like to invite you to try EvoFinz, a personal finance platform we're building. We're in beta and looking for people to help us improve with honest feedback.

What is EvoFinz?
A tool to take full control of your finances:
• Expense & income tracking with smart categories
• Receipt & invoice scanning with your camera
• Real-time budget monitoring with alerts
• Contract & subscription management
• Net worth visualization & financial progress
• Fiscal calendar for important deadlines

What do you get as a beta tester?
• FREE access to all Pro features during your beta period
• Points system: earn points for every feedback and bug report
• Levels: Bronze → Silver → Gold → Platinum → Diamond
• Redeemable rewards: up to 1 year of Pro subscription for free

What's expected?
• Use the app regularly
• Submit at least 4 reports every 14 days (section feedback + at least 1 bug report)
• Comments must be at least 80 characters to ensure quality
• First 14 days are a grace period to explore without pressure

How to get started:
1. Go to: https://evofinz.com/auth?beta=${code}
2. Create your account using the code: ${code}
3. Explore the app and go to "Beta Feedback" in the sidebar
4. Rate the sections you use and report any bugs you find

Once inside, you can generate your own referral code to invite friends (and earn 100 bonus points for each one!).

Hope you join us!

Best regards`,
  },
};

interface BetaInviteTabProps {
  codes: BetaCode[] | undefined;
}

export function BetaInviteTab({ codes }: BetaInviteTabProps) {
  const { toast } = useToast();
  const [selectedCodeId, setSelectedCodeId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>('whatsapp_es');
  const [editableMessage, setEditableMessage] = useState('');

  const activeCodes = useMemo(() => 
    codes?.filter(c => c.is_active && c.current_uses < c.max_uses) || [],
  [codes]);

  const selectedCode = useMemo(() => 
    activeCodes.find(c => c.id === selectedCodeId)?.code || '',
  [activeCodes, selectedCodeId]);

  // Regenerate message when code or template changes
  useMemo(() => {
    if (selectedCode) {
      setEditableMessage(TEMPLATES[selectedTemplate].fn(selectedCode));
    } else {
      setEditableMessage(TEMPLATES[selectedTemplate].fn('TU-CÓDIGO'));
    }
  }, [selectedCode, selectedTemplate]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(editableMessage);
    toast({ title: '¡Mensaje copiado!', description: 'Pégalo en WhatsApp, Email o donde quieras.' });
  };

  const handleCopyLink = () => {
    const code = selectedCode || 'TU-CÓDIGO';
    navigator.clipboard.writeText(`https://evofinz.com/auth?beta=${code}`);
    toast({ title: '¡Link copiado!', description: `Link con código ${code} copiado al portapapeles.` });
  };

  return (
    <div className="space-y-6">
      {/* Section 1: How it works - 5 steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Cómo funciona el programa
          </CardTitle>
          <CardDescription>Flujo completo para invitar beta testers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[
              { step: 1, icon: '🎫', title: 'Crea códigos', desc: 'En la tab "Códigos", genera códigos con prefijo y cantidad' },
              { step: 2, icon: '📝', title: 'Elige plantilla', desc: 'Selecciona un código activo y una plantilla de mensaje aquí' },
              { step: 3, icon: '📤', title: 'Envía el mensaje', desc: 'Copia y envía por WhatsApp o Email a tu invitado' },
              { step: 4, icon: '👤', title: 'Se registra', desc: 'Tu invitado usa el link, crea su cuenta con el código' },
              { step: 5, icon: '💬', title: 'Da feedback', desc: 'El tester va a "Beta Feedback" y empieza a reportar' },
            ].map((item) => (
              <div key={item.step} className="relative p-3 rounded-xl border bg-card text-center">
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mx-auto mb-1">
                  {item.step}
                </div>
                <p className="text-xs font-semibold">{item.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              Requisitos mínimos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
              <span><strong>4 contribuciones</strong> cada 14 días</span>
            </div>
            <div className="flex items-start gap-2">
              <Bug className="h-3.5 w-3.5 text-orange-500 mt-0.5 shrink-0" />
              <span>Al menos <strong>1 bug report</strong> por período</span>
            </div>
            <div className="flex items-start gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <span>Comentarios de <strong>80+ caracteres</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
              <span>Si no cumple → acceso Pro se degrada a Free</span>
            </div>
            <div className="flex items-start gap-2">
              <Gift className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <span><strong>14 días de gracia</strong> al inicio para explorar</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bug className="h-4 w-4 text-red-500" />
              Qué reportar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <p>🐛 Errores visuales, funciones que no cargan, datos incorrectos</p>
            <p>💡 Sugerencias de mejora con detalle suficiente</p>
            <p>🐌 Problemas de rendimiento o velocidad</p>
            <p>⭐ Calificar cada sección que uses (facilidad, utilidad, diseño)</p>
            <p>📸 Incluir capturas de pantalla en bugs (+25 pts extra)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Dónde y cómo reportar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <p>📍 Ir a <strong>"Beta Feedback"</strong> en el menú lateral</p>
            <p>⭐ <strong>Tab "Evaluación"</strong>: califica secciones con estrellas + comentarios detallados</p>
            <p>🐛 <strong>Tab "Reportar Bug"</strong>: describe el error, severidad y adjunta capturas</p>
            <p>📊 Cada reporte suma puntos para subir de nivel</p>
            <p>📖 El tester puede ver la <strong>"Guía del Beta Tester"</strong> para más detalle</p>
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Referrals */}
      <Card className="bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border-blue-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Sobre los referidos
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1.5">
          <p>👤 Una vez activado como beta tester, cada usuario recibe automáticamente un <strong>código de referido personal</strong> (ej: JUAN-A1B2C3)</p>
          <p>🎫 Inician con <strong>3 slots de referido</strong>. Cada referido exitoso = <strong>+1 slot extra + 100 puntos</strong></p>
          <p>🚫 No se permite auto-referido (usar tu propio código)</p>
          <p>📲 Pueden compartir su código desde su perfil o dashboard beta</p>
        </CardContent>
      </Card>

      {/* Section 4: Message Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Generador de mensajes de invitación
          </CardTitle>
          <CardDescription>Selecciona un código activo y una plantilla, edita si quieres y copia</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Código activo</Label>
              <Select value={selectedCodeId} onValueChange={setSelectedCodeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un código..." />
                </SelectTrigger>
                <SelectContent>
                  {activeCodes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} ({c.current_uses}/{c.max_uses} usos)
                    </SelectItem>
                  ))}
                  {activeCodes.length === 0 && (
                    <SelectItem value="none" disabled>No hay códigos activos disponibles</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plantilla</Label>
              <Select value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as TemplateKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(TEMPLATES) as [TemplateKey, typeof TEMPLATES[TemplateKey]][]).map(([key, tpl]) => (
                    <SelectItem key={key} value={key}>{tpl.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {TEMPLATES[selectedTemplate].subjectLine && (
            <div className="flex items-center gap-2 text-xs bg-muted/50 rounded-lg p-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Asunto sugerido:</span>
              <code className="font-mono text-foreground">{TEMPLATES[selectedTemplate].subjectLine}</code>
            </div>
          )}

          <div className="space-y-2">
            <Label>Mensaje (editable)</Label>
            <Textarea 
              value={editableMessage}
              onChange={(e) => setEditableMessage(e.target.value)}
              className="min-h-[300px] font-mono text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCopyMessage} className="gap-2">
              <Copy className="h-4 w-4" />
              Copiar mensaje completo
            </Button>
            <Button variant="outline" onClick={handleCopyLink} className="gap-2">
              <Link2 className="h-4 w-4" />
              Copiar solo el link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Levels & Rewards */}
      <Card className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            Sistema de niveles y recompensas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {[
              { name: 'Bronze', range: '0-199', emoji: '🥉' },
              { name: 'Silver', range: '200-499', emoji: '🥈' },
              { name: 'Gold', range: '500-999', emoji: '🥇' },
              { name: 'Platinum', range: '1000-1999', emoji: '💎' },
              { name: 'Diamond', range: '2000+', emoji: '👑' },
            ].map((t) => (
              <Badge key={t.name} variant="outline" className="text-xs gap-1">
                {t.emoji} {t.name} ({t.range} pts)
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded-lg border bg-card">
              <p className="font-semibold">⭐ Premium 1 Año</p>
              <p className="text-muted-foreground">1,000 pts</p>
            </div>
            <div className="p-2 rounded-lg border bg-card">
              <p className="font-semibold">🚀 Pro 6 Meses</p>
              <p className="text-muted-foreground">2,000 pts</p>
            </div>
            <div className="p-2 rounded-lg border bg-card">
              <p className="font-semibold">👑 Pro 1 Año</p>
              <p className="text-muted-foreground">3,000 pts</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Los puntos se ganan por feedback (25-50 pts), bug reports (25-150 pts según severidad) y referidos (100 pts). 
            Las recompensas se solicitan desde el Dashboard Beta y un administrador las aprueba.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
