import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/components/ui/utils';
import { Task, TaskPriority } from '@/types/task';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Archive,
  CheckCircle2,
  Circle,
  Clock,
  Edit,
  Edit2,
  MessageSquare,
  MoreVertical,
  Share2,
  Star,
  Target,
  Trash2,
  Zap,
} from 'lucide-react';
import React, {
  memo,
  TouchEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toDate } from '../../utils/dateHelpers';

// Category emojis
const categoryEmojis: Record<string, string> = {
  household: '🏠',
  shopping: '🛒',
  work: '💼',
  personal: '👤',
  other: '📝',
};

interface SwipeAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

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
  variant?: 'default' | 'enhanced';
  enableSwipe?: boolean;
  enableTouch?: boolean;
  compact?: boolean;
  swipeActions?: SwipeAction[];
  onTaskArchive?: (taskId: string) => void;
  onTaskStar?: (taskId: string) => void;
}

const priorityConfig: Record<
  TaskPriority,
  {
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ElementType;
    label: string;
  }
> = {
  high: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: Zap,
    label: '긴급',
  },
  medium: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: Star,
    label: '중요',
  },
  low: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: Target,
    label: '일반',
  },
};

const TaskCardEnhanced: React.FC<TaskCardProps> = memo(
  ({
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

    enableSwipe = true,
    enableTouch = true,
    compact = false,
    swipeActions,
    onTaskArchive,
    onTaskStar,
  }) => {
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const priority = priorityConfig[task.priority];
    const isOverdue =
      task.dueDate && isPast(toDate(task.dueDate)) && !task.completedAt;
    const isDueToday = task.dueDate && isToday(toDate(task.dueDate));
    const isDueTomorrow = task.dueDate && isTomorrow(toDate(task.dueDate));

    const handleCheckboxClick = useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleComplete(task.id);
      },
      [task.id, onToggleComplete]
    );

    const handleEditClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(task);
      },
      [task, onEdit]
    );

    const handleDeleteClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(task.id);
      },
      [task.id, onDelete]
    );

    const handleShareClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      // Share functionality
    }, []);

    // Touch handlers for swipe actions
    const handleTouchStart = useCallback(
      (e: TouchEvent) => {
        if (!enableTouch || !enableSwipe) return;
        setTouchStart(e.targetTouches[0].clientX);
        setIsSwiping(true);
      },
      [enableTouch, enableSwipe]
    );

    const handleTouchMove = useCallback(
      (e: TouchEvent) => {
        if (!enableTouch || !enableSwipe || touchStart === null) return;
        const currentTouch = e.targetTouches[0].clientX;
        const diff = currentTouch - touchStart;
        setSwipeOffset(Math.max(-100, Math.min(0, diff)));
      },
      [enableTouch, enableSwipe, touchStart]
    );

    const handleTouchEnd = useCallback(() => {
      if (!enableTouch || !enableSwipe) return;
      setIsSwiping(false);
      setSwipeOffset(0);
      setTouchStart(null);
    }, [enableTouch, enableSwipe, swipeOffset]);

    const handleCardClick = useCallback(() => {
      if (!isSwiping) {
        onDetail(task.id);
      }
    }, [isSwiping, task.id, onDetail]);

    const handleArchiveClick = useCallback(() => {
      onTaskArchive?.(task.id);
    }, [task.id, onTaskArchive]);

    const handleStarClick = useCallback(() => {
      onTaskStar?.(task.id);
    }, [task.id, onTaskStar]);

    const defaultSwipeActions = useMemo(
      () => [
        {
          id: 'edit',
          label: '편집',
          icon: <Edit2 className="w-4 h-4" />,
          color: 'bg-blue-500',
          action: () => onEdit(task),
        },
        {
          id: 'delete',
          label: '삭제',
          icon: <Trash2 className="w-4 h-4" />,
          color: 'bg-red-500',
          action: () => onDelete(task.id),
        },
      ],
      [task, onEdit, onDelete]
    );

    const actions = swipeActions || defaultSwipeActions;

    return (
      <div className="relative">
        {/* Swipe background indicators */}
        {enableSwipe && (
          <div className="absolute inset-0 flex items-center justify-end pr-4 space-x-2">
            {actions.map(action => (
              <button
                key={action.id}
                onClick={action.action}
                className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-full text-white transition-all',
                  action.color
                )}
              >
                {action.icon}
              </button>
            ))}
          </div>
        )}

        <GlassCard
          ref={cardRef}
          className={cn(
            'relative transition-all duration-200 cursor-pointer group',
            'hover:shadow-lg hover:scale-[1.02]',
            compact && 'p-3',
            !compact && 'p-4',
            isOverdue && 'border-red-300 bg-red-50/50',
            isDueToday && 'border-yellow-300 bg-yellow-50/50',
            task.completedAt && 'opacity-75'
          )}
          style={{
            transform: `translateX(${swipeOffset}px)`,
            zIndex: isSwiping ? 10 : 1,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleCardClick}
        >
          <div className="flex items-start space-x-3">
            {/* Checkbox */}
            <button
              onClick={handleCheckboxClick}
              className={cn(
                'flex-shrink-0 mt-1 transition-colors',
                task.completedAt
                  ? 'text-green-600'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {task.completedAt ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      'font-medium text-gray-900 truncate',
                      task.completedAt && 'line-through text-gray-500'
                    )}
                  >
                    {task.title}
                  </h3>

                  {task.description && (
                    <p
                      className={cn(
                        'text-sm text-gray-600 mt-1 line-clamp-2',
                        task.completedAt && 'text-gray-400'
                      )}
                    >
                      {task.description}
                    </p>
                  )}

                  {/* Priority Badge */}
                  <div className="flex items-center mt-2 space-x-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        priority.color,
                        priority.bgColor,
                        priority.borderColor
                      )}
                    >
                      <priority.icon className="w-3 h-3 mr-1" />
                      {priority.label}
                    </Badge>

                    {/* Category */}
                    {task.category && (
                      <Badge variant="secondary" className="text-xs">
                        {categoryEmojis[task.category] || '📝'} {task.category}
                      </Badge>
                    )}

                    {/* Group Badge */}
                    {showGroupBadge && groupName && (
                      <Badge variant="outline" className="text-xs">
                        👥 {groupName}
                      </Badge>
                    )}
                  </div>

                  {/* Due Date */}
                  {task.dueDate && (
                    <div className="flex items-center mt-2 text-sm">
                      <Clock
                        className={cn(
                          'w-4 h-4 mr-1',
                          isOverdue ? 'text-red-500' : 'text-gray-400'
                        )}
                      />
                      <span
                        className={cn(
                          isOverdue ? 'text-red-600' : 'text-gray-600'
                        )}
                      >
                        {isDueToday && '오늘'}
                        {isDueTomorrow && '내일'}
                        {!isDueToday &&
                          !isDueTomorrow &&
                          task.dueDate &&
                          format(toDate(task.dueDate), 'M월 d일', {
                            locale: ko,
                          })}
                      </span>
                    </div>
                  )}

                  {/* Assignee and Comments */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      {assigneeAvatar && (
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={assigneeAvatar} />
                          <AvatarFallback className="text-xs">
                            {assigneeName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {assigneeName && (
                        <span className="text-xs text-gray-600">
                          담당: {assigneeName}
                        </span>
                      )}
                    </div>

                    {commentCount > 0 && (
                      <div className="flex items-center text-xs text-gray-500">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {commentCount}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1 ml-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={e => e.stopPropagation()}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleEditClick}>
                        <Edit className="w-4 h-4 mr-2" />
                        편집
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShareClick}>
                        <Share2 className="w-4 h-4 mr-2" />
                        공유
                      </DropdownMenuItem>
                      {onTaskArchive && (
                        <DropdownMenuItem onClick={handleArchiveClick}>
                          <Archive className="w-4 h-4 mr-2" />
                          보관
                        </DropdownMenuItem>
                      )}
                      {onTaskStar && (
                        <DropdownMenuItem onClick={handleStarClick}>
                          <Star className="w-4 h-4 mr-2" />
                          즐겨찾기
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleDeleteClick}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }
);

TaskCardEnhanced.displayName = 'TaskCardEnhanced';

export default TaskCardEnhanced;
