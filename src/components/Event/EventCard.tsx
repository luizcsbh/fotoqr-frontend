import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Image as ImageIcon, ArrowRight, ToggleLeft, ToggleRight, QrCode, Maximize2, Download, Copy, Check, ExternalLink, Tv } from 'lucide-react';
import { Event } from '../../types';
import { Card } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';
import { QRCodeCanvas } from 'qrcode.react';
import { getShareableEventUrl, getPresentationUrl } from '../../utils/url';
import { getFotoQrImageSettings } from '../../utils/qrLogo';
import toast from 'react-hot-toast';

interface EventCardProps {
  event: Event;
  onToggleActive?: (id: string, currentStatus: boolean) => void;
  isToggling?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onToggleActive,
  isToggling = false,
}) => {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generates mobile-friendly URL using LAN IP when on localhost
  const publicUrl = getShareableEventUrl(event.uuid);
  const manageUrl = `/dashboard/event/${event.id || event.uuid}`;

  const formattedDate = (() => {
    const rawStart = event.start_date || event.event_date;
    if (!rawStart) return 'Data a definir';
    try {
      const dStart = new Date(rawStart.includes('T') ? rawStart : rawStart + 'T00:00:00');
      if (isNaN(dStart.getTime())) return 'Data a definir';

      const datePart = dStart.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const hasStartTime = rawStart.includes('T') && !rawStart.endsWith('T00:00:00.000Z') && !rawStart.endsWith('T00:00:00');
      const timeStart = hasStartTime ? dStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;

      if (event.end_date) {
        const dEnd = new Date(event.end_date);
        if (!isNaN(dEnd.getTime())) {
          const timeEnd = dEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          if (timeStart) {
            return `${datePart} • ${timeStart} às ${timeEnd}`;
          }
        }
      }

      return timeStart ? `${datePart} • ${timeStart}` : datePart;
    } catch {
      return 'Data a definir';
    }
  })();

  const storageLabels: Record<string, string> = {
    local: 'Servidor Local',
    fallback: 'Armazenamento local',
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar link.');
    }
  };

  const handleDownload = () => {
    const canvas = document.getElementById(`qr-canvas-${event.uuid}`) as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = `fotoqr-${event.title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.png`;
    a.href = url;
    a.click();
    toast.success('QR Code baixado!');
  };

  return (
    <>
      <Card hoverable className="flex flex-col justify-between overflow-hidden relative group">
        <div>
          {/* Top Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge variant={event.is_active ? 'success' : 'neutral'} dot={event.is_active}>
                  {event.is_active ? 'Recebendo Fotos' : 'Pausado'}
                </Badge>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {storageLabels[event.storage_mode] || event.storage_mode}
                </span>
              </div>

              <Link
                to={manageUrl}
                className="block group-hover:text-brand-600 transition-colors"
              >
                <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">
                  {event.title}
                </h3>
              </Link>
            </div>

            {/* Clickable QR thumbnail with hover zoom overlay */}
            <button
              type="button"
              onClick={() => setIsQRModalOpen(true)}
              className="p-1.5 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-brand-500 transition-all shrink-0 relative group/qr focus:outline-none focus:ring-2 focus:ring-brand-500"
              title="Clique para ampliar o QR Code"
            >
              <QRCodeCanvas
                value={publicUrl}
                size={64}
                level="H"
                imageSettings={getFotoQrImageSettings(64)}
              />
              <div className="absolute inset-0 bg-slate-900/60 rounded-xl opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Maximize2 className="w-5 h-5 drop-shadow" />
              </div>
            </button>
          </div>

          {/* Description if present */}
          {event.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
              {event.description}
            </p>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-100 text-xs text-slate-600 mb-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span className="font-semibold text-slate-800">
                {event.photo_count || 0} {event.photo_count === 1 ? 'foto' : 'fotos'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100/60">
          <div className="flex items-center gap-1.5">
            {onToggleActive && (
              <button
                type="button"
                onClick={() => onToggleActive(event.id, event.is_active)}
                disabled={isToggling}
                className={`flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg transition-colors ${
                  event.is_active
                    ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    : 'text-slate-500 bg-slate-100 hover:bg-slate-200'
                }`}
                title={event.is_active ? 'Pausar recebimento de fotos' : 'Reativar recebimento de fotos'}
              >
                {event.is_active ? (
                  <>
                    <ToggleRight className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">Ativo</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 text-slate-400" />
                    <span className="hidden sm:inline">Pausado</span>
                  </>
                )}
              </button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsQRModalOpen(true)}
              leftIcon={<QrCode className="w-3.5 h-3.5 text-brand-600" />}
              className="text-xs"
            >
              QR Code
            </Button>

            <a
              href={getPresentationUrl(event.uuid)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Tv className="w-3.5 h-3.5 text-slate-700" />}
                className="text-xs text-slate-700 hover:text-slate-900"
                title="Abrir Modo Apresentação para retroprojetor"
              >
                Telão
              </Button>
            </a>
          </div>

          <Link
            to={manageUrl}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-xl shadow-xs hover:shadow transition-all"
            title="Gerenciar evento, fotos e links de acesso"
          >
            <span>Gerenciar</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </Card>

      {/* Large QR Code Modal */}
      <Modal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        title={event.title}
        description="Aponte a câmera do celular para este QR Code para enviar fotos direto ao álbum."
        maxWidth="md"
      >
        <div className="flex flex-col items-center text-center py-2">
          {/* Prominent High-Contrast QR Code */}
          <div className="p-6 bg-white rounded-3xl border-4 border-slate-100 shadow-xl inline-block mb-4">
            <QRCodeCanvas
              id={`qr-canvas-${event.uuid}`}
              value={publicUrl}
              size={280}
              level="H"
              includeMargin={false}
              imageSettings={getFotoQrImageSettings(280)}
            />
          </div>

          {/* Wi-Fi & URL notice */}
          <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3 mb-4 text-left">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Link do Álbum para Celular:
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Pronto para escanear
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id={`modal-public-url-${event.uuid}`}
                name={`modal_public_url_${event.uuid}`}
                type="text"
                readOnly
                value={publicUrl}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              💡 <strong>Dica de rede local:</strong> Para o celular abrir a página com sucesso, verifique se o aparelho está conectado na <strong>mesma rede Wi-Fi</strong> deste computador.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 w-full justify-center">
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Baixar QR Code (PNG)
            </Button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ExternalLink className="w-4 h-4" />}
              >
                Abrir no Navegador
              </Button>
            </a>
          </div>
        </div>
      </Modal>
    </>
  );
};
