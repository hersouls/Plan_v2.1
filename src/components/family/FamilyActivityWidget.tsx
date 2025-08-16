import {
  Activity,
  ArrowRight,
  CheckCircle,
  Clock,
  Target,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import { useMemo } from 'react';
import { formatDistanceToNow } from '../../lib/utils';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { AvatarWrapper, getAvatarInitials } from '../ui/avatar';

interface FamilyMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'parent' | 'child' | 'guardian';
  lastActive?: Date;
}

interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  taskTitle: string;
  action: 'created' | 'completed' | 'assigned' | 'commented';
  timestamp: Date;
  metadata?: {
    assigneeName?: string;
    comment?: string;
  };
}

interface FamilyStats {
  totalMembers: number;
  activeToday: number;
  totalTasksCompleted: number;
  teamCompletionRate: number;
  topPerformer?: {
    name: string;
    count: number;
  };
}

interface FamilyActivityWidgetProps {
  familyMembers: FamilyMember[];
  recentActivity: TaskActivity[];
  stats: FamilyStats;
  compact?: boolean;
  className?: string;
  onViewAllActivity?: () => void;
  onManageFamily?: () => void;
}

export function FamilyActivityWidget({
  familyMembers,
  recentActivity,
  stats,
  compact = false,
  className = '',
  onViewAllActivity,
  onManageFamily,
}: FamilyActivityWidgetProps) {
  // Get avatar initials
  const getInitials = (name: string): string => {
    return getAvatarInitials(name);
  };

  // Get activity icon
  const getActivityIcon = (action: TaskActivity['action']) => {
    switch (action) {
      case 'completed':
        return <CheckCircle size={14} className="text-green-500" />;
      case 'created':
        return <Clock size={14} className="text-blue-500" />;
      case 'assigned':
        return <User size={14} className="text-purple-500" />;
      case 'commented':
        return <Users size={14} className="text-orange-500" />;
      default:
        return <Clock size={14} className="text-gray-500" />;
    }
  };

  // Get activity message
  const getActivityMessage = (activity: TaskActivity) => {
    switch (activity.action) {
      case 'completed':
        return `"${activity.taskTitle}" 완료`;
      case 'created':
        return `"${activity.taskTitle}" 생성`;
      case 'assigned':
        return `"${activity.taskTitle}"을 ${activity.metadata?.assigneeName}에게 할당`;
      case 'commented':
        return `"${activity.taskTitle}"에 댓글 작성`;
      default:
        return activity.taskTitle;
    }
  };

  // Recent activity sorted by timestamp
  const sortedActivity = useMemo(() => {
    return recentActivity
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, compact ? 3 : 5);
  }, [recentActivity, compact]);

  if (compact) {
    return (
      <GlassCard variant="light" className={`p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-400" />
            <span className="font-medium text-white">가족 활동</span>
          </div>
          <WaveButton variant="ghost" size="sm" onClick={onViewAllActivity}>
            <ArrowRight size={14} />
          </WaveButton>
        </div>

        {/* Member avatars */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex -space-x-2">
            {familyMembers.slice(0, 4).map(member => (
              <AvatarWrapper
                key={member.id}
                src={member.avatar}
                alt={member.name}
                fallback={getInitials(member.name)}
                size="sm"
                className="w-8 h-8 border-2 border-white"
              />
            ))}
            {familyMembers.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                +{familyMembers.length - 4}
              </div>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {stats.activeToday}/{stats.totalMembers} 명 활동 중
          </div>
        </div>

        {/* Recent activity */}
        <div className="space-y-2">
          {sortedActivity.map(activity => (
            <div key={activity.id} className="flex items-start gap-2 text-xs">
              {getActivityIcon(activity.action)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <AvatarWrapper
                    src={activity.userAvatar}
                    alt={activity.userName}
                    fallback={getAvatarInitials(activity.userName)}
                    size="sm"
                    className="w-6 h-6"
                  />
                  <span className="font-medium text-white">
                    {activity.userName}
                  </span>
                </div>
                <span className="text-gray-300 ml-1">
                  {getActivityMessage(activity)}
                </span>
                <div className="text-gray-400">
                  {formatDistanceToNow(activity.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedActivity.length === 0 && (
          <p className="text-center text-gray-400 py-4 text-sm">
            아직 활동이 없습니다
          </p>
        )}
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="light" className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">가족 활동</h3>
            <p className="text-sm text-gray-300">
              우리 가족의 최근 활동을 확인하세요
            </p>
          </div>
        </div>

        <WaveButton variant="ghost" size="sm" onClick={onManageFamily}>
          가족 관리
        </WaveButton>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary-400" />
            <div className="text-2xl font-bold text-primary-400">
              {stats.totalMembers}
            </div>
          </div>
          <div className="text-xs text-gray-300">총 가족</div>
        </div>

        <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-green-400" />
            <div className="text-2xl font-bold text-green-400">
              {stats.activeToday}
            </div>
          </div>
          <div className="text-xs text-gray-300">오늘 활동</div>
        </div>

        <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <div className="flex items-center justify-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            <div className="text-2xl font-bold text-blue-400">
              {stats.totalTasksCompleted}
            </div>
          </div>
          <div className="text-xs text-gray-300">완료 할일</div>
        </div>

        <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Target className="w-4 h-4 text-purple-400" />
            <div className="text-2xl font-bold text-purple-400">
              {Math.round(stats.teamCompletionRate)}%
            </div>
          </div>
          <div className="text-xs text-gray-300">팀 달성률</div>
        </div>
      </div>

      {/* Family Members */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-3">가족 구성원</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {familyMembers.map(member => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(member.name)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {member.name}
                </div>
                <div className="text-xs text-gray-600 capitalize">
                  {member.role}
                </div>
                {member.lastActive && (
                  <div className="text-xs text-gray-500">
                    {member.lastActive
                      ? formatDistanceToNow(member.lastActive)
                      : '오프라인'}
                  </div>
                )}
              </div>
              <div
                className={`w-3 h-3 rounded-full ${
                  member.lastActive ? 'bg-green-400' : 'bg-gray-300'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Top Performer */}
      {stats.topPerformer && (
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <div>
              <div className="font-medium text-gray-900">이주의 MVP</div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{stats.topPerformer.name}</span>
                님이{' '}
                <span className="font-bold text-yellow-600">
                  {stats.topPerformer.count}개
                </span>
                의 할일을 완료했어요! 👏
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-md font-medium text-gray-800">최근 활동</h4>
          <WaveButton variant="ghost" size="sm" onClick={onViewAllActivity}>
            모두 보기
            <ArrowRight size={14} />
          </WaveButton>
        </div>

        <div className="space-y-3">
          {sortedActivity.map(activity => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                {activity.userAvatar ? (
                  <img
                    src={activity.userAvatar}
                    alt={activity.userName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(activity.userName)
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  {getActivityIcon(activity.action)}
                  <div className="text-sm text-gray-800">
                    <span className="font-medium">{activity.userName}</span>님이{' '}
                    <span className="text-gray-700">
                      {getActivityMessage(activity)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {formatDistanceToNow(activity.timestamp)}
                </div>

                {activity.metadata?.comment && (
                  <div className="mt-2 p-2 bg-white rounded text-xs text-gray-600 italic">
                    "{activity.metadata.comment}"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {sortedActivity.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">아직 가족 활동이 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">
              가족 구성원들이 할일을 완료하면 여기에 표시됩니다
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
