import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  Send, 
  CheckCircle2,
  Sparkles,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBetaFeedback } from '@/hooks/data/useBetaFeedback';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';

const APP_SECTIONS = [
  { id: 'dashboard', label: { es: 'Dashboard', en: 'Dashboard' }, emoji: '📊' },
  { id: 'expenses', label: { es: 'Gastos', en: 'Expenses' }, emoji: '💸' },
  { id: 'income', label: { es: 'Ingresos', en: 'Income' }, emoji: '💰' },
  { id: 'quick_capture', label: { es: 'Captura Rápida', en: 'Quick Capture' }, emoji: '📷' },
  { id: 'voice_assistant', label: { es: 'Asistente de Voz', en: 'Voice Assistant' }, emoji: '🎤' },
  { id: 'clients', label: { es: 'Clientes', en: 'Clients' }, emoji: '👥' },
  { id: 'projects', label: { es: 'Proyectos', en: 'Projects' }, emoji: '📁' },
  { id: 'contracts', label: { es: 'Contratos', en: 'Contracts' }, emoji: '📄' },
  { id: 'mileage', label: { es: 'Kilometraje', en: 'Mileage' }, emoji: '🚗' },
  { id: 'net_worth', label: { es: 'Patrimonio', en: 'Net Worth' }, emoji: '🏦' },
  { id: 'mentorship', label: { es: 'Mentoría', en: 'Mentorship' }, emoji: '📚' },
  { id: 'tax_calendar', label: { es: 'Calendario Fiscal', en: 'Tax Calendar' }, emoji: '📅' },
  { id: 'banking', label: { es: 'Bancos', en: 'Banking' }, emoji: '🏧' },
  { id: 'settings', label: { es: 'Configuración', en: 'Settings' }, emoji: '⚙️' },
  { id: 'general', label: { es: 'General / Otro', en: 'General / Other' }, emoji: '🌟' },
];

const StarRating = ({ 
  value, 
  onChange, 
  label 
}: { 
  value: number; 
  onChange: (v: number) => void; 
  label: string;
}) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium">{label}</Label>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-1 transition-transform hover:scale-110"
        >
          <Star
            className={`h-8 w-8 ${
              star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
    </div>
  </div>
);

const BetaFeedback = () => {
  const { language } = useLanguage();
  const { submitFeedback, submitBugReport } = useBetaFeedback();
  
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
  const [bugSent, setBugSent] = useState(false);

  const t = {
    es: {
      title: 'Centro de Feedback Beta',
      subtitle: 'Tu opinión es oro para nosotros ✨',
      feedbackTab: 'Evaluar Sección',
      bugTab: 'Reportar Bug',
      suggestionTab: 'Sugerencia',
      selectSection: 'Selecciona una sección',
      overallRating: '¿Cómo calificas esta sección en general?',
      easeOfUse: '¿Qué tan fácil es de usar?',
      usefulness: '¿Qué tan útil te parece?',
      design: '¿Qué te parece el diseño?',
      comments: 'Comentarios (opcional)',
      commentsPlaceholder: '¿Qué te gustó? ¿Qué no funcionó bien?',
      suggestions: 'Sugerencias de mejora (opcional)',
      suggestionsPlaceholder: '¿Cómo podríamos mejorar esta sección?',
      recommend: '¿Recomendarías EvoFinz a un amigo?',
      yes: 'Sí',
      no: 'No',
      sendFeedback: 'Enviar Feedback',
      reportType: 'Tipo de reporte',
      bug: 'Bug / Error',
      suggestion: 'Sugerencia',
      question: 'Pregunta',
      severity: 'Severidad',
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      critical: 'Crítica',
      bugTitle: 'Título',
      bugTitlePlaceholder: 'Resumen breve del problema',
      bugDescription: 'Descripción',
      bugDescriptionPlaceholder: '¿Qué pasó? ¿Qué esperabas que pasara? ¿Cómo reproducirlo?',
      sendReport: 'Enviar Reporte',
      thankYou: '¡Gracias!',
      thankYouMessage: 'Tu feedback ha sido enviado. Nos ayuda muchísimo a mejorar.',
      sendAnother: 'Enviar otro',
    },
    en: {
      title: 'Beta Feedback Center',
      subtitle: 'Your opinion is gold to us ✨',
      feedbackTab: 'Rate Section',
      bugTab: 'Report Bug',
      suggestionTab: 'Suggestion',
      selectSection: 'Select a section',
      overallRating: 'How do you rate this section overall?',
      easeOfUse: 'How easy is it to use?',
      usefulness: 'How useful is it?',
      design: 'How do you like the design?',
      comments: 'Comments (optional)',
      commentsPlaceholder: 'What did you like? What didn\'t work well?',
      suggestions: 'Improvement suggestions (optional)',
      suggestionsPlaceholder: 'How could we improve this section?',
      recommend: 'Would you recommend EvoFinz to a friend?',
      yes: 'Yes',
      no: 'No',
      sendFeedback: 'Send Feedback',
      reportType: 'Report type',
      bug: 'Bug / Error',
      suggestion: 'Suggestion',
      question: 'Question',
      severity: 'Severity',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical',
      bugTitle: 'Title',
      bugTitlePlaceholder: 'Brief summary of the issue',
      bugDescription: 'Description',
      bugDescriptionPlaceholder: 'What happened? What did you expect? How to reproduce?',
      sendReport: 'Send Report',
      thankYou: 'Thank you!',
      thankYouMessage: 'Your feedback has been sent. It helps us improve a lot.',
      sendAnother: 'Send another',
    },
  };

  const text = t[language];

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
    });

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
    setBugSent(false);
  };

  const ThankYouCard = ({ onReset }: { onReset: () => void }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12 space-y-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center"
      >
        <CheckCircle2 className="h-10 w-10 text-white" />
      </motion.div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold">{text.thankYou}</h3>
        <p className="text-muted-foreground">{text.thankYouMessage}</p>
      </div>
      <Button onClick={onReset} variant="outline">
        {text.sendAnother}
      </Button>
    </motion.div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              {text.title}
            </h1>
            <Heart className="h-6 w-6 text-rose-500" />
          </div>
          <p className="text-muted-foreground">{text.subtitle}</p>
        </motion.div>

        <Card>
          <Tabs defaultValue="feedback" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                {text.feedbackTab}
              </TabsTrigger>
              <TabsTrigger value="bug" className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                {text.bugTab}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feedback" className="p-6">
              {feedbackSent ? (
                <ThankYouCard onReset={resetFeedback} />
              ) : (
                <div className="space-y-6">
                  {/* Section selector */}
                  <div className="space-y-2">
                    <Label>{text.selectSection}</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {APP_SECTIONS.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSection(s.id)}
                          className={`p-3 rounded-lg border text-center transition-all hover:scale-105 ${
                            section === s.id
                              ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-2xl mb-1">{s.emoji}</div>
                          <div className="text-xs font-medium truncate">
                            {s.label[language]}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {section && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-6"
                    >
                      {/* Star ratings */}
                      <div className="grid gap-6 sm:grid-cols-2">
                        <StarRating
                          value={rating}
                          onChange={setRating}
                          label={text.overallRating}
                        />
                        <StarRating
                          value={easeOfUse}
                          onChange={setEaseOfUse}
                          label={text.easeOfUse}
                        />
                        <StarRating
                          value={usefulness}
                          onChange={setUsefulness}
                          label={text.usefulness}
                        />
                        <StarRating
                          value={designRating}
                          onChange={setDesignRating}
                          label={text.design}
                        />
                      </div>

                      {/* Comments */}
                      <div className="space-y-2">
                        <Label>{text.comments}</Label>
                        <Textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder={text.commentsPlaceholder}
                          rows={3}
                        />
                      </div>

                      {/* Suggestions */}
                      <div className="space-y-2">
                        <Label>{text.suggestions}</Label>
                        <Textarea
                          value={suggestions}
                          onChange={(e) => setSuggestions(e.target.value)}
                          placeholder={text.suggestionsPlaceholder}
                          rows={2}
                        />
                      </div>

                      {/* Would recommend */}
                      <div className="space-y-2">
                        <Label>{text.recommend}</Label>
                        <RadioGroup
                          value={wouldRecommend === null ? '' : wouldRecommend ? 'yes' : 'no'}
                          onValueChange={(v) => setWouldRecommend(v === 'yes')}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="yes" />
                            <Label htmlFor="yes">{text.yes} 👍</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="no" />
                            <Label htmlFor="no">{text.no} 👎</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Submit */}
                      <Button
                        onClick={handleSubmitFeedback}
                        disabled={rating === 0 || submitFeedback.isPending}
                        className="w-full"
                        size="lg"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {text.sendFeedback}
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="bug" className="p-6">
              {bugSent ? (
                <ThankYouCard onReset={resetBugReport} />
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{text.reportType}</Label>
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bug">
                            <span className="flex items-center gap-2">
                              <Bug className="h-4 w-4" /> {text.bug}
                            </span>
                          </SelectItem>
                          <SelectItem value="suggestion">
                            <span className="flex items-center gap-2">
                              <Lightbulb className="h-4 w-4" /> {text.suggestion}
                            </span>
                          </SelectItem>
                          <SelectItem value="question">
                            <span className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" /> {text.question}
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{text.severity}</Label>
                      <Select value={severity} onValueChange={setSeverity}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">🟢 {text.low}</SelectItem>
                          <SelectItem value="medium">🟡 {text.medium}</SelectItem>
                          <SelectItem value="high">🟠 {text.high}</SelectItem>
                          <SelectItem value="critical">🔴 {text.critical}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{text.bugTitle}</Label>
                    <Input
                      value={bugTitle}
                      onChange={(e) => setBugTitle(e.target.value)}
                      placeholder={text.bugTitlePlaceholder}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{text.bugDescription}</Label>
                    <Textarea
                      value={bugDescription}
                      onChange={(e) => setBugDescription(e.target.value)}
                      placeholder={text.bugDescriptionPlaceholder}
                      rows={5}
                    />
                  </div>

                  <Button
                    onClick={handleSubmitBugReport}
                    disabled={!bugTitle || !bugDescription || submitBugReport.isPending}
                    className="w-full"
                    size="lg"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {text.sendReport}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </Layout>
  );
};

export default BetaFeedback;
