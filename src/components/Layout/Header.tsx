import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { QrCode, Camera, LogOut, Menu, X, PlusCircle, LayoutDashboard, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../UI/Button';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <div className="relative">
                <Camera className="w-5 h-5 text-white" />
                <QrCode className="w-3 h-3 text-white absolute -bottom-1 -right-1 bg-brand-700 rounded-sm p-0.5" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                Foto<span className="text-brand-600">QR</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium -mt-1 hidden sm:block">
                Compartilhamento via QR Code
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Meus Eventos</span>
                </Link>

                <div className="h-6 w-px bg-slate-200 mx-2" />

                {/* User menu */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2.5 py-1 px-2.5 rounded-full bg-slate-50 border border-slate-200/60">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-7 h-7 rounded-full object-cover border border-brand-500/30"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                        {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                      </div>
                    )}
                    <span className="text-xs font-medium text-slate-700 max-w-[120px] truncate">
                      {user?.name || user?.email}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    leftIcon={<LogOut className="w-4 h-4" />}
                    title="Desconectar"
                    className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                  >
                    Sair
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" size="md">
                    Entrar
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
                    Criar Álbum
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md px-4 pt-3 pb-5 space-y-3 animate-in slide-in-from-top-4 duration-200 shadow-xl">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl mb-2">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
                  </div>
                )}
                <div className="overflow-hidden">
                  <div className="text-sm font-semibold text-slate-800 truncate">
                    {user?.name}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {user?.email}
                  </div>
                </div>
              </div>

              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                  isActive('/dashboard')
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                Meus Eventos
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 text-left transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sair da conta
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full justify-center">
                  Entrar com Google
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
