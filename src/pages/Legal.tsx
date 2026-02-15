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
  Building2,
  Bot,
  UserCheck,
  Gavel,
  MapPin,
  ShieldAlert
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
      id: 'liability',
      icon: ShieldAlert,
      title: isEs ? 'Limitación de Responsabilidad' : 'Limitation of Liability',
      color: 'text-red-500',
      content: isEs ? (
        <>
          <p className="mb-4">
            <strong>EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY APLICABLE:</strong>
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>EvoFinz, sus creadores, desarrolladores, colaboradores y afiliados <strong>no serán responsables</strong> por 
            daños directos, indirectos, incidentales, especiales, consecuentes o punitivos de ningún tipo.</li>
            <li>Esto incluye, sin limitación: pérdidas financieras, pérdida de datos, pérdida de beneficios, 
            o cualquier daño derivado del uso o la imposibilidad de uso de la aplicación.</li>
            <li>La responsabilidad total acumulada de EvoFinz por cualquier reclamación no excederá el monto 
            pagado por el usuario en los últimos 12 meses por el uso del servicio, o $100 USD, lo que sea menor.</li>
            <li>El usuario reconoce que utiliza EvoFinz <strong>bajo su propio riesgo</strong> y que es el único 
            responsable de las decisiones financieras que tome.</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Esta limitación se aplica independientemente de la teoría legal bajo la cual se presente la reclamación 
            (contrato, agravio, negligencia, responsabilidad objetiva u otra).
          </p>
        </>
      ) : (
        <>
          <p className="mb-4">
            <strong>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:</strong>
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>EvoFinz, its creators, developers, contributors, and affiliates <strong>shall not be liable</strong> for 
            any direct, indirect, incidental, special, consequential, or punitive damages of any kind.</li>
            <li>This includes, without limitation: financial losses, data loss, loss of profits, 
            or any damages arising from the use or inability to use the application.</li>
            <li>EvoFinz's total cumulative liability for any claim shall not exceed the amount 
            paid by the user in the last 12 months for the service, or $100 USD, whichever is less.</li>
            <li>The user acknowledges that they use EvoFinz <strong>at their own risk</strong> and are solely 
            responsible for any financial decisions they make.</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            This limitation applies regardless of the legal theory under which the claim is brought 
            (contract, tort, negligence, strict liability, or otherwise).
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
            <li>Asistente financiero conversacional ("Phoenix")</li>
            <li>Extracción automática de datos de documentos (OCR)</li>
            <li>Análisis y categorización de gastos</li>
            <li>Sugerencias y recomendaciones personalizadas</li>
          </ul>
          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <p className="text-sm font-medium mb-2">⚠️ {isEs ? 'Advertencia sobre IA:' : 'AI Warning:'}</p>
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
            <li>Conversational financial assistant ("Phoenix")</li>
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
              <li>• "Rich Dad Poor Dad", "Cashflow Quadrant" and related concepts are works by <strong>Robert T. Kiyosaki</strong></li>
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
      id: 'privacy',
      icon: Lock,
      title: isEs ? 'Privacidad y Datos' : 'Privacy & Data',
      color: 'text-cyan-500',
      content: isEs ? (
        <>
          <p className="mb-4 font-medium">
            EvoFinz toma la privacidad de sus datos seriamente. Esta sección describe cómo recopilamos, 
            usamos y protegemos su información.
          </p>
          
          <p className="font-medium text-sm mb-2">Datos que recopilamos:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Información de cuenta (email, nombre)</li>
            <li>Datos financieros que usted ingresa voluntariamente (ingresos, gastos, activos, deudas)</li>
            <li>Documentos que sube para procesamiento (facturas, recibos)</li>
            <li>Datos de uso y navegación dentro de la aplicación</li>
          </ul>

          <p className="font-medium text-sm mb-2">Cómo usamos sus datos:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Para proporcionar las funcionalidades de la aplicación</li>
            <li>Para procesamiento por IA (OCR, asistente, análisis) — sus datos pueden ser enviados a 
            proveedores de IA de terceros para procesamiento, sujetos a sus políticas de privacidad</li>
            <li>Para mejorar la experiencia del usuario y el servicio</li>
            <li>Para comunicaciones relacionadas con el servicio</li>
          </ul>

          <p className="font-medium text-sm mb-2">Protección de datos:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Sus datos financieros se almacenan de forma segura y encriptada</li>
            <li>No vendemos su información personal a terceros</li>
            <li>No compartimos datos personales identificables para fines publicitarios</li>
            <li>Usted puede exportar o solicitar eliminación de sus datos en cualquier momento</li>
          </ul>

          <p className="font-medium text-sm mb-2">Cookies y tecnologías similares:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Utilizamos cookies esenciales para el funcionamiento de la aplicación (sesión, autenticación)</li>
            <li>Podemos utilizar cookies analíticas para entender patrones de uso</li>
            <li>No utilizamos cookies de seguimiento publicitario de terceros</li>
          </ul>

          <p className="font-medium text-sm mb-2">Retención de datos:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Los datos de su cuenta se retienen mientras mantenga una cuenta activa</li>
            <li>Al eliminar su cuenta, sus datos serán eliminados dentro de 30 días</li>
            <li>Podemos retener datos anonimizados y agregados para análisis estadístico</li>
          </ul>

          <p className="text-sm text-muted-foreground">
            Al usar EvoFinz, usted acepta estos términos y reconoce que la aplicación es una herramienta 
            educativa, no un sustituto del asesoramiento profesional.
          </p>
        </>
      ) : (
        <>
          <p className="mb-4 font-medium">
            EvoFinz takes your data privacy seriously. This section describes how we collect, 
            use, and protect your information.
          </p>
          
          <p className="font-medium text-sm mb-2">Data we collect:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Account information (email, name)</li>
            <li>Financial data you voluntarily enter (income, expenses, assets, debts)</li>
            <li>Documents you upload for processing (invoices, receipts)</li>
            <li>Usage and navigation data within the application</li>
          </ul>

          <p className="font-medium text-sm mb-2">How we use your data:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>To provide application functionality</li>
            <li>For AI processing (OCR, assistant, analysis) — your data may be sent to 
            third-party AI providers for processing, subject to their privacy policies</li>
            <li>To improve user experience and service</li>
            <li>For service-related communications</li>
          </ul>

          <p className="font-medium text-sm mb-2">Data protection:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Your financial data is stored securely and encrypted</li>
            <li>We do not sell your personal information to third parties</li>
            <li>We do not share personally identifiable data for advertising purposes</li>
            <li>You can export or request deletion of your data at any time</li>
          </ul>

          <p className="font-medium text-sm mb-2">Cookies and similar technologies:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>We use essential cookies for application functionality (session, authentication)</li>
            <li>We may use analytical cookies to understand usage patterns</li>
            <li>We do not use third-party advertising tracking cookies</li>
          </ul>

          <p className="font-medium text-sm mb-2">Data retention:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Your account data is retained while you maintain an active account</li>
            <li>Upon account deletion, your data will be deleted within 30 days</li>
            <li>We may retain anonymized and aggregated data for statistical analysis</li>
          </ul>

          <p className="text-sm text-muted-foreground">
            By using EvoFinz, you accept these terms and acknowledge that the application is an 
            educational tool, not a substitute for professional advice.
          </p>
        </>
      ),
    },
    {
      id: 'indemnification',
      icon: Gavel,
      title: isEs ? 'Indemnización' : 'Indemnification',
      color: 'text-rose-500',
      content: isEs ? (
        <>
          <p className="mb-4">
            Usted acepta indemnizar, defender y mantener indemne a EvoFinz, sus creadores, desarrolladores, 
            directores, empleados y agentes de y contra cualquier reclamación, demanda, daño, pérdida, 
            costo o gasto (incluyendo honorarios razonables de abogados) que surja de:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Su uso de la aplicación</li>
            <li>Decisiones financieras tomadas basándose en información proporcionada por EvoFinz</li>
            <li>Su violación de estos Términos de Uso</li>
            <li>Su violación de cualquier ley o regulación aplicable</li>
            <li>Cualquier contenido o datos que usted proporcione a través de la aplicación</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Esta obligación de indemnización sobrevivirá la terminación de su cuenta y su uso de EvoFinz.
          </p>
        </>
      ) : (
        <>
          <p className="mb-4">
            You agree to indemnify, defend, and hold harmless EvoFinz, its creators, developers, 
            directors, employees, and agents from and against any claims, demands, damages, losses, 
            costs, or expenses (including reasonable attorney fees) arising from:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Your use of the application</li>
            <li>Financial decisions made based on information provided by EvoFinz</li>
            <li>Your violation of these Terms of Use</li>
            <li>Your violation of any applicable law or regulation</li>
            <li>Any content or data you provide through the application</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            This indemnification obligation will survive the termination of your account and your use of EvoFinz.
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
            <li>No utilizará la aplicación para actividades ilegales o fraudulentas</li>
            <li>No intentará acceder a datos de otros usuarios o vulnerar la seguridad del sistema</li>
          </ul>
          <p className="font-medium text-sm">
            EvoFinz se reserva el derecho de modificar estos términos en cualquier momento. Los cambios 
            significativos serán notificados. El uso continuado de la aplicación después de los cambios 
            constituye la aceptación de los términos modificados.
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
            <li>You will not use the application for illegal or fraudulent activities</li>
            <li>You will not attempt to access other users' data or breach system security</li>
          </ul>
          <p className="font-medium text-sm">
            EvoFinz reserves the right to modify these terms at any time. Significant changes 
            will be notified. Continued use of the application after changes constitutes 
            acceptance of the modified terms.
          </p>
        </>
      ),
    },
    {
      id: 'jurisdiction',
      icon: MapPin,
      title: isEs ? 'Ley Aplicable y Jurisdicción' : 'Governing Law & Jurisdiction',
      color: 'text-slate-500',
      content: isEs ? (
        <>
          <p className="mb-4">
            Estos Términos de Uso se regirán e interpretarán de acuerdo con las leyes de <strong>Canadá</strong>, 
            sin tener en cuenta sus disposiciones sobre conflictos de leyes.
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Cualquier disputa que surja de estos términos o del uso de EvoFinz se someterá a la 
            jurisdicción exclusiva de los tribunales competentes de la provincia de residencia del 
            operador de EvoFinz en Canadá.</li>
            <li>Antes de iniciar cualquier procedimiento legal, las partes acuerdan intentar resolver 
            la disputa de buena fe mediante negociación directa durante un período mínimo de 30 días.</li>
            <li>Si la disputa no se resuelve por negociación, las partes pueden acordar someterse a 
            mediación antes de recurrir a los tribunales.</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Si alguna disposición de estos términos se considera inválida o inaplicable, las disposiciones 
            restantes permanecerán en pleno vigor y efecto.
          </p>
        </>
      ) : (
        <>
          <p className="mb-4">
            These Terms of Use shall be governed by and construed in accordance with the laws of <strong>Canada</strong>, 
            without regard to its conflict of law provisions.
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Any dispute arising from these terms or the use of EvoFinz shall be subject to the 
            exclusive jurisdiction of the competent courts in the province of residence of the 
            EvoFinz operator in Canada.</li>
            <li>Before initiating any legal proceedings, the parties agree to attempt to resolve 
            the dispute in good faith through direct negotiation for a minimum period of 30 days.</li>
            <li>If the dispute is not resolved by negotiation, the parties may agree to submit to 
            mediation before resorting to the courts.</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            If any provision of these terms is found to be invalid or unenforceable, the remaining 
            provisions shall remain in full force and effect.
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
