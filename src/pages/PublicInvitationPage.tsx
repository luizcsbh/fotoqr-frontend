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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { invitationService } from '../services/invitation.service';
import { PublicInvitation } from '../types';

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
    if (!data) return;
    try {
      setDownloading(true);
      await invitationService.downloadPdf(
        data.invitation.id,
        `convite-${data.guest.name.toLowerCase().replace(/\s+/g, '-')}.pdf`
      );
      toast.success('Download do convite em PDF iniciado!');
    } catch {
      toast.error('Erro ao baixar o convite em PDF.');
    } finally {
      setDownloading(false);
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
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link do convite copiado para a área de transferência!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-white text-sm">Carregando seu convite digital...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center bg-white space-y-4">
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
  const isUsed = invitation.usedEntries >= invitation.maxEntries;
  const isCancelled = invitation.status === 'cancelled';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 py-12 relative overflow-hidden"
      style={{
        background: event.backgroundImage
          ? `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95)), url(${event.backgroundImage}) center/cover no-repeat fixed`
          : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      }}
    >
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Main Digital Ticket Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 transition-all duration-300">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 text-center relative">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm uppercase tracking-wider mb-2">
              Convite Oficial
            </span>
            <h1 className="text-2xl font-black tracking-tight">{event.title}</h1>
            {event.category && (
              <p className="text-xs text-indigo-200 mt-1 font-medium">{event.category}</p>
            )}
          </div>

          {/* Ticket Body */}
          <div className="p-6 space-y-6 text-center">
            {/* Guest Info */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Convidado de Honra
              </span>
              <h2 className="text-2xl font-extrabold text-slate-800">{guest.name}</h2>
              <div className="pt-1">
                <Badge variant={guest.category === 'VIP' ? 'warning' : 'info'}>
                  Categoria: {guest.category}
                </Badge>
              </div>
            </div>

            {/* Event Time & Location Details */}
            <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-3 text-sm text-slate-700 border border-slate-100">
              {event.startAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold uppercase">Data e Horário</span>
                    <span className="font-semibold">{new Date(event.startAt).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              )}

              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold uppercase">Local</span>
                    <span className="font-medium">{event.location}</span>
                  </div>
                </div>
              )}
            </div>

            {/* QR Code Validation Box */}
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
                <div className="space-y-3">
                  <div className="inline-block p-4 bg-white rounded-2xl shadow-inner border border-slate-200">
                    <img
                      src={invitation.qrCodeUrl}
                      alt="QR Code do Convite"
                      className="w-48 h-48 mx-auto object-contain"
                    />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Apresente este QR Code na portaria para autorização de entrada.
                  </p>
                  <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                    Entradas permitidas: {invitation.maxEntries}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4 text-indigo-600" /> Compartilhar
              </Button>

              <Button
                variant="primary"
                size="sm"
                disabled={downloading}
                onClick={handleDownloadPdf}
                className="flex items-center justify-center gap-1.5"
              >
                <FileDown className="w-4 h-4" /> Baixar PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

