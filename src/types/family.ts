import { Timestamp } from 'firebase/firestore';

// Core Family Types
export interface FamilyGroup {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  memberIds: string[];
  memberRoles: Record<string, FamilyRole>;
  settings: FamilySettings;
  statistics: FamilyStatistics;
  inviteCode?: string;
  inviteCodeExpiresAt?: Date;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  email?: string;
  avatar?: string;
  role: FamilyRole;
  joinedAt: Timestamp | Date;
  lastActive?: Timestamp | Date;
  isOnline: boolean;
  stats: MemberStats;
  status: 'active' | 'inactive' | 'pending';
  notificationSettings?: NotificationSettings;
}

export interface FamilyActivity {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: ActivityType;
  title: string;
  description?: string;
  metadata?: ActivityMetadata;
  timestamp: Timestamp | Date;
  isImportant?: boolean;
}

export interface MemberStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  streak: number;
  points: number;
  rank?: number;
  badges: string[];
  lastWeekTasks: number;
  thisMonthTasks: number;
  averageCompletionTime: number; // in hours
}

export interface FamilyStatistics {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  overdueTasks: number;
  completionRate: number;
  totalMembers: number;
  activeMembers: number;
  lastActivityAt: Timestamp | Date;
  weeklyGrowth: number;
  monthlyGrowth: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  completedTasks: number;
  streak: number;
  points: number;
  rank: number;
  change: number; // rank change from previous period
  badges: string[];
  isCurrentUser?: boolean;
}

// Settings and Configuration
export interface FamilySettings {
  allowMembersToInvite: boolean;
  requireApprovalForNewMembers: boolean;
  defaultRole: FamilyRole;
  taskCategories: string[];
  taskTags: string[];
  notificationSettings: NotificationSettings;
  theme?: FamilyTheme;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  newTaskAssigned: boolean;
  taskCompleted: boolean;
  taskOverdue: boolean;
  newComment: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
  achievementUnlocked: boolean;
}

export interface PrivacySettings {
  showLastActive: boolean;
  showCompletionStats: boolean;
  allowDirectMessages: boolean;
  showOnlineStatus: boolean;
}

export interface FamilyTheme {
  primaryColor: string;
  accentColor: string;
  backgroundImage?: string;
  isDarkMode: boolean;
}

// Activity and Events
export interface ActivityMetadata {
  taskId?: string;
  taskTitle?: string;
  assigneeName?: string;
  assigneeId?: string;
  comment?: string;
  pointsEarned?: number;
  badgeEarned?: string;
  streakCount?: number;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Timestamp | Date;
  completedInTime?: boolean;
  timeSpent?: number; // in minutes
}

// Enums and Union Types
export type FamilyRole = 'owner' | 'admin' | 'vice_owner' | 'parent' | 'child' | 'guardian' | 'member' | 'viewer';

export type ActivityType = 
  | 'task_created'
  | 'task_completed' 
  | 'task_assigned'
  | 'task_overdue'
  | 'member_joined'
  | 'member_left'
  | 'achievement_unlocked'
  | 'streak_achieved'
  | 'comment_added'
  | 'group_created'
  | 'group_updated'
  | 'milestone_reached'
  | 'challenge_started'
  | 'challenge_completed';

export type FamilyView = 'overview' | 'activity' | 'leaderboard' | 'members' | 'stats' | 'settings';

export type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

export type SortBy = 'name' | 'completionRate' | 'totalTasks' | 'streak' | 'points' | 'joinedAt' | 'lastActive';

export type FilterBy = 'all' | 'active' | 'inactive' | 'parents' | 'children' | 'guardians' | 'top_performers';

// View and UI Types
export interface FamilyDashboardState {
  currentView: FamilyView;
  timeRange: TimeRange;
  sortBy: SortBy;
  filterBy: FilterBy;
  searchQuery: string;
  showInactive: boolean;
  compactMode: boolean;
}

export interface FamilyChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}

// API and Response Types
export interface CreateFamilyGroupInput {
  name: string;
  description?: string;
  settings?: Partial<FamilySettings>;
  inviteMembers?: string[]; // email addresses
}

export interface UpdateFamilyGroupInput {
  name?: string;
  description?: string;
  settings?: Partial<FamilySettings>;
}

export interface InviteMemberInput {
  email: string;
  role: FamilyRole;
  message?: string;
  expiresAt?: Date;
}

export interface FamilyInvitation {
  id: string;
  groupId: string;
  groupName: string;
  inviterName: string;
  inviterAvatar?: string;
  email: string;
  role: FamilyRole;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Timestamp | Date;
  expiresAt: Timestamp | Date;
  acceptedAt?: Timestamp | Date;
}

// Hook Return Types
export interface UseFamilyReturn {
  group: FamilyGroup | null;
  members: FamilyMember[];
  activities: FamilyActivity[];
  stats: FamilyStatistics | null;
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  
  // Group operations
  updateGroup: (updates: UpdateFamilyGroupInput) => Promise<void>;
  deleteGroup: () => Promise<void>;
  leaveGroup: () => Promise<void>;
  
  // Member operations
  inviteMember: (input: InviteMemberInput) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: FamilyRole) => Promise<void>;
  
  // Activity operations
  markActivityAsRead: (activityId: string) => Promise<void>;
  markAllActivitiesAsRead: () => Promise<void>;
  
  // Utility functions
  generateInviteLink: () => Promise<string>;
  exportFamilyData: () => Promise<Blob>;
}

// Analytics and Reports
export interface FamilyAnalytics {
  period: TimeRange;
  totalEngagementHours: number;
  averageTasksPerMember: number;
  mostActiveDay: string;
  mostActiveHour: number;
  topCategories: { category: string; count: number }[];
  completionTrends: { date: string; completed: number; created: number }[];
  memberPerformance: {
    memberId: string;
    name: string;
    improvementRate: number;
    consistencyScore: number;
    collaborationScore: number;
  }[];
  predictions: {
    nextWeekCompletion: number;
    burnoutRisk: { memberId: string; riskLevel: 'low' | 'medium' | 'high' }[];
    recommendedActions: string[];
  };
}

// Error Types
export interface FamilyError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  action?: string;
}

// Export default interface for main component props
export interface FamilyManagementProps {
  initialView?: FamilyView;
  groupId?: string;
  compact?: boolean;
  className?: string;
  theme?: FamilyTheme;
  onViewChange?: (view: FamilyView) => void;
  onError?: (error: FamilyError) => void;
}