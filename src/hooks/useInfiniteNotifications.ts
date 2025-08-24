import { useCallback, useEffect, useState } from 'react';
import logger from '../lib/logger';
import { NotificationService } from '../lib/notifications';
import { Notification } from '../types/notification';

interface UseInfiniteNotificationsOptions {
  limit?: number;
  status?: 'all' | 'unread' | 'read';
  type?: string;
}

export const useInfiniteNotifications = (
  userId: string | undefined,
  options: UseInfiniteNotificationsOptions = {}
) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);

  const { limit = 20, status = 'all', type } = options;

  // 초기 로드
  const loadInitialNotifications = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const initialNotifications =
        await NotificationService.getUserNotifications(userId, {
          limit,
          status,
          type,
        });

      setNotifications(initialNotifications);
      setHasMore(initialNotifications.length === limit);

      // 마지막 문서 저장 (무한 스크롤용)
      if (initialNotifications.length > 0) {
        setLastDoc(initialNotifications[initialNotifications.length - 1]);
      }
    } catch (err) {
      logger.error('notifications', '초기 알림 로드 실패', err);
      setError('알림을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [userId, limit, status, type]);

  // 추가 로드
  const loadMoreNotifications = useCallback(async () => {
    if (!userId || !hasMore || loadingMore) return;

    setLoadingMore(true);

    try {
      const moreNotifications = await NotificationService.getUserNotifications(
        userId,
        {
          limit,
          status,
          type,
          after: lastDoc,
        }
      );

      if (moreNotifications.length > 0) {
        setNotifications(prev => [...prev, ...moreNotifications]);
        setLastDoc(moreNotifications[moreNotifications.length - 1]);
        setHasMore(moreNotifications.length === limit);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      logger.error('notifications', '추가 알림 로드 실패', err);
      setError('추가 알림을 불러올 수 없습니다.');
    } finally {
      setLoadingMore(false);
    }
  }, [userId, limit, status, type, hasMore, loadingMore, lastDoc]);

  // 필터 변경 시 초기화
  useEffect(() => {
    setNotifications([]);
    setLastDoc(null);
    setHasMore(true);
    loadInitialNotifications();
  }, [loadInitialNotifications]);

  // 알림 읽음 처리
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, status: 'read' as const, readAt: new Date() }
            : n
        )
      );
    } catch (error) {
      logger.error('notifications', '알림 읽음 처리 실패', error);
    }
  }, []);

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      await NotificationService.markAllAsRead(userId);
      setNotifications(prev =>
        prev.map(n => ({ ...n, status: 'read' as const, readAt: new Date() }))
      );
    } catch (error) {
      logger.error('notifications', '모든 알림 읽음 처리 실패', error);
    }
  }, [userId]);

  // 알림 삭제
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      logger.error('notifications', '알림 삭제 실패', error);
    }
  }, []);

  // 일괄 읽음 처리
  const markMultipleAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      await Promise.all(
        notificationIds.map(id => NotificationService.markAsRead(id))
      );
      setNotifications(prev =>
        prev.map(n =>
          notificationIds.includes(n.id)
            ? { ...n, status: 'read' as const, readAt: new Date() }
            : n
        )
      );
    } catch (error) {
      logger.error('notifications', '일괄 읽음 처리 실패', error);
    }
  }, []);

  // 일괄 삭제
  const deleteMultipleNotifications = useCallback(
    async (notificationIds: string[]) => {
      try {
        await Promise.all(
          notificationIds.map(id => NotificationService.deleteNotification(id))
        );
        setNotifications(prev =>
          prev.filter(n => !notificationIds.includes(n.id))
        );
      } catch (error) {
        logger.error('notifications', '일괄 삭제 실패', error);
      }
    },
    []
  );

  return {
    notifications,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore: loadMoreNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    markMultipleAsRead,
    deleteMultipleNotifications,
    refresh: loadInitialNotifications,
  };
};
