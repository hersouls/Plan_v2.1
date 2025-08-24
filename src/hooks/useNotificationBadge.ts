import { useEffect, useCallback } from 'react';
import { useTabSync } from './useTabSync';

interface NotificationBadgeData {
  unreadCount: number;
  lastUpdate: number;
}

export const useNotificationBadge = (unreadCount: number) => {
  const { updateData, getData } = useTabSync<NotificationBadgeData>({
    key: 'notification-badge',
    onUpdate: (data) => {
      updateBadgeCount(data.unreadCount);
    },
  });

  const updateBadgeCount = useCallback((count: number) => {
    // 브라우저 탭 제목 업데이트
    if (count > 0) {
      document.title = `(${count}) Moonwave Plan`;
    } else {
      document.title = 'Moonwave Plan';
    }

    // 브라우저 알림 권한이 있는 경우 배지 업데이트
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(count).catch(console.error);
    }
  }, []);

  useEffect(() => {
    const badgeData: NotificationBadgeData = {
      unreadCount,
      lastUpdate: Date.now(),
    };

    updateData(badgeData);
    updateBadgeCount(unreadCount);
  }, [unreadCount, updateData, updateBadgeCount]);

  // 페이지 로드 시 기존 배지 데이터 복원
  useEffect(() => {
    const existingData = getData();
    if (existingData) {
      updateBadgeCount(existingData.unreadCount);
    }
  }, [getData, updateBadgeCount]);

  return {
    updateBadgeCount,
  };
};
