import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import {
  Calendar,
  MapPin,
  FileDown,
  Share2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Download,
  Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { invitationService } from '../services/invitation.service';
import { PublicInvitation } from '../types';
import { resolveInvitationLook } from '../utils/invitationTemplates';

export const PublicInvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await invitationService.getPublicInvitation(token);
        setData(res);
      } catch (err: any) {
        toast.error('Convite não encontrado ou cancelado.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  const handleDownloadPdf = async () => {
    if (!data || !token) return;
    try {
      setDownloading(true);
      // The guest is not logged in: download by the link token (download by id is admin-only)
      await invitationService.downloadPublicPdf(
        token,
        `convite-${data.guest.name.toLowerCase().replace(/\s+/g, '-')}.pdf`
      );
      toast.success('Download do convite em PDF iniciado!');
    } catch {
      toast.error('Erro ao baixar o convite em PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadQrCode = () => {
    if (!data?.invitation.qrCodeUrl) return;
    try {
      const link = document.createElement('a');
      link.href = data.invitation.qrCodeUrl;
      link.download = `qrcode-${data.guest.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download do QR Code concluído!');
    } catch {
      toast.error('Erro ao baixar a imagem do QR Code.');
    }
  };

  // Same code the QR carries: the gate staff can type it in the scanner when the camera fails
  const handleCopyToken = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      toast.success('Código do convite copiado!');
    } catch {
      toast.error('Não foi possível copiar o código.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Convite: ${data?.event.title}`,
          text: `Olá ${data?.guest.name}, aqui está seu convite individual para ${data?.event.title}!`,
          url: window.location.href,
        });
      } catch {
        // Share cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link do convite copiado para a área de transferência!');
      } catch {
        toast.error('Não foi possível copiar o link. Copie-o da barra de endereços.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-slate-600 text-sm font-medium">Carregando seu convite digital...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center bg-white space-y-4 shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Convite Não Encontrado</h2>
          <p className="text-sm text-slate-600">
            Este convite pode ter sido cancelado, reemitido ou o link está incorreto. Entre em contato com a organização do evento.
          </p>
        </Card>
      </div>
    );
  }

  const { invitation, guest, event } = data;
  // Ready-made template (logo, background, colors) unless the owner uploaded their own images
  const look = resolveInvitationLook({
    templateId: event.invitationTemplate,
    coverImage: event.coverImage,
    backgroundImage: event.backgroundImage,
  });
  const backgroundLayer = look.backgroundCss;
  const coverImage = look.logoSrc;
  const isUsed = invitation.usedEntries >= invitation.maxEntries;
  const isCancelled = invitation.status === 'cancelled';

  // Format date similar to example: "28 de nov de 2026 às 21:00"
  const formattedEventDate = event.startAt
    ? new Date(event.startAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  // Parse location into multiple lines if present
  const locationLines = event.location
    ? event.location.split('\n').filter(Boolean)
    : [];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 py-12 relative"
      style={{
        // A template background is designed to be seen; an uploaded photo is softened behind the card
        background: backgroundLayer
          ? look.isTemplateBackground
            ? backgroundLayer
            : `linear-gradient(rgba(241, 245, 249, 0.92), rgba(241, 245, 249, 0.96)), ${backgroundLayer}`
          : '#eef2f6',
        backgroundAttachment: backgroundLayer ? 'fixed' : undefined,
      }}
    >
      <div className="w-full max-w-lg space-y-6 relative z-10">
        {/* Main Card with Official Layout (Inspired by AssessoriaVIP/Chromos example) */}
        <div className={`bg-white rounded-[32px] shadow-2xl p-8 sm:p-12 text-center border border-slate-100 space-y-6 ${look.fontClass}`}>
          {/* Top Logo / Circular Emblem if provided */}
          {coverImage ? (
            <div className="max-w-[130px] mx-auto rounded-full overflow-hidden mb-2">
              <img
                src={coverImage}
                alt={event.title}
                className="w-full h-auto object-contain mx-auto max-h-32"
              />
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-50/80 border border-amber-200/90 flex flex-col items-center justify-center text-[10px] text-amber-800 font-serif shadow-2xs p-1 mb-2">
              <span className="italic text-[11px] font-medium">Vamos celebrar!</span>
              <span className="font-bold uppercase tracking-wider text-[8px] mt-0.5 opacity-80">CONVITE OFICIAL</span>
            </div>
          )}

          {/* Event Title in distinctive Cyan / Blue */}
          <div>
            {look.tagline && (
              <p className="text-sm font-semibold text-slate-500 mb-1">{look.tagline}</p>
            )}
            <h1
              className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight"
              style={{ color: look.titleColor }}
            >
              {event.title}
            </h1>
            {event.category && (
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mt-1">
                {event.category}
              </p>
            )}
          </div>

          {/* Date, Ceremony, Reception & Address */}
          <div className="space-y-2 text-sm sm:text-base text-slate-700 font-medium inline-block text-left pt-1">
            {formattedEventDate && (
              <p className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 shrink-0" style={{ color: look.accentColor }} />
                <span>{formattedEventDate}</span>
              </p>
            )}

            {locationLines.length > 0 ? (
              locationLines.map((line, idx) => (
                <p key={idx} className="flex items-center gap-2.5">
                  <MapPin className="w-5 h-5 shrink-0" style={{ color: look.accentColor }} />
                  <span>{line}</span>
                </p>
              ))
            ) : event.location ? (
              <p className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 shrink-0" style={{ color: look.accentColor }} />
                <span>{event.location}</span>
              </p>
            ) : null}
          </div>

          {/* Personalized Invitation Message with Guest Name highlighted */}
          <div className="border-t border-slate-100 pt-5">
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Aqui está o QR Code do convite{' '}
              <strong className="font-bold" style={{ color: look.accentColor }}>{guest.name}</strong>,
              <br className="hidden sm:inline" /> que deve ser apresentado na recepção do evento.
            </p>
            {guest.category && guest.category !== 'Geral' && (
              <div className="mt-2">
                <Badge variant={guest.category === 'VIP' ? 'warning' : 'info'}>
                  {guest.category}
                </Badge>
              </div>
            )}
          </div>

          {/* QR Code Presentation */}
          <div className="pt-2">
            {isCancelled ? (
              <div className="p-6 bg-rose-50 rounded-2xl border border-rose-200 text-rose-700 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto" />
                <p className="font-bold text-sm">Convite Cancelado</p>
                <p className="text-xs">Este convite foi revogado pela organização.</p>
              </div>
            ) : isUsed ? (
              <div className="p-6 bg-slate-100 rounded-2xl border border-slate-200 text-slate-700 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-sm">Convite Já Utilizado</p>
                <p className="text-xs">Entrada registrada na portaria do evento.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="inline-block p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-md">
                  <img
                    src={invitation.qrCodeUrl}
                    alt="QR Code do Convite"
                    className="w-56 h-56 sm:w-64 sm:h-64 mx-auto object-contain"
                  />
                </div>
                {token && (
                  <div className="max-w-xs mx-auto space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Código do convite
                    </p>
                    <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <code className="flex-1 text-[11px] leading-relaxed text-slate-700 font-mono break-all select-all text-left">
                        {token}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyToken}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold min-h-9 px-3 py-1 shrink-0 text-slate-400 hover:text-slate-700 rounded transition-colors"
                        title="Copiar código"
                        aria-label="Copiar código do convite"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copiar</span>
                      </button>
                    </div>
                  </div>
                )}
                <p className="text-xs text-slate-500 font-medium">
                  Entradas permitidas: <strong>{invitation.maxEntries}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleDownloadQrCode}
              className="w-full flex items-center justify-center gap-2 shadow-md font-bold text-white rounded-xl hover:brightness-110"
              style={{ backgroundColor: look.buttonColor }}
              leftIcon={<Download className="w-5 h-5" />}
            >
              Baixar Imagem do QR Code
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 rounded-xl border-slate-200"
                leftIcon={<Share2 className="w-4 h-4" style={{ color: look.buttonColor }} />}
              >
                Compartilhar
              </Button>

              <Button
                variant="secondary"
                size="md"
                disabled={downloading}
                onClick={handleDownloadPdf}
                className="flex items-center justify-center gap-1.5 rounded-xl"
                leftIcon={<FileDown className="w-4 h-4 text-slate-700" />}
              >
                Baixar PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
