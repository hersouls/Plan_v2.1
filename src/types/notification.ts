export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'group' | 'system' | 'reminder';
  status: 'unread' | 'read';
  priority: 'low' | 'medium' | 'high';
  createdAt: any; // Firestore Timestamp
  readAt?: any; // Firestore Timestamp
  data?: {
    taskId?: string;
    groupId?: string;
    actionUrl?: string;
    isTest?: boolean;
  };
}

export interface NotificationSettings {
  userId: string;
  push: boolean;
  email: boolean;
  taskReminders: boolean;
  taskAssignments: boolean;
  taskCompletions: boolean;
  taskComments: boolean;
  dailySummary: boolean;
  weeklyReport: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string; // "08:00"
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: {
    task: number;
    group: number;
    system: number;
    reminder: number;
  };
}

// 고급 필터링을 위한 새로운 타입들
export interface AdvancedFilters {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  priority: string[];
  type: string[];
  status: string[];
  search: string;
  sortBy: 'createdAt' | 'priority' | 'type';
  sortOrder: 'asc' | 'desc';
}

export interface NotificationGroup {
  key: string;
  label: string;
  notifications: Notification[];
  count: number;
}

export interface NotificationSearchResult {
  notifications: Notification[];
  totalCount: number;
  searchTime: number;
}
