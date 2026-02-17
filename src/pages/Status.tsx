import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, Shield, Database, Globe, Cpu } from 'lucide-react';

export default function Status() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const es = language === 'es';

  const services = [
    { name: es ? 'Aplicación Web' : 'Web Application', icon: Globe, status: 'operational' },
    { name: es ? 'Base de Datos' : 'Database', icon: Database, status: 'operational' },
    { name: es ? 'Autenticación' : 'Authentication', icon: Shield, status: 'operational' },
    { name: es ? 'Procesamiento IA' : 'AI Processing', icon: Cpu, status: 'operational' },
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
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              {es ? 'Estado del Sistema' : 'System Status'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {es ? 'Última verificación: ' : 'Last checked: '}
              {new Date().toLocaleDateString(es ? 'es' : 'en', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Overall Status */}
        <Card className="mb-8 border-green-500/30 bg-green-500/5">
          <CardContent className="p-6 flex items-center gap-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <h2 className="text-lg font-semibold text-green-700 dark:text-green-400">
                {es ? 'Todos los sistemas operativos' : 'All systems operational'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {es ? 'Sin incidentes reportados' : 'No incidents reported'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <div className="space-y-3">
          {services.map((service) => (
            <Card key={service.name}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <service.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{service.name}</span>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-500/30 bg-green-500/10">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {es ? 'Operativo' : 'Operational'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-8">
          {es
            ? 'Si experimentas problemas, contacta soporte a través del formulario de contacto.'
            : 'If you experience issues, contact support through the contact form.'}
        </p>
      </div>
    </div>
  );
}
