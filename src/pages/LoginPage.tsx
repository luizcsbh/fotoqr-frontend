import React, { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  QrCode,
  Shield,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/auth.service';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error;
    if (typeof message === 'string') return message;
  }
  return 'Não foi possível concluir seu acesso. Tente novamente.';
}

export const LoginPage: React.FC = () => {
  const { isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isRegistering = searchParams.get('mode') === 'register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmationVisible, setIsPasswordConfirmationVisible] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (isRegistering && password !== passwordConfirmation) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await authService.register(name, email, password);
      } else {
        await authService.login(email, password);
      }
      await refreshUser();
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-b from-brand-50/60 via-slate-50 to-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao início</span>
        </Link>

        <Card padding="lg" className="shadow-xl shadow-slate-900/5 border-slate-200/80">
          <div className="text-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-brand-500/25">
              <div className="relative">
                <Camera className="w-7 h-7" />
                <QrCode className="w-3.5 h-3.5 absolute -bottom-1 -right-1 bg-brand-700 rounded p-0.5" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isRegistering ? 'Crie sua conta' : 'Bem-vindo de volta'}
            </h1>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              {isRegistering
                ? 'Cadastre-se para criar álbuns e compartilhar as fotos dos seus eventos.'
                : 'Entre para acessar seus eventos e álbuns.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 mb-6" role="tablist" aria-label="Acesso à conta">
            <button
              type="button"
              role="tab"
              aria-selected={isRegistering}
              onClick={() => {
                setSearchParams({ mode: 'register' });
                setError('');
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                isRegistering ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Criar conta
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isRegistering}
              onClick={() => {
                setSearchParams({ mode: 'login' });
                setError('');
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                !isRegistering ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Entrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Nome
                </label>
                <div className="relative">
                  <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={255}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Seu nome"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={255}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@exemplo.com"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  required
                  minLength={8}
                  maxLength={72}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Pelo menos 8 caracteres"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((visible) => !visible)}
                  aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={isPasswordVisible}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {isPasswordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isRegistering && (
              <div>
                <label htmlFor="password-confirmation" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Confirme sua senha
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="password-confirmation"
                    name="password-confirmation"
                    type={isPasswordConfirmationVisible ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={72}
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    placeholder="Digite a senha novamente"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordConfirmationVisible((visible) => !visible)}
                    aria-label={isPasswordConfirmationVisible ? 'Ocultar confirmação da senha' : 'Mostrar confirmação da senha'}
                    aria-pressed={isPasswordConfirmationVisible}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {isPasswordConfirmationVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              {isRegistering ? 'Criar minha conta' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-4 text-xs text-emerald-900">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Vai enviar fotos como convidado?</span>
            </div>
            <p className="mt-2 pl-6 leading-relaxed text-emerald-800/90">
              Convidados não precisam criar conta. Basta escanear o QR Code do evento para enviar fotos.
            </p>
          </div>
        </Card>

        <p className="mt-4 text-center text-xs text-slate-400">
          Autenticação protegida e senha armazenada de forma segura.
        </p>
      </div>
    </div>
  );
};
