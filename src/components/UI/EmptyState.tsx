import React from 'react';
import { Button, ButtonProps } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionVariant?: ButtonProps['variant'];
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionVariant = 'primary',
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 ${className}`}
    >
      {icon && (
        <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-inner">
          {icon}
        </div>
      )}
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button variant={actionVariant} onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
