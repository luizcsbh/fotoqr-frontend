import React from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  Download,
  Smartphone,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  MonitorPlay,
  MessageSquareHeart,
  Mail,
  Users,
  ScanLine,
  Music,
  Palette,
  BarChart3,
  KeyRound,
  Heart,
  Cake,
  Briefcase,
  GraduationCap,
  PartyPopper,
  Baby,
} from 'lucide-react';
import { Button } from '../components/UI/Button';
import { useAuth } from '../hooks/useAuth';
import { AdSenseAd, adSlots } from '../components/AdSenseAd';

const features = [
  {
    icon: QrCode,
    title: 'Álbum colaborativo por QR Code',
    description: 'Convidados enviam fotos pelo navegador do celular, sem baixar app e sem criar conta. Tudo em qualidade original.',
  },
  {
    icon: ShieldCheck,
    title: 'Moderação de conteúdo',
    description: 'Revisão automática das imagens enviadas e painel de fotos pendentes para você aprovar antes de publicar.',
  },
  {
    icon: MonitorPlay,
    title: 'Telão ao vivo',
    description: 'Modo apresentação com slideshow das fotos em tempo real e QR Code na tela para novos envios durante a festa.',
  },
  {
    icon: MessageSquareHeart,
    title: 'Mural de mensagens',
    description: 'Os convidados deixam recados carinhosos que podem ser exibidos no telão junto com as fotos.',
  },
  {
    icon: Mail,
    title: 'Convites digitais',
    description: 'Modelos prontos por tipo de evento, convite individual com QR Code único, PDF para download e envio por e-mail ou WhatsApp.',
  },
  {
    icon: Users,
    title: 'Gestão de convidados',
    description: 'Cadastre convidados manualmente ou importe planilhas CSV/XLSX, com detecção de duplicados e busca rápida.',
  },
  {
    icon: ScanLine,
    title: 'Portaria com check-in',
    description: 'Leitor de QR Code pelo celular valida cada convite na entrada e impede o uso duplicado.',
  },
  {
    icon: Music,
    title: 'DJ e pedidos de música',
    description: 'Convidados sugerem músicas e o DJ acompanha a playlist em um console próprio, integrado ao Spotify.',
  },
  {
    icon: Palette,
    title: 'QR Code personalizado',
    description: 'Escolha temas, cores e ícones para o QR Code e gere placas de mesa prontas para imprimir.',
  },
  {
    icon: KeyRound,
    title: 'Acesso para a equipe',
    description: 'Gere links de acesso para recepcionistas, fotógrafos e DJ, sem compartilhar a sua senha.',
  },
  {
    icon: BarChart3,
    title: 'Métricas e relatórios',
    description: 'Painel com confirmações, presenças e últimos check-ins em tempo real, com exportação em XLSX ou CSV.',
  },
  {
    icon: Download,
    title: 'Download completo em ZIP',
    description: 'Ao final do evento, baixe todas as fotos reunidas em um único arquivo com apenas um clique.',
  },
];

const eventTypes = [
  { icon: Heart, label: 'Casamentos' },
  { icon: Cake, label: 'Aniversários' },
  { icon: Baby, label: 'Chás e batizados' },
  { icon: GraduationCap, label: 'Formaturas' },
  { icon: Briefcase, label: 'Eventos corporativos' },
  { icon: PartyPopper, label: 'Festas e confraternizações' },
];

const faqs = [
  {
    question: 'Os convidados precisam instalar algum aplicativo?',
    answer: 'Não. Basta apontar a câmera do celular para o QR Code: o álbum abre direto no navegador e o envio de fotos é feito na hora.',
  },
  {
    question: 'As fotos perdem qualidade?',
    answer: 'Não. Diferente de aplicativos de mensagem, o FotoQREventos guarda os arquivos na resolução original enviada pelo convidado.',
  },
  {
    question: 'Posso controlar o que aparece no álbum e no telão?',
    answer: 'Sim. As fotos passam por moderação automática e você pode revisar, aprovar ou remover qualquer imagem pelo painel do evento.',
  },
  {
    question: 'Consigo usar só os convites e a portaria, sem o álbum?',
    answer: 'Sim. Cada recurso funciona de forma independente: você ativa o que fizer sentido para o seu evento.',
  },
];

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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs sm:text-sm font-semibold mb-8">
            <Sparkles className="w-4 h-4 text-brand-600 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Compartilhamento simples e instantâneo</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl sm:leading-none font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
            Compartilhe fotos do seu evento com um{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-emerald-500">
              QR Code
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl sm:leading-7 text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Crie seu álbum, exiba o QR Code nas mesas ou telões e receba todas as fotos tiradas pelos seus convidados em alta resolução —{' '}
            <strong className="text-slate-800 font-semibold">sem que ninguém precise baixar aplicativo ou criar conta.</strong>
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link to={isAuthenticated ? '/dashboard' : '/login?mode=register'} className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto shadow-brand-600/30 text-base"
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
              Como o FotoQREventos transforma o seu evento
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
                Crie sua conta em segundos, defina o nome do casamento, aniversário ou confraternização e configure local, data, capacidade e capa do evento.
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

      {/* Features Grid */}
      <section id="recursos" className="py-16 sm:py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">
              Recursos
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Tudo o que o seu evento precisa em um só lugar
            </h3>
            <p className="mt-4 text-base text-slate-500">
              Do convite à última foto da festa: o FotoQREventos cuida da recepção, da interação com os convidados e das memórias.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex gap-4 p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-brand-300 hover:shadow-md transition-all duration-300"
              >
                <div className="w-11 h-11 shrink-0 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">{title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Event Types */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">
            Para todo tipo de celebração
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-10">
            Feito para o seu evento, seja ele qual for
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {eventTypes.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80"
              >
                <Icon className="w-6 h-6 text-brand-600" />
                <span className="text-sm font-semibold text-slate-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="duvidas" className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">
              Dúvidas frequentes
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Perguntas e respostas
            </h3>
          </div>
          <div className="space-y-3">
            {faqs.map(({ question, answer }) => (
              <details
                key={question}
                className="group rounded-2xl bg-white border border-slate-200/80 p-5 open:shadow-xs"
              >
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-slate-900">
                  {question}
                  <ArrowRight className="w-4 h-4 shrink-0 text-brand-600 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{answer}</p>
              </details>
            ))}
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
          <Link to={isAuthenticated ? '/dashboard' : '/login?mode=register'}>
            <button className="px-8 py-4 rounded-xl bg-white text-brand-700 font-bold text-base hover:bg-slate-100 shadow-xl transition-transform hover:scale-105 active:scale-95">
              Criar meu Álbum Agora
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
};
