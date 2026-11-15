import type { Plugin } from 'vite';

/**
 * SEO para indexação pelo Google.
 *
 * Gera no build:
 *  - robots.txt  → libera a página pública e bloqueia áreas privadas
 *                  (painel, eventos, convites, fotos enviadas, API).
 *  - sitemap.xml → lista as páginas públicas (apenas quando VITE_SITE_URL existe).
 *
 * E injeta no index.html: canonical, Open Graph, a meta de verificação
 * do Google Search Console (VITE_GOOGLE_SITE_VERIFICATION) e a meta
 * google-adsense-account (VITE_ADSENSE_CLIENT_ID) usada na revisão do AdSense.
 */

interface SeoOptions {
  /** URL pública do site, ex.: https://fotoqreventos.com.br */
  siteUrl?: string;
  /** Código da meta "google-site-verification" do Search Console. */
  googleSiteVerification?: string;
  /** ID do editor do AdSense, ex.: ca-pub-1234567890. */
  adsenseClientId?: string;
}

/** Páginas públicas que devem aparecer no Google. */
const PUBLIC_PATHS = [{ path: '/', changefreq: 'weekly', priority: '1.0' }];

/** Áreas privadas ou de convidados que não devem ser rastreadas. */
const DISALLOWED_PATHS = [
  '/api/',
  '/uploads/',
  '/dashboard',
  '/profile',
  '/login',
  '/esqueci-a-senha',
  '/redefinir-senha',
  '/evento/',
  '/e/',
  '/convite/',
  '/placa/',
  '/acesso/',
  '/leitor/',
  '/portaria/',
  '/dj/',
];

const normalizeUrl = (url?: string) => (url ? url.trim().replace(/\/+$/, '') : '');

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/**
 * O robô do AdSense (Mediapartners-Google) precisa ler as páginas onde há
 * anúncios (ex.: galeria do evento) para exibir anúncios relevantes. Ele não
 * indexa nada na Busca, então liberá-lo não expõe essas páginas no Google.
 */
const ADS_CRAWLER_DISALLOWED_PATHS = ['/api/', '/uploads/'];

export const buildRobotsTxt = (siteUrl: string) => {
  const lines = [
    'User-agent: Mediapartners-Google',
    'Allow: /',
    ...ADS_CRAWLER_DISALLOWED_PATHS.map((p) => `Disallow: ${p}`),
    '',
    'User-agent: *',
    'Allow: /',
    ...DISALLOWED_PATHS.map((p) => `Disallow: ${p}`),
  ];
  if (siteUrl) lines.push('', `Sitemap: ${siteUrl}/sitemap.xml`);
  return `${lines.join('\n')}\n`;
};

export const buildSitemapXml = (siteUrl: string, lastmod: string) => {
  const urls = PUBLIC_PATHS.map(
    ({ path, changefreq, priority }) =>
      `  <url>\n    <loc>${siteUrl}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n` +
      `    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
  ).join('\n');
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${urls}\n</urlset>\n`
  );
};

export const seoPlugin = (options: SeoOptions): Plugin => {
  const siteUrl = normalizeUrl(options.siteUrl);
  const verification = options.googleSiteVerification?.trim() ?? '';
  const adsenseClientId = options.adsenseClientId?.trim() ?? '';
  const lastmod = new Date().toISOString().slice(0, 10);

  return {
    name: 'fotoqreventos-seo',

    transformIndexHtml() {
      const tags: { tag: string; attrs: Record<string, string>; injectTo: 'head' }[] = [
        { tag: 'meta', attrs: { name: 'robots', content: 'index, follow' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:type', content: 'website' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:site_name', content: 'FotoQREventos' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:locale', content: 'pt_BR' }, injectTo: 'head' },
      ];
      if (siteUrl) {
        tags.push(
          { tag: 'link', attrs: { rel: 'canonical', href: `${siteUrl}/` }, injectTo: 'head' },
          { tag: 'meta', attrs: { property: 'og:url', content: `${siteUrl}/` }, injectTo: 'head' },
        );
      }
      if (verification) {
        tags.push({
          tag: 'meta',
          attrs: { name: 'google-site-verification', content: escapeAttr(verification) },
          injectTo: 'head',
        });
      }
      if (/^ca-pub-\d+$/.test(adsenseClientId)) {
        tags.push({
          tag: 'meta',
          attrs: { name: 'google-adsense-account', content: adsenseClientId },
          injectTo: 'head',
        });
      }
      return tags;
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req as { url?: string }).url;
        if (url === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(buildRobotsTxt(siteUrl));
          return;
        }
        if (url === '/sitemap.xml' && siteUrl) {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8');
          res.end(buildSitemapXml(siteUrl, lastmod));
          return;
        }
        next();
      });
    },

    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: buildRobotsTxt(siteUrl) });
      if (siteUrl) {
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemapXml(siteUrl, lastmod) });
      } else {
        this.warn('VITE_SITE_URL não definida: sitemap.xml não foi gerado e o robots.txt saiu sem a linha Sitemap.');
      }
    },
  };
};
