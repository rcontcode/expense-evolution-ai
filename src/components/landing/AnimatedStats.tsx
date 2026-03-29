import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { 
  Receipt, Globe, BookOpen, Shield, FileText, Zap
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface StatItem {
  icon: typeof Receipt;
  value: string;
  label: string;
  color: string;
  glowColor: string;
}

const getStats = (language: string): StatItem[] => [
  { icon: Receipt, value: "30+", label: language === 'es' ? "Categorías fiscales" : "Tax categories", color: "from-cyan-400 to-blue-500", glowColor: "rgba(34, 211, 238, 0.6)" },
  { icon: Globe, value: "80+", label: language === 'es' ? "Países disponibles" : "Countries available", color: "from-emerald-400 to-teal-500", glowColor: "rgba(52, 211, 153, 0.6)" },
  { icon: BookOpen, value: "8+", label: language === 'es' ? "Módulos de mentoría" : "Mentorship modules", color: "from-violet-400 to-purple-600", glowColor: "rgba(167, 139, 250, 0.6)" },
  { icon: Shield, value: "100%", label: language === 'es' ? "Datos encriptados" : "Encrypted data", color: "from-blue-400 to-indigo-500", glowColor: "rgba(96, 165, 250, 0.6)" },
  { icon: FileText, value: "5+", label: language === 'es' ? "Tipos de reporte" : "Report types", color: "from-amber-400 to-orange-500", glowColor: "rgba(251, 191, 36, 0.6)" },
  { icon: Zap, value: language === 'es' ? "3 seg" : "3 sec", label: language === 'es' ? "Procesamiento OCR" : "OCR processing", color: "from-rose-400 to-red-500", glowColor: "rgba(251, 113, 133, 0.6)" },
];

export function AnimatedStats() {
  const { language } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-50px" });

  const stats = getStats(language);

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-200/30 via-blue-200/20 to-purple-200/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />

      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-2">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {language === 'es' ? 'Capacidades del Producto' : 'Product Capabilities'}
            </span>
          </h2>
          <p className="text-muted-foreground text-lg">
            {language === 'es' ? 'Métricas reales de la plataforma' : 'Real platform metrics'}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="group cursor-default"
              >
                <div className="relative bg-card/90 text-card-foreground backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-border/60 h-full overflow-hidden">
                  <motion.div 
                    className={`absolute -top-0.5 left-0 right-0 h-1.5 bg-gradient-to-r ${stat.color}`}
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    style={{ transformOrigin: "left" }}
                  />

                  <div className="flex flex-col items-center text-center gap-3">
                    <motion.div 
                      className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>

                    <div>
                      <span className="text-2xl md:text-3xl font-black text-foreground tabular-nums">
                        {stat.value}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                        {stat.label}
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
