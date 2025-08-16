import { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { GlassCardProps } from '../../types/ui';

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      children,
      className,
      hover = false,
      variant = 'default',
      style,
      onClick,
      ariaLabel,
    },
    ref
  ) => {
    const variantStyles = {
      // Glass variants using design tokens - 반응형 패딩 적용
      light:
        'bg-glass-light backdrop-blur-lg border border-gray-200/30 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm',
      medium:
        'bg-glass-medium backdrop-blur-lg border border-gray-200/40 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-md',
      strong:
        'bg-glass-strong backdrop-blur-lg border border-gray-200/50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg',
      default:
        'bg-card border border-card-border rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-card',

      // Specialized variants - 반응형 최적화
      elevated:
        'bg-card border border-card-border rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 lg:p-8 shadow-xl',
      interactive:
        'bg-card border border-card-border rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-md hover:shadow-lg transition-all duration-normal',
      family:
        'family-glass-card rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6',
      task: 'task-card rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6',
      member: 'member-glass rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6',
    };

    const hoverStyles = {
      light:
        'hover:bg-glass-medium hover:shadow-md transition-all duration-normal',
      medium:
        'hover:bg-glass-strong hover:shadow-lg transition-all duration-normal',
      strong:
        'hover:bg-glass-strong/80 hover:shadow-xl transition-all duration-normal',
      default:
        'hover:bg-card-hover hover:shadow-md transition-all duration-normal',
      elevated: 'hover:shadow-2xl transition-all duration-normal',
      interactive:
        'hover:transform hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-normal',
      family: 'hover:bg-glass-medium transition-all duration-normal',
      task: 'hover:border-primary hover:shadow-lg transition-all duration-normal',
      member: 'hover:transform hover:scale-105 transition-all duration-normal',
    };

    const isClickable = onClick || variant === 'interactive';

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          variantStyles[variant],
          hover && hoverStyles[variant] && hoverStyles[variant],
          isClickable && 'cursor-pointer touch-comfortable',
          'wave-optimized touch-optimized',
          // 모바일 터치 최적화
          'active:scale-95 sm:active:scale-98',
          // 반응형 그림자 효과
          'shadow-sm sm:shadow-md md:shadow-lg',
          className
        )}
        style={style}
        onClick={onClick}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        aria-label={ariaLabel}
        onKeyDown={
          isClickable
            ? e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
      >
        {children}

        {/* Optional shine effect for interactive cards - 모바일에서 비활성화 */}
        {variant === 'interactive' && (
          <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 hidden sm:block">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shine" />
          </div>
        )}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
