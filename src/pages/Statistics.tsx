import { format, startOfWeek, subDays } from 'date-fns';
import { Award, Clock, Star, Trophy, Users, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
//
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatisticsInsights } from '../components/statistics/StatisticsInsights';
import { GlassCard } from '../components/ui/GlassCard';
import { AvatarWrapper } from '../components/ui/avatar';
import getAvatarInitials from '../components/ui/avatar.utils';
import { Typography } from '../components/ui/typography';
import { useAuth } from '../contexts/AuthContext';
import { useGroup, useUserGroups } from '../hooks/useGroup';
import { useTasks } from '../hooks/useTasks';
import { FilterUtils } from '../lib/design-tokens';
import { logger } from '../lib/logger';
import { PointStats, pointsService } from '../lib/points';
import { statisticsAnalyzer } from '../lib/statisticsAnalyzer';
import { toDate } from '../utils/dateHelpers';

type DateRange = '7days' | '30days' | '3months' | 'year';

const COLORS = [
  '#9333ea',
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
];

function Statistics() {
  //
  const { user } = useAuth();
  const { groups } = useUserGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const {
    tasks,
    loading: tasksLoading,
    stats,
  } = useTasks({
    realtime: true,
    groupId: selectedGroupId || undefined,
  });
  const {
    group,
    members,
    loading: groupLoading,
  } = useGroup({
    groupId: selectedGroupId || undefined,
  });
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 포인트 통계 상태
  const [pointStats, setPointStats] = useState<Record<string, PointStats>>({});
  const [loadingPoints, setLoadingPoints] = useState<boolean>(false);
  //

  // 사용자 프로필 정보 상태
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  //

  // 즐겨찾기 그룹 관리
  const [favoriteGroups, setFavoriteGroups] = useState<string[]>([]);

  // 즐겨찾기 그룹 로드
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteGroups');
    if (savedFavorites) {
      try {
        setFavoriteGroups(JSON.parse(savedFavorites));
      } catch {
        logger.error('statistics', 'Failed to parse favorite groups');
        setFavoriteGroups([]);
      }
    }
  }, []);

  // 즐겨찾기 순으로 정렬된 그룹 목록
  const sortedGroups = useMemo(() => {
    if (!groups) return [];

    return [...groups].sort((a, b) => {
      const aIsFavorite = favoriteGroups.includes(a.id);
      const bIsFavorite = favoriteGroups.includes(b.id);

      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;

      // 즐겨찾기 상태가 같으면 이름순 정렬
      return a.name.localeCompare(b.name, 'ko');
    });
  }, [groups, favoriteGroups]);

  // Set first group as selected if available (즐겨찾기 우선)
  useEffect(() => {
    if (sortedGroups && sortedGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(sortedGroups[0].id);
    }
  }, [sortedGroups, selectedGroupId]);

  // 즐겨찾기 그룹 저장
  const saveFavoriteGroups = (favorites: string[]) => {
    localStorage.setItem('favoriteGroups', JSON.stringify(favorites));
    setFavoriteGroups(favorites);
  };

  // 즐겨찾기 토글
  const toggleFavorite = (groupId: string) => {
    const newFavorites = favoriteGroups.includes(groupId)
      ? favoriteGroups.filter(id => id !== groupId)
      : [...favoriteGroups, groupId];
    saveFavoriteGroups(newFavorites);
  };

  // 사용자 프로필 정보 로드
  useEffect(() => {
    if (!members || members.length === 0) return;

    const loadUserProfiles = async () => {
      try {
        const { enhancedUserService } = await import(
          '../lib/firestore-improved'
        );
        const profiles: Record<string, any> = {};

        for (const member of members) {
          try {
            const profile = await enhancedUserService.getUserProfile(
              member.userId
            );
            if (profile) {
              profiles[member.userId] = profile;
            }
          } catch {
            // noop
          }
        }

        setUserProfiles(profiles);
      } catch (_error) {
        logger.error('statistics', '사용자 프로필 로드 실패', _error);
      } finally {
        // no-op
      }
    };

    loadUserProfiles();
  }, [members]);

  // 포인트 통계 로드
  useEffect(() => {
    if (!selectedGroupId || !members || members.length === 0) return;

    const loadPointStats = async () => {
      setLoadingPoints(true);
      try {
        const statsPromises = members.map(async member => {
          try {
            const stats = await pointsService.getPointStats(
              member.userId,
              selectedGroupId
            );
            return { userId: member.userId, stats };
          } catch (error) {
            logger.error(
              'statistics',
              `포인트 통계 로드 실패 (${member.userId})`,
              error
            );
            return { userId: member.userId, stats: null };
          }
        });

        const results = await Promise.all(statsPromises);
        const statsMap = results.reduce((acc, { userId, stats }) => {
          if (stats) {
            acc[userId] = stats;
          }
          return acc;
        }, {} as Record<string, PointStats>);

        setPointStats(statsMap);
      } catch (_error) {
        logger.error('statistics', '포인트 통계 로드 실패', _error);
      } finally {
        setLoadingPoints(false);
      }
    };

    loadPointStats();
  }, [selectedGroupId, members]);

  const loading = tasksLoading || groupLoading;

  // Generate chart data from real tasks (구성원 필터 반영)
  const chartData = useMemo(() => {
    const filteredTasks =
      selectedMemberId === 'ALL'
        ? tasks || []
        : (tasks || []).filter(t => t.assigneeId === selectedMemberId);

    if (!filteredTasks || filteredTasks.length === 0) {
      // Return empty data structure
      return {
        dailyData: [],
        categoryData: [],
        weeklyData: [],
        memberData: [],
      };
    }

    const now = new Date();
    const days =
      dateRange === '7days'
        ? 7
        : dateRange === '30days'
        ? 30
        : dateRange === '3months'
        ? 90
        : 365;

    // Daily completion data from real tasks
    const dailyData = Array.from({ length: Math.min(days, 30) }, (_, i) => {
      const date = subDays(now, days - 1 - i);
      const dateStr = format(date, 'yyyy-MM-dd');

      const dayTasks = filteredTasks.filter(task => {
        if (!task.createdAt) return false;
        try {
          const taskDate = format(toDate(task.createdAt), 'yyyy-MM-dd');
          return taskDate === dateStr;
        } catch {
          logger.warn('statistics', 'Invalid createdAt date', task.createdAt);
          return false;
        }
      });

      const completedTasks = dayTasks.filter(task => {
        if (task.status !== 'completed' || !task.completedAt) return false;
        try {
          const completedDate = format(toDate(task.completedAt), 'yyyy-MM-dd');
          return completedDate === dateStr;
        } catch {
          logger.warn(
            'statistics',
            'Invalid completedAt date',
            task.completedAt
          );
          return false;
        }
      });

      return {
        date: format(date, 'MM/dd'),
        fullDate: dateStr,
        completed: completedTasks.length,
        created: dayTasks.length,
      };
    });

    // Category distribution from real tasks
    const categoryCount = filteredTasks.reduce((acc, task) => {
      const category = task.category || '기타';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryCount).map(([name, count]) => ({
      name,
      value: Math.round((count / tasks.length) * 100),
      count,
    }));

    // Weekly comparison
    const weeklyData = Array.from({ length: 4 }, (_, i) => {
      const weekStart = subDays(startOfWeek(now), i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekTasks = filteredTasks.filter(task => {
        if (!task.createdAt) return false;
        const taskDate = toDate(task.createdAt);
        return taskDate >= weekStart && taskDate <= weekEnd;
      });

      const completedWeekTasks = weekTasks.filter(
        task => task.status === 'completed'
      );

      return {
        week: format(weekStart, 'MM/dd'),
        completed: completedWeekTasks.length,
        target: Math.max(10, Math.round(weekTasks.length * 0.8)), // 80% target
      };
    }).reverse();

    // Member performance from real data
    const memberData =
      members?.map(member => {
        const memberTasks = (tasks || []).filter(
          task => task.assigneeId === member.userId
        );
        const completedTasks = memberTasks.filter(
          task => task.status === 'completed'
        );
        const completionRate =
          memberTasks.length > 0
            ? Math.round((completedTasks.length / memberTasks.length) * 100)
            : 0;

        return {
          name: member.userName,
          completed: completedTasks.length,
          total: memberTasks.length,
          rate: completionRate,
        };
      }) || [];

    return { dailyData, categoryData, weeklyData, memberData };
  }, [dateRange, tasks, members, selectedMemberId]);

  const dateRangeOptions = FilterUtils.getDateRangeFilterOptions().map(
    option => ({
      value: option.key,
      label: option.label,
    })
  );

  // Calculate achievements based on real data
  const achievements = useMemo(() => {
    if (!tasks || !user) {
      return [
        {
          id: 1,
          title: '연속 완료 마스터',
          description: '7일 연속 할일 완료',
          icon: Zap,
          color: 'text-yellow-400',
          unlocked: false,
        },
        {
          id: 2,
          title: '생산성 킹',
          description: '한 달에 100개 할일 완료',
          icon: Trophy,
          color: 'text-purple-400',
          unlocked: false,
        },
        {
          id: 3,
          title: '팀워크 스타',
          description: '가족과 함께 50개 할일 완료',
          icon: Users,
          color: 'text-blue-400',
          unlocked: false,
        },
        {
          id: 4,
          title: '시간 관리의 달인',
          description: '지연 없이 30개 할일 완료',
          icon: Clock,
          color: 'text-green-400',
          unlocked: false,
        },
      ];
    }

    const userTasks = tasks.filter(task => task.assigneeId === user.uid);
    const completedTasks = userTasks.filter(
      task => task.status === 'completed'
    );
    const onTimeTasks = completedTasks.filter(task => {
      if (!task.dueDate || !task.completedAt) return true;
      return toDate(task.completedAt) <= toDate(task.dueDate);
    });

    // Check for 7-day streak (simplified)
    const hasStreak = completedTasks.length >= 7;

    // Check for monthly productivity
    const thisMonthCompleted = completedTasks.filter(task => {
      if (!task.completedAt) return false;
      const completedDate = toDate(task.completedAt);
      const now = new Date();
      return (
        completedDate.getMonth() === now.getMonth() &&
        completedDate.getFullYear() === now.getFullYear()
      );
    }).length;

    return [
      {
        id: 1,
        title: '연속 완료 마스터',
        description: '7일 연속 할일 완료',
        icon: Zap,
        color: 'text-yellow-400',
        unlocked: hasStreak,
      },
      {
        id: 2,
        title: '생산성 킹',
        description: '한 달에 100개 할일 완료',
        icon: Trophy,
        color: 'text-purple-400',
        unlocked: thisMonthCompleted >= 100,
      },
      {
        id: 3,
        title: '팀워크 스타',
        description: '가족과 함께 50개 할일 완료',
        icon: Users,
        color: 'text-blue-400',
        unlocked: completedTasks.length >= 50,
      },
      {
        id: 4,
        title: '시간 관리의 달인',
        description: '지연 없이 30개 할일 완료',
        icon: Clock,
        color: 'text-green-400',
        unlocked: onTimeTasks.length >= 30,
      },
    ];
  }, [tasks, user]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" text="통계를 불러오는 중..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div
        className="relative z-10 max-w-7xl mx-auto responsive-px responsive-py fixed-header-spacing"
        style={{ paddingTop: '120px' }}
      >
        {/* Header */}
        <div className="mb-8">
          <GlassCard variant="medium" className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4 lg:gap-6">
                <div>
                  <Typography.H2 className="text-white mb-2 font-pretendard">
                    통계
                  </Typography.H2>
                  <Typography.Body className="text-white/80 font-pretendard">
                    {group ? `${group.name} 그룹의 ` : ''}할일 완료 현황과
                    성과를 확인하세요
                  </Typography.Body>
                </div>
              </div>

              {/* Group Selection and Date Range Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Group Selection */}
                {sortedGroups && sortedGroups.length > 0 && (
                  <div className="flex glass-light rounded-xl p-1">
                    <select
                      value={selectedGroupId || ''}
                      onChange={e => setSelectedGroupId(e.target.value)}
                      className="px-4 py-2 rounded-lg text-sm lg:text-base font-medium bg-transparent text-white border-none outline-none font-pretendard"
                    >
                      {sortedGroups.map(g => (
                        <option
                          key={g.id}
                          value={g.id}
                          className="bg-slate-800 text-white"
                        >
                          {favoriteGroups.includes(g.id) ? '⭐ ' : ''}
                          {g.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() =>
                        selectedGroupId && toggleFavorite(selectedGroupId)
                      }
                      className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                        selectedGroupId &&
                        favoriteGroups.includes(selectedGroupId)
                          ? 'text-yellow-400 hover:text-yellow-300'
                          : 'text-white/50 hover:text-white/70'
                      }`}
                      title={
                        selectedGroupId &&
                        favoriteGroups.includes(selectedGroupId)
                          ? '즐겨찾기 해제'
                          : '즐겨찾기 추가'
                      }
                    >
                      <Star
                        size={16}
                        className={
                          selectedGroupId &&
                          favoriteGroups.includes(selectedGroupId)
                            ? 'fill-current'
                            : ''
                        }
                      />
                    </button>
                  </div>
                )}

                {/* Date Range Filter */}
                <div className="flex glass-light rounded-xl p-1">
                  {dateRangeOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setDateRange(option.value)}
                      className={`
                        px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-all duration-200 font-pretendard
                        ${
                          dateRange === option.value
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
          <GlassCard variant="light" className="p-4 lg:p-6 text-center">
            <div className="text-2xl lg:text-3xl font-bold text-blue-400 mb-2 font-pretendard">
              {stats.total}
            </div>
            <div className="text-white/80 text-sm lg:text-base font-pretendard">
              전체 할일
            </div>
          </GlassCard>

          <GlassCard variant="light" className="p-4 lg:p-6 text-center">
            <div className="text-2xl lg:text-3xl font-bold text-green-400 mb-2 font-pretendard">
              {stats.completed}
            </div>
            <div className="text-white/80 text-sm lg:text-base font-pretendard">
              완료
            </div>
          </GlassCard>

          <GlassCard variant="light" className="p-4 lg:p-6 text-center">
            <div className="text-2xl lg:text-3xl font-bold text-purple-400 mb-2 font-pretendard">
              {stats.completionRate}%
            </div>
            <div className="text-white/80 text-sm lg:text-base font-pretendard">
              완료율
            </div>
          </GlassCard>

          <GlassCard variant="light" className="p-4 lg:p-6 text-center">
            <div className="text-2xl lg:text-3xl font-bold text-yellow-400 mb-2 font-pretendard">
              {stats.overdue}
            </div>
            <div className="text-white/80 text-sm lg:text-base font-pretendard">
              지연
            </div>
          </GlassCard>

          <GlassCard variant="light" className="p-4 lg:p-6 text-center">
            <div className="text-2xl lg:text-3xl font-bold text-orange-400 mb-2 font-pretendard">
              {!loadingPoints && Object.keys(pointStats).length > 0
                ? Object.values(pointStats).reduce(
                    (sum, stat) => sum + stat.totalPoints,
                    0
                  )
                : 0}
            </div>
            <div className="text-white/80 text-sm lg:text-base font-pretendard">
              총 포인트
            </div>
          </GlassCard>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          {/* Daily Completion Chart */}
          <GlassCard variant="light" className="p-6 lg:p-8">
            <Typography.H4 className="text-white mb-6 font-pretendard">
              일별 완료 현황
            </Typography.H4>
            {chartData.dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.dailyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.7)"
                    fontSize={12}
                  />
                  <YAxis stroke="rgba(255,255,255,0.7)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                  />
                  <Bar
                    dataKey="completed"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <Typography.Body className="text-white/60">
                  데이터가 없습니다
                </Typography.Body>
              </div>
            )}
          </GlassCard>

          {/* Category Distribution */}
          <GlassCard variant="light" className="p-6 lg:p-8">
            <Typography.H4 className="text-white mb-6 font-pretendard">
              카테고리별 분포
            </Typography.H4>
            {chartData.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={chartData.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.categoryData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <Typography.Body className="text-white/60">
                  데이터가 없습니다
                </Typography.Body>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Member Performance */}
        {chartData.memberData.length > 0 && (
          <GlassCard variant="light" className="p-6 lg:p-8 mb-8">
            <h3 className="text-lg lg:text-xl font-semibold text-white mb-6 font-pretendard tracking-ko-tight">
              가족 구성원 성과
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {chartData.memberData.map(member => {
                const memberInfo = members.find(
                  m => m.userName === member.name
                );

                // 사용자 프로필 정보 가져오기
                const userProfile = userProfiles[memberInfo?.userId || ''];

                // 아바타 우선순위: 사용자 프로필 > 멤버 정보 > 기본값
                const avatarUrl =
                  userProfile?.photoURL ||
                  userProfile?.avatarStorageUrl ||
                  memberInfo?.userAvatar;

                return (
                  <div
                    key={member.name}
                    className="glass-medium p-4 lg:p-6 rounded-xl text-center"
                  >
                    <div className="flex justify-center mb-4">
                      <AvatarWrapper
                        src={avatarUrl}
                        alt={member.name}
                        fallback={getAvatarInitials(member.name)}
                        size="lg"
                        className="w-12 h-12 lg:w-16 lg:h-16"
                      />
                    </div>
                    <h4 className="text-white font-semibold text-base lg:text-lg mb-2 font-pretendard">
                      {member.name}
                    </h4>
                    <div className="text-2xl lg:text-3xl font-bold text-blue-400 mb-2 font-pretendard">
                      {member.rate}%
                    </div>
                    <div className="text-white/70 text-sm lg:text-base font-pretendard">
                      {member.completed}/{member.total} 완료
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}

        {/* Group Overall Statistics */}
        {group && (
          <GlassCard variant="light" className="p-6 lg:p-8 mb-8">
            <h3 className="text-lg lg:text-xl font-semibold text-white mb-6 font-pretendard tracking-ko-tight">
              그룹 전체 통계
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <div className="glass-medium p-4 lg:p-6 rounded-xl text-center">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy size={20} className="lg:w-6 lg:h-6 text-white" />
                </div>
                <h4 className="text-white font-semibold text-base lg:text-lg mb-2 font-pretendard">
                  그룹 완료율
                </h4>
                <div className="text-2xl lg:text-3xl font-bold text-green-400 mb-2 font-pretendard">
                  {stats.completionRate}%
                </div>
                <div className="text-white/70 text-sm lg:text-base font-pretendard">
                  전체 {stats.total}개 중 {stats.completed}개 완료
                </div>
              </div>

              <div className="glass-medium p-4 lg:p-6 rounded-xl text-center">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={20} className="lg:w-6 lg:h-6 text-white" />
                </div>
                <h4 className="text-white font-semibold text-base lg:text-lg mb-2 font-pretendard">
                  활성 멤버
                </h4>
                <div className="text-2xl lg:text-3xl font-bold text-purple-400 mb-2 font-pretendard">
                  {members?.length || 0}명
                </div>
                <div className="text-white/70 text-sm lg:text-base font-pretendard">
                  참여 중인 가족 구성원
                </div>
              </div>

              <div className="glass-medium p-4 lg:p-6 rounded-xl text-center">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap size={20} className="lg:w-6 lg:h-6 text-white" />
                </div>
                <h4 className="text-white font-semibold text-base lg:text-lg mb-2 font-pretendard">
                  평균 성과
                </h4>
                <div className="text-2xl lg:text-3xl font-bold text-yellow-400 mb-2 font-pretendard">
                  {members && members.length > 0
                    ? Math.round(
                        chartData.memberData.reduce(
                          (sum, member) => sum + member.rate,
                          0
                        ) / members.length
                      )
                    : 0}
                  %
                </div>
                <div className="text-white/70 text-sm lg:text-base font-pretendard">
                  구성원 평균 완료율
                </div>
              </div>

              <div className="glass-medium p-4 lg:p-6 rounded-xl text-center">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award size={20} className="lg:w-6 lg:h-6 text-white" />
                </div>
                <h4 className="text-white font-semibold text-base lg:text-lg mb-2 font-pretendard">
                  총 포인트
                </h4>
                <div className="text-2xl lg:text-3xl font-bold text-orange-400 mb-2 font-pretendard">
                  {!loadingPoints && Object.keys(pointStats).length > 0
                    ? Object.values(pointStats).reduce(
                        (sum, stat) => sum + stat.totalPoints,
                        0
                      )
                    : 0}
                </div>
                <div className="text-white/70 text-sm lg:text-base font-pretendard">
                  그룹 전체 포인트
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Member Detailed Statistics */}
        {members && members.length > 0 && (
          <GlassCard variant="light" className="p-6 lg:p-8 mb-8">
            <h3 className="text-lg lg:text-xl font-semibold text-white mb-6 font-pretendard tracking-ko-tight">
              구성원 상세 통계
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="pb-3 text-white/80 font-medium font-pretendard">
                      구성원
                    </th>
                    <th className="pb-3 text-white/80 font-medium font-pretendard text-center">
                      완료율
                    </th>
                    <th className="pb-3 text-white/80 font-medium font-pretendard text-center">
                      완료/전체
                    </th>
                    <th className="pb-3 text-white/80 font-medium font-pretendard text-center">
                      지연
                    </th>
                    <th className="pb-3 text-white/80 font-medium font-pretendard text-center">
                      포인트
                    </th>
                    <th className="pb-3 text-white/80 font-medium font-pretendard text-center">
                      최근 활동
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.memberData.map(member => {
                    const memberInfo = members.find(
                      m => m.userName === member.name
                    );
                    const memberTasks = tasks.filter(
                      task => task.assigneeId === memberInfo?.userId
                    );
                    const overdueTasks = memberTasks.filter(task => {
                      if (!task.dueDate || task.status === 'completed')
                        return false;

                      try {
                        // Check if it's a Firestore Timestamp
                        if (
                          task.dueDate &&
                          typeof task.dueDate === 'object' &&
                          'toDate' in task.dueDate
                        ) {
                          return task.dueDate.toDate() < new Date();
                        }
                        // If it's already a Date object or string
                        return new Date(task.dueDate as any) < new Date();
                      } catch (error) {
                        logger.warn('Statistics', 'Invalid dueDate format', {
                          dueDate: task.dueDate,
                          error,
                        });
                        return false;
                      }
                    });

                    return (
                      <tr
                        key={member.name}
                        className="border-b border-white/10"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <AvatarWrapper
                              src={
                                userProfiles[memberInfo?.userId || '']
                                  ?.photoURL ||
                                userProfiles[memberInfo?.userId || '']
                                  ?.avatarStorageUrl ||
                                memberInfo?.userAvatar
                              }
                              alt={member.name}
                              fallback={getAvatarInitials(member.name)}
                              size="sm"
                              className="w-8 h-8"
                            />
                            <span className="text-white font-medium font-pretendard">
                              {member.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`text-lg font-bold font-pretendard ${
                              member.rate >= 80
                                ? 'text-green-400'
                                : member.rate >= 60
                                ? 'text-yellow-400'
                                : 'text-red-400'
                            }`}
                          >
                            {member.rate}%
                          </span>
                        </td>
                        <td className="py-3 text-center text-white/80 font-pretendard">
                          {member.completed}/{member.total}
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`text-sm font-medium font-pretendard ${
                              overdueTasks.length > 0
                                ? 'text-red-400'
                                : 'text-green-400'
                            }`}
                          >
                            {overdueTasks.length}개
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span className="text-lg font-bold text-orange-400 font-pretendard">
                            {pointStats[memberInfo?.userId || '']
                              ?.totalPoints || 0}
                          </span>
                        </td>
                        <td className="py-3 text-center text-white/70 text-sm font-pretendard">
                          {memberInfo?.lastActivityAt
                            ? format(
                                memberInfo.lastActivityAt.toDate(),
                                'MM/dd HH:mm'
                              )
                            : '정보 없음'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* Points Statistics */}
        {!loadingPoints && Object.keys(pointStats).length > 0 && (
          <GlassCard variant="light" className="p-6 lg:p-8 mb-8">
            <h3 className="text-lg lg:text-xl font-semibold text-white mb-6 font-pretendard tracking-ko-tight">
              포인트 통계
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
              {members.map(member => {
                const stats = pointStats[member.userId];
                if (!stats) return null;

                return (
                  <div
                    key={member.userId}
                    className="glass-medium p-4 lg:p-6 rounded-xl text-center"
                  >
                    <div className="flex justify-center mb-4">
                      <AvatarWrapper
                        src={
                          userProfiles[member.userId]?.photoURL ||
                          userProfiles[member.userId]?.avatarStorageUrl ||
                          member.userAvatar
                        }
                        alt={member.userName || '사용자'}
                        fallback={getAvatarInitials(member.userName)}
                        size="lg"
                        className="w-12 h-12 lg:w-16 lg:h-16"
                      />
                    </div>
                    <h4 className="text-white font-semibold text-base lg:text-lg mb-2 font-pretendard">
                      {member.userName || '알 수 없음'}
                    </h4>
                    <div className="text-2xl lg:text-3xl font-bold text-yellow-400 mb-2 font-pretendard">
                      {stats.totalPoints}
                    </div>
                    <div className="text-white/70 text-sm lg:text-base font-pretendard">
                      총 포인트
                    </div>
                    <div className="mt-2 text-xs text-white/60 font-pretendard">
                      획득: +{stats.earnedPoints} | 차감: -
                      {stats.deductedPoints}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 포인트 순위표 */}
            <div className="mt-6">
              <h4 className="text-white font-semibold text-base lg:text-lg mb-4 font-pretendard">
                포인트 순위
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="pb-3 text-white/80 font-medium font-pretendard">
                        순위
                      </th>
                      <th className="pb-3 text-white/80 font-medium font-pretendard">
                        구성원
                      </th>
                      <th className="pb-3 text-white/80 font-medium font-pretendard text-center">
                        총 포인트
                      </th>
                      <th className="pb-3 text-white/80 font-medium font-pretendard text-center">
                        획득
                      </th>
                      <th className="pb-3 text-white/80 font-medium font-pretendard text-center">
                        차감
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {members
                      .map(member => {
                        const stats = pointStats[member.userId];
                        return { member, stats };
                      })
                      .filter(({ stats }) => stats)
                      .sort(
                        (a, b) =>
                          (b.stats?.totalPoints || 0) -
                          (a.stats?.totalPoints || 0)
                      )
                      .map(({ member, stats }, index) => (
                        <tr
                          key={member.userId}
                          className="border-b border-white/10"
                        >
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              {index === 0 && (
                                <Trophy size={16} className="text-yellow-400" />
                              )}
                              <span
                                className={`text-lg font-bold font-pretendard ${
                                  index === 0
                                    ? 'text-yellow-400'
                                    : index === 1
                                    ? 'text-gray-400'
                                    : index === 2
                                    ? 'text-orange-400'
                                    : 'text-white/70'
                                }`}
                              >
                                {index + 1}
                              </span>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <AvatarWrapper
                                src={
                                  userProfiles[member.userId]?.photoURL ||
                                  userProfiles[member.userId]
                                    ?.avatarStorageUrl ||
                                  member.userAvatar
                                }
                                alt={member.userName || '사용자'}
                                fallback={getAvatarInitials(member.userName)}
                                size="sm"
                                className="w-8 h-8"
                              />
                              <span className="text-white font-medium font-pretendard">
                                {member.userName || '알 수 없음'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <span className="text-lg font-bold text-yellow-400 font-pretendard">
                              {stats?.totalPoints || 0}
                            </span>
                          </td>
                          <td className="py-3 text-center text-green-400 font-pretendard">
                            +{stats?.earnedPoints || 0}
                          </td>
                          <td className="py-3 text-center text-red-400 font-pretendard">
                            -{stats?.deductedPoints || 0}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Achievements */}
        <GlassCard variant="light" className="p-6 lg:p-8 mb-8">
          <h3 className="text-lg lg:text-xl font-semibold text-white mb-6 font-pretendard tracking-ko-tight">
            업적
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {achievements.map(achievement => (
              <div
                key={achievement.id}
                className={`p-4 lg:p-6 rounded-xl text-center transition-all duration-200 ${
                  achievement.unlocked
                    ? 'glass-medium'
                    : 'glass-light opacity-50'
                }`}
              >
                <div
                  className={`w-12 h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                      : 'bg-white/20'
                  }`}
                >
                  <achievement.icon
                    size={20}
                    className={`lg:w-6 lg:h-6 ${
                      achievement.unlocked ? 'text-white' : 'text-white/50'
                    }`}
                  />
                </div>
                <h4
                  className={`font-semibold text-base lg:text-lg mb-2 font-pretendard ${
                    achievement.unlocked ? 'text-white' : 'text-white/50'
                  }`}
                >
                  {achievement.title}
                </h4>
                <p
                  className={`text-sm lg:text-base font-pretendard ${
                    achievement.unlocked ? 'text-white/80' : 'text-white/50'
                  }`}
                >
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* AI 통계 분석 인사이트 */}
        {statisticsAnalyzer.isAvailable() && (
          <StatisticsInsights
            tasks={tasks}
            members={members || []}
            pointStats={pointStats}
            period={dateRange}
            userId={user?.uid}
            onRefresh={() => {
              // 필요시 데이터 새로고침 로직
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Statistics;
