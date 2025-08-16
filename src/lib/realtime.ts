import { onSnapshot, doc, collection, query, where, orderBy, Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Real-time synchronization service for Firebase data
 */
export class RealtimeService {
  private static instance: RealtimeService;
  private subscriptions: Map<string, Unsubscribe> = new Map();

  private constructor() {}

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * Subscribe to user profile changes
   */
  subscribeToUserProfile(
    userId: string,
    callback: (userData: any) => void,
    onError?: (error: Error) => void
  ): string {
    const subscriptionId = `user-${userId}`;
    
    // Unsubscribe existing if any
    this.unsubscribe(subscriptionId);

    try {
      const userDocRef = doc(db, 'users', userId);
      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            callback({
              id: docSnapshot.id,
              ...docSnapshot.data(),
            });
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error('Error listening to user profile:', error);
          if (onError) {
            onError(new Error('사용자 프로필 실시간 동기화 중 오류가 발생했습니다.'));
          }
        }
      );

      this.subscriptions.set(subscriptionId, unsubscribe);
      return subscriptionId;
    } catch (error) {
      console.error('Failed to subscribe to user profile:', error);
      if (onError) {
        onError(new Error('사용자 프로필 구독에 실패했습니다.'));
      }
      return '';
    }
  }

  /**
   * Subscribe to user's groups
   */
  subscribeToUserGroups(
    userId: string,
    callback: (groups: any[]) => void,
    onError?: (error: Error) => void
  ): string {
    const subscriptionId = `groups-${userId}`;
    
    // Unsubscribe existing if any
    this.unsubscribe(subscriptionId);

    try {
      const groupsQuery = query(
        collection(db, 'groups'),
        where('memberIds', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        groupsQuery,
        (querySnapshot) => {
          const groups = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          callback(groups);
        },
        (error) => {
          console.error('Error listening to user groups:', error);
          if (onError) {
            onError(new Error('그룹 목록 실시간 동기화 중 오류가 발생했습니다.'));
          }
        }
      );

      this.subscriptions.set(subscriptionId, unsubscribe);
      return subscriptionId;
    } catch (error) {
      console.error('Failed to subscribe to user groups:', error);
      if (onError) {
        onError(new Error('그룹 목록 구독에 실패했습니다.'));
      }
      return '';
    }
  }

  /**
   * Subscribe to group data including members
   */
  subscribeToGroup(
    groupId: string,
    callback: (groupData: any) => void,
    onError?: (error: Error) => void
  ): string {
    const subscriptionId = `group-${groupId}`;
    
    // Unsubscribe existing if any
    this.unsubscribe(subscriptionId);

    try {
      const groupDocRef = doc(db, 'groups', groupId);
      const unsubscribe = onSnapshot(
        groupDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            callback({
              id: docSnapshot.id,
              ...docSnapshot.data(),
            });
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error('Error listening to group:', error);
          if (onError) {
            onError(new Error('그룹 정보 실시간 동기화 중 오류가 발생했습니다.'));
          }
        }
      );

      this.subscriptions.set(subscriptionId, unsubscribe);
      return subscriptionId;
    } catch (error) {
      console.error('Failed to subscribe to group:', error);
      if (onError) {
        onError(new Error('그룹 정보 구독에 실패했습니다.'));
      }
      return '';
    }
  }

  /**
   * Subscribe to user's tasks with real-time updates
   */
  subscribeToUserTasks(
    userId: string,
    groupId?: string,
    callback: (tasks: any[]) => void,
    onError?: (error: Error) => void
  ): string {
    const subscriptionId = `tasks-${userId}-${groupId || 'personal'}`;
    
    // Unsubscribe existing if any
    this.unsubscribe(subscriptionId);

    try {
      let tasksQuery;
      
      if (groupId) {
        // Group tasks
        tasksQuery = query(
          collection(db, 'tasks'),
          where('groupId', '==', groupId),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Personal tasks
        tasksQuery = query(
          collection(db, 'tasks'),
          where('userId', '==', userId),
          where('groupId', '==', null),
          orderBy('createdAt', 'desc')
        );
      }

      const unsubscribe = onSnapshot(
        tasksQuery,
        (querySnapshot) => {
          const tasks = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          callback(tasks);
        },
        (error) => {
          console.error('Error listening to tasks:', error);
          if (onError) {
            onError(new Error('할일 목록 실시간 동기화 중 오류가 발생했습니다.'));
          }
        }
      );

      this.subscriptions.set(subscriptionId, unsubscribe);
      return subscriptionId;
    } catch (error) {
      console.error('Failed to subscribe to tasks:', error);
      if (onError) {
        onError(new Error('할일 목록 구독에 실패했습니다.'));
      }
      return '';
    }
  }

  /**
   * Subscribe to group activities/notifications
   */
  subscribeToGroupActivities(
    groupId: string,
    callback: (activities: any[]) => void,
    onError?: (error: Error) => void
  ): string {
    const subscriptionId = `activities-${groupId}`;
    
    // Unsubscribe existing if any
    this.unsubscribe(subscriptionId);

    try {
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('groupId', '==', groupId),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(
        activitiesQuery,
        (querySnapshot) => {
          const activities = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          callback(activities);
        },
        (error) => {
          console.error('Error listening to group activities:', error);
          if (onError) {
            onError(new Error('그룹 활동 실시간 동기화 중 오류가 발생했습니다.'));
          }
        }
      );

      this.subscriptions.set(subscriptionId, unsubscribe);
      return subscriptionId;
    } catch (error) {
      console.error('Failed to subscribe to group activities:', error);
      if (onError) {
        onError(new Error('그룹 활동 구독에 실패했습니다.'));
      }
      return '';
    }
  }

  /**
   * Subscribe to user's settings
   */
  subscribeToUserSettings(
    userId: string,
    callback: (settings: any) => void,
    onError?: (error: Error) => void
  ): string {
    const subscriptionId = `settings-${userId}`;
    
    // Unsubscribe existing if any
    this.unsubscribe(subscriptionId);

    try {
      const settingsDocRef = doc(db, 'userSettings', userId);
      const unsubscribe = onSnapshot(
        settingsDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            callback({
              id: docSnapshot.id,
              ...docSnapshot.data(),
            });
          } else {
            // Return default settings if none exist
            callback(null);
          }
        },
        (error) => {
          console.error('Error listening to user settings:', error);
          if (onError) {
            onError(new Error('사용자 설정 실시간 동기화 중 오류가 발생했습니다.'));
          }
        }
      );

      this.subscriptions.set(subscriptionId, unsubscribe);
      return subscriptionId;
    } catch (error) {
      console.error('Failed to subscribe to user settings:', error);
      if (onError) {
        onError(new Error('사용자 설정 구독에 실패했습니다.'));
      }
      return '';
    }
  }

  /**
   * Subscribe to multiple collections with batch processing
   */
  subscribeToBatch(
    subscriptions: Array<{
      id: string;
      type: 'user' | 'groups' | 'group' | 'tasks' | 'activities' | 'settings';
      params: any;
      callback: (data: any) => void;
      onError?: (error: Error) => void;
    }>
  ): string[] {
    const subscriptionIds: string[] = [];

    subscriptions.forEach(sub => {
      let id: string = '';
      
      switch (sub.type) {
        case 'user':
          id = this.subscribeToUserProfile(sub.params.userId, sub.callback, sub.onError);
          break;
        case 'groups':
          id = this.subscribeToUserGroups(sub.params.userId, sub.callback, sub.onError);
          break;
        case 'group':
          id = this.subscribeToGroup(sub.params.groupId, sub.callback, sub.onError);
          break;
        case 'tasks':
          id = this.subscribeToUserTasks(sub.params.userId, sub.params.groupId, sub.callback, sub.onError);
          break;
        case 'activities':
          id = this.subscribeToGroupActivities(sub.params.groupId, sub.callback, sub.onError);
          break;
        case 'settings':
          id = this.subscribeToUserSettings(sub.params.userId, sub.callback, sub.onError);
          break;
      }

      if (id) {
        subscriptionIds.push(id);
      }
    });

    return subscriptionIds;
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): boolean {
    const unsubscribe = this.subscriptions.get(subscriptionId);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
      return true;
    }
    return false;
  }

  /**
   * Unsubscribe from multiple subscriptions
   */
  unsubscribeMultiple(subscriptionIds: string[]): number {
    let unsubscribedCount = 0;
    subscriptionIds.forEach(id => {
      if (this.unsubscribe(id)) {
        unsubscribedCount++;
      }
    });
    return unsubscribedCount;
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): number {
    const count = this.subscriptions.size;
    this.subscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.subscriptions.clear();
    return count;
  }

  /**
   * Get all active subscription IDs
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Check if a subscription is active
   */
  isSubscriptionActive(subscriptionId: string): boolean {
    return this.subscriptions.has(subscriptionId);
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }
}

// Export singleton instance
export const realtimeService = RealtimeService.getInstance();

// Default export for convenience
export default realtimeService;