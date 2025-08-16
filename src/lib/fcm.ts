import { MessagePayload, getToken, onMessage } from 'firebase/messaging';
import { messaging } from './firebase';

// FCM VAPID key - should be set in environment variables
const VAPID_KEY =
  typeof window !== 'undefined' && typeof import.meta !== 'undefined'
    ? import.meta.env?.VITE_FCM_VAPID_KEY
    : process.env.VITE_FCM_VAPID_KEY;

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: Record<string, any>;
}

class FCMService {
  private token: string | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = this.checkSupport();
  }

  private checkSupport(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'Notification' in window &&
      messaging !== null
    );
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.warn('FCM not supported in this environment');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      if (import.meta.env.DEV) {
        console.log('Notification permission:', permission);
      }
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  // Get FCM registration token
  async getRegistrationToken(): Promise<string | null> {
    if (!this.isSupported || !messaging) {
      return null;
    }

    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        if (import.meta.env.DEV) {
          console.log('Notification permission not granted');
        }
        return null;
      }

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });

      if (token) {
        if (import.meta.env.DEV) {
          console.log('FCM registration token:', token);
        }
        this.token = token;
        return token;
      } else {
        if (import.meta.env.DEV) {
          console.log('No registration token available.');
        }
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Save token to user profile in Firestore
  async saveTokenToProfile(userId: string, token: string) {
    try {
      const { userService } = await import('./firestore');
      await userService.createOrUpdateUserProfile(userId, {
        fcmTokens: [token], // Array to support multiple devices
        lastTokenUpdate: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving FCM token to profile:', error);
    }
  }

  // Listen for foreground messages
  setupForegroundMessageListener(callback: (payload: MessagePayload) => void) {
    if (!this.isSupported || !messaging) {
      return () => {};
    }

    return onMessage(messaging, payload => {
      if (import.meta.env.DEV) {
        console.log('Message received in foreground:', payload);
      }
      callback(payload);

      // Show notification if the app is in focus
      if (payload.notification) {
        this.showNotification({
          title: payload.notification.title || 'New Message',
          body: payload.notification.body || '',
          icon: payload.notification.icon || '/favicon.ico',
          data: payload.data,
        });
      }
    });
  }

  // Show local notification
  private showNotification(notificationPayload: NotificationPayload) {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(notificationPayload.title, {
          body: notificationPayload.body,
          icon: notificationPayload.icon || '/Moonwave.png',
          badge: notificationPayload.badge || '/Moonwave.png',
          image: notificationPayload.image,
          tag: notificationPayload.tag,
          requireInteraction: notificationPayload.requireInteraction,
          actions: notificationPayload.actions,
          data: notificationPayload.data,
          vibrate: [100, 50, 100],
          timestamp: Date.now(),
        });
      });
    }
  }

  // Initialize FCM for a user
  async initialize(userId: string): Promise<boolean> {
    if (!this.isSupported) {
      if (import.meta.env.DEV) {
        console.log('FCM not supported');
      }
      return false;
    }

    try {
      const token = await this.getRegistrationToken();
      if (token) {
        await this.saveTokenToProfile(userId, token);

        // Set up foreground message listener
        await this.setupForegroundMessageListener(payload => {
          // Handle custom notification behavior here
          if (import.meta.env.DEV) {
            console.log('Foreground notification received:', payload);
          }

          // Dispatch custom event for app-specific handling
          window.dispatchEvent(
            new CustomEvent('fcm-message', {
              detail: payload,
            })
          );
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error initializing FCM:', error);
      return false;
    }
  }

  // Get current token
  getCurrentToken(): string | null {
    return this.token;
  }

  // Check if FCM is supported
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }
}

// Create singleton instance
export const fcmService = new FCMService();

// Helper functions for common notification scenarios
export const notificationHelpers = {
  // Task assignment notification
  taskAssigned: (taskTitle: string, assignerName: string) => ({
    title: '새 할일이 할당되었습니다',
    body: `${assignerName}님이 "${taskTitle}" 할일을 할당했습니다.`,
    icon: '/icons/task-assigned.png',
    tag: 'task-assignment',
    requireInteraction: true,
    actions: [
      { action: 'view', title: '확인하기' },
      { action: 'dismiss', title: '나중에' },
    ],
  }),

  // Task reminder notification
  taskReminder: (taskTitle: string, dueTime: string) => ({
    title: '할일 알림',
    body: `"${taskTitle}" 할일의 마감시간이 ${dueTime}입니다.`,
    icon: '/icons/task-reminder.png',
    tag: 'task-reminder',
    requireInteraction: true,
    actions: [
      { action: 'complete', title: '완료하기' },
      { action: 'snooze', title: '나중에 알림' },
    ],
  }),

  // Task completion notification
  taskCompleted: (taskTitle: string, completerName: string) => ({
    title: '할일이 완료되었습니다',
    body: `${completerName}님이 "${taskTitle}" 할일을 완료했습니다.`,
    icon: '/icons/task-completed.png',
    tag: 'task-completion',
  }),

  // Comment notification
  newComment: (taskTitle: string, commenterName: string) => ({
    title: '새 댓글이 있습니다',
    body: `${commenterName}님이 "${taskTitle}" 할일에 댓글을 남겼습니다.`,
    icon: '/icons/new-comment.png',
    tag: 'new-comment',
    actions: [
      { action: 'reply', title: '답글하기' },
      { action: 'view', title: '확인하기' },
    ],
  }),

  // Daily summary notification
  dailySummary: (completedCount: number, totalCount: number) => ({
    title: '오늘의 할일 요약',
    body: `오늘 ${totalCount}개 중 ${completedCount}개의 할일을 완료했습니다.`,
    icon: '/icons/daily-summary.png',
    tag: 'daily-summary',
  }),
};
