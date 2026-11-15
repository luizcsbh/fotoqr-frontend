import React from 'react';
import { Cookie, Settings2 } from 'lucide-react';
import { openCookiePreferences } from '../utils/cookieConsent';

interface CookieRow {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
}

const essentialCookies: CookieRow[] = [
  {
    name: 'fotoqr_token',
    provider: 'FotoQREventos',
    purpose: 'Mantém você conectado à sua conta de organizador.',
    duration: '7 dias',
  },
  {
    name: 'fotoqr_staff_token',
    provider: 'FotoQREventos',
    purpose: 'Mantém a sessão de quem entra por um link de acesso da equipe (portaria, DJ, fotógrafo).',
    duration: '7 dias',
  },
  {
    name: 'connect.sid',
    provider: 'FotoQREventos',
    purpose: 'Sessão técnica do servidor, usada por segurança.',
    duration: '24 horas',
  },
];

const localStorageItems: CookieRow[] = [
  {
    name: 'fotoqr_cookie_consent',
    provider: 'FotoQREventos',
    purpose: 'Guarda a sua escolha sobre cookies para não perguntar de novo.',
    duration: 'Até você limpar os dados do navegador',
  },
  {
    name: 'fotoqr_guest_name / fotoqr_wall_guest',
    provider: 'FotoQREventos',
    purpose: 'Lembra o nome que você digitou como convidado (pedidos de música e mural de mensagens).',
    duration: 'Até você limpar os dados do navegador',
  },
  {
    name: 'fotoqr_qr_custom_* / fotoqr_telao_mural_*',
    provider: 'FotoQREventos',
    purpose: 'Preferências do organizador para o QR Code personalizado e o telão.',
    duration: 'Até você limpar os dados do navegador',
  },
];

const adCookies: CookieRow[] = [
  {
    name: '__gads, __gpi, IDE e similares',
    provider: 'Google AdSense',
    purpose:
      'Exibir anúncios, limitar quantas vezes o mesmo anúncio aparece e, com o seu consentimento, personalizar os anúncios de acordo com seus interesses.',
    duration: 'Até 13 meses (definido pelo Google)',
  },
];

const CookieTable: React.FC<{ rows: CookieRow[] }> = ({ rows }) => (
  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
    <table className="w-full text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
        <tr>
          <th className="px-4 py-3 font-semibold">Nome</th>
          <th className="px-4 py-3 font-semibold">Origem</th>
          <th className="px-4 py-3 font-semibold">Finalidade</th>
          <th className="px-4 py-3 font-semibold">Duração</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row) => (
          <tr key={row.name} className="align-top">
            <td className="px-4 py-3 font-mono text-xs text-slate-800 break-words">{row.name}</td>
            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row.provider}</td>
            <td className="px-4 py-3 text-slate-600 min-w-[220px]">{row.purpose}</td>
            <td className="px-4 py-3 text-slate-600 min-w-[120px]">{row.duration}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const CookiePolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
          <Cookie className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Política de Cookies</h1>
          <p className="text-sm text-slate-500">Como o FotoQREventos usa cookies e dados do seu navegador</p>
        </div>
      </div>

      <div className="space-y-10 text-slate-700 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">O que são cookies?</h2>
          <p>
            Cookies são pequenos arquivos que um site salva no seu navegador. Eles servem para lembrar quem você é entre
            uma página e outra, guardar preferências e, em alguns casos, exibir anúncios. Também usamos o armazenamento
            local do navegador (localStorage), que funciona de forma parecida.
          </p>
          <p>
            Tratamos esses dados de acordo com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">1. Cookies essenciais</h2>
          <p>
            Necessários para o login, a segurança e o funcionamento do site. Não podem ser desativados, mas não são
            usados para publicidade. Convidados que apenas enviam fotos não recebem cookies de login.
          </p>
          <CookieTable rows={essentialCookies} />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">2. Preferências salvas no navegador</h2>
          <p>
            Informações que ficam só no seu aparelho para facilitar o uso. Não são enviadas a terceiros.
          </p>
          <CookieTable rows={localStorageItems} />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">3. Cookies de publicidade (opcionais)</h2>
          <p>
            Algumas páginas exibem anúncios do Google AdSense, que ajudam a manter o FotoQREventos gratuito. Os anúncios
            só são carregados depois que você responde ao aviso de cookies:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Aceitar todos:</strong> o Google pode usar cookies para mostrar anúncios de acordo com seus
              interesses.
            </li>
            <li>
              <strong>Somente essenciais:</strong> os anúncios continuam aparecendo, mas sem personalização. O Google
              ainda pode usar cookies para limitar a repetição de anúncios e prevenir fraudes.
            </li>
          </ul>
          <CookieTable rows={adCookies} />
          <p className="text-sm">
            Saiba mais sobre como o Google usa esses dados em{' '}
            <a
              href="https://policies.google.com/technologies/ads?hl=pt-BR"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-700 underline underline-offset-2"
            >
              policies.google.com/technologies/ads
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">Como mudar a sua escolha</h2>
          <p>
            Você pode rever sua escolha a qualquer momento pelo botão abaixo ou pelo link “Preferências de cookies” no
            rodapé do site. Também é possível apagar ou bloquear cookies nas configurações do seu navegador. Bloquear os
            cookies essenciais pode impedir o login.
          </p>
          <button
            type="button"
            onClick={openCookiePreferences}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm"
          >
            <Settings2 className="w-4 h-4" />
            Preferências de cookies
          </button>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">Seus direitos</h2>
          <p>
            Pela LGPD, você pode pedir acesso, correção ou exclusão dos seus dados pessoais e revogar o consentimento a
            qualquer momento. Para isso, entre em contato com o organizador do evento ou com a equipe do FotoQREventos.
          </p>
        </section>

        <p className="text-xs text-slate-400">Última atualização: novembro de 2026.</p>
      </div>
    </div>
  );
};
