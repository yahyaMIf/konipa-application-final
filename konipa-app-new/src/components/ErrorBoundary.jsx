import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Met à jour l'état pour afficher l'interface d'erreur
    return {
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log l'erreur pour le débogage
    this.setState({
      error,
      errorInfo
    });

    // Envoyer l'erreur à un service de monitoring en production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error, errorInfo) => {
    // Ici vous pouvez intégrer un service comme Sentry, LogRocket, etc.
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        errorId: this.state.errorId
      };
      
      // Exemple d'envoi à un endpoint de logging
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // }).catch(console.error);
      
      } catch (loggingError) {
      }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, showDetails = false } = this.props;
      
      // Si un composant de fallback personnalisé est fourni
      if (Fallback) {
        return (
          <Fallback
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
            onGoHome={this.handleGoHome}
          />
        );
      }

      // Interface d'erreur par défaut
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Oops! Une erreur s'est produite
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Nous nous excusons pour ce désagrément. L'erreur a été automatiquement signalée à notre équipe.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Actions principales */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleRetry} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Réessayer
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Retour à l'accueil
                </Button>
                <Button variant="outline" onClick={this.handleReload} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Recharger la page
                </Button>
              </div>

              {/* Détails de l'erreur (développement uniquement) */}
              {(process.env.NODE_ENV === 'development' || showDetails) && this.state.error && (
                <details className="bg-gray-100 rounded-lg p-4">
                  <summary className="cursor-pointer font-medium text-gray-700 flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Détails techniques (développement)
                  </summary>
                  <div className="mt-4 space-y-3">
                    <div>
                      <h4 className="font-medium text-red-600">Message d'erreur:</h4>
                      <p className="text-sm text-gray-700 font-mono bg-white p-2 rounded border">
                        {this.state.error.message}
                      </p>
                    </div>
                    
                    {this.state.error.stack && (
                      <div>
                        <h4 className="font-medium text-red-600">Stack trace:</h4>
                        <pre className="text-xs text-gray-700 bg-white p-2 rounded border overflow-auto max-h-40">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <h4 className="font-medium text-red-600">Component stack:</h4>
                        <pre className="text-xs text-gray-700 bg-white p-2 rounded border overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-red-600">ID d'erreur:</h4>
                      <p className="text-sm text-gray-700 font-mono bg-white p-2 rounded border">
                        {this.state.errorId}
                      </p>
                    </div>
                  </div>
                </details>
              )}

              {/* Informations d'aide */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Que faire maintenant?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Essayez de recharger la page</li>
                  <li>• Vérifiez votre connexion internet</li>
                  <li>• Si le problème persiste, contactez le support technique</li>
                  <li>• Référence d'erreur: {this.state.errorId}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook pour utiliser ErrorBoundary avec des composants fonctionnels
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Composant de fallback simple pour les erreurs
export const SimpleErrorFallback = ({ error, onRetry, onGoHome }) => (
  <div className="text-center p-8">
    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
    <p className="text-gray-600 mb-4">Une erreur s'est produite lors du chargement de ce composant.</p>
    <div className="space-x-3">
      <Button onClick={onRetry} size="sm">
        Réessayer
      </Button>
      <Button variant="outline" onClick={onGoHome} size="sm">
        Retour à l'accueil
      </Button>
    </div>
  </div>
);

export default ErrorBoundary;