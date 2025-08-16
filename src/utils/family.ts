import {
  format,
  formatDistanceToNow,
  isThisMonth,
  isThisWeek,
  isToday,
  startOfWeek,
  subDays,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ActivityType,
  FamilyActivity,
  FamilyMember,
  FamilyRole,
  FamilyStatistics,
  LeaderboardEntry,
  MemberStats,
  TimeRange,
} from '../types/family';

// Date and Time Utilities
export const formatRelativeTime = (
  date: Date | string | any,
  addSuffix = true
): string => {
  try {
    const dateObj =
      typeof date === 'string'
        ? new Date(date)
        : date?.toDate
        ? date.toDate()
        : new Date(date);

    if (isNaN(dateObj.getTime())) {
      return '날짜 정보 없음';
    }

    return formatDistanceToNow(dateObj, {
      addSuffix,
      locale: ko,
    });
  } catch (error) {
    console.warn('Error formatting relative time:', error);
    return '날짜 정보 없음';
  }
};

export const formatDateTime = (
  date: Date | string | any,
  formatString = 'yyyy.MM.dd HH:mm'
): string => {
  try {
    const dateObj =
      typeof date === 'string'
        ? new Date(date)
        : date?.toDate
        ? date.toDate()
        : new Date(date);

    if (isNaN(dateObj.getTime())) {
      return '날짜 정보 없음';
    }

    return format(dateObj, formatString);
  } catch (error) {
    console.warn('Error formatting date time:', error);
    return '날짜 정보 없음';
  }
};

export const isWithinTimeRange = (
  date: Date | string | any,
  range: TimeRange
): boolean => {
  try {
    const dateObj =
      typeof date === 'string'
        ? new Date(date)
        : date?.toDate
        ? date.toDate()
        : new Date(date);

    if (isNaN(dateObj.getTime())) {
      return false;
    }

    switch (range) {
      case 'today':
        return isToday(dateObj);
      case 'week':
        return isThisWeek(dateObj);
      case 'month':
        return isThisMonth(dateObj);
      case 'all':
        return true;
      default:
        return false;
    }
  } catch (error) {
    console.warn('Error checking time range:', error);
    return false;
  }
};

// Member and Role Utilities
export const filterActiveMembers = (
  members: FamilyMember[],
  timeRange: TimeRange = 'week'
): FamilyMember[] => {
  return members.filter(member => {
    if (member.status === 'inactive') return false;
    if (timeRange === 'all') return true;
    return member.lastActive
      ? isWithinTimeRange(member.lastActive, timeRange)
      : false;
  });
};

export const sortMembersByPerformance = (
  members: FamilyMember[],
  sortBy:
    | 'completionRate'
    | 'totalTasks'
    | 'streak'
    | 'points' = 'completionRate'
): FamilyMember[] => {
  return [...members].sort((a, b) => {
    const aValue = a.stats[sortBy] || 0;
    const bValue = b.stats[sortBy] || 0;
    return bValue - aValue;
  });
};

export const getRoleDisplayName = (role: FamilyRole): string => {
  const roleNames: Record<FamilyRole, string> = {
    owner: '그룹장',
    admin: '관리자',
    vice_owner: '부그룹장',
    parent: '부모',
    child: '자녀',
    guardian: '보호자',
    member: '멤버',
    viewer: '뷰어',
  };

  return roleNames[role] || '멤버';
};

export const getRoleColor = (role: FamilyRole): string => {
  const roleColors: Record<FamilyRole, string> = {
    owner: 'text-yellow-500',
    admin: 'text-red-500',
    vice_owner: 'text-orange-500',
    parent: 'text-blue-500',
    child: 'text-green-500',
    guardian: 'text-purple-500',
    member: 'text-gray-500',
    viewer: 'text-gray-400',
  };

  return roleColors[role] || 'text-gray-500';
};

// Statistics and Analytics
export const calculateFamilyStats = (
  members: FamilyMember[],
  activities: FamilyActivity[],
  timeRange: TimeRange = 'week'
): FamilyStatistics => {
  const filteredActivities = activities.filter(activity =>
    isWithinTimeRange(activity.timestamp, timeRange)
  );

  const activeMembers = filterActiveMembers(members, timeRange);

  const totalTasks = filteredActivities.filter(
    a => a.type === 'task_created'
  ).length;
  const completedTasks = filteredActivities.filter(
    a => a.type === 'task_completed'
  ).length;
  const overdueTasks = filteredActivities.filter(
    a => a.type === 'task_overdue'
  ).length;

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate growth rates
  const previousPeriodStart =
    timeRange === 'week'
      ? subDays(startOfWeek(new Date()), 7)
      : timeRange === 'month'
      ? subDays(new Date(), 60)
      : subDays(new Date(), 365);

  const previousActivities = activities.filter(activity => {
    const activityDate =
      typeof activity.timestamp === 'string'
        ? new Date(activity.timestamp)
        : activity.timestamp?.toDate
        ? activity.timestamp.toDate()
        : new Date(activity.timestamp);
    return (
      activityDate >= previousPeriodStart &&
      activityDate <
        (timeRange === 'week' ? startOfWeek(new Date()) : new Date())
    );
  });

  const previousCompletedTasks = previousActivities.filter(
    a => a.type === 'task_completed'
  ).length;
  const weeklyGrowth =
    previousCompletedTasks > 0
      ? Math.round(
          ((completedTasks - previousCompletedTasks) / previousCompletedTasks) *
            100
        )
      : 0;

  return {
    totalTasks,
    completedTasks,
    activeTasks: totalTasks - completedTasks - overdueTasks,
    overdueTasks,
    completionRate,
    totalMembers: members.length,
    activeMembers: activeMembers.length,
    lastActivityAt:
      activities.length > 0 ? activities[0].timestamp : new Date(),
    weeklyGrowth,
    monthlyGrowth: weeklyGrowth * 4, // Approximate monthly growth
  };
};

export const calculateMemberPerformance = (
  member: FamilyMember,
  activities: FamilyActivity[],
  timeRange: TimeRange = 'week'
): MemberStats => {
  const memberActivities = activities.filter(
    activity =>
      activity.userId === member.userId &&
      isWithinTimeRange(activity.timestamp, timeRange)
  );

  const completedTasks = memberActivities.filter(
    a => a.type === 'task_completed'
  ).length;
  const totalTasks = memberActivities.filter(
    a => a.type === 'task_created' || a.type === 'task_assigned'
  ).length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate streak (consecutive days with completed tasks)
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const checkDate = subDays(today, i);
    const dayActivities = memberActivities.filter(activity => {
      const activityDate =
        typeof activity.timestamp === 'string'
          ? new Date(activity.timestamp)
          : activity.timestamp?.toDate
          ? activity.timestamp.toDate()
          : new Date(activity.timestamp);
      return (
        format(activityDate, 'yyyy-MM-dd') ===
          format(checkDate, 'yyyy-MM-dd') && activity.type === 'task_completed'
      );
    });

    if (dayActivities.length > 0) {
      streak++;
    } else if (i > 0) {
      break; // Streak broken
    }
  }

  // Calculate points based on completion rate, streak, and task difficulty
  const points = Math.round(
    completedTasks * 10 + streak * 5 + completionRate * 2
  );

  // Get badges (simplified)
  const badges: string[] = [];
  if (streak >= 7) badges.push('week-streak');
  if (completionRate >= 90) badges.push('perfectionist');
  if (completedTasks >= 20) badges.push('productive');

  return {
    totalTasks,
    completedTasks,
    completionRate,
    streak,
    points,
    badges,
    lastWeekTasks: completedTasks, // Simplified
    thisMonthTasks: completedTasks * 4, // Approximate
    averageCompletionTime: 2.5, // Default 2.5 hours
  };
};

export const generateLeaderboard = (
  members: FamilyMember[],
  activities: FamilyActivity[],
  timeRange: TimeRange = 'week'
): LeaderboardEntry[] => {
  const leaderboard = members.map(member => {
    const performance = calculateMemberPerformance(
      member,
      activities,
      timeRange
    );

    // Calculate score based on multiple factors
    const score = Math.round(
      performance.completedTasks * 10 +
        performance.streak * 5 +
        performance.completionRate * 2 +
        performance.points * 0.1
    );

    return {
      id: member.id,
      name: member.name,
      avatar: member.avatar,
      score,
      completedTasks: performance.completedTasks,
      streak: performance.streak,
      points: performance.points,
      rank: 0, // Will be set after sorting
      change: 0, // Would need historical data
      badges: performance.badges,
      isCurrentUser: false, // Would need current user context
    };
  });

  // Sort by score and assign ranks
  const sortedLeaderboard = leaderboard
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return sortedLeaderboard;
};

// Activity and Message Formatting
export const formatActivityMessage = (activity: FamilyActivity): string => {
  const { type, userName, metadata } = activity;

  switch (type) {
    case 'task_completed':
      return `${userName}님이 "${
        metadata?.taskTitle || '할일'
      }"을 완료했습니다.`;
    case 'task_created':
      return `${userName}님이 새로운 할일 "${
        metadata?.taskTitle || '할일'
      }"을 만들었습니다.`;
    case 'task_assigned':
      return `${userName}님이 "${
        metadata?.assigneeName || '멤버'
      }"에게 할일을 배정했습니다.`;
    case 'member_joined':
      return `${userName}님이 가족 그룹에 참여했습니다.`;
    case 'achievement_unlocked':
      return `${userName}님이 "${
        metadata?.badgeEarned || '업적'
      }" 배지를 획득했습니다!`;
    case 'streak_achieved':
      return `${userName}님이 ${
        metadata?.streakCount || 1
      }일 연속 완료를 달성했습니다!`;
    case 'comment_added':
      return `${userName}님이 댓글을 남겼습니다.`;
    default:
      return `${userName}님의 활동`;
  }
};

export const getActivityIcon = (type: ActivityType): string => {
  const iconMap: Record<ActivityType, string> = {
    task_completed: '✅',
    task_created: '📝',
    task_assigned: '👤',
    task_overdue: '⏰',
    member_joined: '👋',
    member_left: '👋',
    achievement_unlocked: '🏆',
    streak_achieved: '🔥',
    comment_added: '💬',
    group_created: '🏠',
    group_updated: '⚙️',
    milestone_reached: '🎯',
    challenge_started: '🚀',
    challenge_completed: '🎉',
  };

  return iconMap[type] || '📌';
};

export const getActivityColor = (type: ActivityType): string => {
  const colorMap: Record<ActivityType, string> = {
    task_completed: 'text-green-500',
    task_created: 'text-blue-500',
    task_assigned: 'text-purple-500',
    task_overdue: 'text-red-500',
    member_joined: 'text-green-500',
    member_left: 'text-gray-500',
    achievement_unlocked: 'text-yellow-500',
    streak_achieved: 'text-orange-500',
    comment_added: 'text-blue-400',
    group_created: 'text-emerald-500',
    group_updated: 'text-blue-600',
    milestone_reached: 'text-purple-600',
    challenge_started: 'text-indigo-500',
    challenge_completed: 'text-green-600',
  };

  return colorMap[type] || 'text-gray-500';
};

// Engagement and Performance Scoring
export const calculateEngagementScore = (
  member: FamilyMember,
  activities: FamilyActivity[]
): number => {
  const memberActivities = activities.filter(a => a.userId === member.userId);

  // Base score from task completion
  const completionScore =
    memberActivities.filter(a => a.type === 'task_completed').length * 10;

  // Bonus for consistency (activities spread across different days)
  const activityDays = new Set(
    memberActivities.map(a => {
      const date =
        typeof a.timestamp === 'string'
          ? new Date(a.timestamp)
          : a.timestamp?.toDate
          ? a.timestamp.toDate()
          : new Date(a.timestamp);
      return format(date, 'yyyy-MM-dd');
    })
  );
  const consistencyScore = activityDays.size * 5;

  // Bonus for variety (different types of activities)
  const activityTypes = new Set(memberActivities.map(a => a.type));
  const varietyScore = activityTypes.size * 3;

  // Recent activity bonus
  const recentActivities = memberActivities.filter(a =>
    isWithinTimeRange(a.timestamp, 'week')
  );
  const recentScore = recentActivities.length * 2;

  return Math.min(
    100,
    completionScore + consistencyScore + varietyScore + recentScore
  );
};

// Data Validation and Sanitization
export const validateFamilyMember = (member: any): member is FamilyMember => {
  return (
    member &&
    typeof member.id === 'string' &&
    typeof member.userId === 'string' &&
    typeof member.name === 'string' &&
    member.stats &&
    typeof member.stats.completedTasks === 'number'
  );
};

export const validateFamilyActivity = (
  activity: any
): activity is FamilyActivity => {
  return (
    activity &&
    typeof activity.id === 'string' &&
    typeof activity.userId === 'string' &&
    typeof activity.type === 'string' &&
    activity.timestamp
  );
};

// Search and Filtering Utilities
export const filterMembersByRole = (
  members: FamilyMember[],
  roles: FamilyRole[]
): FamilyMember[] => {
  return members.filter(member => roles.includes(member.role));
};

export const searchMembers = (
  members: FamilyMember[],
  query: string
): FamilyMember[] => {
  if (!query.trim()) return members;

  const searchTerm = query.toLowerCase();
  return members.filter(
    member =>
      member.name.toLowerCase().includes(searchTerm) ||
      member.email?.toLowerCase().includes(searchTerm)
  );
};

export const filterActivitiesByType = (
  activities: FamilyActivity[],
  types: ActivityType[]
): FamilyActivity[] => {
  return activities.filter(activity => types.includes(activity.type));
};

// Utility for generating sample data (for development/testing)
export const generateSampleFamilyData = (
  groupId: string,
  memberCount: number = 4
): {
  members: FamilyMember[];
  activities: FamilyActivity[];
  stats: FamilyStatistics;
} => {
  const sampleNames = [
    '김아빠',
    '박엄마',
    '김수현',
    '김도현',
    '이할머니',
    '최삼촌',
  ];
  const sampleActivities: ActivityType[] = [
    'task_completed',
    'task_created',
    'task_assigned',
    'comment_added',
  ];

  const members: FamilyMember[] = Array.from(
    { length: memberCount },
    (_, index) => ({
      id: `member-${index + 1}`,
      userId: `user-${index + 1}`,
      name: sampleNames[index] || `멤버${index + 1}`,
      email: `member${index + 1}@example.com`,
      role: index === 0 ? 'owner' : index === 1 ? 'parent' : 'child',
      joinedAt: subDays(new Date(), Math.random() * 30),
      lastActive: subDays(new Date(), Math.random() * 7),
      isOnline: Math.random() > 0.5,
      status: 'active' as const,
      stats: {
        totalTasks: Math.floor(Math.random() * 50) + 10,
        completedTasks: Math.floor(Math.random() * 30) + 5,
        completionRate: Math.floor(Math.random() * 40) + 60,
        streak: Math.floor(Math.random() * 14),
        points: Math.floor(Math.random() * 500) + 100,
        badges: ['early-bird', 'consistent'],
        lastWeekTasks: Math.floor(Math.random() * 10) + 2,
        thisMonthTasks: Math.floor(Math.random() * 30) + 10,
        averageCompletionTime: Math.random() * 4 + 1,
      },
    })
  );

  const activities: FamilyActivity[] = Array.from(
    { length: 20 },
    (_, index) => {
      const randomMember = members[Math.floor(Math.random() * members.length)];
      const randomType =
        sampleActivities[Math.floor(Math.random() * sampleActivities.length)];

      return {
        id: `activity-${index + 1}`,
        groupId,
        userId: randomMember.userId,
        userName: randomMember.name,
        userAvatar: randomMember.avatar,
        type: randomType,
        title: formatActivityMessage({
          id: '',
          groupId,
          userId: randomMember.userId,
          userName: randomMember.name,
          type: randomType,
          title: '',
          timestamp: subDays(new Date(), Math.random() * 7),
          metadata: {
            taskTitle: `할일 ${index + 1}`,
            assigneeName:
              members[Math.floor(Math.random() * members.length)].name,
          },
        } as FamilyActivity),
        timestamp: subDays(new Date(), Math.random() * 7),
        metadata: {
          taskTitle: `할일 ${index + 1}`,
          pointsEarned: Math.floor(Math.random() * 20) + 5,
        },
      };
    }
  );

  const stats = calculateFamilyStats(members, activities, 'week');

  return { members, activities, stats };
};

// Export all utilities as a single object for easier importing
export const familyUtils = {
  formatRelativeTime,
  formatDateTime,
  isWithinTimeRange,
  filterActiveMembers,
  sortMembersByPerformance,
  getRoleDisplayName,
  getRoleColor,
  calculateFamilyStats,
  calculateMemberPerformance,
  generateLeaderboard,
  formatActivityMessage,
  getActivityIcon,
  getActivityColor,
  calculateEngagementScore,
  validateFamilyMember,
  validateFamilyActivity,
  filterMembersByRole,
  searchMembers,
  filterActivitiesByType,
  generateSampleFamilyData,
};
