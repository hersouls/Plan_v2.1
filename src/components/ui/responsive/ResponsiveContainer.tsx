import React from 'react';
import { cn } from '../../../lib/utils';
import { responsivePadding, responsiveSpacing } from '../../../lib/responsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'container' | 'card' | 'button' | 'none';
  spacing?: 'section' | 'element' | 'none';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  center?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  padding = 'container',
  spacing = 'none',
  maxWidth = 'xl',
  center = true,
  as: Component = 'div',
}) => {
  const paddingClasses = padding !== 'none' ? responsivePadding(padding) : '';
  const spacingClasses = spacing !== 'none' ? responsiveSpacing(spacing) : '';
  
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    full: 'max-w-full',
  };

  return (
    <Component
      className={cn(
        paddingClasses,
        spacingClasses,
        maxWidthClasses[maxWidth],
        center && 'mx-auto',
        className
      )}
    >
      {children}
    </Component>
  );
};
