import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as React from 'react';
import { cn } from './utils';

interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size = 'md', loading = false, ...props }, ref) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10 sm:h-12 sm:w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  };

  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full bg-glass-light backdrop-blur-sm border border-gray-200/30 shadow-sm hover:shadow-md transition-all duration-normal wave-optimized touch-optimized',
        sizeClasses[size],
        loading && 'animate-pulse',
        className
      )}
      {...props}
    />
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-glass-medium backdrop-blur-sm text-sm font-medium text-gray-700',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// Note: helper moved to utils to avoid Fast Refresh warnings

// 아바타 컴포넌트 래퍼
interface AvatarWrapperProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  className?: string;
}

const AvatarWrapper: React.FC<AvatarWrapperProps> = ({
  src,
  alt,
  fallback,
  size = 'md',
  loading = false,
  className,
}) => {
  return (
    <Avatar size={size} loading={loading} className={className}>
      {src && !loading && <AvatarImage src={src} alt={alt || 'Avatar'} />}
      <AvatarFallback>{fallback || 'U'}</AvatarFallback>
    </Avatar>
  );
};

export { Avatar, AvatarFallback, AvatarImage, AvatarWrapper };
export default Avatar;
