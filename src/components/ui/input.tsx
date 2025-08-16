import * as React from 'react';
import { cn } from './utils';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'flex w-full ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 wave-optimized transition-all font-pretendard backdrop-blur-sm',
  {
    variants: {
      variant: {
        // Default input using component tokens - 반응형 최적화
        default: 'bg-glass-light border border-border/30 rounded-lg sm:rounded-xl focus:border-primary/50 px-4 sm:px-3 py-3 sm:py-2 text-base sm:text-sm duration-normal shadow-sm hover:shadow-md',
        
        // Quick add input for tasks - 모바일에서 더 큰 터치 타겟
        'quick-add': 'quick-add-input text-lg sm:text-base px-6 sm:px-4 py-4 sm:py-3 rounded-lg sm:rounded-xl border border-border/30 focus:border-primary/50 duration-normal bg-glass-light shadow-sm hover:shadow-md',
        
        // Family-friendly glass input - 반응형 패딩
        'family-friendly': 'family-glass-card border border-border/30 hover:border-primary/50 rounded-lg sm:rounded-xl px-4 sm:px-3 py-3 sm:py-2 duration-normal backdrop-blur-lg',
        
        // Solid background input - 반응형 최적화
        solid: 'bg-background border border-border rounded-lg sm:rounded-xl px-4 sm:px-3 py-3 sm:py-2 focus:border-primary/50 duration-normal shadow-sm hover:shadow-md',
      },
      inputSize: {
        // Sizes using design tokens - 모바일 우선 반응형
        sm: 'h-12 sm:h-10 px-3 sm:px-2 py-2 sm:py-1.5 text-sm min-h-[48px] sm:min-h-[40px]', // 모바일에서 더 큰 터치 타겟
        default: 'h-14 sm:h-12 px-4 sm:px-3 py-3 sm:py-2 text-base sm:text-sm min-h-[56px] sm:min-h-[48px]', // 모바일에서 더 큰 터치 타겟
        lg: 'h-16 sm:h-14 px-6 sm:px-4 py-4 sm:py-3 text-lg sm:text-base min-h-[64px] sm:min-h-[56px]', // 모바일에서 더 큰 터치 타겟
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
export default Input;