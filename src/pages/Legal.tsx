import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Scale, 
  BookOpen, 
  FileText, 
  Lock, 
  ArrowLeft,
  ExternalLink,
  Building2,
  Bot,
  UserCheck,
  Mail,
  Heart,
  ArrowRight
} from 'lucide-react';

export default function Legal() {
  const { language } = useLanguage();
  const isEs = language === 'es';

  const sections = [
    {
      id: 'disclaimer',
      icon: Heart,
      title: isEs ? '¿Qué es EvoFinz?' : 'What is EvoFinz?',
      color: 'text-emerald-500',
      content: isEs ? (
        <>
          <p className="mb-4">
            EvoFinz es una <strong>herramienta de organización financiera personal y educación</strong>. 
            Fue creada para ayudarte a:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>📊 Organizar tus gastos, ingresos y documentos en un solo lugar</li>
            <li>📚 Aprender sobre finanzas personales con contenido inspirado en expertos reconocidos</li>
            <li>📈 Ver estimaciones aproximadas que te sirvan como referencia para planificar</li>
            <li>🤖 Usar un asistente de IA que te orienta (pero no te dice qué hacer)</li>
          </ul>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <p className="text-sm">
              💡 <strong>En resumen:</strong> EvoFinz te ayuda a organizar información y aprender. 
              No te da órdenes ni reemplaza a un profesional. Las decisiones financieras siempre son tuyas, 
              y para temas importantes te recomendamos consultar con un contador o asesor certificado (CPA, CFP).
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="mb-4">
            EvoFinz is a <strong>personal financial organization and education tool</strong>. 
            It was created to help you:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>📊 Organize your expenses, income, and documents in one place</li>
            <li>📚 Learn about personal finance with content inspired by recognized experts</li>
            <li>📈 See approximate estimates as a reference for planning</li>
            <li>🤖 Use an AI assistant that guides you (but doesn't tell you what to do)</li>
          </ul>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <p className="text-sm">
              💡 <strong>In short:</strong> EvoFinz helps you organize information and learn. 
              It doesn't give you orders or replace a professional. Financial decisions are always yours, 
              and for important matters we recommend consulting a certified accountant or advisor (CPA, CFP).
            </p>
          </div>
        </>
      ),
    },
    {
      id: 'user-responsibility',
      icon: Shield,
      title: isEs ? 'Tu Responsabilidad' : 'Your Responsibility',
      color: 'text-blue-500',
      content: isEs ? (
        <>
          <p className="mb-4">
            Queremos ser claros y honestos contigo: <strong>tú eres quien toma las decisiones sobre tu dinero</strong>. 
            EvoFinz es como una libreta inteligente que organiza tu información, pero no decide por ti.
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Los cálculos y estimaciones son <strong>aproximados</strong> y te sirven como guía, no como verdad absoluta</li>
            <li>Si necesitas tomar una decisión financiera importante (impuestos, inversiones, deudas grandes), 
            busca ayuda de un profesional certificado</li>
            <li>La información que ingresas es tu responsabilidad — mientras más precisa sea, mejores serán las estimaciones</li>
            <li>No uses EvoFinz como único criterio para decisiones que afecten significativamente tu situación financiera</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Nuestro objetivo es ayudarte a entender mejor tus finanzas y organizarte. El resto depende de ti. 🙌
          </p>
        </>
      ) : (
        <>
          <p className="mb-4">
            We want to be clear and honest with you: <strong>you are the one who makes decisions about your money</strong>. 
            EvoFinz is like a smart notebook that organizes your information, but doesn't decide for you.
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Calculations and estimates are <strong>approximate</strong> and serve as a guide, not absolute truth</li>
            <li>If you need to make an important financial decision (taxes, investments, large debts), 
            seek help from a certified professional</li>
            <li>The information you enter is your responsibility — the more accurate it is, the better the estimates</li>
            <li>Don't use EvoFinz as your sole criterion for decisions that significantly affect your financial situation</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Our goal is to help you better understand your finances and get organized. The rest is up to you. 🙌
          </p>
        </>
      ),
    },
    {
      id: 'ai-content',
      icon: Bot,
      title: isEs ? 'Contenido Generado por Inteligencia Artificial' : 'AI-Generated Content',
      color: 'text-indigo-500',
      content: isEs ? (
        <>
          <p className="mb-4">
            EvoFinz utiliza modelos de inteligencia artificial (IA) para proporcionar funcionalidades como:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Asistente financiero conversacional de EvoFinz</li>
            <li>Extracción automática de datos de documentos (OCR)</li>
            <li>Análisis y categorización de gastos</li>
            <li>Sugerencias y recomendaciones personalizadas</li>
          </ul>
          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <p className="text-sm font-medium mb-2">⚠️ Advertencia sobre IA:</p>
            <ul className="text-sm space-y-1">
              <li>• El contenido generado por IA puede contener <strong>errores, imprecisiones o "alucinaciones"</strong></li>
              <li>• Las respuestas del asistente NO constituyen asesoría profesional</li>
              <li>• Los datos extraídos por OCR/IA deben ser <strong>verificados manualmente</strong> por el usuario</li>
              <li>• EvoFinz no garantiza la exactitud, completitud ni idoneidad del contenido generado por IA</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            El usuario es responsable de verificar toda la información generada por IA antes de tomar 
            cualquier decisión basada en ella.
          </p>
        </>
      ) : (
        <>
          <p className="mb-4">
            EvoFinz uses artificial intelligence (AI) models to provide features such as:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Conversational financial assistant (EvoFinz)</li>
            <li>Automatic document data extraction (OCR)</li>
            <li>Expense analysis and categorization</li>
            <li>Personalized suggestions and recommendations</li>
          </ul>
          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <p className="text-sm font-medium mb-2">⚠️ AI Warning:</p>
            <ul className="text-sm space-y-1">
              <li>• AI-generated content may contain <strong>errors, inaccuracies, or "hallucinations"</strong></li>
              <li>• Assistant responses do NOT constitute professional advice</li>
              <li>• OCR/AI-extracted data must be <strong>manually verified</strong> by the user</li>
              <li>• EvoFinz does not guarantee the accuracy, completeness, or suitability of AI-generated content</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            The user is responsible for verifying all AI-generated information before making 
            any decisions based on it.
          </p>
        </>
      ),
    },
    {
      id: 'tax',
      icon: Building2,
      title: isEs ? 'Información Fiscal' : 'Tax Information',
      color: 'text-blue-500',
      content: isEs ? (
        <>
          <p className="mb-4">
            Las herramientas fiscales de EvoFinz (Estimador de Impuestos, Optimizador RRSP/TFSA, Calendario Fiscal) 
            proporcionan <strong>estimaciones educativas</strong> basadas en:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Tasas impositivas publicadas por CRA (Canadá) y SII (Chile)</li>
            <li>Reglas generales de deducción simplificadas</li>
            <li>Límites de contribución estándar</li>
          </ul>
          <p className="mb-4">
            <strong>Limitaciones:</strong> Los cálculos NO consideran todas las circunstancias personales, 
            créditos especiales, situaciones familiares complejas, o cambios recientes en la legislación.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline">
              <ExternalLink className="h-3 w-3 mr-1" />
              <a href="https://www.canada.ca/en/revenue-agency.html" target="_blank" rel="noopener noreferrer">
                CRA Canada
              </a>
            </Badge>
            <Badge variant="outline">
              <ExternalLink className="h-3 w-3 mr-1" />
              <a href="https://www.sii.cl" target="_blank" rel="noopener noreferrer">
                SII Chile
              </a>
            </Badge>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
            <p className="text-sm font-medium mb-2">🇨🇱 Regulación Chile:</p>
            <p className="text-sm">
              Conforme a la <strong>Ley 18.045</strong>, esta herramienta NO constituye asesoría de inversiones 
              regulada por la <strong>CMF (Comisión para el Mercado Financiero)</strong>. EvoFinz no es una entidad 
              registrada ante la CMF ni opera como intermediario de valores.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
            <p className="text-sm font-medium mb-2">🇨🇦 Regulación Canadá:</p>
            <p className="text-sm">
              Esta herramienta no proporciona asesoría de valores (securities advice) según lo definido por la 
              legislación provincial de valores (OSC, BCSC, AMF, etc.). Para recomendaciones de inversión, 
              consulte a un asesor financiero con licencia provincial.
            </p>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            ⚠️ Las tasas y reglas fiscales se actualizan periódicamente pero pueden no reflejar cambios legislativos recientes. 
            Verifique siempre con las fuentes oficiales (CRA, SII).
          </p>
          <p className="text-sm text-muted-foreground">
            Para declaraciones de impuestos precisas, siempre consulte con un Contador Público Certificado (CPA) 
            o preparador de impuestos autorizado.
          </p>
        </>
      ) : (
        <>
          <p className="mb-4">
            EvoFinz tax tools (Tax Estimator, RRSP/TFSA Optimizer, Tax Calendar) provide 
            <strong> educational estimates</strong> based on:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Tax rates published by CRA (Canada) and SII (Chile)</li>
            <li>Simplified general deduction rules</li>
            <li>Standard contribution limits</li>
          </ul>
          <p className="mb-4">
            <strong>Limitations:</strong> Calculations do NOT consider all personal circumstances, 
            special credits, complex family situations, or recent legislative changes.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline">
              <ExternalLink className="h-3 w-3 mr-1" />
              <a href="https://www.canada.ca/en/revenue-agency.html" target="_blank" rel="noopener noreferrer">
                CRA Canada
              </a>
            </Badge>
            <Badge variant="outline">
              <ExternalLink className="h-3 w-3 mr-1" />
              <a href="https://www.sii.cl" target="_blank" rel="noopener noreferrer">
                SII Chile
              </a>
            </Badge>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
            <p className="text-sm font-medium mb-2">🇨🇱 Chile Regulation:</p>
            <p className="text-sm">
              Pursuant to <strong>Law 18.045</strong>, this tool does NOT constitute investment advice 
              regulated by the <strong>CMF (Comisión para el Mercado Financiero)</strong>. EvoFinz is not 
              an entity registered with the CMF nor does it operate as a securities intermediary.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
            <p className="text-sm font-medium mb-2">🇨🇦 Canada Regulation:</p>
            <p className="text-sm">
              This tool does not provide securities advice as defined by provincial securities legislation 
              (OSC, BCSC, AMF, etc.). For investment recommendations, consult a provincially licensed 
              financial advisor.
            </p>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            ⚠️ Tax rates and rules are updated periodically but may not reflect recent legislative changes. 
            Always verify with official sources (CRA, SII).
          </p>
          <p className="text-sm text-muted-foreground">
            For accurate tax filings, always consult with a Certified Public Accountant (CPA) 
            or authorized tax preparer.
          </p>
        </>
      ),
    },
    {
      id: 'investment',
      icon: Scale,
      title: isEs ? 'Proyecciones de Inversión' : 'Investment Projections',
      color: 'text-green-500',
      content: isEs ? (
        <>
          <p className="mb-4">
            Las herramientas de proyección (Calculadora FIRE, Tracker de Portafolio, Metas de Inversión) 
            utilizan <strong>modelos hipotéticos</strong> con las siguientes consideraciones:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Los retornos proyectados se basan en promedios históricos (típicamente 6-7% anual)</li>
            <li>Los rendimientos pasados NO garantizan resultados futuros</li>
            <li>Las proyecciones no consideran impuestos sobre ganancias, comisiones, ni inflación variable</li>
            <li>Toda inversión conlleva riesgo, incluyendo la pérdida del capital invertido</li>
          </ul>
          <p className="font-medium">
            Antes de invertir, evalúe su tolerancia al riesgo, horizonte temporal y objetivos financieros 
            con un asesor financiero certificado (CFP).
          </p>
        </>
      ) : (
        <>
          <p className="mb-4">
            Projection tools (FIRE Calculator, Portfolio Tracker, Investment Goals) use 
            <strong> hypothetical models</strong> with the following considerations:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Projected returns are based on historical averages (typically 6-7% annually)</li>
            <li>Past performance does NOT guarantee future results</li>
            <li>Projections do not consider capital gains taxes, commissions, or variable inflation</li>
            <li>All investments carry risk, including loss of invested capital</li>
          </ul>
          <p className="font-medium">
            Before investing, evaluate your risk tolerance, time horizon, and financial goals 
            with a certified financial planner (CFP).
          </p>
        </>
      ),
    },
    {
      id: 'education',
      icon: BookOpen,
      title: isEs ? 'Contenido Educativo e Inspirado' : 'Educational & Inspired Content',
      color: 'text-purple-500',
      content: isEs ? (
        <>
          <p className="mb-4">
            El sistema de mentoría financiera de EvoFinz está <strong>inspirado en principios</strong> de expertos 
            reconocidos en educación financiera y tiene como objetivo <strong>educar sobre conceptos 
            financieros fundamentales</strong> de manera accesible.
          </p>
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 mb-4">
            <p className="text-sm font-medium mb-2">📚 Atribución de Contenido:</p>
            <ul className="text-sm space-y-1">
              <li>• "Padre Rico, Padre Pobre", "El Cuadrante del Flujo de Dinero" y conceptos relacionados son obras de <strong>Robert T. Kiyosaki</strong></li>
              <li>• "La Transformación Total de su Dinero" y principios de eliminación de deuda son de <strong>Dave Ramsey</strong></li>
              <li>• "Hábitos Atómicos" es obra de <strong>James Clear</strong></li>
              <li>• Metas SMART y principios de productividad son atribuidos a <strong>Brian Tracy</strong></li>
              <li>• "Págate Primero" y filosofía de desarrollo personal son de <strong>Jim Rohn</strong></li>
            </ul>
          </div>
          <p className="mb-4">
            <strong>Nota:</strong> EvoFinz NO está afiliada, patrocinada ni respaldada por ninguno de estos autores 
            o sus organizaciones. Las referencias son con fines educativos y de atribución adecuada.
          </p>
          <p className="mb-4">
            Las citas incluidas se utilizan bajo el principio de <strong>Uso Justo (Fair Use)</strong> con fines educativos, 
            siempre con atribución al autor original y su obra. Las citas son breves, transformativas en contexto,
            y no sustituyen la lectura de las obras originales.
          </p>
          <p className="text-sm text-muted-foreground">
            Se recomienda encarecidamente adquirir las obras originales de estos autores para una comprensión 
            completa de sus metodologías.
          </p>
        </>
      ) : (
        <>
          <p className="mb-4">
            EvoFinz's financial mentorship system is <strong>inspired by principles</strong> from recognized 
            experts in financial education and aims to <strong>educate about fundamental 
            financial concepts</strong> in an accessible way.
          </p>
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 mb-4">
            <p className="text-sm font-medium mb-2">📚 Content Attribution:</p>
            <ul className="text-sm space-y-1">
              <li>• "Rich Dad Poor Dad", "Cashflow Quadrant", "Rich Dad Poor Dad" are registered trademarks of Cashflow Technologies, Inc.</li>
              <li>• "The Total Money Makeover" and debt elimination principles are by <strong>Dave Ramsey</strong></li>
              <li>• "Atomic Habits" is a work by <strong>James Clear</strong></li>
              <li>• SMART Goals and productivity principles are attributed to <strong>Brian Tracy</strong></li>
              <li>• "Pay Yourself First" and personal development philosophy are from <strong>Jim Rohn</strong></li>
            </ul>
          </div>
          <p className="mb-4">
            <strong>Note:</strong> EvoFinz is NOT affiliated with, sponsored by, or endorsed by any of these authors 
            or their organizations. References are for educational purposes and proper attribution.
          </p>
          <p className="mb-4">
            Quotes included are used under the principle of <strong>Fair Use</strong> for educational purposes, 
            always with attribution to the original author and their work. Quotes are brief, transformative in context,
            and do not substitute reading the original works.
          </p>
          <p className="text-sm text-muted-foreground">
            It is strongly recommended to acquire the original works by these authors for a complete 
            understanding of their methodologies.
          </p>
        </>
      ),
    },
    {
      id: 'age',
      icon: UserCheck,
      title: isEs ? 'Requisito de Edad Mínima' : 'Minimum Age Requirement',
      color: 'text-teal-500',
      content: isEs ? (
        <>
          <p className="mb-4">
            EvoFinz está destinada exclusivamente para personas <strong>mayores de 18 años</strong> o que hayan 
            alcanzado la mayoría de edad en su jurisdicción, lo que sea mayor.
          </p>
          <p className="mb-4">
            Al crear una cuenta y utilizar EvoFinz, usted declara y garantiza que:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Tiene al menos 18 años de edad</li>
            <li>Tiene capacidad legal para celebrar acuerdos vinculantes</li>
            <li>No está legalmente impedido de usar este servicio en su jurisdicción</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Si descubrimos que un usuario menor de 18 años ha creado una cuenta, nos reservamos el derecho 
            de cancelarla y eliminar los datos asociados.
          </p>
        </>
      ) : (
        <>
          <p className="mb-4">
            EvoFinz is intended exclusively for individuals <strong>18 years of age or older</strong>, or who have 
            reached the age of majority in their jurisdiction, whichever is greater.
          </p>
          <p className="mb-4">
            By creating an account and using EvoFinz, you represent and warrant that:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>You are at least 18 years old</li>
            <li>You have the legal capacity to enter into binding agreements</li>
            <li>You are not legally prohibited from using this service in your jurisdiction</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            If we discover that a user under 18 has created an account, we reserve the right 
            to terminate it and delete the associated data.
          </p>
        </>
      ),
    },
    {
      id: 'contact',
      icon: Mail,
      title: isEs ? 'Resolución de Dudas y Contacto' : 'Questions & Contact',
      color: 'text-violet-500',
      content: isEs ? (
        <>
          <p className="mb-4">
            Si tienes alguna duda, problema o sugerencia, queremos escucharte. No necesitas abogados ni 
            procedimientos complicados — simplemente escríbenos:
          </p>
          <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20 mb-4">
            <p className="text-sm font-medium mb-2">📧 Contáctanos:</p>
            <p className="text-sm">
              Email: <a href="mailto:soporte@evofinz.com" className="underline underline-offset-2 hover:text-foreground transition-colors">soporte@evofinz.com</a>
            </p>
          </div>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Intentaremos responder lo antes posible</li>
            <li>Si encontraste un error, cuéntanos los detalles para que podamos solucionarlo</li>
            <li>Si tienes una sugerencia, nos encantaría escucharla</li>
            <li>Si quieres eliminar tu cuenta o tus datos, escríbenos y lo haremos</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Creemos que la mejor forma de resolver cualquier situación es hablando directamente. 
            Estamos aquí para ayudar. 💬
          </p>
        </>
      ) : (
        <>
          <p className="mb-4">
            If you have any questions, problems, or suggestions, we want to hear from you. You don't need 
            lawyers or complicated procedures — just write to us:
          </p>
          <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20 mb-4">
            <p className="text-sm font-medium mb-2">📧 Contact us:</p>
            <p className="text-sm">
              Email: <a href="mailto:support@evofinz.com" className="underline underline-offset-2 hover:text-foreground transition-colors">support@evofinz.com</a>
            </p>
          </div>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>We'll try to respond as soon as possible</li>
            <li>If you found an error, tell us the details so we can fix it</li>
            <li>If you have a suggestion, we'd love to hear it</li>
            <li>If you want to delete your account or data, write to us and we'll do it</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            We believe the best way to resolve any situation is by talking directly. 
            We're here to help. 💬
          </p>
        </>
      ),
    },
  ];

  const legalDocuments = [
    {
      icon: FileText,
      title: isEs ? 'Términos de Servicio' : 'Terms of Service',
      description: isEs 
        ? 'Suscripciones, pagos, reembolsos, propiedad intelectual y terminación de cuenta.'
        : 'Subscriptions, payments, refunds, intellectual property and account termination.',
      to: '/terms',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40',
    },
    {
      icon: Lock,
      title: isEs ? 'Política de Privacidad' : 'Privacy Policy',
      description: isEs 
        ? 'Cómo recopilamos, usamos y protegemos tus datos personales y financieros.'
        : 'How we collect, use and protect your personal and financial data.',
      to: '/privacy',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/40',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isEs ? 'Volver' : 'Back'}
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {isEs ? 'Información Legal' : 'Legal Information'}
              </h1>
              <p className="text-muted-foreground">
                {isEs ? 'Cómo funciona EvoFinz y qué debes saber' : 'How EvoFinz works and what you should know'}
              </p>
            </div>
          </div>

          {/* Quick Summary */}
          <Card className="bg-emerald-500/10 border-emerald-500/30">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Heart className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  {isEs 
                    ? 'EvoFinz es una herramienta que te ayuda a organizar tu información financiera y aprender sobre finanzas personales. No somos asesores financieros ni fiscales — somos tu compañero de organización. Para decisiones importantes, siempre consulta con un profesional certificado.'
                    : 'EvoFinz is a tool that helps you organize your financial information and learn about personal finance. We are not financial or tax advisors — we are your organization companion. For important decisions, always consult with a certified professional.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table of Contents */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <p className="text-sm font-medium mb-3">{isEs ? 'Índice:' : 'Table of Contents:'}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted/50"
                  >
                    <Icon className={`h-3.5 w-3.5 ${section.color}`} />
                    {section.title}
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.id} id={section.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${section.color}`} />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                  {section.content}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Legal Documents Navigation Cards */}
        <div className="mt-8" id="legal-docs">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {isEs ? 'Documentos Legales Completos' : 'Complete Legal Documents'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {legalDocuments.map((doc) => {
              const Icon = doc.icon;
              return (
                <Link key={doc.to} to={doc.to}>
                  <Card className={`border ${doc.bgColor} transition-all duration-200 cursor-pointer group`}>
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className="p-2.5 rounded-lg bg-background/80 shadow-sm">
                        <Icon className={`h-5 w-5 ${doc.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm mb-1">{doc.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{doc.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors mt-1 flex-shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <Separator className="my-8" />
        <div className="text-center text-sm text-muted-foreground pb-8 space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 text-left">
            <p className="text-xs font-medium mb-2">
              {isEs ? '* Uso de Marcas Registradas y Propiedad Intelectual:' : '* Trademark and Intellectual Property Notice:'}
            </p>
            <p className="text-xs">
              {isEs 
                ? 'Los nombres "Rich Dad", "Cashflow Quadrant", "Rich Dad Poor Dad" son marcas registradas de Cashflow Technologies, Inc. "The Total Money Makeover" es marca de Lampo Licensing, LLC (Dave Ramsey). "Atomic Habits" es marca de James Clear. Todos los demás nombres de libros, autores y conceptos pertenecen a sus respectivos propietarios. EvoFinz utiliza estas referencias exclusivamente con fines educativos y de atribución, bajo los principios de Uso Justo. No existe afiliación, patrocinio ni respaldo por parte de los titulares de dichas marcas.'
                : '"Rich Dad", "Cashflow Quadrant", "Rich Dad Poor Dad" are registered trademarks of Cashflow Technologies, Inc. "The Total Money Makeover" is a trademark of Lampo Licensing, LLC (Dave Ramsey). "Atomic Habits" is a trademark of James Clear. All other book names, authors, and concepts belong to their respective owners. EvoFinz uses these references solely for educational and attribution purposes, under Fair Use principles. There is no affiliation, sponsorship, or endorsement by the trademark holders.'
              }
            </p>
          </div>
          <p>© 2026 EvoFinz. {isEs ? 'Todos los derechos reservados.' : 'All rights reserved.'}</p>
          <p className="mt-2">
            {isEs 
              ? 'Última actualización: Febrero 2026'
              : 'Last updated: February 2026'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
