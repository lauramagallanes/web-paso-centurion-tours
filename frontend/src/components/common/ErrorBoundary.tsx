import React, { Component, ReactNode } from 'react';
import Button from './Button';
import Icon from './Icon';
import Illustration from './Illustration';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo: errorInfo.componentStack
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-container">
            <div className="error-boundary-content">
              <div className="error-boundary-visual">
                <Illustration 
                  name="nature-hero" 
                  size="lg" 
                  className="error-illustration" 
                />
              </div>
              
              <div className="error-boundary-text">
                <h1 className="error-title">¡Oops! Algo salió mal</h1>
                <p className="error-description">
                  Ha ocurrido un error inesperado. No te preocupes, nuestro equipo 
                  ha sido notificado y estamos trabajando para solucionarlo.
                </p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="error-details">
                    <summary className="error-details-summary">
                      Detalles técnicos (desarrollo)
                    </summary>
                    <div className="error-details-content">
                      <h3>Error:</h3>
                      <pre className="error-message">{this.state.error.message}</pre>
                      {this.state.errorInfo && (
                        <>
                          <h3>Stack trace:</h3>
                          <pre className="error-stack">{this.state.errorInfo}</pre>
                        </>
                      )}
                    </div>
                  </details>
                )}
                
                <div className="error-actions">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={this.handleReload}
                    className="error-button"
                  >
                    <Icon name="chevron-left" size="sm" />
                    Recargar Página
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    onClick={this.handleGoHome}
                    className="error-button"
                  >
                    <Icon name="home" size="sm" />
                    Ir al Inicio
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

