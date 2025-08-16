import { useMemo } from 'react';
import { Target, TrendingUp, Calendar, Star, Flame, Award } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Task } from '../../types/task';
import { toDate, getStartOfToday, getStartOfWeek, getStartOfMonth } from '../../utils/dateHelpers';
import { ColorTokens, TypographyTokens } from '../../lib/design-tokens';

interface ProgressWidgetProps {
  tasks: Task[];
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
  compact?: boolean;
  className?: string;
  onViewProgress?: () => void;
}

interface ProgressStats {
  today: {
    completed: number;
    total: number;
    percentage: number;
  };
  week: {
    completed: number;
    total: number;
    percentage: number;
  };
  month: {
    completed: number;
    total: number;
    percentage: number;
  };
  streak: {
    current: number;
    longest: number;
    lastCompleted?: Date;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    unlocked: boolean;
    progress?: number;
  }>;
}

export function ProgressWidget({
  tasks,
  goals = { daily: 5, weekly: 25, monthly: 100 },
  streakData = { current: 0, longest: 0 },
  compact = false,
  className = '',
  onViewProgress
}: ProgressWidgetProps) {
  
  const stats: ProgressStats = useMemo(() => {
    const today = getStartOfToday();
    const weekStart = getStartOfWeek();
    const monthStart = getStartOfMonth();
    
    // Today's tasks
    const todayTasks = tasks.filter(task => {
      const taskDate = toDate(task.createdAt);
      return taskDate >= today && taskDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    });
    const todayCompleted = todayTasks.filter(t => t.status === 'completed');
    
    // Week's tasks
    const weekTasks = tasks.filter(task => {
      const taskDate = toDate(task.createdAt);
      return taskDate >= weekStart;
    });
    const weekCompleted = weekTasks.filter(t => t.status === 'completed');
    
    // Month's tasks
    const monthTasks = tasks.filter(task => {
      const taskDate = toDate(task.createdAt);
      return taskDate >= monthStart;
    });
    const monthCompleted = monthTasks.filter(t => t.status === 'completed');
    
    // Calculate achievements
    const achievements = [
      {
        id: 'first_task',
        title: '첫 걸음',
        description: '첫 번째 할일 완료',
        icon: <Star className="w-4 h-4" />,
        unlocked: tasks.some(t => t.status === 'completed'),
      },
      {
        id: 'daily_goal',
        title: '일일 목표 달성',
        description: `하루에 ${goals.daily}개 할일 완료`,
        icon: <Target className="w-4 h-4" />,
        unlocked: todayCompleted.length >= goals.daily,
        progress: Math.min((todayCompleted.length / goals.daily) * 100, 100),
      },
      {
        id: 'weekly_goal',
        title: '주간 목표 달성',
        description: `일주일에 ${goals.weekly}개 할일 완료`,
        icon: <Calendar className="w-4 h-4" />,
        unlocked: weekCompleted.length >= goals.weekly,
        progress: Math.min((weekCompleted.length / goals.weekly) * 100, 100),
      },
      {
        id: 'streak_master',
        title: '연속 달성 마스터',
        description: '7일 연속 할일 완료',
        icon: <Flame className="w-4 h-4" />,
        unlocked: streakData.current >= 7,
        progress: Math.min((streakData.current / 7) * 100, 100),
      },
      {
        id: 'productivity_champion',
        title: '생산성 챔피언',
        description: '월간 100개 할일 완료',
        icon: <Award className="w-4 h-4" />,
        unlocked: monthCompleted.length >= goals.monthly,
        progress: Math.min((monthCompleted.length / goals.monthly) * 100, 100),
      },
    ];
    
    return {
      today: {
        completed: todayCompleted.length,
        total: Math.max(todayTasks.length, goals.daily),
        percentage: Math.round((todayCompleted.length / goals.daily) * 100),
      },
      week: {
        completed: weekCompleted.length,
        total: Math.max(weekTasks.length, goals.weekly),
        percentage: Math.round((weekCompleted.length / goals.weekly) * 100),
      },
      month: {
        completed: monthCompleted.length,
        total: Math.max(monthTasks.length, goals.monthly),
        percentage: Math.round((monthCompleted.length / goals.monthly) * 100),
      },
      streak: streakData,
      achievements,
    };
  }, [tasks, goals, streakData]);
  
  if (compact) {
    return (
      <GlassCard variant="light" className={`p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" style={{ color: ColorTokens.brand.primary }} />
            <span className="font-medium text-white" style={{ fontSize: TypographyTokens.fontSize.sm.size }}>
              목표 진행률
            </span>
          </div>
          <WaveButton variant="ghost" size="sm" onClick={onViewProgress}>
            <TrendingUp size={14} />
          </WaveButton>
        </div>
        
        <div className="space-y-3">
          {/* Today's Progress */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-400" style={{ fontSize: TypographyTokens.fontSize.xs.size }}>
                오늘
              </span>
              <span className="text-sm font-medium text-white" style={{ fontSize: TypographyTokens.fontSize.sm.size }}>
                {stats.today.completed}/{goals.daily}
              </span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary-500 to-green-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.today.percentage, 100)}%` }}
              />
            </div>
          </div>
          
          {/* Streak */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4" style={{ color: ColorTokens.state.warning }} />
              <span className="text-sm text-gray-400" style={{ fontSize: TypographyTokens.fontSize.xs.size }}>
                연속 달성
              </span>
            </div>
            <span className="font-medium" style={{ color: ColorTokens.state.warning, fontSize: TypographyTokens.fontSize.sm.size }}>
              {stats.streak.current}일
            </span>
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
              background: `linear-gradient(135deg, ${ColorTokens.state.success}, ${ColorTokens.brand.primary})`,
              boxShadow: `0 10px 25px ${ColorTokens.state.success}40`
            }}
          >
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 
              className="text-lg font-semibold text-white"
              style={{ fontSize: TypographyTokens.fontSize.lg.size, fontWeight: TypographyTokens.fontWeight.semibold }}
            >
              목표 및 진행률
            </h3>
            <p 
              className="text-sm text-gray-300"
              style={{ fontSize: TypographyTokens.fontSize.sm.size }}
            >
              일일, 주간, 월간 목표를 확인하세요
            </p>
          </div>
        </div>
        
        <WaveButton variant="ghost" size="sm" onClick={onViewProgress}>
          자세히 보기
        </WaveButton>
      </div>
      
      {/* Progress Overview */}
      <div className="grid gap-4 mb-6">
        {/* Daily Progress */}
        <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${ColorTokens.brand.primary}20` }}
              >
                <Target className="w-4 h-4" style={{ color: ColorTokens.brand.primary }} />
              </div>
              <div>
                <h4 
                  className="text-sm font-medium text-white"
                  style={{ fontSize: TypographyTokens.fontSize.sm.size, fontWeight: TypographyTokens.fontWeight.medium }}
                >
                  오늘의 목표
                </h4>
                <p 
                  className="text-xs text-gray-400"
                  style={{ fontSize: TypographyTokens.fontSize.xs.size }}
                >
                  {stats.today.completed}/{goals.daily} 완료
                </p>
              </div>
            </div>
            <div className="text-right">
              <div 
                className="text-xl font-bold"
                style={{ color: ColorTokens.brand.primary, fontSize: TypographyTokens.fontSize.xl.size }}
              >
                {Math.min(stats.today.percentage, 100)}%
              </div>
              {stats.today.percentage >= 100 && (
                <div 
                  className="text-xs"
                  style={{ color: ColorTokens.state.success, fontSize: TypographyTokens.fontSize.xs.size }}
                >
                  목표 달성! 🎉
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
            <div 
              className="h-3 rounded-full transition-all duration-1000 ease-out relative"
              style={{ 
                width: `${Math.min(stats.today.percentage, 100)}%`,
                background: `linear-gradient(90deg, ${ColorTokens.brand.primary}, ${ColorTokens.brand.secondary})`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shine" />
            </div>
          </div>
        </div>
        
        {/* Weekly Progress */}
        <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${ColorTokens.state.success}20` }}
              >
                <Calendar className="w-4 h-4" style={{ color: ColorTokens.state.success }} />
              </div>
              <div>
                <h4 
                  className="text-sm font-medium text-white"
                  style={{ fontSize: TypographyTokens.fontSize.sm.size, fontWeight: TypographyTokens.fontWeight.medium }}
                >
                  주간 목표
                </h4>
                <p 
                  className="text-xs text-gray-400"
                  style={{ fontSize: TypographyTokens.fontSize.xs.size }}
                >
                  {stats.week.completed}/{goals.weekly} 완료
                </p>
              </div>
            </div>
            <div className="text-right">
              <div 
                className="text-xl font-bold"
                style={{ color: ColorTokens.state.success, fontSize: TypographyTokens.fontSize.xl.size }}
              >
                {Math.min(stats.week.percentage, 100)}%
              </div>
              {stats.week.percentage >= 100 && (
                <div 
                  className="text-xs"
                  style={{ color: ColorTokens.state.success, fontSize: TypographyTokens.fontSize.xs.size }}
                >
                  목표 달성! 🏆
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
            <div 
              className="h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${Math.min(stats.week.percentage, 100)}%`,
                background: `linear-gradient(90deg, ${ColorTokens.state.success}, ${ColorTokens.state.success}80)`
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Streak Section */}
      <div className="mb-6">
        <h4 
          className="text-sm font-medium text-white mb-3"
          style={{ fontSize: TypographyTokens.fontSize.sm.size, fontWeight: TypographyTokens.fontWeight.medium }}
        >
          연속 달성
        </h4>
        <div 
          className="flex items-center gap-4 p-4 rounded-lg border"
          style={{ 
            background: `linear-gradient(90deg, ${ColorTokens.state.warning}20, ${ColorTokens.state.error}20)`,
            borderColor: `${ColorTokens.state.warning}30`
          }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
              style={{ 
                background: `linear-gradient(135deg, ${ColorTokens.state.warning}, ${ColorTokens.state.error})`,
                boxShadow: `0 10px 25px ${ColorTokens.state.warning}40`
              }}
            >
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <div 
                className="text-2xl font-bold"
                style={{ color: ColorTokens.state.warning, fontSize: TypographyTokens.fontSize['2xl'].size }}
              >
                {stats.streak.current}일
              </div>
              <div 
                className="text-sm text-gray-300"
                style={{ fontSize: TypographyTokens.fontSize.sm.size }}
              >
                현재 연속 달성
              </div>
            </div>
          </div>
          
          <div className="flex-1 text-right">
            <div 
              className="text-sm text-gray-300"
              style={{ fontSize: TypographyTokens.fontSize.sm.size }}
            >
              최고 기록
            </div>
            <div 
              className="text-lg font-semibold"
              style={{ color: ColorTokens.state.warning, fontSize: TypographyTokens.fontSize.lg.size }}
            >
              {stats.streak.longest}일
            </div>
          </div>
        </div>
      </div>
      
      {/* Achievements */}
      <div>
        <h4 
          className="text-sm font-medium text-white mb-3"
          style={{ fontSize: TypographyTokens.fontSize.sm.size, fontWeight: TypographyTokens.fontWeight.medium }}
        >
          업적
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stats.achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-3 rounded-lg border transition-all duration-200 ${
                achievement.unlocked
                  ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg shadow-yellow-500/25'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {achievement.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div 
                    className={`text-sm font-medium ${
                      achievement.unlocked ? 'text-yellow-300' : 'text-gray-400'
                    }`}
                    style={{ fontSize: TypographyTokens.fontSize.sm.size, fontWeight: TypographyTokens.fontWeight.medium }}
                  >
                    {achievement.title}
                  </div>
                  <div 
                    className="text-xs text-gray-400 truncate"
                    style={{ fontSize: TypographyTokens.fontSize.xs.size }}
                  >
                    {achievement.description}
                  </div>
                  
                  {!achievement.unlocked && typeof achievement.progress === 'number' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-700/50 rounded-full h-1">
                        <div 
                          className="h-1 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${achievement.progress}%`,
                            background: `linear-gradient(90deg, ${ColorTokens.state.warning}, ${ColorTokens.state.error})`
                          }}
                        />
                      </div>
                      <div 
                        className="text-xs text-gray-500 mt-1"
                        style={{ fontSize: TypographyTokens.fontSize.xs.size }}
                      >
                        {Math.round(achievement.progress)}% 완료
                      </div>
                    </div>
                  )}
                </div>
                
                {achievement.unlocked && (
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}