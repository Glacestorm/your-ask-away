import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
}

interface ErrorLogEntry {
  timestamp: string;
  error: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState(prev => ({
      errorInfo,
      errorCount: prev.errorCount + 1
    }));

    // Log error for monitoring
    const errorLog: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    console.error('[ErrorBoundary] Error capturado:', errorLog);

    // Store in localStorage for debugging
    try {
      const existingLogs = JSON.parse(localStorage.getItem('errorBoundaryLogs') || '[]');
      existingLogs.push(errorLog);
      // Keep only last 10 errors
      const trimmedLogs = existingLogs.slice(-10);
      localStorage.setItem('errorBoundaryLogs', JSON.stringify(trimmedLogs));
    } catch (e) {
      console.warn('Could not store error log');
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/store';
  };

  handleReportBug = () => {
    const errorData = {
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };
    
    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorData, null, 2))
      .then(() => alert('Información del error copiada al portapapeles'))
      .catch(() => console.log('Error data:', errorData));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isRecoverable = this.state.errorCount < 3;

      return (
        <div className="flex h-screen items-center justify-center bg-background p-4">
          <div className="flex max-w-lg flex-col items-center gap-6 text-center">
            <div className="rounded-full bg-destructive/10 p-6">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Se ha producido un error
              </h2>
              <p className="text-muted-foreground">
                {isRecoverable 
                  ? 'Ha ocurrido un error inesperado. Puedes intentar recuperarte o recargar la página.'
                  : 'Se han producido múltiples errores. Se recomienda recargar la página.'}
              </p>
              
              {this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Detalles técnicos
                  </summary>
                  <pre className="mt-2 overflow-auto rounded-md bg-muted p-4 text-xs text-foreground max-h-40">
                    {this.state.error.message}
                  </pre>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="mt-2 overflow-auto rounded-md bg-muted p-4 text-xs text-muted-foreground max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {isRecoverable && (
                <Button onClick={this.handleReset} variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
              )}
              <Button onClick={this.handleReload} variant="outline">
                Recargar página
              </Button>
              <Button onClick={this.handleGoHome} variant="ghost">
                <Home className="h-4 w-4 mr-2" />
                Ir al inicio
              </Button>
              <Button onClick={this.handleReportBug} variant="ghost" size="sm">
                <Bug className="h-4 w-4 mr-2" />
                Copiar info
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Errores en esta sesión: {this.state.errorCount}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
