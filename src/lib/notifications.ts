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
    } = {}
  ): Promise<Notification[]> {
    try {
      const { limit: limitCount = 50, status = 'all', type } = options;

      let q = query(
        collection(db, this.COLLECTION),
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

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];
    } catch (error: any) {
      // 인덱스 빌드 중 오류인 경우 기본 쿼리로 재시도
      if (
        error.code === 'failed-precondition' &&
        error.message.includes('index')
      ) {
        console.warn('인덱스 빌드 중 - 기본 쿼리로 재시도:', error.message);
        try {
          const { limit: limitCount = 50, status = 'all', type } = options;

          // 기본 쿼리만 사용 (필터링 없이)
          const basicQuery = query(
            collection(db, this.COLLECTION),
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
          console.error('기본 쿼리도 실패:', fallbackError);
          throw new Error(
            '알림 목록을 가져올 수 없습니다. 잠시 후 다시 시도해주세요.'
          );
        }
      }

      console.error('알림 목록 가져오기 실패:', error);
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
      collection(db, this.COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (status !== 'all') {
      q = query(q, where('status', '==', status));
    }

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];
        callback(notifications);
      },
      (error: any) => {
        // 인덱스 빌드 중 오류인 경우 기본 쿼리로 재시도
        if (
          error.code === 'failed-precondition' &&
          error.message.includes('index')
        ) {
          console.warn(
            '실시간 구독 인덱스 빌드 중 - 기본 쿼리로 재시도:',
            error.message
          );

          // 기본 쿼리로 재시도
          const basicQuery = query(
            collection(db, this.COLLECTION),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
          );

          return onSnapshot(
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
            fallbackError => {
              console.error('실시간 구독 기본 쿼리도 실패:', fallbackError);
              callback([]); // 빈 배열 반환
            }
          );
        } else {
          console.error('실시간 알림 구독 실패:', error);
          callback([]); // 빈 배열 반환
        }
      }
    );

    return unsubscribe;
  }

  /**
   * 알림 생성
   */
  static async createNotification(
    notification: Omit<Notification, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...notification,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('알림 생성 실패:', error);
      throw new Error('알림을 생성할 수 없습니다.');
    }
  }

  /**
   * 알림 읽음 처리
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION, notificationId), {
        status: 'read',
        readAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
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
      const batch = writeBatch(db);

      notifications.forEach(notification => {
        const docRef = doc(db, this.COLLECTION, notification.id);
        batch.update(docRef, {
          status: 'read',
          readAt: Timestamp.now(),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
      throw new Error('알림을 읽음 처리할 수 없습니다.');
    }
  }

  /**
   * 알림 삭제
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION, notificationId));
    } catch (error) {
      console.error('알림 삭제 실패:', error);
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
    } catch (error) {
      console.error('알림 통계 가져오기 실패:', error);
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
      const docRef = doc(db, this.SETTINGS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as NotificationSettings;
      }

      return null;
    } catch (error) {
      console.error('알림 설정 가져오기 실패:', error);
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
      await updateDoc(
        doc(db, this.SETTINGS_COLLECTION, settings.userId),
        settings as any
      );
    } catch (error) {
      console.error('알림 설정 저장 실패:', error);
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
        taskReminders: true,
        groupNotifications: true,
        systemNotifications: true,
        emailNotifications: false,
        pushNotifications: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
        },
      };

      await updateDoc(
        doc(db, this.SETTINGS_COLLECTION, userId),
        defaultSettings as any
      );
    } catch (error) {
      console.error('기본 알림 설정 생성 실패:', error);
      throw new Error('기본 알림 설정을 생성할 수 없습니다.');
    }
  }
}
