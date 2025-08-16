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
  };
}

export interface NotificationSettings {
  userId: string;
  taskReminders: boolean;
  groupNotifications: boolean;
  systemNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "08:00"
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
