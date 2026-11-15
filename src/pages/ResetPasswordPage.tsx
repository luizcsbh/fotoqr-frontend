import React, { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Camera, QrCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '../services/auth.service';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { PasswordInput } from '../components/UI/PasswordInput';
import { PasswordMatchHint, PasswordRequirements } from '../components/UI/PasswordRequirements';
import { isPasswordValid } from '../utils/passwordRules';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const isValidLink = Boolean(token && email);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid(newPassword, confirmPassword)) {
      setError('A nova senha ainda não atende a todos os requisitos da lista.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword(email, token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3500);
    } catch (err: any) {
      setError(err?.message || 'Token inválido ou expirado. Solicite um novo link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-b from-brand-50/60 via-slate-50 to-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao login
        </Link>

        <Card padding="lg" className="shadow-xl shadow-slate-900/5 border-slate-200/80">
          <div className="text-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-brand-500/25">
              <div className="relative">
                <Camera className="w-7 h-7" />
                <QrCode className="w-3.5 h-3.5 absolute -bottom-1 -right-1 bg-brand-700 rounded-sm p-0.5" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Criar nova senha</h1>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Escolha uma nova senha segura para sua conta FotoQREventos.
            </p>
          </div>

          {!isValidLink ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h2 className="text-base font-bold text-red-800 mb-2">Link inválido</h2>
              <p className="text-sm text-red-700">Este link de redefinição é inválido ou está incompleto.</p>
              <Link to="/esqueci-a-senha" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-800">
                Solicitar novo link →
              </Link>
            </div>
          ) : success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-base font-bold text-emerald-800 mb-2">Senha redefinida!</h2>
              <p className="text-sm text-emerald-700">Sua senha foi atualizada com sucesso. Você será redirecionado para o login em instantes...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Nova senha
                </label>
                <PasswordInput
                  id="new-password"
                  autoComplete="new-password"
                  required
                  maxLength={72}
                  aria-describedby="new-password-rules"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                />
                <PasswordRequirements
                  id="new-password-rules"
                  className="mt-2"
                  password={newPassword}
                  confirmation={confirmPassword}
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Confirmar nova senha
                </label>
                <PasswordInput
                  id="confirm-password"
                  autoComplete="new-password"
                  required
                  maxLength={72}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                />
                <PasswordMatchHint password={newPassword} confirmation={confirmPassword} />
              </div>

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isSubmitting}
                disabled={!isPasswordValid(newPassword, confirmPassword)}
              >
                Salvar nova senha
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
