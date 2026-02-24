import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, ChevronLeft, ChevronRight, ShieldCheck,
  FileText, Users, Receipt, ScanLine, Globe, BarChart3
} from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { usePageVisibility } from '@/hooks/usePageVisibility';

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  quote: string;
  rating: number;
  highlight: string;
  isVerified?: boolean;
}

interface UseCase {
  icon: typeof FileText;
  title: string;
  description: string;
  badge: string;
  color: string;
}

const getUseCases = (language: string): UseCase[] => [
  {
    icon: FileText,
    title: language === 'es' ? 'Freelancer en Canadá' : 'Freelancer in Canada',
    description: language === 'es' 
      ? 'Genera tu T2125 automáticamente con categorización inteligente de gastos según las reglas del CRA.'
      : 'Generate your T2125 automatically with smart expense categorization following CRA rules.',
    badge: 'T2125',
    color: 'from-cyan-500 to-blue-600'
  },
  {
    icon: Users,
    title: language === 'es' ? 'Consultor Multi-Cliente' : 'Multi-Client Consultant',
    description: language === 'es'
      ? 'Gestiona gastos por proyecto con reportes individuales por cliente y tracking de reembolsos.'
      : 'Manage expenses per project with individual client reports and reimbursement tracking.',
    badge: language === 'es' ? 'Multi-Proyecto' : 'Multi-Project',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    icon: Globe,
    title: language === 'es' ? 'Emprendedor en Chile' : 'Entrepreneur in Chile',
    description: language === 'es'
      ? 'Controla tu IVA y deducciones con reglas fiscales chilenas integradas y soporte multi-moneda.'
      : 'Control your VAT and deductions with integrated Chilean tax rules and multi-currency support.',
    badge: 'IVA/F29',
    color: 'from-violet-500 to-purple-600'
  },
  {
    icon: ScanLine,
    title: language === 'es' ? 'Profesional Independiente' : 'Independent Professional',
    description: language === 'es'
      ? 'Escanea recibos con OCR y categoriza gastos en segundos. De foto a registro contable al instante.'
      : 'Scan receipts with OCR and categorize expenses in seconds. From photo to accounting record instantly.',
    badge: 'OCR',
    color: 'from-orange-500 to-red-600'
  }
];

export function TestimonialsCarousel() {
  const { language } = useLanguage();
  const isVisible = usePageVisibility();
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch real published testimonials
  const { data: realTestimonials } = useQuery({
    queryKey: ['landing-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beta_feedback')
        .select('*')
        .eq('is_published_testimonial', true)
        .order('created_at', { ascending: false });

      if (error) return [];

      const userIds = [...new Set((data || []).map(f => f.user_id))];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return (data || []).map(f => ({
        name: (f as any).display_name_override || profileMap.get(f.user_id)?.full_name || 'Early User',
        role: language === 'es' ? 'Usuario Verificado • EvoFinz' : 'Verified User • EvoFinz',
        avatar: '',
        quote: f.comment || f.suggestions || '',
        rating: f.rating,
        highlight: language === 'es' ? 'Usuario Verificado' : 'Verified User',
        isVerified: true,
      })).filter(t => t.quote.length > 20) as Testimonial[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const hasRealTestimonials = realTestimonials && realTestimonials.length >= 3;
  const useCases = getUseCases(language);

  // Auto-rotation - pauses when tab hidden
  useEffect(() => {
    if (isPaused || !isVisible) return;
    const count = hasRealTestimonials ? realTestimonials.length : useCases.length;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % count);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, isVisible, hasRealTestimonials, realTestimonials?.length, useCases.length]);

  const itemCount = hasRealTestimonials ? realTestimonials!.length : useCases.length;
  const next = () => setCurrent((prev) => (prev + 1) % itemCount);
  const prev = () => setCurrent((prev) => (prev - 1 + itemCount) % itemCount);

  // If we have 3+ real testimonials, show them
  if (hasRealTestimonials) {
    const testimonials = realTestimonials!;
    return (
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              {language === 'es' ? 'Lo que dicen ' : 'What our '}
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                {language === 'es' ? 'nuestros usuarios' : 'users say'}
              </span>
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
            <div className="relative">
              <button onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/10"
                >
                  <div className="flex justify-center mb-6">
                    <span className="px-4 py-1.5 rounded-full text-sm font-medium border bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30">
                      <ShieldCheck className="w-4 h-4 inline mr-1" />
                      {testimonials[current]?.highlight}
                    </span>
                  </div>
                  <blockquote className="text-xl md:text-2xl text-white/90 text-center leading-relaxed mb-8 font-medium">
                    "{testimonials[current]?.quote}"
                  </blockquote>
                  <div className="flex justify-center gap-1 mb-6">
                    {Array.from({ length: testimonials[current]?.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center ring-2 ring-emerald-400/30 ring-offset-2 ring-offset-slate-800 mb-4">
                      <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-white">{testimonials[current]?.name}</h4>
                    <p className="text-slate-400 text-sm">{testimonials[current]?.role}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button key={index} onClick={() => setCurrent(index)} className={`transition-all duration-300 rounded-full ${index === current ? "w-8 h-2 bg-gradient-to-r from-orange-400 to-amber-400" : "w-2 h-2 bg-white/30 hover:bg-white/50"}`} />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Show use cases (no fake people)
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            {language === 'es' ? 'Casos de Uso ' : 'Real Use '}
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              {language === 'es' ? 'Reales' : 'Cases'}
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            {language === 'es'
              ? 'Capacidades reales de la plataforma para profesionales independientes'
              : 'Real platform capabilities for independent professionals'}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group"
              >
                <div className="relative h-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${useCase.color} shadow-lg flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-white">{useCase.title}</h3>
                        <Badge className={`bg-gradient-to-r ${useCase.color} text-white border-0 text-xs`}>
                          {useCase.badge}
                        </Badge>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {useCase.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
