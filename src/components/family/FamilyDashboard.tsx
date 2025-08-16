import {
  Activity,
  Award,
  Calendar,
  Plus,
  Settings,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { cn } from '../../lib/utils';
import {
  FamilyActivity,
  FamilyGroup,
  FamilyMember,
  FamilyStatistics,
  FamilyView,
  LeaderboardEntry,
} from '../../types/family';
import {
  calculateEngagementScore,
  calculateFamilyStats,
  calculateMemberPerformance,
  formatActivityMessage,
  formatRelativeTime,
  generateLeaderboard,
} from '../../utils/family';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Badge } from '../ui/badge';
import { AvatarWrapper, getAvatarInitials } from '../ui/avatar';

// Import existing components for backward compatibility
import { FamilyStats } from './FamilyStats';
import { LeaderBoard } from './LeaderBoard';

interface FamilyDashboardProps {
  group: FamilyGroup;
  members: FamilyMember[];
  activities: FamilyActivity[];
  view?: FamilyView;
  compact?: boolean;
  className?: string;
  onViewChange?: (view: FamilyView) => void;
  onMemberClick?: (member: FamilyMember) => void;
  onInviteMember?: () => void;
  onSettings?: () => void;
}

/**
 * Navigation tabs for dashboard views
 */
const ViewTabs: React.FC<{
  currentView: FamilyView;
  onViewChange: (view: FamilyView) => void;
  compact?: boolean;
}> = memo(({ currentView, onViewChange, compact }) => {
  const views: { key: FamilyView; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: '개요', icon: Activity },
    { key: 'activity', label: '활동', icon: Calendar },
    { key: 'leaderboard', label: '순위', icon: Trophy },
    { key: 'members', label: '멤버', icon: Users },
    { key: 'stats', label: '통계', icon: TrendingUp },
  ];

  return (
    <div
      className={cn(
        'flex gap-1 p-1 bg-white/10 rounded-lg',
        compact && 'gap-0.5 p-0.5'
      )}
    >
      {views.map(({ key, label, icon: Icon }) => (
        <WaveButton
          key={key}
          variant={currentView === key ? 'primary' : 'ghost'}
          size={compact ? 'sm' : 'md'}
          onClick={() => onViewChange(key)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 transition-all',
            compact && 'px-2 py-1 gap-1',
            currentView === key
              ? 'bg-white/20 text-white'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          )}
        >
          <Icon className={cn('w-4 h-4', compact && 'w-3 h-3')} />
          <span
            className={cn(
              'font-medium',
              compact ? 'text-xs hidden sm:inline' : 'text-sm'
            )}
          >
            {label}
          </span>
        </WaveButton>
      ))}
    </div>
  );
});

/**
 * Overview section with key metrics
 */
const OverviewSection: React.FC<{
  stats: FamilyStatistics;
  engagementScore: number;
  compact?: boolean;
}> = memo(({ stats, engagementScore, compact }) => {
  const metrics = [
    {
      label: '활성 멤버',
      value: `${stats.activeMembers}/${stats.totalMembers}`,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      label: '완료율',
      value: `${Math.round(stats.completionRate)}%`,
      icon: Target,
      color: 'text-green-500',
    },
    {
      label: '참여도',
      value: `${engagementScore}%`,
      icon: Zap,
      color: 'text-yellow-500',
    },
    {
      label: '주간 성장',
      value: `${stats.weeklyGrowth > 0 ? '+' : ''}${stats.weeklyGrowth}%`,
      icon: Star,
      color: 'text-purple-500',
    },
  ];

  return (
    <div
      className={cn(
        'grid gap-4',
        compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'
      )}
    >
      {metrics.map((metric, index) => (
        <GlassCard key={index} variant="light" className="p-4">
          <div className="flex items-center justify-between mb-2">
            <metric.icon className={cn('w-5 h-5', metric.color)} />
            <span className="text-xs text-white/60">{metric.label}</span>
          </div>
          <div className="text-2xl font-bold text-white">{metric.value}</div>
        </GlassCard>
      ))}
    </div>
  );
});

/**
 * Activity feed section
 */
const ActivitySection: React.FC<{
  activities: FamilyActivity[];
  members: Map<string, FamilyMember>;
  limit?: number;
  compact?: boolean;
}> = memo(({ activities, members, limit = 10, compact }) => {
  const recentActivities = activities.slice(0, limit);

  return (
    <div className="space-y-3">
      {recentActivities.map(activity => {
        const message = formatActivityMessage(activity);

        return (
          <div
            key={activity.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors',
              compact && 'p-2 gap-2'
            )}
          >
            {/* Activity icon based on type */}
            <div
              className={cn(
                'w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0',
                compact && 'w-6 h-6'
              )}
            >
              {(activity.type === 'task_completed' ||
                activity.type === 'task_created') && (
                <Target className="w-4 h-4 text-white" />
              )}
              {activity.type === 'achievement_unlocked' && (
                <Award className="w-4 h-4 text-yellow-400" />
              )}
              {activity.type === 'milestone_reached' && (
                <Trophy className="w-4 h-4 text-purple-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={cn('text-white', compact ? 'text-xs' : 'text-sm')}>
                {message}
              </p>
              <p
                className={cn(
                  'text-white/60 mt-1',
                  compact ? 'text-xs' : 'text-sm'
                )}
              >
                {formatRelativeTime(activity.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
});

/**
 * Leaderboard section
 */
const LeaderboardSection: React.FC<{
  entries: LeaderboardEntry[];
  compact?: boolean;
}> = memo(({ entries, compact }) => {
  return (
    <div className="space-y-2">
      {entries.map(entry => {
        const medalColors = {
          1: 'text-yellow-400',
          2: 'text-gray-400',
          3: 'text-orange-400',
        };

        return (
          <div
            key={entry.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors',
              compact && 'p-2 gap-2'
            )}
          >
            {/* Position */}
            <div
              className={cn(
                'w-8 text-center font-bold',
                compact && 'w-6',
                medalColors[entry.rank as keyof typeof medalColors] ||
                  'text-white'
              )}
            >
              {entry.rank <= 3 ? (
                <Trophy
                  className={cn('w-5 h-5 mx-auto', compact && 'w-4 h-4')}
                />
              ) : (
                entry.rank
              )}
            </div>

            {/* Member info */}
            <div className="flex-1">
              <p
                className={cn(
                  'font-medium text-white',
                  compact ? 'text-sm' : 'text-base'
                )}
              >
                {entry.name}
              </p>
              <div className="flex gap-3 mt-1">
                <span className="text-xs text-white/60">
                  {entry.completedTasks} 작업
                </span>
                <span className="text-xs text-white/60">
                  {entry.streak}일 연속
                </span>
              </div>
            </div>

            {/* Score */}
            <div className="text-right">
              <p
                className={cn(
                  'font-bold text-white',
                  compact ? 'text-lg' : 'text-xl'
                )}
              >
                {entry.score}
              </p>
              {entry.change !== 0 && (
                <p
                  className={cn(
                    'text-xs',
                    entry.change > 0 ? 'text-green-400' : 'text-red-400'
                  )}
                >
                  {entry.change > 0 ? '↑' : '↓'} {Math.abs(entry.change)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

/**
 * Members grid section
 */
const MembersSection: React.FC<{
  members: FamilyMember[];
  onMemberClick?: (member: FamilyMember) => void;
  compact?: boolean;
}> = memo(({ members, onMemberClick, compact }) => {
  return (
    <div
      className={cn(
        'grid gap-4',
        compact
          ? 'grid-cols-1 sm:grid-cols-2'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      )}
    >
      {members.map(member => {
        const performance = calculateMemberPerformance(member, [], 'week');

        return (
          <GlassCard
            key={member.id}
            variant="light"
            hover
            className={cn('p-4 cursor-pointer', compact && 'p-3')}
            onClick={() => onMemberClick?.(member)}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <AvatarWrapper
                src={member.avatar}
                alt={member.name}
                fallback={getAvatarInitials(member.name)}
                size="lg"
                className="w-12 h-12"
              />

              {/* Info */}
              <div className="flex-1">
                <h4 className="font-medium text-white">{member.name}</h4>
                <p className="text-xs text-white/60 capitalize">
                  {member.role}
                </p>

                {/* Stats */}
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {member.stats.completedTasks || 0} 작업
                  </Badge>
                  {member.stats.streak && member.stats.streak > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      🔥 {member.stats.streak}일
                    </Badge>
                  )}
                </div>

                {/* Performance bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-white/60 mb-1">
                    <span>성과</span>
                    <span>{performance.completionRate}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all"
                      style={{ width: `${performance.completionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
});

/**
 * Main FamilyDashboard component
 */
export const FamilyDashboard: React.FC<FamilyDashboardProps> = memo(
  ({
    group,
    members,
    activities,
    view = 'overview',
    compact = false,
    className,
    onViewChange,
    onMemberClick,
    onInviteMember,
    onSettings,
  }) => {
    const [currentView, setCurrentView] = useState<FamilyView>(view);

    // Calculate stats and metrics
    const stats = useMemo(
      () => calculateFamilyStats(members, activities),
      [members, activities]
    );

    const engagementScore = useMemo(() => {
      if (members.length === 0) return 0;
      const totalEngagement = members.reduce(
        (sum, member) => sum + calculateEngagementScore(member, activities),
        0
      );
      return Math.round(totalEngagement / members.length);
    }, [members, activities]);

    const leaderboard = useMemo(
      () => generateLeaderboard(members, activities),
      [members, activities]
    );

    const membersMap = useMemo(
      () => new Map(members.map(m => [m.userId, m])),
      [members]
    );

    const handleViewChange = useCallback(
      (newView: FamilyView) => {
        setCurrentView(newView);
        onViewChange?.(newView);
      },
      [onViewChange]
    );

    // For backward compatibility - delegate to existing components if needed
    if (
      !group.settings?.allowMembersToInvite &&
      currentView === 'leaderboard'
    ) {
      const memberStats = members.map(member => ({
        userId: member.userId,
        userName: member.name,
        userAvatar: member.avatar,
        tasksCompleted: member.stats.completedTasks,
        completionRate: member.stats.completionRate,
        currentStreak: member.stats.streak,
        points: member.stats.points,
        badges: member.stats.badges,
      }));
      return <LeaderBoard memberStats={memberStats} />;
    }

    return (
      <div className={cn('space-y-4', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2
              className={cn(
                'font-bold text-white',
                compact ? 'text-lg' : 'text-2xl'
              )}
            >
              {group.name}
            </h2>
            <p
              className={cn(
                'text-white/60 mt-1',
                compact ? 'text-xs' : 'text-sm'
              )}
            >
              {members.length}명의 멤버 • {stats.activeMembers}명 활성
            </p>
          </div>

          <div className="flex gap-2">
            {onInviteMember && (
              <WaveButton
                variant="ghost"
                size={compact ? 'sm' : 'md'}
                onClick={onInviteMember}
                className="text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                초대
              </WaveButton>
            )}
            {onSettings && (
              <WaveButton
                variant="ghost"
                size={compact ? 'sm' : 'md'}
                onClick={onSettings}
                className="text-white"
              >
                <Settings className="w-4 h-4" />
              </WaveButton>
            )}
          </div>
        </div>

        {/* View tabs */}
        <ViewTabs
          currentView={currentView}
          onViewChange={handleViewChange}
          compact={compact}
        />

        {/* Content based on current view */}
        <GlassCard variant="medium" className={cn('p-6', compact && 'p-4')}>
          {currentView === 'overview' && (
            <div className="space-y-6">
              <OverviewSection
                stats={stats}
                engagementScore={engagementScore}
                compact={compact}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    최근 활동
                  </h3>
                  <ActivitySection
                    activities={activities}
                    members={membersMap}
                    limit={5}
                    compact={compact}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    상위 순위
                  </h3>
                  <LeaderboardSection
                    entries={leaderboard.slice(0, 5)}
                    compact={compact}
                  />
                </div>
              </div>
            </div>
          )}

          {currentView === 'activity' && (
            <ActivitySection
              activities={activities}
              members={membersMap}
              limit={20}
              compact={compact}
            />
          )}

          {currentView === 'leaderboard' && (
            <LeaderboardSection entries={leaderboard} compact={compact} />
          )}

          {currentView === 'members' && (
            <MembersSection
              members={members}
              onMemberClick={onMemberClick}
              compact={compact}
            />
          )}

          {currentView === 'stats' && (
            <FamilyStats
              stats={{
                groupId: group.id,
                period: 'week',
                members: members.map(m => ({
                  userId: m.userId,
                  userName: m.name,
                  tasksCompleted: m.stats.completedTasks,
                  completionRate: m.stats.completionRate,
                  points: m.stats.points,
                })),
                performance: {
                  completionRate: stats.completionRate,
                  averageCompletionTime: 2.5,
                  totalPoints: members.reduce(
                    (sum, m) => sum + m.stats.points,
                    0
                  ),
                },
                tasks: {
                  created: stats.totalTasks,
                  completed: stats.completedTasks,
                  inProgress: stats.activeTasks,
                  overdue: stats.overdueTasks,
                },
                trends: {
                  weeklyGrowth: stats.weeklyGrowth,
                  monthlyGrowth: stats.monthlyGrowth,
                },
                updatedAt: new Date(),
              }}
            />
          )}
        </GlassCard>
      </div>
    );
  }
);

FamilyDashboard.displayName = 'FamilyDashboard';

export default FamilyDashboard;
