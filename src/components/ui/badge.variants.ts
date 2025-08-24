import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 sm:px-2.5 sm:py-0.5 text-xs sm:text-xs font-semibold transition-all duration-normal focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 wave-optimized touch-optimized backdrop-blur-sm',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-md',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-sm hover:shadow-md',
        destructive:
          'border-transparent bg-error text-error-foreground hover:bg-error-hover shadow-sm hover:shadow-md',
        outline:
          'text-foreground bg-glass-light border-gray-200/30 hover:bg-glass-medium',
        success:
          'border-transparent bg-success text-foreground hover:bg-success-hover shadow-sm hover:shadow-md',
        warning:
          'border-transparent bg-warning text-foreground hover:bg-warning-hover shadow-sm hover:shadow-md',
        info: 'border-transparent bg-info text-foreground hover:bg-info-hover shadow-sm hover:shadow-md',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type BadgeVariantProps = VariantProps<typeof badgeVariants>;
