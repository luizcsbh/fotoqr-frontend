/**
 * Utilitário de Marca D'água para Convites e Placas de Mesa — FotoQREventos
 *
 * Aplica texto diagonal semitransparente em cima de um canvas já configurado.
 * Não depende de bibliotecas externas; usa apenas Canvas 2D API.
 */

export interface WatermarkOptions {
  /** Cor RGBA do texto. Padrão: 'rgba(0,0,0,0.11)' */
  color?: string;
  /** Tamanho da fonte em px. Padrão: 18 */
  fontSize?: number;
  /** Ângulo de rotação em graus (negativo = anti-horário). Padrão: -35 */
  angle?: number;
  /** Repete o texto em grid por todo o canvas. Padrão: true */
  repeat?: boolean;
  /** Família tipográfica. Padrão: 'Georgia, serif' */
  fontFamily?: string;
  /** Espaçamento horizontal entre repetições. Padrão: 220 */
  spacingX?: number;
  /** Espaçamento vertical entre repetições. Padrão: 110 */
  spacingY?: number;
  /** Peso da fonte. Padrão: 'normal' */
  fontWeight?: string;
}

/**
 * Aplica marca d'água diagonal semitransparente em um canvas.
 *
 * @param ctx    Contexto 2D do canvas
 * @param text   Texto da marca d'água
 * @param width  Largura do canvas em px
 * @param height Altura do canvas em px
 * @param opts   Opções de customização
 */
export function applyWatermark(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
  opts: WatermarkOptions = {}
): void {
  const {
    color = 'rgba(0,0,0,0.11)',
    fontSize = 18,
    angle = -35,
    repeat = true,
    fontFamily = 'Georgia, serif',
    spacingX = 220,
    spacingY = 110,
    fontWeight = 'normal',
  } = opts;

  ctx.save();

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const rad = (angle * Math.PI) / 180;

  if (repeat) {
    // Grid que cobre toda a diagonal com folga
    const diag = Math.sqrt(width * width + height * height);
    const cols = Math.ceil(diag / spacingX) + 2;
    const rows = Math.ceil(diag / spacingY) + 2;

    for (let row = -rows; row <= rows; row++) {
      for (let col = -cols; col <= cols; col++) {
        const x = col * spacingX;
        const y = row * spacingY;
        ctx.save();
        ctx.translate(width / 2 + x, height / 2 + y);
        ctx.rotate(rad);
        ctx.fillText(text, 0, 0);
        ctx.restore();
      }
    }
  } else {
    // Texto único centralizado
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(rad);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Carrega uma imagem por URL e retorna um novo data URL com marca d'água aplicada.
 * Retorna Promise<null> se a URL for falsy.
 */
export async function addWatermarkToImageUrl(
  imageUrl: string | null | undefined,
  watermarkText: string,
  opts: WatermarkOptions & { imgWidth?: number; imgHeight?: number } = {}
): Promise<string | null> {
  if (!imageUrl) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const w = opts.imgWidth ?? img.naturalWidth;
      const h = opts.imgHeight ?? img.naturalHeight;

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      applyWatermark(ctx, watermarkText, w, h, opts);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

/**
 * Desenha a placa de mesa em um canvas off-screen e retorna o data URL para download.
 *
 * @param opts  Dados do convidado e do evento para compor a placa
 */
export async function renderTableCardToDataUrl(opts: {
  guestName: string;
  guestCategory: string;
  eventTitle: string;
  eventDate?: string;
  eventLocation?: string;
  qrCodeUrl: string;
  accentColor?: string;
  watermarkText?: string;
  /** Largura do canvas em px. Padrão: 623 (A6 paisagem @ 150dpi) */
  width?: number;
  /** Altura do canvas em px. Padrão: 441 */
  height?: number;
}): Promise<string> {
  const {
    guestName,
    guestCategory,
    eventTitle,
    eventDate,
    eventLocation,
    qrCodeUrl,
    accentColor = '#6366f1',
    watermarkText,
    width = 623,
    height = 441,
  } = opts;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // ── Fundo branco ──────────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // ── Borda superior colorida ───────────────────────────────────────────────
  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, width, 8);

  // ── Borda externa sutil ───────────────────────────────────────────────────
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // ── QR Code (canto superior direito) ─────────────────────────────────────
  const qrSize = 100;
  const qrMargin = 24;
  await new Promise<void>((res) => {
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.onload = () => {
      ctx.drawImage(qrImg, width - qrSize - qrMargin, qrMargin, qrSize, qrSize);
      res();
    };
    qrImg.onerror = () => res();
    qrImg.src = qrCodeUrl;
  });

  // ── Título do evento (topo esquerdo) ──────────────────────────────────────
  ctx.fillStyle = accentColor;
  ctx.font = `bold 13px 'Georgia', serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(eventTitle.toUpperCase(), qrMargin, qrMargin + 2);

  // ── Linha separadora ──────────────────────────────────────────────────────
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(qrMargin, qrMargin + 22);
  ctx.lineTo(width - qrSize - qrMargin - 16, qrMargin + 22);
  ctx.stroke();

  // ── Nome do convidado (centro) ────────────────────────────────────────────
  const nameY = height / 2 - 30;
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Auto-ajusta tamanho da fonte ao comprimento do nome
  let nameFontSize = 42;
  ctx.font = `bold ${nameFontSize}px 'Georgia', serif`;
  while (ctx.measureText(guestName).width > width - qrSize - 2 * qrMargin - 20 && nameFontSize > 22) {
    nameFontSize -= 2;
    ctx.font = `bold ${nameFontSize}px 'Georgia', serif`;
  }
  ctx.fillText(guestName, (width - qrSize - qrMargin) / 2, nameY);

  // ── Badge de categoria ────────────────────────────────────────────────────
  const badgeY = nameY + nameFontSize / 2 + 18;
  const badgeText = guestCategory || 'Convidado';
  ctx.font = `bold 13px 'Arial', sans-serif`;
  const badgeW = ctx.measureText(badgeText).width + 24;
  const badgeH = 26;
  const badgeX = (width - qrSize - qrMargin) / 2 - badgeW / 2;

  const isVip = /vip/i.test(badgeText);
  ctx.fillStyle = isVip ? '#fef3c7' : '#eff6ff';
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 6);
  ctx.fill();

  ctx.strokeStyle = isVip ? '#d97706' : '#3b82f6';
  ctx.lineWidth = 1;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 6);
  ctx.stroke();

  ctx.fillStyle = isVip ? '#92400e' : '#1d4ed8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2);

  // ── Data e local (rodapé) ─────────────────────────────────────────────────
  const footerY = height - qrMargin - 10;
  ctx.fillStyle = '#64748b';
  ctx.font = `12px 'Arial', sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';

  const infoLines: string[] = [];
  if (eventDate) infoLines.push(`📅  ${eventDate}`);
  if (eventLocation) infoLines.push(`📍  ${eventLocation}`);

  infoLines.forEach((line, i) => {
    ctx.fillText(line, qrMargin, footerY - i * 20);
  });

  // ── Linha decorativa no rodapé ────────────────────────────────────────────
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(qrMargin, height - qrMargin - 10 - infoLines.length * 20 - 8);
  ctx.lineTo(width - qrMargin, height - qrMargin - 10 - infoLines.length * 20 - 8);
  ctx.stroke();

  // ── Marca d'água diagonal ─────────────────────────────────────────────────
  const wmText = watermarkText ?? `${eventTitle} • FotoQREventos`;
  applyWatermark(ctx, wmText, width, height, {
    color: 'rgba(0,0,0,0.07)',
    fontSize: 16,
    angle: -35,
    spacingX: 200,
    spacingY: 100,
  });

  return canvas.toDataURL('image/png');
}

/** Helper: desenha retângulo com bordas arredondadas */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
