import React from 'react';
import { Camera, QrCode } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Carregando FotoQR...',
  subMessage = 'Preparando seu ambiente...',
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-md">
      <div className="relative flex flex-col items-center">
        {/* Animated Rings */}
        <div className="relative flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-brand-500/10 animate-ping absolute" />
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-xl shadow-brand-500/30 animate-pulse">
            <div className="relative">
              <Camera className="w-10 h-10 text-white" />
              <QrCode className="w-5 h-5 text-white absolute -bottom-1 -right-1 bg-brand-700 rounded p-0.5" />
            </div>
          </div>
        </div>

        {/* Text */}
        <h3 className="mt-8 text-xl font-bold text-slate-800 tracking-tight animate-fade-in">
          {message}
        </h3>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          {subMessage}
        </p>

        {/* Minimal loading bar */}
        <div className="mt-6 w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-brand-600 rounded-full animate-indeterminate" />
        </div>
      </div>
    </div>
  );
};
