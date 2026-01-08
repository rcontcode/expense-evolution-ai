import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import evofinzLogo from '@/assets/evofinz-logo.png';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReport = () => {
    const subject = encodeURIComponent('Bug Report - EvoFinz');
    const body = encodeURIComponent(
      `Error: ${this.state.error?.message || 'Unknown error'}\n\n` +
      `URL: ${window.location.href}\n` +
      `Time: ${new Date().toISOString()}\n` +
      `User Agent: ${navigator.userAgent}\n\n` +
      `Please describe what you were doing when the error occurred:\n`
    );
    window.location.href = `mailto:support@evofinz.com?subject=${subject}&body=${body}`;
  };

  public render() {
    if (this.state.hasError) {
      // Detect language from localStorage or default to Spanish
      const storedLang = localStorage.getItem('evofinz_language');
      const isEnglish = storedLang === 'en';

      const content = isEnglish ? {
        title: 'Something went wrong',
        subtitle: "We're sorry, but something unexpected happened. Our team has been notified.",
        reload: 'Reload page',
        home: 'Go to home',
        report: 'Report issue',
        technical: 'Technical details',
      } : {
        title: 'Algo salió mal',
        subtitle: 'Lo sentimos, pero algo inesperado ocurrió. Nuestro equipo ha sido notificado.',
        reload: 'Recargar página',
        home: 'Ir al inicio',
        report: 'Reportar problema',
        technical: 'Detalles técnicos',
      };

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4">
          {/* Logo */}
          <a href="/" className="mb-8">
            <img src={evofinzLogo} alt="EvoFinz" className="h-12 w-auto opacity-80" />
          </a>

          {/* Error Visual */}
          <div className="mb-8 relative">
            <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center animate-pulse">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center max-w-md space-y-4 mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground">
              {content.title}
            </h1>
            <p className="text-muted-foreground">
              {content.subtitle}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Button onClick={this.handleReload} size="lg" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {content.reload}
            </Button>
            <Button variant="outline" size="lg" onClick={this.handleGoHome} className="gap-2">
              <Home className="h-4 w-4" />
              {content.home}
            </Button>
          </div>

          {/* Report Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={this.handleReport}
            className="gap-2 text-muted-foreground"
          >
            <Bug className="h-4 w-4" />
            {content.report}
          </Button>

          {/* Technical Details (collapsed) */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-8 max-w-2xl w-full">
              <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                {content.technical}
              </summary>
              <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-48">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
