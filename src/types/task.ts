import { Timestamp } from 'firebase/firestore';
import { SemanticTextContent } from './typography';

// File attachment interface
export interface FileAttachment {
  id: string;
  fileName: string;
  fileSize: number; // in bytes
  mimeType: string;
  storageUrl: string;
  downloadUrl?: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
  thumbnailUrl?: string; // for images
  isImage: boolean;
  width?: number; // for images
  height?: number; // for images
}

// URL attachment interface
export interface UrlAttachment {
  id: string;
  url: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  domain?: string;
  addedBy: string;
  addedAt: Timestamp;
}

// File upload progress
export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

// Task status
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

// Task priority
export type TaskPriority = 'low' | 'medium' | 'high';

// Task category - Use string for flexibility
export type TaskCategory = string;

// Recurring configuration
export interface RecurringConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // every N days/weeks/months/years
  endDate?: string;
  daysOfWeek?: number[]; // for weekly: 0=Sunday, 1=Monday, etc.
  dayOfMonth?: number; // for monthly: 1-31
}

// Reminder configuration
export interface Reminder {
  id: string;
  time: string; // ISO string or relative time like "30m", "1h", "1d"
  method: 'push' | 'email' | 'both';
  sent?: boolean;
}

// New structured reminder format
export interface StructuredReminder {
  offsetMinutes: number; // Minutes before due date
  method: 'push' | 'email' | 'both';
  sent?: boolean;
}

// Location for location-based reminders
export interface TaskLocation {
  lat: number;
  lng: number;
  address?: string;
}

// Task text content with semantic types
export interface TaskContent
  extends Pick<
    SemanticTextContent,
    'cardTitle' | 'description' | 'label' | 'helperText'
  > {
  title: string; // Alias for cardTitle
  completionNotes?: string;
  category: string;
}

// Task interface
export interface Task {
  id: string;
  taskType: 'personal' | 'group'; // 개인 또는 그룹 할일 구분
  groupId?: string; // Optional for personal tasks
  userId: string; // Creator
  assigneeId: string; // Assigned user
  assigneeName?: string; // Display name of assignee

  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory; // Use string for flexibility

  dueDate?: Timestamp;
  estimatedMinutes?: number;
  actualMinutes?: number;

  recurring?: RecurringConfig;
  tags: string[];
  attachments?: FileAttachment[]; // Updated to use FileAttachment interface
  urls?: UrlAttachment[]; // Added URL attachments
  location?: TaskLocation;

  completedAt?: Timestamp;
  completedBy?: string;
  completionNotes?: string;

  watchers: string[]; // User IDs
  mentionedUsers: string[];
  reminders: Reminder[];

  // UI-specific properties
  commentCount?: number; // Number of comments
  isStarred?: boolean; // Starred status

  // Metadata
  version: number; // For optimistic locking
  archivedAt?: Timestamp; // Soft delete

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Task creation input (omits auto-generated fields)
export interface CreateTaskInput {
  taskType: 'personal' | 'group'; // 개인 또는 그룹 할일 구분
  groupId?: string; // Optional for personal tasks
  userId: string;
  assigneeId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: Timestamp;
  estimatedMinutes?: number;
  recurring?: RecurringConfig;
  tags?: string[];
  attachments?: FileAttachment[];
  urls?: UrlAttachment[]; // Added URL attachments
  location?: TaskLocation;
  watchers?: string[];
  mentionedUsers?: string[];
  reminders?: StructuredReminder[];
}

// Task update input
export interface UpdateTaskInput {
  taskType?: 'personal' | 'group'; // 개인 또는 그룹 할일 구분 (수정 가능)
  groupId?: string; // 그룹 할일로 변경 시 필요
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  dueDate?: Timestamp;
  assigneeId?: string;
  recurring?: RecurringConfig;
  tags?: string[];
  reminders?: (Reminder | StructuredReminder)[];
  completedAt?: Timestamp;
  completedBy?: string;
}

// Task comment with file attachments
export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  attachments?: FileAttachment[]; // Added file attachments
  reactions?: Record<string, string[]>; // emoji -> array of user IDs
  createdAt: Timestamp;
}

// Task activity log entry
export interface TaskActivity {
  id: string;
  taskId?: string;
  groupId?: string;
  userId: string; // Actor
  userName: string;

  action:
    | 'created'
    | 'updated'
    | 'completed'
    | 'commented'
    | 'assigned'
    | 'due_date_changed'
    | 'deleted';
  entityType: 'task' | 'group' | 'comment';
  entityId: string;

  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];

  details?: {
    assigneeName?: string;
    newDate?: string;
  };

  metadata: {
    userAgent?: string;
    ipAddress?: string; // For security auditing
  };

  createdAt: Timestamp;
}

// Task filters for querying
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  category?: TaskCategory[];
  assigneeId?: string[];
  dueDate?: {
    start?: Timestamp;
    end?: Timestamp;
  };
  tags?: string[];
}

// Task statistics
export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
  byCategory: Record<TaskCategory, number>;
  byPriority: Record<TaskPriority, number>;
  byAssignee: Record<string, number>;
}
