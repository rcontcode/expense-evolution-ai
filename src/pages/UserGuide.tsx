import { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { motion } from 'framer-motion';
import { Search, ChevronRight, BookOpen, CheckCircle2, Lightbulb, HelpCircle, ArrowRight, Sparkles, ArrowUp } from 'lucide-react';
import { DataFlowMap } from '@/components/diagrams/DataFlowMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/LanguageContext';
import { heroContent, guideSections, globalFAQ, connectionsDiagram, dataEntryPoints, dataEntryFAQ } from '@/data/user-guide-content';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageHeader } from '@/components/PageHeader';
import { LanguageSelector } from '@/components/LanguageSelector';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function UserGuide() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lang = language as 'es' | 'en';

  const scrollToSection = useCallback((id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Retry after a short delay to handle lazy-rendered content
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, []);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return guideSections;
    const q = search.toLowerCase();
    return guideSections.filter(s =>
      s.title[lang].toLowerCase().includes(q) ||
      s.shortDesc[lang].toLowerCase().includes(q) ||
      s.purpose[lang].toLowerCase().includes(q) ||
      s.steps.some(st => st[lang].toLowerCase().includes(q)) ||
      s.faq.some(f => f.question[lang].toLowerCase().includes(q) || f.answer[lang].toLowerCase().includes(q))
    );
  }, [search, lang]);

  const filteredFAQ = useMemo(() => {
    if (!search.trim()) return globalFAQ;
    const q = search.toLowerCase();
    return globalFAQ.filter(f =>
      f.question[lang].toLowerCase().includes(q) || f.answer[lang].toLowerCase().includes(q)
    );
  }, [search, lang]);

  const t = (obj: { es: string; en: string }) => obj[lang];

  return (
    <Layout>
    <div className="min-h-screen bg-background pb-24">
      {/* Page Header with Language Selector */}
      <div className="page-container">
          <PageHeader
            title={`📖 ${t(heroContent.title)}`}
            description={lang === 'es' ? 'Tu guía completa para dominar EvoFinz' : 'Your complete guide to mastering EvoFinz'}
          >
            <LanguageSelector />
          </PageHeader>
      </div>

      <div className="max-w-5xl mx-auto flex gap-6">
        {/* Sticky TOC - Desktop only */}
        {!isMobile && (
          <aside className="hidden lg:block w-56 shrink-0 sticky top-24 h-[calc(100vh-6rem)] py-6">
            <ScrollArea className="h-full pr-3">
              <nav className="space-y-1">
                <button onClick={() => scrollToSection('hero')} className="text-xs text-left w-full px-2 py-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  🌟 {lang === 'es' ? 'Visión General' : 'Overview'}
                </button>
                {guideSections.map(s => (
                  <button
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    className="text-xs text-left w-full px-2 py-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors truncate"
                  >
                    {s.emoji} {t(s.title)}
                  </button>
                ))}
                <button onClick={() => scrollToSection('data-entry-points')} className="text-xs text-left w-full px-2 py-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  🎯 {lang === 'es' ? 'Puntos de Entrada' : 'Entry Points'}
                </button>
                <button onClick={() => scrollToSection('connections')} className="text-xs text-left w-full px-2 py-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  🔗 {lang === 'es' ? 'Interconexiones' : 'Connections'}
                </button>
                <button onClick={() => scrollToSection('faq')} className="text-xs text-left w-full px-2 py-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  ❓ FAQ
                </button>
              </nav>
            </ScrollArea>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 px-4 py-6 space-y-8 min-w-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'es' ? 'Buscar en el manual...' : 'Search the manual...'}
              className="pl-10"
            />
          </div>

          {/* ── BLOQUE 1: Hero / Vision General ── */}
          {!search.trim() && (
            <div ref={el => { sectionRefs.current['hero'] = el; }}>
              <motion.div variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">🚀</div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{t(heroContent.subtitle)}</h2>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* What is */}
              <motion.div variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-primary" /> {t(heroContent.whatIs.title)}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{t(heroContent.whatIs.desc)}</p>
              </motion.div>

              {/* For whom */}
              <motion.div variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-6">
                <h3 className="text-lg font-semibold mb-3">{t(heroContent.forWhom.title)}</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {heroContent.forWhom.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50">
                      <span className="text-lg">{item.emoji}</span>
                      <span>{t(item)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Mission */}
              <motion.div variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-6">
                <Card className="p-5 border-l-4 border-l-primary">
                  <h3 className="font-semibold mb-2">🎯 {t(heroContent.mission.title)}</h3>
                  <p className="text-sm text-muted-foreground">{t(heroContent.mission.desc)}</p>
                </Card>
              </motion.div>

              {/* Advantages */}
              <motion.div variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-6">
                <h3 className="text-lg font-semibold mb-3">{t(heroContent.advantages.title)}</h3>
                <div className="space-y-2">
                  {heroContent.advantages.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm p-2">
                      <span className="text-lg">{item.emoji}</span>
                      <span>{t(item)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Habit */}
              <motion.div variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-6">
                <Card className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
                  <h3 className="font-semibold mb-2">⚡ {t(heroContent.habit.title)}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t(heroContent.habit.desc)}</p>
                  <div className="space-y-2">
                    {heroContent.habit.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span>{step.emoji}</span>
                        <span>{t(step)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>

              {/* Improvement */}
              <motion.div variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-6">
                <Card className="p-5 border-l-4 border-l-amber-500">
                  <h3 className="font-semibold mb-2">🤝 {t(heroContent.improvement.title)}</h3>
                  <p className="text-sm text-muted-foreground">{t(heroContent.improvement.desc)}</p>
                </Card>
              </motion.div>
            </div>
          )}

          {/* ── BLOQUE 2: Secciones ── */}
          {filteredSections.length > 0 && (
            <div className="space-y-6">
              {!search.trim() && (
                <h2 className="text-xl font-bold flex items-center gap-2">
                  📖 {lang === 'es' ? 'Guía por Sección' : 'Section Guide'}
                </h2>
              )}
              {filteredSections.map(section => (
                <motion.div
                  key={section.id}
                  ref={el => { sectionRefs.current[section.id] = el; }}
                  variants={fadeIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <Card className={`overflow-hidden border-l-4 ${section.color}`}>
                    <CardContent className="p-5 space-y-4">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{section.emoji}</span>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold">{t(section.title)}</h3>
                          <p className="text-sm text-muted-foreground">{t(section.shortDesc)}</p>
                        </div>
                      </div>

                      {/* Purpose */}
                      <p className="text-sm leading-relaxed">{t(section.purpose)}</p>

                      {/* Steps */}
                      <div>
                        <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {lang === 'es' ? 'Paso a paso' : 'Step by step'}
                        </h4>
                        <ol className="space-y-1.5">
                          {section.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <Badge variant="outline" className="shrink-0 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                                {i + 1}
                              </Badge>
                              <span>{t(step)}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Tips */}
                      {section.tips.length > 0 && (
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                          <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                            <Lightbulb className="h-4 w-4 text-amber-500" />
                            {lang === 'es' ? 'Tips' : 'Tips'}
                          </h4>
                          <ul className="space-y-1">
                            {section.tips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="text-amber-500 mt-0.5">•</span>
                                <span>{t(tip)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* FAQ */}
                      {section.faq.length > 0 && (
                        <Accordion type="single" collapsible>
                          <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-1">
                            <HelpCircle className="h-4 w-4 text-blue-500" />
                            {lang === 'es' ? 'Preguntas frecuentes' : 'FAQ'}
                          </h4>
                          {section.faq.map((faq, i) => (
                            <AccordionItem key={i} value={`faq-${section.id}-${i}`} className="border-none">
                              <AccordionTrigger className="text-sm py-2 hover:no-underline">
                                {t(faq.question)}
                              </AccordionTrigger>
                              <AccordionContent className="text-sm text-muted-foreground">
                                {t(faq.answer)}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      )}

                      {/* Connections */}
                      {section.connections.length > 0 && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                            <ArrowRight className="h-3 w-3" />
                            {lang === 'es' ? 'Conectado con:' : 'Connected to:'}
                          </p>
                          {section.connections.map((c, i) => (
                            <p key={i} className="text-xs text-muted-foreground">{t(c)}</p>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* ── BLOQUE 2.5: Data Entry Points ── */}
          {!search.trim() && (
            <div ref={el => { sectionRefs.current['data-entry-points'] = el; }}>
              <motion.div variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                  🎯 {lang === 'es' ? 'Puntos de Entrada de Datos' : 'Data Entry Points'}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {lang === 'es' 
                    ? 'EvoFinz tiene 8 formas de ingresar información financiera. Cada una tiene un propósito específico. Aquí te explicamos cuándo usar cada una.'
                    : 'EvoFinz has 8 ways to enter financial information. Each has a specific purpose. Here we explain when to use each one.'}
                </p>
                <div className="space-y-3 mb-6">
                  {dataEntryPoints.map((ep) => (
                    <Card key={ep.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{ep.emoji}</span>
                        <div className="flex-1 space-y-1.5">
                          <h4 className="text-sm font-bold">{t(ep.name)}</h4>
                          <p className="text-xs text-muted-foreground">{t(ep.description)}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                            <span><span className="font-medium text-foreground">{lang === 'es' ? 'Destino:' : 'Destination:'}</span> <span className="text-muted-foreground">{t(ep.destination)}</span></span>
                            <span><span className="font-medium text-foreground">{lang === 'es' ? 'Acceso:' : 'Access:'}</span> <span className="text-muted-foreground">{t(ep.access)}</span></span>
                          </div>
                          <p className="text-[11px] text-primary/80 italic">{t(ep.whenToUse)}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Data Entry FAQ */}
                <Accordion type="single" collapsible className="space-y-1">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                    <HelpCircle className="h-4 w-4 text-blue-500" />
                    {lang === 'es' ? '¿Cuál es la diferencia?' : 'What\'s the difference?'}
                  </h4>
                  {dataEntryFAQ.map((faq, i) => (
                    <AccordionItem key={i} value={`entry-faq-${i}`}>
                      <AccordionTrigger className="text-sm">
                        {t(faq.question)}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {t(faq.answer)}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            </div>
          )}

          {/* ── BLOQUE 3: Mapa Visual de Flujos ── */}
          {!search.trim() && (
            <div ref={el => { sectionRefs.current['connections'] = el; }}>
              <motion.div variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <Card className="p-6">
                  <DataFlowMap />
                </Card>
              </motion.div>
            </div>
          )}

          {/* ── FAQ Global ── */}
          {filteredFAQ.length > 0 && (
            <div ref={el => { sectionRefs.current['faq'] = el; }}>
              <motion.div variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                  ❓ {lang === 'es' ? 'Preguntas Frecuentes Globales' : 'Global FAQ'}
                </h2>
                <Accordion type="single" collapsible className="space-y-1">
                  {filteredFAQ.map((faq, i) => (
                    <AccordionItem key={i} value={`global-faq-${i}`}>
                      <AccordionTrigger className="text-sm">
                        {t(faq.question)}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {t(faq.answer)}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            </div>
          )}

          {/* No results */}
          {search.trim() && filteredSections.length === 0 && filteredFAQ.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                {lang === 'es' ? 'No se encontraron resultados para' : 'No results found for'} "{search}"
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
    </Layout>
  );
}
