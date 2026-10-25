import React, { useRef, useState, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface PhotoDropzoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  disabled?: boolean;
  currentCount?: number;
  maxFiles?: number;
}

export const PhotoDropzone: React.FC<PhotoDropzoneProps> = ({
  onFilesSelected,
  disabled = false,
  currentCount = 0,
  maxFiles = 50,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFilesSelected(e.dataTransfer.files);
      }
    },
    [disabled, onFilesSelected]
  );

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  const remaining = Math.max(0, maxFiles - currentCount);

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        id="photo-file-upload-input"
        name="photo_files"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
        className="hidden"
        onChange={handleFileInputChange}
        disabled={disabled}
      />

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative group cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300 p-8 sm:p-12
          flex flex-col items-center justify-center text-center
          ${
            isDragOver
              ? 'border-brand-500 bg-brand-50/70 scale-[1.01]'
              : 'border-slate-300 hover:border-brand-400 bg-white/70 hover:bg-slate-50/80 shadow-sm'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        `}
      >
        {/* Glow effect on hover */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-brand-100/70 text-brand-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300 shadow-md shadow-brand-500/10">
          <UploadCloud className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1.5 group-hover:text-brand-700 transition-colors">
          Toque ou arraste fotos aqui
        </h3>

        <p className="text-sm text-slate-500 max-w-sm mb-4 leading-relaxed">
          Selecione as melhores fotos tiradas durante o evento para enviar diretamente para o álbum.
        </p>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
          <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
          <span>JPEG, PNG, WEBP ou HEIC (até 25MB cada)</span>
        </div>

        {remaining <= 10 && remaining > 0 && (
          <div className="mt-3 text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Restam {remaining} vaga(s) nesta seleção (máximo {maxFiles})</span>
          </div>
        )}
      </div>
    </div>
  );
};
