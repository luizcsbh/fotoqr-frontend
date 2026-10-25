import React from 'react';
import { CheckCircle2, AlertCircle, Loader2, RotateCw } from 'lucide-react';
import { UploadProgressItem } from '../../types';
import { ProgressBar } from '../UI/ProgressBar';
import { Button } from '../UI/Button';
import { formatFileSize } from './PhotoPreview';

interface UploadProgressProps {
  items: UploadProgressItem[];
  overallProgress: number;
  isUploading: boolean;
  failedCount: number;
  completedCount: number;
  onRetryFailed: () => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  items,
  overallProgress,
  isUploading,
  failedCount,
  completedCount,
  onRetryFailed,
}) => {
  if (items.length === 0) return null;

  return (
    <div className="w-full bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
      {/* Overall Progress Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-base font-bold text-slate-900">
              {isUploading
                ? 'Enviando fotos...'
                : completedCount === items.length
                ? 'Envio concluído com sucesso!'
                : failedCount > 0
                ? 'Algumas fotos não puderam ser enviadas'
                : 'Pronto para enviar'}
            </h4>
            <p className="text-xs text-slate-500">
              {completedCount} de {items.length} fotos concluídas
              {failedCount > 0 && ` (${failedCount} falha${failedCount > 1 ? 's' : ''})`}
            </p>
          </div>

          {failedCount > 0 && !isUploading && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetryFailed}
              leftIcon={<RotateCw className="w-3.5 h-3.5" />}
            >
              Reenviar falhas
            </Button>
          )}
        </div>

        <ProgressBar
          progress={overallProgress}
          color={failedCount > 0 && completedCount === 0 ? 'red' : 'brand'}
          size="md"
        />
      </div>

      {/* Per-item list */}
      <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.id} className="pt-2 flex items-center gap-3">
            {/* Thumbnail */}
            <img
              src={item.previewUrl}
              alt={item.file.name}
              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
            />

            {/* Info and individual bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-800 truncate pr-2">
                  {item.file.name}
                </span>
                <span className="text-slate-400 shrink-0">
                  {formatFileSize(item.file.size)}
                </span>
              </div>

              {item.status === 'uploading' && (
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-brand-500 h-full rounded-full transition-all duration-200"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}

              {item.status === 'error' && (
                <p className="text-[11px] text-red-600 truncate font-medium">
                  {item.error || 'Erro no envio'}
                </p>
              )}
            </div>

            {/* Status Icon */}
            <div className="shrink-0 flex items-center justify-center w-6 h-6">
              {item.status === 'uploading' && (
                <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
              )}
              {item.status === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
              {item.status === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              {item.status === 'idle' && (
                <span className="w-2 h-2 rounded-full bg-slate-300" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
