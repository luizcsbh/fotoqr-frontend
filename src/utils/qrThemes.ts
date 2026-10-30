/**
 * QR Code Themes and Customization Utilities for FotoQR
 * Supports Weddings, Birthdays, Parties, Corporate Events and Custom Styles.
 */

export type EventTypeCategory = 'casamento' | 'aniversario' | 'festa' | 'corporativo' | 'outro';

export type QRFrameStyle = 'table-card' | 'elegant-card' | 'banner' | 'qr-only';

export type QRIconChoice = 'theme-icon' | 'fotoqr' | 'none';

export interface QRColorPreset {
  id: string;
  name: string;
  fgColor: string;
  bgColor: string;
  cardBg: string;
  cardTextColor: string;
  badgeBg: string;
  badgeTextColor: string;
  borderColor: string;
}

export interface EventThemeConfig {
  id: EventTypeCategory;
  name: string;
  emoji: string;
  tagline: string;
  defaultTitlePlaceholder: string;
  defaultSubtitle: string;
  defaultInstructions: string;
  presets: QRColorPreset[];
  iconSvg: string;
}

// Vector SVG icons for center of QR Code (excavated)
export function getEventIconSvg(eventType: EventTypeCategory, badgeColor?: string): string {
  const encColor = badgeColor ? encodeURIComponent(badgeColor) : '';
  switch (eventType) {
    case 'casamento':
      // Wedding rings
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${encColor || '%23b76e79'}"/><circle cx="26" cy="34" r="13" fill="none" stroke="%23ffffff" stroke-width="4"/><circle cx="38" cy="30" r="13" fill="none" stroke="%23ffffff" stroke-width="4"/><polygon points="38,12 34,18 42,18" fill="%23ffffff"/></svg>`;
    case 'aniversario':
      // Birthday cake with candles
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${encColor || '%23ec4899'}"/><path d="M18 46h28v6H18zm2-14h24v10H20zm4-10h16v6H24zm6-10a2 2 0 0 1 4 0c0 3-4 6-4 6s-4-3-4-6a2 2 0 0 1 4 0z" fill="%23ffffff"/><circle cx="32" cy="12" r="2" fill="%23fef08a"/></svg>`;
    case 'festa':
      // Party celebration cocktail / glasses
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${encColor || '%238b5cf6'}"/><path d="M22 18l10 14v16h-4v4h12v-4h-4V32l10-14H22zm4 6h16l-3 4H29l-3-4z" fill="%23ffffff"/><circle cx="44" cy="18" r="2.5" fill="%23facc15"/><circle cx="18" cy="24" r="2" fill="%2338bdf8"/><circle cx="48" cy="32" r="2" fill="%23ec4899"/></svg>`;
    case 'corporativo':
      // Corporate briefcase / building
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${encColor || '%230284c7'}"/><path d="M16 22h32v28H16zm10-8h12v4H26z" fill="none" stroke="%23ffffff" stroke-width="4" stroke-linejoin="round"/><path d="M16 32h32M32 28v8" stroke="%23ffffff" stroke-width="3"/></svg>`;
    default:
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${encColor || '%23059669'}"/><path d="M22 21h-4a4 4 0 0 0-4 4v18a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V25a4 4 0 0 0-4-4h-4l-2.5-4.5A2 2 0 0 0 37.7 15h-11.4a2 2 0 0 0-1.8 1.5L22 21z" fill="%23ffffff"/><circle cx="32" cy="34" r="8" fill="%23059669"/><circle cx="32" cy="34" r="4.5" fill="%23ffffff"/><circle cx="42" cy="24" r="1.5" fill="%23ffffff"/></svg>`;
  }
}

export const EVENT_THEMES: Record<EventTypeCategory, EventThemeConfig> = {
  casamento: {
    id: 'casamento',
    name: 'Casamento',
    emoji: '💍',
    tagline: 'Elegante, romântico e sofisticado',
    defaultTitlePlaceholder: 'Casamento de Ana & Lucas',
    defaultSubtitle: 'Compartilhe seus registros com os noivos!',
    defaultInstructions: 'Aponte a câmera do celular para o QR Code e envie suas fotos direto para nosso álbum.',
    iconSvg: getEventIconSvg('casamento'),
    presets: [
      {
        id: 'rose-gold',
        name: 'Rose Gold & Pérola',
        fgColor: '#883A53',
        bgColor: '#FFFFFF',
        cardBg: '#FFF7F8',
        cardTextColor: '#4A1D2B',
        badgeBg: '#FCE7F3',
        badgeTextColor: '#9D174D',
        borderColor: '#FBCFE8',
      },
      {
        id: 'marsala-ouro',
        name: 'Marsala & Champanhe',
        fgColor: '#581C28',
        bgColor: '#FFFFFF',
        cardBg: '#FCF9F5',
        cardTextColor: '#38131B',
        badgeBg: '#FEF3C7',
        badgeTextColor: '#92400E',
        borderColor: '#FDE68A',
      },
      {
        id: 'azul-marinho-luxo',
        name: 'Navy & Ouro Real',
        fgColor: '#0F1E36',
        bgColor: '#FFFFFF',
        cardBg: '#F8FAFC',
        cardTextColor: '#0F172A',
        badgeBg: '#FEF3C7',
        badgeTextColor: '#78350F',
        borderColor: '#E2E8F0',
      },
      {
        id: 'esmeralda-botanico',
        name: 'Esmeralda & Folhagens',
        fgColor: '#064E3B',
        bgColor: '#FFFFFF',
        cardBg: '#F0FDF4',
        cardTextColor: '#064E3B',
        badgeBg: '#DCFCE7',
        badgeTextColor: '#166534',
        borderColor: '#BBF7D0',
      },
      {
        id: 'preto-classico',
        name: 'Black Tie Minimalista',
        fgColor: '#18181B',
        bgColor: '#FFFFFF',
        cardBg: '#FFFFFF',
        cardTextColor: '#09090B',
        badgeBg: '#F4F4F5',
        badgeTextColor: '#27272A',
        borderColor: '#E4E4E7',
      },
    ],
  },
  aniversario: {
    id: 'aniversario',
    name: 'Aniversário',
    emoji: '🎂',
    tagline: 'Festivo, alegre e memorável',
    defaultTitlePlaceholder: 'Aniversário de 30 Anos',
    defaultSubtitle: 'Deixe suas fotos e mensagens!',
    defaultInstructions: 'Escaneie o código com a câmera do celular para enviar suas fotos desta festa incrível.',
    iconSvg: getEventIconSvg('aniversario'),
    presets: [
      {
        id: 'magenta-festivo',
        name: 'Rosa & Magenta Pop',
        fgColor: '#BE185D',
        bgColor: '#FFFFFF',
        cardBg: '#FDF2F8',
        cardTextColor: '#831843',
        badgeBg: '#FCE7F3',
        badgeTextColor: '#9D174D',
        borderColor: '#FBCFE8',
      },
      {
        id: 'roxo-eletrico',
        name: 'Roxo & Lavanda',
        fgColor: '#6D28D9',
        bgColor: '#FFFFFF',
        cardBg: '#FAF5FF',
        cardTextColor: '#4C1D95',
        badgeBg: '#F3E8FF',
        badgeTextColor: '#6B21A8',
        borderColor: '#E9D5FF',
      },
      {
        id: 'azul-ceu',
        name: 'Azul & Turquesa',
        fgColor: '#0369A1',
        bgColor: '#FFFFFF',
        cardBg: '#F0F9FF',
        cardTextColor: '#0C4A6E',
        badgeBg: '#E0F2FE',
        badgeTextColor: '#0369A1',
        borderColor: '#BAE6FD',
      },
      {
        id: 'dourado-glow',
        name: 'Gold Celebration',
        fgColor: '#B45309',
        bgColor: '#FFFFFF',
        cardBg: '#FFFBEB',
        cardTextColor: '#78350F',
        badgeBg: '#FEF3C7',
        badgeTextColor: '#92400E',
        borderColor: '#FDE68A',
      },
    ],
  },
  festa: {
    id: 'festa',
    name: 'Festa & Balada',
    emoji: '🎉',
    tagline: 'Vibrante, moderno e descontraído',
    defaultTitlePlaceholder: 'Festa de Fim de Ano',
    defaultSubtitle: 'Solte a foto na galeria do rolê!',
    defaultInstructions: 'Aponte a câmera agora mesmo e envie as melhores fotos em tempo real sem app.',
    iconSvg: getEventIconSvg('festa'),
    presets: [
      {
        id: 'cyber-dark',
        name: 'Dark Neon Cyan',
        fgColor: '#06B6D4',
        bgColor: '#0F172A',
        cardBg: '#090D16',
        cardTextColor: '#F8FAFC',
        badgeBg: '#1E293B',
        badgeTextColor: '#38BDF8',
        borderColor: '#1E293B',
      },
      {
        id: 'sunset-party',
        name: 'Sunset Laranja & Coral',
        fgColor: '#C2410C',
        bgColor: '#FFFFFF',
        cardBg: '#FFF7ED',
        cardTextColor: '#7C2D12',
        badgeBg: '#FFEDD5',
        badgeTextColor: '#9A3412',
        borderColor: '#FED7AA',
      },
      {
        id: 'neon-violet',
        name: 'Ultraviolet Glow',
        fgColor: '#7E22CE',
        bgColor: '#FFFFFF',
        cardBg: '#FAF5FF',
        cardTextColor: '#581C87',
        badgeBg: '#F3E8FF',
        badgeTextColor: '#6B21A8',
        borderColor: '#E9D5FF',
      },
      {
        id: 'emerald-club',
        name: 'Emerald Neon',
        fgColor: '#047857',
        bgColor: '#FFFFFF',
        cardBg: '#ECFDF5',
        cardTextColor: '#064E3B',
        badgeBg: '#D1FAE5',
        badgeTextColor: '#065F46',
        borderColor: '#A7F3D0',
      },
    ],
  },
  corporativo: {
    id: 'corporativo',
    name: 'Evento Corporativo',
    emoji: '💼',
    tagline: 'Profissional, institucional e sóbrio',
    defaultTitlePlaceholder: 'Convenção Corporativa 2026',
    defaultSubtitle: 'Compartilhe suas fotos e networking',
    defaultInstructions: 'Escaneie o QR Code com seu smartphone para carregar seus registros fotográficos da conferência.',
    iconSvg: getEventIconSvg('corporativo'),
    presets: [
      {
        id: 'corp-blue',
        name: 'Azul Institucional',
        fgColor: '#0369A1',
        bgColor: '#FFFFFF',
        cardBg: '#F8FAFC',
        cardTextColor: '#0F172A',
        badgeBg: '#E0F2FE',
        badgeTextColor: '#0369A1',
        borderColor: '#E2E8F0',
      },
      {
        id: 'corp-slate',
        name: 'Grafite Executivo',
        fgColor: '#1E293B',
        bgColor: '#FFFFFF',
        cardBg: '#F8FAFC',
        cardTextColor: '#0F172A',
        badgeBg: '#F1F5F9',
        badgeTextColor: '#334155',
        borderColor: '#CBD5E1',
      },
      {
        id: 'corp-emerald',
        name: 'Verde Sustentável',
        fgColor: '#0F766E',
        bgColor: '#FFFFFF',
        cardBg: '#F0FDFA',
        cardTextColor: '#134E4A',
        badgeBg: '#CCFBF1',
        badgeTextColor: '#115E59',
        borderColor: '#99F6E4',
      },
      {
        id: 'corp-indigo',
        name: 'Indigo Tech',
        fgColor: '#4338CA',
        bgColor: '#FFFFFF',
        cardBg: '#EEF2FF',
        cardTextColor: '#312E81',
        badgeBg: '#E0E7FF',
        badgeTextColor: '#3730A3',
        borderColor: '#C7D2FE',
      },
    ],
  },
  outro: {
    id: 'outro',
    name: 'Geral & Personalizado',
    emoji: '✨',
    tagline: 'Versátil, limpo e adaptável',
    defaultTitlePlaceholder: 'Álbum Colaborativo',
    defaultSubtitle: 'Fotos instantâneas de todos os convidados',
    defaultInstructions: 'Aponte a câmera e envie suas fotos diretamente para a galeria!',
    iconSvg: getEventIconSvg('outro'),
    presets: [
      {
        id: 'fotoqr-brand',
        name: 'FotoQR Emerald',
        fgColor: '#059669',
        bgColor: '#FFFFFF',
        cardBg: '#ECFDF5',
        cardTextColor: '#064E3B',
        badgeBg: '#D1FAE5',
        badgeTextColor: '#065F46',
        borderColor: '#A7F3D0',
      },
      {
        id: 'clean-black',
        name: 'Monocromático Puro',
        fgColor: '#09090B',
        bgColor: '#FFFFFF',
        cardBg: '#FFFFFF',
        cardTextColor: '#09090B',
        badgeBg: '#F4F4F5',
        badgeTextColor: '#18181B',
        borderColor: '#E4E4E7',
      },
      {
        id: 'indigo-clean',
        name: 'Indigo Clean',
        fgColor: '#4F46E5',
        bgColor: '#FFFFFF',
        cardBg: '#EEF2FF',
        cardTextColor: '#1E1B4B',
        badgeBg: '#E0E7FF',
        badgeTextColor: '#3730A3',
        borderColor: '#C7D2FE',
      },
    ],
  },
};

/**
 * Contrast Ratio Calculator (WCAG Formula)
 * Checks if the combination of fg and bg is readable by smartphone cameras
 */
function getLuminance(hexColor: string): number {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 0;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  }
  return null;
}

export function getContrastRatio(fgHex: string, bgHex: string): number {
  const l1 = getLuminance(fgHex);
  const l2 = getLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validates if the contrast is sufficient for reliable QR scanning
 * Threshold: at least 3.0:1 (ideally > 4.5:1)
 */
export function isContrastSafe(fgHex: string, bgHex: string): { safe: boolean; ratio: number; warning?: string } {
  const ratio = getContrastRatio(fgHex, bgHex);
  if (ratio < 2.5) {
    return {
      safe: false,
      ratio,
      warning: 'Atenção: O contraste entre o QR Code e o fundo está muito baixo. Câmeras de celulares mais simples podem ter dificuldade para ler.',
    };
  }
  if (ratio < 4.0) {
    return {
      safe: true,
      ratio,
      warning: 'Contraste moderado. Recomendamos testar a leitura com a câmera do seu celular antes de imprimir.',
    };
  }
  return { safe: true, ratio };
}

/**
 * Storage helpers to persist the user's QR customizations
 */
export interface StoredQRCustomization {
  eventType: EventTypeCategory;
  fgColor: string;
  bgColor: string;
  title: string;
  subtitle: string;
  instructions: string;
  wifiName: string;
  wifiPassword?: string;
  frameStyle: QRFrameStyle;
  iconChoice: QRIconChoice;
  presetId?: string;
}

/** Whether this browser has a customization saved locally (from before server sync existed). */
export function hasLocalQRCustomization(uuid: string): boolean {
  try {
    return localStorage.getItem(`fotoqr_qr_custom_${uuid}`) !== null;
  } catch {
    return false;
  }
}

export function loadQRCustomization(uuid: string, defaultTitle: string): StoredQRCustomization {
  try {
    const raw = localStorage.getItem(`fotoqr_qr_custom_${uuid}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        title: parsed.title || defaultTitle,
      };
    }
  } catch (e) {
    // ignore parse error
  }

  // Default fallback to Wedding or General
  const theme = EVENT_THEMES.casamento;
  const preset = theme.presets[0];
  return {
    eventType: 'casamento',
    fgColor: preset.fgColor,
    bgColor: preset.bgColor,
    title: defaultTitle || theme.defaultTitlePlaceholder,
    subtitle: theme.defaultSubtitle,
    instructions: theme.defaultInstructions,
    wifiName: '',
    wifiPassword: '',
    frameStyle: 'table-card',
    iconChoice: 'theme-icon',
    presetId: preset.id,
  };
}

/** Returns false when the browser refused to store it (private mode, full or blocked storage). */
export function saveQRCustomization(uuid: string, config: StoredQRCustomization): boolean {
  try {
    localStorage.setItem(`fotoqr_qr_custom_${uuid}`, JSON.stringify(config));
    return true;
  } catch (e) {
    console.error('Failed to save QR customization in localStorage', e);
    return false;
  }
}
