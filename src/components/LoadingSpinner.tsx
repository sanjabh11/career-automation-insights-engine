
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-3', className)} role="status" aria-live="polite">
      <div className="relative">
        <Loader2 className={cn('animate-spin text-indigo-500', sizeClasses[size])} />
        <div className="absolute inset-0 blur-lg opacity-50">
          <Loader2 className={cn('animate-spin text-indigo-400', sizeClasses[size])} />
        </div>
      </div>
      {text && (
        <p className="text-sm text-slate-400 animate-pulse">{text}</p>
      )}
      <span className="sr-only">Loading</span>
    </div>
  );
};
