import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationService } from '../lib/notifications';
import { Notification, NotificationStats } from '../types/notification';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 알림 데이터 로드
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setStats(null);
      return;
    }

    setLoading(true);
    setError(null);

    const loadNotifications = async () => {
      try {
        const [notificationsData, statsData] = await Promise.all([
          NotificationService.getUserNotifications(user.uid, { limit: 50 }),
          NotificationService.getNotificationStats(user.uid),
        ]);

        setNotifications(notificationsData);
        setStats(statsData);
      } catch (err) {
        console.error('알림 로드 실패:', err);
        setError('알림을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user?.uid]);

  // 실시간 알림 구독
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = NotificationService.subscribeToNotifications(
      user.uid,
      newNotifications => {
        setNotifications(newNotifications);
        // 통계도 업데이트
        const newStats: NotificationStats = {
          total: newNotifications.length,
          unread: newNotifications.filter(n => n.status === 'unread').length,
          read: newNotifications.filter(n => n.status === 'read').length,
          byType: {
            task: newNotifications.filter(n => n.type === 'task').length,
            group: newNotifications.filter(n => n.type === 'group').length,
            system: newNotifications.filter(n => n.type === 'system').length,
            reminder: newNotifications.filter(n => n.type === 'reminder')
              .length,
          },
        };
        setStats(newStats);
      },
      { limit: 50 }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
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
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    if (!user?.uid) return;

    try {
      await NotificationService.markAllAsRead(user.uid);
      setNotifications(prev =>
        prev.map(n => ({ ...n, status: 'read' as const, readAt: new Date() }))
      );
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  };

  // 알림 삭제
  const deleteNotification = async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('알림 삭제 실패:', error);
    }
  };

  return {
    notifications,
    stats,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
