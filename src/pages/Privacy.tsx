import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LanguageSelector } from '@/components/LanguageSelector';
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Database,
  Bot,
  Cookie,
  UserCheck,
  Trash2,
  Mail,
  Bell,
  ArrowLeft,
  Server,
  ShieldCheck,
  Users,
  FileText,
  Clock,
} from 'lucide-react';

export default function Privacy() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const isEs = language === 'es';

  // Scroll to hash section on load
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.hash]);

  const sections = [
    {
      id: 'summary',
      icon: Shield,
      color: 'text-emerald-500',
      title: isEs ? 'Resumen: Tus datos son tuyos' : 'Summary: Your data is yours',
      content: isEs ? (
        <>
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <p className="text-sm font-medium mb-2">🔒 Lo más importante:</p>
            <ul className="text-sm space-y-1">
              <li>• <strong>Solo tú</strong> puedes ver tus datos financieros</li>
              <li>• Otros usuarios <strong>no pueden</strong> ver nada tuyo</li>
              <li>• El administrador <strong>NO</strong> puede ver tus gastos, ingresos, clientes ni ningún dato financiero</li>
              <li>• <strong>No vendemos</strong> ni compartimos tus datos personales</li>
              <li>• Puedes exportar o eliminar tus datos cuando quieras</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            Esta política explica en detalle qué datos recopilamos, quién puede verlos, y cómo los protegemos. 
            Está escrita en lenguaje claro para que no necesites un abogado para entenderla.
          </p>
        </>
      ) : (
        <>
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <p className="text-sm font-medium mb-2">🔒 What matters most:</p>
            <ul className="text-sm space-y-1">
              <li>• <strong>Only you</strong> can see your financial data</li>
              <li>• Other users <strong>cannot</strong> see anything of yours</li>
              <li>• The administrator <strong>CANNOT</strong> see your expenses, income, clients or any financial data</li>
              <li>• We <strong>do not sell</strong> or share your personal data</li>
              <li>• You can export or delete your data anytime</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            This policy explains in detail what data we collect, who can see it, and how we protect it. 
            It's written in plain language so you don't need a lawyer to understand it.
          </p>
        </>
      ),
    },
    {
      id: 'data-collected',
      icon: Database,
      color: 'text-blue-500',
      title: isEs ? 'Datos que recopilamos' : 'Data we collect',
      content: isEs ? (
        <>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm mb-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Cuenta</Badge>
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Email y nombre (para identificarte)</li>
                <li>Preferencias de idioma y tema visual</li>
                <li>País y provincia (para cálculos fiscales)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-sm mb-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Financiero</Badge>
                <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Solo tú lo ves</Badge>
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Gastos, ingresos y presupuestos que registras</li>
                <li>Clientes, proyectos y contratos</li>
                <li>Kilometraje y registros de viaje</li>
                <li>Activos, pasivos y metas de inversión</li>
                <li>Facturas recurrentes y pagos</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-sm mb-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Documentos</Badge>
                <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Solo tú lo ves</Badge>
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Recibos y facturas subidos para OCR</li>
                <li>Contratos subidos para análisis</li>
                <li>Datos extraídos automáticamente de documentos</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-sm mb-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Uso</Badge>
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Funciones utilizadas y páginas visitadas (analítica general)</li>
                <li>Feedback y reportes de bugs (voluntario)</li>
                <li>Progreso en metas beta y puntos de tester</li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm mb-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Account</Badge>
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Email and name (to identify you)</li>
                <li>Language and theme preferences</li>
                <li>Country and province (for tax calculations)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-sm mb-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Financial</Badge>
                <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Only you see this</Badge>
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Expenses, income and budgets you record</li>
                <li>Clients, projects and contracts</li>
                <li>Mileage and trip records</li>
                <li>Assets, liabilities and investment goals</li>
                <li>Recurring bills and payments</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-sm mb-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Documents</Badge>
                <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Only you see this</Badge>
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Receipts and invoices uploaded for OCR</li>
                <li>Contracts uploaded for analysis</li>
                <li>Data automatically extracted from documents</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-sm mb-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Usage</Badge>
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Features used and pages visited (general analytics)</li>
                <li>Feedback and bug reports (voluntary)</li>
                <li>Beta goal progress and tester points</li>
              </ul>
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'who-sees',
      icon: Eye,
      color: 'text-red-500',
      title: isEs ? 'Quién puede ver tus datos' : 'Who can see your data',
      content: isEs ? (
        <>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm font-medium flex items-center gap-2 mb-1">
                <UserCheck className="h-4 w-4 text-emerald-500" /> Tú
              </p>
              <p className="text-sm">Solo tú ves todos tus datos financieros: gastos, ingresos, clientes, contratos, kilometraje, activos, pasivos, documentos y presupuestos.</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm font-medium flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-500" /> Otros usuarios
              </p>
              <p className="text-sm">Aislamiento total. Ningún otro usuario puede ver, acceder o saber nada sobre tus datos. Cada cuenta está completamente separada.</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm font-medium flex items-center gap-2 mb-1">
                <ShieldCheck className="h-4 w-4 text-amber-500" /> El administrador
              </p>
              <p className="text-sm mb-2"><strong>NO puede ver</strong> tus datos financieros. El administrador solo tiene acceso a:</p>
              <ul className="text-sm space-y-1 pl-4">
                <li>• Feedback y reportes de bugs que envías voluntariamente</li>
                <li>• Datos operativos de la app (uso de funciones, logs generales)</li>
                <li>• Códigos beta e información de invitaciones</li>
                <li>• Leads de marketing (formularios de contacto)</li>
              </ul>
              <p className="text-sm mt-2 text-muted-foreground">
                El administrador <strong>nunca</strong> puede ver tus gastos, ingresos, clientes, contratos, documentos, activos, pasivos ni ningún dato financiero personal.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <p className="text-sm font-medium flex items-center gap-2 mb-1">
                <Bot className="h-4 w-4 text-indigo-500" /> Proveedores de IA
              </p>
              <p className="text-sm">Reciben datos temporalmente para procesamiento (OCR de recibos, asistente conversacional). No almacenan tus datos permanentemente. Ver sección <a href="#ai-processing" className="text-primary hover:underline">Procesamiento por IA</a>.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-500/10 border border-slate-500/20">
              <p className="text-sm font-medium flex items-center gap-2 mb-1">
                <EyeOff className="h-4 w-4 text-slate-500" /> Terceros
              </p>
              <p className="text-sm"><strong>No vendemos ni compartimos</strong> datos personales con terceros para publicidad, marketing ni ningún otro fin comercial.</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm font-medium flex items-center gap-2 mb-1">
                <UserCheck className="h-4 w-4 text-emerald-500" /> You
              </p>
              <p className="text-sm">Only you can see all your financial data: expenses, income, clients, contracts, mileage, assets, liabilities, documents, and budgets.</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm font-medium flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-500" /> Other users
              </p>
              <p className="text-sm">Total isolation. No other user can see, access, or know anything about your data. Each account is completely separated.</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm font-medium flex items-center gap-2 mb-1">
                <ShieldCheck className="h-4 w-4 text-amber-500" /> The administrator
              </p>
              <p className="text-sm mb-2"><strong>CANNOT see</strong> your financial data. The administrator only has access to:</p>
              <ul className="text-sm space-y-1 pl-4">
                <li>• Feedback and bug reports you voluntarily submit</li>
                <li>• App operational data (feature usage, general logs)</li>
                <li>• Beta codes and invitation information</li>
                <li>• Marketing leads (contact forms)</li>
              </ul>
              <p className="text-sm mt-2 text-muted-foreground">
                The administrator can <strong>never</strong> see your expenses, income, clients, contracts, documents, assets, liabilities, or any personal financial data.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <p className="text-sm font-medium flex items-center gap-2 mb-1">
                <Bot className="h-4 w-4 text-indigo-500" /> AI providers
              </p>
              <p className="text-sm">Receive data temporarily for processing (receipt OCR, conversational assistant). They do not permanently store your data. See <a href="#ai-processing" className="text-primary hover:underline">AI Processing</a> section.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-500/10 border border-slate-500/20">
              <p className="text-sm font-medium flex items-center gap-2 mb-1">
                <EyeOff className="h-4 w-4 text-slate-500" /> Third parties
              </p>
              <p className="text-sm"><strong>We do not sell or share</strong> personal data with third parties for advertising, marketing, or any other commercial purpose.</p>
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'protection',
      icon: Lock,
      color: 'text-green-500',
      title: isEs ? 'Cómo protegemos tus datos' : 'How we protect your data',
      content: isEs ? (
        <>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Server className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Encriptación en tránsito y reposo</p>
                <p className="text-sm text-muted-foreground">Todos los datos viajan encriptados (TLS/SSL) y se almacenan encriptados en servidores seguros.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Aislamiento por usuario (Row Level Security)</p>
                <p className="text-sm text-muted-foreground">Cada cuenta solo puede acceder a sus propios datos. Esta restricción se aplica a nivel de base de datos, no solo en la interfaz. Es técnicamente imposible que otro usuario vea tus datos.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Autenticación requerida</p>
                <p className="text-sm text-muted-foreground">No hay acceso anónimo a datos personales. Toda operación requiere verificar tu identidad.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Sin acceso directo del admin a datos financieros</p>
                <p className="text-sm text-muted-foreground">Las políticas de seguridad de la base de datos no incluyen excepciones para administradores en tablas de datos financieros.</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Server className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Encryption in transit and at rest</p>
                <p className="text-sm text-muted-foreground">All data travels encrypted (TLS/SSL) and is stored encrypted on secure servers.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Per-user isolation (Row Level Security)</p>
                <p className="text-sm text-muted-foreground">Each account can only access its own data. This restriction is enforced at the database level, not just the interface. It is technically impossible for another user to see your data.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Authentication required</p>
                <p className="text-sm text-muted-foreground">There is no anonymous access to personal data. Every operation requires verifying your identity.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">No direct admin access to financial data</p>
                <p className="text-sm text-muted-foreground">Database security policies do not include exceptions for administrators on financial data tables.</p>
              </div>
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'cookies',
      icon: Cookie,
      color: 'text-amber-500',
      title: isEs ? 'Cookies y almacenamiento local' : 'Cookies & local storage',
      content: isEs ? (
        <>
          <p className="text-sm mb-3">Almacenamos en tu navegador:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Sesión de autenticación</strong> — para mantenerte logueado</li>
            <li><strong>Preferencia de idioma</strong> — español o inglés</li>
            <li><strong>Preferencia de tema</strong> — claro u oscuro</li>
            <li><strong>Consentimiento de cookies</strong> — tu elección</li>
            <li><strong>Estado del sidebar</strong> — colapsado o expandido</li>
            <li><strong>Entidad fiscal activa</strong> — cuál entidad seleccionaste</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            No usamos cookies de rastreo publicitario. Las cookies analíticas son opcionales y puedes desactivarlas.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm mb-3">We store in your browser:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Authentication session</strong> — to keep you logged in</li>
            <li><strong>Language preference</strong> — Spanish or English</li>
            <li><strong>Theme preference</strong> — light or dark</li>
            <li><strong>Cookie consent</strong> — your choice</li>
            <li><strong>Sidebar state</strong> — collapsed or expanded</li>
            <li><strong>Active fiscal entity</strong> — which entity you selected</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            We do not use advertising tracking cookies. Analytics cookies are optional and can be disabled.
          </p>
        </>
      ),
    },
    {
      id: 'rights',
      icon: UserCheck,
      color: 'text-purple-500',
      title: isEs ? 'Tus derechos' : 'Your rights',
      content: isEs ? (
        <>
          <p className="text-sm mb-3">Tienes derecho a:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Eye className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
              <p className="text-sm"><strong>Acceso:</strong> Ver todos los datos que tenemos sobre ti, directamente desde la app.</p>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
              <p className="text-sm"><strong>Exportación:</strong> Descargar tus datos en Excel/CSV desde cualquier sección.</p>
            </div>
            <div className="flex items-start gap-2">
              <Trash2 className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
              <p className="text-sm"><strong>Eliminación:</strong> Eliminar tu cuenta y todos tus datos en cualquier momento.</p>
            </div>
            <div className="flex items-start gap-2">
              <Database className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
              <p className="text-sm"><strong>Portabilidad:</strong> Exportar tus datos en formatos estándar para llevarlos a otro servicio.</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Estos derechos aplican bajo PIPEDA (Canadá), GDPR (UE) y legislación chilena de protección de datos.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm mb-3">You have the right to:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Eye className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
              <p className="text-sm"><strong>Access:</strong> View all data we have about you, directly from the app.</p>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
              <p className="text-sm"><strong>Export:</strong> Download your data in Excel/CSV from any section.</p>
            </div>
            <div className="flex items-start gap-2">
              <Trash2 className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
              <p className="text-sm"><strong>Deletion:</strong> Delete your account and all your data at any time.</p>
            </div>
            <div className="flex items-start gap-2">
              <Database className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
              <p className="text-sm"><strong>Portability:</strong> Export your data in standard formats to take to another service.</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            These rights apply under PIPEDA (Canada), GDPR (EU) and Chilean data protection legislation.
          </p>
        </>
      ),
    },
    {
      id: 'ai-processing',
      icon: Bot,
      color: 'text-indigo-500',
      title: isEs ? 'Procesamiento por IA' : 'AI Processing',
      content: isEs ? (
        <>
          <p className="text-sm mb-3">EvoFinz usa inteligencia artificial para:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm mb-4">
            <li>Extraer datos de recibos y facturas (OCR)</li>
            <li>Asistente conversacional financiero</li>
            <li>Categorización y análisis de gastos</li>
            <li>Sugerencias personalizadas</li>
          </ul>
          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <p className="text-sm font-medium mb-2">¿Qué pasa con tus datos cuando se procesan por IA?</p>
            <ul className="text-sm space-y-1">
              <li>• Se envían <strong>solo los datos necesarios</strong> para la tarea específica</li>
              <li>• Los proveedores de IA procesan y devuelven resultados — <strong>no almacenan</strong> tus datos permanentemente</li>
              <li>• Las respuestas de IA pueden contener errores y deben <strong>verificarse manualmente</strong></li>
              <li>• No se usa tu información para entrenar modelos de IA de terceros</li>
            </ul>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm mb-3">EvoFinz uses artificial intelligence for:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm mb-4">
            <li>Extracting data from receipts and invoices (OCR)</li>
            <li>Conversational financial assistant</li>
            <li>Expense categorization and analysis</li>
            <li>Personalized suggestions</li>
          </ul>
          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <p className="text-sm font-medium mb-2">What happens to your data when processed by AI?</p>
            <ul className="text-sm space-y-1">
              <li>• <strong>Only the necessary data</strong> for the specific task is sent</li>
              <li>• AI providers process and return results — they <strong>do not permanently store</strong> your data</li>
              <li>• AI responses may contain errors and must be <strong>manually verified</strong></li>
              <li>• Your information is not used to train third-party AI models</li>
            </ul>
          </div>
        </>
      ),
    },
    {
      id: 'retention',
      icon: Clock,
      color: 'text-orange-500',
      title: isEs ? 'Retención de datos' : 'Data retention',
      content: isEs ? (
        <>
          <ul className="space-y-2 text-sm">
            <li><strong>Mientras tu cuenta está activa:</strong> Tus datos se conservan indefinidamente para que puedas acceder a tu historial.</li>
            <li><strong>Datos eliminados (papelera):</strong> Los elementos en la papelera se pueden restaurar. La eliminación permanente borra los datos de forma irrecuperable.</li>
            <li><strong>Al eliminar tu cuenta:</strong> Todos tus datos personales y financieros se eliminan dentro de 30 días.</li>
            <li><strong>Datos anónimos:</strong> Podemos retener datos agregados y anonimizados (ej: "X usuarios usaron la función Y") para estadísticas generales.</li>
          </ul>
        </>
      ) : (
        <>
          <ul className="space-y-2 text-sm">
            <li><strong>While your account is active:</strong> Your data is kept indefinitely so you can access your history.</li>
            <li><strong>Deleted data (trash):</strong> Items in the trash can be restored. Permanent deletion erases data irreversibly.</li>
            <li><strong>Upon account deletion:</strong> All your personal and financial data is deleted within 30 days.</li>
            <li><strong>Anonymous data:</strong> We may retain aggregated, anonymized data (e.g., "X users used feature Y") for general statistics.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'contact',
      icon: Mail,
      color: 'text-cyan-500',
      title: isEs ? 'Contacto' : 'Contact',
      content: isEs ? (
        <>
          <p className="text-sm mb-3">Para preguntas sobre privacidad o tus datos:</p>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm">📧 Email: <a href="mailto:privacy@evofinz.com" className="text-primary hover:underline">privacy@evofinz.com</a></p>
            <p className="text-sm mt-1">📧 Soporte: <a href="mailto:support@evofinz.com" className="text-primary hover:underline">support@evofinz.com</a></p>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Respondemos solicitudes de privacidad dentro de 30 días hábiles, conforme a las regulaciones aplicables.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm mb-3">For questions about privacy or your data:</p>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm">📧 Email: <a href="mailto:privacy@evofinz.com" className="text-primary hover:underline">privacy@evofinz.com</a></p>
            <p className="text-sm mt-1">📧 Support: <a href="mailto:support@evofinz.com" className="text-primary hover:underline">support@evofinz.com</a></p>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            We respond to privacy requests within 30 business days, in accordance with applicable regulations.
          </p>
        </>
      ),
    },
    {
      id: 'updates',
      icon: Bell,
      color: 'text-pink-500',
      title: isEs ? 'Actualizaciones de esta política' : 'Updates to this policy',
      content: isEs ? (
        <>
          <p className="text-sm">
            Podemos actualizar esta política de privacidad periódicamente. Si hacemos cambios importantes:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm mt-2">
            <li>Publicaremos la versión actualizada en esta página</li>
            <li>Te notificaremos dentro de la app si los cambios son significativos</li>
            <li>Actualizaremos la fecha de "última modificación" al final</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            Continuar usando EvoFinz después de cambios significa que aceptas la política actualizada.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm">
            We may update this privacy policy periodically. If we make significant changes:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm mt-2">
            <li>We'll post the updated version on this page</li>
            <li>We'll notify you within the app if changes are significant</li>
            <li>We'll update the "last modified" date at the bottom</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            Continuing to use EvoFinz after changes means you accept the updated policy.
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={user ? '/dashboard' : '/landing'}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {isEs ? 'Volver' : 'Back'}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              {isEs ? 'Política de Privacidad' : 'Privacy Policy'}
            </Badge>
            <LanguageSelector />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">
            {isEs ? '🔒 Política de Privacidad' : '🔒 Privacy Policy'}
          </h1>
          <p className="text-muted-foreground">
            EvoFinz — {isEs ? 'Última actualización: Febrero 2026' : 'Last updated: February 2026'}
          </p>
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
        <div className="text-center text-sm text-muted-foreground pb-8 space-y-2">
          <p>
            <Link to="/legal" className="text-primary hover:underline">
              {isEs ? 'Ver Términos de Uso y Aviso Legal' : 'View Terms of Use and Legal Notice'}
            </Link>
          </p>
          <p>© 2026 EvoFinz. {isEs ? 'Todos los derechos reservados.' : 'All rights reserved.'}</p>
          <p>{isEs ? 'Última actualización: Febrero 2026' : 'Last updated: February 2026'}</p>
        </div>
      </div>
    </div>
  );
}
