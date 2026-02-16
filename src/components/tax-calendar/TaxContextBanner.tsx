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
  BookOpen, Calendar, HelpCircle, CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { es, enCA } from "date-fns/locale";

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
    const labels: { icon: React.ReactNode; label: string; color: string }[] = [];
    if (workTypes.includes('employee')) {
      labels.push({ 
        icon: <User className="h-3 w-3" />, 
        label: isChile ? (isEs ? 'Dependiente' : 'Employee') : (isEs ? 'Empleado' : 'Employee'),
        color: 'bg-blue-500/10 text-blue-700 border-blue-500/30'
      });
    }
    if (workTypes.includes('contractor')) {
      labels.push({ 
        icon: <Briefcase className="h-3 w-3" />, 
        label: isChile ? (isEs ? 'Independiente' : 'Self-Employed') : (isEs ? 'Autónomo' : 'Self-Employed'),
        color: 'bg-amber-500/10 text-amber-700 border-amber-500/30'
      });
    }
    if (workTypes.includes('corporation')) {
      labels.push({ 
        icon: <Building2 className="h-3 w-3" />, 
        label: isChile ? (isEs ? 'Empresa' : 'Corporation') : (isEs ? 'Corporación' : 'Corporation'),
        color: 'bg-purple-500/10 text-purple-700 border-purple-500/30'
      });
    }
    return labels;
  }, [workTypes, isChile, isEs]);

  // Build context summary
  const contextItems = useMemo(() => {
    const items: { label: string; value: string; status: 'ok' | 'warning' | 'unknown' }[] = [];

    // Business name
    if (profile?.business_name) {
      items.push({ label: isEs ? 'Negocio' : 'Business', value: profile.business_name, status: 'ok' });
    }

    // Business start date
    if (profile?.business_start_date) {
      items.push({ 
        label: isEs ? 'Inicio actividad' : 'Activity start', 
        value: format(new Date(profile.business_start_date), 'MMMM yyyy', { locale }),
        status: 'ok'
      });
    } else if (workTypes.includes('contractor') || workTypes.includes('corporation')) {
      items.push({ 
        label: isEs ? 'Inicio actividad' : 'Activity start', 
        value: isEs ? 'Sin definir' : 'Not set',
        status: 'warning'
      });
    }

    // Fiscal year end
    if (workTypes.includes('corporation')) {
      if (profile?.fiscal_year_end) {
        items.push({
          label: isEs ? 'Fin año fiscal' : 'Fiscal year end',
          value: format(new Date(profile.fiscal_year_end), 'MMMM d', { locale }),
          status: 'ok'
        });
      } else if (!isChile) {
        items.push({
          label: isEs ? 'Fin año fiscal' : 'Fiscal year end',
          value: isEs ? 'Sin definir' : 'Not set',
          status: 'warning'
        });
      }
    }

    // GST/HST or Tax regime
    if (workTypes.includes('contractor') || workTypes.includes('corporation')) {
      if (isChile) {
        items.push({
          label: 'Régimen',
          value: profile?.tax_regime || (isEs ? 'Sin definir' : 'Not set'),
          status: profile?.tax_regime ? 'ok' : 'warning'
        });
      } else {
        items.push({
          label: 'GST/HST',
          value: profile?.gst_hst_registered ? (isEs ? 'Registrado' : 'Registered') : (isEs ? 'No registrado' : 'Not registered'),
          status: 'ok'
        });
      }
    }

    return items;
  }, [profile, workTypes, isChile, isEs, locale]);

  // Knowledge gaps
  const gaps = (assessment?.knowledge_gaps as string[] | undefined) || [];
  const hasGaps = gaps.length > 0;
  const knowledgeLevel = assessment?.general_tax_knowledge || 0;

  if (workTypes.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
      <CardContent className="py-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <CountryFlag code={country} size="sm" />
            <span className="font-semibold text-sm">
              {profile?.full_name || (isEs ? 'Tu perfil fiscal' : 'Your tax profile')}
            </span>
            <span className="text-muted-foreground">—</span>
            {workTypeLabels.map((wt, i) => (
              <Badge key={i} variant="outline" className={`text-xs ${wt.color}`}>
                {wt.icon}
                <span className="ml-1">{wt.label}</span>
              </Badge>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={onOpenQuiz} className="text-xs">
            <BookOpen className="h-3 w-3 mr-1" />
            {assessment?.completed_at 
              ? (isEs ? 'Actualizar evaluación' : 'Update assessment')
              : (isEs ? 'Evaluar conocimiento' : 'Assess knowledge')
            }
          </Button>
        </div>

        {/* Context items */}
        <div className="flex flex-wrap gap-3 text-xs">
          {contextItems.map((item, i) => (
            <div key={i} className="flex items-center gap-1">
              {item.status === 'ok' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
              {item.status === 'warning' && <AlertTriangle className="h-3 w-3 text-amber-500" />}
              {item.status === 'unknown' && <HelpCircle className="h-3 w-3 text-muted-foreground" />}
              <span className="text-muted-foreground">{item.label}:</span>
              <span className={`font-medium ${item.status === 'warning' ? 'text-amber-500' : ''}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Knowledge gaps alert */}
        {hasGaps && (
          <Alert className="bg-amber-500/5 border-amber-500/20 py-2">
            <Info className="h-3 w-3 text-amber-500" />
            <AlertDescription className="text-xs">
              {isEs 
                ? `La app está adaptada a tu nivel de conocimiento (${['', 'Principiante', 'Básico', 'Intermedio', 'Avanzado', 'Experto'][knowledgeLevel] || 'Principiante'}). Las fechas y obligaciones mostradas son las que aplican a tu situación específica.`
                : `The app is adapted to your knowledge level (${['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'][knowledgeLevel] || 'Beginner'}). The dates and obligations shown are those that apply to your specific situation.`
              }
              {contextItems.some(i => i.status === 'warning') && (
                <span className="font-medium ml-1">
                  {isEs ? '⚠️ Hay datos sin definir que pueden afectar la precisión.' : '⚠️ Some undefined data may affect accuracy.'}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* No assessment yet */}
        {!assessment?.completed_at && (
          <Alert className="bg-primary/5 border-primary/20 py-2">
            <BookOpen className="h-3 w-3 text-primary" />
            <AlertDescription className="text-xs">
              {isEs 
                ? '¿La información fiscal te parece correcta? Completa la evaluación de conocimiento para que personalicemos mejor tu experiencia.'
                : 'Does the tax information look correct? Complete the knowledge assessment so we can better personalize your experience.'
              }
              <Button variant="link" size="sm" className="h-auto p-0 ml-1 text-xs" onClick={onOpenQuiz}>
                {isEs ? 'Comenzar →' : 'Start →'}
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
