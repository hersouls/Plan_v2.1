import React, { useMemo } from 'react';
import { 
  Target, TrendingUp, Calendar, Flame,
  BarChart3, Activity
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Task } from '../../types/task';
import { toDate, getStartOfToday, getStartOfWeek, getStartOfMonth } from '../../utils/dateHelpers';
import { ColorTokens } from '../../lib/design-tokens';
import { cn } from '../ui/utils';

// Import existing widget components for backward compatibility
import { ProgressWidget } from './ProgressWidget';
import { StatisticsWidget } from './StatisticsWidget';

export interface DashboardWidgetConfig {
  goals?: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  streakData?: {
    current: number;
    longest: number;
    lastCompleted?: Date;
  };
  showChart?: boolean;
  showAchievements?: boolean;
  timeRange?: 'day' | 'week' | 'month' | 'year';
}

export interface DashboardWidgetProps {
  type: 'progress' | 'statistics' | 'combined';
  tasks: Task[];
  config?: DashboardWidgetConfig;
  compact?: boolean;
  className?: string;
  onViewDetails?: () => void;
}

interface WidgetStats {
  progress: {
    today: { completed: number; total: number; percentage: number; };
    week: { completed: number; total: number; percentage: number; };
    month: { completed: number; total: number; percentage: number; };
  };
  statistics: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;
    averageCompletionTime: number;
  };
  categories: Array<{
    name: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  priorities: Array<{
    level: string;
    count: number;
    percentage: number;
    color: string;
  }>;
}

const calculateWidgetStats = (tasks: Task[]): WidgetStats => {
  const now = new Date();
  const todayStart = getStartOfToday();
  const weekStart = getStartOfWeek();
  const monthStart = getStartOfMonth();

  // Progress calculations
  const todayTasks = tasks.filter(task => {
    const dueDate = task.dueDate ? toDate(task.dueDate) : null;
    return dueDate && dueDate >= todayStart && dueDate < new Date(todayStart.getTime() + 86400000);
  });

  const weekTasks = tasks.filter(task => {
    const dueDate = task.dueDate ? toDate(task.dueDate) : null;
    return dueDate && dueDate >= weekStart;
  });

  const monthTasks = tasks.filter(task => {
    const dueDate = task.dueDate ? toDate(task.dueDate) : null;
    return dueDate && dueDate >= monthStart;
  });

  // Statistics calculations
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const pendingTasks = tasks.filter(task => task.status !== 'completed');
  const overdueTasks = tasks.filter(task => {
    if (task.status === 'completed') return false;
    const dueDate = task.dueDate ? toDate(task.dueDate) : null;
    return dueDate && dueDate < now;
  });

  // Category distribution
  const categoryMap = new Map<string, number>();
  tasks.forEach(task => {
    const category = task.category || 'other';
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  });

  const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
    name,
    count,
    percentage: (count / tasks.length) * 100,
    color: getCategoryColor(name)
  }));

  // Priority distribution
  const priorityMap = new Map<string, number>();
  tasks.forEach(task => {
    const priority = task.priority || 'low';
    priorityMap.set(priority, (priorityMap.get(priority) || 0) + 1);
  });

  const priorities = Array.from(priorityMap.entries()).map(([level, count]) => ({
    level,
    count,
    percentage: (count / tasks.length) * 100,
    color: getPriorityColor(level)
  }));

  return {
    progress: {
      today: {
        completed: todayTasks.filter(t => t.status === 'completed').length,
        total: todayTasks.length,
        percentage: todayTasks.length > 0 ? (todayTasks.filter(t => t.status === 'completed').length / todayTasks.length) * 100 : 0
      },
      week: {
        completed: weekTasks.filter(t => t.status === 'completed').length,
        total: weekTasks.length,
        percentage: weekTasks.length > 0 ? (weekTasks.filter(t => t.status === 'completed').length / weekTasks.length) * 100 : 0
      },
      month: {
        completed: monthTasks.filter(t => t.status === 'completed').length,
        total: monthTasks.length,
        percentage: monthTasks.length > 0 ? (monthTasks.filter(t => t.status === 'completed').length / monthTasks.length) * 100 : 0
      }
    },
    statistics: {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      overdueTasks: overdueTasks.length,
      completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
      averageCompletionTime: calculateAverageCompletionTime(completedTasks)
    },
    categories,
    priorities
  };
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    household: ColorTokens.state.info,
    shopping: ColorTokens.state.success,
    work: ColorTokens.state.warning,
    personal: ColorTokens.brand.primary,
    other: ColorTokens.text.tertiary
  };
  return colors[category] || ColorTokens.text.tertiary;
};

const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    high: ColorTokens.state.error,
    medium: ColorTokens.state.warning,
    low: ColorTokens.state.success
  };
  return colors[priority] || ColorTokens.text.tertiary;
};

const calculateAverageCompletionTime = (completedTasks: Task[]): number => {
  if (completedTasks.length === 0) return 0;
  
  const completionTimes = completedTasks
    .filter(task => task.createdAt && task.completedAt)
    .map(task => {
      const created = toDate(task.createdAt!);
      const completed = toDate(task.completedAt!);
      return completed.getTime() - created.getTime();
    });

  if (completionTimes.length === 0) return 0;
  
  const average = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
  return Math.round(average / (1000 * 60 * 60)); // Convert to hours
};

const ProgressView: React.FC<{ stats: WidgetStats; config?: DashboardWidgetConfig; compact?: boolean }> = ({ 
  stats, 
  config,
  compact 
}) => {
  return (
    <div className={cn("space-y-4", compact && "space-y-2")}>
      {/* Daily Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">오늘</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {stats.progress.today.completed}/{stats.progress.today.total}
          </span>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${stats.progress.today.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Weekly Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-success" />
          <span className="text-sm font-medium">이번 주</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {stats.progress.week.completed}/{stats.progress.week.total}
          </span>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-success transition-all duration-300"
              style={{ width: `${stats.progress.week.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Monthly Progress */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium">이번 달</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {stats.progress.month.completed}/{stats.progress.month.total}
            </span>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-warning transition-all duration-300"
                style={{ width: `${stats.progress.month.percentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Streak */}
      {config?.streakData && !compact && (
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-error" />
            <span className="text-sm font-medium">연속 달성</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-error">
              {config.streakData.current}일
            </span>
            <span className="text-xs text-gray-500">
              최고: {config.streakData.longest}일
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const StatisticsView: React.FC<{ stats: WidgetStats; compact?: boolean }> = ({ stats, compact }) => {
  return (
    <div className={cn("space-y-4", compact && "space-y-2")}>
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-primary">
            {stats.statistics.totalTasks}
          </div>
          <div className="text-xs text-gray-600">전체 작업</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-success">
            {stats.statistics.completionRate.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-600">완료율</div>
        </div>
      </div>

      {/* Category Distribution */}
      {!compact && stats.categories.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">카테고리별 분포</h4>
          <div className="space-y-1">
            {stats.categories.slice(0, 3).map((category) => (
              <div key={category.name} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 capitalize">{category.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-300"
                      style={{ 
                        width: `${category.percentage}%`,
                        backgroundColor: category.color
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {category.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priority Distribution */}
      {!compact && stats.priorities.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">우선순위별 분포</h4>
          <div className="flex gap-2">
            {stats.priorities.map((priority) => (
              <div 
                key={priority.level} 
                className="flex-1 text-center p-2 rounded-lg"
                style={{ backgroundColor: `${priority.color}10` }}
              >
                <div 
                  className="text-lg font-bold"
                  style={{ color: priority.color }}
                >
                  {priority.count}
                </div>
                <div className="text-xs text-gray-600 capitalize">
                  {priority.level}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CombinedView: React.FC<{ stats: WidgetStats; config?: DashboardWidgetConfig; compact?: boolean }> = ({ 
  stats, 
  config,
  compact 
}) => {
  return (
    <div className={cn("grid gap-4", compact ? "grid-cols-1" : "grid-cols-2")}>
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          진행 현황
        </h3>
        <ProgressView stats={stats} config={config} compact={compact} />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          통계
        </h3>
        <StatisticsView stats={stats} compact={compact} />
      </div>
    </div>
  );
};

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  type,
  tasks,
  config,
  compact = false,
  className,
  onViewDetails
}) => {
  const stats = useMemo(() => calculateWidgetStats(tasks), [tasks]);

  // For backward compatibility, delegate to existing components if needed
  if (type === 'progress' && !config) {
    return (
      <ProgressWidget 
        tasks={tasks}
        compact={compact}
        className={className}
        onViewProgress={onViewDetails}
      />
    );
  }

  if (type === 'statistics' && !config) {
    return (
      <StatisticsWidget 
        tasks={tasks}
        compact={compact}
        className={className}
        onViewStats={onViewDetails}
      />
    );
  }

  return (
    <GlassCard className={cn("p-4", compact && "p-3", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={cn(
          "font-semibold",
          compact ? "text-base" : "text-lg"
        )}>
          {type === 'progress' && '진행 현황'}
          {type === 'statistics' && '통계'}
          {type === 'combined' && '대시보드'}
        </h2>
        {onViewDetails && (
          <WaveButton
            size="sm"
            variant="ghost"
            onClick={onViewDetails}
          >
            자세히 보기
          </WaveButton>
        )}
      </div>

      {type === 'progress' && (
        <ProgressView stats={stats} config={config} compact={compact} />
      )}
      {type === 'statistics' && (
        <StatisticsView stats={stats} compact={compact} />
      )}
      {type === 'combined' && (
        <CombinedView stats={stats} config={config} compact={compact} />
      )}
    </GlassCard>
  );
};

// Backward compatibility exports
export const EnhancedProgressWidget = DashboardWidget;
export const EnhancedStatisticsWidget = DashboardWidget;

export default DashboardWidget;