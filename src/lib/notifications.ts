import type { Firestore, FirestoreError } from 'firebase/firestore';
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  Notification,
  NotificationSettings,
  NotificationStats,
} from '../types/notification';
import { db } from './firebase';
import logger from './logger';

// 명시적 Firestore 타입으로 래핑하여 린트/TS가 암시적 any로 간주하지 않도록 함
const database: Firestore = db as unknown as Firestore;

// 인덱스 빌드 중 오류 식별 유틸
const isIndexBuildingError = (error: unknown): boolean => {
  const e = error as { code?: string; message?: string } | null;
  return (
    !!e &&
    e.code === 'failed-precondition' &&
    !!e.message &&
    e.message.includes('index')
  );
};

export class NotificationService {
  private static readonly COLLECTION = 'notifications';
  private static readonly SETTINGS_COLLECTION = 'notificationSettings';

  /**
   * 알림 목록 가져오기
   */
  static async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      status?: 'all' | 'unread' | 'read';
      type?: string;
      after?: any; // 무한 스크롤용 마지막 문서
    } = {}
  ): Promise<Notification[]> {
    try {
      const { limit: limitCount = 50, status = 'all', type, after } = options;

      let q = query(
        collection(database, this.COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (status !== 'all') {
        q = query(q, where('status', '==', status));
      }

      if (type) {
        q = query(q, where('type', '==', type));
      }

      // 무한 스크롤: 특정 문서 이후부터 시작
      if (after) {
        q = query(q, startAfter(after.createdAt));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];
    } catch (error: unknown) {
      // 인덱스 빌드 중 오류인 경우 기본 쿼리로 재시도
      if (isIndexBuildingError(error)) {
        logger.warn(
          'notifications',
          'index building; fallback to basic query',
          (error as { message?: string }).message
        );
        try {
          const { limit: limitCount = 50, status = 'all', type } = options;

          // 기본 쿼리만 사용 (필터링 없이)
          const basicQuery = query(
            collection(database, this.COLLECTION),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
          );

          const snapshot = await getDocs(basicQuery);
          let notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Notification[];

          // 클라이언트 사이드에서 필터링
          if (status !== 'all') {
            notifications = notifications.filter(n => n.status === status);
          }

          if (type) {
            notifications = notifications.filter(n => n.type === type);
          }

          return notifications;
        } catch (fallbackError) {
          logger.error('notifications', 'basic query failed', fallbackError);
          throw new Error(
            '알림 목록을 가져올 수 없습니다. 잠시 후 다시 시도해주세요.'
          );
        }
      }

      logger.error('notifications', 'getUserNotifications failed', error);
      throw new Error('알림 목록을 가져올 수 없습니다.');
    }
  }

  /**
   * 알림 실시간 구독
   */
  static subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void,
    options: {
      limit?: number;
      status?: 'all' | 'unread' | 'read';
    } = {}
  ) {
    const { limit: limitCount = 50, status = 'all' } = options;

    let q = query(
      collection(database, this.COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (status !== 'all') {
      q = query(q, where('status', '==', status));
    }

    // 활성 구독 핸들 저장하여 폴백 구독도 정상 해제되도록 처리
    let activeUnsubscribe = onSnapshot(
      q,
      snapshot => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];
        callback(notifications);
      },
      (error: FirestoreError) => {
        // 인덱스 빌드 중 오류인 경우 기본 쿼리로 재시도
        if (isIndexBuildingError(error)) {
          logger.warn(
            'notifications',
            'subscribe index building; fallback',
            error.message
          );

          // 기존 구독 해제 후 기본 쿼리로 폴백 구독
          if (activeUnsubscribe) {
            try {
              activeUnsubscribe();
            } catch (e) {
              logger.warn('notifications', 'unsubscribe failed (primary)', e);
            }
          }

          const basicQuery = query(
            collection(database, this.COLLECTION),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
          );

          activeUnsubscribe = onSnapshot(
            basicQuery,
            snapshot => {
              let notifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
              })) as Notification[];

              // 클라이언트 사이드에서 필터링
              if (status !== 'all') {
                notifications = notifications.filter(n => n.status === status);
              }

              callback(notifications);
            },
            (fallbackError: unknown) => {
              logger.error(
                'notifications',
                'subscribe basic query failed',
                fallbackError
              );
              callback([]); // 빈 배열 반환
            }
          );
        } else {
          logger.error('notifications', 'subscribe failed', error);
          callback([]); // 빈 배열 반환
        }
      }
    );

    // 항상 현재 활성 구독을 해제하는 클로저 반환
    return () => {
      if (activeUnsubscribe) {
        try {
          activeUnsubscribe();
        } catch (e) {
          logger.warn('notifications', 'unsubscribe failed (cleanup)', e);
        }
      }
    };
  }

  /**
   * 알림 생성
   */
  static async createNotification(
    notification: Omit<Notification, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(database, this.COLLECTION), {
        ...notification,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error: unknown) {
      logger.error('notifications', 'create failed', error);
      throw new Error('알림을 생성할 수 없습니다.');
    }
  }

  /**
   * 알림 읽음 처리
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(database, this.COLLECTION, notificationId), {
        status: 'read',
        readAt: Timestamp.now(),
      });
    } catch (error: unknown) {
      logger.error('notifications', 'markAsRead failed', error);
      throw new Error('알림을 읽음 처리할 수 없습니다.');
    }
  }

  /**
   * 모든 알림 읽음 처리
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const notifications = await this.getUserNotifications(userId, {
        status: 'unread',
      });
      const batch = writeBatch(database);

      notifications.forEach(notification => {
        const docRef = doc(database, this.COLLECTION, notification.id);
        batch.update(docRef, {
          status: 'read',
          readAt: Timestamp.now(),
        });
      });

      await batch.commit();
    } catch (error: unknown) {
      logger.error('notifications', 'markAllAsRead failed', error);
      throw new Error('알림을 읽음 처리할 수 없습니다.');
    }
  }

  /**
   * 알림 삭제
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      await deleteDoc(doc(database, this.COLLECTION, notificationId));
    } catch (error: unknown) {
      logger.error('notifications', 'delete failed', error);
      throw new Error('알림을 삭제할 수 없습니다.');
    }
  }

  /**
   * 알림 통계 가져오기
   */
  static async getNotificationStats(
    userId: string
  ): Promise<NotificationStats> {
    try {
      const notifications = await this.getUserNotifications(userId, {
        limit: 1000,
      });

      const stats: NotificationStats = {
        total: notifications.length,
        unread: notifications.filter(n => n.status === 'unread').length,
        read: notifications.filter(n => n.status === 'read').length,
        byType: {
          task: notifications.filter(n => n.type === 'task').length,
          group: notifications.filter(n => n.type === 'group').length,
          system: notifications.filter(n => n.type === 'system').length,
          reminder: notifications.filter(n => n.type === 'reminder').length,
        },
      };

      return stats;
    } catch (error: unknown) {
      logger.error('notifications', 'get stats failed', error);
      throw new Error('알림 통계를 가져올 수 없습니다.');
    }
  }

  /**
   * 알림 설정 가져오기
   */
  static async getNotificationSettings(
    userId: string
  ): Promise<NotificationSettings | null> {
    try {
      const docRef = doc(database, this.SETTINGS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as NotificationSettings;
      }

      return null;
    } catch (error: unknown) {
      logger.error('notifications', 'get settings failed', error);
      throw new Error('알림 설정을 가져올 수 없습니다.');
    }
  }

  /**
   * 알림 설정 저장
   */
  static async saveNotificationSettings(
    settings: NotificationSettings
  ): Promise<void> {
    try {
      const ref = doc(database, this.SETTINGS_COLLECTION, settings.userId);
      // 업데이트가 실패할 수 있어 set으로 병합 저장
      const { setDoc } = await import('firebase/firestore');
      await setDoc(ref, settings as unknown as NotificationSettings, {
        merge: true,
      });
    } catch (error: unknown) {
      logger.error('notifications', 'save settings failed', error);
      throw new Error('알림 설정을 저장할 수 없습니다.');
    }
  }

  /**
   * 기본 알림 설정 생성
   */
  static async createDefaultNotificationSettings(
    userId: string
  ): Promise<void> {
    try {
      const defaultSettings: NotificationSettings = {
        userId,
        push: true,
        email: false,
        taskReminders: true,
        taskAssignments: true,
        taskCompletions: true,
        taskComments: true,
        dailySummary: true,
        weeklyReport: true,
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
        },
      };

      const ref = doc(database, this.SETTINGS_COLLECTION, userId);
      const { setDoc } = await import('firebase/firestore');
      await setDoc(ref, defaultSettings, { merge: true });
    } catch (error: unknown) {
      logger.error('notifications', 'create default settings failed', error);
      throw new Error('기본 알림 설정을 생성할 수 없습니다.');
    }
  }

  /**
   * 테스트 알림 전송
   */
  static async sendTestNotification(userId: string): Promise<void> {
    try {
      const testNotification: Omit<Notification, 'id'> = {
        userId,
        title: '테스트 알림',
        message: '알림 시스템이 정상적으로 작동하고 있습니다! 🎉',
        type: 'system',
        status: 'unread',
        priority: 'medium',
        createdAt: Timestamp.now(),
        data: {
          actionUrl: '/notifications',
          isTest: true,
        },
      };

      await addDoc(collection(database, this.COLLECTION), testNotification);
      logger.info('notifications', 'test notification sent', { userId });
    } catch (error: unknown) {
      logger.error('notifications', 'test notification failed', error);
      throw error;
    }
  }
}
