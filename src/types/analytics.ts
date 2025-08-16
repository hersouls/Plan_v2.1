import { Timestamp } from 'firebase/firestore';

export interface Analytics {
  id: string;                   // Format: "{scope}_{period}_{date}"
  type: 'group_daily' | 'group_weekly' | 'group_monthly' | 'user_daily' | 'user_weekly' | 'user_monthly';
  
  // Scope
  groupId?: string;
  userId?: string;
  
  // Time period
  period: 'daily' | 'weekly' | 'monthly';
  date: string;                 // "2024-01-15", "2024-W03", "2024-01"
  
  stats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;
    
    byCategory: Record<string, CategoryStats>;
    byPriority: Record<string, PriorityStats>;
    byMember?: Record<string, MemberStats>;
    
    completionsByHour?: number[24];
    completionsByDay?: number[7];
  };
  
  generatedAt: Timestamp;
  version: number;
}

export interface CategoryStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  completionRate: number;
}

export interface PriorityStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  completionRate: number;
}

export interface MemberStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgress: number;
  completionRate: number;
  averageCompletionTime: number;
  points: number;
}

export interface UserStatistics {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';
  
  tasks: {
    created: number;
    completed: number;
    inProgress: number;
    overdue: number;
  };
  
  performance: {
    completionRate: number;
    averageCompletionTime: number;
    streak: number;
    points: number;
  };
  
  trends: {
    completionTrend: number;    // +/- percentage from previous period
    activityTrend: number;
  };
  
  updatedAt: Timestamp;
}

export interface GroupStatistics {
  groupId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';
  
  tasks: {
    created: number;
    completed: number;
    inProgress: number;
    overdue: number;
  };
  
  performance: {
    completionRate: number;
    averageCompletionTime: number;
    totalPoints: number;
  };
  
  members: {
    total: number;
    active: number;
    newThisPeriod: number;
  };
  
  trends: {
    completionTrend: number;    // +/- percentage from previous period
    activityTrend: number;
  };
  
  updatedAt: Timestamp;
}