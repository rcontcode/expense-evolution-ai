import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useBetaSystem } from '@/hooks/data/useBetaSystem';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

export const ReferralCard = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { myReferralCode, myReferrals, isLoadingReferralCode } = useBetaSystem();
  const [copied, setCopied] = useState(false);

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
    },
  };

  const text = t[language];

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

  const handleShareWhatsApp = () => {
    if (!myReferralCode) return;
    
    const message = language === 'es'
      ? `🔥 ¡Te invito a probar EvoFinz! Es una app increíble para manejar tus finanzas. Usa mi código de referido: ${myReferralCode.code} para acceder al beta exclusivo. 🚀`
      : `🔥 I invite you to try EvoFinz! It's an amazing app for managing your finances. Use my referral code: ${myReferralCode.code} to access the exclusive beta. 🚀`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
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

  const handleShareEmail = () => {
    const subject = encodeURIComponent(language === 'es' 
      ? '🔥 Invitación a EvoFinz - Tu asistente financiero personal'
      : '🔥 EvoFinz Invitation - Your personal finance assistant');
    const body = encodeURIComponent(language === 'es'
      ? `¡Hola!\n\nTe invito a probar EvoFinz, una app increíble para manejar tus finanzas personales y de negocio.\n\nUsa mi código de referido: ${myReferralCode.code}\n\nRegistrarte aquí: ${window.location.origin}/auth?ref=${myReferralCode.code}\n\n¡Nos vemos adentro! 🚀`
      : `Hi!\n\nI invite you to try EvoFinz, an amazing app for managing your personal and business finances.\n\nUse my referral code: ${myReferralCode.code}\n\nSign up here: ${window.location.origin}/auth?ref=${myReferralCode.code}\n\nSee you inside! 🚀`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/auth?ref=${myReferralCode.code}`;
    await navigator.clipboard.writeText(link);
    toast({
      title: '🔗 ' + (language === 'es' ? '¡Link copiado!' : 'Link copied!'),
      description: link,
    });
  };

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
              <div className="text-xs text-white/70">{language === 'es' ? 'slots' : 'slots'}</div>
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

          {/* Share buttons - Grid layout */}
          <div className="grid grid-cols-2 gap-2">
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
              className="gap-1.5 text-xs col-span-2"
            >
              <Link2 className="h-3.5 w-3.5" />
              {language === 'es' ? 'Copiar link de invitación' : 'Copy invitation link'}
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
