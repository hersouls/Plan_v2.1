// Legacy travel-related types (kept for compatibility)
// These are minimal implementations since travel features have been removed

export interface Trip {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  groupId?: string;
}

export interface TripLocation {
  id: string;
  name: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  address?: string;
  description?: string;
}

export type TripStatus = 'planning' | 'active' | 'completed' | 'cancelled';