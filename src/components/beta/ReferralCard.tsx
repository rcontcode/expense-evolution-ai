import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Share2, 
  Copy, 
  Check, 
  Users, 
  Gift, 
  Sparkles,
  Crown,
  Trophy,
  Heart,
  Link2,
  MessageCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  Send,
  Smartphone,
  Clipboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useBetaSystem } from '@/hooks/data/useBetaSystem';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

// Pre-designed sharing messages with emojis
const SHARE_MESSAGES = {
  es: {
    whatsapp: {
      casual: `🔥 ¡Hey! Encontré esta app INCREÍBLE para manejar mis finanzas 💰

Se llama EvoFinz y tiene de todo:
✨ Captura gastos con fotos o voz
📊 Dashboard inteligente  
🎯 Calculadoras de ahorro y retiro
🤖 Asistente financiero personal

Estoy en el beta exclusivo y tengo invitaciones limitadas 🎁

📲 Usa mi código: {CODE}
🔗 Regístrate aquí: {LINK}

¡Te va a encantar! 🚀`,
      professional: `👋 Hola, te quiero compartir una herramienta que me ha ayudado mucho con mis finanzas.

📱 EvoFinz - Tu asistente financiero personal

Lo que más me gusta:
• Seguimiento de gastos e ingresos
• OCR inteligente para recibos
• Optimización fiscal (CRA/SII)
• Proyecciones FIRE y patrimonio

Tengo acceso al beta exclusivo y puedo invitarte 🎟️

Tu código de acceso: {CODE}
Enlace directo: {LINK}

¿Te interesa probarlo? 💼`,
      short: `🎁 ¡Te invito a EvoFinz!

La mejor app para manejar tus finanzas 💰
Mi código: {CODE}
Regístrate: {LINK}

¡Aprovecha, tengo invitaciones limitadas! 🚀`
    },
    email: {
      subject: '🎁 Invitación exclusiva a EvoFinz - Tu asistente financiero personal',
      body: `¡Hola!

Te escribo porque encontré una aplicación que creo que te va a encantar 🚀

Se llama EvoFinz y es un asistente financiero personal súper completo:

🎯 Lo que hace:
• Captura gastos con fotos, voz o texto
• Dashboard inteligente con gráficos
• Optimización fiscal para CRA (Canadá) y SII (Chile)
• Calculadoras FIRE, patrimonio neto y más
• Asistente de voz inteligente
• Gamificación para crear hábitos financieros

💡 Por qué lo recomiendo:
Estoy usándolo y realmente me ha ayudado a organizar mis finanzas de forma simple y visual.

🎁 Tu invitación exclusiva:
Código: {CODE}
Link directo: {LINK}

Tengo invitaciones limitadas, así que aprovecha!

¡Espero que te guste tanto como a mí!

Saludos 💪`
    }
  },
  en: {
    whatsapp: {
      casual: `🔥 Hey! I found this AMAZING app for managing my finances 💰

It's called EvoFinz and it has everything:
✨ Capture expenses with photos or voice
📊 Smart dashboard  
🎯 Savings & retirement calculators
🤖 Personal financial assistant

I have limited invites 🎁

📲 Use my code: {CODE}
🔗 Sign up here: {LINK}

You're gonna love it! 🚀`,
      professional: `👋 Hi, I wanted to share a tool that's been really helpful with my finances.

📱 EvoFinz - Your personal financial assistant

What I love most:
• Expense & income tracking
• Smart OCR for receipts
• Tax optimization (CRA/SII)
• FIRE projections & net worth

I can invite you to try it 🎟️

Your access code: {CODE}
Direct link: {LINK}

Interested in trying it? 💼`,
      short: `🎁 Inviting you to EvoFinz!

The best app to manage your finances 💰
My code: {CODE}
Sign up: {LINK}

Hurry, I have limited invites! 🚀`
    },
    email: {
      subject: '🎁 Exclusive EvoFinz Invitation - Your personal finance assistant',
      body: `Hi!

I'm reaching out because I found an app I think you'll love 🚀

It's called EvoFinz, a super complete personal financial assistant:

🎯 What it does:
• Capture expenses with photos, voice, or text
• Smart dashboard with charts
• Tax optimization for CRA (Canada) & SII (Chile)
• FIRE calculators, net worth tracking & more
• Smart voice assistant
• Gamification to build financial habits

💡 Why I recommend it:
I'm using it and it's really helped me organize my finances in a simple, visual way.

🎁 Your exclusive invitation:
Code: {CODE}
Direct link: {LINK}

I have limited invitations, so take advantage!

Hope you like it as much as I do!

Cheers 💪`
    }
  }
};

export const ReferralCard = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { myReferralCode, myReferrals, isLoadingReferralCode } = useBetaSystem();
  const [copied, setCopied] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<'casual' | 'professional' | 'short'>('casual');
  const [copiedMessage, setCopiedMessage] = useState(false);

  const t = {
    es: {
      title: '🎁 Invita Amigos',
      subtitle: 'Comparte EvoFinz con personas de confianza',
      yourCode: 'Tu código personal:',
      copyCode: 'Copiar código',
      copied: '¡Copiado!',
      shareMessage: 'Compartir por WhatsApp',
      referralsUsed: 'Invitaciones usadas',
      referralsRemaining: 'restantes',
      bonusInfo: '¡Por cada amigo que invites, ganas +1 invitación extra!',
      yourReferrals: '👥 Tus Referidos',
      noReferrals: 'Aún no has invitado a nadie',
      noReferralsHint: '¡Comparte tu código y gana recompensas!',
      noCode: 'Código no disponible',
      noCodeHint: 'Tu código de referido se generará automáticamente.',
      predesignedMessages: '📝 Mensajes listos para compartir',
      selectStyle: 'Elige tu estilo:',
      casual: '😎 Casual',
      professional: '💼 Profesional',
      short: '⚡ Corto',
      copyMessage: 'Copiar mensaje',
      messageCopied: '¡Mensaje copiado!',
      sendWhatsApp: '📲 Enviar por WhatsApp',
      sendEmail: '📧 Enviar por Email',
      tapToCopy: 'Toca para copiar el mensaje',
      showMessages: 'Ver mensajes prediseñados',
      hideMessages: 'Ocultar mensajes',
    },
    en: {
      title: '🎁 Invite Friends',
      subtitle: 'Share EvoFinz with people you trust',
      yourCode: 'Your personal code:',
      copyCode: 'Copy code',
      copied: 'Copied!',
      shareMessage: 'Share via WhatsApp',
      referralsUsed: 'Invitations used',
      referralsRemaining: 'remaining',
      bonusInfo: 'For each friend you invite, you earn +1 extra invitation!',
      yourReferrals: '👥 Your Referrals',
      noReferrals: "You haven't invited anyone yet",
      noReferralsHint: 'Share your code and earn rewards!',
      noCode: 'Code not available',
      noCodeHint: 'Your referral code will be generated automatically.',
      predesignedMessages: '📝 Ready-to-share messages',
      selectStyle: 'Choose your style:',
      casual: '😎 Casual',
      professional: '💼 Professional',
      short: '⚡ Short',
      copyMessage: 'Copy message',
      messageCopied: 'Message copied!',
      sendWhatsApp: '📲 Send via WhatsApp',
      sendEmail: '📧 Send via Email',
      tapToCopy: 'Tap to copy the message',
      showMessages: 'View pre-designed messages',
      hideMessages: 'Hide messages',
    },
  };

  const text = t[language];
  const messages = SHARE_MESSAGES[language];

  const getFormattedMessage = (type: 'casual' | 'professional' | 'short') => {
    if (!myReferralCode) return '';
    const link = `${window.location.origin}/auth?ref=${myReferralCode.code}`;
    return messages.whatsapp[type]
      .replace('{CODE}', myReferralCode.code)
      .replace('{LINK}', link);
  };

  const getFormattedEmailBody = () => {
    if (!myReferralCode) return '';
    const link = `${window.location.origin}/auth?ref=${myReferralCode.code}`;
    return messages.email.body
      .replace('{CODE}', myReferralCode.code)
      .replace('{LINK}', link);
  };

  const handleCopy = async () => {
    if (!myReferralCode) return;
    
    await navigator.clipboard.writeText(myReferralCode.code);
    setCopied(true);
    toast({
      title: '📋 ' + text.copied,
      description: myReferralCode.code,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMessage = async () => {
    const message = getFormattedMessage(selectedMessage);
    await navigator.clipboard.writeText(message);
    setCopiedMessage(true);
    toast({
      title: '📋 ' + text.messageCopied,
      description: language === 'es' ? '¡Listo para pegar!' : 'Ready to paste!',
    });
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const message = getFormattedMessage(selectedMessage);
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = () => {
    if (!myReferralCode) return;
    const subject = encodeURIComponent(messages.email.subject);
    const body = encodeURIComponent(getFormattedEmailBody());
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleCopyLink = async () => {
    if (!myReferralCode) return;
    const link = `${window.location.origin}/auth?ref=${myReferralCode.code}`;
    await navigator.clipboard.writeText(link);
    toast({
      title: '🔗 ' + (language === 'es' ? '¡Link copiado!' : 'Link copied!'),
      description: link,
    });
  };

  if (isLoadingReferralCode) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-20 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!myReferralCode) {
    return (
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-fuchsia-500/5">
        <CardContent className="p-8 text-center space-y-4">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <Gift className="h-16 w-16 mx-auto text-violet-500" />
          </motion.div>
          <div>
            <p className="font-bold text-lg text-foreground">{text.noCode}</p>
            <p className="text-sm text-muted-foreground mt-1">{text.noCodeHint}</p>
          </div>
          <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800">
            <Sparkles className="h-3 w-3 mr-1" />
            {language === 'es' ? 'Se genera al activar beta' : 'Generated when beta is activated'}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  const progress = (myReferralCode.current_referrals / myReferralCode.max_referrals) * 100;
  const remaining = myReferralCode.max_referrals - myReferralCode.current_referrals;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card className="overflow-hidden border-2 border-violet-500/30 shadow-xl h-full bg-gradient-to-br from-violet-500/5 via-background to-fuchsia-500/5">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 p-4 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white rounded-full blur-2xl" />
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"
            >
              <Gift className="h-6 w-6" />
            </motion.div>
            <div className="flex-1">
              <h3 className="text-xl font-black flex items-center gap-2">
                {text.title}
                <Badge className="bg-white/20 text-white text-xs border-0">
                  +100 pts
                </Badge>
              </h3>
              <p className="text-white/80 text-xs">{text.subtitle}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black">{remaining}</div>
              <div className="text-xs text-white/70">slots</div>
            </div>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Code display - Compact */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{text.yourCode}</p>
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex-1 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 rounded-lg p-3 border-2 border-dashed border-violet-500/30"
              >
                <p className="text-lg font-black text-center tracking-widest bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  {myReferralCode.code}
                </p>
              </motion.div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0 h-10 w-10"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Progress - Compact */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{text.referralsUsed}</span>
              <span className="font-semibold">
                {myReferralCode.current_referrals} / {myReferralCode.max_referrals}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Bonus info - Compact */}
          <div className="flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 p-2.5 rounded-lg">
            <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{text.bonusInfo}</p>
          </div>

          {/* Pre-designed Messages Section */}
          <Collapsible open={showMessages} onOpenChange={setShowMessages}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full gap-2 border-violet-300 hover:bg-violet-50 dark:border-violet-700 dark:hover:bg-violet-950/30"
              >
                <MessageCircle className="h-4 w-4 text-violet-600" />
                <span className="flex-1 text-left text-sm font-medium">
                  {showMessages ? text.hideMessages : text.showMessages}
                </span>
                {showMessages ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-3 space-y-3">
              {/* Style selector */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{text.selectStyle}</p>
                <div className="flex gap-2">
                  {(['casual', 'professional', 'short'] as const).map((style) => (
                    <Button
                      key={style}
                      variant={selectedMessage === style ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedMessage(style)}
                      className={`flex-1 text-xs ${
                        selectedMessage === style 
                          ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 border-0' 
                          : ''
                      }`}
                    >
                      {text[style]}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Message preview */}
              <div className="relative">
                <div 
                  className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed border-2 border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto"
                >
                  {getFormattedMessage(selectedMessage)}
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
                  <Clipboard className="h-3 w-3" />
                  {text.tapToCopy}
                </p>
              </div>

              {/* Action buttons for messages */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={handleCopyMessage}
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                >
                  {copiedMessage ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiedMessage ? text.messageCopied : text.copyMessage}
                </Button>
                <Button 
                  onClick={handleShareWhatsApp}
                  size="sm"
                  className="gap-1.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white text-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  WhatsApp
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Quick share buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button 
              onClick={handleShareWhatsApp}
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white text-xs"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </Button>
            <Button 
              onClick={handleShareEmail}
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
            >
              <Mail className="h-3.5 w-3.5" />
              Email
            </Button>
            <Button 
              onClick={handleCopyLink}
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
            >
              <Link2 className="h-3.5 w-3.5" />
              Link
            </Button>
          </div>

          {/* Referrals list - Compact */}
          {myReferrals && myReferrals.length > 0 && (
            <div className="pt-3 border-t space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                {text.yourReferrals}
              </h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {myReferrals.map((referral, i) => (
                  <motion.div
                    key={referral.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-emerald-500/10 to-green-500/10"
                  >
                    <div className="p-1.5 rounded-full bg-gradient-to-br from-emerald-400 to-green-500">
                      <Heart className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{referral.referred_name}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200 text-xs dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                      <Trophy className="h-2.5 w-2.5 mr-0.5" />
                      +100
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {myReferrals && myReferrals.length === 0 && (
            <div className="text-center py-3 text-muted-foreground bg-muted/30 rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-1.5 opacity-40" />
              <p className="text-xs font-medium">{text.noReferrals}</p>
              <p className="text-xs opacity-60">{text.noReferralsHint}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};