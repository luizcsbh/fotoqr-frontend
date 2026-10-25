import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Server } from 'lucide-react';
import { onColdStartChange, checkServerHealth } from '../services/api';

export const ColdStartBanner: React.FC = () => {
  const [isColdStarting, setIsColdStarting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const unsubscribe = onColdStartChange((status) => {
      setIsColdStarting(status);
    });
    return () => unsubscribe();
  }, []);

  const handleManualCheck = useCallback(async () => {
    setIsRetrying(true);
    const healthy = await checkServerHealth();
    if (healthy) {
      setIsColdStarting(false);
    }
    setIsRetrying(false);
  }, []);

  // Poll server every 5 seconds if cold starting
  useEffect(() => {
    if (!isColdStarting) return;

    const interval = setInterval(async () => {
      const healthy = await checkServerHealth();
      if (healthy) {
        setIsColdStarting(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isColdStarting]);

  if (!isColdStarting) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 sm:px-6 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-amber-900">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Server className="w-4 h-4 text-amber-700 animate-pulse" />
          </div>
          <div className="text-sm">
            <span className="font-bold block sm:inline">
              Aguarde, o FotoQR está preparando o servidor...
            </span>{' '}
            <span className="text-amber-700 text-xs sm:text-sm">
              Servidores em nuvem podem levar alguns segundos para inicializar. Suas fotos não serão perdidas!
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualCheck}
            disabled={isRetrying}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-200/70 hover:bg-amber-200 text-amber-900 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Verificando...' : 'Verificar conexão'}
          </button>
        </div>
      </div>
    </div>
  );
};
