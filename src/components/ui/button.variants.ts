import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium font-pretendard transition-all focus-visible-ring disabled:opacity-50 disabled:pointer-events-none ring-offset-background wave-optimized touch-optimized touch-comfortable',
  {
    variants: {
      variant: {
        // Primary button using component tokens - 반응형 최적화
        default:
          'bg-primary text-primary-foreground hover:bg-primary-hover rounded-lg shadow-sm hover:shadow-md transition-all duration-normal active:scale-95 sm:active:scale-98',
        primary:
          'bg-primary text-primary-foreground hover:bg-primary-hover rounded-lg shadow-sm hover:shadow-md transition-all duration-normal active:scale-95 sm:active:scale-98',

        // Secondary button using component tokens
        secondary:
          'bg-background border border-border text-foreground hover:bg-muted rounded-lg shadow-sm hover:shadow-md transition-all duration-normal active:scale-95 sm:active:scale-98',

        // Task management specific using design tokens
        'task-complete':
          'bg-success text-success-foreground hover:bg-success-hover rounded-lg shadow-sm hover:shadow-md transition-all duration-normal active:scale-95 sm:active:scale-98',
        'task-pending':
          'bg-warning text-warning-foreground hover:bg-warning-hover rounded-lg shadow-sm hover:shadow-md transition-all duration-normal active:scale-95 sm:active:scale-98',
        'task-progress':
          'bg-info text-info-foreground hover:bg-info-hover rounded-lg shadow-sm hover:shadow-md transition-all duration-normal active:scale-95 sm:active:scale-98',

        // Category variants using design tokens
        'category-home':
          'bg-category-home text-white hover:opacity-90 rounded-lg shadow-sm hover:shadow-md transition-all duration-normal active:scale-95 sm:active:scale-98',
        'category-work':
          'bg-category-work text-white hover:opacity-90 rounded-lg shadow-sm hover:shadow-md transition-all duration-normal active:scale-95 sm:active:scale-98',
        'category-personal':
          'bg-category-personal text-white hover:opacity-90 rounded-lg shadow-sm hover:shadow-md transition-all duration-normal active:scale-95 sm:active:scale-98',
        'category-shopping':
          'bg-category-shopping text-white hover:opacity-90 rounded-lg shadow-sm hover:shadow-md transition-all duration-normal active:scale-95 sm:active:scale-98',

        // System variants
        destructive:
          'bg-error text-error-foreground hover:bg-error/90 rounded-lg shadow-sm hover:shadow-md transition-all duration-normal active:scale-95 sm:active:scale-98',
        outline:
          'bg-transparent border border-border text-foreground hover:bg-muted rounded-lg shadow-sm hover:shadow-md transition-all duration-normal active:scale-95 sm:active:scale-98',
        ghost:
          'hover:bg-muted hover:text-foreground rounded-lg transition-all duration-fast active:scale-95 sm:active:scale-98',
        link: 'underline-offset-4 hover:underline text-primary transition-all duration-fast',

        // Glass morphism variants
        glass:
          'family-glass-card text-foreground hover:bg-glass-medium rounded-lg sm:rounded-xl transition-all duration-normal active:scale-95 sm:active:scale-98',
        'glass-strong':
          'bg-glass-strong backdrop-blur-lg text-foreground hover:bg-glass-strong/80 rounded-lg sm:rounded-xl transition-all duration-normal active:scale-95 sm:active:scale-98',
      },
      size: {
        // Touch targets using design tokens - 모바일 우선 반응형
        sm: 'h-10 sm:h-9 px-3 sm:px-2 text-sm min-w-[44px] sm:min-w-[40px]', // 모바일에서 더 큰 터치 타겟
        default:
          'h-12 sm:h-10 px-4 sm:px-3 text-base sm:text-sm min-w-[48px] sm:min-w-[44px]', // 모바일에서 더 큰 터치 타겟
        lg: 'h-14 sm:h-12 px-6 sm:px-4 text-lg sm:text-base min-w-[56px] sm:min-w-[48px]', // 모바일에서 더 큰 터치 타겟
        xl: 'h-16 sm:h-14 px-8 sm:px-6 text-xl sm:text-lg min-w-[64px] sm:min-w-[56px]', // 모바일에서 더 큰 터치 타겟

        // Icon buttons using design tokens - 반응형 크기
        icon: 'h-12 w-12 sm:h-10 sm:w-10', // 모바일에서 더 큰 터치 타겟
        'icon-sm': 'h-10 w-10 sm:h-9 sm:w-9', // 모바일에서 더 큰 터치 타겟
        'icon-lg': 'h-14 w-14 sm:h-12 sm:w-12', // 모바일에서 더 큰 터치 타겟
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
