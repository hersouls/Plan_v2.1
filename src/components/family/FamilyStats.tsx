import { TrendingUp, Target, Calendar, Users, CheckCircle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { GroupStats } from '../../types/group';

interface FamilyStatsProps {
  stats: GroupStats;
  timeRange?: 'week' | 'month' | 'all';
  onTimeRangeChange?: (range: 'week' | 'month' | 'all') => void;
}

export function FamilyStats({ 
  stats, 
  timeRange = 'week',
  onTimeRangeChange 
}: FamilyStatsProps) {
  const completionRate = Math.round(stats.performance?.completionRate || 0);
  const totalTasks = stats.tasks?.created || 0;
  const completedTasks = stats.tasks?.completed || 0;
  const overdueTasks = stats.tasks?.overdue || 0;
  const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const statCards = [
    {
      title: '총 할일',
      value: totalTasks,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+12%', // Could be calculated from previous period
      changeColor: 'text-green-600'
    },
    {
      title: '완료한 할일',
      value: completedTasks,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+8%',
      changeColor: 'text-green-600'
    },
    {
      title: '진행률',
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: completionRate > 70 ? '+5%' : '-2%',
      changeColor: completionRate > 70 ? 'text-green-600' : 'text-red-600'
    },
    {
      title: '지연된 할일',
      value: overdueTasks,
      icon: Calendar,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      change: overdueTasks > 5 ? '+3' : '-1',
      changeColor: overdueTasks > 5 ? 'text-red-600' : 'text-green-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      {onTimeRangeChange && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg-ko font-semibold text-gray-900">가족 통계</h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { key: 'week', label: '이번 주' },
              { key: 'month', label: '이번 달' },
              { key: 'all', label: '전체' }
            ].map(option => (
              <button
                key={option.key}
                onClick={() => onTimeRangeChange(option.key as any)}
                className={`
                  px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${timeRange === option.key 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <GlassCard key={index} variant="light" className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp size={12} className={stat.changeColor} />
                  <span className={`text-xs ${stat.changeColor}`}>{stat.change}</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon size={20} className={stat.color} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Progress Overview */}
      <GlassCard variant="light" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base-ko font-semibold">전체 진행률</h4>
          <span className="text-sm text-gray-500">
            {completedTasks}/{totalTasks} 완료
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(overallProgress, 100)}%` }}
          />
        </div>

        <div className="text-center">
          <span className="text-2xl font-bold text-primary-600">{completionRate}%</span>
          <p className="text-sm text-gray-600">완료율</p>
        </div>
      </GlassCard>

      {/* Category Breakdown */}
      <GlassCard variant="light" className="p-6">
        <h4 className="text-base-ko font-semibold mb-4">카테고리별 현황</h4>
        <div className="space-y-3">
          {/* Sample data for now - would be replaced with real category distribution */}
          {Object.entries({
            household: Math.floor(totalTasks * 0.4),
            shopping: Math.floor(totalTasks * 0.2),
            work: Math.floor(totalTasks * 0.2),
            personal: Math.floor(totalTasks * 0.1),
            other: Math.floor(totalTasks * 0.1)
          }).filter(([_, count]) => count > 0).map(([category, count]) => {
            const categoryLabels: Record<string, string> = {
              household: '집안일',
              shopping: '쇼핑',
              work: '업무',
              personal: '개인',
              other: '기타'
            };

            const percentage = totalTasks > 0 ? ((count as number) / totalTasks) * 100 : 0;
            
            return (
              <div key={category} className="flex items-center gap-3">
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {categoryLabels[category] || category}
                  </span>
                  <span className="text-sm text-gray-600">{count as number}</span>
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right">
                  {Math.round(percentage)}%
                </span>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Recent Activity Summary - Temporarily disabled */}
      {false && (
        <GlassCard variant="light" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base-ko font-semibold">최근 활동</h4>
            <Users size={16} className="text-gray-500" />
          </div>
          
          <div className="space-y-3">
            {[].map((activity: any, index: number) => (
              <div key={index} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary-700">
                    {activity.userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.userName}</span>
                    <span className="text-gray-600 ml-1">
                      {activity.action === 'task_completed' ? '할일을 완료했습니다' :
                       activity.action === 'task_created' ? '새 할일을 만들었습니다' :
                       activity.action === 'joined' ? '그룹에 참여했습니다' :
                       '활동했습니다'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {/* {formatDistanceToNow(activity.timestamp.toDate())} */}
                    방금 전
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

export default FamilyStats;