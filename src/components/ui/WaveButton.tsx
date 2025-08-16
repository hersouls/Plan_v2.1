import { forwardRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { WaveButtonProps } from '../../types/ui';

export const WaveButton = forwardRef<HTMLButtonElement, WaveButtonProps>(
  (
    {
      children,
      onClick,
      variant = 'primary',
      size = 'md',
      className,
      'aria-label': ariaLabel,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = useState(false);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 600);
      onClick?.(event);
    };

    const variants = {
      primary: 'wave-button-primary',
      secondary: 'wave-button-secondary',
      ghost: 'wave-button-ghost',
      travel: 'wave-button-travel',
      default: 'wave-button-primary',
    };

    const sizes = {
      sm: 'wave-button-sm',
      md: 'wave-button-md',
      lg: 'wave-button-lg',
    };

    return (
      <button
        ref={ref}
        onClick={handleClick}
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(
          // Base styles
          'wave-button',
          'flex items-center justify-center', // 아이콘 중앙 정렬을 위한 기본 스타일

          // Variants and sizes
          variants[variant],
          sizes[size],

          // Disabled state
          disabled && 'opacity-50 cursor-not-allowed',

          // Custom className
          className
        )}
        {...props}
      >
        {/* Wave animation overlay */}
        <div className={cn('wave-button-wave', disabled && 'hidden')} />

        {/* Ripple effect on click */}
        {isPressed && <div className="wave-button-ripple" />}

        {/* Content */}
        <span className="wave-button-content">{children}</span>
      </button>
    );
  }
);

WaveButton.displayName = 'WaveButton';
