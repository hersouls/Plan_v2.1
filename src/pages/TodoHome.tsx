import { format, isPast, isSameDay, isThisWeek, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  AlertTriangle,
  Calendar,
  CalendarRange,
  FileText,
  List,
  LogOut,
  Target,
  User as UserIcon,
  Users as UsersIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarComponent } from '../components/calendar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { QuickAddTask } from '../components/task/QuickAddTask';
import { TaskCard } from '../components/task/TaskCard';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { GlassCard } from '../components/ui/GlassCard';
import { WaveButton } from '../components/ui/WaveButton';
import { useToast } from '../components/ui/useToast';
// ResponsiveButton 경로 정정 또는 대체 (컴포넌트가 없으므로 임시 제거)
// import { ResponsiveButton } from '../components/ui/responsive/ResponsiveButton';
import logger from '@/lib/logger';
import { Typography } from '../components/ui/typography';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useGroup, useUserGroups } from '../hooks/useGroup';
import { useTasks } from '../hooks/useTasks';
import { FilterConfig, FilterUtils } from '../lib/design-tokens';
import { userService } from '../lib/firestore';
import { cn } from '../lib/utils';
import { Task } from '../types/task';
import type { User } from '../types/user';
import { toDate, toTimestamp } from '../utils/dateHelpers';

function TodoHome() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { currentGroup } = useData();
  const { groups: userGroups = [] } = useUserGroups();
  const { members: currentGroupMembers = [] } = useGroup({
    groupId: currentGroup?.id || null,
    loadMembers: true,
    loadStats: false,
  });
  const toast = useToast();
  const { t } = useTranslation();

  // 그룹 ID → 그룹명 매핑 (정확한 그룹명 표시)
  const groupIdToName = useMemo(() => {
    const map = new Map<string, string>();
    (userGroups || []).forEach(group => {
      if (group?.id) map.set(group.id, group.name || '그룹');
    });
    return map;
  }, [userGroups]);

  // 사용자 프로필 정보 상태
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

  // 사용자 프로필 정보 로드
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.uid) return;

      setProfileLoading(true);
      try {
        const profile = await userService.getUserProfile(user.uid);
        if (profile) {
          setUserProfile(profile as User);
        }
      } catch (error) {
        logger.error('home', '사용자 프로필 로드 실패', error);
        // 프로필 로드 실패 시 Auth 정보만 사용
        setUserProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    loadUserProfile();
  }, [user?.uid]);

  // 개인 할일 가져오기
  const {
    tasks: personalTasks,
    loading: personalLoading,
    error: personalError,
    createTask,
    toggleTaskComplete,
    deleteTask,
  } = useTasks({
    realtime: true,
    limit: 50,
  });

  // 그룹 할일 가져오기
  const {
    tasks: groupTasks,
    loading: groupLoading,
    error: groupError,
  } = useTasks({
    groupId: currentGroup?.id,
    realtime: true,
    limit: 50,
  });

  // 모든 할일 합치기 (중복 제거)
  const allTasks = useMemo(() => {
    const combinedTasks = [...personalTasks, ...groupTasks];
    const uniqueTasks = new Map<string, Task>();

    combinedTasks.forEach(task => {
      if (!uniqueTasks.has(task.id)) {
        uniqueTasks.set(task.id, task);
      }
    });

    return Array.from(uniqueTasks.values());
  }, [personalTasks, groupTasks]);
  const loading = personalLoading || groupLoading || profileLoading;
  const error = personalError || groupError;

  const [viewFilter, setViewFilter] = useState<'all' | 'today' | 'week'>(
    FilterConfig.defaults.timeFilter
  );
  //
  const [taskVisibility, setTaskVisibility] = useState<
    'personal' | 'group' | 'all'
  >(FilterConfig.defaults.visibilityFilter);

  // 캘린더에서 선택된 날짜 (선택 시 해당 날짜 기준으로 목록 필터)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Filter tasks based on view

  const overdueTasks = allTasks.filter(task => {
    if (!task.dueDate || task.status === 'completed') return false;
    try {
      return isPast(toDate(task.dueDate));
    } catch (error) {
      logger.warn('home', 'Invalid dueDate for task', {
        id: task.id,
        due: task.dueDate,
        error,
      });
      return false;
    }
  });

  // 할일 가시성에 따른 필터링
  const filteredTasks = useMemo(() => {
    let result;
    switch (taskVisibility) {
      case 'personal':
        result = allTasks.filter(
          task => !task.groupId || task.groupId === 'personal'
        );
        break;
      case 'group':
        // currentGroup이 없어도 그룹 할일을 표시할 수 있도록 수정
        if (currentGroup) {
          result = allTasks.filter(task => task.groupId === currentGroup.id);
        } else {
          // currentGroup이 없으면 개인 할일이 아닌 모든 할일을 그룹 할일로 표시
          result = allTasks.filter(
            task => task.groupId && task.groupId !== 'personal'
          );
        }
        break;
      case 'all':
        result = allTasks;
        break;
      default:
        result = allTasks;
    }

    return result;
  }, [taskVisibility, allTasks, currentGroup]);

  const displayTasks = useMemo(() => {
    // 먼저 가시성에 따른 필터링 적용
    let tasks = filteredTasks;

    // 시간 필터 적용
    switch (viewFilter) {
      case 'today':
        tasks = tasks.filter(task => {
          if (!task.dueDate) return false;
          try {
            const taskDate = toDate(task.dueDate);
            return (
              isToday(taskDate) ||
              (isPast(taskDate) && task.status !== 'completed')
            );
          } catch (error) {
            logger.warn('home', 'Invalid dueDate for task', {
              id: task.id,
              due: task.dueDate,
              error,
            });
            return false;
          }
        });
        break;
      case 'week':
        tasks = tasks.filter(task => {
          if (!task.dueDate) return false;
          try {
            return isThisWeek(toDate(task.dueDate));
          } catch (error) {
            logger.warn('home', 'Invalid dueDate for task', {
              id: task.id,
              due: task.dueDate,
              error,
            });
            return false;
          }
        });
        break;
      case 'all':
      default:
        // no-op
        break;
    }

    // 선택 날짜가 있으면 추가 필터로 적용(시간 필터 결과 위에 교차 적용)
    if (selectedDate) {
      tasks = tasks.filter(task => {
        if (!task?.dueDate) return false;
        try {
          return isSameDay(toDate(task.dueDate), selectedDate);
        } catch (error) {
          logger.warn('home', 'Invalid dueDate for task', {
            id: task?.id,
            due: task?.dueDate,
            error,
          });
          return false;
        }
      });
    }

    return tasks;
  }, [filteredTasks, viewFilter, selectedDate]);

  // 기본 정렬: 미완료 우선 → 마감일 가까운 순 → 우선순위(high>medium>low)
  const sortedDisplayTasks = useMemo(() => {
    const priorityWeight = (p?: Task['priority']) =>
      p === 'high' ? 2 : p === 'medium' ? 1 : 0;

    const getDueTime = (t: Task) =>
      t.dueDate ? toDate(t.dueDate).getTime() : Number.POSITIVE_INFINITY;

    const list = [...displayTasks];
    list.sort((a, b) => {
      const aCompleted = a.status === 'completed';
      const bCompleted = b.status === 'completed';
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;

      const aDue = getDueTime(a);
      const bDue = getDueTime(b);
      if (aDue !== bDue) return aDue - bDue;

      const aPr = priorityWeight(a.priority);
      const bPr = priorityWeight(b.priority);
      if (aPr !== bPr) return bPr - aPr;

      return 0;
    });
    return list;
  }, [displayTasks]);

  // 통합된 통계 계산 - 필터링된 할일 기준
  const stats = useMemo(() => {
    const filteredOverdueTasks = filteredTasks.filter(task => {
      if (!task.dueDate || task.status === 'completed') return false;
      try {
        return isPast(toDate(task.dueDate));
      } catch (error) {
        logger.warn('home', 'Invalid dueDate for task', {
          id: task.id,
          due: task.dueDate,
          error,
        });
        return false;
      }
    });

    return {
      total: filteredTasks.length,
      completed: filteredTasks.filter(task => task.status === 'completed')
        .length,
      pending: filteredTasks.filter(task => task.status === 'pending').length,
      inProgress: filteredTasks.filter(task => task.status === 'in_progress')
        .length,
      overdue: filteredOverdueTasks.length,
      completionRate:
        filteredTasks.length > 0
          ? Math.round(
              (filteredTasks.filter(task => task.status === 'completed')
                .length /
                filteredTasks.length) *
                100
            )
          : 0,
    };
  }, [filteredTasks]);

  type QuickAddTaskInput = {
    title: string;
    description?: string;
    priority?: Task['priority'];
    category?: Task['category'];
    dueDate?: string | Date | null | undefined;
    assigneeId?: string;
    tags?: string[];
    taskType?: 'personal' | 'group';
    groupId?: string;
  };
  const handleTaskCreate = async (taskData: QuickAddTaskInput) => {
    if (!user) {
      toast.info('로그인이 필요합니다.');
      return;
    }

    try {
      // 그룹 ID 결정: taskVisibility에 따라 결정
      let groupId = 'personal';
      if (taskVisibility === 'group' && currentGroup) {
        groupId = currentGroup.id;
      } else if (taskVisibility === 'all') {
        // 전체 보기에서는 기본적으로 개인 할일로 생성
        groupId = 'personal';
      }

      // dueDate 변환 (string/Date → Timestamp)
      const dueTs = toTimestamp(taskData.dueDate ?? undefined);

      await createTask({
        taskType: groupId === 'personal' ? 'personal' : 'group',
        groupId: groupId === 'personal' ? undefined : groupId,
        userId: user.uid,
        assigneeId: taskData.assigneeId || user.uid,
        title: taskData.title,
        description: taskData.description,
        priority: (taskData.priority as Task['priority']) || 'medium',
        category: (taskData.category as Task['category']) || 'personal',
        dueDate: dueTs,
        tags: taskData.tags || [],
      });

      // 성공 피드백 개선
      const visibilityText =
        groupId === 'personal'
          ? t('tasks.personal', { defaultValue: '나만 보는 할일' })
          : t('tasks.group', { defaultValue: '그룹 할일' });
      const successMessage = `✅ "${taskData.title}" ${visibilityText}이 추가되었습니다!`;
      logger.info('home', successMessage);
      toast.success(successMessage);
    } catch (error) {
      logger.error('home', 'Failed to create task', error);
      // 에러 피드백 개선
      const errorMessage = '❌ 할일 생성에 실패했습니다. 다시 시도해주세요.';
      logger.error('home', errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleTaskToggle = async (taskId: string) => {
    try {
      await toggleTaskComplete(taskId);
    } catch (error) {
      toast.error('할일 상태 변경에 실패했습니다.');
      logger.error('home', 'Failed to toggle task', error);
    }
  };

  const handleTaskEdit = (task: Task) => {
    navigate(`/tasks/${task.id}/edit`);
  };

  const handleTaskDelete = async (taskId: string) => {
    setDeleteTarget(taskId);
    setDeleteOpen(true);
  };

  const handleTaskDetail = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  // 캘린더 관련 핸들러
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddTaskFromCalendar = () => {
    // 할일 생성 페이지로 이동
    navigate('/tasks/create');
  };

  // 로그아웃 핸들러
  // 사용자 표시 이름 가져오기
  const getUserDisplayName = () => {
    // 1. Firestore 프로필에서 displayName 확인
    if (userProfile?.displayName) {
      return userProfile.displayName;
    }

    // 2. Auth의 displayName 확인
    if (user?.displayName) {
      return user.displayName;
    }

    // 3. 이메일에서 @ 앞부분 추출
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      return emailName;
    }

    // 4. 기본값
    return '사용자';
  };

  const handleLogout = async () => {
    setLogoutOpen(true);
  };

  if (error) {
    return (
      <div className="min-h-screen">
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <GlassCard variant="medium" className="p-8 text-center max-w-md mx-4">
            <div className="space-y-4">
              <div className="flex justify-center">
                <AlertTriangle className="h-16 w-16 text-red-600" />
              </div>
              <Typography.H3 className="text-red-600 font-pretendard tracking-ko-tight">
                오류 발생
              </Typography.H3>
              <Typography.Body className="text-gray-700 font-pretendard leading-ko-normal">
                {typeof error === 'string' ? error : String(error)}
              </Typography.Body>
              <WaveButton
                onClick={() => window.location.reload()}
                className="w-full"
              >
                다시 시도
              </WaveButton>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" text="할일 목록을 불러오는 중..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteTask(deleteTarget);
            toast.success(t('common.success'));
          } catch (error) {
            toast.error(t('common.error'));
            logger.error('home', 'Failed to delete task', error);
          } finally {
            setDeleteOpen(false);
            setDeleteTarget(null);
          }
        }}
        title={t('common.delete', { defaultValue: '삭제 확인' })}
        description={t('tasks.deleteTask', {
          defaultValue:
            '정말로 이 할일을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
        })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        danger
      />

      <ConfirmDialog
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={async () => {
          try {
            await signOut();
            navigate('/login');
          } catch (error) {
            logger.error('home', '로그아웃 중 오류가 발생했습니다', error);
            toast.error(t('common.error'));
          } finally {
            setLogoutOpen(false);
          }
        }}
        title={t('auth.logout')}
        description={t('auth.confirmLogout', {
          defaultValue: '정말로 로그아웃하시겠습니까?',
        })}
        confirmText={t('auth.logout')}
        cancelText={t('common.cancel')}
      />
      {/* 1. 메인 페이지 컨테이너 */}
      <div
        className="relative z-10 max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-12 xl:py-16"
        style={{ paddingTop: 'var(--app-header-offset)' }}
      >
        {/* 2. 히어로 섹션 컨테이너 */}
        <div className="mb-8 lg:mb-12 xl:mb-16">
          {/* 3. 히어로 카드 */}
          <GlassCard
            variant="medium"
            className="p-6 sm:p-8 lg:p-10 xl:p-12 2xl:p-16 relative overflow-visible"
          >
            {/* 로그아웃 버튼 - 오른쪽 상단 모서리 */}
            <div className="absolute top-4 right-4 z-50">
              <WaveButton
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 font-pretendard flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm border border-white/20 shadow-lg"
                aria-label="로그아웃"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline text-sm">
                  {t('auth.logout')}
                </span>
              </WaveButton>
            </div>
            {/* 4. 히어로 헤더 컨테이너 */}
            <div className="relative mb-6 lg:mb-8 xl:mb-12 pt-6 md:pt-8 lg:pt-10 xl:pt-12">
              {/* 상단 헤더 영역 - 제목과 버전만 */}
              <div className="flex items-center gap-3 lg:gap-4 xl:gap-6">
                {/* 7. 메인 제목 텍스트 */}
                <Typography.H2 className="text-white font-pretendard tracking-ko-tight text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl">
                  Moonwave Plan
                </Typography.H2>
                {/* 8. 버전 배지 */}
                <span className="bg-gradient-to-r from-primary-500 to-primary-700 text-white px-3 py-1 lg:px-4 lg:py-2 xl:px-5 xl:py-2.5 rounded-full text-sm lg:text-base xl:text-lg font-medium font-pretendard">
                  v1.0
                </span>
              </div>

              {/* 5. 히어로 텍스트 컨테이너 */}
              <div
                className={cn(
                  'mb-6 lg:mb-0',
                  // 모바일에서는 버튼과 겹치지 않도록 상단 여백 추가
                  'pt-0'
                )}
              >
                {/* 9. 인사말 텍스트 컨테이너 */}
                <div className="mb-2 lg:mb-3 xl:mb-4">
                  {/* 인사말 텍스트 */}
                  <Typography.BodyLarge className="text-white font-pretendard leading-ko-relaxed text-base sm:text-lg lg:text-xl xl:text-2xl">
                    안녕하세요, {getUserDisplayName()}님! 오늘도 화이팅! 💪
                  </Typography.BodyLarge>
                </div>

                {/* 10. 날짜 텍스트 - 모바일에서는 숨김, 데스크톱에서만 표시 */}
                <Typography.BodySmall className="hidden md:block text-white/80 font-pretendard text-sm sm:text-base lg:text-lg xl:text-xl">
                  {format(new Date(), 'yyyy년 M월 d일 EEEE', { locale: ko })}
                </Typography.BodySmall>

                {/* 모바일용 날짜 텍스트와 버튼 그룹 */}
                <div className="md:hidden space-y-6">
                  {/* 모바일용 날짜 텍스트 */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <Typography.BodySmall className="text-white/90 font-pretendard text-sm sm:text-base text-center font-medium">
                      {format(new Date(), 'yyyy년 M월 d일 EEEE', {
                        locale: ko,
                      })}
                    </Typography.BodySmall>
                  </div>

                  {/* 모바일용 할일 보기 모드 버튼 그룹 */}
                  <div className="flex justify-center gap-2 sm:gap-2.5 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg">
                    {FilterUtils.getVisibilityFilterOptions().map(
                      filterOption => {
                        const IconComponent =
                          filterOption.icon === 'User'
                            ? UserIcon
                            : filterOption.icon === 'Users'
                            ? UsersIcon
                            : filterOption.icon === 'List'
                            ? List
                            : UserIcon;

                        return (
                          // ResponsiveButton 대체: 아이콘 버튼 형태 유지
                          <button
                            key={filterOption.key}
                            onClick={() =>
                              setTaskVisibility(
                                filterOption.key as 'personal' | 'group' | 'all'
                              )
                            }
                            className={cn(
                              'font-pretendard',
                              // 반응형 패딩: 모바일은 더 작게
                              'px-2 py-1.5 sm:px-2.5 sm:py-2',
                              // 반응형 최소 너비: 모바일은 더 작게
                              'min-w-[32px] sm:min-w-[36px]',
                              // 반응형 최소 높이: 모바일은 더 작게
                              'min-h-[28px] sm:min-h-[32px]',
                              // 애니메이션
                              'transition-all duration-300 ease-out',
                              // 글래스 효과 - 더 강한 배경으로 가시성 향상
                              'backdrop-blur-md border border-white/30',
                              'shadow-xl hover:shadow-2xl',
                              // 포커스 상태 개선
                              'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-transparent',
                              // 선택 상태 스타일
                              taskVisibility === filterOption.key
                                ? 'bg-blue-500/90 text-white shadow-xl ring-2 ring-blue-400/60 scale-105'
                                : 'bg-white/15 text-white/90 hover:bg-white/25 hover:text-white hover:shadow-xl hover:scale-105'
                            )}
                            aria-label={FilterUtils.getFilterAriaLabel(
                              'visibility',
                              filterOption.key,
                              taskVisibility === filterOption.key
                            )}
                            aria-pressed={taskVisibility === filterOption.key}
                          >
                            <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                            {/* 모바일용 툴팁 역할의 aria-label */}
                            <span className="sr-only">
                              {filterOption.label}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 13.5. 할일 가시성 옵션 카드 - 통계 영역 위에 배치 */}
            <div className="mb-4 lg:mb-6 xl:mb-8">
              <div className="flex justify-center md:justify-end gap-2 sm:gap-3 lg:gap-4">
                {FilterUtils.getVisibilityFilterOptions().map(filterOption => {
                  return (
                    <button
                      key={filterOption.key}
                      onClick={() =>
                        setTaskVisibility(
                          filterOption.key as 'personal' | 'group' | 'all'
                        )
                      }
                      className={cn(
                        'font-pretendard',
                        // 반응형 패딩 - 모바일에서는 더 작게
                        'px-2 py-1.5 sm:px-3 sm:py-2 md:px-5 md:py-3 lg:px-6 lg:py-3.5',
                        // 반응형 최소 너비 - 모바일에서는 더 작게
                        'min-w-[32px] sm:min-w-[36px] md:min-w-[48px] lg:min-w-[56px] xl:min-w-[60px]',
                        // 반응형 최소 높이 - 모바일에서는 더 작게
                        'min-h-[28px] sm:min-h-[32px] md:min-h-[40px] lg:min-h-[44px] xl:min-h-[48px]',
                        // 애니메이션
                        'transition-all duration-300 ease-out',
                        // 글래스 효과
                        'backdrop-blur-md border border-white/30',
                        'shadow-xl hover:shadow-2xl',
                        // 포커스 상태
                        'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-transparent',
                        // 선택 상태 스타일
                        taskVisibility === filterOption.key
                          ? 'bg-blue-500/90 text-white shadow-xl ring-2 ring-blue-400/60 scale-105'
                          : 'bg-white/15 text-white/90 hover:bg-white/25 hover:text-white hover:shadow-xl hover:scale-105'
                      )}
                      aria-label={FilterUtils.getFilterAriaLabel(
                        'visibility',
                        filterOption.key,
                        taskVisibility === filterOption.key
                      )}
                      aria-pressed={taskVisibility === filterOption.key}
                    >
                      {/* 반응형 텍스트 */}
                      <span
                        className={cn(
                          'font-medium',
                          'hidden md:inline', // md 크기부터만 텍스트 표시 (모바일에서는 숨김)
                          'text-xs sm:text-sm md:text-base lg:text-lg'
                        )}
                      >
                        {filterOption.label}
                      </span>

                      {/* 모바일용 툴팁 역할의 aria-label */}
                      <span className="sr-only">{filterOption.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 14. 통계 그리드 컨테이너 */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 xl:gap-8 mb-6 lg:mb-8 xl:mb-12">
              {/* 15. 전체 할일 통계 카드 */}
              <GlassCard
                variant="light"
                className="text-center p-4 sm:p-5 lg:p-6 xl:p-8 rounded-xl bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 ease-out"
              >
                {/* 16. 전체 할일 수 텍스트 */}
                <Typography.H3 className="text-primary-600 font-pretendard font-bold text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl">
                  {stats.total}
                </Typography.H3>
                {/* 17. 전체 할일 라벨 텍스트 */}
                <Typography.BodySmall className="text-gray-600 font-pretendard text-xs sm:text-sm lg:text-base xl:text-lg">
                  전체 할일
                </Typography.BodySmall>
              </GlassCard>
              {/* 18. 완료 통계 카드 */}
              <GlassCard
                variant="light"
                className="text-center p-4 sm:p-5 lg:p-6 xl:p-8 rounded-xl border-l-4 border-green-500 bg-white border-2 shadow-lg hover:shadow-xl transition-all duration-300 ease-out"
              >
                {/* 19. 완료 수 텍스트 */}
                <Typography.H3 className="text-green-600 font-pretendard font-bold text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl">
                  {stats.completed}
                </Typography.H3>
                {/* 20. 완료 라벨 텍스트 */}
                <Typography.BodySmall className="text-gray-600 font-pretendard text-xs sm:text-sm lg:text-base xl:text-lg">
                  완료
                </Typography.BodySmall>
              </GlassCard>
              {/* 21. 진행중 통계 카드 */}
              <GlassCard
                variant="light"
                className="text-center p-4 sm:p-5 lg:p-6 xl:p-8 rounded-xl border-l-4 border-blue-500 bg-white border-2 shadow-lg hover:shadow-xl transition-all duration-300 ease-out"
              >
                {/* 22. 진행중 수 텍스트 */}
                <Typography.H3 className="text-primary-600 font-pretendard font-bold text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl">
                  {stats.inProgress}
                </Typography.H3>
                {/* 23. 진행중 라벨 텍스트 */}
                <Typography.BodySmall className="text-gray-600 font-pretendard text-xs sm:text-sm lg:text-base xl:text-lg">
                  진행중
                </Typography.BodySmall>
              </GlassCard>
              {/* 24. 지연 통계 카드 */}
              <GlassCard
                variant="light"
                className="text-center p-4 sm:p-5 lg:p-6 xl:p-8 rounded-xl border-l-4 border-red-500 bg-white border-2 shadow-lg hover:shadow-xl transition-all duration-300 ease-out"
              >
                {/* 25. 지연 수 텍스트 */}
                <Typography.H3 className="text-red-600 font-pretendard font-bold text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl">
                  {stats.overdue}
                </Typography.H3>
                {/* 26. 지연 라벨 텍스트 */}
                <Typography.BodySmall className="text-gray-600 font-pretendard text-xs sm:text-sm lg:text-base xl:text-lg">
                  지연
                </Typography.BodySmall>
              </GlassCard>
            </div>

            {/* 27. 진행률 컨테이너 */}
            <div className="space-y-3 lg:space-y-4 xl:space-y-6">
              {/* 28. 진행률 헤더 컨테이너 */}
              <div className="flex items-center justify-between">
                {/* 29. 진행률 라벨 텍스트 */}
                <Typography.BodySmall
                  className="font-medium font-pretendard text-sm sm:text-base lg:text-lg xl:text-xl"
                  style={{ color: 'var(--semantic-text-primary)' }}
                >
                  {t('statistics.taskCompletion')}
                </Typography.BodySmall>
                {/* 30. 진행률 퍼센트 텍스트 */}
                <Typography.BodySmall
                  className="font-pretendard text-sm sm:text-base lg:text-lg xl:text-xl font-bold"
                  style={{ color: 'var(--semantic-text-primary)' }}
                >
                  {stats.completionRate}%
                </Typography.BodySmall>
              </div>

              {/* 31. 진행률 바 컨테이너 */}
              <div className="w-full bg-gray-700/50 rounded-full h-3 sm:h-4 lg:h-5 xl:h-6 overflow-hidden">
                {/* 32. 진행률 바 */}
                <div
                  className="bg-gradient-to-r from-primary-500 to-primary-700 h-3 sm:h-4 lg:h-5 xl:h-6 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* 33. 빠른 추가 섹션 컨테이너 */}
        <div id="quick-add-task" className="mb-8 lg:mb-12 xl:mb-16">
          <QuickAddTask
            onAdd={handleTaskCreate}
            groupMembers={
              currentGroup
                ? (() => {
                    const deduped: Record<
                      string,
                      { id: string; name: string; avatar?: string }
                    > = {};
                    (currentGroupMembers || []).forEach(m => {
                      const id = m.userId;
                      if (!id || deduped[id]) return;
                      deduped[id] = {
                        id,
                        name: m.userName || m.displayName || '멤버',
                        avatar: m.avatar || undefined,
                      };
                    });
                    return Object.values(deduped);
                  })()
                : []
            }
            groups={userGroups.map(group => ({
              id: group.id,
              name: group.name,
            }))}
            defaultAssigneeId={user?.uid}
          />
        </div>

        {/* 34. 할일 섹션 컨테이너 */}
        <div className="mb-8 lg:mb-12 xl:mb-16">
          {/* 35. 할일 섹션 헤더 컨테이너 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8 xl:mb-12 gap-4 lg:gap-6">
            {/* 36. 할일 섹션 제목 텍스트 */}
            <Typography.H3 className="text-white font-pretendard font-semibold tracking-ko-tight text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl">
              {(() => {
                const visibilityOption = FilterUtils.getFilterOption(
                  'visibility',
                  taskVisibility
                );
                const visibilityText = visibilityOption?.label || '할일';

                const timeText =
                  viewFilter === 'today'
                    ? FilterUtils.getFilterLabel('time', 'today') + '의'
                    : viewFilter === 'week'
                    ? FilterUtils.getFilterLabel('time', 'week')
                    : '';

                return `${timeText} ${visibilityText}`;
              })()}
            </Typography.H3>
            {/* 37. 필터 버튼 그룹 컨테이너 */}
            <div className="flex gap-2 sm:gap-3 lg:gap-4 flex-wrap items-center">
              {FilterUtils.getTimeFilterOptions().map(filterOption => {
                const IconComponent =
                  filterOption.icon === 'Calendar'
                    ? Calendar
                    : filterOption.icon === 'CalendarRange'
                    ? CalendarRange
                    : filterOption.icon === 'List'
                    ? List
                    : List;

                return (
                  <WaveButton
                    key={filterOption.key}
                    variant={
                      viewFilter === filterOption.key ? 'primary' : 'ghost'
                    }
                    size="sm"
                    onClick={() => {
                      // 시간 필터를 수동 변경 시, 선택 날짜 초기화
                      setSelectedDate(null);
                      setViewFilter(
                        filterOption.key as 'all' | 'today' | 'week'
                      );
                    }}
                    className={cn(
                      'font-pretendard px-3 sm:px-4 lg:px-5 xl:px-6 py-2 lg:py-2.5 xl:py-3',
                      'text-xs sm:text-sm lg:text-base xl:text-lg',
                      'min-w-[60px] sm:min-w-[70px] lg:min-w-[80px] xl:min-w-[90px]',
                      'min-h-[36px] sm:min-h-[40px] lg:min-h-[44px] xl:min-h-[48px]',
                      'flex items-center justify-center gap-1 sm:gap-2',
                      'truncate overflow-hidden',
                      'transition-all duration-200',
                      'text-white',
                      viewFilter === filterOption.key
                        ? 'ring-1 ring-primary-400/30 shadow-md bg-white/20'
                        : 'hover:bg-white/10 hover:shadow-md'
                    )}
                    aria-label={FilterUtils.getFilterAriaLabel(
                      'time',
                      filterOption.key,
                      viewFilter === filterOption.key
                    )}
                    aria-pressed={viewFilter === filterOption.key}
                  >
                    <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 flex-shrink-0" />
                    <span className="truncate">{filterOption.label}</span>
                  </WaveButton>
                );
              })}
              {selectedDate && (
                <WaveButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(null)}
                  className="font-pretendard px-3 py-2 text-white/80 hover:text-white hover:bg-white/10"
                  aria-label="선택 날짜 해제"
                >
                  선택 날짜 해제
                </WaveButton>
              )}
            </div>
          </div>

          {/* 41. 지연 할일 알림 컨테이너 */}
          {stats.overdue > 0 && (
            <div className="mb-6">
              {/* 42. 지연 할일 알림 카드 */}
              <GlassCard
                variant="light"
                className="p-3 sm:p-4 lg:p-5 border-l-2 border-orange-300 backdrop-blur-sm bg-background/95 border-2 border-white/20 shadow-md hover:shadow-lg transition-all duration-300 ease-out"
                role="alert"
                aria-label={`${overdueTasks.length}개의 지연된 할일이 있습니다. 주의가 필요합니다.`}
              >
                {/* 43. 지연 할일 알림 내용 컨테이너 */}
                <div className="flex items-center gap-2 sm:gap-3 text-orange-400">
                  <Target size={16} className="sm:w-5 sm:h-5" />
                  {/* 44. 지연 할일 알림 텍스트 */}
                  <Typography.BodySmall className="font-medium font-pretendard">
                    {stats.overdue}개의 지연된 할일이 있습니다
                  </Typography.BodySmall>
                </div>
              </GlassCard>
            </div>
          )}

          {/* 45. 할일 목록 컨테이너 */}
          {displayTasks.length === 0 ? (
            /* 46. 빈 상태 카드 */
            <GlassCard
              variant="light"
              className="p-8 lg:p-12 text-center backdrop-blur-sm bg-background/95 border-2 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 ease-out"
            >
              {/* 47. 빈 상태 내용 컨테이너 */}
              <div className="space-y-6">
                {/* 48. 빈 상태 아이콘 컨테이너 */}
                <div className="flex justify-center">
                  <FileText className="h-20 w-20 text-gray-400" />
                </div>
                {/* 49. 빈 상태 텍스트 컨테이너 */}
                <div className="space-y-3">
                  {/* 50. 빈 상태 제목 텍스트 */}
                  <Typography.H4 className="text-white font-pretendard tracking-ko-tight">
                    {FilterUtils.getFilterDescription(
                      'visibility',
                      taskVisibility
                    ) || '할일이 없습니다'}
                  </Typography.H4>
                  {/* 51. 빈 상태 설명 텍스트 */}
                  <Typography.Body className="text-white/70 font-pretendard leading-ko-normal text-center">
                    {(() => {
                      const baseMessage =
                        '새로운 할일을 추가해서 시작해보세요!';
                      if (taskVisibility === 'personal') {
                        return '새로운 개인 할일을 추가해서 시작해보세요!';
                      } else if (taskVisibility === 'group') {
                        return `새로운 ${
                          currentGroup?.name || '그룹'
                        } 할일을 추가해서 시작해보세요!`;
                      }
                      return baseMessage;
                    })()}
                  </Typography.Body>
                  {/* 51-1. 사용법 가이드 */}
                  <details className="bg-background/20 backdrop-blur-sm rounded-lg p-3 sm:p-4 space-y-2 group">
                    <summary className="text-white/80 font-pretendard font-medium cursor-pointer hover:text-white transition-colors duration-200 list-none">
                      💡 빠른 할일 추가 팁 (클릭하여 펼치기)
                    </summary>
                    <div className="pt-2 space-y-1">
                      <ul className="text-xs sm:text-sm text-white/70 font-pretendard space-y-1">
                        <li>• "내일까지 장보기" - 기본 할일</li>
                        <li>• "!높음 내일까지 보고서 작성" - 우선순위 설정</li>
                        <li>• "@업무 회의 준비" - 카테고리 설정</li>
                        <li>• "#프로젝트A" - 태그 추가</li>
                        <li>
                          •{' '}
                          {(() => {
                            if (taskVisibility === 'personal') {
                              return '👤 버튼으로 개인 할일 생성';
                            } else if (taskVisibility === 'group') {
                              return '👥 버튼으로 그룹 할일 생성';
                            }
                            return '📝 버튼으로 할일 생성';
                          })()}
                        </li>
                      </ul>
                    </div>
                  </details>
                </div>
                {/* 52. 할일 추가 버튼 */}
                <WaveButton
                  onClick={() => {
                    const quickAdd = document.querySelector('#quick-add-task');
                    quickAdd?.scrollIntoView({ behavior: 'smooth' });
                    // 스크롤 후 입력창 자동 포커스 시도
                    setTimeout(() => {
                      const inputEl = document.querySelector(
                        '#quick-add-task input[type="text"]'
                      ) as HTMLInputElement | null;
                      inputEl?.focus();
                    }, 300);
                  }}
                  className="font-pretendard"
                >
                  {t('tasks.addTask')}
                </WaveButton>
              </div>
            </GlassCard>
          ) : (
            /* 53. 할일 카드 목록 컨테이너 */
            <div className="space-y-3 sm:space-y-4 lg:space-y-5 xl:space-y-6">
              {sortedDisplayTasks
                .filter(task => task && task.id) // Filter out undefined or invalid tasks
                .map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={handleTaskToggle}
                    onEdit={handleTaskEdit}
                    onDelete={handleTaskDelete}
                    onDetail={handleTaskDetail}
                    groupName={
                      task.groupId && task.groupId !== 'personal'
                        ? groupIdToName.get(task.groupId) || '그룹'
                        : undefined
                    }
                  />
                ))}
            </div>
          )}

          {/* 45-1. 지연된 할일 별도 섹션 제거(중복 노출 방지). 메인 목록에서 정렬/배지로 강조합니다. */}

          {/* 54. 캘린더 섹션 컨테이너 */}
          <div className="mt-16 lg:mt-20 xl:mt-24 mb-8 lg:mb-12 xl:mb-16">
            <CalendarComponent
              tasks={filteredTasks}
              onDateSelect={handleDateSelect}
              onAddTask={handleAddTaskFromCalendar}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TodoHome;
