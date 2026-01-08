import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Home, ArrowLeft, Search, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import evofinzLogo from "@/assets/evofinz-logo.png";

const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const content = {
    es: {
      title: "Página no encontrada",
      subtitle: "La página que buscas no existe o ha sido movida.",
      code: "Error 404",
      home: "Ir al inicio",
      back: "Volver atrás",
      help: "¿Necesitas ayuda?",
      helpText: "Si crees que esto es un error, contáctanos.",
    },
    en: {
      title: "Page not found",
      subtitle: "The page you're looking for doesn't exist or has been moved.",
      code: "Error 404",
      home: "Go to home",
      back: "Go back",
      help: "Need help?",
      helpText: "If you think this is an error, contact us.",
    },
  };

  const t = content[language];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4">
      {/* Logo */}
      <Link to="/" className="mb-8">
        <img src={evofinzLogo} alt="EvoFinz" className="h-12 w-auto opacity-80 hover:opacity-100 transition-opacity" />
      </Link>

      {/* 404 Visual */}
      <div className="relative mb-8">
        <div className="text-[150px] md:text-[200px] font-display font-bold text-primary/10 leading-none select-none">
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Search className="h-16 w-16 md:h-24 md:w-24 text-primary/40 animate-pulse" />
        </div>
      </div>

      {/* Content */}
      <div className="text-center max-w-md space-y-4 mb-8">
        <p className="text-xs font-medium text-primary uppercase tracking-wider">
          {t.code}
        </p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          {t.title}
        </h1>
        <p className="text-muted-foreground">
          {t.subtitle}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-12">
        <Button asChild size="lg" className="gap-2">
          <Link to="/">
            <Home className="h-4 w-4" />
            {t.home}
          </Link>
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className="gap-2"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Button>
      </div>

      {/* Help Section */}
      <div className="text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-1">
          <HelpCircle className="h-4 w-4" />
          <span className="font-medium">{t.help}</span>
        </div>
        <p>{t.helpText}</p>
        <a 
          href="mailto:support@evofinz.com" 
          className="text-primary hover:underline"
        >
          support@evofinz.com
        </a>
      </div>
    </div>
  );
};

export default NotFound;
