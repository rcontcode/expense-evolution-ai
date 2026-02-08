import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Sparkles, Heart, Briefcase, Palette, Target, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLifeProfile, getPendingSections, calculateProfileCompletion, LifeProfileSection } from '@/hooks/data/useLifeProfile';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ProfileCompletionNudgeProps {
  onStartSection?: (section: LifeProfileSection) => void;
  dismissable?: boolean;
  compact?: boolean;
}

const SECTION_CONFIG: Record<LifeProfileSection, {
  icon: React.ElementType;
  label: { es: string; en: string };
  description: { es: string; en: string };
  benefit: { es: string; en: string };
  color: string;
}> = {
  family: {
    icon: Heart,
    label: { es: 'Familia', en: 'Family' },
    description: { es: 'Estado civil, hijos, dependientes', en: 'Relationship, children, dependents' },
    benefit: { es: 'Consejos adaptados a tu situación familiar', en: 'Advice adapted to your family situation' },
    color: 'text-pink-500',
  },
  work: {
    icon: Briefcase,
    label: { es: 'Trabajo', en: 'Work' },
    description: { es: 'Empleo, industria, metas de carrera', en: 'Employment, industry, career goals' },
    benefit: { es: 'Estrategias fiscales según tu tipo de trabajo', en: 'Tax strategies based on your work type' },
    color: 'text-blue-500',
  },
  lifestyle: {
    icon: Palette,
    label: { es: 'Estilo de Vida', en: 'Lifestyle' },
    description: { es: 'Hobbies, deportes, pasiones', en: 'Hobbies, sports, passions' },
    benefit: { es: 'Motivación personalizada usando tus intereses', en: 'Personalized motivation using your interests' },
    color: 'text-purple-500',
  },
  dreams: {
    icon: Target,
    label: { es: 'Sueños', en: 'Dreams' },
    description: { es: 'Metas de vida, bucket list, motivaciones', en: 'Life goals, bucket list, motivations' },
    benefit: { es: 'Conectar tus finanzas con tus sueños', en: 'Connect your finances to your dreams' },
    color: 'text-amber-500',
  },
  psychology: {
    icon: Brain,
    label: { es: 'Psicología', en: 'Psychology' },
    description: { es: 'Relación con el dinero, miedos', en: 'Relationship with money, fears' },
    benefit: { es: 'Superar bloqueos financieros mentales', en: 'Overcome mental financial blocks' },
    color: 'text-green-500',
  },
};

export function ProfileCompletionNudge({ 
  onStartSection, 
  dismissable = true,
  compact = false 
}: ProfileCompletionNudgeProps) {
  const { language } = useLanguage();
  const lang = language as 'es' | 'en';
  const { data: profile, isLoading } = useLifeProfile();
  const [dismissed, setDismissed] = useState(false);
  
  if (isLoading || dismissed) return null;
  
  const pendingSections = getPendingSections(profile);
  const completion = calculateProfileCompletion(profile);
  
  // Don't show if profile is complete
  if (pendingSections.length === 0) return null;
  
  // Pick the most valuable section to suggest first
  const suggestedSection = pendingSections[0];
  const config = SECTION_CONFIG[suggestedSection];
  const Icon = config.icon;
  
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20"
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-full bg-background", config.color)}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {lang === 'es' ? 'Completa tu perfil' : 'Complete your profile'}
            </p>
            <p className="text-xs text-muted-foreground">
              {config.benefit[lang]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onStartSection?.(suggestedSection)}
            className="gap-1"
          >
            {config.label[lang]}
            <ChevronRight className="h-3 w-3" />
          </Button>
          {dismissable && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>
    );
  }
  
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {lang === 'es' ? '¡Personaliza tu experiencia!' : 'Personalize your experience!'}
            </CardTitle>
          </div>
          {dismissable && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          {lang === 'es' 
            ? 'Cuéntame más sobre ti para darte consejos ultra-personalizados'
            : 'Tell me more about yourself for ultra-personalized advice'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {lang === 'es' ? 'Perfil completado' : 'Profile completed'}
            </span>
            <span className="font-medium text-primary">{completion}%</span>
          </div>
          <Progress value={completion} className="h-2" />
        </div>
        
        {/* Section Cards */}
        <div className="grid gap-2">
          {pendingSections.slice(0, 3).map((section) => {
            const sectionConfig = SECTION_CONFIG[section];
            const SectionIcon = sectionConfig.icon;
            
            return (
              <motion.button
                key={section}
                onClick={() => onStartSection?.(section)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                  "hover:border-primary hover:bg-primary/5",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                )}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className={cn("p-2 rounded-full bg-muted", sectionConfig.color)}>
                  <SectionIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{sectionConfig.label[lang]}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {sectionConfig.description[lang]}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </motion.button>
            );
          })}
        </div>
        
        {pendingSections.length > 3 && (
          <p className="text-xs text-center text-muted-foreground">
            +{pendingSections.length - 3} {lang === 'es' ? 'secciones más' : 'more sections'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
