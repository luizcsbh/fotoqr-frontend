import React from 'react';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'brand' | 'blue' | 'red' | 'amber';
  animated?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  size = 'md',
  color = 'brand',
  animated = true,
  className = '',
}) => {
  const clampedProgress = Math.min(Math.max(Math.round(progress), 0), 100);

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colorStyles = {
    brand: 'bg-gradient-to-r from-brand-500 to-emerald-400',
    blue: 'bg-gradient-to-r from-blue-500 to-cyan-400',
    red: 'bg-gradient-to-r from-red-500 to-rose-400',
    amber: 'bg-gradient-to-r from-amber-500 to-yellow-400',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-xs font-medium text-slate-600 mb-1.5">
          {label && <span>{label}</span>}
          {showPercentage && <span className="font-semibold text-slate-700 ml-auto">{clampedProgress}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heightStyles[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${colorStyles[color]} ${
            animated && clampedProgress > 0 && clampedProgress < 100 ? 'animate-pulse' : ''
          }`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
