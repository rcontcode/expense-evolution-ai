import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Star, 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  Send, 
  CheckCircle2,
  Sparkles,
  Heart,
  Rocket,
  Trophy,
  Crown,
  Zap,
  Gift,
  PartyPopper,
  ThumbsUp,
  ThumbsDown,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useBetaFeedback } from '@/hooks/data/useBetaFeedback';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { PhoenixLogo } from '@/components/ui/phoenix-logo';
import { SystemAlertsBanner } from '@/components/beta/SystemAlertsBanner';
import { ReferralCard } from '@/components/beta/ReferralCard';
import { ScreenshotUpload } from '@/components/beta/ScreenshotUpload';
import { BetaGamificationCard } from '@/components/beta/BetaGamificationCard';
import { MissionsCard } from '@/components/beta/MissionsCard';
import { BetaRoadmapCard } from '@/components/beta/BetaRoadmapCard';
import { FloatingParticles } from '@/components/beta/FloatingParticles';
import { ProgressChart } from '@/components/beta/ProgressChart';
import { StreakFlame } from '@/components/beta/StreakFlame';

const APP_SECTIONS = [
  { id: 'dashboard', label: { es: 'Dashboard', en: 'Dashboard' }, emoji: '📊', color: 'from-violet-500 to-purple-600' },
  { id: 'expenses', label: { es: 'Gastos', en: 'Expenses' }, emoji: '💸', color: 'from-rose-500 to-pink-600' },
  { id: 'income', label: { es: 'Ingresos', en: 'Income' }, emoji: '💰', color: 'from-emerald-500 to-green-600' },
  { id: 'quick_capture', label: { es: 'Captura Rápida', en: 'Quick Capture' }, emoji: '📷', color: 'from-cyan-500 to-teal-600' },
  { id: 'voice_assistant', label: { es: 'Asistente de Voz', en: 'Voice Assistant' }, emoji: '🎤', color: 'from-orange-500 to-amber-600' },
  { id: 'clients', label: { es: 'Clientes', en: 'Clients' }, emoji: '👥', color: 'from-blue-500 to-indigo-600' },
  { id: 'projects', label: { es: 'Proyectos', en: 'Projects' }, emoji: '📁', color: 'from-fuchsia-500 to-purple-600' },
  { id: 'contracts', label: { es: 'Contratos', en: 'Contracts' }, emoji: '📄', color: 'from-slate-500 to-gray-600' },
  { id: 'mileage', label: { es: 'Kilometraje', en: 'Mileage' }, emoji: '🚗', color: 'from-lime-500 to-green-600' },
  { id: 'net_worth', label: { es: 'Patrimonio', en: 'Net Worth' }, emoji: '🏦', color: 'from-amber-500 to-yellow-600' },
  { id: 'mentorship', label: { es: 'Mentoría', en: 'Mentorship' }, emoji: '📚', color: 'from-red-500 to-rose-600' },
  { id: 'tax_calendar', label: { es: 'Calendario Fiscal', en: 'Tax Calendar' }, emoji: '📅', color: 'from-teal-500 to-cyan-600' },
  { id: 'banking', label: { es: 'Bancos', en: 'Banking' }, emoji: '🏧', color: 'from-indigo-500 to-blue-600' },
  { id: 'settings', label: { es: 'Configuración', en: 'Settings' }, emoji: '⚙️', color: 'from-gray-500 to-slate-600' },
  { id: 'general', label: { es: 'General / Otro', en: 'General / Other' }, emoji: '🌟', color: 'from-yellow-500 to-orange-600' },
];

const StarRating = ({ 
  value, 
  onChange, 
  label,
  emoji
}: { 
  value: number; 
  onChange: (v: number) => void; 
  label: string;
  emoji?: string;
}) => {
  const [hovered, setHovered] = useState(0);
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        {emoji && <span className="text-lg">{emoji}</span>}
        {label}
      </Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            whileHover={{ scale: 1.2, rotate: star === 5 ? 10 : 0 }}
            whileTap={{ scale: 0.9 }}
            className="p-1 transition-all"
          >
            <Star
              className={`h-9 w-9 transition-all ${
                star <= (hovered || value)
                  ? 'fill-amber-400 text-amber-400 drop-shadow-lg'
                  : 'text-muted-foreground/30 hover:text-amber-300'
              }`}
            />
          </motion.button>
        ))}
      </div>
      {value > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-medium"
        >
          {value === 5 && <span className="text-amber-500">🔥 ¡Increíble!</span>}
          {value === 4 && <span className="text-emerald-500">✨ ¡Muy bien!</span>}
          {value === 3 && <span className="text-blue-500">👍 Bien</span>}
          {value === 2 && <span className="text-orange-500">🤔 Puede mejorar</span>}
          {value === 1 && <span className="text-rose-500">😕 Necesita trabajo</span>}
        </motion.div>
      )}
    </div>
  );
};

const BetaFeedback = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { submitFeedback, submitBugReport } = useBetaFeedback();
  const [userName, setUserName] = useState('');
  
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setUserName(user.user_metadata.full_name.split(' ')[0]);
    }
  }, [user]);
  
  // Feedback form state
  const [section, setSection] = useState('');
  const [rating, setRating] = useState(0);
  const [easeOfUse, setEaseOfUse] = useState(0);
  const [usefulness, setUsefulness] = useState(0);
  const [designRating, setDesignRating] = useState(0);
  const [comment, setComment] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Bug report form state
  const [reportType, setReportType] = useState('bug');
  const [severity, setSeverity] = useState('medium');
  const [bugTitle, setBugTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [bugScreenshot, setBugScreenshot] = useState('');
  const [bugSent, setBugSent] = useState(false);

  const t = {
    es: {
      title: '🚀 Centro de Feedback VIP',
      subtitle: 'Tu voz construye el futuro de EvoFinz',
      betaBadge: '⭐ FOUNDING MEMBER',
      feedbackTab: '⭐ Evaluar',
      bugTab: '🐛 Reportar',
      selectSection: '¿Qué sección quieres evaluar?',
      overallRating: '¿Cómo calificas esta sección?',
      easeOfUse: '¿Qué tan fácil es de usar?',
      usefulness: '¿Qué tan útil te parece?',
      design: '¿Qué te parece el diseño?',
      comments: '💬 Cuéntanos más (opcional)',
      commentsPlaceholder: 'Nos encanta escucharte... ¿Qué te gustó? ¿Qué podría ser mejor?',
      suggestions: '💡 ¿Tienes ideas geniales?',
      suggestionsPlaceholder: 'Tus ideas pueden convertirse en realidad...',
      recommend: '¿Recomendarías EvoFinz a un amigo?',
      yes: '¡Sí!',
      no: 'Todavía no',
      sendFeedback: '🚀 Enviar Mi Opinión',
      reportType: '¿Qué tipo de reporte es?',
      bug: '🐛 Bug / Error',
      suggestion: '💡 Sugerencia',
      question: '❓ Pregunta',
      severity: '¿Qué tan urgente es?',
      low: '🟢 Tranqui',
      medium: '🟡 Normal',
      high: '🟠 Importante',
      critical: '🔴 ¡Urgente!',
      bugTitle: '📝 Título breve',
      bugTitlePlaceholder: 'Ej: El botón de guardar no funciona',
      bugDescription: '📋 Cuéntanos todo',
      bugDescriptionPlaceholder: '¿Qué pasó exactamente? ¿Cómo lo reproducimos? Cada detalle ayuda 🔍',
      sendReport: '📨 Enviar Reporte',
      thankYou: '🎉 ¡Eres increíble!',
      thankYouMessage: 'Tu feedback es oro puro. Cada opinión nos acerca a construir algo extraordinario JUNTOS.',
      sendAnother: '✨ Enviar otro feedback',
      impactMessage: '💪 Tu voz tiene impacto real',
    },
    en: {
      title: '🚀 VIP Feedback Center',
      subtitle: 'Your voice builds the future of EvoFinz',
      betaBadge: '⭐ FOUNDING MEMBER',
      feedbackTab: '⭐ Rate',
      bugTab: '🐛 Report',
      selectSection: 'Which section do you want to rate?',
      overallRating: 'How do you rate this section?',
      easeOfUse: 'How easy is it to use?',
      usefulness: 'How useful is it?',
      design: 'How do you like the design?',
      comments: '💬 Tell us more (optional)',
      commentsPlaceholder: 'We love hearing from you... What did you like? What could be better?',
      suggestions: '💡 Got any awesome ideas?',
      suggestionsPlaceholder: 'Your ideas can become reality...',
      recommend: 'Would you recommend EvoFinz to a friend?',
      yes: 'Yes!',
      no: 'Not yet',
      sendFeedback: '🚀 Send My Opinion',
      reportType: 'What type of report is this?',
      bug: '🐛 Bug / Error',
      suggestion: '💡 Suggestion',
      question: '❓ Question',
      severity: 'How urgent is it?',
      low: '🟢 Chill',
      medium: '🟡 Normal',
      high: '🟠 Important',
      critical: '🔴 Urgent!',
      bugTitle: '📝 Brief title',
      bugTitlePlaceholder: 'E.g.: The save button doesn\'t work',
      bugDescription: '📋 Tell us everything',
      bugDescriptionPlaceholder: 'What happened exactly? How can we reproduce it? Every detail helps 🔍',
      sendReport: '📨 Send Report',
      thankYou: '🎉 You\'re amazing!',
      thankYouMessage: 'Your feedback is pure gold. Every opinion brings us closer to building something extraordinary TOGETHER.',
      sendAnother: '✨ Send another feedback',
      impactMessage: '💪 Your voice has real impact',
    },
  };

  const text = t[language];

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#8b5cf6', '#ec4899']
    });
  };

  const handleSubmitFeedback = async () => {
    if (!section || rating === 0) return;

    await submitFeedback.mutateAsync({
      section,
      rating,
      ease_of_use: easeOfUse || undefined,
      usefulness: usefulness || undefined,
      design_rating: designRating || undefined,
      comment: comment || undefined,
      suggestions: suggestions || undefined,
      would_recommend: wouldRecommend ?? undefined,
    });

    triggerConfetti();
    setFeedbackSent(true);
  };

  const handleSubmitBugReport = async () => {
    if (!bugTitle || !bugDescription) return;

    await submitBugReport.mutateAsync({
      report_type: reportType,
      severity,
      title: bugTitle,
      description: bugDescription,
      page_path: window.location.pathname,
      screenshot_url: bugScreenshot || undefined,
    });

    triggerConfetti();
    setBugSent(true);
  };

  const resetFeedback = () => {
    setSection('');
    setRating(0);
    setEaseOfUse(0);
    setUsefulness(0);
    setDesignRating(0);
    setComment('');
    setSuggestions('');
    setWouldRecommend(null);
    setFeedbackSent(false);
  };

  const resetBugReport = () => {
    setReportType('bug');
    setSeverity('medium');
    setBugTitle('');
    setBugDescription('');
    setBugScreenshot('');
    setBugSent(false);
  };

  const ThankYouCard = ({ onReset }: { onReset: () => void }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', duration: 0.5 }}
      className="text-center py-12 space-y-6"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rounded-full flex items-center justify-center shadow-xl"
      >
        <PartyPopper className="h-12 w-12 text-white" />
      </motion.div>
      
      <div className="space-y-3">
        <motion.h3 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent"
        >
          {text.thankYou}
        </motion.h3>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground max-w-md mx-auto"
        >
          {text.thankYouMessage}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-600"
      >
        <Trophy className="h-5 w-5" />
        {text.impactMessage}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Button 
          onClick={onReset} 
          variant="outline"
          className="gap-2 hover:bg-primary/10"
        >
          <Sparkles className="h-4 w-4" />
          {text.sendAnother}
        </Button>
      </motion.div>
    </motion.div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* System Alerts Banner */}
        <SystemAlertsBanner />
        
        {/* Missions Quick Actions Card */}
        <div className="mb-6">
          <MissionsCard />
        </div>
        
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          {/* Logo with Effects */}
          <motion.div 
            className="flex justify-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <PhoenixLogo variant="sidebar" state="auto" showEffects={true} />
          </motion.div>

          {/* Founding Member Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Badge className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black shadow-lg mb-4">
              {text.betaBadge}
            </Badge>
          </motion.div>

          <motion.div 
            className="flex items-center justify-center gap-3 mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Rocket className="h-8 w-8 text-primary animate-bounce" />
            <h1 className="text-4xl font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              {text.title}
            </h1>
            <Crown className="h-8 w-8 text-amber-500" />
          </motion.div>
          
          <motion.p 
            className="text-lg text-muted-foreground flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {userName && <span className="font-semibold text-foreground">{userName},</span>}
            {text.subtitle}
            <Sparkles className="h-5 w-5 text-amber-500" />
          </motion.p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
            <Tabs defaultValue="feedback" className="w-full">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50">
                <TabsTrigger 
                  value="feedback" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white font-semibold"
                >
                  <Star className="h-4 w-4" />
                  {text.feedbackTab}
                </TabsTrigger>
                <TabsTrigger 
                  value="bug" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white font-semibold"
                >
                  <Bug className="h-4 w-4" />
                  {text.bugTab}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="feedback" className="p-6">
                <AnimatePresence mode="wait">
                  {feedbackSent ? (
                    <ThankYouCard key="thanks" onReset={resetFeedback} />
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-8"
                    >
                      {/* Section selector */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          🎯 {text.selectSection}
                        </Label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {APP_SECTIONS.map((s, index) => (
                            <motion.button
                              key={s.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.03 }}
                              onClick={() => setSection(s.id)}
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              className={`p-3 rounded-xl border-2 text-center transition-all ${
                                section === s.id
                                  ? `border-transparent bg-gradient-to-br ${s.color} text-white shadow-lg`
                                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
                              }`}
                            >
                              <div className="text-2xl mb-1">{s.emoji}</div>
                              <div className="text-xs font-medium truncate">
                                {s.label[language]}
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      <AnimatePresence>
                        {section && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-8"
                          >
                            {/* Star ratings */}
                            <div className="grid gap-6 sm:grid-cols-2">
                              <StarRating
                                value={rating}
                                onChange={setRating}
                                label={text.overallRating}
                                emoji="🌟"
                              />
                              <StarRating
                                value={easeOfUse}
                                onChange={setEaseOfUse}
                                label={text.easeOfUse}
                                emoji="🎮"
                              />
                              <StarRating
                                value={usefulness}
                                onChange={setUsefulness}
                                label={text.usefulness}
                                emoji="🎯"
                              />
                              <StarRating
                                value={designRating}
                                onChange={setDesignRating}
                                label={text.design}
                                emoji="🎨"
                              />
                            </div>

                            {/* Comments */}
                            <div className="space-y-2">
                              <Label className="text-base font-semibold">{text.comments}</Label>
                              <Textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={text.commentsPlaceholder}
                                rows={3}
                                className="resize-none focus:ring-2 focus:ring-primary/20"
                              />
                            </div>

                            {/* Suggestions */}
                            <div className="space-y-2">
                              <Label className="text-base font-semibold">{text.suggestions}</Label>
                              <Textarea
                                value={suggestions}
                                onChange={(e) => setSuggestions(e.target.value)}
                                placeholder={text.suggestionsPlaceholder}
                                rows={2}
                                className="resize-none focus:ring-2 focus:ring-amber-500/20"
                              />
                            </div>

                            {/* Would recommend */}
                            <div className="space-y-3">
                              <Label className="text-base font-semibold">❤️ {text.recommend}</Label>
                              <div className="flex gap-4">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setWouldRecommend(true)}
                                  className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                    wouldRecommend === true
                                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                                      : 'border-border hover:border-emerald-300'
                                  }`}
                                >
                                  <ThumbsUp className={`h-8 w-8 ${wouldRecommend === true ? 'fill-current' : ''}`} />
                                  <span className="font-semibold">{text.yes}</span>
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setWouldRecommend(false)}
                                  className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                    wouldRecommend === false
                                      ? 'border-rose-500 bg-rose-500/10 text-rose-600'
                                      : 'border-border hover:border-rose-300'
                                  }`}
                                >
                                  <ThumbsDown className={`h-8 w-8 ${wouldRecommend === false ? 'fill-current' : ''}`} />
                                  <span className="font-semibold">{text.no}</span>
                                </motion.button>
                              </div>
                            </div>

                            {/* Submit */}
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button
                                onClick={handleSubmitFeedback}
                                disabled={rating === 0 || submitFeedback.isPending}
                                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 shadow-lg"
                                size="lg"
                              >
                                <Rocket className="h-5 w-5 mr-2" />
                                {text.sendFeedback}
                                <ArrowRight className="h-5 w-5 ml-2" />
                              </Button>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="bug" className="p-6">
                <AnimatePresence mode="wait">
                  {bugSent ? (
                    <ThankYouCard key="thanks" onReset={resetBugReport} />
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      {/* Encouragement message */}
                      <div className="p-4 rounded-xl bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-rose-500/10 border border-rose-200 dark:border-rose-800">
                        <p className="text-sm text-center">
                          🔍 ¡Eres un detective del código! Cada bug que reportas hace a EvoFinz más fuerte 💪
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="font-semibold">{text.reportType}</Label>
                          <Select value={reportType} onValueChange={setReportType}>
                            <SelectTrigger className="h-12">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bug">
                                <span className="flex items-center gap-2">
                                  🐛 {language === 'es' ? 'Bug / Error' : 'Bug / Error'}
                                </span>
                              </SelectItem>
                              <SelectItem value="suggestion">
                                <span className="flex items-center gap-2">
                                  💡 {language === 'es' ? 'Sugerencia' : 'Suggestion'}
                                </span>
                              </SelectItem>
                              <SelectItem value="question">
                                <span className="flex items-center gap-2">
                                  ❓ {language === 'es' ? 'Pregunta' : 'Question'}
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="font-semibold">{text.severity}</Label>
                          <Select value={severity} onValueChange={setSeverity}>
                            <SelectTrigger className="h-12">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">{text.low}</SelectItem>
                              <SelectItem value="medium">{text.medium}</SelectItem>
                              <SelectItem value="high">{text.high}</SelectItem>
                              <SelectItem value="critical">{text.critical}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-semibold">{text.bugTitle}</Label>
                        <Input
                          value={bugTitle}
                          onChange={(e) => setBugTitle(e.target.value)}
                          placeholder={text.bugTitlePlaceholder}
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="font-semibold">{text.bugDescription}</Label>
                        <Textarea
                          value={bugDescription}
                          onChange={(e) => setBugDescription(e.target.value)}
                          placeholder={text.bugDescriptionPlaceholder}
                          rows={5}
                          className="resize-none"
                        />
                      </div>

                      {/* Screenshot Upload */}
                      <ScreenshotUpload 
                        onUpload={setBugScreenshot}
                        currentUrl={bugScreenshot}
                      />

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={handleSubmitBugReport}
                          disabled={!bugTitle || !bugDescription || submitBugReport.isPending}
                          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 hover:from-rose-600 hover:via-pink-600 hover:to-rose-600 shadow-lg"
                          size="lg"
                        >
                          <Zap className="h-5 w-5 mr-2" />
                          {text.sendReport}
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>

        {/* Bottom motivation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-8 p-4"
        >
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Gift className="h-4 w-4 text-amber-500" />
            {language === 'es' 
              ? 'Como Founding Member, tu feedback tiene prioridad especial' 
              : 'As a Founding Member, your feedback has special priority'}
            <Crown className="h-4 w-4 text-amber-500" />
          </p>
        </motion.div>

        {/* Visual Progress Chart */}
        <div className="mt-8">
          <Card className="overflow-hidden border-2 border-primary/20 relative">
            <FloatingParticles count={10} className="opacity-30" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                📊 {language === 'es' ? 'Tu Progreso Visual' : 'Your Visual Progress'}
              </CardTitle>
              <CardDescription>
                {language === 'es' 
                  ? 'Visualiza tu camino hacia las recompensas' 
                  : 'Visualize your path to rewards'}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <ProgressChart />
            </CardContent>
          </Card>
        </div>

        {/* Gamification Quick Stats */}
        <div className="mt-8">
          <BetaGamificationCard />
        </div>

        {/* Complete Roadmap Guide */}
        <div className="mt-8">
          <BetaRoadmapCard />
        </div>

        {/* Referral Card */}
        <div className="mt-8">
          <ReferralCard />
        </div>
      </div>
    </Layout>
  );
};

export default BetaFeedback;
