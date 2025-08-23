import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '../../lib/utils';
import { Task } from '../../types/task';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';

interface CalendarProps {
  tasks: Task[];
  onDateSelect?: (date: Date) => void;
  onAddTask?: () => void;
}

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

export const Calendar: React.FC<CalendarProps> = ({
  tasks,
  onDateSelect,
  onAddTask,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 현재 월의 모든 날짜 계산
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // 특정 날짜의 할일 필터링
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      try {
        return isSameDay(task.dueDate.toDate(), date);
      } catch {
        return false;
      }
    });
  };

  // 이전/다음 월 이동
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // 날짜 선택 핸들러
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  return (
    <div className="w-full">
      {/* 캘린더 헤더 */}
      <GlassCard variant="light" className="p-4 sm:p-6 mb-4">
        <div className="flex items-center justify-between">
          {/* 월 표시 */}
          <Typography.H3 className="text-white font-pretendard font-semibold">
            {format(currentDate, 'yyyy년 M월', { locale: ko })}
          </Typography.H3>

          {/* 네비게이션 컨트롤 */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* 이전/다음 버튼 */}
            <div className="flex items-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
              <WaveButton
                variant="ghost"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-4 w-4" />
              </WaveButton>
              <WaveButton
                variant="ghost"
                size="sm"
                onClick={goToToday}
                className="hidden sm:block px-3 py-1 text-sm font-medium text-white hover:bg-white/20"
              >
                오늘
              </WaveButton>
              <WaveButton
                variant="ghost"
                size="sm"
                onClick={goToNextMonth}
                className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-4 w-4" />
              </WaveButton>
            </div>

            {/* 할일 추가 버튼 */}
            <WaveButton
              onClick={onAddTask}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center gap-1 whitespace-nowrap"
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">할일 추가</span>
            </WaveButton>
          </div>
        </div>
      </GlassCard>

      {/* 캘린더 그리드 */}
      <GlassCard variant="light" className="p-4 sm:p-6">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={cn(
                'flex justify-center py-2 text-sm font-medium',
                index === 0 ? 'text-red-400' : 'text-white/80'
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, dayIdx) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const dayTasks = getTasksForDate(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                className={cn(
                  'relative min-h-[60px] sm:min-h-[80px] p-2 text-left transition-all duration-200',
                  'hover:bg-white/10 rounded-lg',
                  !isCurrentMonth && 'opacity-40',
                  isTodayDate && 'ring-2 ring-blue-400',
                  isSelected && 'bg-blue-500/20 ring-2 ring-blue-400'
                )}
              >
                {/* 날짜 번호 */}
                <div
                  className={cn(
                    'text-sm font-medium mb-1',
                    isTodayDate && 'text-blue-400 font-bold',
                    isSelected && 'text-blue-300',
                    isCurrentMonth ? 'text-white' : 'text-white/50'
                  )}
                >
                  {format(day, 'd')}
                </div>

                {/* 할일 표시 */}
                {dayTasks.length > 0 && (
                  <div className="space-y-1">
                    {dayTasks.slice(0, 2).map((task, taskIndex) => (
                      <div
                        key={`${task.id}-${task.groupId || 'personal'}-${dayIdx}-${taskIndex}`}
                        className={cn(
                          'text-xs px-1 py-0.5 rounded truncate',
                          task.status === 'completed'
                            ? 'bg-green-500/20 text-green-300 line-through'
                            : task.priority === 'high'
                            ? 'bg-red-500/20 text-red-300'
                            : task.priority === 'medium'
                            ? 'bg-orange-500/20 text-orange-300'
                            : 'bg-blue-500/20 text-blue-300'
                        )}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-white/60 px-1">
                        +{dayTasks.length - 2}개 더
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
};
