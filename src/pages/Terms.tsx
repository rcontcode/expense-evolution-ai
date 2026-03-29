import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, CreditCard, RefreshCw, Brain, Trash2, Scale, AlertTriangle } from 'lucide-react';

export default function Terms() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const es = language === 'es';

  const sections = [
    {
      icon: FileText,
      title: es ? '1. Aceptación de los Términos' : '1. Acceptance of Terms',
      content: es
        ? 'Al acceder y utilizar EvoFinz, aceptas estos Términos de Servicio en su totalidad. Si no estás de acuerdo con alguna parte, no debes usar el servicio. EvoFinz se reserva el derecho de modificar estos términos en cualquier momento, notificando a los usuarios por email o mediante aviso en la aplicación.'
        : 'By accessing and using EvoFinz, you accept these Terms of Service in their entirety. If you disagree with any part, you must not use the service. EvoFinz reserves the right to modify these terms at any time, notifying users via email or in-app notice.',
    },
    {
      icon: Scale,
      title: es ? '2. Descripción del Servicio' : '2. Service Description',
      content: es
        ? 'EvoFinz es una herramienta de organización y educación financiera. NO es un servicio de asesoría financiera, contable ni fiscal. La información proporcionada es de carácter educativo y organizacional. Consulta siempre con profesionales certificados antes de tomar decisiones financieras.'
        : 'EvoFinz is a financial organization and education tool. It is NOT a financial, accounting, or tax advisory service. Information provided is educational and organizational in nature. Always consult certified professionals before making financial decisions.',
    },
    {
      icon: CreditCard,
      title: es ? '3. Suscripciones y Pagos' : '3. Subscriptions & Payments',
      content: es
        ? 'EvoFinz ofrece planes gratuitos y de pago. Las suscripciones se renuevan automáticamente al final de cada período. Puedes cancelar en cualquier momento desde la configuración de tu cuenta. La cancelación toma efecto al final del período de facturación actual. No se realizan reembolsos por períodos parciales ya consumidos.'
        : 'EvoFinz offers free and paid plans. Subscriptions auto-renew at the end of each period. You can cancel anytime from your account settings. Cancellation takes effect at the end of the current billing period. No refunds are issued for partial periods already consumed.',
    },
    {
      icon: RefreshCw,
      title: es ? '4. Política de Reembolsos' : '4. Refund Policy',
      content: es
        ? 'Se pueden solicitar reembolsos dentro de los primeros 7 días de una nueva suscripción si no has utilizado las funcionalidades premium. Las solicitudes deben enviarse a través del formulario de contacto. Los reembolsos se procesan en un plazo de 5-10 días hábiles al método de pago original.'
        : 'Refunds may be requested within the first 7 days of a new subscription if you haven\'t used premium features. Requests must be submitted through the contact form. Refunds are processed within 5-10 business days to the original payment method.',
    },
    {
      icon: Brain,
      title: es ? '5. Propiedad Intelectual' : '5. Intellectual Property',
      content: es
        ? 'Todo el contenido, diseño, código, logotipos y marcas de EvoFinz son propiedad exclusiva de EvoFinz. Tus datos financieros te pertenecen a ti en todo momento. No reclamamos propiedad sobre los datos que ingresas. Puedes exportar tus datos en cualquier momento desde la configuración.'
        : 'All content, design, code, logos, and trademarks of EvoFinz are the exclusive property of EvoFinz. Your financial data belongs to you at all times. We do not claim ownership of data you input. You may export your data at any time from settings.',
    },
    {
      icon: AlertTriangle,
      title: es ? '6. Uso Aceptable' : '6. Acceptable Use',
      content: es
        ? 'Te comprometes a: no usar el servicio para actividades ilegales; no intentar acceder a datos de otros usuarios; no realizar ingeniería inversa del software; no sobrecargar intencionalmente los servidores; no compartir tu cuenta con terceros. La violación de estas condiciones puede resultar en la terminación inmediata de tu cuenta.'
        : 'You agree to: not use the service for illegal activities; not attempt to access other users\' data; not reverse-engineer the software; not intentionally overload servers; not share your account with third parties. Violation of these terms may result in immediate account termination.',
    },
    {
      icon: Trash2,
      title: es ? '7. Terminación de Cuenta' : '7. Account Termination',
      content: es
        ? 'Puedes eliminar tu cuenta en cualquier momento desde Configuración > Privacidad y Datos. Al eliminar tu cuenta: todos tus datos se eliminan permanentemente; las suscripciones activas se cancelan; esta acción es irreversible. EvoFinz se reserva el derecho de suspender o terminar cuentas que violen estos términos.'
        : 'You can delete your account at any time from Settings > Privacy & Data. When you delete your account: all your data is permanently deleted; active subscriptions are cancelled; this action is irreversible. EvoFinz reserves the right to suspend or terminate accounts that violate these terms.',
    },
    {
      icon: Scale,
      title: es ? '8. Limitación de Responsabilidad' : '8. Limitation of Liability',
      content: es
        ? 'EvoFinz se proporciona "tal cual". No garantizamos que el servicio sea ininterrumpido o libre de errores. No somos responsables por decisiones financieras basadas en información de la app, pérdida de datos por causas fuera de nuestro control, ni daños indirectos derivados del uso del servicio. Los cálculos de impuestos son aproximaciones y no reemplazan a un contador profesional.'
        : 'EvoFinz is provided "as is". We do not guarantee the service will be uninterrupted or error-free. We are not liable for financial decisions based on app information, data loss due to causes beyond our control, or indirect damages from service use. Tax calculations are approximations and do not replace a professional accountant.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={user ? '/settings' : '/landing'}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              {es ? 'Términos de Servicio' : 'Terms of Service'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {es ? 'Última actualización: Febrero 2026' : 'Last updated: February 2026'}
            </p>
          </div>
        </div>

        {/* Summary */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-1">
                {es ? 'Resumen' : 'Summary'}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {es
                  ? 'EvoFinz es una herramienta educativa de organización financiera. Tus datos te pertenecen, puedes exportarlos o eliminar tu cuenta cuando quieras. No somos asesores financieros. Usa la app bajo tu responsabilidad y consulta profesionales para decisiones importantes.'
                  : 'EvoFinz is an educational financial organization tool. Your data belongs to you, and you can export it or delete your account anytime. We are not financial advisors. Use the app at your own responsibility and consult professionals for important decisions.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <section.icon className="h-4 w-4 text-primary" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Jurisdiction */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">
              {es ? '9. Ley Aplicable' : '9. Governing Law'}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {es
                ? 'Para usuarios en Canadá: estos términos se rigen por las leyes de Canadá y la provincia de residencia del usuario. Cualquier disputa se resolverá ante los tribunales competentes de dicha jurisdicción.'
                : 'For users in Canada: these terms are governed by the laws of Canada and the user\'s province of residence. Any dispute shall be resolved before the competent courts of said jurisdiction.'}
            </p>
            <p className="text-sm text-muted-foreground">
              {es
                ? 'Para usuarios en Chile: se aplicarán las leyes de la República de Chile. Cualquier disputa se resolverá ante los tribunales ordinarios competentes de Santiago de Chile.'
                : 'For users in Chile: the laws of the Republic of Chile shall apply. Any dispute shall be resolved before the competent ordinary courts of Santiago, Chile.'}
            </p>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-8">
          © 2026 EvoFinz. {es ? 'Todos los derechos reservados.' : 'All rights reserved.'}
        </p>
      </div>
    </div>
  );
}
