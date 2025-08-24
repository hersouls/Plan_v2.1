import { MessagePayload, getToken, onMessage } from 'firebase/messaging';
import { loadMessaging, messaging } from './firebase';
import logger from './logger';

// FCM VAPID key - prefer Vite env (browser), fallback to process.env (Node/Jest)
const VAPID_KEY = (() => {
  try {
    // Prefer Vite's injected env at build time
    // @ts-ignore - import.meta is available in Vite/browser
    const viteEnv =
      typeof import.meta !== 'undefined' ? import.meta.env : undefined;
    if (viteEnv?.VITE_FCM_VAPID_KEY)
      return viteEnv.VITE_FCM_VAPID_KEY as string;
  } catch {
    /* noop */
  }
  // Fallback for Node/Jest where process is defined
  // eslint-disable-next-line no-undef
  if (typeof process !== 'undefined' && process.env?.VITE_FCM_VAPID_KEY) {
    // eslint-disable-next-line no-undef
    return process.env.VITE_FCM_VAPID_KEY as string;
  }
  return undefined;
})();

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
  data?: Record<string, unknown>;
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
      'Notification' in window
    );
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      logger.warn('fcm', 'not supported in this environment');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      try {
        const viteEnv = (globalThis as any)?.import?.meta?.env;
        if (viteEnv?.DEV) {
          logger.info('fcm', 'permission', permission);
        }
      } catch {
        /* noop */
      }
      return permission;
    } catch (error) {
      logger.error('fcm', 'request permission failed', error);
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
        try {
          const viteEnv = (globalThis as any)?.import?.meta?.env;
          if (viteEnv?.DEV) {
            logger.info('fcm', 'permission not granted');
          }
        } catch {
          /* noop */
        }
        return null;
      }

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });

      if (token) {
        try {
          const viteEnv = (globalThis as any)?.import?.meta?.env;
          if (viteEnv?.DEV) {
            logger.info('fcm', 'registration token', token);
          }
        } catch {
          /* noop */
        }
        this.token = token;
        return token;
      } else {
        try {
          const viteEnv = (globalThis as any)?.import?.meta?.env;
          if (viteEnv?.DEV) {
            logger.info('fcm', 'no registration token');
          }
        } catch {
          /* noop */
        }
        return null;
      }
    } catch (error) {
      logger.error('fcm', 'get token failed', error);
      return null;
    }
  }

  // Save token to user profile in Firestore
  async saveTokenToProfile(userId: string, token: string) {
    try {
      const { userService } = await import('./firestore');
      // 사용자 문서에 토큰 저장 (배열 필드로 관리)
      await userService.createOrUpdateUserProfile(userId, {
        ...({
          fcmTokens: [token],
          lastTokenUpdate: new Date().toISOString(),
        } as unknown as Record<string, unknown>),
      });
    } catch (error) {
      logger.error('fcm', 'save token failed', error);
    }
  }

  // Listen for foreground messages
  setupForegroundMessageListener(callback: (payload: MessagePayload) => void) {
    if (!this.isSupported || !messaging) {
      return () => {};
    }

    return onMessage(messaging, payload => {
      try {
        const viteEnv = (globalThis as any)?.import?.meta?.env;
        if (viteEnv?.DEV) {
          logger.debug('fcm', 'foreground message', payload);
        }
      } catch {
        /* noop */
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
        const options: NotificationOptions = {
          body: notificationPayload.body,
          icon: notificationPayload.icon || '/Moonwave.png',
          badge: notificationPayload.badge || '/Moonwave.png',
          tag: notificationPayload.tag,
          requireInteraction: notificationPayload.requireInteraction,
          data: notificationPayload.data,
          vibrate: [100, 50, 100],
          timestamp: Date.now(),
        } as NotificationOptions;

        registration.showNotification(notificationPayload.title, options);
      });
    }
  }

  // Initialize FCM for a user
  async initialize(userId: string): Promise<boolean> {
    if (!this.isSupported) {
      try {
        const viteEnv = (globalThis as any)?.import?.meta?.env;
        if (viteEnv?.DEV) {
          logger.info('fcm', 'not supported');
        }
      } catch {
        /* noop */
      }
      return false;
    }

    try {
      // Ensure Firebase Messaging is loaded in browser before requesting token
      try {
        await loadMessaging();
      } catch {
        /* noop */
      }

      const token = await this.getRegistrationToken();
      if (token) {
        await this.saveTokenToProfile(userId, token);

        // Set up foreground message listener
        await this.setupForegroundMessageListener(payload => {
          // Handle custom notification behavior here
          try {
            const viteEnv = (globalThis as any)?.import?.meta?.env;
            if (viteEnv?.DEV) {
              logger.debug('fcm', 'foreground notification', payload);
            }
          } catch {
            /* noop */
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
      logger.error('fcm', 'initialize failed', error);
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
    // 일부 브라우저에서 actions 미지원 → 제거
  }),

  // Task reminder notification
  taskReminder: (taskTitle: string, dueTime: string) => ({
    title: '할일 알림',
    body: `"${taskTitle}" 할일의 마감시간이 ${dueTime}입니다.`,
    icon: '/icons/task-reminder.png',
    tag: 'task-reminder',
    requireInteraction: true,
    // actions 제거
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
    // actions 제거
  }),

  // Daily summary notification
  dailySummary: (completedCount: number, totalCount: number) => ({
    title: '오늘의 할일 요약',
    body: `오늘 ${totalCount}개 중 ${completedCount}개의 할일을 완료했습니다.`,
    icon: '/icons/daily-summary.png',
    tag: 'daily-summary',
  }),
};
