import { FileAttachment, TaskCategory, TaskPriority, UrlAttachment } from '../../../types/task';

export interface TaskCreateProps {
  mode?: 'create' | 'edit';
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface FormData {
  title: string;
  description: string;
  taskType: 'personal' | 'group';
  selectedGroupId: string;
  assigneeId: string;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate: string;
  dueTime: string;
  tags: string[];
  recurring: {
    enabled: boolean;
    frequency: RecurringFrequency;
    interval: number;
    endDate: string;
  };
  reminders: string[];
  estimatedMinutes: string;
  location: string;
  attachments: FileAttachment[];
  urls: UrlAttachment[];
}

export interface CategoryOption {
  value: TaskCategory;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
}

export interface PriorityOption {
  value: TaskPriority;
  label: string;
  gradient: string;
  borderColor: string;
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}
