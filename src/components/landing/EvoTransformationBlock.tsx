import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { transformationPairs } from '@/data/landing/transformationPairs';

const FEAR_MS = 4000;
const HOPE_MS = 7000;

export function EvoTransformationBlock() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const lang = language === 'es' ? 'es' : 'en';

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'fear' | 'hope'>('fear');
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (paused) return;
    const ms = phase === 'fear' ? FEAR_MS : HOPE_MS;
    timerRef.current = setTimeout(() => {
      if (phase === 'fear') {
        setPhase('hope');
      } else {
        setPhase('fear');
        setIndex((i) => (i + 1) % transformationPairs.length);
      }
    }, ms);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, index, paused]);

  const pair = transformationPairs[index];
  const text = phase === 'fear' ? pair.fear[lang] : pair.hope[lang];

  const goToPair = (i: number) => {
    setIndex(i);
    setPhase('fear');
  };

  return (
    <section
      aria-label={lang === 'es' ? 'Transformación' : 'Transformation'}
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center px-4 py-20 md:py-28">
        {/* Animated background by phase */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`bg-${phase}-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0"
          >
            {phase === 'fear' ? (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700 via-transparent to-transparent" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-200 via-transparent to-transparent" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${phase}-${index}`}
              initial={{ opacity: 0, y: phase === 'fear' ? 20 : -20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: phase === 'fear' ? -20 : 20, filter: 'blur(8px)' }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            >
              {phase === 'fear' ? (
                <>
                  <p className="text-xs md:text-sm uppercase tracking-[0.4em] text-slate-500 mb-6">
                    {lang === 'es' ? 'Esa voz a las 3am…' : 'That 3am voice…'}
                  </p>
                  <h3 className="text-2xl md:text-4xl lg:text-5xl font-light italic text-slate-300 leading-snug max-w-3xl mx-auto">
                    “{text}”
                  </h3>
                </>
              ) : (
                <>
                  <p className="text-xs md:text-sm uppercase tracking-[0.4em] text-white/80 mb-6">
                    {lang === 'es' ? 'Tu nueva realidad' : 'Your new reality'}
                  </p>
                  <h3 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight max-w-3xl mx-auto drop-shadow-lg">
                    {text}
                  </h3>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="mt-10"
                  >
                    <Button
                      size="lg"
                      onClick={() => navigate('/quiz')}
                      className="bg-white text-slate-900 hover:bg-white/90 font-semibold rounded-full px-8 py-6 text-base shadow-2xl hover-scale"
                    >
                      {lang === 'es' ? 'Empieza tu transformación' : 'Start your transformation'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
          {transformationPairs.map((p, i) => (
            <button
              key={p.id}
              aria-label={`${lang === 'es' ? 'Ir al par' : 'Go to pair'} ${i + 1}`}
              onClick={() => goToPair(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === index
                  ? phase === 'hope'
                    ? 'w-8 bg-white'
                    : 'w-8 bg-slate-400'
                  : 'w-1.5 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default EvoTransformationBlock;
