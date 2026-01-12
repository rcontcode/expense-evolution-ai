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
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
      <Card className="border-dashed border-2 opacity-70">
        <CardContent className="p-6 text-center">
          <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium text-muted-foreground">{text.noCode}</p>
          <p className="text-sm text-muted-foreground/70">{text.noCodeHint}</p>
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
    >
      <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <Gift className="h-8 w-8" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-black">{text.title}</h3>
              <p className="text-white/80 text-sm">{text.subtitle}</p>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Code display */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">{text.yourCode}</p>
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex-1 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-xl p-4 border-2 border-dashed border-primary/30"
              >
                <p className="text-2xl font-black text-center tracking-wider bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {myReferralCode.code}
                </p>
              </motion.div>
              <Button
                variant="outline"
                size="lg"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{text.referralsUsed}</span>
              <span className="font-bold">
                {myReferralCode.current_referrals} / {myReferralCode.max_referrals}
                <span className="text-muted-foreground font-normal ml-1">
                  ({remaining} {text.referralsRemaining})
                </span>
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Bonus info */}
          <div className="flex items-center gap-2 text-sm bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 p-3 rounded-lg">
            <Sparkles className="h-5 w-5 shrink-0" />
            <p>{text.bonusInfo}</p>
          </div>

          {/* Share buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleCopy} 
              variant="outline" 
              className="flex-1 gap-2"
            >
              <Copy className="h-4 w-4" />
              {copied ? text.copied : text.copyCode}
            </Button>
            <Button 
              onClick={handleShareWhatsApp}
              className="flex-1 gap-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white"
            >
              <Share2 className="h-4 w-4" />
              {text.shareMessage}
            </Button>
          </div>

          {/* Referrals list */}
          {myReferrals && myReferrals.length > 0 && (
            <div className="pt-4 border-t space-y-3">
              <h4 className="font-bold flex items-center gap-2">
                <Users className="h-5 w-5" />
                {text.yourReferrals}
              </h4>
              <div className="space-y-2">
                {myReferrals.map((referral, i) => (
                  <motion.div
                    key={referral.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="p-2 rounded-full bg-gradient-to-br from-emerald-400 to-green-500">
                      <Heart className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{referral.referred_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{referral.referred_email}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                      <Trophy className="h-3 w-3 mr-1" />
                      +1
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {myReferrals && myReferrals.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{text.noReferrals}</p>
              <p className="text-xs opacity-70">{text.noReferralsHint}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
