import React, { useState } from 'react';
import { Trash2, ZoomIn, Check, ImageOff } from 'lucide-react';
import { Photo } from '../../types';
import { formatFileSize } from '../Upload/PhotoPreview';

interface PhotoCardProps {
  photo: Photo;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  canDelete?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  selectable?: boolean;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  onClick,
  onDelete,
  isDeleting = false,
  canDelete = false,
  isSelected = false,
  onToggleSelect,
  selectable = true,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(photo.thumbnail_url || photo.url);

  const formattedDate = photo.uploaded_at
    ? new Date(photo.uploaded_at).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const handleImageError = () => {
    // If thumbnail failed, try full image before giving up
    if (photo.thumbnail_url && currentSrc === photo.thumbnail_url && photo.url && photo.url !== photo.thumbnail_url) {
      setCurrentSrc(photo.url);
      return;
    }
    setImageLoaded(true);
    setLoadError(true);
  };

  return (
    <div
      onClick={onClick}
      className={`group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
        isSelected ? 'ring-3 ring-brand-500 border-brand-500 shadow-md' : ''
      }`}
    >
      {/* Selection Checkbox */}
      {selectable && !loadError && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.(photo.id);
          }}
          className={`absolute top-2.5 left-2.5 z-10 w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-brand-600 text-white shadow-md ring-2 ring-white scale-105'
              : 'bg-black/40 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-md opacity-80 sm:opacity-0 group-hover:opacity-100'
          }`}
          title={isSelected ? 'Desmarcar foto' : 'Selecionar foto'}
        >
          {isSelected ? (
            <Check className="w-4 h-4 stroke-[3]" />
          ) : (
            <div className="w-3.5 h-3.5 rounded-md border-2 border-white/80" />
          )}
        </button>
      )}

      {/* Skeleton loader until image loads */}
      {!imageLoaded && !loadError && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
          <span className="text-slate-400 text-xs">Carregando...</span>
        </div>
      )}

      {/* Error state if image fails to load */}
      {loadError && (
        <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-3 text-center">
          <ImageOff className="w-8 h-8 mb-1.5 text-slate-300 stroke-[1.5]" />
          <span className="text-[11px] font-medium text-slate-500">Foto indisponível</span>
        </div>
      )}

      {/* Actual image */}
      {!loadError && (
        <img
          src={currentSrc}
          alt={photo.filename || 'Foto do evento'}
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
          loading="lazy"
          className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Dark hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
        {/* Top actions */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/90 font-medium px-2 py-0.5 bg-slate-900/50 backdrop-blur-md rounded-md">
            {formatFileSize(photo.size)}
          </span>

          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(photo.id)}
                disabled={isDeleting}
                className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white backdrop-blur-md transition-colors"
                title="Excluir foto"
                aria-label="Excluir foto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Center zoom icon */}
        <div className="self-center text-white/80 group-hover:scale-110 transition-transform">
          <ZoomIn className="w-7 h-7 drop-shadow-md" />
        </div>

        {/* Bottom info */}
        <div className="text-white text-[11px]">
          {photo.original_name && (
            <p className="font-semibold truncate drop-shadow-sm">
              {photo.original_name}
            </p>
          )}
          {formattedDate && (
            <p className="text-slate-300 text-[10px] drop-shadow-sm">
              Enviada em {formattedDate}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
