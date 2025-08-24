import { Bell, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/typography';
import { cn } from '../../lib/utils';
import { NotificationStats as NotificationStatsType } from '../../types/notification';

interface NotificationStatsProps {
  stats: NotificationStatsType;
  className?: string;
}

export const NotificationStats = ({ stats, className }: NotificationStatsProps) => {
  const totalNotifications = stats.total;
  const unreadCount = stats.unread;
  const readCount = stats.read;
  const readRate = totalNotifications > 0 ? (readCount / totalNotifications) * 100 : 0;

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {/* 전체 알림 */}
      <GlassCard variant="light" className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <Typography.H4 className="text-white font-pretendard text-2xl font-bold">
              {totalNotifications}
            </Typography.H4>
            <Typography.Body className="text-white/70 font-pretendard text-sm">
              전체 알림
            </Typography.Body>
          </div>
        </div>
      </GlassCard>

      {/* 읽지 않은 알림 */}
      <GlassCard variant="light" className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <Typography.H4 className="text-white font-pretendard text-2xl font-bold">
              {unreadCount}
            </Typography.H4>
            <Typography.Body className="text-white/70 font-pretendard text-sm">
              읽지 않음
            </Typography.Body>
          </div>
        </div>
      </GlassCard>

      {/* 읽은 알림 */}
      <GlassCard variant="light" className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <Typography.H4 className="text-white font-pretendard text-2xl font-bold">
              {readCount}
            </Typography.H4>
            <Typography.Body className="text-white/70 font-pretendard text-sm">
              읽음
            </Typography.Body>
          </div>
        </div>
      </GlassCard>

      {/* 읽음률 */}
      <GlassCard variant="light" className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <Typography.H4 className="text-white font-pretendard text-2xl font-bold">
              {readRate.toFixed(1)}%
            </Typography.H4>
            <Typography.Body className="text-white/70 font-pretendard text-sm">
              읽음률
            </Typography.Body>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

// 타입별 통계 컴포넌트
export const NotificationTypeStats = ({ stats }: { stats: NotificationStatsType }) => {
  const typeStats = [
    { key: 'task', label: '할일', count: stats.byType.task, color: 'bg-blue-500' },
    { key: 'group', label: '그룹', count: stats.byType.group, color: 'bg-green-500' },
    { key: 'system', label: '시스템', count: stats.byType.system, color: 'bg-purple-500' },
    { key: 'reminder', label: '리마인더', count: stats.byType.reminder, color: 'bg-orange-500' },
  ];

  const totalCount = stats.total;

  return (
    <GlassCard variant="light" className="p-6">
      <Typography.H4 className="text-white font-pretendard text-lg mb-4">
        타입별 분포
      </Typography.H4>
      
      <div className="space-y-3">
        {typeStats.map((type) => {
          const percentage = totalCount > 0 ? (type.count / totalCount) * 100 : 0;
          
          return (
            <div key={type.key} className="flex items-center gap-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={cn('w-3 h-3 rounded-full', type.color)} />
                <Typography.Body className="text-white/80 font-pretendard text-sm truncate">
                  {type.label}
                </Typography.Body>
              </div>
              
              <div className="flex items-center gap-2 min-w-0">
                <Typography.Body className="text-white font-pretendard text-sm font-medium">
                  {type.count}
                </Typography.Body>
                <Typography.Body className="text-white/60 font-pretendard text-xs">
                  ({percentage.toFixed(1)}%)
                </Typography.Body>
              </div>
              
              <div className="flex-1 bg-white/10 rounded-full h-2">
                <div
                  className={cn('h-2 rounded-full transition-all duration-300', type.color)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};
