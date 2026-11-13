import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: React.ReactNode;
  className?: string;
}

const variantConfig: Record<
  AlertVariant,
  {
    container: string;
    border: string;
    title: string;
    text: string;
    iconBg: string;
    iconColor: string;
    defaultIcon: React.ReactNode;
  }
> = {
  info: {
    container: 'bg-blue-50/80 border-blue-200',
    border: 'border-l-4 border-l-blue-500',
    title: 'text-blue-900',
    text: 'text-blue-800/90',
    iconBg: 'bg-blue-100 text-blue-600',
    iconColor: 'text-blue-600',
    defaultIcon: <Info className="w-5 h-5" />,
  },
  success: {
    container: 'bg-emerald-50/80 border-emerald-200',
    border: 'border-l-4 border-l-emerald-500',
    title: 'text-emerald-900',
    text: 'text-emerald-800/90',
    iconBg: 'bg-emerald-100 text-emerald-600',
    iconColor: 'text-emerald-600',
    defaultIcon: <CheckCircle2 className="w-5 h-5" />,
  },
  warning: {
    container: 'bg-amber-50/80 border-amber-200',
    border: 'border-l-4 border-l-amber-500',
    title: 'text-amber-900',
    text: 'text-amber-800/90',
    iconBg: 'bg-amber-100 text-amber-600',
    iconColor: 'text-amber-600',
    defaultIcon: <AlertTriangle className="w-5 h-5" />,
  },
  danger: {
    container: 'bg-rose-50/80 border-rose-200',
    border: 'border-l-4 border-l-rose-500',
    title: 'text-rose-900',
    text: 'text-rose-800/90',
    iconBg: 'bg-rose-100 text-rose-600',
    iconColor: 'text-rose-600',
    defaultIcon: <AlertCircle className="w-5 h-5" />,
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  dismissible = false,
  onDismiss,
  action,
  className = '',
}) => {
  const cfg = variantConfig[variant];

  return (
    <div
      role="alert"
      className={`
        relative flex items-start gap-3.5 p-4 rounded-2xl border ${cfg.container} ${cfg.border}
        transition-all duration-200 ${className}
      `}
    >
      <div className={`shrink-0 p-1.5 rounded-xl ${cfg.iconBg}`}>
        {icon || cfg.defaultIcon}
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        {title && (
          <h4 className={`text-sm font-bold tracking-tight mb-1 ${cfg.title}`}>
            {title}
          </h4>
        )}
        {children && (
          <div className={`text-xs sm:text-sm leading-relaxed ${cfg.text}`}>
            {children}
          </div>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          className={`
            shrink-0 -mr-1 -mt-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-600
            hover:bg-black/5 transition-colors focus:outline-none
          `}
          aria-label="Fechar alerta"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

