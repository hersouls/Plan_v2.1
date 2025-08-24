import { useEffect, useState } from 'react';
import { Notification } from '../types/notification';
import { NotificationService } from '../lib/notifications';
import logger from '../lib/logger';

interface UseRealtimeNotificationsOptions {
  limit?: number;
  status?: 'all' | 'unread' | 'read';
  type?: string;
}

export const useRealtimeNotifications = (
  userId: string | undefined,
  options: UseRealtimeNotificationsOptions = {}
) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = NotificationService.subscribeToNotifications(
      userId,
      (newNotifications) => {
        setNotifications(newNotifications);
        setLoading(false);
      },
      options
    );

    return () => {
      unsubscribe();
    };
  }, [userId, options.limit, options.status, options.type]);

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
    } catch (err) {
      logger.error('notifications', 'markAsRead failed', err);
      setError('알림을 읽음 처리할 수 없습니다.');
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    
    try {
      await NotificationService.markAllAsRead(userId);
    } catch (err) {
      logger.error('notifications', 'markAllAsRead failed', err);
      setError('모든 알림을 읽음 처리할 수 없습니다.');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
    } catch (err) {
      logger.error('notifications', 'deleteNotification failed', err);
      setError('알림을 삭제할 수 없습니다.');
    }
  };

  return {
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};
