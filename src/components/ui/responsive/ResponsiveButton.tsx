import React from 'react';
import {
  responsiveConditional,
  responsivePadding,
  responsiveTouchTarget,
} from '../../../lib/responsive';
import { cn } from '../../../lib/utils';
import { WaveButton } from '../WaveButton';
import { ButtonProps } from '../button';

interface ResponsiveButtonProps extends Omit<ButtonProps, 'className'> {
  children: React.ReactNode;
  className?: string;
  padding?: 'button' | 'card' | 'none';
  touchTarget?: 'button' | 'icon' | 'none';
  layout?: 'horizontal' | 'vertical' | 'auto';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  responsive?: boolean;
  iconSize?: 'sm' | 'md' | 'lg' | 'xl' | 'responsive';
}

export const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  children,
  className,
  padding = 'button',
  touchTarget = 'button',
  layout = 'auto',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  responsive = true,
  iconSize = 'responsive',
  ...props
}) => {
  const paddingClasses = padding !== 'none' ? responsivePadding(padding) : '';
  const touchTargetClasses =
    touchTarget !== 'none' ? responsiveTouchTarget(touchTarget) : '';

  const layoutClasses =
    layout === 'auto'
      ? responsiveConditional('flex-col', 'flex-row')
      : layout === 'vertical'
      ? 'flex-col'
      : 'flex-row';

  const fullWidthClasses = fullWidth ? 'w-full' : '';

  const iconClasses =
    iconPosition === 'right' ? 'flex-row-reverse' : 'flex-row';

  // 반응형 아이콘 크기 클래스
  const getIconSizeClasses = () => {
    switch (iconSize) {
      case 'sm':
        return 'w-2 h-2 sm:w-2.5 sm:h-2.5';
      case 'md':
        return 'w-2.5 h-2.5 sm:w-3 sm:h-3';
      case 'lg':
        return 'w-3 h-3 sm:w-4 sm:h-4';
      case 'xl':
        return 'w-4 h-4 sm:w-5 sm:h-5';
      case 'responsive':
      default:
        return 'w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5';
    }
  };

  const buttonContent = (
    <div
      className={cn(
        'flex items-center justify-center gap-2',
        layoutClasses,
        iconClasses,
        fullWidthClasses
      )}
    >
      {icon && iconPosition === 'left' && (
        <span className={cn('flex-shrink-0', getIconSizeClasses())}>
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
      {icon && iconPosition === 'right' && (
        <span className={cn('flex-shrink-0', getIconSizeClasses())}>
          {icon}
        </span>
      )}
    </div>
  );

  return (
    <WaveButton
      className={cn(
        responsive && paddingClasses,
        responsive && touchTargetClasses,
        fullWidthClasses,
        className
      )}
      {...props}
    >
      {buttonContent}
    </WaveButton>
  );
};
