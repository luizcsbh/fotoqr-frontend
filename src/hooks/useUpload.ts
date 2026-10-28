import { useState, useCallback, useEffect, useRef } from 'react';
import { UploadProgressItem } from '../types';
import { photoService } from '../services/photo.service';
import toast from 'react-hot-toast';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB, same as the backend MAX_FILE_SIZE_MB
const MAX_FILES_PER_BATCH = 50;

export const useUpload = (eventUuid: string, onAllComplete?: () => void) => {
  const [items, setItems] = useState<UploadProgressItem[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Clean up object URLs on unmount only. Depending on `items` here would revoke every
  // preview on each state change (new files, upload progress), breaking the thumbnails.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  const validateFile = (file: File): string | null => {
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    const isMimeValid = ALLOWED_MIME_TYPES.includes(file.type);
    const isExtValid = ALLOWED_EXTENSIONS.includes(ext);

    if (!isMimeValid && !isExtValid) {
      return `Tipo de arquivo não suportado (${file.name}). Apenas fotos JPEG, PNG, WEBP ou HEIC.`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `O arquivo "${file.name}" excede o tamanho máximo de 10MB.`;
    }

    return null;
  };

  const addFiles = useCallback(
    (filesToAdd: FileList | File[]) => {
      const fileList = Array.from(filesToAdd);
      if (items.length + fileList.length > MAX_FILES_PER_BATCH) {
        toast.error(`Você pode enviar no máximo ${MAX_FILES_PER_BATCH} fotos por vez.`);
        return;
      }

      const newItems: UploadProgressItem[] = [];

      for (const file of fileList) {
        const errorMsg = validateFile(file);
        if (errorMsg) {
          toast.error(errorMsg);
          continue;
        }

        const previewUrl = URL.createObjectURL(file);
        newItems.push({
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          previewUrl,
          progress: 0,
          status: 'idle',
        });
      }

      if (newItems.length > 0) {
        setItems((prev) => [...prev, ...newItems]);
        toast.success(`${newItems.length} foto(s) adicionada(s)!`);
      }
    },
    [items.length]
  );

  const removeFile = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const clearFiles = useCallback(() => {
    items.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setItems([]);
  }, [items]);

  const uploadSingle = async (item: UploadProgressItem): Promise<boolean> => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, status: 'uploading', progress: 5, error: undefined } : i
      )
    );

    try {
      await photoService.uploadSinglePhoto(eventUuid, item.file, (percent) => {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, progress: Math.min(percent, 98) } : i))
        );
      });

      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'success', progress: 100 } : i))
      );
      return true;
    } catch (err: unknown) {
      const error = err as { message?: string };
      const message = error.message || 'Falha no envio';
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'error', error: message } : i))
      );
      return false;
    }
  };

  const uploadAll = useCallback(async () => {
    if (items.length === 0 || isUploading) return;

    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    // Filter items not already uploaded
    const pendingItems = items.filter((item) => item.status !== 'success');

    // Concurrently upload with concurrency limit (e.g., 3 at a time)
    const concurrency = 3;
    const pool = [...pendingItems];

    const worker = async () => {
      while (pool.length > 0) {
        const item = pool.shift();
        if (!item) break;
        const ok = await uploadSingle(item);
        if (ok) {
          successCount++;
        } else {
          failCount++;
        }
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, pendingItems.length) }, () =>
      worker()
    );
    await Promise.all(workers);

    setIsUploading(false);

    if (failCount === 0 && successCount > 0) {
      toast.success('Todas as fotos foram enviadas com sucesso!');
      onAllComplete?.();
    } else if (failCount > 0) {
      toast.error(`${failCount} foto(s) falharam no envio. Você pode tentar novamente.`);
    }
  }, [items, isUploading, eventUuid, onAllComplete]);

  const retryFailed = useCallback(async () => {
    const failedItems = items.filter((i) => i.status === 'error');
    if (failedItems.length === 0) return;

    setIsUploading(true);
    for (const item of failedItems) {
      await uploadSingle(item);
    }
    setIsUploading(false);
  }, [items]);

  const totalFiles = items.length;
  const completedFiles = items.filter((i) => i.status === 'success').length;
  const failedFiles = items.filter((i) => i.status === 'error').length;
  const overallProgress =
    totalFiles > 0
      ? Math.round(items.reduce((sum, i) => sum + i.progress, 0) / totalFiles)
      : 0;

  return {
    items,
    isUploading,
    overallProgress,
    totalFiles,
    completedFiles,
    failedFiles,
    addFiles,
    removeFile,
    clearFiles,
    uploadAll,
    retryFailed,
  };
};
