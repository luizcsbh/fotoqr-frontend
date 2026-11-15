import React from 'react';
import { Loader2 } from 'lucide-react';
import { mergeClasses } from '../../utils/mergeClasses';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex max-w-full items-center justify-center text-center leading-tight font-medium rounded-xl transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-offset-2 active:scale-[0.98] select-none';

  // Standard control heights shared with form fields (inputs/selects are h-11 = 44px):
  // md and lg are both 44px so a submit button always lines up with the fields next to it;
  // lg only stands out by its larger text and padding. sm (36px) is for compact toolbars.
  // min-h keeps the standard height while still letting long labels wrap on small screens.
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'min-h-9 px-3 py-1 text-xs gap-1.5',
    md: 'min-h-11 px-4 py-1.5 text-sm gap-2 shadow-xs',
    lg: 'min-h-11 px-6 py-1.5 text-base gap-2.5 shadow-md',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/20 focus:ring-brand-500 border border-transparent',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-400 border border-slate-200',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 focus:ring-emerald-500 border border-transparent',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-red-600/25 focus:ring-red-500 border border-transparent',
    outline:
      'border-2 border-brand-600 text-brand-600 hover:bg-brand-50 focus:ring-brand-500 bg-transparent',
    ghost:
      'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-400 bg-transparent',
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={mergeClasses(
        `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
          isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
        }`,
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span className="min-w-0">{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          <span className="min-w-0">{children}</span>
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
