/**
 * Ready-made digital invitation designs for "Capa & Convite": a themed logo (emblem), a decorated
 * background and the colors/font used on the invitation card. Everything is drawn as inline SVG so
 * the designs need no hosted images. The event stores only the template id
 * (events.invitation_template); custom cover/background uploads still take precedence.
 */
import { isImageUrl, toCssBackgroundLayer } from './cssImage';

export type InvitationCategory =
  | 'aniversario'
  | 'infantil'
  | 'casamento'
  | 'cha-bebe'
  | 'formatura'
  | 'corporativo'
  | 'festa'
  | 'geral';

export const INVITATION_CATEGORIES: { id: InvitationCategory; label: string; emoji: string }[] = [
  { id: 'aniversario', label: 'Aniversário', emoji: '🎂' },
  { id: 'infantil', label: 'Infantil', emoji: '🧸' },
  { id: 'casamento', label: 'Casamento', emoji: '💍' },
  { id: 'cha-bebe', label: 'Chá de Bebê', emoji: '🍼' },
  { id: 'formatura', label: 'Formatura', emoji: '🎓' },
  { id: 'corporativo', label: 'Corporativo', emoji: '💼' },
  { id: 'festa', label: 'Festa', emoji: '🎉' },
  { id: 'geral', label: 'Outros', emoji: '✨' },
];

export type InvitationFont = 'sans' | 'serif' | 'rounded';

export interface InvitationTemplate {
  id: string;
  category: InvitationCategory;
  name: string;
  /** Short line shown above the event title. */
  tagline: string;
  /** SVG data URI used as the invitation logo. */
  logo: string;
  /** SVG data URI used as the page background. */
  background: string;
  titleColor: string;
  /** Guest name and detail icons. */
  accentColor: string;
  /** Main button on the invitation. */
  buttonColor: string;
  font: InvitationFont;
}

/* --------------------------------------------------------------------------
   SVG helpers
   -------------------------------------------------------------------------- */

const svgUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;

const FONT_STACK: Record<InvitationFont, string> = {
  sans: "'Segoe UI', Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  rounded: "'Trebuchet MS', 'Segoe UI', sans-serif",
};

/** Deterministic pseudo-random numbers, so a background always looks the same. */
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/* --------------------------------------------------------------------------
   Icons (drawn in a 100x100 box)
   -------------------------------------------------------------------------- */

type IconFn = (c: string, c2: string) => string;

const ICONS: Record<string, IconFn> = {
  cake: (c, c2) => `
    <rect x="14" y="58" width="72" height="28" rx="6" fill="${c}"/>
    <rect x="24" y="38" width="52" height="24" rx="5" fill="${c}" opacity=".85"/>
    <path d="M24 46 q6 7 12 0 q6 7 12 0 q6 7 12 0 q6 7 16 0" stroke="${c2}" stroke-width="4" fill="none"/>
    <path d="M14 68 q9 8 18 0 q9 8 18 0 q9 8 18 0 q9 8 18 0" stroke="${c2}" stroke-width="4" fill="none"/>
    <rect x="35" y="20" width="5" height="18" rx="2" fill="${c2}"/><rect x="48" y="18" width="5" height="20" rx="2" fill="${c2}"/><rect x="61" y="20" width="5" height="18" rx="2" fill="${c2}"/>
    <ellipse cx="37.5" cy="14" rx="3.5" ry="5" fill="#fde047"/><ellipse cx="50.5" cy="12" rx="3.5" ry="5" fill="#fde047"/><ellipse cx="63.5" cy="14" rx="3.5" ry="5" fill="#fde047"/>`,
  balloons: (c, c2) => `
    <path d="M30 52 Q36 70 50 90 M56 46 Q54 70 50 90 M74 56 Q64 72 50 90" stroke="${c}" stroke-width="2" fill="none"/>
    <ellipse cx="30" cy="34" rx="15" ry="18" fill="${c2}"/><ellipse cx="56" cy="27" rx="16" ry="19" fill="${c}"/><ellipse cx="75" cy="40" rx="14" ry="17" fill="#fde047"/>
    <ellipse cx="25" cy="27" rx="4" ry="6" fill="#fff" opacity=".5"/><ellipse cx="51" cy="20" rx="4" ry="6" fill="#fff" opacity=".5"/>`,
  champagne: (c, c2) => `
    <path d="M28 14 h18 l-2 26 a7 7 0 0 1 -14 0 z" fill="${c}"/><rect x="35.5" y="46" width="3" height="28" fill="${c}"/><rect x="27" y="74" width="20" height="4" rx="2" fill="${c}"/>
    <path d="M56 14 h18 l-2 26 a7 7 0 0 1 -14 0 z" fill="${c}" transform="rotate(14 65 40)"/><rect x="62" y="46" width="3" height="28" fill="${c}" transform="rotate(14 65 40)"/><rect x="54" y="74" width="20" height="4" rx="2" fill="${c}" transform="rotate(14 65 40)"/>
    <circle cx="50" cy="10" r="3" fill="${c2}"/><circle cx="44" cy="4" r="2" fill="${c2}"/><circle cx="57" cy="5" r="2" fill="${c2}"/>`,
  partyHat: (c, c2) => `
    <path d="M50 12 L24 84 h52 z" fill="${c}"/>
    <path d="M44 30 l14 6 M38 46 l24 10 M32 62 l34 13" stroke="${c2}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="50" cy="11" r="7" fill="#fde047"/><rect x="20" y="82" width="60" height="7" rx="3.5" fill="${c2}"/>`,
  rocket: (c, c2) => `
    <path d="M50 8 C66 22 70 44 64 66 H36 C30 44 34 22 50 8 z" fill="${c}"/>
    <circle cx="50" cy="38" r="9" fill="${c2}"/><circle cx="50" cy="38" r="5" fill="#bae6fd"/>
    <path d="M36 54 L22 72 L36 68 z M64 54 L78 72 L64 68 z" fill="${c2}"/>
    <path d="M40 68 Q50 96 60 68 z" fill="#fb923c"/><path d="M45 68 Q50 84 55 68 z" fill="#fde047"/>`,
  flower: (c, c2) => `
    <path d="M50 58 Q48 76 50 94" stroke="${c2}" stroke-width="4" fill="none"/><ellipse cx="40" cy="80" rx="9" ry="4.5" fill="${c2}" transform="rotate(-30 40 80)"/>
    ${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="50" cy="22" rx="11" ry="17" fill="${c}" transform="rotate(${a} 50 40)"/>`).join('')}
    <circle cx="50" cy="40" r="10" fill="#fde047"/>`,
  rings: (c, c2) => `
    <circle cx="38" cy="58" r="21" fill="none" stroke="${c}" stroke-width="7"/><circle cx="62" cy="58" r="21" fill="none" stroke="${c}" stroke-width="7"/>
    <path d="M54 30 l8 -12 l8 12 l-8 9 z" fill="${c2}"/>`,
  heart: (c, c2) => `
    <path d="M50 86 C22 64 10 46 22 30 C32 17 46 22 50 32 C54 22 68 17 78 30 C90 46 78 64 50 86 z" fill="${c}"/>
    <path d="M30 34 q4 -8 12 -6" stroke="${c2}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  wreath: (c, c2) => `
    <circle cx="50" cy="50" r="30" fill="none" stroke="${c}" stroke-width="3"/>
    ${Array.from({ length: 12 }, (_, i) => {
      const a = (i * 30 * Math.PI) / 180;
      const x = 50 + 30 * Math.cos(a);
      const y = 50 + 30 * Math.sin(a);
      return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="8" ry="3.6" fill="${i % 2 ? c : c2}" transform="rotate(${i * 30 + 60} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    }).join('')}
    <path d="M50 64 C36 54 34 44 42 40 C46 38 50 42 50 45 C50 42 54 38 58 40 C66 44 64 54 50 64 z" fill="${c2}"/>`,
  rattle: (c, c2) => `
    <circle cx="38" cy="38" r="22" fill="${c}"/><circle cx="38" cy="38" r="13" fill="${c2}"/><circle cx="38" cy="38" r="5" fill="${c}"/>
    <path d="M54 54 L76 76" stroke="${c}" stroke-width="8" stroke-linecap="round"/><circle cx="80" cy="80" r="9" fill="none" stroke="${c2}" stroke-width="5"/>`,
  bottle: (c, c2) => `
    <path d="M44 8 h12 v8 h-12 z" fill="${c2}"/><path d="M40 16 h20 l4 8 h-28 z" fill="${c2}"/>
    <rect x="32" y="24" width="36" height="66" rx="12" fill="${c}"/>
    <path d="M40 44 h10 M40 56 h14 M40 68 h10" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`,
  question: (c, c2) => `
    <circle cx="34" cy="50" r="28" fill="${c}"/><circle cx="66" cy="50" r="28" fill="${c2}" opacity=".9"/>
    <text x="50" y="66" text-anchor="middle" font-size="46" font-weight="700" fill="#fff" font-family="Georgia, serif">?</text>`,
  gradCap: (c, c2) => `
    <path d="M50 18 L92 38 L50 58 L8 38 z" fill="${c}"/><path d="M26 47 v18 c0 8 48 8 48 0 V47 L50 58 z" fill="${c}" opacity=".85"/>
    <path d="M84 41 v24" stroke="${c2}" stroke-width="3"/><circle cx="84" cy="69" r="5" fill="${c2}"/>`,
  diploma: (c, c2) => `
    <rect x="14" y="30" width="72" height="34" rx="17" fill="${c}"/><ellipse cx="80" cy="47" rx="8" ry="17" fill="${c}" opacity=".8"/>
    <rect x="44" y="28" width="10" height="38" fill="${c2}"/><path d="M44 66 l-6 20 l11 -7 l11 7 l-6 -20 z" fill="${c2}"/>`,
  briefcase: (c, c2) => `
    <path d="M38 30 v-8 a4 4 0 0 1 4 -4 h16 a4 4 0 0 1 4 4 v8" fill="none" stroke="${c}" stroke-width="6"/>
    <rect x="14" y="30" width="72" height="52" rx="8" fill="${c}"/><rect x="14" y="50" width="72" height="5" fill="${c2}"/><rect x="44" y="46" width="12" height="13" rx="2" fill="${c2}"/>`,
  chart: (c, c2) => `
    <rect x="16" y="56" width="14" height="28" rx="3" fill="${c}"/><rect x="36" y="40" width="14" height="44" rx="3" fill="${c}"/><rect x="56" y="26" width="14" height="58" rx="3" fill="${c}"/>
    <path d="M14 46 L40 28 L56 36 L86 14" stroke="${c2}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M76 12 h11 v11" stroke="${c2}" stroke-width="5" fill="none"/>`,
  cocktail: (c, c2) => `
    <path d="M16 18 h68 l-34 36 z" fill="${c}"/><rect x="47.5" y="52" width="5" height="28" fill="${c}"/><rect x="34" y="80" width="32" height="6" rx="3" fill="${c}"/>
    <circle cx="66" cy="24" r="7" fill="${c2}"/><path d="M58 8 L44 38" stroke="${c2}" stroke-width="3"/>`,
  flags: (c, c2) => `
    <path d="M6 22 Q50 46 94 22" stroke="${c}" stroke-width="3" fill="none"/>
    ${[14, 32, 50, 68, 86].map((x, i) => {
      const y = 22 + 24 * Math.sin((x / 100) * Math.PI) * 0.95;
      return `<path d="M${x - 8} ${y.toFixed(1)} h16 l-8 20 z" fill="${i % 2 ? c2 : c}"/>`;
    }).join('')}
    <path d="M40 92 l10 -26 l10 26 z" fill="#f97316"/><path d="M44 92 l6 -14 l6 14 z" fill="#fde047"/>`,
  fireworks: (c, c2) => `
    ${Array.from({ length: 12 }, (_, i) => {
      const a = (i * 30 * Math.PI) / 180;
      return `<path d="M${(40 + 10 * Math.cos(a)).toFixed(1)} ${(40 + 10 * Math.sin(a)).toFixed(1)} L${(40 + 28 * Math.cos(a)).toFixed(1)} ${(40 + 28 * Math.sin(a)).toFixed(1)}" stroke="${i % 2 ? c : c2}" stroke-width="4" stroke-linecap="round"/>`;
    }).join('')}
    ${Array.from({ length: 8 }, (_, i) => {
      const a = (i * 45 * Math.PI) / 180;
      return `<circle cx="${(72 + 16 * Math.cos(a)).toFixed(1)}" cy="${(70 + 16 * Math.sin(a)).toFixed(1)}" r="3" fill="${c2}"/>`;
    }).join('')}`,
  camera: (c, c2) => `
    <path d="M30 30 l6 -10 h28 l6 10 h12 a6 6 0 0 1 6 6 v40 a6 6 0 0 1 -6 6 H18 a6 6 0 0 1 -6 -6 V36 a6 6 0 0 1 6 -6 z" fill="${c}"/>
    <circle cx="50" cy="56" r="17" fill="${c2}"/><circle cx="50" cy="56" r="10" fill="${c}"/><circle cx="76" cy="40" r="3" fill="${c2}"/>`,
};

interface EmblemSpec {
  icon: keyof typeof ICONS;
  bg: string;
  ring: string;
  iconColor: string;
  iconColor2: string;
  caption: string;
  captionColor: string;
  font: InvitationFont;
}

/** Round badge with the theme icon and a short caption: the invitation logo. */
const emblem = (e: EmblemSpec) =>
  svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
    <circle cx="120" cy="120" r="116" fill="${e.bg}"/>
    <circle cx="120" cy="120" r="104" fill="none" stroke="${e.ring}" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/>
    <g transform="translate(55 14) scale(1.3)">${ICONS[e.icon](e.iconColor, e.iconColor2)}</g>
    <text x="120" y="194" text-anchor="middle" font-family="${FONT_STACK[e.font]}" font-size="${e.caption.length > 12 ? 18 : e.caption.length > 9 ? 21 : 24}" font-weight="700" fill="${e.captionColor}">${e.caption}</text>
  </svg>`);

type Decor =
  | 'confetti'
  | 'sparkles'
  | 'balloons'
  | 'stars'
  | 'petals'
  | 'leaves'
  | 'clouds'
  | 'hearts'
  | 'lines'
  | 'neon'
  | 'flags'
  | 'fireworks'
  | 'planets'
  | 'dots';

interface BackgroundSpec {
  from: string;
  to: string;
  decor: Decor;
  colors: string[];
  seed: number;
}

/** Full-page background: a gradient plus scattered themed decorations. */
const background = (b: BackgroundSpec) => {
  const rnd = seeded(b.seed);
  const pick = () => b.colors[Math.floor(rnd() * b.colors.length)];
  const W = 1200;
  const H = 800;
  const items: string[] = [];
  const count = { confetti: 70, sparkles: 55, balloons: 14, stars: 70, petals: 40, leaves: 34, clouds: 10, hearts: 30, lines: 16, neon: 14, flags: 0, fireworks: 7, planets: 0, dots: 90 }[b.decor];

  for (let i = 0; i < count; i++) {
    const x = rnd() * W;
    const y = rnd() * H;
    const r = rnd();
    const rot = Math.floor(rnd() * 360);
    const c = pick();
    switch (b.decor) {
      case 'confetti':
        items.push(r > 0.5
          ? `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="14" height="6" rx="2" fill="${c}" opacity=".75" transform="rotate(${rot} ${x.toFixed(0)} ${y.toFixed(0)})"/>`
          : `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(3 + r * 6).toFixed(1)}" fill="${c}" opacity=".7"/>`);
        break;
      case 'sparkles':
      case 'stars': {
        const s = b.decor === 'stars' ? 2 + r * 4 : 4 + r * 9;
        items.push(`<path d="M${x.toFixed(0)} ${(y - s).toFixed(1)} L${(x + s * 0.3).toFixed(1)} ${(y - s * 0.3).toFixed(1)} L${(x + s).toFixed(1)} ${y.toFixed(0)} L${(x + s * 0.3).toFixed(1)} ${(y + s * 0.3).toFixed(1)} L${x.toFixed(0)} ${(y + s).toFixed(1)} L${(x - s * 0.3).toFixed(1)} ${(y + s * 0.3).toFixed(1)} L${(x - s).toFixed(1)} ${y.toFixed(0)} L${(x - s * 0.3).toFixed(1)} ${(y - s * 0.3).toFixed(1)} z" fill="${c}" opacity="${(0.45 + r * 0.5).toFixed(2)}"/>`);
        break;
      }
      case 'balloons': {
        const s = 22 + r * 26;
        items.push(`<path d="M${x.toFixed(0)} ${(y + s * 1.2).toFixed(0)} q${(s / 3).toFixed(0)} ${(s * 0.8).toFixed(0)} 0 ${(s * 1.6).toFixed(0)}" stroke="${c}" stroke-width="2" fill="none" opacity=".45"/><ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${s.toFixed(0)}" ry="${(s * 1.2).toFixed(0)}" fill="${c}" opacity=".55"/>`);
        break;
      }
      case 'petals':
        items.push(`<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(8 + r * 10).toFixed(0)}" ry="${(4 + r * 5).toFixed(0)}" fill="${c}" opacity=".5" transform="rotate(${rot} ${x.toFixed(0)} ${y.toFixed(0)})"/>`);
        break;
      case 'leaves':
        items.push(`<path d="M${x.toFixed(0)} ${y.toFixed(0)} q18 -26 44 -8 q-20 28 -44 8 z" fill="${c}" opacity=".45" transform="rotate(${rot} ${x.toFixed(0)} ${y.toFixed(0)}) scale(${(0.7 + r).toFixed(2)})" transform-origin="${x.toFixed(0)} ${y.toFixed(0)}"/>`);
        break;
      case 'clouds': {
        const s = 40 + r * 50;
        items.push(`<g opacity=".7" fill="${c}"><ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${s.toFixed(0)}" ry="${(s * 0.45).toFixed(0)}"/><circle cx="${(x - s * 0.35).toFixed(0)}" cy="${(y - s * 0.25).toFixed(0)}" r="${(s * 0.38).toFixed(0)}"/><circle cx="${(x + s * 0.2).toFixed(0)}" cy="${(y - s * 0.35).toFixed(0)}" r="${(s * 0.48).toFixed(0)}"/></g>`);
        break;
      }
      case 'hearts': {
        const s = 0.4 + r * 0.7;
        items.push(`<path d="M0 12 C-10 4 -14 -4 -8 -9 C-4 -12 0 -9 0 -6 C0 -9 4 -12 8 -9 C14 -4 10 4 0 12 z" fill="${c}" opacity=".5" transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${rot % 40 - 20}) scale(${(s * 2).toFixed(2)})"/>`);
        break;
      }
      case 'lines':
        items.push(`<path d="M${(x - 300).toFixed(0)} ${(y + 200).toFixed(0)} L${(x + 300).toFixed(0)} ${(y - 200).toFixed(0)}" stroke="${c}" stroke-width="${(1 + r * 3).toFixed(1)}" opacity=".25"/>`);
        break;
      case 'neon':
        items.push(`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(30 + r * 90).toFixed(0)}" fill="none" stroke="${c}" stroke-width="${(2 + r * 4).toFixed(1)}" opacity=".55"/>`);
        break;
      case 'fireworks': {
        const s = 40 + r * 60;
        const rays = Array.from({ length: 14 }, (_, k) => {
          const a = (k * (360 / 14) * Math.PI) / 180;
          return `M${(x + s * 0.3 * Math.cos(a)).toFixed(0)} ${(y + s * 0.3 * Math.sin(a)).toFixed(0)} L${(x + s * Math.cos(a)).toFixed(0)} ${(y + s * Math.sin(a)).toFixed(0)}`;
        }).join(' ');
        items.push(`<path d="${rays}" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity=".6"/>`);
        break;
      }
      case 'dots':
        items.push(`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(2 + r * 4).toFixed(1)}" fill="${c}" opacity=".45"/>`);
        break;
      default:
        break;
    }
  }

  if (b.decor === 'flags') {
    for (let row = 0; row < 3; row++) {
      const y0 = 60 + row * 280;
      items.push(`<path d="M0 ${y0} Q600 ${y0 + 90} 1200 ${y0}" stroke="#78350f" stroke-width="3" fill="none" opacity=".5"/>`);
      for (let k = 0; k < 20; k++) {
        const x = 30 + k * 60;
        const t = x / 1200;
        const y = y0 + 4 * 90 * t * (1 - t) * 0.5 * 2 - 4;
        items.push(`<path d="M${x - 20} ${y.toFixed(0)} h40 l-20 46 z" fill="${b.colors[(k + row) % b.colors.length]}" opacity=".8"/>`);
      }
    }
  }

  if (b.decor === 'planets') {
    for (let i = 0; i < 80; i++) {
      items.push(`<circle cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * H).toFixed(0)}" r="${(1 + rnd() * 2.5).toFixed(1)}" fill="#ffffff" opacity="${(0.4 + rnd() * 0.6).toFixed(2)}"/>`);
    }
    items.push(`<circle cx="160" cy="150" r="70" fill="${b.colors[0]}" opacity=".85"/><ellipse cx="160" cy="150" rx="120" ry="22" fill="none" stroke="${b.colors[1]}" stroke-width="8" opacity=".8" transform="rotate(-18 160 150)"/>`);
    items.push(`<circle cx="1060" cy="640" r="95" fill="${b.colors[2]}" opacity=".8"/><circle cx="1030" cy="610" r="18" fill="#ffffff" opacity=".2"/><circle cx="1090" cy="670" r="12" fill="#ffffff" opacity=".2"/>`);
    items.push(`<circle cx="1000" cy="130" r="30" fill="${b.colors[1]}" opacity=".8"/>`);
  }

  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b.from}"/><stop offset="1" stop-color="${b.to}"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>${items.join('')}
  </svg>`);
};

/* --------------------------------------------------------------------------
   Templates
   -------------------------------------------------------------------------- */

interface TemplateSpec extends Omit<InvitationTemplate, 'logo' | 'background'> {
  emblem: Omit<EmblemSpec, 'font'>;
  bg: BackgroundSpec;
}

const SPECS: TemplateSpec[] = [
  // Aniversário
  {
    id: 'aniv-confete', category: 'aniversario', name: 'Confete Colorido', tagline: 'Venha comemorar comigo!',
    titleColor: '#db2777', accentColor: '#f59e0b', buttonColor: '#db2777', font: 'rounded',
    emblem: { icon: 'cake', bg: '#fdf2f8', ring: '#f472b6', iconColor: '#ec4899', iconColor2: '#fbbf24', caption: 'Parabéns!', captionColor: '#be185d' },
    bg: { from: '#fff7ed', to: '#fce7f3', decor: 'confetti', colors: ['#f472b6', '#fbbf24', '#38bdf8', '#a78bfa', '#34d399'], seed: 11 },
  },
  {
    id: 'aniv-dourado', category: 'aniversario', name: 'Noite Dourada', tagline: 'Uma noite para celebrar',
    titleColor: '#b45309', accentColor: '#d97706', buttonColor: '#92400e', font: 'serif',
    emblem: { icon: 'champagne', bg: '#1f2937', ring: '#fbbf24', iconColor: '#fbbf24', iconColor2: '#fde68a', caption: 'Celebre comigo', captionColor: '#fde68a' },
    bg: { from: '#111827', to: '#1e1b4b', decor: 'sparkles', colors: ['#fbbf24', '#fde68a', '#f59e0b'], seed: 23 },
  },
  {
    id: 'aniv-baloes', category: 'aniversario', name: 'Balões no Céu', tagline: 'Você é meu convidado especial!',
    titleColor: '#2563eb', accentColor: '#ef4444', buttonColor: '#2563eb', font: 'rounded',
    emblem: { icon: 'balloons', bg: '#eff6ff', ring: '#60a5fa', iconColor: '#3b82f6', iconColor2: '#ef4444', caption: 'Vamos festejar!', captionColor: '#1d4ed8' },
    bg: { from: '#e0f2fe', to: '#dbeafe', decor: 'balloons', colors: ['#f87171', '#60a5fa', '#fbbf24', '#34d399', '#c084fc'], seed: 37 },
  },
  // Infantil
  {
    id: 'inf-festinha', category: 'infantil', name: 'Festinha Alegre', tagline: 'Tem festa e você está convidado!',
    titleColor: '#ea580c', accentColor: '#7c3aed', buttonColor: '#ea580c', font: 'rounded',
    emblem: { icon: 'partyHat', bg: '#fff7ed', ring: '#fb923c', iconColor: '#f97316', iconColor2: '#8b5cf6', caption: 'Festinha!', captionColor: '#c2410c' },
    bg: { from: '#fef9c3', to: '#ffedd5', decor: 'confetti', colors: ['#f97316', '#8b5cf6', '#22c55e', '#ef4444', '#0ea5e9'], seed: 41 },
  },
  {
    id: 'inf-espaco', category: 'infantil', name: 'Aventura no Espaço', tagline: 'Prepare-se para a decolagem!',
    titleColor: '#4f46e5', accentColor: '#f97316', buttonColor: '#4338ca', font: 'rounded',
    emblem: { icon: 'rocket', bg: '#1e1b4b', ring: '#a5b4fc', iconColor: '#e0e7ff', iconColor2: '#f97316', caption: 'Missão Festa', captionColor: '#e0e7ff' },
    bg: { from: '#0f172a', to: '#312e81', decor: 'planets', colors: ['#f97316', '#38bdf8', '#a855f7'], seed: 53 },
  },
  {
    id: 'inf-jardim', category: 'infantil', name: 'Jardim Encantado', tagline: 'Vem brincar com a gente!',
    titleColor: '#16a34a', accentColor: '#db2777', buttonColor: '#15803d', font: 'rounded',
    emblem: { icon: 'flower', bg: '#f0fdf4', ring: '#86efac', iconColor: '#f472b6', iconColor2: '#16a34a', caption: 'Vem brincar!', captionColor: '#15803d' },
    bg: { from: '#ecfccb', to: '#fce7f3', decor: 'petals', colors: ['#f472b6', '#86efac', '#fde047', '#c4b5fd'], seed: 61 },
  },
  // Casamento
  {
    id: 'cas-classico', category: 'casamento', name: 'Clássico Dourado', tagline: 'Temos a honra de convidar você',
    titleColor: '#a16207', accentColor: '#b45309', buttonColor: '#854d0e', font: 'serif',
    emblem: { icon: 'rings', bg: '#fffbeb', ring: '#d4af37', iconColor: '#d4af37', iconColor2: '#94a3b8', caption: 'Save the date', captionColor: '#92400e' },
    bg: { from: '#fffdf7', to: '#f5efe0', decor: 'dots', colors: ['#d4af37', '#e7d39b'], seed: 71 },
  },
  {
    id: 'cas-floral', category: 'casamento', name: 'Floral Rosé', tagline: 'Celebre conosco o nosso amor',
    titleColor: '#be185d', accentColor: '#db2777', buttonColor: '#9d174d', font: 'serif',
    emblem: { icon: 'heart', bg: '#fdf2f8', ring: '#f9a8d4', iconColor: '#ec4899', iconColor2: '#fce7f3', caption: 'Nosso Casamento', captionColor: '#9d174d' },
    bg: { from: '#fff1f2', to: '#fce7f3', decor: 'petals', colors: ['#fbcfe8', '#f9a8d4', '#fecdd3'], seed: 83 },
  },
  {
    id: 'cas-botanico', category: 'casamento', name: 'Botânico', tagline: 'Dissemos sim! Venha celebrar',
    titleColor: '#3f6212', accentColor: '#65a30d', buttonColor: '#3f6212', font: 'serif',
    emblem: { icon: 'wreath', bg: '#f7fee7', ring: '#a3e635', iconColor: '#65a30d', iconColor2: '#3f6212', caption: 'Sim!', captionColor: '#3f6212' },
    bg: { from: '#f7fee7', to: '#ecfdf5', decor: 'leaves', colors: ['#84cc16', '#4d7c0f', '#86efac'], seed: 97 },
  },
  // Chá de bebê
  {
    id: 'cha-nuvens', category: 'cha-bebe', name: 'Nuvens Azuis', tagline: 'Um pequeno grande amor está chegando',
    titleColor: '#0284c7', accentColor: '#0ea5e9', buttonColor: '#0369a1', font: 'rounded',
    emblem: { icon: 'rattle', bg: '#f0f9ff', ring: '#7dd3fc', iconColor: '#38bdf8', iconColor2: '#fde68a', caption: 'Chá de Bebê', captionColor: '#0369a1' },
    bg: { from: '#e0f2fe', to: '#f0f9ff', decor: 'clouds', colors: ['#ffffff'], seed: 101 },
  },
  {
    id: 'cha-rosa', category: 'cha-bebe', name: 'Rosa Suave', tagline: 'Vem aí a nossa princesa',
    titleColor: '#db2777', accentColor: '#f472b6', buttonColor: '#be185d', font: 'rounded',
    emblem: { icon: 'bottle', bg: '#fdf2f8', ring: '#f9a8d4', iconColor: '#f472b6', iconColor2: '#fbcfe8', caption: 'Bem-vinda!', captionColor: '#be185d' },
    bg: { from: '#fdf2f8', to: '#fce7f3', decor: 'hearts', colors: ['#f9a8d4', '#fbcfe8', '#fda4af'], seed: 113 },
  },
  {
    id: 'cha-revelacao', category: 'cha-bebe', name: 'Chá Revelação', tagline: 'Menino ou menina? Venha descobrir!',
    titleColor: '#7c3aed', accentColor: '#ec4899', buttonColor: '#6d28d9', font: 'rounded',
    emblem: { icon: 'question', bg: '#faf5ff', ring: '#c4b5fd', iconColor: '#60a5fa', iconColor2: '#f472b6', caption: 'Revelação', captionColor: '#6d28d9' },
    bg: { from: '#dbeafe', to: '#fce7f3', decor: 'confetti', colors: ['#60a5fa', '#f472b6', '#c4b5fd'], seed: 127 },
  },
  // Formatura
  {
    id: 'form-azul', category: 'formatura', name: 'Azul & Dourado', tagline: 'Celebre esta conquista conosco',
    titleColor: '#1e3a8a', accentColor: '#ca8a04', buttonColor: '#1e3a8a', font: 'serif',
    emblem: { icon: 'gradCap', bg: '#172554', ring: '#facc15', iconColor: '#facc15', iconColor2: '#fde68a', caption: 'Formatura', captionColor: '#fde68a' },
    bg: { from: '#172554', to: '#1e3a8a', decor: 'stars', colors: ['#facc15', '#fde68a', '#ffffff'], seed: 131 },
  },
  {
    id: 'form-vinho', category: 'formatura', name: 'Vinho Elegante', tagline: 'Missão cumprida!',
    titleColor: '#881337', accentColor: '#b45309', buttonColor: '#881337', font: 'serif',
    emblem: { icon: 'diploma', bg: '#fff1f2', ring: '#be123c', iconColor: '#9f1239', iconColor2: '#d4af37', caption: 'Conquista', captionColor: '#881337' },
    bg: { from: '#4c0519', to: '#881337', decor: 'sparkles', colors: ['#fcd34d', '#fde68a'], seed: 139 },
  },
  // Corporativo
  {
    id: 'corp-executivo', category: 'corporativo', name: 'Azul Executivo', tagline: 'Você é nosso convidado',
    titleColor: '#1d4ed8', accentColor: '#0ea5e9', buttonColor: '#1d4ed8', font: 'sans',
    emblem: { icon: 'briefcase', bg: '#eff6ff', ring: '#3b82f6', iconColor: '#1d4ed8', iconColor2: '#93c5fd', caption: 'Evento', captionColor: '#1e40af' },
    bg: { from: '#dbeafe', to: '#eff6ff', decor: 'lines', colors: ['#1d4ed8', '#0ea5e9'], seed: 149 },
  },
  {
    id: 'corp-grafite', category: 'corporativo', name: 'Grafite Moderno', tagline: 'Conecte-se, aprenda e celebre',
    titleColor: '#0f172a', accentColor: '#0ea5e9', buttonColor: '#0f172a', font: 'sans',
    emblem: { icon: 'chart', bg: '#0f172a', ring: '#38bdf8', iconColor: '#e2e8f0', iconColor2: '#38bdf8', caption: 'Networking', captionColor: '#e2e8f0' },
    bg: { from: '#0f172a', to: '#334155', decor: 'lines', colors: ['#38bdf8', '#94a3b8'], seed: 151 },
  },
  // Festa
  {
    id: 'festa-neon', category: 'festa', name: 'Balada Neon', tagline: 'A noite é nossa!',
    titleColor: '#c026d3', accentColor: '#0891b2', buttonColor: '#a21caf', font: 'sans',
    emblem: { icon: 'cocktail', bg: '#0f0a1e', ring: '#e879f9', iconColor: '#22d3ee', iconColor2: '#e879f9', caption: 'Bora curtir!', captionColor: '#f0abfc' },
    bg: { from: '#09090b', to: '#2e1065', decor: 'neon', colors: ['#e879f9', '#22d3ee', '#a3e635'], seed: 163 },
  },
  {
    id: 'festa-junina', category: 'festa', name: 'Arraiá', tagline: 'Olha a festa junina, sô!',
    titleColor: '#c2410c', accentColor: '#16a34a', buttonColor: '#c2410c', font: 'rounded',
    emblem: { icon: 'flags', bg: '#fffbeb', ring: '#f59e0b', iconColor: '#dc2626', iconColor2: '#2563eb', caption: 'Arraiá', captionColor: '#9a3412' },
    bg: { from: '#fef3c7', to: '#fde68a', decor: 'flags', colors: ['#dc2626', '#2563eb', '#16a34a', '#f59e0b', '#db2777'], seed: 173 },
  },
  {
    id: 'festa-confraternizacao', category: 'festa', name: 'Confraternização', tagline: 'Vamos brindar juntos!',
    titleColor: '#1e40af', accentColor: '#d97706', buttonColor: '#1e3a8a', font: 'sans',
    emblem: { icon: 'fireworks', bg: '#172554', ring: '#fbbf24', iconColor: '#fbbf24', iconColor2: '#60a5fa', caption: 'Celebração', captionColor: '#fde68a' },
    bg: { from: '#0b1437', to: '#1e3a8a', decor: 'fireworks', colors: ['#fbbf24', '#60a5fa', '#f472b6', '#34d399'], seed: 181 },
  },
  // Outros
  {
    id: 'geral-classico', category: 'geral', name: 'Clássico FotoQREventos', tagline: 'Você está convidado!',
    titleColor: '#0891b2', accentColor: '#e11d48', buttonColor: '#0e7490', font: 'sans',
    emblem: { icon: 'camera', bg: '#ecfeff', ring: '#22d3ee', iconColor: '#0891b2', iconColor2: '#cffafe', caption: 'Vamos celebrar!', captionColor: '#0e7490' },
    bg: { from: '#f8fafc', to: '#e0f2fe', decor: 'dots', colors: ['#22d3ee', '#94a3b8'], seed: 191 },
  },
];

export const INVITATION_TEMPLATES: InvitationTemplate[] = SPECS.map(({ emblem: e, bg, ...t }) => ({
  ...t,
  logo: emblem({ ...e, font: t.font }),
  background: background(bg),
}));

export const getInvitationTemplate = (id?: string | null): InvitationTemplate | undefined =>
  id ? INVITATION_TEMPLATES.find((t) => t.id === id) : undefined;

const KEYWORDS: [InvitationCategory, RegExp][] = [
  ['cha-bebe', /ch[aá]\s+(de\s+)?(beb[eê]|revela[cç][aã]o|fralda)|revela[cç][aã]o|baby\s*shower/i],
  ['casamento', /casamento|bodas|noivado|wedding|matrim[oô]nio|noivos/i],
  ['formatura', /formatura|colação|cola[cç][aã]o|graduação|graduacao|formandos?/i],
  ['infantil', /infantil|batizado|mesvers[aá]rio|festinha|\b[1-9]\s*anos?\b/i],
  ['aniversario', /anivers[aá]rio|niver|birthday|\b\d{2}\s*anos\b|parab[eé]ns/i],
  ['corporativo', /corporativ|empresa|congresso|semin[aá]rio|palestra|workshop|confer[eê]ncia|lan[cç]amento|treinamento/i],
  ['festa', /festa|balada|junina|arrai[aá]|confraterniza|r[eé]veillon|churrasco|happy\s*hour|show/i],
];

/** Best guess of the event type from its title / description (null when nothing matches). */
export const guessInvitationCategory = (...texts: (string | undefined | null)[]): InvitationCategory | null => {
  const text = texts.filter(Boolean).join(' ');
  for (const [category, re] of KEYWORDS) {
    if (re.test(text)) return category;
  }
  return null;
};

export const FONT_CLASS: Record<InvitationFont, string> = {
  sans: 'font-sans',
  serif: 'font-serif',
  rounded: 'font-sans tracking-tight',
};

export interface InvitationLook {
  template?: InvitationTemplate;
  /** Logo to show, or null for the built-in placeholder. */
  logoSrc: string | null;
  /** CSS background for the page around the card, or null for the default. */
  backgroundCss: string | null;
  /** True when the background is a ready-made design (no wash overlay needed). */
  isTemplateBackground: boolean;
  titleColor: string;
  accentColor: string;
  buttonColor: string;
  fontClass: string;
  tagline: string | null;
}

/**
 * What an invitation looks like: the chosen template supplies logo, background and colors;
 * a custom uploaded cover or background replaces the template's one.
 */
export const resolveInvitationLook = (opts: {
  templateId?: string | null;
  coverImage?: string | null;
  backgroundImage?: string | null;
}): InvitationLook => {
  const template = getInvitationTemplate(opts.templateId);
  const customBg = toCssBackgroundLayer(opts.backgroundImage);
  const templateBg = template ? `url("${template.background}") center/cover no-repeat` : null;
  return {
    template,
    logoSrc: isImageUrl(opts.coverImage) ? opts.coverImage : template?.logo ?? null,
    backgroundCss: customBg ?? templateBg,
    isTemplateBackground: !customBg && Boolean(templateBg),
    titleColor: template?.titleColor ?? '#06b6d4',
    accentColor: template?.accentColor ?? '#f43f5e',
    buttonColor: template?.buttonColor ?? '#0891b2',
    fontClass: FONT_CLASS[template?.font ?? 'sans'],
    tagline: template?.tagline ?? null,
  };
};
