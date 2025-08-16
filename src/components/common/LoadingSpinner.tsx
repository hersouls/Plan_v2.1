import React from 'react';
import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'white' | 'gray';
  fullScreen?: boolean;
  text?: string;
  variant?: 'default' | 'wave' | 'dots' | 'pulse';
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
};

const colorClasses = {
  primary: 'border-purple-600 border-t-transparent',
  white: 'border-white border-t-transparent',
  gray: 'border-gray-400 border-t-transparent',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  color = 'primary',
  fullScreen = false,
  text,
  variant = 'default',
}) => {
  const renderSpinner = () => {
    switch (variant) {
      case 'wave':
        return <LoadingDots className="scale-125" />;
      case 'dots':
        return <LoadingDots />;
      case 'pulse':
        return (
          <div
            className={cn(
              'animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-purple-600',
              sizeClasses[size].replace('border-2', '').replace('border-3', '').replace('border-4', ''),
              className
            )}
          />
        );
      default:
        return (
          <div
            className={cn(
              'animate-spin rounded-full',
              sizeClasses[size],
              colorClasses[color],
              className
            )}
            role="status"
            aria-label="Loading"
          >
            <span className="sr-only">Loading...</span>
          </div>
        );
    }
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      {renderSpinner()}
      {text && (
        <p className={cn(
          'text-sm font-medium',
          color === 'white' ? 'text-white' : ''
        )}
        style={color !== 'white' ? { color: 'var(--semantic-text-secondary)' } : {}}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export const LoadingOverlay: React.FC<LoadingSpinnerProps> = (props) => {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm dark:bg-black/50">
      <LoadingSpinner {...props} />
    </div>
  );
};

export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
        className
      )}
    />
  );
};

export const LoadingDots: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('flex space-x-1', className)}>
      <div className="h-2 w-2 animate-bounce rounded-full bg-purple-600 [animation-delay:-0.3s]" />
      <div className="h-2 w-2 animate-bounce rounded-full bg-purple-600 [animation-delay:-0.15s]" />
      <div className="h-2 w-2 animate-bounce rounded-full bg-purple-600" />
    </div>
  );
};

export const InlineLoading: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <LoadingSpinner size="sm" />
      <span className="text-sm">로딩중...</span>
    </div>
  );
};

export default LoadingSpinner;