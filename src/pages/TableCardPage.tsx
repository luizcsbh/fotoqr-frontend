import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, Download, AlertCircle, Calendar, MapPin, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { invitationService } from '../services/invitation.service';
import { PublicInvitation } from '../types';
import { resolveInvitationLook } from '../utils/invitationTemplates';
import { renderTableCardToDataUrl } from '../utils/watermark';

export const TableCardPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await invitationService.getPublicInvitation(token);
        setData(res);
      } catch {
        toast.error('Convite não encontrado ou cancelado.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPng = async () => {
    if (!data) return;
    try {
      setDownloading(true);
      const look = resolveInvitationLook({
        templateId: data.event.invitationTemplate,
        coverImage: data.event.coverImage,
        backgroundImage: data.event.backgroundImage,
      });

      const formattedDate = data.event.startAt
        ? new Date(data.event.startAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : undefined;

      const dataUrl = await renderTableCardToDataUrl({
        guestName: data.guest.name,
        guestCategory: data.guest.category,
        eventTitle: data.event.title,
        eventDate: formattedDate,
        eventLocation: data.event.location ?? undefined,
        qrCodeUrl: data.invitation.qrCodeUrl,
        accentColor: look.accentColor,
        watermarkText: `${data.event.title} • FotoQREventos`,
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `placa-mesa-${data.guest.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Placa de mesa baixada com sucesso!');
    } catch (err) {
      toast.error('Erro ao gerar a placa de mesa.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-500 text-sm animate-pulse">Carregando placa de mesa...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Convite não encontrado</h2>
          <p className="text-sm text-slate-500">
            Este convite pode ter sido cancelado ou o link está incorreto.
          </p>
        </div>
      </div>
    );
  }

  const { invitation, guest, event } = data;
  const isCancelled = invitation.status === 'cancelled';

  const look = resolveInvitationLook({
    templateId: event.invitationTemplate,
    coverImage: event.coverImage,
    backgroundImage: event.backgroundImage,
  });

  const formattedDate = event.startAt
    ? new Date(event.startAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const isVip = /vip/i.test(guest.category);

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center justify-center p-6 print:bg-white print:p-0">
      {/* Estilo de impressão */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; margin: 0; }
          .table-card {
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: avoid;
          }
        }
      `}</style>

      {/* Botões de ação */}
      <div className="no-print flex gap-3 mb-6">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-white text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg border border-slate-200 hover:bg-slate-50 transition-all"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
        <button
          onClick={handleDownloadPng}
          disabled={downloading || isCancelled}
          className="flex items-center gap-2 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: look.accentColor }}
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Gerando...' : 'Baixar PNG'}
        </button>
      </div>

      {/* Placa de Mesa — dimensões A6 paisagem */}
      <div
        ref={cardRef}
        className={`table-card bg-white shadow-2xl relative overflow-hidden ${look.fontClass}`}
        style={{
          width: '148mm',
          minHeight: '105mm',
          borderRadius: '12px',
          borderTop: `6px solid ${look.accentColor}`,
          border: `1.5px solid #e2e8f0`,
          borderTopColor: look.accentColor,
          borderTopWidth: '6px',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Marca d'água diagonal (CSS) */}
        <div
          className="absolute inset-0 pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
          style={{ zIndex: 0 }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                color: 'rgba(0,0,0,0.07)',
                fontSize: '13px',
                fontFamily: 'Georgia, serif',
                whiteSpace: 'nowrap',
                transform: 'rotate(-35deg)',
                top: `${(i % 4) * 28 - 10}%`,
                left: `${Math.floor(i / 4) * 38 - 15}%`,
                letterSpacing: '0.03em',
              }}
            >
              {event.title} • FotoQREventos
            </span>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="relative z-10 p-6 h-full flex flex-col justify-between" style={{ minHeight: '95mm' }}>
          {/* Topo: título do evento + QR Code */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-bold uppercase tracking-widest truncate"
                style={{ color: look.accentColor }}
              >
                {event.title}
              </p>
              <div className="mt-0.5 h-px bg-slate-100 w-full" />
            </div>
            {/* QR Code */}
            <div className="shrink-0 p-1.5 bg-white border border-slate-200 rounded-lg shadow-xs">
              {isCancelled ? (
                <div className="w-20 h-20 flex items-center justify-center bg-rose-50 rounded-sm">
                  <AlertCircle className="w-8 h-8 text-rose-400" />
                </div>
              ) : (
                <img
                  src={invitation.qrCodeUrl}
                  alt="QR Code"
                  className="w-20 h-20 object-contain"
                />
              )}
            </div>
          </div>

          {/* Centro: Nome e Categoria */}
          <div className="text-center py-4 space-y-2">
            {isCancelled && (
              <div className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-1 inline-block mb-4">
                CONVITE CANCELADO
              </div>
            )}
            <h1
              className="font-bold leading-tight text-slate-800"
              style={{
                fontSize: guest.name.length > 25 ? '22px' : guest.name.length > 18 ? '28px' : '34px',
                fontFamily: 'Georgia, serif',
              }}
            >
              {guest.name}
            </h1>
            <div className="flex justify-center">
              <span
                className="text-xs font-bold px-3 py-1 rounded-full border"
                style={
                  isVip
                    ? { backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#d97706' }
                    : { backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#3b82f6' }
                }
              >
                {guest.category}
              </span>
            </div>
          </div>

          {/* Rodapé: data e local */}
          <div className="space-y-1">
            <div className="h-px bg-slate-100 w-full mb-2" />
            {formattedDate && (
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: look.accentColor }} />
                <span>{formattedDate}</span>
              </p>
            )}
            {event.location && (
              <p className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: look.accentColor }} />
                <span className="truncate">{event.location}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dica */}
      <p className="no-print mt-4 text-xs text-slate-400 text-center max-w-xs">
        <QrCode className="w-3.5 h-3.5 inline mr-1 opacity-60" />
        Imprima e coloque sobre a mesa do convidado. O QR Code permite validação na portaria.
      </p>
    </div>
  );
};
