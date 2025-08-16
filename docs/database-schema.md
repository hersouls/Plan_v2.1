
# Moonwave Plan - Firebase Database Schema Documentation

## 📊 Database Structure Overview

### Core Collections

#### 1. `users/{userId}` - User Profiles
```typescript
interface User {
  id: string;                    // Auth UID
  email: string;
  displayName: string;
  photoURL?: string;            // Standardized field name
  bio?: string;
  phoneNumber?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
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
```

**Subcollections:**
- `users/{userId}/devices/{deviceId}` - User devices for FCM
- `users/{userId}/settings/{settingType}` - Extended user settings

#### 2. `groups/{groupId}` - Family Groups
```typescript
interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  ownerId: string;              // Group owner
  
  // Member management - Use EITHER memberIds OR members subcollection
  memberIds: string[];          // Simple array for queries
  memberRoles: Record<string, MemberRole>; // userId -> role mapping
  
  settings: {
    allowMembersToInvite: boolean;
    requireApprovalForNewMembers: boolean;
    defaultRole: MemberRole;
    taskCategories: string[];   // Custom categories
    taskTags: string[];        // Custom tags
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
  tags: string[];               // Public group tags
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Subcollections:**
- `groups/{groupId}/members/{userId}` - Detailed member information
- `groups/{groupId}/invites/{inviteId}` - Group invitations

#### 3. `tasks/{taskId}` - Task Management
```typescript
interface Task {
  id: string;
  groupId?: string;             // Optional for personal tasks
  userId: string;               // Creator
  assigneeId: string;           // Assigned user
  
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category: string;             // Use string for flexibility
  
  dueDate?: Timestamp;
  estimatedMinutes?: number;
  actualMinutes?: number;
  
  recurring?: RecurringConfig;
  tags: string[];
  attachments?: string[];       // Storage URLs
  location?: TaskLocation;
  
  completedAt?: Timestamp;
  completedBy?: string;
  completionNotes?: string;
  
  watchers: string[];           // User IDs
  mentionedUsers: string[];
  reminders: Reminder[];
  
  // Metadata
  version: number;              // For optimistic locking
  archivedAt?: Timestamp;       // Soft delete
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Subcollections:**
- `tasks/{taskId}/comments/{commentId}` - Task comments
- `tasks/{taskId}/history/{historyId}` - Change history
- `tasks/{taskId}/attachments/{fileId}` - File attachments metadata

#### 4. `notifications/{notificationId}` - Notifications
```typescript
interface Notification {
  id: string;
  userId: string;              // Recipient
  type: 'task_assigned' | 'task_due' | 'task_completed' | 'comment_added' | 'mention' | 'group_invite';
  title: string;
  body: string;
  
  data: {
    taskId?: string;
    groupId?: string;
    fromUserId?: string;
    actionUrl?: string;
  };
  
  read: boolean;
  readAt?: Timestamp;
  
  channels: {
    push: boolean;
    email: boolean;
    inApp: boolean;
  };
  
  priority: 'low' | 'normal' | 'high';
  expiresAt?: Timestamp;
  
  createdAt: Timestamp;
}
```

#### 5. `activities/{activityId}` - Activity Logs
```typescript
interface Activity {
  id: string;
  taskId?: string;
  groupId?: string;
  userId: string;               // Actor
  userName: string;
  
  action: 'created' | 'updated' | 'completed' | 'commented' | 'assigned' | 'due_date_changed' | 'deleted';
  entityType: 'task' | 'group' | 'comment';
  entityId: string;
  
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  
  metadata: {
    userAgent?: string;
    ipAddress?: string;         // For security auditing
  };
  
  createdAt: Timestamp;
}
```

#### 6. `analytics/{analyticsId}` - Analytics Data
```typescript
interface Analytics {
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
```

### Supporting Collections

#### 7. `invites/{inviteId}` - Group Invitations
```typescript
interface Invite {
  id: string;
  groupId: string;
  groupName: string;
  invitedBy: string;
  invitedEmail?: string;
  inviteCode: string;           // Public invite code
  role: MemberRole;
  
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  message?: string;
  
  acceptedBy?: string;
  acceptedAt?: Timestamp;
  expiresAt: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 8. `statistics/{userId}` or `statistics/groups/{groupId}` - Aggregated Stats
```typescript
interface UserStatistics {
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
```

### Document Naming Conventions

- **Collections**: lowercase, plural nouns (`users`, `tasks`, `groups`)
- **Documents**: UUIDs or meaningful IDs (`task_12345`, `user_auth_uid`)
- **Fields**: camelCase (`createdAt`, `updatedAt`, `completedBy`)

### Data Validation Rules

1. **Required Fields**: All documents must have `createdAt` and `updatedAt`
2. **Field Limits**: 
   - String fields max 1MB
   - Array fields max 1000 elements
   - Nested objects max 100 fields
3. **Type Consistency**: Use Timestamp for all date fields
4. **Soft Deletes**: Use `archivedAt` or `deletedAt` instead of hard deletes

### Indexing Strategy

**Compound Indexes Required:**
```javascript
// Tasks by group and status
{
  collectionGroup: "tasks",
  fields: [
    { fieldPath: "groupId", order: "ASCENDING" },
    { fieldPath: "status", order: "ASCENDING" },
    { fieldPath: "updatedAt", order: "DESCENDING" }
  ]
}

// Tasks by assignee and due date
{
  collectionGroup: "tasks",
  fields: [
    { fieldPath: "assigneeId", order: "ASCENDING" },
    { fieldPath: "dueDate", order: "ASCENDING" },
    { fieldPath: "status", order: "ASCENDING" }
  ]
}

// User groups
{
  collectionGroup: "groups",
  fields: [
    { fieldPath: "memberIds", arrayConfig: "CONTAINS" },
    { fieldPath: "updatedAt", order: "DESCENDING" }
  ]
}
```

### Migration Plan

1. **Phase 1**: Data type standardization (photoURL vs avatar)
2. **Phase 2**: Add missing fields (version numbers, soft delete flags)
3. **Phase 3**: Implement proper indexing
4. **Phase 4**: Update security rules
5. **Phase 5**: Add data validation functions