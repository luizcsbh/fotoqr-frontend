import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QRCodeCanvas } from 'qrcode.react';
import {
  ArrowLeft,
  Sparkles,
  Download,
  Printer,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Palette,
  Type,
  Wifi,
  Eye,
  Info,
  AlertTriangle,
  Heart,
  Cake,
  PartyPopper,
  Briefcase,
  Share2,
  ExternalLink,
  Save,
} from 'lucide-react';
import { eventService } from '../services/event.service';
import { Button } from '../components/UI/Button';
import { LoadingScreen } from '../components/Layout/LoadingScreen';
import { getShareableEventUrl } from '../utils/url';
import { getFotoQrImageSettings } from '../utils/qrLogo';
import {
  EVENT_THEMES,
  EventTypeCategory,
  QRFrameStyle,
  QRIconChoice,
  QRColorPreset,
  isContrastSafe,
  loadQRCustomization,
  hasLocalQRCustomization,
  saveQRCustomization,
  StoredQRCustomization,
  getEventIconSvg,
} from '../utils/qrThemes';
import toast from 'react-hot-toast';
import { ApiError } from '../types';

export const QRCodeCustomizerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch Event
  const {
    data: event,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventService.getEventById(id!),
    enabled: !!id,
  });

  // Saved design from the server, so it is the same on every device
  const serverCustomization = useQuery({
    queryKey: ['qrCustomization', id],
    queryFn: () => eventService.getQRCustomization(id!),
    enabled: !!id,
    retry: 1,
    staleTime: Infinity,
  });

  const previewCardRef = useRef<HTMLDivElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Customization State
  const [eventType, setEventType] = useState<EventTypeCategory>('casamento');
  const [fgColor, setFgColor] = useState('#883A53');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [cardBg, setCardBg] = useState('#FFF7F8');
  const [cardTextColor, setCardTextColor] = useState('#4A1D2B');
  const [badgeBg, setBadgeBg] = useState('#FCE7F3');
  const [badgeTextColor, setBadgeTextColor] = useState('#9D174D');
  const [borderColor, setBorderColor] = useState('#FBCFE8');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [wifiName, setWifiName] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [frameStyle, setFrameStyle] = useState<QRFrameStyle>('table-card');
  const [iconChoice, setIconChoice] = useState<QRIconChoice>('theme-icon');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('rose-gold');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [baselinePending, setBaselinePending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // true when the design only exists in this browser and still has to be sent to the server
  const [needsSync, setNeedsSync] = useState(false);
  const initializedForRef = useRef<string | null>(null);

  // Initialize once per event: server design first, then this browser's copy, then theme defaults
  useEffect(() => {
    if (event && !serverCustomization.isLoading && initializedForRef.current !== event.uuid) {
      initializedForRef.current = event.uuid;
      const fromServer = serverCustomization.data ?? null;
      const saved = fromServer
        ? { ...fromServer, title: fromServer.title || event.title }
        : loadQRCustomization(event.uuid, event.title);
      setNeedsSync(!fromServer && serverCustomization.isSuccess && hasLocalQRCustomization(event.uuid));
      setEventType(saved.eventType);
      setFgColor(saved.fgColor);
      setBgColor(saved.bgColor);
      setTitle(saved.title || event.title);
      setSubtitle(saved.subtitle);
      setInstructions(saved.instructions);
      setWifiName(saved.wifiName || '');
      setWifiPassword(saved.wifiPassword || '');
      setFrameStyle(saved.frameStyle || 'table-card');
      setIconChoice(saved.iconChoice || 'theme-icon');
      if (saved.presetId) {
        setSelectedPresetId(saved.presetId);
        const currentTheme = EVENT_THEMES[saved.eventType];
        const match = currentTheme.presets.find((p) => p.id === saved.presetId);
        if (match) {
          setCardBg(match.cardBg);
          setCardTextColor(match.cardTextColor);
          setBadgeBg(match.badgeBg);
          setBadgeTextColor(match.badgeTextColor);
          setBorderColor(match.borderColor);
        }
      }
      // The values above only land on the next render; take the "saved" baseline then
      setBaselinePending(true);
    }
  }, [event, serverCustomization.isLoading, serverCustomization.isSuccess, serverCustomization.data]);

  const publicUrl = useMemo(() => {
    return event ? getShareableEventUrl(event.uuid) : '';
  }, [event]);

  // Contrast check
  const contrastInfo = useMemo(() => {
    return isContrastSafe(fgColor, bgColor);
  }, [fgColor, bgColor]);

  // Handle Event Type Change
  const handleSelectEventType = (type: EventTypeCategory) => {
    setEventType(type);
    const theme = EVENT_THEMES[type];
    const defaultPreset = theme.presets[0];
    setSelectedPresetId(defaultPreset.id);
    setFgColor(defaultPreset.fgColor);
    setBgColor(defaultPreset.bgColor);
    setCardBg(defaultPreset.cardBg);
    setCardTextColor(defaultPreset.cardTextColor);
    setBadgeBg(defaultPreset.badgeBg);
    setBadgeTextColor(defaultPreset.badgeTextColor);
    setBorderColor(defaultPreset.borderColor);

    // Update texts if untouched or set to other default
    if (!title || Object.values(EVENT_THEMES).some((t) => t.defaultTitlePlaceholder === title)) {
      setTitle(event?.title || theme.defaultTitlePlaceholder);
    }
    setSubtitle(theme.defaultSubtitle);
    setInstructions(theme.defaultInstructions);
  };

  // Handle Preset Selection
  const handleSelectPreset = (preset: QRColorPreset) => {
    setSelectedPresetId(preset.id);
    setFgColor(preset.fgColor);
    setBgColor(preset.bgColor);
    setCardBg(preset.cardBg);
    setCardTextColor(preset.cardTextColor);
    setBadgeBg(preset.badgeBg);
    setBadgeTextColor(preset.badgeTextColor);
    setBorderColor(preset.borderColor);
  };

  // Current customization, in the exact shape that gets saved
  const currentConfig = useMemo<StoredQRCustomization | null>(() => {
    if (!event) return null;
    return {
      eventType,
      fgColor,
      bgColor,
      title: title.trim() || event.title,
      subtitle: subtitle.trim(),
      instructions: instructions.trim(),
      wifiName: wifiName.trim(),
      wifiPassword: wifiPassword.trim(),
      frameStyle,
      iconChoice,
      presetId: selectedPresetId,
    };
  }, [event, eventType, fgColor, bgColor, title, subtitle, instructions, wifiName, wifiPassword, frameStyle, iconChoice, selectedPresetId]);

  const currentConfigJson = currentConfig ? JSON.stringify(currentConfig) : '';
  const [savedConfigJson, setSavedConfigJson] = useState<string | null>(null);

  // Take the loaded customization as the "saved" baseline once the init effect has applied it
  useEffect(() => {
    if (baselinePending && currentConfigJson) {
      setSavedConfigJson(currentConfigJson);
      setBaselinePending(false);
    }
  }, [baselinePending, currentConfigJson]);

  const hasUnsavedChanges = needsSync || (savedConfigJson !== null && currentConfigJson !== savedConfigJson);

  // Save changes
  const handleSave = async () => {
    if (!event || !currentConfig || isSaving) return;
    setIsSaving(true);
    try {
      await eventService.saveQRCustomization(event.id, currentConfig);
      // Local copy keeps working offline and as a fallback if the server is unreachable
      saveQRCustomization(event.uuid, currentConfig);
      setSavedConfigJson(currentConfigJson);
      setNeedsSync(false);
      toast.success('Alterações do QR Code salvas! Já valem em todos os seus dispositivos.');
    } catch (err) {
      toast.error((err as ApiError)?.message || 'Não foi possível salvar as alterações do QR Code.');
    } finally {
      setIsSaving(false);
    }
  };

  // Ctrl+S / Cmd+S saves, and leaving the page with unsaved changes asks for confirmation
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleBack = () => {
    if (hasUnsavedChanges && !window.confirm('Você tem alterações não salvas no QR Code. Sair mesmo assim?')) return;
    navigate(`/dashboard/evento/${id}`);
  };

  // Restore Defaults for current theme
  const handleReset = () => {
    const theme = EVENT_THEMES[eventType];
    const preset = theme.presets[0];
    handleSelectPreset(preset);
    setTitle(event?.title || theme.defaultTitlePlaceholder);
    setSubtitle(theme.defaultSubtitle);
    setInstructions(theme.defaultInstructions);
    setFrameStyle('table-card');
    setIconChoice('theme-icon');
    toast('Estilos redefinidos para os valores padrão.', { icon: '🔄' });
  };

  // Copy link
  const handleCopyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error('Erro ao copiar link.');
    }
  };

  // Get QR Image Settings based on choice
  // The icon SVG is generated dynamically so its color always matches fgColor
  const qrImageSettings = useMemo(() => {
    if (iconChoice === 'none') return undefined;
    if (iconChoice === 'fotoqr') return getFotoQrImageSettings(280);

    // Theme icon — color matches the QR foreground color
    return {
      src: getEventIconSvg(eventType, fgColor),
      height: 52,
      width: 52,
      excavate: true,
    };
  }, [iconChoice, eventType, fgColor]);

  // High-Resolution PNG Export (2000px+ HQ)
  const handleDownloadHighRes = async () => {
    if (!previewCardRef.current) return;
    setIsExporting(true);
    const toastId = toast.loading('Gerando imagem em alta resolução...');

    try {
      const qrCanvas = previewCardRef.current.querySelector('canvas') as HTMLCanvasElement;
      if (!qrCanvas) throw new Error('QR Canvas não encontrado');

      // Create Offscreen High-Res Canvas
      const exportCanvas = document.createElement('canvas');
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) throw new Error('Não foi possível obter contexto 2D');

      if (frameStyle === 'qr-only') {
        // Pure QR Code download at 1200x1200px
        const qrExportSize = 1200;
        exportCanvas.width = qrExportSize;
        exportCanvas.height = qrExportSize;
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, qrExportSize, qrExportSize);
        ctx.drawImage(qrCanvas, 60, 60, qrExportSize - 120, qrExportSize - 120);
      } else {
        // High-res Table Tent Poster (1400 x 1980px - Perfect 300DPI A5)
        const width = 1400;
        const height = 1980;
        exportCanvas.width = width;
        exportCanvas.height = height;

        // Background
        ctx.fillStyle = cardBg;
        ctx.fillRect(0, 0, width, height);

        // Elegant Card Border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 14;
        ctx.strokeRect(36, 36, width - 72, height - 72);

        // Header Emoji/Icon Badge
        const theme = EVENT_THEMES[eventType];
        ctx.fillStyle = badgeBg;
        const badgeWidth = 440;
        const badgeHeight = 64;
        const badgeX = (width - badgeWidth) / 2;
        ctx.beginPath();
        ctx.roundRect(badgeX, 100, badgeWidth, badgeHeight, 32);
        ctx.fill();

        ctx.fillStyle = badgeTextColor;
        ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${theme.emoji} ${theme.name.toUpperCase()}`, width / 2, 132);

        // Title
        ctx.fillStyle = cardTextColor;
        ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
        const displayTitle = title || event?.title || 'Nosso Evento';
        ctx.fillText(displayTitle, width / 2, 240);

        // Subtitle
        ctx.font = '500 32px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = fgColor;
        ctx.fillText(subtitle, width / 2, 310);

        // Instructions banner
        ctx.fillStyle = cardTextColor;
        ctx.font = '400 24px system-ui, -apple-system, sans-serif';
        ctx.fillText(instructions, width / 2, 370);

        // QR Code Box (with soft white container)
        const qrContainerSize = 820;
        const qrContainerX = (width - qrContainerSize) / 2;
        const qrContainerY = 440;

        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.roundRect(qrContainerX, qrContainerY, qrContainerSize, qrContainerSize, 48);
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw the QR Code scaled up
        ctx.drawImage(qrCanvas, qrContainerX + 60, qrContainerY + 60, qrContainerSize - 120, qrContainerSize - 120);

        // Bottom CTA callout
        ctx.fillStyle = cardTextColor;
        ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
        ctx.fillText('Aponte a câmera do seu celular', width / 2, 1340);

        ctx.font = '400 24px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#64748B';
        ctx.fillText('Não precisa baixar nenhum aplicativo • Envio instantâneo', width / 2, 1390);

        // Wi-Fi Box if specified
        if (wifiName) {
          const wifiBoxWidth = 720;
          const wifiBoxHeight = 110;
          const wifiBoxX = (width - wifiBoxWidth) / 2;
          const wifiBoxY = 1460;

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.roundRect(wifiBoxX, wifiBoxY, wifiBoxWidth, wifiBoxHeight, 24);
          ctx.fill();
          ctx.strokeStyle = '#E2E8F0';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.fillStyle = '#0F172A';
          ctx.font = '600 26px system-ui, -apple-system, sans-serif';
          let wifiText = `📶 Rede Wi-Fi: ${wifiName}`;
          if (wifiPassword) wifiText += ` | Senha: ${wifiPassword}`;
          ctx.fillText(wifiText, width / 2, wifiBoxY + 55);
        }

        // Footer Branding
        ctx.fillStyle = '#94A3B8';
        ctx.font = '500 20px system-ui, -apple-system, sans-serif';
        ctx.fillText('FotoQR • Compartilhe suas melhores memórias', width / 2, 1860);
      }

      // Download file
      const link = document.createElement('a');
      const filename = `${(title || event?.title || 'qrcode')
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, '_')}-placa-mesa-hq.png`;
      link.download = filename;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();

      toast.success('Imagem em alta resolução baixada!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar imagem de alta resolução.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  // Print Table Card — generates a high-quality popup print window
  const handlePrint = () => {
    const qrCanvas = previewCardRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
    if (!qrCanvas) {
      toast.error('QR Code ainda não carregou. Aguarde um instante e tente novamente.');
      return;
    }

    // Render QR to a high-res offscreen canvas (2× for clarity)
    const HQ = 600;
    const offscreen = document.createElement('canvas');
    offscreen.width = HQ;
    offscreen.height = HQ;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, HQ, HQ);
    ctx.drawImage(qrCanvas, 0, 0, HQ, HQ);
    const qrDataUrl = offscreen.toDataURL('image/png');

    const theme = EVENT_THEMES[eventType];
    const displayTitle = title || event?.title || 'Nosso Evento';
    const displaySubtitle = subtitle || theme.defaultSubtitle;
    const displayInstructions = instructions || theme.defaultInstructions;

    const wifiSection = wifiName
      ? `<div class="wifi-box">
           <span class="wifi-icon">📶</span>
           <div class="wifi-text">
             <span class="wifi-label">Wi-Fi: <strong>${wifiName}</strong></span>
             ${wifiPassword ? `<span class="wifi-pass">Senha: <strong>${wifiPassword}</strong></span>` : ''}
           </div>
         </div>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Placa de Mesa — ${displayTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      width: 100%;
      height: 100%;
      background: #f0f0f0;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }

    .card {
      background: ${cardBg};
      border: 3px solid ${borderColor};
      border-radius: 24px;
      padding: 36px 32px 28px;
      width: 148mm;
      max-width: 100%;
      text-align: center;
      box-shadow: 0 8px 40px rgba(0,0,0,0.12);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: ${badgeBg};
      color: ${badgeTextColor};
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 5px 14px;
      border-radius: 999px;
      margin-bottom: 14px;
    }

    .event-title {
      color: ${cardTextColor};
      font-size: 26px;
      font-weight: 900;
      line-height: 1.15;
      letter-spacing: -0.5px;
      margin-bottom: 6px;
      word-break: break-word;
    }

    .event-subtitle {
      color: ${fgColor};
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .event-instructions {
      color: ${cardTextColor};
      font-size: 11px;
      opacity: 0.75;
      max-width: 260px;
      line-height: 1.5;
      margin-bottom: 20px;
    }

    .qr-wrapper {
      background: ${bgColor};
      border: 2px solid ${borderColor};
      border-radius: 18px;
      padding: 18px;
      margin-bottom: 18px;
      display: inline-block;
    }

    .qr-wrapper img {
      width: 200px;
      height: 200px;
      display: block;
    }

    .cta-main {
      color: ${cardTextColor};
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 3px;
    }

    .cta-sub {
      color: #64748b;
      font-size: 10px;
      margin-bottom: 14px;
    }

    .wifi-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.9);
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 8px 14px;
      margin-bottom: 14px;
      text-align: left;
      max-width: 260px;
    }

    .wifi-icon { font-size: 16px; flex-shrink: 0; }

    .wifi-text {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .wifi-label, .wifi-pass {
      font-size: 10px;
      color: #334155;
    }

    .footer-brand {
      font-size: 9px;
      color: #94a3b8;
      letter-spacing: 0.05em;
      margin-top: 2px;
    }

    /* Print-specific overrides */
    @page {
      size: A5 portrait;
      margin: 10mm;
    }

    @media print {
      html, body {
        background: #ffffff !important;
        padding: 0 !important;
        min-height: unset;
      }

      body {
        display: block;
      }

      .card {
        box-shadow: none !important;
        border-color: ${borderColor} !important;
        margin: 0 auto;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span>${theme.emoji}</span>
      <span>${theme.name}</span>
    </div>

    <div class="event-title">${displayTitle}</div>
    <div class="event-subtitle">${displaySubtitle}</div>
    <div class="event-instructions">${displayInstructions}</div>

    <div class="qr-wrapper">
      <img src="${qrDataUrl}" alt="QR Code do Evento" />
    </div>

    <div class="cta-main">Aponte a câmera do seu celular</div>
    <div class="cta-sub">Sem precisar instalar aplicativo &bull; Fotos instantâneas</div>

    ${wifiSection}

    <div class="footer-brand">FotoQR &bull; Compartilhe suas melhores memórias</div>
  </div>
  <script>
    window.onload = function() {
      // Slight delay to ensure fonts and images load before print dialog
      setTimeout(function() {
        window.print();
        // Close window after print/cancel (some browsers fire afterprint)
        window.addEventListener('afterprint', function() { window.close(); });
      }, 600);
    };
  </script>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=700,height=900,scrollbars=yes');
    if (!printWindow) {
      toast.error('Não foi possível abrir a janela de impressão. Verifique se o navegador bloqueou popups.');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (isLoading || serverCustomization.isLoading) {
    return <LoadingScreen message="Carregando estúdio de QR Code..." />;
  }

  if (isError || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Evento não encontrado</h2>
        <p className="text-sm text-slate-600 mb-6">Não foi possível carregar as informações deste álbum.</p>
        <Link to="/dashboard">
          <Button variant="primary">Voltar ao Painel</Button>
        </Link>
      </div>
    );
  }

  const activeTheme = EVENT_THEMES[eventType];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-20 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-slate-900"
              title="Voltar ao evento"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-brand-600" />
                  Estúdio de QR Code
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-medium text-slate-500 truncate max-w-xs">{event.title}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Personalizar Placas de Mesa & QR Code
              </h1>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              title="Restaurar valores padrão"
            >
              Padrão
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Imprimir
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadHighRes}
              disabled={isExporting}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Baixar PNG HD
            </Button>
            {/* Always solid and clickable: when clean, clicking just saves (syncs) again */}
            <Button
              variant="success"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              className="relative font-bold"
              leftIcon={hasUnsavedChanges ? <Save className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              title={hasUnsavedChanges ? 'Salvar alterações (Ctrl+S)' : 'Tudo salvo (Ctrl+S salva de novo)'}
            >
              {hasUnsavedChanges ? 'Salvar' : 'Salvo'}
              {hasUnsavedChanges && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Studio 2-Column Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Controls & Customizers (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Ocasião / Tipo de Evento */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="font-bold text-slate-900 text-base">Tipo de Ocasião</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Selecione o estilo do seu evento para carregar automaticamente paletas de cores e temas recomendados:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(
                  [
                    { id: 'casamento', name: 'Casamento', icon: Heart, desc: 'Elegante & Romântico' },
                    { id: 'aniversario', name: 'Aniversário', icon: Cake, desc: 'Festivo & Memorável' },
                    { id: 'festa', name: 'Festa & Balada', icon: PartyPopper, desc: 'Vibrante & Neon' },
                    { id: 'corporativo', name: 'Corporativo', icon: Briefcase, desc: 'Executivo & Sóbrio' },
                    { id: 'outro', name: 'Geral / Outro', icon: Sparkles, desc: 'Moderno & Limpo' },
                  ] as const
                ).map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = eventType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectEventType(opt.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-500/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-600' : 'text-slate-600'}`} />
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-brand-600 ring-4 ring-brand-100"></span>
                        )}
                      </div>
                      <div>
                        <span className={`block font-bold text-sm ${isSelected ? 'text-brand-900' : 'text-slate-800'}`}>
                          {opt.name}
                        </span>
                        <span className="text-[11px] text-slate-500">{opt.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Cores e Paletas */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">Cores do QR Code & Placa</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Palette className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500 font-medium">{activeTheme.name}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Escolha uma combinação temática harmoniosa pronta ou personalize livremente a cor do QR:
              </p>

              {/* Theme Presets */}
              <div className="space-y-2 mb-5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Paletas Recomendadas para {activeTheme.name}:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeTheme.presets.map((preset) => {
                    const isSelected = selectedPresetId === preset.id && fgColor === preset.fgColor;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all text-left ${
                          isSelected
                            ? 'border-brand-600 bg-brand-50/50 shadow-xs ring-1 ring-brand-500'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        {/* Color swatches */}
                        <div className="flex items-center -space-x-1.5 shrink-0">
                          <span
                            className="w-6 h-6 rounded-full border border-white shadow-xs"
                            style={{ backgroundColor: preset.fgColor }}
                          />
                          <span
                            className="w-6 h-6 rounded-full border border-slate-200 shadow-xs"
                            style={{ backgroundColor: preset.cardBg }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-slate-800 block truncate">{preset.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{preset.fgColor}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fgColor" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <span>Cor dos Pontos do QR Code</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="fgColor"
                      type="color"
                      value={fgColor}
                      onChange={(e) => {
                        setFgColor(e.target.value);
                        setSelectedPresetId('custom');
                      }}
                      className="w-10 h-10 rounded-xl border border-slate-300 p-0.5 cursor-pointer bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={fgColor.toUpperCase()}
                      onChange={(e) => {
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                          setFgColor(e.target.value);
                          setSelectedPresetId('custom');
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="bgColor" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <span>Fundo do QR Code</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="bgColor"
                      type="color"
                      value={bgColor}
                      onChange={(e) => {
                        setBgColor(e.target.value);
                        setSelectedPresetId('custom');
                      }}
                      className="w-10 h-10 rounded-xl border border-slate-300 p-0.5 cursor-pointer bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={bgColor.toUpperCase()}
                      onChange={(e) => {
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                          setBgColor(e.target.value);
                          setSelectedPresetId('custom');
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Contrast Warning Helper */}
              {contrastInfo.warning && (
                <div
                  className={`mt-4 p-3 rounded-2xl flex items-start gap-2.5 text-xs ${
                    contrastInfo.safe
                      ? 'bg-amber-50 border border-amber-200 text-amber-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      {contrastInfo.safe ? 'Aviso de Contraste Moderado' : 'Contraste Baixo!'}
                    </span>
                    <span>{contrastInfo.warning}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Textos Personalizados da Placa de Mesa */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="font-bold text-slate-900 text-base">Textos e Mensagens</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Personalize o título, instruções e informações de Wi-Fi impressas no cartão de mesa:
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="customTitle" className="block text-xs font-semibold text-slate-700 mb-1">
                    Título Principal
                  </label>
                  <input
                    id="customTitle"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Nosso Casamento, Aniversário da Sofia..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label htmlFor="customSubtitle" className="block text-xs font-semibold text-slate-700 mb-1">
                    Subtítulo / Chamada aos Convidados
                  </label>
                  <input
                    id="customSubtitle"
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Ex: Compartilhe suas fotos e eternize esse momento!"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label htmlFor="customInstructions" className="block text-xs font-semibold text-slate-700 mb-1">
                    Texto de Instrução
                  </label>
                  <input
                    id="customInstructions"
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Ex: Aponte a câmera do celular para o QR Code abaixo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Optional Wi-Fi fields */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                    <Wifi className="w-3.5 h-3.5 text-brand-600" />
                    <span>Dados do Wi-Fi do Local (Opcional)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="wifiName" className="block text-[11px] font-medium text-slate-500 mb-1">
                        Nome da Rede Wi-Fi
                      </label>
                      <input
                        id="wifiName"
                        type="text"
                        value={wifiName}
                        onChange={(e) => setWifiName(e.target.value)}
                        placeholder="Ex: Espaço Flores Wi-Fi"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="wifiPassword" className="block text-[11px] font-medium text-slate-500 mb-1">
                        Senha do Wi-Fi
                      </label>
                      <input
                        id="wifiPassword"
                        type="text"
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        placeholder="Ex: festa2026"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Ícone Central e Moldura */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h3 className="font-bold text-slate-900 text-base">Ícone Central do QR Code</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Personalize o ícone que fica no centro do QR Code para reforçar o tema:
              </p>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setIconChoice('theme-icon')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    iconChoice === 'theme-icon'
                      ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-500/20 font-bold text-brand-900'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-1.5 text-base">
                    {activeTheme.emoji}
                  </div>
                  <span className="text-xs block">Ícone do Tema</span>
                  <span className="text-[10px] text-slate-400 font-normal">Ex: alianças, bolo...</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIconChoice('fotoqr')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    iconChoice === 'fotoqr'
                      ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-500/20 font-bold text-brand-900'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-1.5 text-emerald-700 text-xs font-black">
                    FQ
                  </div>
                  <span className="text-xs block">Logo FotoQR</span>
                  <span className="text-[10px] text-slate-400 font-normal">Câmera oficial</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIconChoice('none')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    iconChoice === 'none'
                      ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-500/20 font-bold text-brand-900'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-1.5 text-slate-400 text-xs">
                    —
                  </div>
                  <span className="text-xs block">Sem Ícone</span>
                  <span className="text-[10px] text-slate-400 font-normal">QR Code clássico</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Interactive Preview (5 cols) */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            {/* Format toggle: Placa de Mesa / QR Only */}
            <div className="bg-white rounded-2xl p-1.5 border border-slate-200 flex items-center justify-between shadow-xs">
              <button
                type="button"
                onClick={() => setFrameStyle('table-card')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                  frameStyle === 'table-card'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🖼️ Placa de Mesa (Display)
              </button>
              <button
                type="button"
                onClick={() => setFrameStyle('qr-only')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                  frameStyle === 'qr-only'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📱 Apenas QR Code
              </button>
            </div>

            {/* Preview Card Shell */}
            <div className="bg-slate-900/5 p-4 sm:p-6 rounded-3xl border border-slate-200/80 flex items-center justify-center">
              <div
                id="print-area"
                ref={previewCardRef}
                className="w-full max-w-sm rounded-3xl p-6 sm:p-8 text-center transition-all duration-300 shadow-xl relative border"
                style={{
                  backgroundColor: frameStyle === 'qr-only' ? bgColor : cardBg,
                  borderColor: borderColor,
                  color: cardTextColor,
                }}
              >
                {frameStyle === 'table-card' ? (
                  <>
                    {/* Occasion Badge */}
                    <div className="flex justify-center mb-4">
                      <span
                        className="px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase inline-flex items-center gap-1.5 shadow-2xs"
                        style={{
                          backgroundColor: badgeBg,
                          color: badgeTextColor,
                        }}
                      >
                        <span>{activeTheme.emoji}</span>
                        <span>{activeTheme.name}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h2
                      className="text-2xl font-black mb-1.5 tracking-tight line-clamp-2"
                      style={{ color: cardTextColor }}
                    >
                      {title || event.title}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-xs font-semibold mb-2" style={{ color: fgColor }}>
                      {subtitle}
                    </p>

                    {/* Instructions */}
                    <p className="text-[11px] opacity-80 mb-6 max-w-xs mx-auto leading-relaxed">
                      {instructions}
                    </p>

                    {/* QR Code Container */}
                    <div
                      className="p-4 sm:p-5 rounded-2xl inline-block shadow-md border mb-5 transition-transform"
                      style={{
                        backgroundColor: bgColor,
                        borderColor: borderColor,
                      }}
                    >
                      <QRCodeCanvas
                        value={publicUrl}
                        size={220}
                        fgColor={fgColor}
                        bgColor={bgColor}
                        level="H"
                        includeMargin={false}
                        imageSettings={qrImageSettings}
                      />
                    </div>

                    {/* CTA text */}
                    <p className="text-xs font-bold mb-1" style={{ color: cardTextColor }}>
                      Aponte a câmera do seu celular
                    </p>
                    <p className="text-[10px] text-slate-500 mb-3">
                      Sem precisar instalar aplicativo • Fotos ao vivo
                    </p>

                    {/* Wi-Fi callout if provided */}
                    {wifiName && (
                      <div className="bg-white/90 border border-slate-200/80 rounded-xl p-2.5 text-[11px] text-slate-700 shadow-2xs max-w-xs mx-auto">
                        <span className="font-bold">📶 Wi-Fi:</span> {wifiName}
                        {wifiPassword && <span className="ml-1.5 opacity-80">| Senha: {wifiPassword}</span>}
                      </div>
                    )}
                  </>
                ) : (
                  /* Pure QR Code Mode */
                  <div className="flex flex-col items-center justify-center py-4">
                    <div
                      className="p-5 rounded-2xl shadow-lg border"
                      style={{
                        backgroundColor: bgColor,
                        borderColor: borderColor,
                      }}
                    >
                      <QRCodeCanvas
                        value={publicUrl}
                        size={250}
                        fgColor={fgColor}
                        bgColor={bgColor}
                        level="H"
                        includeMargin={false}
                        imageSettings={qrImageSettings}
                      />
                    </div>
                    <p className="mt-4 text-xs font-bold text-slate-800">{title || event.title}</p>
                    <p className="text-[10px] text-slate-500">{publicUrl}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
              <Button
                variant="success"
                size="lg"
                onClick={handleSave}
                isLoading={isSaving}
                className={`w-full font-bold ${hasUnsavedChanges ? 'ring-2 ring-amber-300 ring-offset-2' : ''}`}
                leftIcon={hasUnsavedChanges ? <Save className="w-5 h-5" /> : <Check className="w-5 h-5" />}
              >
                {hasUnsavedChanges ? 'Salvar alterações do QR Code' : 'Alterações salvas ✓'}
              </Button>
              {hasUnsavedChanges && (
                <p className="text-[11px] text-amber-700 text-center -mt-1">
                  {needsSync
                    ? 'Este estilo está salvo só neste navegador. Salve para usá-lo em todos os seus dispositivos.'
                    : 'Você tem alterações não salvas. Atalho: Ctrl+S'}
                </p>
              )}

              <Button
                variant="primary"
                size="lg"
                onClick={handleDownloadHighRes}
                disabled={isExporting}
                isLoading={isExporting}
                className="w-full shadow-md"
                leftIcon={<Download className="w-4 h-4" />}
              >
                Baixar Placa em Alta Definição (PNG)
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={handlePrint}
                  leftIcon={<Printer className="w-4 h-4 text-slate-700" />}
                >
                  Imprimir Placa
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleCopyLink}
                  leftIcon={copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                >
                  {copiedLink ? 'Copiado!' : 'Copiar Link'}
                </Button>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>💡 <strong>Dica de impressão:</strong></span>
                <span className="text-[11px] text-slate-400">Tamanho ideal: A5 ou porta-retrato 15x21cm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeCustomizerPage;
