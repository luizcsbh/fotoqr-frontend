import React from 'react';
import { mergeClasses } from '../../utils/mergeClasses';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={mergeClasses(
        `bg-white rounded-2xl border border-slate-200/80 shadow-xs ${
          hoverable ? 'transition-all duration-300 hover:shadow-md hover:border-brand-200 hover:-translate-y-0.5' : ''
        } ${paddingStyles[padding]}`,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
