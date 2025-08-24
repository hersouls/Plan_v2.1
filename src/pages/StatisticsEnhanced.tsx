import { format, isThisWeek, isToday, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ArrowLeft,
  Award,
  BarChart3,
  Clock,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useSettingsContext } from '../components/settings';
import { StatisticsInsights } from '../components/statistics/StatisticsInsights';
import { GlassCard } from '../components/ui/GlassCard';
import { WaveButton } from '../components/ui/WaveButton';
import { Typography } from '../components/ui/typography';
import { useAuth } from '../contexts/AuthContext';
import { useGroup, useUserGroups } from '../hooks/useGroup';
import { useTasks } from '../hooks/useTasks';
import logger from '../lib/logger';
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
  '#06b6d4',
  '#84cc16',
];

function StatisticsEnhanced() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  // 현재 미사용 상태 제거

  // Use real Firebase data
  const { groups, loading: groupsLoading } = useUserGroups();

  const {
    group,
    members,
    loading: groupLoading,
  } = useGroup({ groupId: selectedGroupId || undefined });

  const { tasks, loading: tasksLoading } = useTasks({
    realtime: true,
    groupId: selectedGroupId || undefined,
  });

  const { loading: settingsLoading } = useSettingsContext();

  // 포인트 통계 상태
  const [pointStats, setPointStats] = useState<Record<string, PointStats>>({});
  const [_loadingPoints, setLoadingPoints] = useState(false);

  // Set first group as selected if available
  useEffect(() => {
    if (groups && groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  // 포인트 통계 로드 (그룹 단일 쿼리 활용)
  useEffect(() => {
    const loadPointStats = async () => {
      if (!selectedGroupId) return;

      setLoadingPoints(true);
      try {
        const list = await pointsService.getGroupPointStats(selectedGroupId);
        const map: Record<string, PointStats> = {};
        for (const s of list) {
          map[s.userId] = s;
        }
        setPointStats(map);
      } catch (error) {
        logger.error('StatisticsEnhanced', '포인트 통계 로드 실패', error);
      } finally {
        setLoadingPoints(false);
      }
    };

    loadPointStats();
  }, [selectedGroupId]);

  // Enhanced task filtering with better date handling
  const { filteredTasks, periodData } = useMemo(() => {
    if (!tasks) return { filteredTasks: [], periodData: [] };

    const now = new Date();
    let startDate: Date;
    let periodLength: number;

    switch (dateRange) {
      case '7days':
        startDate = subDays(now, 7);
        periodLength = 7;
        break;
      case '30days':
        startDate = subDays(now, 30);
        periodLength = 30;
        break;
      case '3months':
        startDate = subDays(now, 90);
        periodLength = 90;
        break;
      case 'year':
        startDate = subDays(now, 365);
        periodLength = 365;
        break;
      default:
        startDate = subDays(now, 30);
        periodLength = 30;
    }

    const filtered = tasks.filter(task => {
      const taskDate = toDate(task.createdAt);
      return taskDate >= startDate && taskDate <= now;
    });

    // Generate period data for charts
    const period = [];
    for (let i = periodLength - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dayTasks = tasks.filter(task => {
        const taskDate = toDate(task.createdAt);
        return format(taskDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      });

      period.push({
        date: format(date, dateRange === '7days' ? 'EEE' : 'MM/dd', {
          locale: ko,
        }),
        fullDate: date,
        total: dayTasks.length,
        completed: dayTasks.filter(t => t.status === 'completed').length,
        pending: dayTasks.filter(
          t =>
            t.status !== 'completed' &&
            !!t.dueDate &&
            toDate(t.dueDate) > toDate(t.createdAt)
        ).length,
        overdue: dayTasks.filter(
          t =>
            t.status !== 'completed' &&
            !!t.dueDate &&
            toDate(t.dueDate) < new Date()
        ).length,
      });
    }

    return { filteredTasks: filtered, periodData: period };
  }, [tasks, dateRange]);

  // Enhanced chart data with multiple metrics
  const { categoryData } = useMemo(() => {
    if (!filteredTasks.length) {
      return {
        categoryData: [],
      };
    }

    // Category distribution
    const categories = filteredTasks.reduce((acc, task) => {
      const category = task.category || '미분류';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryChart = Object.entries(categories).map(
      ([category, count]) => ({
        name: category,
        value: count,
        percentage: Math.round((count / filteredTasks.length) * 100),
      })
    );

    return {
      categoryData: categoryChart,
    };
  }, [filteredTasks, members]);

  // Quick stats calculations
  const quickStats = useMemo(() => {
    // 제거: today 미사용 변수
    const todayTasks = filteredTasks.filter(task => {
      const taskDate = toDate(task.createdAt);
      return isToday(taskDate);
    });

    const thisWeekTasks = filteredTasks.filter(task => {
      const taskDate = toDate(task.createdAt);
      return isThisWeek(taskDate);
    });

    const overdueTasks = filteredTasks.filter(
      task =>
        task.status !== 'completed' &&
        !!task.dueDate &&
        toDate(task.dueDate) < new Date()
    );

    return {
      todayTotal: todayTasks.length,
      todayCompleted: todayTasks.filter(t => t.status === 'completed').length,
      weekTotal: thisWeekTasks.length,
      weekCompleted: thisWeekTasks.filter(t => t.status === 'completed').length,
      overdueCount: overdueTasks.length,
      totalPoints: filteredTasks.reduce(
        (sum, task) => sum + (task.status === 'completed' ? 10 : 0),
        0
      ),
    };
  }, [filteredTasks]);

  const loading =
    groupsLoading || groupLoading || tasksLoading || settingsLoading;
  const completedTasks = filteredTasks.filter(
    task => task.status === 'completed'
  ).length;
  const completionRate =
    filteredTasks.length > 0
      ? Math.round((completedTasks / filteredTasks.length) * 100)
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <LoadingSpinner
            size="lg"
            variant="wave"
            text="통계를 불러오는 중..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="relative z-10 p-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <WaveButton
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </WaveButton>

            <div>
              <Typography.H1 className="text-white font-bold">
                📊 통계 대시보드
              </Typography.H1>
              <Typography.Body className="text-white/80 mt-1">
                나의 생산성과 성과를 한눈에 확인하세요
              </Typography.Body>
            </div>
          </div>

          {/* Group selector */}
          <div className="flex items-center gap-4">
            <select
              value={selectedGroupId || ''}
              onChange={e => setSelectedGroupId(e.target.value || null)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">개인 통계</option>
              {groups?.map(group => (
                <option key={group.id} value={group.id} className="text-black">
                  {group.name}
                </option>
              ))}
            </select>

            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as DateRange)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="7days" className="text-black">
                최근 7일
              </option>
              <option value="30days" className="text-black">
                최근 30일
              </option>
              <option value="3months" className="text-black">
                최근 3개월
              </option>
              <option value="year" className="text-black">
                최근 1년
              </option>
            </select>
          </div>
        </div>

        {/* Enhanced stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <GlassCard variant="light" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-white/80">총 할일</p>
                <p className="text-2xl font-bold text-white">
                  {filteredTasks.length}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  이번{' '}
                  {dateRange === '7days'
                    ? '주'
                    : dateRange === '30days'
                    ? '달'
                    : '기간'}
                </p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    (filteredTasks.length /
                      Math.max(filteredTasks.length, 10)) *
                      100,
                    100
                  )}%`,
                }}
              />
            </div>
          </GlassCard>

          <GlassCard variant="light" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-white/80">완료된 할일</p>
                <p className="text-2xl font-bold text-white">
                  {completedTasks}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  목표 달성: {completionRate}%
                </p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Trophy className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-green-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </GlassCard>

          <GlassCard variant="light" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-white/80">평균 완료율</p>
                <p className="text-2xl font-bold text-white">
                  {completionRate}%
                </p>
                <p className="text-xs text-white/60 mt-1">
                  {completionRate >= 80
                    ? '우수함'
                    : completionRate >= 60
                    ? '양호함'
                    : '개선 필요'}
                </p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  completionRate >= 80
                    ? 'bg-green-400'
                    : completionRate >= 60
                    ? 'bg-yellow-400'
                    : 'bg-red-400'
                }`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </GlassCard>

          <GlassCard variant="light" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-white/80">활성 멤버</p>
                <p className="text-2xl font-bold text-white">
                  {members?.length || (selectedGroupId ? 0 : 1)}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  {selectedGroupId ? `${group?.name || '그룹'}` : '개인 모드'}
                </p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-purple-400 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    ((members?.length || 1) / 10) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </GlassCard>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Period trends chart */}
          <GlassCard variant="light" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Typography.H3 className="text-white">기간별 추이</Typography.H3>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-400 rounded"></div>
                  <span>전체</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-400 rounded"></div>
                  <span>완료</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-400 rounded"></div>
                  <span>지연</span>
                </div>
              </div>
            </div>
            {periodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={periodData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dot={{ fill: '#60a5fa', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#34d399"
                    strokeWidth={2}
                    dot={{ fill: '#34d399', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="overdue"
                    stroke="#f87171"
                    strokeWidth={2}
                    dot={{ fill: '#f87171', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-60 text-white/60">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>해당 기간에 데이터가 없습니다</p>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Category distribution */}
          <GlassCard variant="light" className="p-6">
            <Typography.H3 className="text-white mb-4">
              카테고리별 분포
            </Typography.H3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                  >
                    {categoryData.map((_entry, index) => (
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
              <div className="flex items-center justify-center h-60 text-white/60">
                <div className="text-center">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>해당 기간에 할일이 없습니다</p>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Personal insights section */}
        <div className="mt-8">
          <GlassCard variant="light" className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-6 h-6 text-yellow-400" />
              <Typography.H3 className="text-white">
                개인 인사이트
              </Typography.H3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Most productive day */}
              <div className="p-4 bg-white/5 rounded-lg">
                <h4 className="text-sm font-medium text-white/80 mb-2">
                  가장 활발한 날
                </h4>
                <p className="text-lg font-bold text-white">
                  {
                    periodData.reduce(
                      (max, day) => (day.completed > max.completed ? day : max),
                      periodData[0] || { date: '없음', completed: 0 }
                    ).date
                  }
                </p>
                <p className="text-xs text-white/60 mt-1">
                  {
                    periodData.reduce(
                      (max, day) => (day.completed > max.completed ? day : max),
                      periodData[0] || { completed: 0 }
                    ).completed
                  }
                  개 완료
                </p>
              </div>

              {/* Total points */}
              <div className="p-4 bg-white/5 rounded-lg">
                <h4 className="text-sm font-medium text-white/80 mb-2">
                  총 획득 포인트
                </h4>
                <p className="text-lg font-bold text-white">
                  {quickStats.totalPoints}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  완료된 할일당 10포인트
                </p>
              </div>

              {/* This week completion */}
              <div className="p-4 bg-white/5 rounded-lg">
                <h4 className="text-sm font-medium text-white/80 mb-2">
                  이번 주 성과
                </h4>
                <p className="text-lg font-bold text-white">
                  {quickStats.weekCompleted}/{quickStats.weekTotal}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  {quickStats.weekTotal > 0
                    ? Math.round(
                        (quickStats.weekCompleted / quickStats.weekTotal) * 100
                      )
                    : 0}
                  % 완료율
                </p>
              </div>
            </div>
          </GlassCard>

          {/* AI 통계 분석 인사이트 */}
          {statisticsAnalyzer.isAvailable() && (
            <StatisticsInsights
              tasks={tasks || []}
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
    </div>
  );
}

export default StatisticsEnhanced;
