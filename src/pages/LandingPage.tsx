import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Download, Smartphone, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/UI/Button';
import { useAuth } from '../hooks/useAuth';
import { AdSenseAd, adSlots } from '../components/AdSenseAd';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Background glow & subtle patterns */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-brand-100/60 via-emerald-50/30 to-transparent blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs sm:text-sm font-semibold mb-8 shadow-xs">
            <Sparkles className="w-4 h-4 text-brand-600 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Compartilhamento simples e instantâneo</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
            Compartilhe fotos do seu evento com um{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-emerald-500">
              QR Code
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Crie seu álbum, exiba o QR Code nas mesas ou telões e receba todas as fotos tiradas pelos seus convidados em alta resolução —{' '}
            <strong className="text-slate-800 font-semibold">sem que ninguém precise baixar aplicativo ou criar conta.</strong>
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link to={isAuthenticated ? '/dashboard' : '/login'} className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto shadow-lg shadow-brand-600/30 text-base"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                {isAuthenticated ? 'Ir para Meus Eventos' : 'Começar Gratuitamente'}
              </Button>
            </Link>

            <a href="#como-funciona" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto text-base">
                Como Funciona
              </Button>
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-600" />
              <span>Sem download de app</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-600" />
              <span>Qualidade original preservada</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-600" />
              <span>Download completo em ZIP</span>
            </div>
          </div>
        </div>
      </section>

      <AdSenseAd slot={adSlots.landing} placement="página inicial" className="mb-12" />

      {/* Visual Mockup Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-20 w-full">
        <div className="bg-gradient-to-b from-white to-slate-50 rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center">
            {/* Step 1 Preview */}
            <div className="flex flex-col items-center p-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                <QrCode className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">1. Você gera o QR Code</h4>
              <p className="text-xs text-slate-500">
                Imprima nas mesas, totens ou projete no telão da festa.
              </p>
            </div>

            {/* Step 2 Preview */}
            <div className="flex flex-col items-center p-4 bg-brand-50/50 rounded-2xl border border-brand-100">
              <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center mb-3 shadow-md shadow-brand-600/30">
                <Smartphone className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">2. Convidados escaneiam</h4>
              <p className="text-xs text-slate-600">
                A câmera abre o álbum direto no navegador do celular.
              </p>
            </div>

            {/* Step 3 Preview */}
            <div className="flex flex-col items-center p-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <Download className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">3. Você baixa tudo</h4>
              <p className="text-xs text-slate-500">
                Todas as fotos reunidas em um único lugar em alta definição.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="como-funciona" className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">
              Passo a Passo
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Como o FotoQR transforma o seu evento
            </h3>
            <p className="mt-4 text-base text-slate-500">
              Chega de pedir para os convidados mandarem fotos por WhatsApp com qualidade reduzida.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="relative p-8 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-brand-300 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-black text-lg flex items-center justify-center mb-6 shadow-md shadow-brand-600/20">
                1
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">
                Crie seu evento
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Faça login com sua conta Google em segundos, defina o nome do casamento, aniversário ou confraternização e escolha onde guardar os arquivos.
              </p>
            </div>

            {/* Card 2 */}
            <div className="relative p-8 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-brand-300 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-black text-lg flex items-center justify-center mb-6 shadow-md shadow-brand-600/20">
                2
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">
                Compartilhe o QR Code
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Baixe a imagem do QR Code em alta definição ou compartilhe o link. Posicione plaquinhas decorativas nas mesas ou projete nos telões.
              </p>
            </div>

            {/* Card 3 */}
            <div className="relative p-8 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-brand-300 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-black text-lg flex items-center justify-center mb-6 shadow-md shadow-brand-600/20">
                3
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">
                Receba as fotos
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Acompanhe o feed em tempo real no seu painel e, ao final da festa, baixe todo o arquivo em formato ZIP com apenas um clique.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-600 text-white py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Pronto para eternizar os melhores momentos?
          </h2>
          <p className="text-brand-100 text-base sm:text-lg mb-8 max-w-xl mx-auto">
            Crie seu primeiro álbum em menos de 1 minuto. Gratuito, moderno e intuitivo para você e seus convidados.
          </p>
          <Link to={isAuthenticated ? '/dashboard' : '/login'}>
            <button className="px-8 py-4 rounded-xl bg-white text-brand-700 font-bold text-base hover:bg-slate-100 shadow-xl transition-transform hover:scale-105 active:scale-95">
              Criar meu Álbum Agora
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
};
