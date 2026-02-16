import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/hooks/data/useProfile";
import { useTaxKnowledge } from "@/hooks/data/useTaxKnowledge";
import { CountryFlag } from "@/components/ui/country-flag";
import { 
  User, Building2, Briefcase, AlertTriangle, Info, 
  BookOpen, HelpCircle, CheckCircle2, Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { es, enCA } from "date-fns/locale";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TaxContextBannerProps {
  country: string;
  onOpenQuiz: () => void;
}

export function TaxContextBanner({ country, onOpenQuiz }: TaxContextBannerProps) {
  const { language } = useLanguage();
  const { data: profile } = useProfile();
  const { data: assessment } = useTaxKnowledge();
  const isEs = language === 'es';
  const locale = isEs ? es : enCA;
  const isChile = country === 'CL';

  const workTypes = profile?.work_types || [];
  const workTypeLabels = useMemo(() => {
    const labels: { icon: React.ReactNode; emoji: string; label: string; color: string }[] = [];
    if (workTypes.includes('employee')) {
      labels.push({ 
        icon: <User className="h-3 w-3" />, 
        emoji: '👤',
        label: isChile ? (isEs ? 'Dependiente' : 'Employee') : (isEs ? 'Empleado' : 'Employee'),
        color: 'bg-blue-500/10 text-blue-700 border-blue-500/30'
      });
    }
    if (workTypes.includes('contractor')) {
      labels.push({ 
        icon: <Briefcase className="h-3 w-3" />, 
        emoji: '💼',
        label: isChile ? (isEs ? 'Independiente' : 'Self-Employed') : (isEs ? 'Sole Proprietor' : 'Sole Proprietor'),
        color: 'bg-amber-500/10 text-amber-700 border-amber-500/30'
      });
    }
    if (workTypes.includes('corporation')) {
      labels.push({ 
        icon: <Building2 className="h-3 w-3" />, 
        emoji: '🏛️',
        label: isChile ? (isEs ? 'Empresa' : 'Corporation') : (isEs ? 'Corporación' : 'Corporation'),
        color: 'bg-purple-500/10 text-purple-700 border-purple-500/30'
      });
    }
    return labels;
  }, [workTypes, isChile, isEs]);

  const contextItems = useMemo(() => {
    const items: { emoji: string; label: string; value: string; status: 'ok' | 'warning' | 'unknown' }[] = [];

    if (profile?.business_name) {
      items.push({ emoji: '🏢', label: isEs ? 'Negocio' : 'Business', value: profile.business_name, status: 'ok' });
    }

    if (profile?.business_start_date) {
      items.push({ 
        emoji: '📅', label: isEs ? 'Inicio actividad' : 'Activity start', 
        value: format(new Date(profile.business_start_date), 'MMMM yyyy', { locale }),
        status: 'ok'
      });
    } else if (workTypes.includes('contractor') || workTypes.includes('corporation')) {
      items.push({ 
        emoji: '📅', label: isEs ? 'Inicio actividad' : 'Activity start', 
        value: isEs ? '⚠️ Sin definir' : '⚠️ Not set',
        status: 'warning'
      });
    }

    if (workTypes.includes('corporation')) {
      if (profile?.fiscal_year_end) {
        items.push({
          emoji: '🗓️', label: isEs ? 'Fin año fiscal' : 'Fiscal year end',
          value: format(new Date(profile.fiscal_year_end), 'MMMM d', { locale }),
          status: 'ok'
        });
      } else if (!isChile) {
        items.push({
          emoji: '🗓️', label: isEs ? 'Fin año fiscal' : 'Fiscal year end',
          value: isEs ? '⚠️ Sin definir' : '⚠️ Not set',
          status: 'warning'
        });
      }
    }

    if (workTypes.includes('contractor') || workTypes.includes('corporation')) {
      if (isChile) {
        items.push({
          emoji: '📋', label: 'Régimen',
          value: profile?.tax_regime ? `✅ ${profile.tax_regime}` : (isEs ? '⚠️ Sin definir' : '⚠️ Not set'),
          status: profile?.tax_regime ? 'ok' : 'warning'
        });
      } else {
        items.push({
          emoji: '💲', label: 'GST/HST',
          value: profile?.gst_hst_registered ? (isEs ? '✅ Registrado' : '✅ Registered') : (isEs ? '❌ No registrado' : '❌ Not registered'),
          status: 'ok'
        });
      }
    }

    return items;
  }, [profile, workTypes, isChile, isEs, locale]);

  const gaps = (assessment?.knowledge_gaps as string[] | undefined) || [];
  const hasGaps = gaps.length > 0;
  const knowledgeLevel = assessment?.general_tax_knowledge || 0;
  const levelLabels = ['', '😵 Principiante', '😟 Básico', '🤔 Intermedio', '😊 Avanzado', '🧠 Experto'];
  const levelLabelsEn = ['', '😵 Beginner', '😟 Basic', '🤔 Intermediate', '😊 Advanced', '🧠 Expert'];

  if (workTypes.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/8 via-accent/5 to-primary/8 shadow-lg shadow-primary/5 overflow-hidden relative">
      {/* Subtle glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <CardContent className="py-4 space-y-3 relative">
        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <CountryFlag code={country} size="sm" />
            <span className="font-bold text-sm flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              {profile?.full_name || (isEs ? 'Tu perfil fiscal' : 'Your tax profile')}
            </span>
            <span className="text-muted-foreground">—</span>
            {workTypeLabels.map((wt, i) => (
              <Badge key={i} variant="outline" className={cn("text-xs gap-1 font-semibold", wt.color)}>
                <span>{wt.emoji}</span>
                {wt.icon}
                <span>{wt.label}</span>
              </Badge>
            ))}
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpenQuiz} 
              className="text-xs gap-1.5 shadow-md hover:shadow-lg border-primary/20 bg-card/80 hover:-translate-y-0.5 transition-all"
            >
              <BookOpen className="h-3 w-3" />
              {assessment?.completed_at 
                ? (isEs ? '🔄 Actualizar evaluación' : '🔄 Update assessment')
                : (isEs ? '✨ Evaluar conocimiento' : '✨ Assess knowledge')
              }
            </Button>
          </motion.div>
        </div>

        {/* Context items */}
        <div className="flex flex-wrap gap-3 text-xs">
          {contextItems.map((item, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all",
                item.status === 'ok' 
                  ? "bg-card/50 border-border/50"
                  : "bg-amber-500/5 border-amber-500/20"
              )}
            >
              <span className="text-sm">{item.emoji}</span>
              {item.status === 'ok' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
              {item.status === 'warning' && <AlertTriangle className="h-3 w-3 text-amber-500 animate-pulse" />}
              <span className="text-muted-foreground">{item.label}:</span>
              <span className={cn("font-semibold", item.status === 'warning' && "text-amber-600")}>
                {item.value}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Knowledge gaps alert */}
        {hasGaps && (
          <Alert className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/20 py-2 shadow-sm">
            <Info className="h-3 w-3 text-amber-500" />
            <AlertDescription className="text-xs">
              🎯 {isEs 
                ? `Nivel: ${levelLabels[knowledgeLevel] || levelLabels[1]}. Las fechas y obligaciones mostradas aplican a tu situación específica.`
                : `Level: ${levelLabelsEn[knowledgeLevel] || levelLabelsEn[1]}. Dates and obligations shown apply to your specific situation.`
              }
              {contextItems.some(i => i.status === 'warning') && (
                <span className="font-semibold ml-1 text-amber-600">
                  ⚠️ {isEs ? 'Hay datos sin definir que pueden afectar la precisión.' : 'Some undefined data may affect accuracy.'}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* No assessment yet */}
        {!assessment?.completed_at && (
          <Alert className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 py-2 shadow-sm">
            <BookOpen className="h-3 w-3 text-primary animate-pulse" />
            <AlertDescription className="text-xs">
              🧭 {isEs 
                ? '¿La información fiscal te parece correcta? Completa la evaluación para personalizar tu experiencia.'
                : 'Does the tax information look correct? Complete the assessment to personalize your experience.'
              }
              <Button variant="link" size="sm" className="h-auto p-0 ml-1 text-xs font-bold" onClick={onOpenQuiz}>
                ✨ {isEs ? 'Comenzar →' : 'Start →'}
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
