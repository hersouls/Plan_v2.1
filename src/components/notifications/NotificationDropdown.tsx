import { Bell, Check, MoreHorizontal, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import logger from '../../lib/logger';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { useToast } from '../ui/useToast';
import { cn } from '../../lib/utils';
import { Typography } from '../ui/typography';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = React.memo(
  ({ isOpen, onClose, triggerRef }) => {
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { success } = useToast();
    const { notifications, stats, markAsRead, markAllAsRead, loading } = useNotifications();
    
    const [isMarkingAll, setIsMarkingAll] = useState(false);

    // 클릭 외부 감지
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          triggerRef.current &&
          !triggerRef.current.contains(event.target as Node)
        ) {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen, onClose, triggerRef]);

    // ESC 키 감지
    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
      }
    }, [isOpen, onClose]);

    // 알림 클릭 처리
    const handleNotificationClick = useCallback(async (notification: { id: string; status: string; data?: { taskId?: string; actionUrl?: string; url?: string } }) => {
      try {
        // 알림을 읽음으로 표시
        if (notification.status === 'unread') {
          await markAsRead(notification.id);
        }

        // 알림 데이터에 따라 페이지 이동
        if (notification.data?.taskId) {
          navigate(`/tasks/${notification.data.taskId}`);
        } else if (notification.data?.actionUrl) {
          navigate(notification.data.actionUrl);
        } else if (notification.data?.url) {
          navigate(notification.data.url);
        }

        onClose();
      } catch (error) {
        logger.error('NotificationDropdown', 'Error handling notification click', error);
      }
    }, [markAsRead, navigate, onClose]);

    // 모든 알림 읽음 처리
    const handleMarkAllAsRead = useCallback(async () => {
      if (stats?.unread === 0) return;

      setIsMarkingAll(true);
      try {
        await markAllAsRead();
        success('모든 알림을 읽음으로 표시했습니다.');
      } catch (error) {
        logger.error('NotificationDropdown', 'Error marking all notifications as read', error);
      } finally {
        setIsMarkingAll(false);
      }
    }, [markAllAsRead, stats?.unread, success]);

    // 알림 개별 읽음 처리
    const handleMarkAsRead = useCallback(async (notificationId: string, event: React.MouseEvent) => {
      event.stopPropagation();
      try {
        await markAsRead(notificationId);
      } catch (error) {
        logger.error('NotificationDropdown', 'Error marking notification as read', error);
      }
    }, [markAsRead]);

    // 알림 타입별 아이콘 및 색상
    const getNotificationStyle = (type: string) => {
      switch (type) {
        case 'task_reminder':
          return {
            icon: '⏰',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            textColor: 'text-orange-700'
          };
        case 'task_assigned':
          return {
            icon: '📋',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-700'
          };
        case 'task_completed':
          return {
            icon: '✅',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            textColor: 'text-green-700'
          };
        case 'mention':
          return {
            icon: '👤',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            textColor: 'text-purple-700'
          };
        case 'new_comment':
          return {
            icon: '💬',
            bgColor: 'bg-indigo-50',
            borderColor: 'border-indigo-200',
            textColor: 'text-indigo-700'
          };
        default:
          return {
            icon: '🔔',
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200',
            textColor: 'text-gray-700'
          };
      }
    };

    // 시간 포맷팅
    const formatTime = (timestamp: Date | string | { toDate: () => Date } | null) => {
      if (!timestamp) return '';
      
      let date: Date;
      if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'object' && 'toDate' in timestamp && typeof (timestamp as { toDate: unknown }).toDate === 'function') {
        date = (timestamp as { toDate: () => Date }).toDate();
      } else {
        date = new Date(timestamp as string);
      }
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return '방금 전';
      if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}시간 전`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}일 전`;
      
      return date.toLocaleDateString('ko-KR');
    };

    if (!isOpen) return null;

    return (
      <div
        ref={dropdownRef}
        className={cn(
          'absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl',
          'border border-gray-200 backdrop-blur-sm z-50',
          'transform transition-all duration-200 ease-out',
          'animate-in slide-in-from-top-2 fade-in-0'
        )}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <Typography.H4 className="text-gray-900">알림</Typography.H4>
            {stats && (stats.unread ?? 0) > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                {stats.unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {stats && (stats.unread ?? 0) > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className={cn(
                  'p-1 rounded-lg transition-colors',
                  'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
                  isMarkingAll && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isMarkingAll ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Check className="w-4 h-4 text-gray-600" />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="닫기"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 알림 목록 */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner />
              <span className="ml-2 text-sm text-gray-500">알림 로딩 중...</span>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {notifications.slice(0, 10).map((notification) => {
                const style = getNotificationStyle(notification.type);
                const isUnread = notification.status === 'unread';
                
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'p-4 cursor-pointer transition-all duration-200',
                      'hover:bg-gray-50 focus:outline-none focus:bg-gray-50',
                      isUnread && 'bg-blue-50/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* 알림 아이콘 */}
                      <div className={cn(
                        'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                        style.bgColor, style.borderColor
                      )}>
                        <span className="text-sm">{style.icon}</span>
                      </div>

                      {/* 알림 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <Typography.BodySmall className={cn(
                            'font-medium line-clamp-2',
                            isUnread ? 'text-gray-900' : 'text-gray-700'
                          )}>
                            {notification.title}
                          </Typography.BodySmall>
                          {isUnread && (
                            <button
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 transition-colors"
                              title="읽음 처리"
                            >
                              <Check className="w-3 h-3 text-gray-500" />
                            </button>
                          )}
                        </div>
                        
                        {notification.message && (
                          <Typography.BodySmall className="text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </Typography.BodySmall>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <Typography.BodySmall className="text-gray-500">
                            {formatTime(notification.createdAt)}
                          </Typography.BodySmall>
                          {isUnread && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 mb-3" />
              <Typography.Body className="text-gray-500 mb-1">
                새로운 알림이 없습니다
              </Typography.Body>
              <Typography.BodySmall className="text-gray-400">
                새로운 할일이나 활동이 있을 때 알림을 받을 수 있습니다
              </Typography.BodySmall>
            </div>
          )}
        </div>

        {/* 푸터 */}
        {notifications && notifications.length > 0 && (
          <div className="p-3 border-t border-gray-100">
            <button
              onClick={() => {
                navigate('/notifications');
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
              모든 알림 보기
            </button>
          </div>
        )}
      </div>
    );
  }
);

NotificationDropdown.displayName = 'NotificationDropdown';
