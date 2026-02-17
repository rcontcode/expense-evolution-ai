import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Flame, Target, Heart, Shield, Globe } from 'lucide-react';
import { SocialLinks } from '@/components/SocialLinks';
import { PhoenixLogo } from '@/components/ui/phoenix-logo';

export default function About() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const es = language === 'es';

  const values = [
    {
      icon: Shield,
      title: es ? 'Privacidad Primero' : 'Privacy First',
      desc: es
        ? 'Tus datos financieros son tuyos. Nunca los vendemos ni compartimos.'
        : 'Your financial data is yours. We never sell or share it.',
    },
    {
      icon: Target,
      title: es ? 'Simplicidad' : 'Simplicity',
      desc: es
        ? 'Herramientas poderosas que cualquiera puede usar sin ser contador.'
        : 'Powerful tools anyone can use without being an accountant.',
    },
    {
      icon: Globe,
      title: es ? 'Bilingüe y Multicultural' : 'Bilingual & Multicultural',
      desc: es
        ? 'Diseñado para profesionales en Canadá y Chile, en español e inglés.'
        : 'Designed for professionals in Canada and Chile, in Spanish and English.',
    },
    {
      icon: Heart,
      title: es ? 'Educación Financiera' : 'Financial Education',
      desc: es
        ? 'No solo organizamos datos — ayudamos a entender tus finanzas.'
        : 'We don\'t just organize data — we help you understand your finances.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link to={user ? '/dashboard' : '/landing'}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            {es ? 'Sobre EvoFinz' : 'About EvoFinz'}
          </h1>
        </div>

        {/* Hero */}
        <Card className="mb-8 overflow-hidden">
          <CardContent className="p-8 text-center space-y-4">
            <PhoenixLogo variant="hero" showText={false} />
            <div className="flex items-center justify-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <h2 className="text-xl font-display font-bold">
                {es ? 'Evoluciona tus Finanzas' : 'Evolve your Finances'}
              </h2>
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {es
                ? 'EvoFinz nació de la necesidad real de un profesional independiente que vivía entre Canadá y Chile, gestionando gastos en múltiples monedas, idiomas y sistemas tributarios. No encontramos la herramienta perfecta, así que la construimos.'
                : 'EvoFinz was born from the real need of a freelance professional living between Canada and Chile, managing expenses in multiple currencies, languages, and tax systems. We couldn\'t find the perfect tool, so we built it.'}
            </p>
          </CardContent>
        </Card>

        {/* Mission */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              {es ? 'Nuestra Misión' : 'Our Mission'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {es
                ? 'Democratizar la organización financiera para profesionales independientes, familias y pequeñas empresas. Hacer que gestionar dinero sea tan simple como enviar un mensaje, sin importar el país o idioma.'
                : 'Democratize financial organization for freelancers, families, and small businesses. Make managing money as simple as sending a message, regardless of country or language.'}
            </p>
          </CardContent>
        </Card>

        {/* Values */}
        <h3 className="font-semibold mb-4">{es ? 'Nuestros Valores' : 'Our Values'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {values.map((v, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <v.icon className="h-5 w-5 text-primary mb-2" />
                <h4 className="font-medium mb-1">{v.title}</h4>
                <p className="text-xs text-muted-foreground">{v.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Social */}
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <h3 className="font-semibold">{es ? 'Conéctate con Nosotros' : 'Connect with Us'}</h3>
            <SocialLinks iconSize="md" />
            <p className="text-xs text-muted-foreground">
              {es
                ? '¿Preguntas? Usa el formulario de contacto en cualquier página.'
                : 'Questions? Use the contact form on any page.'}
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
