/**
 * Helpers for cover / background values saved by the cover editor. A value is either an image
 * (http(s), data:image or blob URL) or a CSS color / gradient picked from a template.
 */

const IMAGE_URL = /^(https?:\/\/|data:image\/|blob:|\/)/i;
const CSS_COLOR_OR_GRADIENT =
  /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\)|(linear|radial)-gradient\([#\w\s.,%()-]+\))$/i;

/** True when the value can be used as an <img src>. */
export const isImageUrl = (value?: string | null): value is string =>
  Boolean(value && IMAGE_URL.test(value.trim()));

/**
 * CSS `background` layer for the value, or null when it is neither an image nor a
 * color/gradient (so arbitrary text never reaches the style attribute).
 */
export const toCssBackgroundLayer = (value?: string | null): string | null => {
  const v = (value || '').trim();
  if (!v) return null;
  if (IMAGE_URL.test(v)) return `url("${v.replace(/["\\\n\r]/g, '')}") center/cover no-repeat`;
  if (CSS_COLOR_OR_GRADIENT.test(v)) {
    return v.startsWith('#') || /^(rgb|hsl)/i.test(v) ? `linear-gradient(${v}, ${v})` : v;
  }
  return null;
};
