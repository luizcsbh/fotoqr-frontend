import React, { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { Button } from '../components/UI/Button';
import { Card } from '../components/UI/Card';
import { authService } from '../services/auth.service';

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error;
    if (typeof message === 'string') return message;
  }
  return 'Não foi possível concluir a solicitação. Tente novamente.';
}

export const PasswordRecoveryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (token && newPassword !== passwordConfirmation) {
      setError('A nova senha e a confirmação não coincidem.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (token) {
        await authService.resetPassword(token, newPassword);
        setIsComplete(true);
      } else {
        setMessage(await authService.requestPasswordReset(email));
      }
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
          to="/login?mode=login"
          className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para entrar
        </Link>

        <Card padding="lg" className="border-slate-200/80 shadow-xl shadow-slate-900/5">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-white shadow-lg shadow-brand-500/25">
              <KeyRound className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              {token ? 'Criar nova senha' : 'Recuperar senha'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {token
                ? 'Escolha uma nova senha para sua conta FotoQR.'
                : 'Informe o e-mail da sua conta para receber um link de recuperação.'}
            </p>
          </div>

          {!isComplete ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {token ? (
                <>
                  <div>
                    <label htmlFor="new-password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Nova senha
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={72}
                      required
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="password-confirmation" className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Confirmar nova senha
                    </label>
                    <input
                      id="password-confirmation"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={72}
                      required
                      value={passwordConfirmation}
                      onChange={(event) => setPasswordConfirmation(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="recovery-email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="recovery-email"
                      type="email"
                      autoComplete="email"
                      maxLength={255}
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="voce@exemplo.com"
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              )}

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}
              {message && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800" role="status">
                  {message}
                </p>
              )}
              <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                {token ? 'Redefinir senha' : 'Enviar link de recuperação'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800" role="status">
                Senha redefinida com sucesso. Agora você pode entrar com sua nova senha.
              </p>
              <Link to="/login?mode=login" className="block">
                <Button className="w-full" size="lg">Ir para entrar</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
