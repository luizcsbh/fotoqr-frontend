import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Share2, MessageCircle, Facebook, Twitter, Link2, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Photo } from '../../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Celulares e tablets: lá a folha nativa de compartilhamento mostra WhatsApp, Instagram etc. */
const isTouchDevice = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;

const hasNativeShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

/** Arquivos já baixados para compartilhar, para o toque seguinte abrir a folha na hora. */
const fileCache = new Map<string, File>();

const extensionFor = (type: string) => {
  if (type === 'image/png') return '.png';
  if (type === 'image/webp') return '.webp';
  return '.jpg';
};

const fileNameFor = (photo: Photo, type: string) => {
  const base = (photo.original_name || photo.filename || `foto-${photo.id}`).replace(/\.[^./\\]+$/, '');
  return `${base}${extensionFor(type)}`;
};

/**
 * Baixa a foto como File para a Web Share API. Devolve null se o navegador não aceitar
 * arquivos, se a imagem não puder ser lida (CORS, rede) ou se demorar demais — nesse caso
 * compartilhamos o link. O limite de tempo existe porque o navegador só abre a folha de
 * compartilhamento logo depois do toque do usuário.
 */
async function getShareFile(photo: Photo, timeoutMs = 4000): Promise<File | null> {
  const cached = fileCache.get(photo.url);
  if (cached) return cached;
  if (typeof navigator.canShare !== 'function' || typeof File === 'undefined') return null;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(photo.url, { mode: 'cors', credentials: 'omit', signal: controller.signal });
    if (!res.ok) return null;
    const blob = await res.blob();
    const type = blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
    const file = new File([blob], fileNameFor(photo, type), { type });
    if (!navigator.canShare({ files: [file] })) return null;
    fileCache.set(photo.url, file);
    return file;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

/** Baixa antecipadamente a foto aberta no visualizador (só onde a folha nativa é usada). */
export function prefetchShareFile(photo: Photo | undefined) {
  if (!photo || !hasNativeShare() || !isTouchDevice()) return;
  void getShareFile(photo, 15000);
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // tenta o método antigo abaixo
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

// ─── Share sheet (fallback para desktop / navegadores sem Web Share) ─────────

interface ShareSheetProps {
  photo: Photo;
  shareText: string;
  onClose: () => void;
  onNativeShare?: () => void;
}

const ShareSheet: React.FC<ShareSheetProps> = ({ photo, shareText, onClose, onNativeShare }) => {
  const url = photo.url;
  const encodedUrl = encodeURIComponent(url);

  useEffect(() => {
    // Captura no document para o Esc/setas não chegarem ao visualizador (que escuta no window).
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.stopPropagation();
        if (e.key === 'Escape') onClose();
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [onClose]);

  const handleCopy = async () => {
    if (await copyText(url)) {
      toast.success('Link da foto copiado!');
      onClose();
    } else {
      toast.error('Não foi possível copiar o link.');
    }
  };

  const linkOptions = [
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`,
      Icon: MessageCircle,
      iconClass: 'bg-emerald-500 text-white',
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      Icon: Facebook,
      iconClass: 'bg-blue-600 text-white',
    },
    {
      label: 'X (Twitter)',
      href: `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodedUrl}`,
      Icon: Twitter,
      iconClass: 'bg-slate-900 text-white',
    },
  ];

  const optionClass =
    'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500 transition-colors';

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
      // O portal ainda propaga eventos pela árvore do React: sem isso, o clique fecharia o
      // visualizador ou abriria a miniatura que está por trás.
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-photo-title"
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-slate-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <img
            src={photo.thumbnail_url || photo.url}
            alt=""
            className="h-12 w-12 shrink-0 rounded-xl object-cover bg-slate-100"
          />
          <div className="min-w-0 flex-1">
            <h2 id="share-photo-title" className="text-base font-bold text-slate-800">
              Compartilhar foto
            </h2>
            <p className="truncate text-xs text-slate-500">Envie para amigos e redes sociais</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          {linkOptions.map(({ label, href, Icon, iconClass }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className={optionClass}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
                <Icon className="w-4 h-4" />
              </span>
              {label}
            </a>
          ))}

          <button type="button" onClick={() => void handleCopy()} className={optionClass}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <Link2 className="w-4 h-4" />
            </span>
            Copiar link
          </button>

          {onNativeShare && (
            <button type="button" onClick={onNativeShare} className={optionClass}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <Share2 className="w-4 h-4" />
              </span>
              Mais opções…
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Button ──────────────────────────────────────────────────────────────────

interface SharePhotoButtonProps {
  photo: Photo;
  eventTitle?: string;
  /** "lightbox": botão com texto no visualizador; "thumbnail": ícone pequeno sobre a miniatura. */
  variant?: 'lightbox' | 'thumbnail';
  className?: string;
}

export const SharePhotoButton: React.FC<SharePhotoButtonProps> = ({
  photo,
  eventTitle,
  variant = 'lightbox',
  className = '',
}) => {
  const [isPreparing, setIsPreparing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const shareTitle = eventTitle ? `Foto do evento ${eventTitle}` : 'Foto do evento';
  const shareText = eventTitle ? `Olha esta foto do evento "${eventTitle}"!` : 'Olha esta foto do evento!';

  /** Abre a folha nativa do sistema. Devolve false quando não deu para usar (para mostrar o menu). */
  const shareNatively = async (): Promise<boolean> => {
    const file = await getShareFile(photo);
    const data: ShareData = file
      ? { files: [file], title: shareTitle }
      : { title: shareTitle, text: shareText, url: photo.url };
    try {
      await navigator.share(data);
      return true;
    } catch (err) {
      // AbortError = o usuário fechou a folha sem escolher; não é erro.
      return err instanceof DOMException && err.name === 'AbortError';
    }
  };

  const handleShare = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isPreparing) return;

    if (hasNativeShare() && isTouchDevice()) {
      setIsPreparing(true);
      const shared = await shareNatively();
      setIsPreparing(false);
      if (shared) return;
    }
    setSheetOpen(true);
  };

  const handleNativeFromSheet = async () => {
    setSheetOpen(false);
    if (!(await shareNatively())) toast.error('Não foi possível abrir o compartilhamento.');
  };

  const Icon = isPreparing ? Loader2 : Share2;
  const iconSpin = isPreparing ? 'animate-spin' : '';

  return (
    <>
      {variant === 'thumbnail' ? (
        // <span> porque a miniatura inteira já é um <button> (mesmo padrão da caixa de seleção).
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => void handleShare(e)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') void handleShare(e);
          }}
          className={`w-7 h-7 rounded-lg flex items-center justify-center bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500 ${className}`}
          title="Compartilhar foto"
          aria-label="Compartilhar foto"
        >
          <Icon className={`w-4 h-4 ${iconSpin}`} />
        </span>
      ) : (
        <button
          type="button"
          onClick={(e) => void handleShare(e)}
          disabled={isPreparing}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold min-h-9 px-3 py-1 rounded-full bg-brand-600 hover:bg-brand-700 text-white transition-colors disabled:opacity-80 ${className}`}
          title="Compartilhar foto"
        >
          <Icon className={`w-4 h-4 ${iconSpin}`} />
          <span>Compartilhar</span>
        </button>
      )}

      {sheetOpen && (
        <ShareSheet
          photo={photo}
          shareText={shareText}
          onClose={() => setSheetOpen(false)}
          onNativeShare={hasNativeShare() ? () => void handleNativeFromSheet() : undefined}
        />
      )}
    </>
  );
};
