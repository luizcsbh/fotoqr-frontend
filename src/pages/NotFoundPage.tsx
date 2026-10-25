import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, QrCode, Home } from 'lucide-react';
import { Button } from '../components/UI/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 text-center shadow-lg">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-6">
          <div className="relative">
            <Camera className="w-10 h-10 text-slate-400" />
            <QrCode className="w-5 h-5 text-slate-400 absolute -bottom-1 -right-1 bg-slate-200 rounded p-0.5" />
          </div>
        </div>

        <span className="text-4xl font-black text-brand-600 block mb-2">404</span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          Página não encontrada
        </h1>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          O link que você tentou acessar não existe, foi removido ou você digitou o endereço incorretamente.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
              Página Inicial
            </Button>
          </Link>
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button variant="secondary" size="md">
              Meus Eventos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
