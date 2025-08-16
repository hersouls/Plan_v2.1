# Firestore Database Structure - Moonwave Plan

## Collection Overview

The database is designed for a family-oriented Todo application with real-time collaboration features.

```
/groups/{groupId}
├── (group data)
└── /members/{memberId} (subcollection)

/tasks/{taskId}
├── (task data)
├── /comments/{commentId} (subcollection)
└── /activities/{activityId} (subcollection)

/users/{userId}
├── (user profile and settings)
└── /notifications/{notificationId} (subcollection)

/invitations/{invitationId}
├── (group invitation data)

/analytics/{analyticsId}
├── (aggregated statistics)
```

## Detailed Structure

### 1. Groups Collection (`/groups/{groupId}`)

**Main Document Fields:**
```typescript
{
  id: string;                    // Auto-generated document ID
  name: string;                  // "김씨 가족", "회사팀 프로젝트"
  description?: string;          // Optional description
  ownerId: string;              // User ID of group owner
  memberIds: string[];          // Array of member user IDs
  memberRoles: {                // Role mapping
    [userId: string]: 'owner' | 'admin' | 'member'
  };
  settings: {                   // Group configuration
    allowGuestTasks: boolean;
    requireApprovalForNewMembers: boolean;
    defaultTaskPriority: 'low' | 'medium' | 'high';
    defaultTaskCategory: string;
    notificationSettings: {
      newTaskAssigned: boolean;
      taskCompleted: boolean;
      taskOverdue: boolean;
      newComment: boolean;
    };
    workingHours?: {
      start: string;            // "09:00"
      end: string;              // "17:00"
      timezone: string;
    };
  };
  avatar?: string;              // Group avatar URL
  inviteCode?: string;          // 6-digit invitation code
  isPublic: boolean;            // Whether group is discoverable
  tags: string[];               // Group categories/tags
  
  // Statistics (auto-updated by functions)
  totalTasks?: number;
  completedTasks?: number;
  completionRate?: number;
  activeMembersCount?: number;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Subcollection: Members (`/groups/{groupId}/members/{memberId}`)**
```typescript
{
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Timestamp;
  lastActive?: Timestamp;
  invitedBy?: string;           // User ID who invited this member
  
  // Member-specific stats
  tasksCompleted: number;
  tasksAssigned: number;
  completionRate: number;
  streak: number;               // Consecutive days with completed tasks
}
```

### 2. Tasks Collection (`/tasks/{taskId}`)

**Main Document Fields:**
```typescript
{
  id: string;                   // Auto-generated document ID
  taskType: 'personal' | 'group'; // 개인 또는 그룹 할일 구분
  groupId?: string;             // Reference to group (null for personal tasks)
  userId: string;               // Task creator
  assigneeId: string;           // Who is assigned to complete it
  
  // Task details
  title: string;                // "장보기", "청소하기"
  description?: string;         // Detailed description
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category: 'household' | 'work' | 'personal' | 'shopping' | 'other';
  
  // Timing
  dueDate?: string;             // ISO string
  estimatedMinutes?: number;    // Expected completion time
  actualMinutes?: number;       // Actual time taken
  
  // Recurring configuration
  recurring?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;           // Every N days/weeks/months
    endDate?: string;
    daysOfWeek?: number[];      // [0,1,2,3,4,5,6] for weekly
    dayOfMonth?: number;        // 1-31 for monthly
  };
  
  // Organization
  tags: string[];               // Custom tags
  attachments?: string[];       // File URLs
  location?: {                  // GPS location for location-based reminders
    lat: number;
    lng: number;
    address?: string;
  };
  
  // Reminders
  reminders: Array<{
    id: string;
    time: string;               // "30m", "1h", "1d" or ISO string
    method: 'push' | 'email' | 'both';
    sent?: boolean;
    sentAt?: Timestamp;
  }>;
  
  // Completion tracking
  completedAt?: Timestamp;
  completedBy?: string;         // User ID who completed it
  completionNotes?: string;     // Notes added on completion
  
  // Collaboration
  watchers: string[];           // User IDs watching this task
  mentionedUsers: string[];     // Users mentioned in description/comments
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Subcollection: Comments (`/tasks/{taskId}/comments/{commentId}`)**
```typescript
{
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  
  // Rich content
  attachments?: string[];       // File URLs
  mentionedUsers?: string[];    // @mentioned user IDs
  
  // Reactions
  reactions?: {                 // Emoji reactions
    [emoji: string]: string[]   // Array of user IDs who reacted
  };
  
  // Reply threading
  parentCommentId?: string;     // For nested replies
  isEdited?: boolean;
  editedAt?: Timestamp;
  
  createdAt: Timestamp;
}
```

**Subcollection: Activities (`/tasks/{taskId}/activities/{activityId}`)**
```typescript
{
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  action: 'created' | 'updated' | 'completed' | 'commented' | 
          'assigned' | 'due_date_changed' | 'priority_changed' |
          'status_changed' | 'deleted';
  
  // Activity details
  details?: {
    field?: string;             // What field changed
    oldValue?: any;             // Previous value
    newValue?: any;             // New value
    comment?: string;           // Additional context
  };
  
  // Metadata
  ipAddress?: string;           // For audit trail
  userAgent?: string;
  
  createdAt: Timestamp;
}
```

### 3. Users Collection (`/users/{userId}`)

**Main Document Fields:**
```typescript
{
  id: string;                   // Firebase Auth UID
  
  // Basic profile
  displayName: string;
  email: string;
  avatar?: string;              // Profile picture URL
  bio?: string;                 // User bio/description
  phoneNumber?: string;
  
  // App preferences
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: 'ko' | 'en';
    timezone: string;           // "Asia/Seoul"
    dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
    timeFormat: '24h' | '12h';
    weekStartsOn: 0 | 1;        // 0 = Sunday, 1 = Monday
    
    // Notification settings
    notifications: {
      push: boolean;
      taskReminders: boolean;
      taskAssignments: boolean;
      taskCompletions: boolean;
      taskComments: boolean;
      dailySummary: boolean;
      weeklyReport: boolean;
      reminderTime: string;     // "09:00" daily summary time
    };
    
    // Default task settings
    defaultTaskSettings: {
      priority: 'medium' | 'high' | 'low';
      category: string;
      reminderTime: string;     // "30m", "1h", "1d"
    };
    
    // Privacy
    privacy: {
      profileVisible: boolean;
      activityVisible: boolean;
      statsVisible: boolean;
    };
  };
  
  // Group memberships
  groupIds: string[];           // Groups this user belongs to
  
  // FCM tokens for push notifications
  fcmTokens?: string[];         // Array to support multiple devices
  lastTokenUpdate?: string;
  
  // User statistics
  stats: {
    totalTasksCreated: number;
    totalTasksCompleted: number;
    totalTasksAssigned: number;
    currentStreak: number;      // Consecutive days with completed tasks
    longestStreak: number;
    completionRate: number;     // Percentage of completed tasks
    averageCompletionTime?: number; // In hours
    favoriteCategory?: string;
    lastCompletionDate?: string; // YYYY-MM-DD format
    
    // Monthly breakdown
    monthlyStats?: {
      [monthYear: string]: {    // "2024-01"
        created: number;
        completed: number;
        completionRate: number;
      }
    };
  };
  
  // Gamification
  badges: string[];             // Achievement badge IDs
  points: number;               // Gamification points
  level: number;                // User level based on points
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: Timestamp;
    points: number;
  }>;
  
  // Activity tracking
  lastActive: Timestamp;
  lastLoginAt: Timestamp;
  loginCount: number;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Subcollection: Notifications (`/users/{userId}/notifications/{notificationId}`)**
```typescript
{
  id: string;
  userId: string;
  type: 'task_assigned' | 'task_completed' | 'task_overdue' | 
        'task_reminder' | 'comment_added' | 'group_invitation' |
        'achievement_unlocked' | 'daily_summary' | 'weekly_report';
  
  title: string;
  message: string;
  data?: {                      // Additional notification data
    taskId?: string;
    groupId?: string;
    commentId?: string;
    achievementId?: string;
    url?: string;               // Deep link URL
  };
  
  // Status
  read: boolean;
  readAt?: Timestamp;
  archived?: boolean;
  
  // Notification delivery
  deliveryMethods: ('push' | 'email' | 'in_app')[];
  deliveryStatus: {
    push?: 'sent' | 'failed' | 'pending';
    email?: 'sent' | 'failed' | 'pending';
    in_app?: 'sent';
  };
  
  // Actions
  actions?: Array<{
    id: string;
    label: string;
    url: string;
    style: 'primary' | 'secondary' | 'danger';
  }>;
  
  // Metadata
  priority: 'low' | 'medium' | 'high';
  expiresAt?: Timestamp;        // Auto-delete after this time
  
  createdAt: Timestamp;
}
```

### 4. Invitations Collection (`/invitations/{invitationId}`)

```typescript
{
  id: string;
  groupId: string;
  groupName: string;
  inviterUserId: string;
  inviterUserName: string;
  inviterAvatar?: string;
  
  // Invitation target
  inviteeEmail: string;
  inviteeUserId?: string;       // Set after user accepts
  
  // Invitation settings
  role: 'admin' | 'member';
  message?: string;             // Personal message from inviter
  inviteCode?: string;          // 6-digit code for easy sharing
  
  // Status
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  responseMessage?: string;     // Response from invitee
  
  // Timing
  expiresAt: Timestamp;         // Auto-expire after 7 days
  respondedAt?: Timestamp;
  
  // Metadata
  inviteMethod: 'email' | 'link' | 'code' | 'qr';
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 5. Analytics Collection (`/analytics/{analyticsId}`)

This collection stores pre-aggregated statistics for performance.

```typescript
{
  id: string;                   // Format: "{groupId}_{period}_{date}"
  type: 'group_daily' | 'group_weekly' | 'group_monthly' | 
        'user_daily' | 'user_weekly' | 'user_monthly';
  
  // Reference IDs
  groupId?: string;
  userId?: string;
  
  // Time period
  period: 'daily' | 'weekly' | 'monthly';
  date: string;                 // "2024-01-15", "2024-W03", "2024-01"
  
  // Statistics
  stats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;
    
    // Category breakdown
    byCategory: {
      [category: string]: {
        total: number;
        completed: number;
        completionRate: number;
      }
    };
    
    // Priority breakdown
    byPriority: {
      [priority: string]: {
        total: number;
        completed: number;
        completionRate: number;
      }
    };
    
    // Member performance (for group analytics)
    byMember?: {
      [userId: string]: {
        tasksCompleted: number;
        tasksAssigned: number;
        completionRate: number;
        averageCompletionTime: number;
      }
    };
    
    // Time-based patterns
    completionsByHour?: number[];  // 24-element array
    completionsByDay?: number[];   // 7-element array (Sun-Sat)
  };
  
  // Metadata
  generatedAt: Timestamp;
  version: number;              // Schema version for migrations
}
```

## Index Requirements

The following indexes are required for optimal query performance and are defined in `firestore.indexes.json`:

### Composite Indexes

1. **Tasks by Group and Status**
   ```
   Collection: tasks
   Fields: groupId (Ascending), status (Ascending), createdAt (Descending)
   ```

2. **Tasks by Assignee and Due Date**
   ```
   Collection: tasks
   Fields: assigneeId (Ascending), dueDate (Ascending), status (Ascending)
   ```

3. **Tasks by Group and Priority**
   ```
   Collection: tasks
   Fields: groupId (Ascending), priority (Descending), createdAt (Descending)
   ```

4. **Tasks by Category and Creation Date**
   ```
   Collection: tasks
   Fields: groupId (Ascending), category (Ascending), createdAt (Descending)
   ```

5. **Comments by Task and Creation Time**
   ```
   Collection: comments
   Fields: taskId (Ascending), createdAt (Ascending)
   ```

6. **Activities by Task and Time**
   ```
   Collection: activities  
   Fields: taskId (Ascending), createdAt (Descending)
   ```

7. **Notifications by User and Status**
   ```
   Collection: notifications
   Fields: userId (Ascending), read (Ascending), createdAt (Descending)
   ```

8. **Invitations by Group and Status**
   ```
   Collection: invitations
   Fields: groupId (Ascending), status (Ascending), createdAt (Descending)
   ```

9. **Analytics by Type and Date**
   ```
   Collection: analytics
   Fields: type (Ascending), date (Descending)
   ```

## Data Relationships

```
Group (1) ←→ (N) Tasks
Group (1) ←→ (N) Members  
Group (1) ←→ (N) Invitations

User (1) ←→ (N) Tasks (as creator)
User (1) ←→ (N) Tasks (as assignee)
User (1) ←→ (N) Comments
User (1) ←→ (N) Activities
User (1) ←→ (N) Notifications

Task (1) ←→ (N) Comments
Task (1) ←→ (N) Activities
Task (1) ←→ (1) Group
```

## Security Considerations

1. **Row-Level Security**: Implemented through Firestore Security Rules
2. **Group Membership Validation**: All task/comment operations validate group membership
3. **Owner Permissions**: Group owners have elevated permissions
4. **Personal Data Protection**: Users can only access their own profile and notifications
5. **Invitation System**: Secure invitation flow with expiration and validation

## Performance Optimizations

1. **Denormalization**: User names and avatars are stored in multiple places for performance
2. **Pre-aggregated Statistics**: Analytics collection stores computed statistics
3. **Composite Indexes**: Optimized for common query patterns
4. **Pagination**: All list queries support cursor-based pagination
5. **Real-time Subscriptions**: Optimized for minimal data transfer

This structure supports all the core features of the Moonwave Plan application while maintaining security, performance, and scalability.