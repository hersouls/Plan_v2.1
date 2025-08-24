import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import logger from './logger';
import { NotificationAnalyticsService } from './notificationAnalytics';

export interface RetryableNotification {
  id?: string;
  userId: string;
  notificationId: string;
  type:
    | 'task_reminder'
    | 'task_assigned'
    | 'task_completed'
    | 'mention'
    | 'new_comment'
    | 'system';
  payload: {
    title: string;
    body: string;
    data?: Record<string, any>;
  };
  fcmToken: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: Timestamp;
  createdAt: Timestamp;
  lastError?: {
    code: string;
    message: string;
    timestamp: Timestamp;
  };
  status: 'pending' | 'retrying' | 'failed' | 'success';
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number; // 기본 지연 시간 (밀리초)
  backoffMultiplier: number; // 백오프 배수
  maxDelayMs: number; // 최대 지연 시간
}

export class NotificationRetryService {
  private static readonly RETRY_COLLECTION = 'notificationRetries';

  private static readonly DEFAULT_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelayMs: 5000, // 5초
    backoffMultiplier: 2,
    maxDelayMs: 300000, // 5분
  };

  /**
   * 재시도 가능한 알림 추가
   */
  static async addRetryableNotification(
    notification: Omit<
      RetryableNotification,
      'id' | 'attempts' | 'nextRetryAt' | 'createdAt' | 'status'
    >,
    config: Partial<RetryConfig> = {}
  ): Promise<void> {
    try {
      const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
      const now = Timestamp.now();

      const retryableNotification: Omit<RetryableNotification, 'id'> = {
        ...notification,
        attempts: 0,
        maxAttempts: finalConfig.maxAttempts,
        nextRetryAt: now, // 즉시 시도
        createdAt: now,
        status: 'pending',
      };

      await addDoc(
        collection(db, this.RETRY_COLLECTION),
        retryableNotification
      );
      logger.info('notificationRetry', 'retryable notification added', {
        notificationId: notification.notificationId,
        userId: notification.userId,
      });
    } catch (error) {
      logger.error(
        'notificationRetry',
        'failed to add retryable notification',
        error
      );
      throw error;
    }
  }

  /**
   * 재시도 대기 중인 알림 조회
   */
  static async getPendingRetries(): Promise<RetryableNotification[]> {
    try {
      const now = Timestamp.now();
      const q = query(
        collection(db, this.RETRY_COLLECTION),
        where('status', 'in', ['pending', 'retrying']),
        where('nextRetryAt', '<=', now)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as RetryableNotification[];
    } catch (error) {
      logger.error('notificationRetry', 'failed to get pending retries', error);
      return [];
    }
  }

  /**
   * 알림 재시도 처리
   */
  static async processRetry(
    retryNotification: RetryableNotification,
    sendFunction: (fcmToken: string, payload: any) => Promise<void>
  ): Promise<boolean> {
    if (!retryNotification.id) {
      logger.error('notificationRetry', 'retry notification missing id');
      return false;
    }

    const docRef = doc(db, this.RETRY_COLLECTION, retryNotification.id);

    try {
      // 상태를 재시도 중으로 업데이트
      await updateDoc(docRef, {
        status: 'retrying',
        attempts: retryNotification.attempts + 1,
      });

      // 알림 전송 시도
      const startTime = Date.now();
      await sendFunction(retryNotification.fcmToken, retryNotification.payload);
      const responseTime = Date.now() - startTime;

      // 성공 시 처리
      await updateDoc(docRef, {
        status: 'success',
      });

      // 성공 메트릭 기록
      await NotificationAnalyticsService.recordDelivered(
        retryNotification.userId,
        retryNotification.notificationId,
        retryNotification.type,
        responseTime
      );

      // 성공한 재시도 기록 삭제 (선택적)
      await deleteDoc(docRef);

      logger.info('notificationRetry', 'retry successful', {
        notificationId: retryNotification.notificationId,
        attempts: retryNotification.attempts + 1,
        responseTime,
      });

      return true;
    } catch (error: any) {
      const errorCode = this.getErrorCode(error);
      const errorMessage = this.getErrorMessage(error);

      // 실패 메트릭 기록
      await NotificationAnalyticsService.recordFailed(
        retryNotification.userId,
        retryNotification.notificationId,
        retryNotification.type,
        errorCode,
        errorMessage,
        retryNotification.fcmToken
      );

      const newAttempts = retryNotification.attempts + 1;

      if (newAttempts >= retryNotification.maxAttempts) {
        // 최대 재시도 횟수 초과 - 실패 처리
        await updateDoc(docRef, {
          status: 'failed',
          attempts: newAttempts,
          lastError: {
            code: errorCode,
            message: errorMessage,
            timestamp: Timestamp.now(),
          },
        });

        logger.error('notificationRetry', 'max retries exceeded', {
          notificationId: retryNotification.notificationId,
          attempts: newAttempts,
          error: errorMessage,
        });

        return false;
      } else {
        // 다음 재시도 시간 계산
        const nextRetryAt = this.calculateNextRetryTime(newAttempts);

        await updateDoc(docRef, {
          status: 'pending',
          attempts: newAttempts,
          nextRetryAt,
          lastError: {
            code: errorCode,
            message: errorMessage,
            timestamp: Timestamp.now(),
          },
        });

        logger.warn('notificationRetry', 'retry scheduled', {
          notificationId: retryNotification.notificationId,
          attempts: newAttempts,
          nextRetryAt: nextRetryAt.toDate(),
          error: errorMessage,
        });

        return false;
      }
    }
  }

  /**
   * 모든 대기 중인 재시도 처리
   */
  static async processAllPendingRetries(
    sendFunction: (fcmToken: string, payload: any) => Promise<void>
  ): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    const pendingRetries = await this.getPendingRetries();
    let successful = 0;
    let failed = 0;

    logger.info('notificationRetry', 'processing pending retries', {
      count: pendingRetries.length,
    });

    for (const retry of pendingRetries) {
      try {
        const success = await this.processRetry(retry, sendFunction);
        if (success) {
          successful++;
        } else {
          failed++;
        }
      } catch (error) {
        logger.error('notificationRetry', 'error processing retry', {
          notificationId: retry.notificationId,
          error,
        });
        failed++;
      }

      // 처리 간 짧은 지연 (과부하 방지)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    logger.info('notificationRetry', 'retry processing completed', {
      processed: pendingRetries.length,
      successful,
      failed,
    });

    return {
      processed: pendingRetries.length,
      successful,
      failed,
    };
  }

  /**
   * 다음 재시도 시간 계산 (지수 백오프)
   */
  private static calculateNextRetryTime(attempts: number): Timestamp {
    const config = this.DEFAULT_CONFIG;
    const delay = Math.min(
      config.baseDelayMs * Math.pow(config.backoffMultiplier, attempts - 1),
      config.maxDelayMs
    );

    const nextRetryTime = new Date(Date.now() + delay);
    return Timestamp.fromDate(nextRetryTime);
  }

  /**
   * 오류 코드 추출
   */
  private static getErrorCode(error: any): string {
    if (error?.code) return error.code;
    if (error?.name) return error.name;
    return 'UNKNOWN_ERROR';
  }

  /**
   * 오류 메시지 추출
   */
  private static getErrorMessage(error: any): string {
    if (error?.message) return error.message;
    if (typeof error === 'string') return error;
    return 'Unknown error occurred';
  }

  /**
   * 오래된 실패한 재시도 기록 정리
   */
  static async cleanupOldRetries(daysOld: number = 7): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const q = query(
        collection(db, this.RETRY_COLLECTION),
        where('createdAt', '<', Timestamp.fromDate(cutoffDate)),
        where('status', 'in', ['failed', 'success'])
      );

      const snapshot = await getDocs(q);
      const batch = [];

      for (const doc of snapshot.docs) {
        batch.push(deleteDoc(doc.ref));
      }

      await Promise.all(batch);

      logger.info('notificationRetry', 'old retries cleaned up', {
        deletedCount: snapshot.docs.length,
        cutoffDate,
      });
    } catch (error) {
      logger.error('notificationRetry', 'failed to cleanup old retries', error);
    }
  }

  /**
   * 특정 사용자의 재시도 통계 조회
   */
  static async getUserRetryStats(userId: string): Promise<{
    pending: number;
    retrying: number;
    failed: number;
    success: number;
  }> {
    try {
      const q = query(
        collection(db, this.RETRY_COLLECTION),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      const retries = snapshot.docs.map(doc =>
        doc.data()
      ) as RetryableNotification[];

      return {
        pending: retries.filter(r => r.status === 'pending').length,
        retrying: retries.filter(r => r.status === 'retrying').length,
        failed: retries.filter(r => r.status === 'failed').length,
        success: retries.filter(r => r.status === 'success').length,
      };
    } catch (error) {
      logger.error(
        'notificationRetry',
        'failed to get user retry stats',
        error
      );
      return { pending: 0, retrying: 0, failed: 0, success: 0 };
    }
  }
}
