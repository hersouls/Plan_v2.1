import { Timestamp } from 'firebase/firestore';
import { MemberRole } from './user';

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  ownerId: string; // Group owner

  // Member management - Use EITHER memberIds OR members subcollection
  memberIds: string[]; // Simple array for queries
  memberRoles: Record<string, MemberRole>; // userId -> role mapping

  settings: {
    allowMembersToInvite: boolean;
    requireApprovalForNewMembers: boolean;
    defaultRole: MemberRole;
    taskCategories: string[]; // Custom categories
    taskTags: string[]; // Custom tags
    theme?: {
      primaryColor?: string;
      accentColor?: string;
    };
  };

  subscription?: {
    plan: 'free' | 'premium' | 'enterprise';
    validUntil?: Timestamp;
    maxMembers: number;
  };

  statistics: {
    totalTasks: number;
    completedTasks: number;
    activeTasks: number;
    lastActivityAt: Timestamp;
    activeMembersCount: number;
  };

  isPublic: boolean;
  tags: string[]; // Public group tags

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GroupMember {
  userId: string;
  groupId: string;
  role: MemberRole;
  joinedAt: Timestamp;
  invitedBy?: string;
  isActive: boolean;
  lastActivityAt?: Timestamp;
  // Compatibility aliases
  lastActive?: Timestamp;
  displayName?: string;
  userName?: string;
  userEmail?: string;
  avatar?: string;
  userAvatar?: string;
  notifications?: {
    muted: boolean;
    mutedUntil?: Timestamp;
  };
  notificationSettings?: {
    muted: boolean;
    mutedUntil?: Timestamp;
  };
}

export interface GroupInvite {
  id: string;
  groupId: string;
  groupName: string;
  invitedBy: string;
  invitedEmail?: string;
  inviteCode: string; // Public invite code
  role: MemberRole;

  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  message?: string;

  acceptedBy?: string;
  acceptedAt?: Timestamp;
  expiresAt: Timestamp;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  avatar?: string;
  ownerId: string;
  isPublic?: boolean;
  tags?: string[];
  settings?: Partial<Group['settings']>;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
  avatar?: string;
  isPublic?: boolean;
  tags?: string[];
  settings?: Partial<Group['settings']>;
}

export interface GroupStats {
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

  memberStats?: Array<{
    userId: string;
    userName: string;
    tasksCompleted: number;
    totalTasks?: number;
    points: number;
    rank?: number;
  }>;

  trends: {
    completionTrend: number; // +/- percentage from previous period
    activityTrend: number;
  };

  updatedAt: Timestamp;
}

export interface GroupNotification {
  id: string;
  groupId: string;
  type:
    | 'task_assigned'
    | 'task_completed'
    | 'member_joined'
    | 'member_left'
    | 'invite_sent';
  title: string;
  message: string;
  data?: Record<string, any>;
  readBy: string[];
  createdAt: Timestamp;
}

// Type aliases for consistency
export type GroupInvitation = GroupInvite; // Backward compatibility
export type FamilyGroup = Group;
export type GroupRole = MemberRole;
