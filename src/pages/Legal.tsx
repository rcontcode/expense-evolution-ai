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
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Building2
} from 'lucide-react';

export default function Legal() {
  const { language } = useLanguage();
  const isEs = language === 'es';

  const sections = [
    {
      id: 'disclaimer',
      icon: AlertTriangle,
      title: isEs ? 'Descargo de Responsabilidad' : 'Disclaimer',
      color: 'text-amber-500',
      content: isEs ? (
        <>
          <p className="mb-4">
            <strong>AVISO IMPORTANTE:</strong> La información, herramientas y cálculos proporcionados por EvoFinz son 
            únicamente con <strong>fines educativos e informativos</strong>. Esta aplicación NO proporciona:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Asesoría financiera personalizada</li>
            <li>Asesoría fiscal o tributaria</li>
            <li>Asesoría legal</li>
            <li>Recomendaciones de inversión</li>
            <li>Planificación de jubilación profesional</li>
          </ul>
          <p className="mb-4">
            Las estimaciones fiscales, proyecciones de inversión, y cálculos de ahorro son <strong>aproximados</strong> y 
            basados en supuestos generales. Cada situación financiera es única y requiere evaluación profesional.
          </p>
          <p className="font-medium">
            SIEMPRE consulte con profesionales certificados (CPA, CFP, abogados) antes de tomar decisiones 
            financieras importantes. EvoFinz y sus creadores no se hacen responsables de las decisiones 
            tomadas basándose en la información proporcionada por esta aplicación.
          </p>
        </>
      ) : (
        <>
          <p className="mb-4">
            <strong>IMPORTANT NOTICE:</strong> The information, tools, and calculations provided by EvoFinz are 
            for <strong>educational and informational purposes only</strong>. This application does NOT provide:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Personalized financial advice</li>
            <li>Tax or fiscal advice</li>
            <li>Legal advice</li>
            <li>Investment recommendations</li>
            <li>Professional retirement planning</li>
          </ul>
          <p className="mb-4">
            Tax estimates, investment projections, and savings calculations are <strong>approximate</strong> and 
            based on general assumptions. Each financial situation is unique and requires professional evaluation.
          </p>
          <p className="font-medium">
            ALWAYS consult with certified professionals (CPA, CFP, attorneys) before making important 
            financial decisions. EvoFinz and its creators are not responsible for decisions made based 
            on the information provided by this application.
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
      title: isEs ? 'Contenido Educativo' : 'Educational Content',
      color: 'text-purple-500',
      content: isEs ? (
        <>
          <p className="mb-4">
            El sistema de mentoría financiera de EvoFinz está inspirado en principios de expertos reconocidos 
            (Robert Kiyosaki, Jim Rohn, Brian Tracy) y tiene como objetivo <strong>educar sobre conceptos 
            financieros fundamentales</strong>.
          </p>
          <p className="mb-4">
            Los conceptos como el Cuadrante del Flujo de Dinero, clasificación de deudas, y metas SMART 
            son marcos educativos generales que pueden no aplicar directamente a su situación personal.
          </p>
          <p className="text-sm text-muted-foreground">
            Este contenido no reemplaza la educación financiera formal ni el asesoramiento profesional 
            personalizado. Use estos conceptos como punto de partida para su aprendizaje financiero.
          </p>
        </>
      ) : (
        <>
          <p className="mb-4">
            EvoFinz's financial mentorship system is inspired by principles from recognized experts 
            (Robert Kiyosaki, Jim Rohn, Brian Tracy) and aims to <strong>educate about fundamental 
            financial concepts</strong>.
          </p>
          <p className="mb-4">
            Concepts like the Cashflow Quadrant, debt classification, and SMART goals are general 
            educational frameworks that may not directly apply to your personal situation.
          </p>
          <p className="text-sm text-muted-foreground">
            This content does not replace formal financial education or personalized professional 
            advice. Use these concepts as a starting point for your financial learning.
          </p>
        </>
      ),
    },
    {
      id: 'privacy',
      icon: Lock,
      title: isEs ? 'Privacidad y Datos' : 'Privacy & Data',
      color: 'text-cyan-500',
      content: isEs ? (
        <>
          <p className="mb-4">
            EvoFinz toma la privacidad de sus datos seriamente:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Sus datos financieros se almacenan de forma segura y encriptada</li>
            <li>No vendemos ni compartimos su información personal con terceros</li>
            <li>Los datos se utilizan exclusivamente para proporcionar las funcionalidades de la aplicación</li>
            <li>Usted puede exportar o eliminar sus datos en cualquier momento</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Al usar EvoFinz, usted acepta estos términos y reconoce que la aplicación es una herramienta 
            educativa, no un sustituto del asesoramiento profesional.
          </p>
        </>
      ) : (
        <>
          <p className="mb-4">
            EvoFinz takes your data privacy seriously:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Your financial data is stored securely and encrypted</li>
            <li>We do not sell or share your personal information with third parties</li>
            <li>Data is used exclusively to provide application functionality</li>
            <li>You can export or delete your data at any time</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            By using EvoFinz, you accept these terms and acknowledge that the application is an 
            educational tool, not a substitute for professional advice.
          </p>
        </>
      ),
    },
    {
      id: 'terms',
      icon: FileText,
      title: isEs ? 'Términos de Uso' : 'Terms of Use',
      color: 'text-orange-500',
      content: isEs ? (
        <>
          <p className="mb-4">
            Al utilizar EvoFinz, usted acepta que:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Utilizará la aplicación únicamente con fines personales y educativos</li>
            <li>Comprende que toda la información es aproximada y educativa</li>
            <li>Consultará profesionales certificados antes de tomar decisiones financieras importantes</li>
            <li>No responsabilizará a EvoFinz ni a sus creadores por decisiones financieras tomadas</li>
            <li>Proporcionará información precisa para obtener estimaciones más útiles</li>
          </ul>
          <p className="font-medium text-sm">
            EvoFinz se reserva el derecho de modificar estos términos. El uso continuado de la aplicación 
            constituye la aceptación de cualquier cambio.
          </p>
        </>
      ) : (
        <>
          <p className="mb-4">
            By using EvoFinz, you agree that:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>You will use the application only for personal and educational purposes</li>
            <li>You understand that all information is approximate and educational</li>
            <li>You will consult certified professionals before making important financial decisions</li>
            <li>You will not hold EvoFinz or its creators responsible for financial decisions made</li>
            <li>You will provide accurate information to obtain more useful estimates</li>
          </ul>
          <p className="font-medium text-sm">
            EvoFinz reserves the right to modify these terms. Continued use of the application 
            constitutes acceptance of any changes.
          </p>
        </>
      ),
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
                {isEs ? 'Términos, privacidad y descargos de responsabilidad' : 'Terms, privacy, and disclaimers'}
              </p>
            </div>
          </div>

          {/* Quick Summary */}
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  {isEs 
                    ? 'EvoFinz es una herramienta educativa. Toda la información, cálculos y proyecciones son aproximados y no constituyen asesoría profesional. Consulte siempre con profesionales certificados (CPA, CFP, abogados) para decisiones financieras importantes.'
                    : 'EvoFinz is an educational tool. All information, calculations, and projections are approximate and do not constitute professional advice. Always consult certified professionals (CPA, CFP, attorneys) for important financial decisions.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

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

        {/* Footer */}
        <Separator className="my-8" />
        <div className="text-center text-sm text-muted-foreground pb-8">
          <p>© 2026 EvoFinz. {isEs ? 'Todos los derechos reservados.' : 'All rights reserved.'}</p>
          <p className="mt-2">
            {isEs 
              ? 'Última actualización: Enero 2026'
              : 'Last updated: January 2026'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
