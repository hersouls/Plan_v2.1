import React from 'react';
import { FilterUtils } from '../../../lib/design-tokens';
import { responsiveConditional } from '../../../lib/responsive';
import { cn } from '../../../lib/utils';
import { ResponsiveButton } from './ResponsiveButton';

interface FilterOption {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

interface ResponsiveFilterButtonsProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  layout?: 'horizontal' | 'vertical' | 'auto';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'ghost' | 'secondary';
  filterType?: 'time' | 'visibility' | 'priority' | 'status' | 'dateRange';
}

export const ResponsiveFilterButtons: React.FC<
  ResponsiveFilterButtonsProps
> = ({
  options,
  value,
  onChange,
  className,
  layout = 'auto',
  size = 'md',
  variant = 'ghost',
  filterType,
}) => {
  const layoutClasses =
    layout === 'auto'
      ? responsiveConditional('flex-col', 'flex-row')
      : layout === 'vertical'
      ? 'flex-col'
      : 'flex-row';

  const sizeClasses = {
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg',
  };

  const paddingClasses = {
    sm: 'px-1 py-0.5',
    md: 'px-2 py-1.5',
    lg: 'px-4 py-2.5',
  };

  return (
    <div
      className={cn(
        'flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 xl:gap-4 items-center',
        layoutClasses,
        className
      )}
    >
      {options.map(option => {
        // 디자인 토큰에서 aria-label 가져오기
        const ariaLabel = filterType
          ? FilterUtils.getFilterAriaLabel(
              filterType,
              option.key,
              value === option.key
            )
          : `${option.label} 보기 ${value === option.key ? '(선택됨)' : ''}`;

        return (
          <ResponsiveButton
            key={option.key}
            variant={value === option.key ? 'primary' : variant}
            onClick={() => onChange(option.key)}
            icon={option.icon}
            iconSize="responsive"
            className={cn(
              'font-pretendard',
              sizeClasses[size],
              paddingClasses[size],
              // 반응형 최소 너비: 모바일은 더 작게, 데스크톱은 크게
              'min-w-[28px] sm:min-w-[32px] md:min-w-[36px] lg:min-w-[48px] xl:min-w-[52px]',
              'min-h-[24px] sm:min-h-[28px] md:min-h-[32px] lg:min-h-[40px] xl:min-h-[44px]',
              'truncate overflow-hidden',
              'transition-all duration-200',
              value === option.key
                ? 'ring-1 ring-primary-400/30 shadow-md scale-105'
                : 'hover:bg-white/10 hover:shadow-md hover:scale-105'
            )}
            aria-label={ariaLabel}
            aria-pressed={value === option.key}
          >
            {/* 반응형 텍스트: SM 크기부터 숨김 */}
            <span
              className={cn(
                'font-medium',
                'hidden lg:inline', // lg 크기부터만 텍스트 표시
                'text-xs lg:text-sm xl:text-base'
              )}
            >
              {option.label}
            </span>

            {/* 모바일용 첫 글자 표시 (아이콘이 없는 경우) */}
            {!option.icon && (
              <span
                className={cn(
                  'font-medium',
                  'lg:hidden', // lg 크기부터는 숨김
                  'text-xs sm:text-sm'
                )}
              >
                {option.label.charAt(0).toUpperCase()}
              </span>
            )}

            {/* 모바일용 툴팁 역할의 aria-label */}
            <span className="sr-only">{option.label}</span>
          </ResponsiveButton>
        );
      })}
    </div>
  );
};
