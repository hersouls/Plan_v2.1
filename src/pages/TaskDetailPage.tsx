import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import logger from '../lib/logger';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Calendar,
  CheckCircle,
  Circle,
  Clock,
  Edit,
  FileText,
  Flag,
  Info,
  Link,
  MapPin,
  Repeat,
  Star,
  Tag,
  User,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { TaskDetail } from '../components/task/TaskDetail';
import { WaveButton } from '../components/ui/WaveButton';
import { Typography } from '../components/ui/typography';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../hooks/useGroup';
import { useTask } from '../hooks/useTask';
import { useTasks } from '../hooks/useTasks';
import { TaskStatus } from '../types/task';
import { toDate } from '../utils/dateHelpers';

const statusConfig = {
  pending: {
    label: '대기중',
    icon: Circle,
    color: 'text-gray-600 border-gray-200',
    activeColor: 'text-gray-800 border-gray-300',
  },
  in_progress: {
    label: '진행중',
    icon: Clock,
    color: 'text-blue-600 border-blue-200',
    activeColor: 'text-blue-800 border-blue-300',
  },
  completed: {
    label: '완료',
    icon: CheckCircle,
    color: 'text-green-600 border-green-200',
    activeColor: 'text-green-800 border-green-300',
  },
};

const priorityConfig = {
  low: {
    label: '낮음',
    color: 'text-emerald-700 border-emerald-200',
    icon: '🟢',
  },
  medium: {
    label: '보통',
    color: 'text-amber-700 border-amber-200',
    icon: '🟡',
  },
  high: {
    label: '높음',
    color: 'text-red-700 border-red-200',
    icon: '🔴',
  },
};

const categoryConfig = {
  household: {
    label: '집안일',
    emoji: '🏠',
    color: 'bg-blue-100 text-blue-700',
  },
  shopping: {
    label: '쇼핑',
    emoji: '🛒',
    color: 'bg-purple-100 text-purple-700',
  },
  work: { label: '업무', emoji: '💼', color: 'bg-indigo-100 text-indigo-700' },
  personal: { label: '개인', emoji: '👤', color: 'bg-pink-100 text-pink-700' },
  other: { label: '기타', emoji: '📝', color: 'bg-gray-100 text-gray-700' },
};

// 안전한 카테고리 접근을 위한 헬퍼 함수
const getCategoryConfig = (category: string) => {
  return (
    categoryConfig[category as keyof typeof categoryConfig] ||
    categoryConfig.other
  );
};

// 안전한 우선순위 접근을 위한 헬퍼 함수
const getPriorityConfig = (priority: string) => {
  return (
    priorityConfig[priority as keyof typeof priorityConfig] ||
    priorityConfig.medium
  );
};

function TaskDetailPage() {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'actions'>('info');

  const {
    task,
    comments,
    activities,
    loading,
    error,
    addComment,
    deleteComment,
  } = useTask({
    taskId: taskId || '',
    realtime: true,
    includeComments: true,
    includeActivities: true,
  });

  const { toggleTaskComplete, updateTask } = useTasks({
    realtime: false,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 그룹 정보 가져오기
  const { group, members: groupMembers } = useGroup({
    groupId: task?.groupId || '',
  });

  // 적응형 화면 크기 감지
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!taskId) {
    return (
      <div className="min-h-screen">
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="p-6 sm:p-8 text-center max-w-md w-full">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle size={48} className="text-red-400" />
              <Typography.H3 className="text-red-400 mb-4 font-pretendard">
                할일을 찾을 수 없습니다
              </Typography.H3>
              <WaveButton
                onClick={() => navigate('/')}
                className="font-pretendard w-full sm:w-auto"
              >
                홈으로 돌아가기
              </WaveButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="p-6 sm:p-8 text-center max-w-md w-full">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle size={48} className="text-red-400" />
              <Typography.H3 className="text-red-400 mb-4 font-pretendard">
                오류 발생
              </Typography.H3>
              <Typography.Body className="text-white/90 mb-6 font-pretendard leading-relaxed">
                {error}
              </Typography.Body>
              <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
                <WaveButton
                  onClick={() => window.location.reload()}
                  className="font-pretendard w-full sm:w-auto"
                >
                  다시 시도
                </WaveButton>
                <WaveButton
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="font-pretendard w-full sm:w-auto"
                >
                  홈으로 돌아가기
                </WaveButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !task) {
    return (
      <div className="min-h-screen">
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" text="할일 정보를 불러오는 중..." />
        </div>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (actionLoading) return;

    setActionLoading('status');
    try {
      if (newStatus === 'completed' && task.status !== 'completed') {
        await toggleTaskComplete(task.id);
      } else if (newStatus !== 'completed' && task.status === 'completed') {
        await toggleTaskComplete(task.id);
      } else {
        await updateTask(task.id, { status: newStatus });
      }
    } catch (error) {
      alert('상태 변경에 실패했습니다.');
      logger.error('TaskDetailPage', 'Status change error', error);
    } finally {
      setActionLoading(null);
    }
  };

  const canEdit = task
    ? user?.uid === task.userId || user?.uid === task.assigneeId
    : false;

  // 담당자 정보 가져오기 (실제 구현에서는 사용자 정보를 가져와야 함)
  const getAssigneeInfo = () => {
    if (task.assigneeId) {
      return {
        name: task.assigneeName || '담당자',
        initial: (task.assigneeName || '담당자').charAt(0),
      };
    }
    return {
      name: '미지정',
      initial: '미',
    };
  };

  const assigneeInfo = task
    ? getAssigneeInfo()
    : { name: '로딩 중...', initial: '로' };

  // 그룹 멤버 정보 가져오기
  const getGroupMemberInfo = (memberId: string) => {
    const member = groupMembers?.find((m: any) => m.userId === memberId);
    return member
      ? {
          name: member.userName || '알 수 없음',
          role: member.role,
          avatar: member.userAvatar,
        }
      : null;
  };

  // 할일 유형 확인
  const isPersonalTask = !task.groupId || task.groupId === 'personal';
  const isGroupTask = task.groupId && task.groupId !== 'personal';

  return (
    <div className="min-h-screen">
      <div
        className="relative z-10 max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 lg:py-8 fixed-header-spacing"
        style={{ paddingTop: '120px' }}
      >
        {/* Header with Back Button */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4">
              <WaveButton
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft size={20} className="text-white" />
              </WaveButton>
              <Typography.H3 className="text-lg sm:text-2xl lg:text-3xl font-pretendard font-semibold text-white">
                할일 상세
              </Typography.H3>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        {task ? (
          <div
            className={`grid gap-4 sm:gap-6 lg:gap-8 ${
              isMobile
                ? 'grid-cols-1'
                : isTablet
                ? 'grid-cols-1 lg:grid-cols-3'
                : 'grid-cols-1 xl:grid-cols-3'
            }`}
          >
            {/* Main Content */}
            <div
              className={`space-y-4 sm:space-y-6 lg:space-y-8 ${
                isMobile ? '' : isTablet ? 'lg:col-span-2' : 'xl:col-span-2'
              }`}
            >
              {/* Task Status and Actions */}
              <div className="p-4 sm:p-6 lg:p-8">
                {/* Status Buttons */}
                <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                  {Object.entries(statusConfig).map(([status, config]) => {
                    const Icon = config.icon;
                    const isActive = task.status === status;
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status as TaskStatus)}
                        disabled={actionLoading === 'status'}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium font-pretendard transition-all duration-200 min-h-[44px] ${
                          isActive
                            ? 'bg-white text-blue-700 border-2 border-blue-300 shadow-md'
                            : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        } ${
                          actionLoading === 'status'
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                        }`}
                      >
                        {actionLoading === 'status' ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <Icon size={18} />
                            <span>{config.label}</span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Tags */}
                {task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
                    <div className="w-full mb-2">
                      <span className="text-sm font-semibold text-white font-pretendard">
                        태그
                      </span>
                    </div>
                    {task.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1.5 bg-white text-blue-800 rounded-full text-sm font-medium font-pretendard border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Completion Info */}
                {task.status === 'completed' && task.completedAt && (
                  <div className="p-4 sm:p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700 mb-6 sm:mb-8">
                    <div className="flex items-start gap-4">
                      <CheckCircle
                        size={24}
                        className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-green-800 dark:text-green-200 text-base sm:text-lg font-pretendard mb-2">
                          완료됨
                        </div>
                        <div className="text-sm sm:text-base text-green-700 dark:text-green-300 font-pretendard leading-relaxed">
                          {task.completedAt
                            ? format(
                                toDate(task.completedAt),
                                'yyyy년 M월 d일 HH:mm',
                                { locale: ko }
                              )
                            : '완료 시간 정보 없음'}
                          {task.completionNotes && (
                            <div className="mt-2 p-3 rounded-lg border border-green-200 dark:border-green-700">
                              <div className="font-medium text-green-800 dark:text-green-200 mb-1">
                                완료 메모:
                              </div>
                              <div className="text-green-700 dark:text-green-300 break-words">
                                {task.completionNotes}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              {task && (
                <TaskDetail
                  task={task}
                  comments={comments}
                  activities={activities}
                  onAddComment={(_, content, attachments) =>
                    addComment(content, attachments)
                  }
                  onDeleteComment={deleteComment}
                  onAddReaction={() => Promise.resolve()}
                  currentUserId={user?.uid || ''}
                  currentUserName={
                    user?.displayName || user?.email || 'Unknown User'
                  }
                  currentUserAvatar={user?.photoURL || undefined}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              {/* Mobile Tab Navigation */}
              {isMobile && (
                <div className="p-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setActiveTab('info')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium font-pretendard transition-all ${
                        activeTab === 'info'
                          ? 'text-blue-700 border border-blue-200'
                          : 'text-gray-600'
                      }`}
                    >
                      <Info size={16} className="inline mr-1" />
                      정보
                    </button>
                    <button
                      onClick={() => setActiveTab('actions')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium font-pretendard transition-all ${
                        activeTab === 'actions'
                          ? 'text-blue-700 border border-blue-200'
                          : 'text-gray-600'
                      }`}
                    >
                      <Edit size={16} className="inline mr-1" />
                      작업
                    </button>
                  </div>
                </div>
              )}

              {/* Task Properties - Desktop or Mobile Info Tab */}
              {(!isMobile || activeTab === 'info') && (
                <div className="p-4 sm:p-6 lg:p-8 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 shadow-lg">
                  <h3 className="text-lg sm:text-xl font-bold mb-6 font-pretendard text-white flex items-center gap-2">
                    <Info size={20} />
                    할일 정보
                  </h3>

                  {/* Task Title and Description */}
                  <div className="mb-6 p-4 rounded-lg bg-white/10 border border-white/20">
                    <h4 className="text-lg font-semibold text-white mb-2 font-pretendard">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-gray-300 text-sm font-pretendard leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4 sm:space-y-5">
                    {/* Task Type and Group Info */}
                    {isGroupTask && group && (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30">
                        <div className="flex items-center gap-3 mb-3">
                          <Users size={18} className="text-blue-400" />
                          <span className="text-sm font-semibold font-pretendard text-blue-300">
                            그룹 할일
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">
                              {group.name}
                            </span>
                            {group.description && (
                              <span className="text-gray-300 text-sm">
                                - {group.description}
                              </span>
                            )}
                          </div>
                          {groupMembers && groupMembers.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-300 text-sm">
                                멤버:
                              </span>
                              <div className="flex -space-x-2">
                                {groupMembers
                                  .slice(0, 3)
                                  .map((member: any, _index: number) => (
                                    <div
                                      key={member.userId}
                                      className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white/20"
                                      title={
                                        member.userName ||
                                        member.displayName ||
                                        '알 수 없음'
                                      }
                                    >
                                      {(
                                        member.userName ||
                                        member.displayName ||
                                        '알'
                                      ).charAt(0)}
                                    </div>
                                  ))}
                                {groupMembers.length > 3 && (
                                  <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white/20">
                                    +{groupMembers.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {isPersonalTask && (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-500/20 to-pink-500/20 border border-indigo-400/30">
                        <div className="flex items-center gap-3">
                          <User size={18} className="text-indigo-400" />
                          <span className="text-sm font-semibold font-pretendard text-indigo-300">
                            개인 할일
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Priority */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <Flag
                          size={18}
                          className="text-gray-300 flex-shrink-0"
                        />
                        <span className="text-sm font-semibold font-pretendard text-gray-300">
                          우선순위
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getPriorityConfig(task.priority || 'medium').icon}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold border font-pretendard ${
                            getPriorityConfig(task.priority || 'medium').color
                          }`}
                        >
                          {getPriorityConfig(task.priority || 'medium').label}
                        </span>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <Tag
                          size={18}
                          className="text-gray-300 flex-shrink-0"
                        />
                        <span className="text-sm font-semibold font-pretendard text-gray-300">
                          카테고리
                        </span>
                      </div>
                      <span
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border font-pretendard ${
                          getCategoryConfig(task.category || 'other').color
                        }`}
                      >
                        <span className="text-lg">
                          {getCategoryConfig(task.category || 'other').emoji}
                        </span>
                        {getCategoryConfig(task.category || 'other').label}
                      </span>
                    </div>

                    {/* Assignee - 개선된 담당자 정보 */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <User
                          size={18}
                          className="text-gray-300 flex-shrink-0"
                        />
                        <span className="text-sm font-semibold font-pretendard text-gray-300">
                          담당자
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isGroupTask && task.assigneeId ? (
                          <>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {getGroupMemberInfo(
                                task.assigneeId
                              )?.name?.charAt(0) || assigneeInfo.initial}
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium font-pretendard text-gray-300">
                                {getGroupMemberInfo(task.assigneeId)?.name ||
                                  assigneeInfo.name}
                              </div>
                              {getGroupMemberInfo(task.assigneeId)?.role && (
                                <div className="text-xs text-gray-400 font-pretendard">
                                  {getGroupMemberInfo(task.assigneeId)?.role ===
                                  'owner'
                                    ? '그룹장'
                                    : getGroupMemberInfo(task.assigneeId)
                                        ?.role === 'admin'
                                    ? '관리자'
                                    : '멤버'}
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {assigneeInfo.initial}
                            </div>
                            <span className="text-sm font-medium font-pretendard text-gray-300">
                              {assigneeInfo.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Due Date */}
                    {task.dueDate && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <Calendar
                            size={18}
                            className="text-gray-300 flex-shrink-0"
                          />
                          <span className="text-sm font-semibold font-pretendard text-gray-300">
                            마감일
                          </span>
                        </div>
                        <div className="text-right min-w-0">
                          <div className="font-medium text-sm font-pretendard text-gray-300">
                            {task.dueDate
                              ? format(toDate(task.dueDate), 'yyyy년 M월 d일')
                              : '날짜 정보 없음'}
                          </div>
                          <div className="text-xs text-gray-400 font-pretendard">
                            {task.dueDate
                              ? formatDistanceToNow(toDate(task.dueDate), {
                                  addSuffix: true,
                                  locale: ko,
                                })
                              : ''}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Location */}
                    {task.location && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <MapPin
                            size={18}
                            className="text-gray-300 flex-shrink-0"
                          />
                          <span className="text-sm font-semibold font-pretendard text-gray-300">
                            장소
                          </span>
                        </div>
                        <span className="text-sm font-medium font-pretendard text-right min-w-0 break-words text-gray-300">
                          {typeof task.location === 'string'
                            ? task.location
                            : task.location?.address || '위치 정보 없음'}
                        </span>
                      </div>
                    )}

                    {/* Recurring */}
                    {task.recurring?.enabled && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <Repeat
                            size={18}
                            className="text-gray-300 flex-shrink-0"
                          />
                          <span className="text-sm font-semibold font-pretendard text-gray-300">
                            반복
                          </span>
                        </div>
                        <span className="text-sm font-medium font-pretendard text-right text-gray-300">
                          {task.recurring.interval}{' '}
                          {task.recurring.frequency === 'daily'
                            ? '일'
                            : task.recurring.frequency === 'weekly'
                            ? '주'
                            : task.recurring.frequency === 'monthly'
                            ? '개월'
                            : '년'}
                          마다
                        </span>
                      </div>
                    )}

                    {/* Estimated Time */}
                    {task.estimatedMinutes && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <Clock
                            size={18}
                            className="text-gray-300 flex-shrink-0"
                          />
                          <span className="text-sm font-semibold font-pretendard text-gray-300">
                            예상 시간
                          </span>
                        </div>
                        <span className="text-sm font-medium font-pretendard text-gray-300">
                          {task.estimatedMinutes}분
                        </span>
                      </div>
                    )}

                    {/* Attachments */}
                    {task.attachments && task.attachments.length > 0 && (
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                          <FileText
                            size={18}
                            className="text-gray-300 flex-shrink-0"
                          />
                          <span className="text-sm font-semibold font-pretendard text-gray-300">
                            첨부파일 ({task.attachments.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {task.attachments.map(attachment => (
                            <div
                              key={attachment.id}
                              className="flex items-center gap-3 p-2 bg-white/10 rounded-lg"
                            >
                              {attachment.isImage && attachment.thumbnailUrl ? (
                                <img
                                  src={attachment.thumbnailUrl}
                                  alt={attachment.fileName}
                                  className="w-8 h-8 rounded object-cover"
                                />
                              ) : (
                                <FileText size={16} className="text-gray-400" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-300 truncate">
                                  {attachment.fileName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {Math.round(attachment.fileSize / 1024)}KB
                                </div>
                              </div>
                              <a
                                href={attachment.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-sm"
                              >
                                다운로드
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* URLs */}
                    {task.urls && task.urls.length > 0 && (
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                          <Link
                            size={18}
                            className="text-gray-300 flex-shrink-0"
                          />
                          <span className="text-sm font-semibold font-pretendard text-gray-300">
                            관련 링크 ({task.urls.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {task.urls.map(url => (
                            <div
                              key={url.id}
                              className="p-2 bg-white/10 rounded-lg"
                            >
                              <a
                                href={url.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 font-medium text-sm block mb-1"
                              >
                                {url.title || url.url}
                              </a>
                              {url.description && (
                                <div className="text-xs text-gray-500 mb-1">
                                  {url.description}
                                </div>
                              )}
                              <div className="text-xs text-gray-600">
                                {url.domain}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Actions - Desktop or Mobile Actions Tab */}
              {(!isMobile || activeTab === 'actions') && (
                <div className="p-4 sm:p-6 lg:p-8 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 shadow-lg">
                  <h3 className="text-lg sm:text-xl font-bold mb-6 font-pretendard text-white flex items-center gap-2">
                    <Edit size={20} />
                    빠른 작업
                  </h3>

                  <div className="space-y-3 sm:space-y-4">
                    <WaveButton
                      className="w-full justify-start font-pretendard p-3 sm:p-4 text-left hover:bg-white/10 transition-colors"
                      variant="ghost"
                      onClick={() => navigate(`/tasks/${task.id}/edit`)}
                      disabled={!canEdit}
                    >
                      <Edit size={18} className="text-blue-400" />
                      <span className="ml-3 font-medium text-gray-300">
                        할일 수정
                      </span>
                    </WaveButton>

                    <WaveButton
                      className="w-full justify-start font-pretendard p-3 sm:p-4 text-left hover:bg-white/10 transition-colors"
                      variant="ghost"
                      onClick={() => {
                        /* TODO: Implement duplicate */
                      }}
                    >
                      <Star size={18} className="text-purple-400" />
                      <span className="ml-3 font-medium text-gray-300">
                        할일 복제
                      </span>
                    </WaveButton>

                    <WaveButton
                      className="w-full justify-start font-pretendard p-3 sm:p-4 text-left hover:bg-white/10 transition-colors"
                      variant="ghost"
                      onClick={() => {
                        /* TODO: Implement share */
                      }}
                    >
                      <Bell size={18} className="text-amber-400" />
                      <span className="ml-3 font-medium text-gray-300">
                        알림 설정
                      </span>
                    </WaveButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default TaskDetailPage;
