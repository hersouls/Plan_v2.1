import React from 'react';
import { cn } from '../../../lib/utils';
import { responsiveText } from '../../../lib/responsive';

interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  type: 'title' | 'subtitle' | 'body' | 'caption';
  customSizes?: Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl', string>>;
  as?: keyof JSX.IntrinsicElements;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  truncate?: boolean;
  lineClamp?: 1 | 2 | 3 | 4 | 5;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  className,
  type,
  customSizes,
  as: Component = 'div',
  weight = 'normal',
  color,
  align = 'left',
  truncate = false,
  lineClamp,
}) => {
  const textClasses = responsiveText(type, customSizes);
  
  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  };

  const lineClampClasses = {
    1: 'line-clamp-1',
    2: 'line-clamp-2',
    3: 'line-clamp-3',
    4: 'line-clamp-4',
    5: 'line-clamp-5',
  };

  return (
    <Component
      className={cn(
        textClasses,
        weightClasses[weight],
        alignClasses[align],
        color,
        truncate && 'truncate',
        lineClamp && lineClampClasses[lineClamp],
        'font-pretendard',
        className
      )}
    >
      {children}
    </Component>
  );
};
