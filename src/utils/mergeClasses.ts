/**
 * Junta as classes padrão de um componente com as classes passadas via `className`,
 * removendo do padrão as que a tela sobrescreve (mesmo grupo e mesma variante).
 *
 * Sem isso, quem vence um conflito como `shadow-xs` x `shadow-xl` é a ordem do CSS gerado,
 * que mudou no Tailwind 4 (os tamanhos nomeados não saem mais em ordem crescente).
 */
const GROUPS: Array<[string, RegExp]> = [
  ['shadow', /^shadow(-(2xs|xs|sm|md|lg|xl|2xl|inner|none))?$/],
  ['rounded', /^rounded(-(xs|sm|md|lg|xl|2xl|3xl|4xl|full|none))?$/],
  ['text-size', /^text-(xs|sm|base|lg|xl|[2-9]xl)$/],
  ['font-weight', /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/],
];

const groupKey = (token: string): string | null => {
  const sep = token.lastIndexOf(':');
  const variant = sep >= 0 ? token.slice(0, sep) : '';
  const base = token.slice(sep + 1).replace(/^!/, '');
  const group = GROUPS.find(([, pattern]) => pattern.test(base));
  return group ? `${variant}|${group[0]}` : null;
};

export const mergeClasses = (base: string, override = ''): string => {
  const overrideTokens = override.split(/\s+/).filter(Boolean);
  const overridden = new Set(overrideTokens.map(groupKey).filter((key): key is string => key !== null));
  const baseTokens = base.split(/\s+/).filter((token) => {
    if (!token) return false;
    const key = groupKey(token);
    return key === null || !overridden.has(key);
  });
  return [...baseTokens, ...overrideTokens].join(' ');
};
