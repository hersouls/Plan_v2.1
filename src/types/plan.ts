// Legacy plan-related types (kept for compatibility)
// These are minimal implementations since plan features have been refactored to tasks

export interface Plan {
  id: string;
  title: string;
  description?: string;
  items: PlanItem[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  groupId?: string;
}

export interface PlanItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  order: number;
  createdAt: Date;
}

export type PlanStatus = 'draft' | 'active' | 'completed' | 'archived';