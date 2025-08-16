import { useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Calendar, Target, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Task, TaskPriority } from '../../types/task';
import { toDate } from '../../utils/dateHelpers';
import { ColorTokens, TypographyTokens } from '../../lib/design-tokens';

interface StatisticsWidgetProps {
  tasks: Task[];
  timeRange?: 'week' | 'month' | 'year';
  compact?: boolean;
  className?: string;
  onViewDetails?: () => void;
}

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  completionRate: number;
  averageCompletionTime?: number;
  trends: {
    completionRate: number;
    tasksCompleted: number;
  };
  priorityDistribution: Record<TaskPriority, number>;
  categoryDistribution: Record<string, number>;
}

export function StatisticsWidget({
  tasks,
  timeRange = 'week',
  compact = false,
  className = '',
  onViewDetails
}: StatisticsWidgetProps) {
  
  const stats: TaskStats = useMemo(() => {
    const now = new Date();
    const timeRangeMs = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000
    };
    
    const rangeStart = new Date(now.getTime() - timeRangeMs[timeRange]);
    const filteredTasks = tasks.filter(task => 
      toDate(task.createdAt) >= rangeStart
    );
    
    const completed = filteredTasks.filter(t => t.status === 'completed');
    const inProgress = filteredTasks.filter(t => t.status === 'in_progress');
    const pending = filteredTasks.filter(t => t.status === 'pending');
    
    const completionRate = filteredTasks.length > 0 
      ? Math.round((completed.length / filteredTasks.length) * 100)
      : 0;
    
    // Calculate previous period for trends
    const prevRangeStart = new Date(rangeStart.getTime() - timeRangeMs[timeRange]);
    const prevTasks = tasks.filter(task => {
      const createdAt = toDate(task.createdAt);
      return createdAt >= prevRangeStart && createdAt < rangeStart;
    });
    const prevCompleted = prevTasks.filter(t => t.status === 'completed');
    const prevCompletionRate = prevTasks.length > 0 
      ? Math.round((prevCompleted.length / prevTasks.length) * 100)
      : 0;
    
    // Priority distribution
    const priorityDistribution: Record<TaskPriority, number> = {
      low: filteredTasks.filter(t => t.priority === 'low').length,
      medium: filteredTasks.filter(t => t.priority === 'medium').length,
      high: filteredTasks.filter(t => t.priority === 'high').length
    };
    
    // Category distribution
    const categoryDistribution = filteredTasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: filteredTasks.length,
      completed: completed.length,
      inProgress: inProgress.length,
      pending: pending.length,
      completionRate,
      trends: {
        completionRate: completionRate - prevCompletionRate,
        tasksCompleted: completed.length - prevCompleted.length
      },
      priorityDistribution,
      categoryDistribution
    };
  }, [tasks, timeRange]);
  
  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-3 h-3" style={{ color: ColorTokens.state.success }} />;
    if (trend < 0) return <TrendingDown className="w-3 h-3" style={{ color: ColorTokens.state.error }} />;
    return <div className="w-3 h-3" />;
  };
  
  const getTrendColor = (trend: number) => {
    if (trend > 0) return ColorTokens.state.success;
    if (trend < 0) return ColorTokens.state.error;
    return ColorTokens.text.tertiary;
  };

  if (compact) {
    return (
      <GlassCard variant="light" className={`p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" style={{ color: ColorTokens.brand.primary }} />
            <span 
              className="font-medium text-white"
              style={{ fontSize: TypographyTokens.fontSize.sm.size, fontWeight: TypographyTokens.fontWeight.medium }}
            >
              통계
            </span>
          </div>
          <WaveButton variant="ghost" size="sm" onClick={onViewDetails}>
            <BarChart3 size={14} />
          </WaveButton>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span 
              className="text-sm text-gray-400"
              style={{ fontSize: TypographyTokens.fontSize.xs.size }}
            >
              완료율
            </span>
            <div className="flex items-center gap-1">
              <span 
                className="font-medium text-white"
                style={{ fontSize: TypographyTokens.fontSize.sm.size, fontWeight: TypographyTokens.fontWeight.medium }}
              >
                {stats.completionRate}%
              </span>
              {getTrendIcon(stats.trends.completionRate)}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span 
              className="text-sm text-gray-400"
              style={{ fontSize: TypographyTokens.fontSize.xs.size }}
            >
              완료된 할일
            </span>
            <div className="flex items-center gap-1">
              <span 
                className="font-medium text-white"
                style={{ fontSize: TypographyTokens.fontSize.sm.size, fontWeight: TypographyTokens.fontWeight.medium }}
              >
                {stats.completed}
              </span>
              {getTrendIcon(stats.trends.tasksCompleted)}
            </div>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className="h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${stats.completionRate}%`,
                background: `linear-gradient(90deg, ${ColorTokens.brand.primary}, ${ColorTokens.state.success})`
              }}
            />
          </div>
        </div>
      </GlassCard>
    );
  }
  
  return (
    <GlassCard variant="light" className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${ColorTokens.brand.primary}, ${ColorTokens.brand.accent})`,
              boxShadow: `0 10px 25px ${ColorTokens.brand.primary}40`
            }}
          >
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 
              className="text-lg font-semibold text-white"
              style={{ fontSize: TypographyTokens.fontSize.lg.size, fontWeight: TypographyTokens.fontWeight.semibold }}
            >
              통계 및 분석
            </h3>
            <p 
              className="text-sm text-gray-300"
              style={{ fontSize: TypographyTokens.fontSize.sm.size }}
            >
              {timeRange === 'week' ? '지난 일주일' : timeRange === 'month' ? '지난 한 달' : '지난 일 년'}간의 활동 분석
            </p>
          </div>
        </div>
        
        <WaveButton variant="ghost" size="sm" onClick={onViewDetails}>
          자세히 보기
        </WaveButton>
      </div>
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4" style={{ color: ColorTokens.state.success }} />
            <div 
              className="text-2xl font-bold"
              style={{ color: ColorTokens.state.success, fontSize: TypographyTokens.fontSize['2xl'].size }}
            >
              {stats.completed}
            </div>
            {getTrendIcon(stats.trends.tasksCompleted)}
          </div>
          <div 
            className="text-xs text-gray-300"
            style={{ fontSize: TypographyTokens.fontSize.xs.size }}
          >
            완료된 할일
          </div>
          {stats.trends.tasksCompleted !== 0 && (
            <div 
              className="text-xs mt-1"
              style={{ color: getTrendColor(stats.trends.tasksCompleted), fontSize: TypographyTokens.fontSize.xs.size }}
            >
              {stats.trends.tasksCompleted > 0 ? '+' : ''}{stats.trends.tasksCompleted}
            </div>
          )}
        </div>
        
        <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-4 h-4" style={{ color: ColorTokens.state.warning }} />
            <div 
              className="text-2xl font-bold"
              style={{ color: ColorTokens.state.warning, fontSize: TypographyTokens.fontSize['2xl'].size }}
            >
              {stats.inProgress}
            </div>
          </div>
          <div 
            className="text-xs text-gray-300"
            style={{ fontSize: TypographyTokens.fontSize.xs.size }}
          >
            진행 중
          </div>
        </div>
        
        <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calendar className="w-4 h-4" style={{ color: ColorTokens.brand.primary }} />
            <div 
              className="text-2xl font-bold"
              style={{ color: ColorTokens.brand.primary, fontSize: TypographyTokens.fontSize['2xl'].size }}
            >
              {stats.pending}
            </div>
          </div>
          <div 
            className="text-xs text-gray-300"
            style={{ fontSize: TypographyTokens.fontSize.xs.size }}
          >
            대기 중
          </div>
        </div>
        
        <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target className="w-4 h-4" style={{ color: ColorTokens.brand.accent }} />
            <div 
              className="text-2xl font-bold"
              style={{ color: ColorTokens.brand.accent, fontSize: TypographyTokens.fontSize['2xl'].size }}
            >
              {stats.completionRate}%
            </div>
            {getTrendIcon(stats.trends.completionRate)}
          </div>
          <div 
            className="text-xs text-gray-300"
            style={{ fontSize: TypographyTokens.fontSize.xs.size }}
          >
            완료율
          </div>
          {stats.trends.completionRate !== 0 && (
            <div 
              className="text-xs mt-1"
              style={{ color: getTrendColor(stats.trends.completionRate), fontSize: TypographyTokens.fontSize.xs.size }}
            >
              {stats.trends.completionRate > 0 ? '+' : ''}{stats.trends.completionRate}%
            </div>
          )}
        </div>
      </div>
      
      {/* Progress Visualization */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 
            className="text-sm font-medium text-white"
            style={{ fontSize: TypographyTokens.fontSize.sm.size, fontWeight: TypographyTokens.fontWeight.medium }}
          >
            진행 상황
          </h4>
          <div 
            className="text-xs text-gray-400"
            style={{ fontSize: TypographyTokens.fontSize.xs.size }}
          >
            {stats.completed}/{stats.total} 완료
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
            <div className="flex h-full">
              <div 
                className="transition-all duration-1000 ease-out"
                style={{ 
                  width: `${(stats.completed / stats.total) * 100}%`,
                  backgroundColor: ColorTokens.state.success
                }}
              />
              <div 
                className="transition-all duration-1000 ease-out"
                style={{ 
                  width: `${(stats.inProgress / stats.total) * 100}%`,
                  backgroundColor: ColorTokens.state.warning
                }}
              />
              <div 
                className="transition-all duration-1000 ease-out"
                style={{ 
                  width: `${(stats.pending / stats.total) * 100}%`,
                  backgroundColor: ColorTokens.text.tertiary
                }}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: ColorTokens.state.success }}
                />
                <span style={{ fontSize: TypographyTokens.fontSize.xs.size }}>완료</span>
              </div>
              <div className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: ColorTokens.state.warning }}
                />
                <span style={{ fontSize: TypographyTokens.fontSize.xs.size }}>진행중</span>
              </div>
              <div className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: ColorTokens.text.tertiary }}
                />
                <span style={{ fontSize: TypographyTokens.fontSize.xs.size }}>대기</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Priority Distribution */}
      <div className="mb-6">
        <h4 
          className="text-sm font-medium text-white mb-3"
          style={{ fontSize: TypographyTokens.fontSize.sm.size, fontWeight: TypographyTokens.fontWeight.medium }}
        >
          우선순위별 분포
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" style={{ color: ColorTokens.state.error }} />
              <span 
                className="text-sm text-gray-300"
                style={{ fontSize: TypographyTokens.fontSize.sm.size }}
              >
                높음
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-700/50 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${stats.total > 0 ? (stats.priorityDistribution.high / stats.total) * 100 : 0}%`,
                    backgroundColor: ColorTokens.state.error
                  }}
                />
              </div>
              <span 
                className="text-xs text-gray-400 w-6"
                style={{ fontSize: TypographyTokens.fontSize.xs.size }}
              >
                {stats.priorityDistribution.high}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: ColorTokens.state.warning }}
              />
              <span 
                className="text-sm text-gray-300"
                style={{ fontSize: TypographyTokens.fontSize.sm.size }}
              >
                보통
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-700/50 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${stats.total > 0 ? (stats.priorityDistribution.medium / stats.total) * 100 : 0}%`,
                    backgroundColor: ColorTokens.state.warning
                  }}
                />
              </div>
              <span 
                className="text-xs text-gray-400 w-6"
                style={{ fontSize: TypographyTokens.fontSize.xs.size }}
              >
                {stats.priorityDistribution.medium}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: ColorTokens.state.success }}
              />
              <span 
                className="text-sm text-gray-300"
                style={{ fontSize: TypographyTokens.fontSize.sm.size }}
              >
                낮음
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-700/50 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${stats.total > 0 ? (stats.priorityDistribution.low / stats.total) * 100 : 0}%`,
                    backgroundColor: ColorTokens.state.success
                  }}
                />
              </div>
              <span 
                className="text-xs text-gray-400 w-6"
                style={{ fontSize: TypographyTokens.fontSize.xs.size }}
              >
                {stats.priorityDistribution.low}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance Insights */}
      <div className="pt-4 border-t border-white/20">
        <h4 
          className="text-sm font-medium text-white mb-3"
          style={{ fontSize: TypographyTokens.fontSize.sm.size, fontWeight: TypographyTokens.fontWeight.medium }}
        >
          성과 분석
        </h4>
        <div className="space-y-2 text-sm">
          {stats.completionRate >= 80 && (
            <div className="flex items-center gap-2" style={{ color: ColorTokens.state.success }}>
              <TrendingUp className="w-4 h-4" />
              <span style={{ fontSize: TypographyTokens.fontSize.sm.size }}>
                훌륭한 성과! 완료율이 {stats.completionRate}%입니다.
              </span>
            </div>
          )}
          
          {stats.completionRate < 50 && (
            <div className="flex items-center gap-2" style={{ color: ColorTokens.state.warning }}>
              <AlertTriangle className="w-4 h-4" />
              <span style={{ fontSize: TypographyTokens.fontSize.sm.size }}>
                더 집중해볼까요? 완료율을 높여보세요.
              </span>
            </div>
          )}
          
          {stats.priorityDistribution.high > stats.total * 0.3 && (
            <div className="flex items-center gap-2" style={{ color: ColorTokens.state.error }}>
              <AlertTriangle className="w-4 h-4" />
              <span style={{ fontSize: TypographyTokens.fontSize.sm.size }}>
                높은 우선순위 할일이 많네요. 우선순위를 재검토해보세요.
              </span>
            </div>
          )}
          
          {stats.trends.completionRate > 10 && (
            <div className="flex items-center gap-2" style={{ color: ColorTokens.brand.primary }}>
              <TrendingUp className="w-4 h-4" />
              <span style={{ fontSize: TypographyTokens.fontSize.sm.size }}>
                지난 기간 대비 완료율이 {stats.trends.completionRate}% 향상되었어요!
              </span>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}