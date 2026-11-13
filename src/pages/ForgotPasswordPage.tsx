import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera, Mail, QrCode, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/auth.service';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      const msg = err?.message || 'Erro ao enviar e-mail. Verifique a configuração SMTP.';
      setError(msg);
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
                <QrCode className="w-3.5 h-3.5 absolute -bottom-1 -right-1 bg-brand-700 rounded p-0.5" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Esqueceu a senha?</h1>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Informe seu e-mail e enviaremos um link para você criar uma nova senha.
            </p>
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-base font-bold text-emerald-800 mb-2">E-mail enviado!</h2>
              <p className="text-sm text-emerald-700 leading-relaxed">
                Se <strong>{email}</strong> estiver cadastrado, você receberá as instruções em breve. Verifique também sua caixa de spam.
              </p>
              <Link to="/login" className="mt-5 inline-block text-sm font-semibold text-brand-600 hover:text-brand-800">
                Voltar ao login →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Seu e-mail cadastrado
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                Enviar link de redefinição
              </Button>
            </form>
          )}
        </Card>

        <p className="mt-4 text-center text-xs text-slate-400">
          Lembrou a senha?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-800">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
};
