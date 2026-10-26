import React from 'react';
import { Camera, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm">
              <Camera className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-slate-800">
              Foto<span className="text-brand-600">QR</span>
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link to="/" className="hover:text-brand-600 transition-colors">
              Início
            </Link>
            <Link to="/login?mode=login" className="hover:text-brand-600 transition-colors">
              Entrar
            </Link>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1 text-xs sm:text-sm">
              Feito com <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> para momentos inesquecíveis
            </span>
          </div>

          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} FotoQR. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
