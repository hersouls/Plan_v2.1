import { Timestamp } from 'firebase/firestore';
import { TypographyAccessibility, FontSize, LineHeight, LetterSpacing } from './typography';

export type UserStatus = 'online' | 'offline' | 'away' | 'busy';
export type UserTheme = 'light' | 'dark' | 'system';
export type NotificationPreference = 'all' | 'important' | 'none';
export type MemberRole = 'owner' | 'admin' | 'vice_owner' | 'member' | 'viewer';

export interface User {
  id: string;                    // Auth UID
  email: string;
  displayName: string;
  photoURL?: string;            // Standardized field name
  bio?: string;
  phoneNumber?: string;
  location?: string;            // 사용자 위치 정보 추가
  avatarStorageUrl?: string;    // Firebase Storage URL 추가
  status: UserStatus;
  lastSeen: Timestamp;
  isAnonymous: boolean;
  emailVerified: boolean;
  provider: 'google' | 'github' | 'email' | 'anonymous';
  
  // App-specific fields
  groupIds: string[];           // Groups user belongs to
  loginCount: number;
  lastLoginAt: Timestamp;
  
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    weekStartsOn: number;
    notifications: NotificationPreferences;
    defaultTaskSettings: DefaultTaskSettings;
    privacy: PrivacySettings;
  };
  
  stats: {
    totalTasksCreated: number;
    totalTasksCompleted: number;
    totalTasksAssigned: number;
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
  };
  
  badges: string[];
  achievements: string[];
  points: number;
  level: number;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NotificationPreferences {
  push: boolean;
  taskReminders: boolean;
  taskAssignments: boolean;
  taskCompletions: boolean;
  taskComments: boolean;
  dailySummary: boolean;
  weeklyReport: boolean;
}

export interface DefaultTaskSettings {
  priority: 'low' | 'medium' | 'high';
  category: string;
  reminderTime: string;
}

export interface PrivacySettings {
  profileVisible: boolean;
  activityVisible: boolean;
  statsVisible: boolean;
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  showTaskActivity: boolean;
}

export interface UserSettings {
  userId: string;
  theme: UserTheme;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  startOfWeek: 0 | 1 | 6; // 0=Sunday, 1=Monday, 6=Saturday
  notifications: {
    enabled: boolean;
    preference: NotificationPreference;
    push: boolean;
    desktop: boolean;
    sound: boolean;
    vibration: boolean;
    reminders: {
      taskDue: boolean;
      taskAssigned: boolean;
      taskCompleted: boolean;
      taskComment: boolean;
      dailySummary: boolean;
      dailySummaryTime?: string; // HH:mm format
    };
  };
  privacy: PrivacySettings;
  accessibility: TypographyAccessibility & {
    screenReaderMode: boolean;
  };
}

export interface UserStats {
  userId: string;
  tasksCreated: number;
  tasksCompleted: number;
  tasksInProgress: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  averageCompletionTime: number; // in minutes
  completionRate: number; // percentage
  achievements: Achievement[];
  lastActivityAt: Timestamp;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Timestamp;
  progress?: {
    current: number;
    target: number;
  };
}

export interface UserGroup {
  groupId: string;
  groupName: string;
  role: MemberRole;
  joinedAt: Timestamp;
  isFavorite: boolean;
  notificationSettings?: {
    muted: boolean;
    mutedUntil?: Timestamp;
  };
}

export interface UserDevice {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  platform: string;
  fcmToken?: string;
  lastActive: Timestamp;
  createdAt: Timestamp;
}

export interface CreateUserInput {
  email: string;
  displayName: string;
  photoURL?: string;
  provider: 'google' | 'github' | 'email' | 'anonymous';
}

export interface UpdateUserInput {
  displayName?: string;
  photoURL?: string;
  bio?: string;
  phoneNumber?: string;
  status?: UserStatus;
}

export interface UserNotification {
  id: string;
  userId: string;
  type: 'task_assigned' | 'task_due' | 'task_completed' | 'comment_added' | 'mention' | 'group_invite';
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Timestamp;
}

export interface UserPreferences {
  defaultTaskPriority: 'low' | 'medium' | 'high';
  defaultTaskCategory: string;
  quickAddEnabled: boolean;
  autoCompleteSubtasks: boolean;
  showCompletedTasks: boolean;
  taskViewMode: 'list' | 'board' | 'calendar';
  sortBy: 'dueDate' | 'priority' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
}