import { GlassCard } from '@/components/ui/GlassCard';
import { WaveButton } from '@/components/ui/WaveButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import logger from '@/lib/logger';
// 공유 드롭다운은 제거되었습니다
import { cn } from '@/components/ui/utils';
import { Task, TaskPriority } from '@/types/task';
import {
  differenceInDays,
  format,
  isPast,
  isToday,
  isTomorrow,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  AlertCircle,
  Archive,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Edit,
  Edit2,
  ExternalLink,
  MoreHorizontal,
  Share2,
  Star,
  Target,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';
import React, {
  TouchEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toDate } from '../../utils/dateHelpers';

// Category emojis from TaskCardEnhanced
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
  showGroupBadge?: boolean;
  groupName?: string;
  // New props for enhanced functionality
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
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-400/30',
    icon: Zap,
    label: '긴급',
  },
  medium: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-400/30',
    icon: Star,
    label: '중요',
  },
  low: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-400/30',
    icon: Target,
    label: '일반',
  },
};

const categoryConfig: Record<string, { color: string; label: string }> = {
  household: { color: 'bg-orange-100 text-orange-800', label: '집안일' },
  work: { color: 'bg-blue-100 text-blue-800', label: '업무' },
  personal: { color: 'bg-purple-100 text-purple-800', label: '개인' },
  shopping: { color: 'bg-green-100 text-green-800', label: '쇼핑' },
  other: { color: 'bg-gray-100 text-gray-800', label: '기타' },
};

const TaskCard: React.FC<TaskCardProps> = memo(
  ({
    task,
    onToggleComplete,
    onEdit,
    onDelete,
    onDetail,
    assigneeName,
    assigneeAvatar,
    showGroupBadge = false,
    groupName,
    // Enhanced props with defaults
    variant = 'default',
    enableSwipe = false,
    enableTouch = false,
    compact = false,
    swipeActions = [],
    onTaskArchive,
    onTaskStar,
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [checkAnimation, setCheckAnimation] = useState(false);

    // Enhanced functionality states
    const [swipeX, setSwipeX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const cardRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef(0);
    const swipeThreshold = 100;

    // Memoized computed values
    const taskStatus = useMemo(() => {
      if (!task) return { isCompleted: false, isOverdue: false };
      return {
        isCompleted: task.status === 'completed',
        isOverdue:
          task.dueDate &&
          isPast(toDate(task.dueDate)) &&
          task.status !== 'completed',
      };
    }, [task]);

    // Memoized date formatting
    const formattedDueDate = useMemo(() => {
      if (!task || !task.dueDate) return null;

      const date = toDate(task.dueDate);
      if (isToday(date)) return '오늘';
      if (isTomorrow(date)) return '내일';
      const days = differenceInDays(date, new Date());
      if (days > 0 && days <= 7) return `${days}일 후`;
      return format(date, 'M월 d일', { locale: ko });
    }, [task]);

    // Memoized priority config
    const PriorityIcon = useMemo(() => {
      if (!task || !task.priority) return priorityConfig.low.icon;
      return (priorityConfig[task.priority] || priorityConfig.low).icon;
    }, [task]);

    // Memoized initials for avatar
    const assigneeInitials = useMemo(() => {
      if (!assigneeName) return '';
      return assigneeName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }, [assigneeName]);

    useEffect(() => {
      if (checkAnimation) {
        const timer = setTimeout(() => setCheckAnimation(false), 500);
        return () => clearTimeout(timer);
      }
    }, [checkAnimation]);

    // Memoized event handlers
    const handleCheckboxClick = useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsChecking(true);
        setCheckAnimation(true);

        try {
          await onToggleComplete(task.id);
        } finally {
          setTimeout(() => setIsChecking(false), 300);
        }
      },
      [task.id, onToggleComplete]
    );

    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);

    const handleCardClick = useCallback(() => {
      onDetail(task.id);
    }, [task.id, onDetail]);

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

    const handleCopyLink = useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation();
        const taskUrl = `${window.location.origin}/tasks/${task.id}`;
        await navigator.clipboard.writeText(taskUrl);
        logger.info('task', '링크가 클립보드에 복사되었습니다.');
      },
      [task.id]
    );

    // 카카오톡/이메일/네이티브 공유는 제거되었습니다. 링크 공유만 유지합니다.

    // Touch handlers for swipe actions (from TaskCardEnhanced)
    const handleTouchStart = useCallback(
      (e: TouchEvent) => {
        if (!enableSwipe && !enableTouch) return;
        startXRef.current = e.touches[0].clientX;
        setIsSwiping(true);
      },
      [enableSwipe, enableTouch]
    );

    const handleTouchMove = useCallback(
      (e: TouchEvent) => {
        if (!enableSwipe && !enableTouch) return;
        if (!isSwiping) return;

        const currentX = e.touches[0].clientX;
        const diffX = currentX - startXRef.current;

        // Limit swipe distance
        const maxSwipe = 200;
        const clampedX = Math.max(-maxSwipe, Math.min(maxSwipe, diffX));
        setSwipeX(clampedX);
      },
      [enableSwipe, enableTouch, isSwiping]
    );

    const handleTouchEnd = useCallback(() => {
      if (!enableSwipe && !enableTouch) return;
      if (!isSwiping) return;

      setIsSwiping(false);

      // Determine action based on swipe distance
      if (Math.abs(swipeX) > swipeThreshold) {
        if (swipeX > 0) {
          // Swipe right - Complete/Uncomplete
          handleCheckboxClick({} as React.MouseEvent);
        } else {
          // Swipe left - Show actions
          setShowActions(true);
        }
      }

      // Reset swipe position
      setSwipeX(0);
    }, [
      enableSwipe,
      enableTouch,
      isSwiping,
      swipeX,
      swipeThreshold,
      handleCheckboxClick,
    ]);

    const handleEnhancedCardClick = useCallback(() => {
      if (!isSwiping && Math.abs(swipeX) === 0) {
        onDetail(task.id);
      }
    }, [isSwiping, swipeX, onDetail, task.id]);

    // Early return if task is undefined or null
    if (!task) {
      logger.warn('task', 'TaskCard: task prop is undefined or null');
      return null;
    }

    return (
      <div className="relative">
        {/* 1. 스와이프 배경 인디케이터 컨테이너 */}
        {enableSwipe && Math.abs(swipeX) > 10 && (
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            {swipeX > 0 ? (
              <div className="h-full bg-gradient-to-r from-green-500/20 to-green-500/40 flex items-center pl-4">
                <CheckCircle2 className="text-green-500" size={24} />
              </div>
            ) : (
              <div className="h-full bg-gradient-to-l from-red-500/20 to-red-500/40 flex items-center justify-end pr-4">
                <MoreHorizontal className="text-red-500" size={24} />
              </div>
            )}
          </div>
        )}

        {/* 2. 메인 카드 컨테이너 */}
        <div
          ref={cardRef}
          className="group relative transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          style={{
            transform: enableSwipe ? `translateX(${swipeX}px)` : undefined,
            transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={enableSwipe ? handleEnhancedCardClick : handleCardClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* 3. 메인 카드 */}
          <GlassCard
            variant={taskStatus.isCompleted ? 'light' : 'medium'}
            hover={true}
            className={cn(
              'relative',
              taskStatus.isCompleted && 'opacity-60',
              taskStatus.isOverdue && 'border-l-4 border-red-500',
              // 우선순위별 시각적 강조 (완화된 색상)
              task.priority === 'high' &&
                'border-l-4 border-red-400/60 shadow-md shadow-red-400/10',
              task.priority === 'medium' &&
                'border-l-4 border-orange-400/60 shadow-md shadow-orange-400/10',
              task.priority === 'low' && 'border-l-4 border-gray-400/60',
              // 높은 우선순위일 때 더 강조 (완화된 효과)
              task.priority === 'high' &&
                !taskStatus.isCompleted &&
                'ring-1 ring-red-400/20',
              task.priority === 'medium' &&
                !taskStatus.isCompleted &&
                'ring-1 ring-orange-400/20'
            )}
          >
            {/* 배지들을 오른쪽 상단에 가로로 배치 */}
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 lg:top-4 lg:right-4 xl:top-5 xl:right-5 z-10 flex flex-row gap-1 sm:gap-1.5 lg:gap-2">
              {/* 우선순위 배지 */}
              <div
                className={cn(
                  'flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 lg:px-3 lg:py-2 rounded-full text-xs sm:text-sm lg:text-base font-medium shadow-lg backdrop-blur-sm',
                  'bg-white/95 text-gray-800 border border-white/30',
                  (priorityConfig[task.priority || 'low'] || priorityConfig.low)
                    .color
                )}
              >
                <PriorityIcon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                <span className="hidden sm:inline font-pretendard">
                  {
                    (
                      priorityConfig[task.priority || 'low'] ||
                      priorityConfig.low
                    ).label
                  }
                </span>
                <span className="sm:hidden font-pretendard">
                  {(
                    priorityConfig[task.priority || 'low'] || priorityConfig.low
                  ).label.charAt(0)}
                </span>
              </div>

              {/* 카테고리 배지 */}
              <Badge
                variant="secondary"
                className={cn(
                  'px-2 py-1 sm:px-2.5 sm:py-1.5 lg:px-3 lg:py-2 text-xs sm:text-sm lg:text-base font-pretendard shadow-lg backdrop-blur-sm',
                  'bg-white/95 text-gray-800 border border-white/30',
                  (
                    categoryConfig[task.category || 'other'] ||
                    categoryConfig.other
                  ).color
                )}
              >
                {variant === 'enhanced' &&
                  categoryEmojis[task.category || 'other'] && (
                    <span className="mr-1">
                      {categoryEmojis[task.category || 'other']}
                    </span>
                  )}
                <span className="hidden sm:inline">
                  {
                    (
                      categoryConfig[task.category || 'other'] ||
                      categoryConfig.other
                    ).label
                  }
                </span>
                <span className="sm:hidden">
                  {(
                    categoryConfig[task.category || 'other'] ||
                    categoryConfig.other
                  ).label.charAt(0)}
                </span>
              </Badge>

              {/* 담당자 배지 */}
              {assigneeName && (
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/95 px-2 py-1 sm:px-2.5 sm:py-1.5 lg:px-3 lg:py-2 rounded-full shadow-lg backdrop-blur-sm border border-white/30">
                  <Avatar className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 border border-gray-200">
                    {assigneeAvatar ? (
                      <AvatarImage src={assigneeAvatar} alt={assigneeName} />
                    ) : null}
                    <AvatarFallback
                      className={cn(
                        'text-xs sm:text-sm lg:text-base font-semibold font-pretendard',
                        'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                      )}
                    >
                      {assigneeInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs sm:text-sm lg:text-base text-gray-700 font-pretendard break-keep-ko hidden sm:inline">
                    {assigneeName}
                  </span>
                </div>
              )}

              {/* 그룹 배지 */}
              {task.groupId && task.groupId !== 'personal' && groupName && (
                <div className="flex items-center gap-1.5 sm:gap-2 bg-purple-500/95 px-2 py-1 sm:px-2.5 sm:py-1.5 lg:px-3 lg:py-2 rounded-full shadow-lg backdrop-blur-sm border border-purple-300/30">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white flex-shrink-0" />
                  <span className="text-xs sm:text-sm lg:text-base text-white font-pretendard break-keep-ko hidden sm:inline">
                    {groupName}
                  </span>
                </div>
              )}

              {/* 날짜 배지 */}
              {formattedDueDate && (
                <div
                  className={cn(
                    'flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-2.5 sm:py-1.5 lg:px-3 lg:py-2 rounded-full text-xs sm:text-sm lg:text-base font-medium shadow-lg backdrop-blur-sm',
                    'bg-white/95 text-gray-800 border border-white/30',
                    taskStatus.isOverdue ? 'text-red-600' : 'text-gray-700'
                  )}
                >
                  {taskStatus.isOverdue && (
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                  )}
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                  <span className="hidden sm:inline font-pretendard">
                    {formattedDueDate}
                  </span>
                  <span className="sm:hidden font-pretendard">
                    {formattedDueDate}
                  </span>
                </div>
              )}
            </div>

            {/* 액션 버튼들을 오른쪽 하단에 가로로 배치 */}
            <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 lg:bottom-4 lg:right-4 xl:bottom-5 xl:right-5 z-10 flex flex-row gap-1.5 sm:gap-2 lg:gap-2.5 xl:gap-3">
              {/* 수정 버튼 */}
              <WaveButton
                variant="ghost"
                size="sm"
                onClick={handleEditClick}
                className={cn(
                  'flex items-center justify-center p-0.5 rounded transition-all duration-200',
                  'text-white/80 hover:text-white hover:bg-white/10 hover:scale-105',
                  'shadow-sm hover:shadow-md'
                )}
                title="수정"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 flex-shrink-0" />
              </WaveButton>

              {/* 관련 링크 아이콘 */}
              {task.urls && task.urls.length > 0 && (
                <div className="flex items-center gap-1">
                  {task.urls.map((urlAttachment, index) => (
                    <a
                      key={urlAttachment.id || index}
                      href={urlAttachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'flex items-center justify-center p-0.5 rounded transition-all duration-200',
                        'text-white/80 hover:text-white hover:bg-white/10 hover:scale-105',
                        'shadow-sm hover:shadow-md'
                      )}
                      title={urlAttachment.title || '관련 링크'}
                      onClick={e => {
                        e.stopPropagation();
                      }}
                    >
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              )}

              {/* 링크 공유 아이콘 */}
              <WaveButton
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className={cn(
                  'flex items-center justify-center p-0.5 rounded transition-all duration-200',
                  'text-white/80 hover:text-white hover:bg-white/10 hover:scale-105',
                  'shadow-sm hover:shadow-md'
                )}
                title="링크 공유"
              >
                <Share2 className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 flex-shrink-0" />
              </WaveButton>

              {/* 삭제 버튼 */}
              <WaveButton
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                className={cn(
                  'flex items-center justify-center p-0.5 rounded transition-all duration-200',
                  'text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:scale-105',
                  'shadow-sm hover:shadow-md'
                )}
                title="삭제"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 flex-shrink-0" />
              </WaveButton>
            </div>
            {/* 4. 카드 내용 컨테이너 */}
            <div
              className={cn(
                compact
                  ? 'p-3 sm:p-4 md:p-5'
                  : 'p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 2xl:p-10'
              )}
            >
              {/* 5. 카드 내부 레이아웃 컨테이너 */}
              <div className="flex items-start gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
                {/* 6. 체크박스 버튼 */}
                <WaveButton
                  onClick={handleCheckboxClick}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'mt-1 flex-shrink-0 transition-all duration-200',
                    'h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 xl:h-10 xl:w-10 flex items-center justify-center rounded-full',
                    checkAnimation && 'scale-125',
                    isChecking && 'pointer-events-none',
                    taskStatus.isCompleted
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-white/20 hover:bg-white/30 border border-white/30'
                  )}
                  disabled={isChecking}
                >
                  {taskStatus.isCompleted ? (
                    <CheckCircle2
                      className={cn(
                        'h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-white transition-all',
                        checkAnimation && 'animate-bounce'
                      )}
                    />
                  ) : (
                    <Circle
                      className={cn(
                        'h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 transition-all duration-200',
                        isHovered ? 'text-white scale-110' : 'text-white/70',
                        isChecking && 'animate-pulse'
                      )}
                    />
                  )}
                </WaveButton>

                {/* 7. 콘텐츠 컨테이너 */}
                <div className="flex-1 min-w-0">
                  {/* 8. 제목 컨테이너 */}
                  <div className="flex items-start gap-3 sm:gap-4 lg:gap-5 flex-wrap">
                    {/* 9. 제목 텍스트 */}
                    <h3
                      className={cn(
                        'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-white flex-1 font-pretendard tracking-ko-tight break-keep-ko',
                        taskStatus.isCompleted && 'line-through text-white/60'
                      )}
                    >
                      {task.title}
                    </h3>
                  </div>

                  {/* 11. 설명 텍스트 */}
                  {task.description && !taskStatus.isCompleted && (
                    <p className="mt-2 sm:mt-3 lg:mt-4 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-white/80 line-clamp-2 font-pretendard leading-ko-normal break-keep-ko">
                      {task.description}
                    </p>
                  )}

                  {/* 12. 메타데이터 컨테이너 */}
                  <div className="mt-4 sm:mt-5 lg:mt-6 xl:mt-8 flex flex-wrap items-center justify-between gap-2 sm:gap-3 lg:gap-4 xl:gap-5 text-sm">
                    {/* 13. 왼쪽 배지 그룹 */}
                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 xl:gap-5">
                      {/* 여기에 다른 메타데이터 배지들이 들어갈 수 있습니다 */}
                    </div>

                    {/* 19. 그룹 배지 */}
                    {showGroupBadge && groupName && (
                      <Badge
                        variant="outline"
                        className="text-xs lg:text-sm font-pretendard glass-light text-white border-white/20 hidden sm:inline-flex"
                      >
                        {groupName}
                      </Badge>
                    )}

                    {/* 20. 태그 컨테이너 */}
                    {task.tags.length > 0 && (
                      <div className="flex gap-1">
                        {task.tags.slice(0, 2).map(tag => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs px-2 py-1 glass-light text-white border-white/20 font-pretendard hidden sm:inline-flex"
                          >
                            #{tag}
                          </Badge>
                        ))}
                        {task.tags.length > 2 && (
                          <Badge
                            variant="outline"
                            className="text-xs px-2 py-1 glass-light text-white border-white/20 font-pretendard hidden sm:inline-flex"
                          >
                            +{task.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 27. 반복 배지 컨테이너 */}
              {task.recurring?.enabled && (
                <div className="mt-4 flex items-center gap-2 text-sm text-white/80 font-pretendard glass-light px-3 py-2 rounded-lg">
                  <Clock className="h-4 w-4 lg:h-5 lg:w-5" />
                  <span className="hidden sm:inline">
                    반복:{' '}
                    {task.recurring.frequency === 'daily'
                      ? '매일'
                      : task.recurring.frequency === 'weekly'
                      ? '매주'
                      : task.recurring.frequency === 'monthly'
                      ? '매월'
                      : '매년'}
                  </span>
                  <span className="sm:hidden">
                    {task.recurring.frequency === 'daily'
                      ? '매일'
                      : task.recurring.frequency === 'weekly'
                      ? '매주'
                      : task.recurring.frequency === 'monthly'
                      ? '매월'
                      : '매년'}
                  </span>
                </div>
              )}
            </div>

            {/* 29. 진행 중 작업 진행률 인디케이터 */}
            {task.status === 'in_progress' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-xl">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-bl-xl animate-pulse"
                  style={{ width: '50%' }}
                />
              </div>
            )}
          </GlassCard>
        </div>

        {/* 30. 모바일 액션 시트 컨테이너 */}
        {showActions && enableSwipe && (
          <div
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={() => setShowActions(false)}
          >
            {/* 30. 모바일 액션 시트 카드 */}
            <GlassCard className="absolute bottom-0 left-0 right-0 p-4 rounded-t-2xl">
              {/* 31. 모바일 액션 시트 핸들 */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

              {/* 32. 모바일 액션 시트 내용 컨테이너 */}
              <div className="space-y-2">
                {/* 33. 커스텀 스와이프 액션 컨테이너 */}
                {swipeActions.length > 0 ? (
                  swipeActions.map(action => (
                    <WaveButton
                      key={action.id}
                      variant="ghost"
                      onClick={() => {
                        action.action();
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
                    >
                      {action.icon}
                      <span className={action.color}>{action.label}</span>
                    </WaveButton>
                  ))
                ) : (
                  // 기본 액션들
                  <>
                    {/* 34. 편집 액션 버튼 */}
                    <WaveButton
                      variant="ghost"
                      onClick={() => {
                        onEdit(task);
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
                    >
                      <Edit2 size={20} className="text-gray-600" />
                      <span className="text-gray-900">편집</span>
                    </WaveButton>

                    {/* 35. 즐겨찾기 액션 버튼 */}
                    {onTaskStar && (
                      <WaveButton
                        variant="ghost"
                        onClick={() => {
                          onTaskStar(task.id);
                          setShowActions(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
                      >
                        <Star size={20} className="text-yellow-500" />
                        <span className="text-gray-900">즐겨찾기</span>
                      </WaveButton>
                    )}

                    {/* 36. 보관 액션 버튼 */}
                    {onTaskArchive && (
                      <WaveButton
                        variant="ghost"
                        onClick={() => {
                          onTaskArchive(task.id);
                          setShowActions(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
                      >
                        <Archive size={20} className="text-gray-600" />
                        <span className="text-gray-900">보관</span>
                      </WaveButton>
                    )}

                    {/* 37. 삭제 액션 버튼 */}
                    <WaveButton
                      variant="ghost"
                      onClick={() => {
                        onDelete(task.id);
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
                    >
                      <Trash2 size={20} className="text-red-500" />
                      <span className="text-red-500">삭제</span>
                    </WaveButton>
                  </>
                )}
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
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
      prevProps.showGroupBadge === nextProps.showGroupBadge &&
      prevProps.groupName === nextProps.groupName &&
      // Enhanced props comparison
      prevProps.variant === nextProps.variant &&
      prevProps.enableSwipe === nextProps.enableSwipe &&
      prevProps.enableTouch === nextProps.enableTouch &&
      prevProps.compact === nextProps.compact
    );
  }
);

TaskCard.displayName = 'TaskCard';

// Backward compatibility alias for TaskCardEnhanced
export const TaskCardEnhanced: React.FC<TaskCardProps> = props => (
  <TaskCard
    {...props}
    variant="enhanced"
    enableSwipe={true}
    enableTouch={true}
  />
);

TaskCardEnhanced.displayName = 'TaskCardEnhanced';

export { TaskCard };
export default TaskCard;
