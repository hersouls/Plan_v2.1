import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Check, Clock, ExternalLink, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Notification } from '../../types/notification';
import { NotificationFilterUtils } from '../../utils/notificationFilters';
import { Button } from '../ui/button';
import { Typography } from '../ui/typography';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (notificationId: string) => void;
  onDelete: (notificationId: string) => void;
  searchTerm?: string;
  isSelected?: boolean;
}

export const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
  searchTerm,
  isSelected,
}: NotificationItemProps) => {
  // 알림 타입별 아이콘
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task':
        return '📋';
      case 'group':
        return '👥';
      case 'system':
        return '⚙️';
      case 'reminder':
        return '⏰';
      default:
        return '🔔';
    }
  };

  // 알림 우선순위별 색상
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400 border-red-400/30 bg-red-400/10';
      case 'medium':
        return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'low':
        return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      default:
        return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
    }
  };

  // 날짜 포맷팅
  const formatDate = (
    timestamp: Date | string | { toDate: () => Date } | null
  ) => {
    try {
      const date = NotificationFilterUtils.getNotificationDate(timestamp);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        return '오늘';
      } else if (diffDays === 2) {
        return '어제';
      } else if (diffDays <= 7) {
        return `${diffDays - 1}일 전`;
      } else {
        return format(date, 'M월 d일', { locale: ko });
      }
    } catch {
      return '날짜 없음';
    }
  };

  // 검색어 하이라이트
  const highlightText = (text: string) => {
    if (!searchTerm?.trim()) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-400/50 text-black px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleActionClick = () => {
    if (notification.data?.actionUrl) {
      window.open(notification.data.actionUrl, '_blank');
    }
  };

  return (
    <div
      className={cn(
        'p-4 transition-all duration-200 hover:shadow-lg rounded-lg border',
        notification.status === 'unread' &&
          'border-l-4 border-blue-400 bg-blue-400/5',
        isSelected && 'bg-blue-400/10 border-blue-400/50',
        'bg-white/5 border-white/10'
      )}
    >
      <div className="flex items-start gap-4">
        {/* 알림 아이콘 */}
        <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-lg">
          {getNotificationIcon(notification.type)}
        </div>

        {/* 알림 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <Typography.H5 className="text-white font-pretendard font-semibold text-base line-clamp-2">
                {highlightText(notification.title)}
              </Typography.H5>
              <Typography.Body className="text-white/80 font-pretendard text-sm mt-1 line-clamp-3">
                {highlightText(notification.message)}
              </Typography.Body>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex items-center gap-1">
              {notification.status === 'unread' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors duration-200"
                  aria-label="읽음 처리"
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}

              {notification.data?.actionUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleActionClick}
                  className="p-1 text-white/60 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors duration-200"
                  aria-label="알림 액션"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(notification.id)}
                className="p-1 text-white/60 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors duration-200"
                aria-label="삭제"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 메타 정보 */}
          <div className="flex items-center gap-3 mt-3 text-xs">
            <div className="flex items-center gap-1 text-white/60">
              <Clock className="w-3 h-3" />
              <span>{formatDate(notification.createdAt)}</span>
            </div>

            <span
              className={cn(
                'px-2 py-1 rounded-full text-xs font-medium border',
                getPriorityColor(notification.priority)
              )}
            >
              {notification.priority === 'high' && '높음'}
              {notification.priority === 'medium' && '보통'}
              {notification.priority === 'low' && '낮음'}
            </span>

            <span className="px-2 py-1 rounded-full bg-white/10 text-white/60 text-xs">
              {notification.type === 'task' && '할일'}
              {notification.type === 'group' && '그룹'}
              {notification.type === 'system' && '시스템'}
              {notification.type === 'reminder' && '리마인더'}
            </span>

            {notification.status === 'unread' && (
              <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs border border-blue-400/30">
                읽지 않음
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
