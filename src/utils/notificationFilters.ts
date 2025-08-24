import { format, isWithinInterval, parseISO } from 'date-fns';
import { Notification, AdvancedFilters, NotificationGroup } from '../types/notification';

export class NotificationFilterUtils {
  /**
   * 알림 검색 및 필터링
   */
  static filterNotifications(
    notifications: Notification[],
    filters: AdvancedFilters
  ): Notification[] {
    let filtered = [...notifications];

    // 검색어 필터링
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        notification =>
          notification.title.toLowerCase().includes(searchTerm) ||
          notification.message.toLowerCase().includes(searchTerm)
      );
    }

    // 상태 필터링
    if (filters.status.length > 0) {
      filtered = filtered.filter(notification =>
        filters.status.includes(notification.status)
      );
    }

    // 타입 필터링
    if (filters.type.length > 0) {
      filtered = filtered.filter(notification =>
        filters.type.includes(notification.type)
      );
    }

    // 우선순위 필터링
    if (filters.priority.length > 0) {
      filtered = filtered.filter(notification =>
        filters.priority.includes(notification.priority)
      );
    }

    // 날짜 범위 필터링
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(notification => {
        const createdAt = this.getNotificationDate(notification.createdAt);
        
        if (filters.dateRange.start && filters.dateRange.end) {
          return isWithinInterval(createdAt, {
            start: filters.dateRange.start,
            end: filters.dateRange.end,
          });
        } else if (filters.dateRange.start) {
          return createdAt >= filters.dateRange.start;
        } else if (filters.dateRange.end) {
          return createdAt <= filters.dateRange.end;
        }
        
        return true;
      });
    }

    // 정렬
    filtered = this.sortNotifications(filtered, filters.sortBy, filters.sortOrder);

    return filtered;
  }

  /**
   * 알림 정렬
   */
  static sortNotifications(
    notifications: Notification[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): Notification[] {
    return [...notifications].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'createdAt': {
          const dateA = this.getNotificationDate(a.createdAt);
          const dateB = this.getNotificationDate(b.createdAt);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        }

        case 'priority': {
          const priorityOrder = { high: 3, medium: 2, low: 1 } as const;
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        }

        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;

        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * 알림 그룹화
   */
  static groupNotifications(
    notifications: Notification[],
    groupBy: 'date' | 'type' | 'priority' | 'status'
  ): NotificationGroup[] {
    const groups = new Map<string, Notification[]>();

    notifications.forEach(notification => {
      let key = '';
      let label = '';

      switch (groupBy) {
        case 'date': {
          const date = this.getNotificationDate(notification.createdAt);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - date.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            key = 'today';
            label = '오늘';
          } else if (diffDays === 2) {
            key = 'yesterday';
            label = '어제';
          } else if (diffDays <= 7) {
            key = 'this-week';
            label = '이번 주';
          } else if (diffDays <= 30) {
            key = 'this-month';
            label = '이번 달';
          } else {
            key = 'older';
            label = '이전';
          }
          break;
        }

        case 'type':
          key = notification.type;
          label = this.getTypeLabel(notification.type);
          break;

        case 'priority':
          key = notification.priority;
          label = this.getPriorityLabel(notification.priority);
          break;

        case 'status':
          key = notification.status;
          label = notification.status === 'unread' ? '읽지 않음' : '읽음';
          break;
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(notification);
    });

    return Array.from(groups.entries()).map(([key, notifications]) => ({
      key,
      label: this.getGroupLabel(key, notifications.length),
      notifications,
      count: notifications.length,
    }));
  }

  /**
   * 알림 날짜 변환
   */
  static getNotificationDate(timestamp: any): Date {
    if (timestamp?.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (typeof timestamp === 'string') {
      return parseISO(timestamp);
    }
    return new Date(timestamp);
  }

  /**
   * 타입 라벨 가져오기
   */
  static getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      task: '할일',
      group: '그룹',
      system: '시스템',
      reminder: '리마인더',
    };
    return labels[type] || type;
  }

  /**
   * 우선순위 라벨 가져오기
   */
  static getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      high: '높음',
      medium: '보통',
      low: '낮음',
    };
    return labels[priority] || priority;
  }

  /**
   * 그룹 라벨 생성
   */
  static getGroupLabel(key: string, count: number): string {
    const baseLabel = this.getTypeLabel(key) || key;
    return `${baseLabel} (${count})`;
  }

  /**
   * 검색 결과 하이라이트
   */
  static highlightSearchTerm(text: string, searchTerm: string): string {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}
