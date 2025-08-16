import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 sm:px-2.5 sm:py-0.5 text-xs sm:text-xs font-semibold transition-all duration-normal focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 wave-optimized touch-optimized backdrop-blur-sm',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-glass-primary text-primary-foreground hover:bg-glass-primary/80 shadow-sm hover:shadow-md',
        secondary:
          'border-transparent bg-glass-secondary text-secondary-foreground hover:bg-glass-secondary/80 shadow-sm hover:shadow-md',
        destructive:
          'border-transparent bg-glass-destructive text-destructive-foreground hover:bg-glass-destructive/80 shadow-sm hover:shadow-md',
        outline: 'text-foreground bg-glass-light border-gray-200/30 hover:bg-glass-medium',
        success: 'border-transparent bg-glass-success text-success-foreground hover:bg-glass-success/80 shadow-sm hover:shadow-md',
        warning: 'border-transparent bg-glass-warning text-warning-foreground hover:bg-glass-warning/80 shadow-sm hover:shadow-md',
        info: 'border-transparent bg-glass-info text-info-foreground hover:bg-glass-info/80 shadow-sm hover:shadow-md',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
export default Badge;