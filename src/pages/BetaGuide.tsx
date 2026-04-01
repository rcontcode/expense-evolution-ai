import { useNavigate, Navigate } from 'react-router-dom';
import { useProfile } from '@/hooks/data/useProfile';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  ArrowLeft, BookOpen, MessageSquare, Bug, Star, Gift,
  Users, Zap, CheckCircle2, AlertTriangle, Clock,
  Sparkles, Trophy, Target, Shield, HelpCircle
} from 'lucide-react';

const pointsTable = [
  { action: 'Enviar feedback', points: '25', bonus: '+25 si comentario > 100 caracteres', icon: '💬' },
  { action: 'Bug report (bajo)', points: '25', bonus: '+25 con screenshot', icon: '🐛' },
  { action: 'Bug report (medio)', points: '50', bonus: '+25 con screenshot', icon: '🐛' },
  { action: 'Bug report (alto)', points: '75', bonus: '+25 con screenshot', icon: '🔥' },
  { action: 'Bug report (crítico)', points: '150', bonus: '+25 con screenshot', icon: '🚨' },
  { action: 'Referir un amigo', points: '100', bonus: 'Slot extra por cada referido', icon: '👥' },
];

const tiers = [
  { name: 'Bronze', range: '0-199', color: 'bg-amber-700/20 text-amber-700', emoji: '🥉' },
  { name: 'Silver', range: '200-499', color: 'bg-gray-400/20 text-gray-500', emoji: '🥈' },
  { name: 'Gold', range: '500-999', color: 'bg-yellow-500/20 text-yellow-600', emoji: '🥇' },
  { name: 'Platinum', range: '1000-1999', color: 'bg-purple-500/20 text-purple-500', emoji: '💎' },
  { name: 'Diamond', range: '2000+', color: 'bg-cyan-500/20 text-cyan-500', emoji: '👑' },
];

const rewards = [
  { name: 'Premium 1 Año', points: 1000, desc: 'Acceso Premium completo por 12 meses', emoji: '⭐' },
  { name: 'Pro 6 Meses', points: 2000, desc: 'Acceso Pro con todas las funciones por 6 meses', emoji: '🚀' },
  { name: 'Pro 1 Año', points: 3000, desc: 'Acceso Pro completo por 12 meses', emoji: '👑' },
];

export default function BetaGuide() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();

  if (profile && !profile.is_beta_tester) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Guía del Beta Tester</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="text-3xl">🎉</div>
            <div>
              <h2 className="text-xl font-bold mb-1">¡Bienvenido al programa Beta!</h2>
              <p className="text-sm text-muted-foreground">
                Como beta tester, tienes acceso a <strong>todas las funciones Pro</strong> de EvoFinz. 
                Tu misión: usar la app, dar feedback honesto y reportar bugs. A cambio, ganas puntos 
                canjeables por suscripciones reales.
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Start */}
        <section>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-yellow-500" /> Inicio Rápido
          </h3>
          <div className="grid gap-3">
            {[
              { step: 1, title: 'Explora las funciones', desc: 'Navega por Dashboard, Gastos, Ingresos, Contratos, Presupuesto y más.', icon: '🧭' },
              { step: 2, title: 'Envía feedback', desc: 'Ve a Feedback Beta y califica cada sección que uses.', icon: '💬', action: () => navigate('/beta-feedback') },
              { step: 3, title: 'Reporta bugs', desc: 'En la misma página, usa la pestaña "Reportar Bug" si encuentras errores.', icon: '🐛', action: () => navigate('/beta-feedback') },
              { step: 4, title: 'Invita amigos', desc: 'Comparte tu código de referido personal desde el Dashboard Beta.', icon: '👥' },
            ].map((item) => (
              <Card key={item.step} className="p-4 flex items-start gap-3 hover:bg-accent/5 transition-colors cursor-pointer" onClick={item.action}>
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {item.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span>{item.icon}</span>
                    <span className="font-medium text-sm">{item.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Points System */}
        <section>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Star className="h-5 w-5 text-yellow-500" /> Sistema de Puntos
          </h3>
          <Card className="overflow-hidden">
            <div className="divide-y divide-border">
              {pointsTable.map((row, i) => (
                <div key={i} className="p-3 flex items-center gap-3 text-sm">
                  <span className="text-lg">{row.icon}</span>
                  <div className="flex-1">
                    <span className="font-medium">{row.action}</span>
                    {row.bonus && <span className="text-xs text-muted-foreground ml-2">({row.bonus})</span>}
                  </div>
                  <Badge variant="secondary" className="font-mono">{row.points} pts</Badge>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Tiers */}
        <section>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Trophy className="h-5 w-5 text-amber-500" /> Niveles de Tester
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {tiers.map((tier) => (
              <Card key={tier.name} className="p-3 text-center">
                <div className="text-2xl mb-1">{tier.emoji}</div>
                <Badge className={tier.color}>{tier.name}</Badge>
                <p className="text-xs text-muted-foreground mt-1">{tier.range} pts</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Rewards */}
        <section>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Gift className="h-5 w-5 text-pink-500" /> Recompensas Canjeables
          </h3>
          <div className="grid gap-2">
            {rewards.map((reward) => (
              <Card key={reward.name} className="p-4 flex items-center gap-3">
                <span className="text-2xl">{reward.emoji}</span>
                <div className="flex-1">
                  <span className="font-medium text-sm">{reward.name}</span>
                  <p className="text-xs text-muted-foreground">{reward.desc}</p>
                </div>
                <Badge variant="outline" className="font-mono text-primary">{reward.points.toLocaleString()} pts</Badge>
              </Card>
            ))}
          </div>
        </section>

        {/* Requirements */}
        <section>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-blue-500" /> Requisitos para Mantener el Acceso
          </h3>
          <Card className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                Necesitas al menos <strong>4 contribuciones cada 14 días</strong> (feedback con comentario ≥80 caracteres o bug reports). Al menos <strong>1 debe ser un reporte de bug</strong>.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Si no cumples la cuota, tu acceso beta se desactiva automáticamente. Puedes reactivarlo contactando al equipo.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Tu período beta dura 90 días desde la activación. Los administradores pueden extenderlo.
              </p>
            </div>
          </Card>
        </section>

        {/* FAQ */}
        <section>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <HelpCircle className="h-5 w-5 text-muted-foreground" /> Preguntas Frecuentes
          </h3>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="q1">
              <AccordionTrigger className="text-sm">¿Qué pasa cuando termina mi período beta?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Tu cuenta regresa al plan gratuito. Si acumulaste suficientes puntos, puedes canjearlos por una suscripción real antes de que termine tu beta.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger className="text-sm">¿Mis datos se pierden al salir del beta?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                No. Todos tus datos (gastos, ingresos, contratos, etc.) se mantienen. Solo pierdes acceso a funciones Pro/Premium hasta que actives una suscripción.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger className="text-sm">¿Cómo canjeo mis puntos?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Desde el Dashboard Beta, en la sección de puntos, verás las recompensas disponibles. Haz click en "Canjear" cuando tengas suficientes puntos. Un administrador aprobará tu solicitud.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger className="text-sm">¿Puedo perder mis puntos?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                No. Los puntos acumulados nunca se pierden, incluso si tu acceso beta se desactiva temporalmente.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q5">
              <AccordionTrigger className="text-sm">¿Cómo doy buen feedback?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Sé específico: menciona qué sección usaste, qué esperabas, qué pasó realmente, y cómo mejorarías la experiencia. Comentarios de más de 100 caracteres ganan puntos extra.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* CTA */}
        <Card className="p-6 text-center bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-bold mb-1">¿Listo para contribuir?</h3>
          <p className="text-sm text-muted-foreground mb-4">Tu feedback hace que EvoFinz sea mejor para todos.</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={() => navigate('/beta-feedback')} className="gap-2">
              <MessageSquare className="h-4 w-4" /> Dar Feedback
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="gap-2">
              <Target className="h-4 w-4" /> Explorar la App
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
