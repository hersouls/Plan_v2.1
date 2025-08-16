import React from 'react';
import { cn } from '../../../lib/utils';
import { responsiveGrid, responsiveSpacing } from '../../../lib/responsive';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  type: 'stats' | 'cards' | 'buttons';
  spacing?: 'section' | 'element' | 'none';
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  customGrid?: Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl', string>>;
  as?: keyof JSX.IntrinsicElements;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  type,
  spacing = 'none',
  gap = 'md',
  customGrid,
  as: Component = 'div',
}) => {
  const gridClasses = responsiveGrid(type, customGrid);
  const spacingClasses = spacing !== 'none' ? responsiveSpacing(spacing) : '';
  
  const gapClasses = {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
    '2xl': 'gap-10',
  };

  return (
    <Component
      className={cn(
        gridClasses,
        gapClasses[gap],
        spacingClasses,
        className
      )}
    >
      {children}
    </Component>
  );
};
