import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSubscription } from '@/hooks/data/useSubscription';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { 
  Crown, Sparkles, Zap, ArrowRight, Check, Lock, 
  TrendingUp, Camera, Users, FolderOpen, FileText, 
  Brain, Calculator, Mic, Receipt, PartyPopper, Heart,
  Rocket, Gift, Star, Trophy, Target, Flame, Clock,
  AlertCircle, Lightbulb, BadgeCheck, Coins, PiggyBank,
  TrendingDown, Shield, Award, ChevronRight, Wallet,
  DollarSign, BarChart3, Percent, HandCoins, Banknote
} from 'lucide-react';
import { PlanType, PLAN_LIMITS } from '@/hooks/data/usePlanLimits';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/data/useProfile';


interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  currentPlan: PlanType;
  requiredPlan?: PlanType;
  usageType?: 'expenses' | 'incomes' | 'ocr' | 'clients' | 'projects';
  currentUsage?: number;
  limit?: number;
}

const planDetails = {
  free: {
    name: 'Free',
    price: '$0',
    priceAnnual: '$0',
    color: 'from-slate-500 to-slate-600',
    icon: Zap,
  },
  premium: {
    name: 'Premium',
    price: '$7.99',
    priceAnnual: '$6.49',
    color: 'from-amber-500 via-orange-500 to-red-500',
    icon: Sparkles,
  },
  pro: {
    name: 'Pro',
    price: '$14.99',
    priceAnnual: '$11.99',
    color: 'from-violet-600 via-purple-600 to-indigo-600',
    icon: Crown,
  },
  bundle: {
    name: 'Evo Bundle',
    price: '$19.99',
    priceAnnual: '$15.99',
    color: 'from-teal-500 via-emerald-500 to-cyan-500',
    icon: Rocket,
  },
  pro_beta: {
    name: 'Pro (Beta)',
    price: '$14.99',
    priceAnnual: '$11.99',
    color: 'from-violet-600 via-purple-600 to-indigo-600',
    icon: Crown,
  },
};

const featureIcons: Record<string, typeof Camera> = {
  expenses: Receipt,
  incomes: TrendingUp,
  ocr: Camera,
  clients: Users,
  projects: FolderOpen,
  contracts: FileText,
  mentorship: Brain,
  fire_calculator: Calculator,
  voice_assistant: Mic,
  voice_premium: Mic,
  bank_analysis: Banknote,
  ai_reconcile: Sparkles,
  predictions: BarChart3,
  autopilot: Rocket,
  coaching: Brain,
  ai_credits: Sparkles,
};

// Mensajes SUPER amigables y motivacionales por tipo de límite
const friendlyMessages: Record<string, {
  celebration: string;
  achievement: string;
  encouragement: string;
  keepGoing: string;
  whatYouDid: string;
  valueUnlocked: string;
  missedOpportunity: string;
  testimonial: { text: string; author: string; result: string };
  quickWin: string;
  benefits: { icon: typeof DollarSign; title: string; description: string; value: string }[];
  fomo: string;
  urgency: string;
}> = {
  expenses: {
    celebration: '¡INCREÍBLE, acabas de registrar tu gasto #50! 🎉🎊',
    achievement: '🏆 Logro Desbloqueado: "Contador Dedicado"',
    encouragement: '¡Esto es EXACTAMENTE lo que hacen los profesionales! Registrar cada gasto es el primer paso hacia la libertad financiera.',
    keepGoing: '¡No pares ahora! Estás construyendo el hábito más importante para tu negocio.',
    whatYouDid: 'Este mes capturaste $X en gastos potencialmente deducibles. ¡Eso es dinero que el CRA te puede devolver!',
    valueUnlocked: 'Con 50 gastos registrados, ya estás en el top 20% de usuarios más organizados.',
    missedOpportunity: '⚠️ Sin Premium, cada gasto que no registres es dinero que regalas al gobierno.',
    testimonial: {
      text: "Pensé que $6.99 era mucho hasta que vi que recuperé $3,200 en mi declaración.",
      author: "María G., Diseñadora Freelance",
      result: "+$3,200 en deducciones"
    },
    quickWin: '💡 Tip Pro: Los usuarios Premium promedian 127 gastos/mes y deducen 4x más.',
    benefits: [
      { icon: Receipt, title: 'Gastos ILIMITADOS', description: 'Registra cada café, cada Uber, cada compra de oficina sin límites', value: 'Sin tope mensual' },
      { icon: PiggyBank, title: 'Más deducciones', description: 'Cada gasto registrado es dinero potencial de vuelta', value: '+$2,400/año promedio' },
      { icon: BarChart3, title: 'Reportes fiscales PRO', description: 'Exporta todo listo para tu contador o para el CRA', value: 'Ahorra 5hrs/mes' },
    ],
    fomo: '🔥 Esta semana 847 usuarios desbloquearon gastos ilimitados. ¡Únete!',
    urgency: '📅 El año fiscal avanza - cada día sin registrar es dinero perdido.',
  },
  incomes: {
    celebration: '¡WOW! Ya tienes 20 fuentes de ingreso registradas 💰🚀',
    achievement: '🏆 Logro Desbloqueado: "Diversificador de Ingresos"',
    encouragement: '¡Múltiples fuentes de ingreso = LIBERTAD! Los millonarios tienen en promedio 7 fuentes. ¡Tú ya tienes 20 registradas!',
    keepGoing: 'Sigue así - estás construyendo un imperio financiero diversificado.',
    whatYouDid: 'Trackear tus ingresos te da claridad total sobre de dónde viene tu dinero.',
    valueUnlocked: 'Con 20 ingresos registrados, tienes una visión 360° de tu flujo de efectivo.',
    missedOpportunity: '⚠️ Sin tracking completo, podrías estar perdiendo oportunidades de optimización fiscal.',
    testimonial: {
      text: "Descubrí que un cliente me debía $1,800 que había olvidado cobrar. Premium se pagó solo.",
      author: "Carlos R., Consultor IT",
      result: "Recuperó $1,800 perdidos"
    },
    quickWin: '💡 Tip Pro: Los usuarios Premium identifican en promedio 3 fuentes de ingreso pasivo adicionales.',
    benefits: [
      { icon: TrendingUp, title: 'Ingresos ILIMITADOS', description: 'Registra todas tus fuentes: clientes, inversiones, royalties, todo', value: 'Sin límites' },
      { icon: Users, title: 'Análisis por cliente', description: 'Descubre qué clientes te generan más vs cuáles te cuestan tiempo', value: 'Rentabilidad clara' },
      { icon: Coins, title: 'Proyecciones', description: 'Anticipa tus ingresos y planifica con confianza', value: 'Flujo predecible' },
    ],
    fomo: '📈 El 78% de usuarios Pro tienen más de 5 fuentes de ingreso activas.',
    urgency: '💸 Cada ingreso no registrado es una oportunidad de optimización perdida.',
  },
  ocr: {
    celebration: '¡GENIAL! Capturaste 5 recibos con nuestra tecnología Smart 📸✨',
    achievement: '🏆 Logro Desbloqueado: "Cazador de Recibos"',
    encouragement: '¡Capturar recibos es LA CLAVE para maximizar deducciones! Cada foto = dinero potencial de vuelta.',
    keepGoing: 'Los recibos son oro fiscal - ¡y tú ya dominas la captura!',
    whatYouDid: 'Con 5 escaneos, ahorraste aproximadamente 25 minutos de entrada manual.',
    valueUnlocked: 'EvoFinz extrajo automáticamente vendedor, monto, fecha y categoría. ¡Magia!',
    missedOpportunity: '⚠️ Cada recibo que no capturas es una deducción que podrías perder.',
    testimonial: {
      text: "Antes perdía recibos todo el tiempo. Ahora foto y listo. Deduje $4,200 extra este año.",
      author: "Ana L., Fotógrafa",
      result: "+$4,200 en deducciones"
    },
    quickWin: '💡 Tip Pro: Los usuarios Pro capturan 127 recibos/mes en promedio. ¡Sin límites!',
    benefits: [
      { icon: Camera, title: '50 escaneos/mes (Premium)', description: 'Captura todos tus recibos del mes sin preocuparte', value: '10x más que Free' },
      { icon: Sparkles, title: 'OCR ILIMITADO (Pro)', description: 'Sin límites. Cada café, cada compra, cada factura', value: '∞ escaneos' },
      { icon: Brain, title: 'IA Inteligente', description: 'Extrae vendedor, monto, fecha y sugiere categoría automáticamente', value: '95% precisión' },
    ],
    fomo: '⚡ Los usuarios Pro procesan 127 recibos/mes. ¡Imagina las deducciones!',
    urgency: '🧾 Ese recibo en tu bolsillo podría valer $50 en deducciones. ¿Lo vas a perder?',
  },
  clients: {
    celebration: '¡FANTÁSTICO! Ya tienes 2 clientes en tu cartera 👥🌟',
    achievement: '🏆 Logro Desbloqueado: "Networker Profesional"',
    encouragement: '¡Tu negocio está CRECIENDO! Cada cliente es una relación de valor que estás construyendo.',
    keepGoing: '¡Esto es solo el comienzo! Tu red de clientes es tu mayor activo.',
    whatYouDid: 'Organizaste gastos y proyectos por cliente - eso es gestión profesional.',
    valueUnlocked: 'Ahora puedes generar reportes de reembolso que impresionan.',
    missedOpportunity: '⚠️ Sin más espacio para clientes, podrías perder oportunidades de negocio.',
    testimonial: {
      text: "Pasé de 2 a 12 clientes en 6 meses. Los reportes profesionales de EvoFinz me ayudaron a cerrar contratos.",
      author: "Roberto M., Consultor",
      result: "6x más clientes"
    },
    quickWin: '💡 Tip Pro: El freelancer promedio en Premium gestiona 8 clientes activos.',
    benefits: [
      { icon: Users, title: 'Clientes ILIMITADOS', description: 'Crece tu negocio sin restricciones. 10, 50, 100 clientes', value: 'Sin tope' },
      { icon: FileText, title: 'Reportes profesionales', description: 'Genera reportes de reembolso que impresionan a corporativos', value: 'Imagen PRO' },
      { icon: HandCoins, title: 'Facturación clara', description: 'Historial completo de ingresos y gastos por cliente', value: 'Transparencia total' },
    ],
    fomo: '🏆 Los usuarios Premium gestionan 8 clientes en promedio. ¡Crece con ellos!',
    urgency: '🤝 ¿Y si tu próximo gran cliente llega mañana? Prepárate.',
  },
  projects: {
    celebration: '¡EXCELENTE! Tienes 2 proyectos activos en marcha 🎯🚀',
    achievement: '🏆 Logro Desbloqueado: "Gestor de Proyectos"',
    encouragement: '¡Organizar por proyecto es CLAVE para saber qué te genera dinero y qué no!',
    keepGoing: 'Cada proyecto bien organizado es claridad financiera garantizada.',
    whatYouDid: 'Separaste gastos e ingresos por proyecto - ahora sabes la rentabilidad real.',
    valueUnlocked: 'Puedes ver exactamente cuánto ganaste (o perdiste) en cada proyecto.',
    missedOpportunity: '⚠️ Sin más proyectos, podrías mezclar finanzas y perder claridad.',
    testimonial: {
      text: "Descubrí que un proyecto que creía rentable me estaba costando dinero. Premium me abrió los ojos.",
      author: "Laura S., Desarrolladora",
      result: "Dejó proyectos no rentables"
    },
    quickWin: '💡 Tip Pro: El 92% de usuarios Premium saben exactamente cuánto ganan por proyecto.',
    benefits: [
      { icon: FolderOpen, title: 'Proyectos ILIMITADOS', description: 'Organiza cada trabajo, cada cliente, cada iniciativa', value: 'Sin restricciones' },
      { icon: BarChart3, title: 'Rentabilidad real', description: 'Ingresos menos gastos = ganancia real por proyecto', value: 'Números claros' },
      { icon: Target, title: 'Presupuestos', description: 'Establece límites y recibe alertas antes de pasarte', value: 'Control total' },
    ],
    fomo: '📊 Los usuarios Premium toman decisiones basadas en datos reales, no corazonadas.',
    urgency: '💡 ¿Sabes realmente cuánto ganas en cada proyecto? Premium te lo muestra.',
  },
  contracts: {
    celebration: '¡Tienes contratos que podrían esconder DINERO! 📄💎',
    achievement: '🏆 Oportunidad Detectada: "Tesoro en Contratos"',
    encouragement: 'Los contratos tienen cláusulas de reembolso que la mayoría ignora. ¡No seas uno de ellos!',
    keepGoing: 'Analizar tus contratos podría revelarte dinero que te deben.',
    whatYouDid: 'Subiste contratos importantes - el primer paso para entenderlos.',
    valueUnlocked: 'EvoFinz Pro puede extraer automáticamente términos de pago, reembolsos y fechas clave.',
    missedOpportunity: '⚠️ ¿Sabías que el 67% de freelancers no reclama reembolsos que les corresponden?',
    testimonial: {
      text: "EvoFinz encontró una cláusula de reembolso de equipo que había ignorado. Recuperé $1,200.",
      author: "Diego P., Consultor SAP",
      result: "+$1,200 en reembolsos"
    },
    quickWin: '💡 Tip Pro: Los usuarios Pro recuperan $890/año en reembolsos que no sabían que podían reclamar.',
    benefits: [
      { icon: Brain, title: 'Análisis Smart de contratos', description: 'Extrae automáticamente términos, fechas y obligaciones', value: 'En segundos' },
      { icon: Coins, title: 'Detecta reembolsos', description: 'Identifica gastos que puedes reclamar según tu contrato', value: '+$890/año promedio' },
      { icon: AlertCircle, title: 'Alertas de vencimiento', description: 'Nunca pierdas una renovación o fecha límite', value: 'Tranquilidad' },
    ],
    fomo: '💼 Los usuarios Pro recuperan dinero que otros dejan sobre la mesa.',
    urgency: '📋 Cada día sin analizar tus contratos es dinero potencial perdido.',
  },
  mileage: {
    celebration: '¡El tracking de kilometraje te está esperando! 🚗💨',
    achievement: '🏆 Oportunidad Disponible: "Road Warrior"',
    encouragement: '¿Manejas para trabajar? ¡Cada kilómetro es dinero deducible! A $0.70/km, suma rápido.',
    keepGoing: 'Los viajes de trabajo son una de las deducciones más subvaloradas.',
    whatYouDid: 'Estás considerando trackear kilometraje - ¡decisión inteligente!',
    valueUnlocked: 'Premium registra rutas con mapas y calcula deducciones automáticamente.',
    missedOpportunity: '⚠️ 100km/semana = $3,640/año en deducciones. ¿Los estás perdiendo?',
    testimonial: {
      text: "Manejo 200km/semana visitando clientes. Premium me devuelve $7,280 al año. ¡Se paga solo!",
      author: "Fernando T., Vendedor B2B",
      result: "$7,280/año en deducciones"
    },
    quickWin: '💡 Tip Pro: Solo 50km/semana = $1,820/año en deducciones. ¿Cuánto manejas tú?',
    benefits: [
      { icon: Target, title: 'Rutas automáticas', description: 'Registra origen, destino y la ruta se calcula sola', value: 'Mapas visuales' },
      { icon: Calculator, title: 'Cálculo CRA', description: 'Aplica la tarifa oficial de $0.70/km automáticamente', value: 'Listo para impuestos' },
      { icon: Banknote, title: 'Deducciones masivas', description: '100km/semana = $3,640/año. ¡No los dejes ir!', value: 'Dinero de vuelta' },
    ],
    fomo: '🛣️ Los usuarios Premium deducen $2,800/año promedio solo en kilometraje.',
    urgency: '🚙 Cada viaje sin registrar es dinero que regalas al gobierno.',
  },
  net_worth: {
    celebration: '¡Tu patrimonio neto te está llamando! 📈💰',
    achievement: '🏆 Oportunidad Disponible: "Wealth Builder"',
    encouragement: 'Conocer tu patrimonio neto es EL PRIMER PASO hacia la libertad financiera. ¡Los ricos lo hacen!',
    keepGoing: 'Lo que no se mide, no se mejora. ¡Mide tu riqueza!',
    whatYouDid: 'Estás interesado en conocer tu situación financiera real - ¡excelente mentalidad!',
    valueUnlocked: 'Premium te muestra activos vs pasivos y cómo evoluciona tu patrimonio mes a mes.',
    missedOpportunity: '⚠️ Sin conocer tu net worth, navegas tu vida financiera sin brújula.',
    testimonial: {
      text: "Ver mi patrimonio crecer cada mes me motivó a ahorrar más. Subí $15,000 en un año.",
      author: "Patricia V., Contadora",
      result: "+$15,000 en patrimonio"
    },
    quickWin: '💡 Tip Pro: Los usuarios que trackean su patrimonio lo incrementan 23% más rápido.',
    benefits: [
      { icon: Wallet, title: 'Activos y Pasivos', description: 'Lista todo lo que tienes y lo que debes en un solo lugar', value: 'Claridad total' },
      { icon: TrendingUp, title: 'Evolución mensual', description: 'Ve cómo crece (o decrece) tu patrimonio cada mes', value: 'Gráficos claros' },
      { icon: Target, title: 'Metas de patrimonio', description: 'Establece objetivos y trackea tu progreso', value: 'Motivación constante' },
    ],
    fomo: '🎯 El patrimonio promedio de usuarios Premium crece $840/mes.',
    urgency: '💎 ¿Cuánto vales realmente? Premium te lo muestra.',
  },
  fire_calculator: {
    celebration: '¡La LIBERTAD FINANCIERA te está esperando! 🔥🏖️',
    achievement: '🏆 Oportunidad Épica: "Future Millionaire"',
    encouragement: 'Calcular tu número FIRE es PLANIFICAR TU LIBERTAD. ¡Los que lo hacen, lo logran antes!',
    keepGoing: '¿Retirarte a los 45? ¿50? Con un plan FIRE, es posible.',
    whatYouDid: 'Estás pensando en independencia financiera - ¡mentalidad de campeón!',
    valueUnlocked: 'Pro calcula exactamente cuánto necesitas y cuándo podrías ser libre.',
    missedOpportunity: '⚠️ Sin un plan FIRE, trabajarás hasta los 65+ como la mayoría.',
    testimonial: {
      text: "El calculador FIRE me mostró que puedo retirarme a los 52. Ahora tengo un plan claro.",
      author: "Miguel A., Ingeniero",
      result: "Retiro planeado: 52 años"
    },
    quickWin: '💡 Tip Pro: El 34% de usuarios Pro alcanzarán FIRE 5 años antes de lo que pensaban.',
    benefits: [
      { icon: Flame, title: 'Número FIRE personal', description: 'Calcula exactamente cuánto necesitas para ser libre', value: 'Tu meta clara' },
      { icon: Calculator, title: 'Simulaciones', description: 'Prueba diferentes escenarios de ahorro e inversión', value: 'Múltiples caminos' },
      { icon: Target, title: 'Plan de retiro', description: 'Fecha estimada de independencia financiera', value: 'Tu futuro visualizado' },
    ],
    fomo: '🏖️ Los usuarios Pro planifican su libertad mientras otros solo sueñan.',
    urgency: '⏰ Cada año que pasa sin plan FIRE es un año más trabajando.',
  },
  mentorship: {
    celebration: '¡La SABIDURÍA FINANCIERA de los grandes te espera! 🧠📚',
    achievement: '🏆 Oportunidad de Crecimiento: "Financial Scholar"',
    encouragement: 'Los principios de finanzas personales han transformado millones de vidas. ¡La tuya puede ser la siguiente!',
    keepGoing: 'La educación financiera es la inversión con mayor ROI que existe.',
    whatYouDid: 'Buscas aprender de los mejores - ¡eso te distingue del 95%!',
    valueUnlocked: 'Pro incluye 8 componentes de mentoría con principios probados de éxito financiero.',
    missedOpportunity: '⚠️ Sin educación financiera, repites los errores que otros ya resolvieron.',
    testimonial: {
      text: "Entender el Cuadrante del Flujo de Caja cambió mi vida. Pasé de Empleado a Dueño de negocio.",
      author: "Sandra L., Empresaria",
      result: "De E a D en 2 años"
    },
    quickWin: '💡 Tip Pro: El 89% de usuarios Pro reportan cambios positivos en su mentalidad financiera.',
    benefits: [
      { icon: Brain, title: '8 módulos de mentoría', description: 'Cuadrante de flujo, deuda buena/mala, SMART goals y más', value: 'Conocimiento completo' },
      { icon: Award, title: 'Principios de libertad financiera', description: 'Activos vs pasivos, flujo de caja aplicado a tu vida real', value: 'Sabiduría probada' },
      { icon: Target, title: 'Metodología de metas SMART', description: 'Sistema probado para lograr cualquier objetivo financiero', value: 'Sistema de éxito' },
    ],
    fomo: '📚 Los usuarios Pro piensan diferente sobre el dinero. ¿Y tú?',
    urgency: '🧠 Tu mentalidad determina tu riqueza. Actualízala hoy.',
  },
  voice_assistant: {
    celebration: '¡El ASISTENTE DE VOZ te haría la vida más fácil! 🎤✨',
    achievement: '🏆 Oportunidad Disponible: "Hands-Free Pro"',
    encouragement: 'Dictar gastos es 5x MÁS RÁPIDO que escribirlos. ¡Trabaja más inteligente, no más duro!',
    keepGoing: 'La productividad máxima es registrar gastos sin usar las manos.',
    whatYouDid: 'Buscas eficiencia - ¡mentalidad de alto rendimiento!',
    valueUnlocked: 'Pro te permite dictar gastos mientras manejas, cocinas o caminas.',
    missedOpportunity: '⚠️ ¿Cuántos gastos olvidas porque "no tenías tiempo" de anotarlos?',
    testimonial: {
      text: "Registro gastos mientras manejo entre clientes. Antes olvidaba la mitad.",
      author: "Alejandro R., Vendedor",
      result: "0 gastos olvidados"
    },
    quickWin: '💡 Tip Pro: Los usuarios Pro ahorran 15 minutos diarios con entrada por voz.',
    benefits: [
      { icon: Mic, title: 'Dictado natural', description: '"Gasté $45 en Uber para ir al cliente" - y listo', value: 'Lenguaje normal' },
      { icon: Zap, title: '5x más rápido', description: 'Sin escribir, sin buscar categorías, sin fricción', value: 'Segundos vs minutos' },
      { icon: Brain, title: 'IA que entiende', description: 'Extrae monto, categoría y descripción de tu voz', value: 'Inteligencia real' },
    ],
    fomo: '⏱️ Los usuarios Pro capturan gastos en 5 segundos. ¿Y tú?',
    urgency: '🎯 Cada gasto olvidado es una deducción perdida.',
  },
  tax_optimizer: {
    celebration: '¡El OPTIMIZADOR FISCAL maximizaría tus deducciones! 💎🎯',
    achievement: '🏆 Oportunidad de Oro: "Tax Ninja"',
    encouragement: 'La IA encuentra deducciones que los humanos pasamos por alto. ¡Es como tener un contador 24/7!',
    keepGoing: 'Pagar menos impuestos (legalmente) es un derecho que debes ejercer.',
    whatYouDid: 'Quieres optimizar tus impuestos - ¡eso es inteligencia financiera!',
    valueUnlocked: 'Pro analiza tus gastos y sugiere deducciones específicas para tu situación.',
    missedOpportunity: '⚠️ El canadiense promedio deja $1,000+ en deducciones sobre la mesa cada año.',
    testimonial: {
      text: "La IA encontró deducciones de home office que mi contador había ignorado. $2,800 extra.",
      author: "Cristina M., Remote Worker",
      result: "+$2,800 en deducciones"
    },
    quickWin: '💡 Tip Pro: El promedio de deducciones adicionales encontradas por la IA es de $3,200/año.',
    benefits: [
      { icon: Brain, title: 'IA fiscal experta', description: 'Analiza tus gastos y encuentra oportunidades ocultas', value: 'Ojos que no fallan' },
      { icon: DollarSign, title: '+$3,200/año promedio', description: 'Deducciones que no sabías que podías reclamar', value: 'Dinero real' },
      { icon: Shield, title: 'Optimización por provincia', description: 'Reglas específicas de tu provincia aplicadas', value: 'Personalizado' },
    ],
    fomo: '💰 Los usuarios Pro pagan 18% menos impuestos en promedio.',
    urgency: '📅 La temporada fiscal se acerca. ¿Estás listo?',
  },
  gamification: {
    celebration: '¡La GAMIFICACIÓN haría tu viaje financiero DIVERTIDO! 🎮🏆',
    achievement: '🏆 Oportunidad Disponible: "Game Changer"',
    encouragement: 'Ganar XP, desbloquear badges y mantener rachas hace que organizar finanzas sea ADICTIVO (de la buena manera).',
    keepGoing: 'Los hábitos se forman con dopamina positiva. ¡Gamifica tu éxito!',
    whatYouDid: 'Te interesa hacer las finanzas divertidas - ¡mentalidad ganadora!',
    valueUnlocked: 'Premium convierte cada acción financiera en puntos, niveles y logros.',
    missedOpportunity: '⚠️ Sin motivación constante, los buenos hábitos mueren rápido.',
    testimonial: {
      text: "Mi racha de 67 días me motiva a abrir EvoFinz cada mañana. Nunca había sido tan organizado.",
      author: "Eduardo K., Freelancer",
      result: "Racha de 67 días"
    },
    quickWin: '💡 Tip Pro: Los usuarios con gamificación mantienen hábitos financieros 4x más tiempo.',
    benefits: [
      { icon: Star, title: 'Sistema de XP', description: 'Gana puntos por cada gasto, ingreso y hábito completado', value: 'Progreso visible' },
      { icon: Trophy, title: 'Badges desbloqueables', description: '50+ logros para coleccionar y mostrar', value: 'Reconocimiento' },
      { icon: Flame, title: 'Rachas motivadoras', description: 'Mantén tu racha diaria y compite contigo mismo', value: 'Consistencia' },
    ],
    fomo: '🏅 Los usuarios Premium tienen rachas promedio de 45 días.',
    urgency: '🎯 Los hábitos financieros de hoy determinan tu riqueza de mañana.',
  },
  voice_premium: {
    celebration: '¡Tu tiempo con la voz Premium se agotó este mes! 🎤',
    achievement: '🏆 Oportunidad: "Voz Sin Límites"',
    encouragement: 'La voz Premium te permite dictar gastos, recibir resúmenes y conversar con tu mentor sin escribir.',
    keepGoing: 'Más minutos = más productividad real cada día.',
    whatYouDid: 'Usaste todos tus minutos del plan actual.',
    valueUnlocked: 'Premium incluye 30 minutos / mes y Pro 120 minutos / mes de voz natural.',
    missedOpportunity: '⚠️ Sin voz, vuelves a teclear todo.',
    testimonial: {
      text: 'Dictar mientras manejo me ahorra 20 minutos al día.',
      author: 'Marcos D., Comercial',
      result: '+1.5 hrs/semana',
    },
    quickWin: '💡 Premium: 30 min/mes — Pro: 120 min/mes.',
    benefits: [
      { icon: Mic, title: 'Voz natural', description: 'Conversa con tu mentor financiero', value: 'Más fluidez' },
      { icon: Clock, title: 'Más minutos', description: '30 min Premium · 120 min Pro', value: 'Sin cortes' },
      { icon: Zap, title: 'Captura rápida', description: 'Dicta gastos en segundos', value: '5x más veloz' },
    ],
    fomo: '🎙️ Mejora tu plan y sigue dictando hoy mismo.',
    urgency: '⏱️ Los minutos se renuevan cada mes — no esperes.',
  },
  bank_analysis: {
    celebration: '¡El análisis bancario inteligente desbloquea tu Master Truth! 🏦',
    achievement: '🏆 Oportunidad: "Bank Master Truth"',
    encouragement: 'Procesa tus extractos y deja que la organización inteligente detecte recurrencias, ingresos y categorías.',
    keepGoing: 'Tu banco ya tiene los datos — sólo falta organizarlos.',
    whatYouDid: 'Subiste un extracto bancario para procesarlo.',
    valueUnlocked: 'Pro procesa extractos ilimitados al mes y detecta patrones automáticamente.',
    missedOpportunity: '⚠️ Sin análisis, cada transacción la categorizas a mano.',
    testimonial: {
      text: 'Subo mi extracto y en 30 segundos tengo todo categorizado.',
      author: 'Lucía F., Contadora',
      result: 'Ahorra 4hrs/mes',
    },
    quickWin: '💡 Pro: análisis bancario ilimitado.',
    benefits: [
      { icon: Banknote, title: 'Extractos ilimitados', description: 'Procesa cualquier banco, cualquier mes', value: 'Sin tope' },
      { icon: Sparkles, title: 'Detección de recurrencias', description: 'Identifica suscripciones y pagos repetidos', value: 'Cero esfuerzo' },
      { icon: BarChart3, title: 'Categorización automática', description: 'Todo organizado en segundos', value: '95% precisión' },
    ],
    fomo: '🏦 Los usuarios Pro tienen su Master Truth siempre actualizado.',
    urgency: '📅 Cada mes sin procesar es información perdida.',
  },
  ai_reconcile: {
    celebration: '¡La conciliación inteligente cruza tus datos por ti! ✨',
    achievement: '🏆 Oportunidad: "Reconciliación Sin Estrés"',
    encouragement: 'Cruza recibos, extractos bancarios y facturas automáticamente — encuentra duplicados y huecos.',
    keepGoing: 'Una contabilidad limpia es la base de decisiones correctas.',
    whatYouDid: 'Quieres conciliar tus datos automáticamente.',
    valueUnlocked: 'Premium / Pro incluyen conciliación inteligente con detección de duplicados.',
    missedOpportunity: '⚠️ Sin conciliación, los huecos crecen mes a mes.',
    testimonial: {
      text: 'Encontré $640 en gastos duplicados que estaba contando dos veces.',
      author: 'Tomás P., Freelance',
      result: 'Recuperó claridad',
    },
    quickWin: '💡 Premium: conciliación incluida.',
    benefits: [
      { icon: Sparkles, title: 'Cruce automático', description: 'Recibos vs banco vs facturas', value: 'En segundos' },
      { icon: Shield, title: 'Detección de duplicados', description: 'Evita contar gastos dos veces', value: 'Datos limpios' },
      { icon: Check, title: 'Sugerencias inteligentes', description: 'Te dice exactamente qué hacer', value: 'Decisiones claras' },
    ],
    fomo: '📊 Los usuarios Premium tienen contabilidad impecable.',
    urgency: '⚖️ Sin conciliar, no sabes tu situación real.',
  },
  predictions: {
    celebration: '¡Las predicciones inteligentes anticipan tu mes! 🔮',
    achievement: '🏆 Oportunidad: "Visión de Futuro"',
    encouragement: 'Saber cuánto vas a gastar antes de que pase es como ver el futuro.',
    keepGoing: 'Quien anticipa, gana.',
    whatYouDid: 'Quieres predecir tus próximos gastos.',
    valueUnlocked: 'Premium / Pro analizan tu historial y proyectan los próximos 30/60/90 días.',
    missedOpportunity: '⚠️ Sin predicciones, las sorpresas duelen al bolsillo.',
    testimonial: {
      text: 'Vi que en 3 semanas tendría un hueco — ajusté gastos y lo evité.',
      author: 'Andrea V., Emprendedora',
      result: 'Evitó descubierto',
    },
    quickWin: '💡 Premium: predicciones a 30 días incluidas.',
    benefits: [
      { icon: BarChart3, title: 'Proyección 30/60/90 días', description: 'Sabes lo que viene', value: 'Cero sorpresas' },
      { icon: AlertCircle, title: 'Alertas tempranas', description: 'Te aviso antes del problema', value: 'Tiempo de reaccionar' },
      { icon: Target, title: 'Recomendaciones', description: 'Dónde ajustar para llegar bien', value: 'Plan claro' },
    ],
    fomo: '📈 Los usuarios Premium nunca son tomados por sorpresa.',
    urgency: '⏰ El próximo mes empieza pronto — anticípate.',
  },
  autopilot: {
    celebration: '¡El piloto automático financiero trabaja por ti! 🚀',
    achievement: '🏆 Oportunidad: "Set & Forget"',
    encouragement: 'Recordatorios automáticos, sugerencias diarias y resúmenes — todo en piloto automático.',
    keepGoing: 'La constancia automática vence a la motivación esporádica.',
    whatYouDid: 'Buscas automatizar tu vida financiera.',
    valueUnlocked: 'Premium / Pro incluyen el piloto automático con sugerencias diarias.',
    missedOpportunity: '⚠️ Sin automatización, los días ocupados rompen tus hábitos.',
    testimonial: {
      text: 'Recibo mi resumen diario y en 30 segundos sé qué hacer.',
      author: 'Roberto Q., Consultor',
      result: '0 olvidos',
    },
    quickWin: '💡 Premium: piloto automático activo todos los días.',
    benefits: [
      { icon: Rocket, title: 'Sugerencias diarias', description: 'Tu mentor te guía cada mañana', value: 'Sin pensar' },
      { icon: Clock, title: 'Recordatorios automáticos', description: 'No olvidas nada importante', value: 'Tranquilidad' },
      { icon: Brain, title: 'Resúmenes inteligentes', description: 'Lo importante, claro y breve', value: 'Tiempo ahorrado' },
    ],
    fomo: '⚡ Los usuarios Premium dejan que la app trabaje por ellos.',
    urgency: '🌅 Mañana podrías empezar el día con tu plan ya listo.',
  },
  coaching: {
    celebration: '¡El mentor inteligente del Bundle te acompaña! 🧠',
    achievement: '🏆 Oportunidad: "Mentor Personal"',
    encouragement: 'El Bundle EvoFinz + Fokuspark conecta tus finanzas con tu enfoque diario.',
    keepGoing: 'Salud financiera + productividad = vida en orden.',
    whatYouDid: 'Quieres consejos personalizados de tu mentor.',
    valueUnlocked: 'El Bundle ($19.99) incluye coaching inteligente cruzado con tus hábitos.',
    missedOpportunity: '⚠️ Sin coaching, navegas a ciegas.',
    testimonial: {
      text: 'El mentor me dijo exactamente qué hacer cada semana. Cambió todo.',
      author: 'Daniela H., Bundle user',
      result: '+30% productividad',
    },
    quickWin: '💡 Bundle: coaching cruzado finanzas + foco.',
    benefits: [
      { icon: Brain, title: 'Mentor 24/7', description: 'Consejos basados en tus datos reales', value: 'Personalizado' },
      { icon: Sparkles, title: 'Cruce ecosistema', description: 'Finanzas + Foco en una vista', value: 'Visión 360°' },
      { icon: Heart, title: 'Bienestar real', description: 'Decisiones que mejoran tu vida', value: 'Cambio sostenible' },
    ],
    fomo: '🌟 Los usuarios Bundle tienen el ecosistema completo.',
    urgency: '🎯 Cada día sin mentor es un día sin guía.',
  },
  ai_credits: {
    celebration: '¡El servicio inteligente está temporalmente saturado! ⚡',
    achievement: '🏆 Oportunidad: "Prioridad Pro"',
    encouragement: 'Los planes superiores tienen prioridad cuando el servicio inteligente está alta demanda.',
    keepGoing: 'Mejora tu plan para acceso prioritario.',
    whatYouDid: 'Intentaste usar una función inteligente.',
    valueUnlocked: 'Premium / Pro tienen prioridad y mayores cuotas.',
    missedOpportunity: '⚠️ En el plan Free puedes esperar más en horas pico.',
    testimonial: {
      text: 'Desde que tengo Pro nunca más he tenido que esperar.',
      author: 'Pablo S., Pro user',
      result: 'Acceso siempre',
    },
    quickWin: '💡 Pro: prioridad garantizada.',
    benefits: [
      { icon: Zap, title: 'Prioridad alta', description: 'Acceso prioritario cuando hay demanda', value: 'Sin esperas' },
      { icon: Sparkles, title: 'Más cuota mensual', description: 'Más operaciones inteligentes incluidas', value: 'Más uso' },
      { icon: Shield, title: 'Garantía Pro', description: 'Servicio estable y confiable', value: 'Tranquilidad' },
    ],
    fomo: '⚡ Los usuarios Pro nunca esperan.',
    urgency: '🚀 Mejora ahora y úsalo sin límites.',
  },
};

// Celebration removed - routine action
const triggerCelebration = () => {
  // No-op: confetti removed for professionalism
};

export function UpgradePrompt({
  isOpen,
  onClose,
  feature = 'expenses',
  currentPlan,
  requiredPlan,
  usageType,
  currentUsage = 0,
  limit = 0,
}: UpgradePromptProps) {
  const { language } = useLanguage();
  const { data: profile } = useProfile();
  const { createCheckout, isCheckingOut } = useSubscription();
  const [showAnnual, setShowAnnual] = useState(true); // Default to annual for better value
  const [hasTriggeredCelebration, setHasTriggeredCelebration] = useState(false);
  
  const userName = profile?.full_name?.split(' ')[0] || 'Campeón';
  const targetPlan = requiredPlan || (currentPlan === 'free' ? 'premium' : 'pro');
  const targetDetails = planDetails[targetPlan];
  const currentDetails = planDetails[currentPlan];
  const Icon = featureIcons[feature] || Receipt;
  const friendly = friendlyMessages[feature] || friendlyMessages.expenses;

  // Celebrar el logro al abrir
  useEffect(() => {
    if (isOpen && !hasTriggeredCelebration) {
      triggerCelebration();
      setHasTriggeredCelebration(true);
    }
    if (!isOpen) {
      setHasTriggeredCelebration(false);
    }
  }, [isOpen, hasTriggeredCelebration]);

  const handleUpgrade = async () => {
    const billingPeriod = showAnnual ? 'annual' : 'monthly';
    const plan = targetPlan === 'premium' ? 'premium' : 'pro';
    await createCheckout(plan, billingPeriod);
    onClose();
  };

  const displayPrice = showAnnual ? targetDetails.priceAnnual : targetDetails.price;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Celebratory Header with Achievement Badge */}
        <DialogHeader className="relative pb-0">
          <div className="absolute -top-2 -right-2 text-5xl opacity-20 pointer-events-none animate-bounce">
            🎉
          </div>
          
          {/* Achievement Badge */}
          <div className="flex justify-center mb-4">
            <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${targetDetails.color} text-white text-sm font-bold flex items-center gap-2 shadow-lg`}>
              <Trophy className="h-4 w-4" />
              {friendly.achievement}
            </div>
          </div>

          <DialogTitle className="text-2xl text-center">
            ¡Felicidades, {userName}! 🌟
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {friendly.celebration}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Encouragement Card - Warm and Fuzzy */}
          <Card className="p-4 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border-green-500/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-green-500/20">
                <Heart className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-green-700 dark:text-green-400">
                  {friendly.encouragement}
                </p>
                <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                  {friendly.keepGoing}
                </p>
              </div>
            </div>
          </Card>

          {/* Achievement Progress */}
          {usageType && limit > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="relative">
                <div className="p-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    ¡META ALCANZADA! 🎯
                  </span>
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    {currentUsage}/{limit}
                  </Badge>
                </div>
                <Progress value={100} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500" />
                <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                  {friendly.valueUnlocked}
                </p>
              </div>
            </div>
          )}

          {/* Testimonial - Social Proof */}
          <Card className="p-4 bg-muted/50 border-2 border-dashed">
            <div className="flex items-start gap-3">
              <div className="text-3xl">"</div>
              <div className="flex-1">
                <p className="text-sm italic">
                  {friendly.testimonial.text}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    — {friendly.testimonial.author}
                  </p>
                  <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                    {friendly.testimonial.result}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Benefits Grid - The Good Stuff */}
          <div className="space-y-3">
            <h4 className="font-bold text-lg flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Lo que desbloqueas con {targetDetails.name}:
            </h4>
            <div className="grid gap-3">
              {friendly.benefits.map((benefit, idx) => (
                <Card key={idx} className="p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${targetDetails.color} flex-shrink-0`}>
                      <benefit.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="font-semibold text-sm">{benefit.title}</h5>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {benefit.value}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Win Tip */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
              {friendly.quickWin}
            </p>
          </div>

          {/* FOMO + Urgency */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/30">
              <Flame className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <span className="text-muted-foreground">{friendly.fomo}</span>
            </div>
            <div className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/30">
              <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span className="text-muted-foreground">{friendly.urgency}</span>
            </div>
          </div>

          {/* Pricing Card - The Offer */}
          <Card className={`p-5 border-2 bg-gradient-to-br ${targetDetails.color} text-white relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
            
            {/* Annual/Monthly Toggle */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <button
                onClick={() => setShowAnnual(false)}
                className={`text-sm px-4 py-1.5 rounded-full transition-all ${!showAnnual ? 'bg-white/30 font-bold' : 'bg-white/10'}`}
              >
                Mensual
              </button>
              <button
                onClick={() => setShowAnnual(true)}
                className={`text-sm px-4 py-1.5 rounded-full transition-all flex items-center gap-1 ${showAnnual ? 'bg-white/30 font-bold' : 'bg-white/10'}`}
              >
                Anual
                <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0 ml-1">
                  AHORRA 20%
                </Badge>
              </button>
            </div>

            <div className="text-center relative">
              <p className="font-bold text-xl opacity-90">Plan {targetDetails.name}</p>
              <div className="flex items-baseline justify-center gap-1 my-2">
                {showAnnual && (
                  <span className="text-lg line-through opacity-60">{targetDetails.price}</span>
                )}
                <span className="text-5xl font-black">{displayPrice}</span>
                <span className="text-lg opacity-80">/mes</span>
              </div>
              {showAnnual && (
                <p className="text-sm opacity-90">
                  Facturado anualmente • <span className="font-bold">Ahorras 2 meses gratis</span>
                </p>
              )}
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs opacity-80">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Pago seguro
              </span>
              <span className="flex items-center gap-1">
                <BadgeCheck className="h-3 w-3" />
                Cancela cuando quieras
              </span>
            </div>
          </Card>

          {/* While You Decide - Soft Alternative */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Clock className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                ¿Necesitas pensarlo? ¡Está bien! 💙
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                Tu progreso no se pierde. Los límites se reinician el 1° de cada mes, y siempre puedes actualizar después.
              </p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 pt-2">
          <Button 
            onClick={handleUpgrade}
            disabled={isCheckingOut}
            size="lg"
            className={`w-full py-6 font-bold text-lg bg-gradient-to-r ${targetDetails.color} hover:opacity-90 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]`}
          >
            <Gift className="h-6 w-6 mr-2" />
            {isCheckingOut ? 'Procesando...' : `¡Sí, quiero ${targetDetails.name}!`}
            <ArrowRight className="h-6 w-6 ml-2" />
          </Button>
          
          <p className="text-center text-xs text-muted-foreground">
            Únete a miles de profesionales que ya optimizan sus finanzas 🚀
          </p>
          
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
            Continuar con Free por ahora
            <span className="ml-2 text-xs opacity-60">(los límites se reinician el día 1)</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Compact inline upgrade badge for use within components
interface UpgradeBadgeProps {
  requiredPlan: PlanType;
  feature: string;
  onClick?: () => void;
}

export function UpgradeBadge({ requiredPlan, feature, onClick }: UpgradeBadgeProps) {
  const details = planDetails[requiredPlan];
  
  return (
    <Badge 
      className={`cursor-pointer bg-gradient-to-r ${details.color} text-white border-0 hover:opacity-90 transition-all hover:scale-105`}
      onClick={onClick}
    >
      <Sparkles className="h-3 w-3 mr-1" />
      {details.name}
    </Badge>
  );
}

// Usage bar component for dashboard
interface UsageBarProps {
  label: string;
  current: number;
  limit: number | 'unlimited';
  icon?: typeof Camera;
  onUpgrade?: () => void;
}

export function UsageBar({ label, current, limit, icon: Icon = Receipt, onUpgrade }: UsageBarProps) {
  if (limit === 'unlimited') {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          {label}
        </span>
        <Badge variant="secondary" className="text-xs bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-600">
          <Sparkles className="h-3 w-3 mr-1" />
          ∞ Ilimitado
        </Badge>
      </div>
    );
  }

  const percentage = (current / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= limit;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          {label}
        </span>
        <span className={`font-medium ${isAtLimit ? 'text-amber-600' : isNearLimit ? 'text-amber-500' : ''}`}>
          {current} / {limit}
          {isNearLimit && !isAtLimit && ' 🔥'}
          {isAtLimit && ' ⭐'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Progress 
          value={Math.min(percentage, 100)} 
          className={`h-2 flex-1 ${isAtLimit ? '[&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500' : isNearLimit ? '[&>div]:bg-amber-500' : ''}`}
        />
        {isAtLimit && onUpgrade && (
          <Button size="sm" variant="outline" onClick={onUpgrade} className="text-xs h-7 px-3 border-amber-500/50 text-amber-600 hover:bg-amber-500/10 font-medium">
            <Rocket className="h-3 w-3 mr-1" />
            ¡Desbloquear!
          </Button>
        )}
        {isNearLimit && !isAtLimit && (
          <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600">
            ¡Casi!
          </Badge>
        )}
      </div>
    </div>
  );
}
