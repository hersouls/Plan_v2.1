import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useEffect } from 'react';
import { Notification } from '../../types/notification';
import { NotificationItem } from './NotificationItem';

interface VirtualizedNotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onDelete: (notificationId: string) => void;
  searchTerm?: string;
  height?: number;
}

export const VirtualizedNotificationList = ({
  notifications,
  onMarkAsRead,
  onDelete,
  searchTerm,
  height = 600,
}: VirtualizedNotificationListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: notifications.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // 각 알림 아이템의 예상 높이
    overscan: 5, // 화면 밖에 미리 렌더링할 아이템 수
  });

  // 스크롤 위치 복원
  useEffect(() => {
    if (parentRef.current) {
      const savedScrollTop = sessionStorage.getItem('notification-scroll-top');
      if (savedScrollTop) {
        parentRef.current.scrollTop = parseInt(savedScrollTop);
      }
    }
  }, []);

  // 스크롤 위치 저장
  const handleScroll = () => {
    if (parentRef.current) {
      sessionStorage.setItem('notification-scroll-top', parentRef.current.scrollTop.toString());
    }
  };

  return (
    <div
      ref={parentRef}
      className="overflow-auto"
      style={{ height }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const notification = notifications[virtualRow.index];
          
          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="px-4"
            >
              <NotificationItem
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                searchTerm={searchTerm}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
