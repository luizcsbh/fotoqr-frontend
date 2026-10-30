import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Share2, ExternalLink, Check, Copy, Wifi, Images, Tv, Sparkles, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../UI/Button';
import { getShareableEventUrl, getGalleryUrl, getPresentationUrl } from '../../utils/url';
import { getFotoQrImageSettings } from '../../utils/qrLogo';
import { loadQRCustomization, EVENT_THEMES } from '../../utils/qrThemes';
import toast from 'react-hot-toast';

interface QRCodeDisplayProps {
  uuid: string;
  eventTitle: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ uuid, eventTitle }) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Load custom style if saved
  const customConfig = React.useMemo(() => {
    return loadQRCustomization(uuid, eventTitle);
  }, [uuid, eventTitle]);

  const activeTheme = EVENT_THEMES[customConfig.eventType] || EVENT_THEMES.casamento;

  const qrImageSettings = React.useMemo(() => {
    if (customConfig.iconChoice === 'none') return undefined;
    if (customConfig.iconChoice === 'fotoqr') return getFotoQrImageSettings(280);
    return {
      src: activeTheme.iconSvg,
      height: 52,
      width: 52,
      excavate: true,
    };
  }, [customConfig.iconChoice, activeTheme]);

  // Mobile-friendly URL that uses local Wi-Fi IP when running locally
  const publicUrl = getShareableEventUrl(uuid);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Não foi possível copiar o link.');
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;

    // Create a high-res styled image with title and border
    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    const padding = 48;
    const headerHeight = 70;
    const qrSize = canvas.width;
    exportCanvas.width = qrSize + padding * 2;
    exportCanvas.height = qrSize + padding * 2 + headerHeight;

    // Background
    ctx.fillStyle = customConfig.bgColor || '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Title
    ctx.fillStyle = customConfig.fgColor || '#0f172a';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(customConfig.title || eventTitle, exportCanvas.width / 2, 45);

    // Subtitle
    ctx.fillStyle = '#64748b';
    ctx.font = '600 15px system-ui, -apple-system, sans-serif';
    ctx.fillText(customConfig.subtitle || 'Aponte a câmera e envie suas fotos', exportCanvas.width / 2, 72);

    // Draw QR
    ctx.drawImage(canvas, padding, padding + headerHeight);

    // Download link
    const image = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    const filename = `${(customConfig.title || eventTitle).toLowerCase().replace(/[^a-z0-9]/gi, '_')}-qrcode.png`;
    link.download = filename;
    link.href = image;
    link.click();
    toast.success('QR Code baixado em alta definição!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Compartilhe fotos em ${eventTitle}`,
          text: `Acesse o álbum de fotos do evento "${eventTitle}" e envie seus registros direto pelo celular:`,
          url: publicUrl,
        });
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="flex flex-col items-center bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center">
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full flex items-center gap-1.5">
        <Wifi className="w-3.5 h-3.5" />
        QR Code do Evento
      </div>
      <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 tracking-tight">
        Exiba aos seus convidados
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-4">
        Qualquer pessoa que apontar a câmera do celular poderá enviar fotos sem precisar instalar aplicativo ou fazer login.
      </p>

      {/* Button to open QR Customizer Studio */}
      <Link to={`/dashboard/evento/${uuid}/qrcode`} className="w-full mb-5">
        <Button
          variant="secondary"
          size="sm"
          className="w-full bg-linear-to-r from-brand-50 to-emerald-50 border-brand-200 text-brand-900 hover:border-brand-300 font-bold shadow-xs py-2.5"
          leftIcon={<Sparkles className="w-4 h-4 text-brand-600" />}
        >
          Personalizar Cores & Placas de Mesa
        </Button>
      </Link>

      {/* Large QR Code Box with custom colors */}
      <div
        ref={qrRef}
        className="p-6 rounded-3xl border-4 shadow-xl flex items-center justify-center relative group"
        style={{
          backgroundColor: customConfig.bgColor || '#ffffff',
          borderColor: customConfig.fgColor ? `${customConfig.fgColor}25` : '#f1f5f9',
        }}
      >
        <QRCodeCanvas
          value={publicUrl}
          size={260}
          fgColor={customConfig.fgColor || '#000000'}
          bgColor={customConfig.bgColor || '#ffffff'}
          level="H"
          includeMargin={false}
          imageSettings={qrImageSettings}
        />
      </div>

      {/* URL preview box */}
      <div className="mt-6 flex flex-col gap-2 max-w-md w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>URL para celular:</span>
          <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
            Rede Wi-Fi
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            id={`qrcode-public-url-${uuid}`}
            name={`qrcode_public_url_${uuid}`}
            type="text"
            readOnly
            value={publicUrl}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono select-all focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          💡 Para que o celular abra a página, ele deve estar conectado no <strong>mesmo Wi-Fi</strong> deste computador.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
        <Button
          variant="primary"
          size="md"
          onClick={handleDownloadQR}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Baixar Imagem PNG
        </Button>

        <Button
          variant="outline"
          size="md"
          onClick={handleShare}
          leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
        >
          Compartilhar Link
        </Button>

        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
        >
          <Button
            variant="ghost"
            size="md"
            leftIcon={<ExternalLink className="w-4 h-4" />}
          >
            Abrir Página Pública
          </Button>
        </a>

        <a
          href={getGalleryUrl(uuid)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full"
        >
          <Button
            variant="secondary"
            size="md"
            className="w-full"
            leftIcon={<Images className="w-4 h-4" />}
          >
            Ver Galeria de Fotos
          </Button>
        </a>

        <a
          href={getPresentationUrl(uuid)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full"
        >
          <Button
            variant="primary"
            size="md"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-md border border-slate-700"
            leftIcon={<Tv className="w-4 h-4 text-brand-400" />}
          >
            Modo Telão (Retroprojetor)
          </Button>
        </a>
      </div>
    </div>
  );
};
