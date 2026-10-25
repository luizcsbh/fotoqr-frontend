import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou um erro não tratado:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl font-bold mb-2">Ops! Algo deu errado</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Ocorreu um erro inesperado ao renderizar esta página.
            </p>

            {this.state.error?.message && (
              <div className="mb-6 p-3 bg-slate-900/80 rounded-xl text-left border border-slate-700/60 overflow-x-auto text-xs font-mono text-red-300">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-emerald-600/30"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar página
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold text-sm transition-colors"
              >
                <Home className="w-4 h-4" />
                Ir para o início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
