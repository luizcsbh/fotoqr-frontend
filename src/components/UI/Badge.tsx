import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  dot = false,
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200/60',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200/60',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
    },
    danger: {
      bg: 'bg-red-50 border-red-200/60',
      text: 'text-red-700',
      dot: 'bg-red-500',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200/60',
      text: 'text-blue-700',
      dot: 'bg-blue-500',
    },
    neutral: {
      bg: 'bg-slate-100 border-slate-200',
      text: 'text-slate-700',
      dot: 'bg-slate-400',
    },
  };

  const style = variantStyles[variant];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border
        ${style.bg} ${style.text} ${className}
      `}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${style.dot}`} />}
      {children}
    </span>
  );
};
