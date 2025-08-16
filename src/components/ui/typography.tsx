import React from 'react';
import { cn } from '../../lib/utils';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
}

// Heading Components with Korean optimization - 반응형 텍스트 크기
export const H1 = ({
  children,
  className,
  as: Component = 'h1',
  ...props
}: TypographyProps) => (
  <Component
    className={cn(
      'text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-pretendard tracking-ko-tight break-keep-ko leading-tight text-gray-900',
      className
    )}
    {...props}
  >
    {children}
  </Component>
);

export const H2 = ({
  children,
  className,
  as: Component = 'h2',
  ...props
}: TypographyProps) => (
  <Component
    className={cn(
      'text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold font-pretendard tracking-ko-tight break-keep-ko leading-tight text-gray-900',
      className
    )}
    {...props}
  >
    {children}
  </Component>
);

export const H3 = ({
  children,
  className,
  as: Component = 'h3',
  ...props
}: TypographyProps) => (
  <Component
    className={cn(
      'text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold font-pretendard tracking-ko-normal break-keep-ko leading-tight text-gray-800',
      className
    )}
    {...props}
  >
    {children}
  </Component>
);

export const H4 = ({
  children,
  className,
  as: Component = 'h4',
  ...props
}: TypographyProps) => (
  <Component
    className={cn(
      'text-base sm:text-lg md:text-xl lg:text-2xl font-medium font-pretendard tracking-ko-normal break-keep-ko leading-tight text-gray-800',
      className
    )}
    {...props}
  >
    {children}
  </Component>
);

export const H5 = ({
  children,
  className,
  as: Component = 'h5',
  ...props
}: TypographyProps) => (
  <Component
    className={cn(
      'text-sm sm:text-base md:text-lg lg:text-xl font-medium font-pretendard tracking-ko-normal break-keep-ko leading-tight text-gray-700',
      className
    )}
    {...props}
  >
    {children}
  </Component>
);

export const H6 = ({
  children,
  className,
  as: Component = 'h6',
  ...props
}: TypographyProps) => (
  <Component
    className={cn(
      'text-xs sm:text-sm md:text-base lg:text-lg font-medium font-pretendard tracking-ko-normal break-keep-ko leading-tight text-gray-700',
      className
    )}
    {...props}
  >
    {children}
  </Component>
);

// Body Text Components with Korean optimization - 반응형 텍스트 크기
export const BodyLarge = ({
  children,
  className,
  as: Component = 'p',
  ...props
}: TypographyProps) => (
  <Component
    className={cn(
      'text-base sm:text-lg md:text-xl font-normal font-pretendard tracking-ko-normal break-keep-ko leading-relaxed text-gray-700',
      className
    )}
    {...props}
  >
    {children}
  </Component>
);

export const Body = ({
  children,
  className,
  as: Component = 'p',
  ...props
}: TypographyProps) => (
  <Component
    className={cn(
      'text-sm sm:text-base md:text-lg font-normal font-pretendard tracking-ko-normal break-keep-ko leading-relaxed text-gray-700',
      className
    )}
    {...props}
  >
    {children}
  </Component>
);

export const BodySmall = ({
  children,
  className,
  as: Component = 'p',
  ...props
}: TypographyProps) => (
  <Component
    className={cn(
      'text-xs sm:text-sm md:text-base font-normal font-pretendard tracking-ko-normal break-keep-ko leading-relaxed text-gray-600',
      className
    )}
    {...props}
  >
    {children}
  </Component>
);

// Caption & Label Components - 반응형 텍스트 크기
export const Caption = ({
  children,
  className,
  as: Component = 'span',
  ...props
}: TypographyProps) => (
  <Component
    className={cn(
      'text-xs sm:text-sm font-normal font-pretendard tracking-ko-wide break-keep-ko text-gray-500',
      className
    )}
    {...props}
  >
    {children}
  </Component>
);

export const Label = ({
  children,
  className,
  as: Component = 'label',
  ...props
}: TypographyProps) => (
  <Component
    className={cn(
      'text-xs sm:text-sm font-medium font-pretendard tracking-ko-normal break-keep-ko text-gray-700',
      className
    )}
    {...props}
  >
    {children}
  </Component>
);

// Special Text Components - 반응형 텍스트 크기
export const Display = ({
  children,
  className,
  as: Component = 'h1',
  ...props
}: TypographyProps) => (
  <Component
    className={cn(
      'text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-pretendard tracking-ko-tight break-keep-ko leading-tight text-gray-900',
      className
    )}
    {...props}
  >
    {children}
  </Component>
);

export const Code = ({
  children,
  className,
  as: Component = 'code',
  ...props
}: TypographyProps) => (
  <Component
    className={cn(
      'text-xs sm:text-sm font-mono text-gray-600 break-keep-ko bg-gray-100/50 px-2 py-1 rounded-md',
      className
    )}
    {...props}
  >
    {children}
  </Component>
);

export const Quote = ({
  children,
  className,
  as: Component = 'blockquote',
  ...props
}: TypographyProps) => (
  <Component
    className={cn(
      'text-sm sm:text-base md:text-lg font-normal font-pretendard tracking-ko-normal break-keep-ko leading-relaxed italic text-gray-600 border-l-4 border-primary/30 pl-4',
      className
    )}
    {...props}
  >
    {children}
  </Component>
);

// Typography object for easy importing
export const Typography = {
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  BodyLarge,
  Body,
  BodySmall,
  Caption,
  Label,
  Display,
  Code,
  Quote,
};

export default Typography;
