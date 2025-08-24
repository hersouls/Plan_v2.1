import { Check, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { NotificationGroup as NotificationGroupType } from '../../types/notification';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/button';
import { Typography } from '../ui/typography';
import { NotificationItem } from './NotificationItem';

interface NotificationGroupProps {
  group: NotificationGroupType;
  onMarkAsRead: (notificationId: string) => void;
  onDeleteNotification: (notificationId: string) => void;
  onMarkGroupAsRead: (notificationIds: string[]) => void;
  onDeleteGroup: (notificationIds: string[]) => void;
  searchTerm?: string;
}

export const NotificationGroup = ({
  group,
  onMarkAsRead,
  onDeleteNotification,
  onMarkGroupAsRead,
  onDeleteGroup,
  searchTerm,
}: NotificationGroupProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const unreadCount = group.notifications.filter(
    n => n.status === 'unread'
  ).length;

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === group.notifications.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(group.notifications.map(n => n.id)));
    }
  };

  const handleSelectItem = (notificationId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedItems(newSelected);
  };

  const handleMarkSelectedAsRead = () => {
    const selectedIds = Array.from(selectedItems);
    onMarkGroupAsRead(selectedIds);
    setSelectedItems(new Set());
  };

  const handleDeleteSelected = () => {
    if (confirm('선택된 알림을 삭제하시겠습니까?')) {
      const selectedIds = Array.from(selectedItems);
      onDeleteGroup(selectedIds);
      setSelectedItems(new Set());
    }
  };

  const hasSelection = selectedItems.size > 0;

  return (
    <GlassCard variant="light" className="mb-4">
      <div className="p-4">
        {/* 그룹 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleExpand}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-white/80" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white/80" />
              )}
            </button>

            <div className="flex items-center gap-2">
              <Typography.H5 className="text-white font-pretendard font-semibold">
                {group.label}
              </Typography.H5>
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                  {unreadCount}개 읽지 않음
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 일괄 선택 체크박스 */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedItems.size === group.notifications.length}
                onChange={handleSelectAll}
                className="mr-2"
              />
              <span className="text-white/60 text-sm">전체 선택</span>
            </label>

            {/* 일괄 작업 버튼들 */}
            {hasSelection && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkSelectedAsRead}
                  className="text-white/60 hover:text-white p-1"
                  title="선택된 알림 읽음 처리"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="text-white/60 hover:text-red-400 p-1"
                  title="선택된 알림 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 알림 목록 */}
        {isExpanded && (
          <div className="space-y-2">
            {group.notifications.map(notification => (
              <div key={notification.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedItems.has(notification.id)}
                  onChange={() => handleSelectItem(notification.id)}
                  className="flex-shrink-0"
                />
                <div className="flex-1">
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                    onDelete={onDeleteNotification}
                    searchTerm={searchTerm}
                    isSelected={selectedItems.has(notification.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 그룹 요약 */}
        {!isExpanded && (
          <div className="text-white/60 text-sm">
            {group.notifications.length}개의 알림
            {unreadCount > 0 && ` (${unreadCount}개 읽지 않음)`}
          </div>
        )}
      </div>
    </GlassCard>
  );
};
