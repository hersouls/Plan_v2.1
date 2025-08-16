import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from './utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-4 sm:p-3 bg-glass-light backdrop-blur-sm border border-gray-200/30 rounded-lg sm:rounded-xl shadow-sm', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium text-gray-700',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          'h-8 w-8 sm:h-7 sm:w-7 bg-glass-light backdrop-blur-sm border border-gray-200/30 rounded-md p-0 opacity-50 hover:opacity-100 hover:bg-glass-medium transition-all duration-normal'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell:
          'text-gray-600 rounded-md w-10 h-10 sm:w-9 sm:h-9 font-normal text-[0.8rem] flex items-center justify-center',
        row: 'flex w-full mt-2',
        cell: 'h-10 w-10 sm:h-9 sm:w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          'h-10 w-10 sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-glass-medium transition-all duration-normal'
        ),
        day_range_end: 'day-range-end',
        day_selected:
          'bg-glass-primary text-primary-foreground hover:bg-glass-primary/80 focus:bg-glass-primary focus:text-primary-foreground shadow-sm',
        day_today: 'bg-glass-accent text-accent-foreground border-2 border-primary',
        day_outside:
          'day-outside text-gray-400 opacity-50 aria-selected:bg-accent/50 aria-selected:text-gray-400 aria-selected:opacity-30',
        day_disabled: 'text-gray-300 opacity-50',
        day_range_middle:
          'aria-selected:bg-glass-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: (props) => {
          if (props.orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />;
          }
          return <ChevronRight className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
export default Calendar;