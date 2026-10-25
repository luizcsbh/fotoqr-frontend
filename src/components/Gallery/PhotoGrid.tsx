import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Download, Trash2, ImageOff } from 'lucide-react';
import { Photo } from '../../types';
import { PhotoCard } from './PhotoCard';
import { EmptyState } from '../UI/EmptyState';
import { Button } from '../UI/Button';
import { formatFileSize } from '../Upload/PhotoPreview';

interface PhotoGridProps {
  photos: Photo[];
  totalPhotos: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onDeletePhoto?: (id: string) => void;
  isDeletingId?: string | null;
  canDelete?: boolean;
  onDownloadSelected?: (selectedIds: string[]) => void;
  onDownloadAll?: () => void;
  isDownloading?: boolean;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  totalPhotos,
  currentPage,
  totalPages,
  onPageChange,
  onDeletePhoto,
  isDeletingId,
  canDelete = false,
  onDownloadSelected,
  onDownloadAll,
  isDownloading = false,
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset selection when page changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (selectedPhotoIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPhotoIndex(null);
      } else if (e.key === 'ArrowRight') {
        setSelectedPhotoIndex((prev) =>
          prev !== null && prev < photos.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowLeft') {
        setSelectedPhotoIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, photos.length]);

  if (photos.length === 0) {
    return (
      <EmptyState
        icon={<ImageOff className="w-10 h-10" />}
        title="Nenhuma foto enviada ainda"
        description="Compartilhe o QR Code com seus convidados para começar a receber fotos neste álbum."
      />
    );
  }

  const activePhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;

  const allCurrentSelected = photos.length > 0 && photos.every((p) => selectedIds.has(p.id));

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (allCurrentSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map((p) => p.id)));
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Selection Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-3 sm:p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <input
              id="select-all-photos-checkbox"
              name="select_all_photos"
              type="checkbox"
              checked={allCurrentSelected}
              onChange={handleToggleSelectAll}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
            />
            <span>Selecionar Todas ({photos.length})</span>
          </label>

          {selectedIds.size > 0 && (
            <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
              {selectedIds.size} selecionada{selectedIds.size > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onDownloadSelected?.(Array.from(selectedIds))}
                isLoading={isDownloading}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Baixar Selecionadas ({selectedIds.size})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="text-slate-500 text-xs"
              >
                Desmarcar
              </Button>
            </>
          ) : (
            onDownloadAll && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadAll}
                isLoading={isDownloading}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Baixar Todas em ZIP ({totalPhotos})
              </Button>
            )
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {photos.map((photo, index) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onClick={() => setSelectedPhotoIndex(index)}
            onDelete={onDeletePhoto}
            isDeleting={isDeletingId === photo.id}
            canDelete={canDelete}
            isSelected={selectedIds.has(photo.id)}
            onToggleSelect={handleToggleSelect}
            selectable={true}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Mostrando página <span className="font-semibold text-slate-700">{currentPage}</span> de{' '}
            <span className="font-semibold text-slate-700">{totalPages}</span> ({totalPhotos} fotos)
          </p>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Anterior
            </Button>

            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((page, idx, arr) => {
                  const prev = arr[idx - 1];
                  const hasGap = prev && page - prev > 1;

                  return (
                    <React.Fragment key={page}>
                      {hasGap && <span className="px-1 text-slate-400">...</span>}
                      <button
                        onClick={() => onPageChange(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                          currentPage === page
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {activePhoto && selectedPhotoIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Top Header bar */}
          <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
            <div className="text-white text-xs sm:text-sm">
              <span className="font-semibold">
                {selectedPhotoIndex + 1} de {photos.length}
              </span>
              {activePhoto.original_name && (
                <span className="text-slate-400 ml-2 hidden sm:inline">
                  &bull; {activePhoto.original_name} ({formatFileSize(activePhoto.size)})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={activePhoto.url}
                download={activePhoto.filename}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Download da foto"
              >
                <Download className="w-5 h-5" />
              </a>

              {canDelete && onDeletePhoto && (
                <button
                  type="button"
                  onClick={() => {
                    const idToDelete = activePhoto.id;
                    setSelectedPhotoIndex(null);
                    onDeletePhoto(idToDelete);
                  }}
                  className="p-2 rounded-full bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                  title="Excluir foto"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedPhotoIndex(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors ml-2"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Previous Button */}
          {selectedPhotoIndex > 0 && (
            <button
              onClick={() => setSelectedPhotoIndex(selectedPhotoIndex - 1)}
              className="absolute left-4 sm:left-6 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors z-10"
              title="Foto anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Photo Center Container */}
          <div className="max-w-5xl max-h-[85vh] flex items-center justify-center">
            <img
              src={activePhoto.url}
              alt={activePhoto.filename}
              className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>

          {/* Next Button */}
          {selectedPhotoIndex < photos.length - 1 && (
            <button
              onClick={() => setSelectedPhotoIndex(selectedPhotoIndex + 1)}
              className="absolute right-4 sm:right-6 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors z-10"
              title="Próxima foto"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
