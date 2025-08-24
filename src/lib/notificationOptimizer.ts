import { Notification, NotificationSettings } from '../types/notification';
import logger from './logger';

export interface NotificationCache {
  notifications: Notification[];
  lastUpdated: number;
  expiresAt: number;
}

export interface OptimizationConfig {
  cacheExpiryMs: number; // 캐시 만료 시간
  maxCacheSize: number; // 최대 캐시 크기
  batchSize: number; // 배치 처리 크기
  quietHoursBuffer: number; // 방해 금지 시간 버퍼 (분)
  duplicateWindowMs: number; // 중복 알림 확인 윈도우
}

export interface BatchedNotification {
  userId: string;
  notifications: Notification[];
  settings: NotificationSettings;
  priority: 'high' | 'normal' | 'low';
  scheduledFor: Date;
}

export class NotificationOptimizer {
  private static notificationCache = new Map<string, NotificationCache>();
  private static batchQueue = new Map<string, BatchedNotification>();
  private static duplicateTracker = new Map<string, number>();

  private static readonly DEFAULT_CONFIG: OptimizationConfig = {
    cacheExpiryMs: 5 * 60 * 1000, // 5분
    maxCacheSize: 100,
    batchSize: 10,
    quietHoursBuffer: 5, // 5분
    duplicateWindowMs: 60 * 1000, // 1분
  };

  /**
   * 알림 캐시 관리
   */
  static getCachedNotifications(userId: string): Notification[] | null {
    const cache = this.notificationCache.get(userId);
    if (!cache) return null;

    if (Date.now() > cache.expiresAt) {
      this.notificationCache.delete(userId);
      return null;
    }

    return cache.notifications;
  }

  static setCachedNotifications(
    userId: string,
    notifications: Notification[],
    config: Partial<OptimizationConfig> = {}
  ): void {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    // 캐시 크기 제한
    const limitedNotifications = notifications.slice(
      0,
      finalConfig.maxCacheSize
    );

    this.notificationCache.set(userId, {
      notifications: limitedNotifications,
      lastUpdated: Date.now(),
      expiresAt: Date.now() + finalConfig.cacheExpiryMs,
    });

    logger.debug('notificationOptimizer', 'notifications cached', {
      userId,
      count: limitedNotifications.length,
      expiresAt: new Date(Date.now() + finalConfig.cacheExpiryMs),
    });
  }

  static invalidateCache(userId: string): void {
    this.notificationCache.delete(userId);
    logger.debug('notificationOptimizer', 'cache invalidated', { userId });
  }

  static clearAllCache(): void {
    this.notificationCache.clear();
    logger.info('notificationOptimizer', 'all caches cleared');
  }

  /**
   * 중복 알림 방지
   */
  static isDuplicateNotification(
    userId: string,
    notificationType: string,
    contentHash: string,
    config: Partial<OptimizationConfig> = {}
  ): boolean {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const key = `${userId}:${notificationType}:${contentHash}`;
    const lastSent = this.duplicateTracker.get(key);

    if (!lastSent) return false;

    const isWithinWindow =
      Date.now() - lastSent < finalConfig.duplicateWindowMs;

    if (isWithinWindow) {
      logger.debug('notificationOptimizer', 'duplicate notification blocked', {
        userId,
        notificationType,
        timeSinceLastSent: Date.now() - lastSent,
      });
    }

    return isWithinWindow;
  }

  static markNotificationSent(
    userId: string,
    notificationType: string,
    contentHash: string
  ): void {
    const key = `${userId}:${notificationType}:${contentHash}`;
    this.duplicateTracker.set(key, Date.now());
  }

  static cleanupDuplicateTracker(): void {
    const now = Date.now();
    const cutoff = now - this.DEFAULT_CONFIG.duplicateWindowMs;

    for (const [key, timestamp] of this.duplicateTracker.entries()) {
      if (timestamp < cutoff) {
        this.duplicateTracker.delete(key);
      }
    }

    logger.debug('notificationOptimizer', 'duplicate tracker cleaned', {
      remaining: this.duplicateTracker.size,
    });
  }

  /**
   * 배치 처리
   */
  static addToBatch(
    userId: string,
    notification: Notification,
    settings: NotificationSettings,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): void {
    const scheduledFor = this.calculateOptimalSendTime(settings);

    const existingBatch = this.batchQueue.get(userId);
    if (existingBatch) {
      existingBatch.notifications.push(notification);
      // 더 높은 우선순위로 업데이트
      if (
        this.getPriorityWeight(priority) >
        this.getPriorityWeight(existingBatch.priority)
      ) {
        existingBatch.priority = priority;
      }
    } else {
      this.batchQueue.set(userId, {
        userId,
        notifications: [notification],
        settings,
        priority,
        scheduledFor,
      });
    }

    logger.debug('notificationOptimizer', 'notification added to batch', {
      userId,
      batchSize: this.batchQueue.get(userId)?.notifications.length,
      priority,
      scheduledFor,
    });
  }

  static getBatchedNotifications(): BatchedNotification[] {
    const now = Date.now();
    const readyBatches: BatchedNotification[] = [];

    for (const [userId, batch] of this.batchQueue.entries()) {
      const shouldSend =
        batch.scheduledFor.getTime() <= now ||
        batch.notifications.length >= this.DEFAULT_CONFIG.batchSize ||
        batch.priority === 'high';

      if (shouldSend) {
        readyBatches.push(batch);
        this.batchQueue.delete(userId);
      }
    }

    if (readyBatches.length > 0) {
      logger.info('notificationOptimizer', 'batches ready for processing', {
        batchCount: readyBatches.length,
        totalNotifications: readyBatches.reduce(
          (sum, batch) => sum + batch.notifications.length,
          0
        ),
      });
    }

    return readyBatches;
  }

  static clearBatch(userId: string): void {
    this.batchQueue.delete(userId);
  }

  /**
   * 최적 전송 시간 계산
   */
  static calculateOptimalSendTime(settings: NotificationSettings): Date {
    const now = new Date();

    // 방해 금지 시간 확인
    if (settings.quietHours.enabled) {
      const isInQuietHours = this.isInQuietHours(now, settings.quietHours);

      if (isInQuietHours) {
        // 방해 금지 시간 종료 후 버퍼 시간 추가
        const quietEnd = this.parseTime(settings.quietHours.endTime);
        const optimalTime = new Date(now);
        optimalTime.setHours(
          quietEnd.hours,
          quietEnd.minutes + this.DEFAULT_CONFIG.quietHoursBuffer,
          0,
          0
        );

        // 다음 날로 넘어갔다면 다음 날 시간으로 설정
        if (optimalTime <= now) {
          optimalTime.setDate(optimalTime.getDate() + 1);
        }

        logger.debug(
          'notificationOptimizer',
          'notification delayed due to quiet hours',
          {
            originalTime: now,
            scheduledTime: optimalTime,
          }
        );

        return optimalTime;
      }
    }

    // 즉시 전송 (1분 후로 설정하여 배치 처리 기회 제공)
    const immediateTime = new Date(now.getTime() + 60 * 1000);
    return immediateTime;
  }

  /**
   * 방해 금지 시간 확인
   */
  private static isInQuietHours(
    now: Date,
    quietHours: { enabled: boolean; startTime: string; endTime: string }
  ): boolean {
    if (!quietHours.enabled) return false;

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const start = this.parseTime(quietHours.startTime);
    const end = this.parseTime(quietHours.endTime);

    const startMinutes = start.hours * 60 + start.minutes;
    const endMinutes = end.hours * 60 + end.minutes;

    // 자정을 넘나드는 경우 처리
    if (startMinutes > endMinutes) {
      return currentTime >= startMinutes || currentTime <= endMinutes;
    } else {
      return currentTime >= startMinutes && currentTime <= endMinutes;
    }
  }

  /**
   * 시간 문자열 파싱
   */
  private static parseTime(timeString: string): {
    hours: number;
    minutes: number;
  } {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours: hours || 0, minutes: minutes || 0 };
  }

  /**
   * 우선순위 가중치
   */
  private static getPriorityWeight(
    priority: 'high' | 'normal' | 'low'
  ): number {
    switch (priority) {
      case 'high':
        return 3;
      case 'normal':
        return 2;
      case 'low':
        return 1;
      default:
        return 2;
    }
  }

  /**
   * 알림 내용 해시 생성
   */
  static generateContentHash(
    notification: Pick<Notification, 'title' | 'message' | 'type'>
  ): string {
    const content = `${notification.type}:${notification.title}:${notification.message}`;
    return btoa(content).slice(0, 16); // 간단한 해시
  }

  /**
   * 메모리 정리
   */
  static cleanup(): void {
    this.cleanupDuplicateTracker();

    // 만료된 캐시 정리
    const now = Date.now();
    for (const [userId, cache] of this.notificationCache.entries()) {
      if (now > cache.expiresAt) {
        this.notificationCache.delete(userId);
      }
    }

    // 오래된 배치 정리 (1시간 이상 된 것)
    const oneHourAgo = now - 60 * 60 * 1000;
    for (const [userId, batch] of this.batchQueue.entries()) {
      if (batch.scheduledFor.getTime() < oneHourAgo) {
        logger.warn('notificationOptimizer', 'removing stale batch', {
          userId,
          scheduledFor: batch.scheduledFor,
          notificationCount: batch.notifications.length,
        });
        this.batchQueue.delete(userId);
      }
    }

    logger.debug('notificationOptimizer', 'cleanup completed', {
      cacheSize: this.notificationCache.size,
      duplicateTrackerSize: this.duplicateTracker.size,
      batchQueueSize: this.batchQueue.size,
    });
  }

  /**
   * 통계 정보
   */
  static getStats(): {
    cacheStats: {
      totalCaches: number;
      totalCachedNotifications: number;
      averageCacheAge: number;
    };
    batchStats: {
      totalBatches: number;
      totalBatchedNotifications: number;
      averageBatchSize: number;
    };
    duplicateStats: {
      trackedKeys: number;
    };
  } {
    const now = Date.now();

    // 캐시 통계
    let totalCachedNotifications = 0;
    let totalCacheAge = 0;

    for (const cache of this.notificationCache.values()) {
      totalCachedNotifications += cache.notifications.length;
      totalCacheAge += now - cache.lastUpdated;
    }

    const averageCacheAge =
      this.notificationCache.size > 0
        ? totalCacheAge / this.notificationCache.size
        : 0;

    // 배치 통계
    let totalBatchedNotifications = 0;

    for (const batch of this.batchQueue.values()) {
      totalBatchedNotifications += batch.notifications.length;
    }

    const averageBatchSize =
      this.batchQueue.size > 0
        ? totalBatchedNotifications / this.batchQueue.size
        : 0;

    return {
      cacheStats: {
        totalCaches: this.notificationCache.size,
        totalCachedNotifications,
        averageCacheAge: Math.round(averageCacheAge),
      },
      batchStats: {
        totalBatches: this.batchQueue.size,
        totalBatchedNotifications,
        averageBatchSize: Math.round(averageBatchSize * 100) / 100,
      },
      duplicateStats: {
        trackedKeys: this.duplicateTracker.size,
      },
    };
  }
}

// 주기적 정리 작업 (5분마다)
if (typeof window !== 'undefined') {
  setInterval(() => {
    NotificationOptimizer.cleanup();
  }, 5 * 60 * 1000);
}
