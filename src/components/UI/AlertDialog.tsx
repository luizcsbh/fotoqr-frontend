import React, { useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';
import { Button } from './Button';

export type AlertDialogVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  variant?: AlertDialogVariant;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const variantStyles: Record<
  AlertDialogVariant,
  {
    iconBg: string;
    iconColor: string;
    confirmButtonVariant: 'primary' | 'danger' | 'success' | 'secondary';
    icon: React.ReactNode;
  }
> = {
  info: {
    iconBg: 'bg-blue-100/80',
    iconColor: 'text-blue-600',
    confirmButtonVariant: 'primary',
    icon: <Info className="w-6 h-6 text-blue-600" />,
  },
  success: {
    iconBg: 'bg-emerald-100/80',
    iconColor: 'text-emerald-600',
    confirmButtonVariant: 'success',
    icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
  },
  warning: {
    iconBg: 'bg-amber-100/80',
    iconColor: 'text-amber-600',
    confirmButtonVariant: 'primary',
    icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
  },
  danger: {
    iconBg: 'bg-rose-100/80',
    iconColor: 'text-rose-600',
    confirmButtonVariant: 'danger',
    icon: <AlertCircle className="w-6 h-6 text-rose-600" />,
  },
};

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  title,
  message,
  variant = 'warning',
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onCancel) {
          onCancel();
        } else {
          onConfirm();
        }
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  const cfg = variantStyles[variant];
  const defaultConfirmText = cancelText ? 'Confirmar' : 'Entendi';
  const resolvedConfirmText = confirmText || defaultConfirmText;

  const handleClose = () => {
    if (onCancel) {
      onCancel();
    } else {
      onConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className="
          relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100
          overflow-hidden z-10 transform transition-all animate-in fade-in zoom-in-95 duration-200
        "
      >
        <div className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            {/* Icon Avatar */}
            <div
              className={`
                w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs
                ${cfg.iconBg}
              `}
            >
              {cfg.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                {title}
              </h3>
              <div className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {message}
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            {cancelText && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onCancel}
                disabled={isLoading}
              >
                {cancelText}
              </Button>
            )}

            <Button
              type="button"
              variant={cfg.confirmButtonVariant}
              size="md"
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {resolvedConfirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

