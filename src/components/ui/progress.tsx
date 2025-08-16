import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from './utils';

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-5 sm:h-4 w-full overflow-hidden rounded-full bg-glass-light backdrop-blur-sm border border-gray-200/30 shadow-sm',
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-gradient-to-r from-primary to-primary/80 transition-all duration-normal shadow-sm"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
export default Progress;