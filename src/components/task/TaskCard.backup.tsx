import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toDate } from '../../utils/dateHelpers';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar,
  AlertCircle,
  MessageSquare,
  MoreVertical,
  Edit,
  Trash2,
  Share2,
  Star,
  Zap,
  Target
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { Task, TaskPriority, TaskCategory } from '@/types/task';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GlassCard } from '@/components/ui/GlassCard';
import { WaveButton } from '@/components/ui/WaveButton';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDetail: (taskId: string) => void;
  assigneeName?: string;
  assigneeAvatar?: string;
  commentCount?: number;
  showGroupBadge?: boolean;
  groupName?: string;
}

const priorityConfig: Record<TaskPriority, { 
  color: string; 
  bgColor: string;
  borderColor: string;
  icon: React.ElementType; 
  label: string 
}> = {
  high: { 
    color: 'text-red-600', 
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: Zap, 
    label: '긴급' 
  },
  medium: { 
    color: 'text-yellow-600', 
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: Star, 
    label: '중요' 
  },
  low: { 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: Target, 
    label: '일반' 
  },
};

const categoryConfig: Record<TaskCategory, { color: string; label: string }> = {
  household: { color: 'bg-orange-100 text-orange-800', label: '집안일' },
  work: { color: 'bg-blue-100 text-blue-800', label: '업무' },
  personal: { color: 'bg-purple-100 text-purple-800', label: '개인' },
  shopping: { color: 'bg-green-100 text-green-800', label: '쇼핑' },
  other: { color: 'bg-gray-100 text-gray-800', label: '기타' },
};

const TaskCard: React.FC<TaskCardProps> = memo(({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onDetail,
  assigneeName,
  assigneeAvatar,
  commentCount = 0,
  showGroupBadge = false,
  groupName,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkAnimation, setCheckAnimation] = useState(false);

  // Memoized computed values
  const taskStatus = useMemo(() => ({
    isCompleted: task.status === 'completed',
    isOverdue: task.dueDate && isPast(toDate(task.dueDate)) && task.status !== 'completed',
  }), [task.status, task.dueDate]);

  // Memoized date formatting
  const formattedDueDate = useMemo(() => {
    if (!task.dueDate) return null;
    
    const date = toDate(task.dueDate);
    if (isToday(date)) return '오늘';
    if (isTomorrow(date)) return '내일';
    const days = differenceInDays(date, new Date());
    if (days > 0 && days <= 7) return `${days}일 후`;
    return format(date, 'M월 d일', { locale: ko });
  }, [task.dueDate]);

  // Memoized priority config
  const PriorityIcon = useMemo(() => priorityConfig[task.priority].icon, [task.priority]);

  // Memoized initials for avatar
  const assigneeInitials = useMemo(() => {
    if (!assigneeName) return '';
    return assigneeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, [assigneeName]);

  useEffect(() => {
    if (checkAnimation) {
      const timer = setTimeout(() => setCheckAnimation(false), 500);
      return () => clearTimeout(timer);
    }
  }, [checkAnimation]);

  // Memoized event handlers
  const handleCheckboxClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsChecking(true);
    setCheckAnimation(true);
    
    try {
      await onToggleComplete(task.id);
    } finally {
      setTimeout(() => setIsChecking(false), 300);
    }
  }, [task.id, onToggleComplete]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const handleCardClick = useCallback(() => {
    onDetail(task.id);
  }, [task.id, onDetail]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(task);
  }, [task, onEdit]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(task.id);
  }, [task.id, onDelete]);

  const handleShareClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/tasks/${task.id}`);
  }, [task.id]);

  return (
    <div
      className="group relative transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >
      <GlassCard
        variant={taskStatus.isCompleted ? "light" : "medium"}
        hover={true}
        className={cn(
          taskStatus.isCompleted && 'opacity-60',
          taskStatus.isOverdue && 'border-l-4 border-red-500',
          task.priority === 'high' && 'border-l-4 border-red-500',
          task.priority === 'medium' && 'border-l-4 border-yellow-500',
          task.priority === 'low' && 'border-l-4 border-gray-500'
        )}
      >
      <div className="p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 2xl:p-10">
        <div className="flex items-start gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
          {/* Enhanced Checkbox with Animation */}
          <WaveButton
            onClick={handleCheckboxClick}
            variant="ghost"
            size="sm"
            className={cn(
              "mt-1 flex-shrink-0 transition-all duration-200",
              "h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 xl:h-10 xl:w-10 flex items-center justify-center rounded-full",
              checkAnimation && "scale-125",
              isChecking && "pointer-events-none",
              taskStatus.isCompleted 
                ? "bg-green-500 hover:bg-green-600" 
                : "bg-white/20 hover:bg-white/30 border border-white/30"
            )}
            disabled={isChecking}
          >
            {taskStatus.isCompleted ? (
              <CheckCircle2 className={cn(
                "h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-white transition-all",
                checkAnimation && "animate-bounce"
              )} />
            ) : (
              <Circle className={cn(
                "h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 transition-all duration-200",
                isHovered ? "text-white scale-110" : "text-white/70",
                isChecking && "animate-pulse"
              )} />
            )}
          </WaveButton>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title and Priority Badge */}
            <div className="flex items-start gap-3 sm:gap-4 lg:gap-5 flex-wrap">
              <h3 className={cn(
                "text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold text-white flex-1 font-pretendard tracking-ko-tight break-keep-ko",
                taskStatus.isCompleted && "line-through text-white/60"
              )}>
                {task.title}
              </h3>
              {/* Priority Badge */}
              <div className={cn(
                "flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 px-2 sm:px-3 lg:px-4 xl:px-5 py-1 sm:py-1.5 lg:py-2 rounded-full text-xs sm:text-sm lg:text-base xl:text-lg font-medium glass-light",
                priorityConfig[task.priority].color
              )}>
                <PriorityIcon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
                <span className="hidden sm:inline font-pretendard">
                  {priorityConfig[task.priority].label}
                </span>
                <span className="sm:hidden font-pretendard">
                  {priorityConfig[task.priority].label.charAt(0)}
                </span>
              </div>
            </div>

            {/* Description */}
            {task.description && !taskStatus.isCompleted && (
              <p className="mt-2 sm:mt-3 lg:mt-4 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-white/80 line-clamp-2 font-pretendard leading-ko-normal break-keep-ko">
                {task.description}
              </p>
            )}

            {/* Metadata */}
            <div className="mt-4 sm:mt-5 lg:mt-6 xl:mt-8 flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 xl:gap-5 text-sm">
              {/* Category */}
              <Badge variant="secondary" className={cn(
                "px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm lg:text-base xl:text-lg font-pretendard",
                categoryConfig[task.category].color
              )}>
                <span className="hidden sm:inline">{categoryConfig[task.category].label}</span>
                <span className="sm:hidden">{categoryConfig[task.category].label.charAt(0)}</span>
              </Badge>

              {/* Due Date */}
              {formattedDueDate && (
                <div className={cn(
                  "flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 glass-light px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg",
                  taskStatus.isOverdue ? "text-red-600" : "text-white/80"
                )}>
                  {taskStatus.isOverdue && <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />}
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
                  <span className="hidden sm:inline font-pretendard text-xs sm:text-sm lg:text-base xl:text-lg">{formattedDueDate}</span>
                  <span className="sm:hidden text-xs font-pretendard">{formattedDueDate}</span>
                </div>
              )}

              {/* Assignee */}
              {assigneeName && (
                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 group/assignee glass-light px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg">
                  <Avatar className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 xl:h-10 xl:w-10 border-2 border-white/20">
                    {assigneeAvatar ? (
                      <AvatarImage src={assigneeAvatar} alt={assigneeName} />
                    ) : null}
                    <AvatarFallback className={cn(
                      "text-xs sm:text-sm lg:text-base xl:text-lg font-semibold font-pretendard",
                      "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                    )}>
                      {assigneeInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs sm:text-sm lg:text-base xl:text-lg text-white/80 group-hover/assignee:text-white transition-colors font-pretendard break-keep-ko hidden sm:inline">
                    {assigneeName}
                  </span>
                </div>
              )}

              {/* Comments */}
              {commentCount > 0 && (
                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 glass-light px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg text-white/80">
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
                  <span className="hidden sm:inline font-pretendard text-xs sm:text-sm lg:text-base xl:text-lg">{commentCount}</span>
                  <span className="sm:hidden text-xs font-pretendard">{commentCount}</span>
                </div>
              )}

              {/* Group Badge */}
              {showGroupBadge && groupName && (
                <Badge variant="outline" className="text-xs lg:text-sm font-pretendard glass-light text-white border-white/20 hidden sm:inline-flex">
                  {groupName}
                </Badge>
              )}

              {/* Tags */}
              {task.tags.length > 0 && (
                <div className="flex gap-1">
                  {task.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs px-2 py-1 glass-light text-white border-white/20 font-pretendard hidden sm:inline-flex">
                      #{tag}
                    </Badge>
                  ))}
                  {task.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs px-2 py-1 glass-light text-white border-white/20 font-pretendard hidden sm:inline-flex">
                      +{task.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <WaveButton
                variant="ghost"
                size="sm"
                className={cn(
                  "glass-light p-2 sm:p-2.5 lg:p-3 xl:p-4 rounded-lg transition-all duration-200",
                  "h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 xl:h-12 xl:w-12 flex items-center justify-center",
                  isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 text-white/80" />
              </WaveButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 font-pretendard glass-medium border-white/20">
              <DropdownMenuItem onClick={handleEditClick} className="text-white hover:bg-white/10">
                <Edit className="h-4 w-4 mr-2" />
                수정
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShareClick} className="text-white hover:bg-white/10">
                <Share2 className="h-4 w-4 mr-2" />
                링크 복사
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/20" />
              <DropdownMenuItem 
                onClick={handleDeleteClick}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Recurring Badge */}
        {task.recurring?.enabled && (
          <div className="mt-4 flex items-center gap-2 text-sm text-white/80 font-pretendard glass-light px-3 py-2 rounded-lg">
            <Clock className="h-4 w-4 lg:h-5 lg:w-5" />
            <span className="hidden sm:inline">
              반복: {task.recurring.frequency === 'daily' ? '매일' : 
                      task.recurring.frequency === 'weekly' ? '매주' :
                      task.recurring.frequency === 'monthly' ? '매월' : '매년'}
            </span>
            <span className="sm:hidden">
              {task.recurring.frequency === 'daily' ? '매일' : 
               task.recurring.frequency === 'weekly' ? '매주' :
               task.recurring.frequency === 'monthly' ? '매월' : '매년'}
            </span>
          </div>
        )}
      </div>

              {/* Progress Indicator for In Progress Tasks */}
        {task.status === 'in_progress' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-xl">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-bl-xl animate-pulse" style={{ width: '50%' }} />
          </div>
        )}
      </GlassCard>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo optimization
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.dueDate === nextProps.task.dueDate &&
    prevProps.task.priority === nextProps.task.priority &&
    prevProps.task.category === nextProps.task.category &&
    prevProps.task.updatedAt === nextProps.task.updatedAt &&
    prevProps.assigneeName === nextProps.assigneeName &&
    prevProps.assigneeAvatar === nextProps.assigneeAvatar &&
    prevProps.commentCount === nextProps.commentCount &&
    prevProps.showGroupBadge === nextProps.showGroupBadge &&
    prevProps.groupName === nextProps.groupName
  );
});

TaskCard.displayName = 'TaskCard';

export { TaskCard };
export default TaskCard;