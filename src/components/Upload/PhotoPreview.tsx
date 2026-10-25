import React from 'react';
import { X } from 'lucide-react';
import { UploadProgressItem } from '../../types';

interface PhotoPreviewProps {
  items: UploadProgressItem[];
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  items,
  onRemove,
  disabled = false,
}) => {
  if (items.length === 0) return null;

  const totalSize = items.reduce((acc, curr) => acc + curr.file.size, 0);

  return (
    <div className="w-full space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 pb-1">
        <span>Fotos selecionadas ({items.length})</span>
        <span className="text-slate-500 font-normal">Tamanho total: {formatFileSize(totalSize)}</span>
      </div>

      {/* Grid of thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm transition-all hover:shadow-md"
          >
            {/* Thumbnail Image */}
            <img
              src={item.previewUrl}
              alt={item.file.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-80" />

            {/* Remove button — always visible for mobile tap support */}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
                className="absolute top-1.5 right-1.5 p-2 rounded-full bg-red-600/80 hover:bg-red-600 active:bg-red-700 text-white backdrop-blur-md transition-colors shadow-md"
                title="Remover foto"
                aria-label="Remover foto"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Info footer */}
            <div className="absolute bottom-1.5 inset-x-2 text-white text-[11px] leading-tight truncate">
              <p className="font-medium truncate drop-shadow-sm">{item.file.name}</p>
              <p className="text-slate-300 text-[10px] drop-shadow-sm">
                {formatFileSize(item.file.size)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
