import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Bell, Check, Clock, Filter, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
//
import logger from '@/lib/logger';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { GlassCard } from '../components/ui/GlassCard';
import { WaveButton } from '../components/ui/WaveButton';
import { Typography } from '../components/ui/typography';
import { useAuth } from '../contexts/AuthContext';
import { NotificationService } from '../lib/notifications';
import { cn } from '../lib/utils';
import { Notification, NotificationStats } from '../types/notification';

function Notifications() {
  //
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // 알림 데이터 로드
  useEffect(() => {
    if (!user?.uid) return;

    const loadNotifications = async () => {
      setLoading(true);
      setError(null);

      try {
        const [notificationsData, statsData] = await Promise.all([
          NotificationService.getUserNotifications(user.uid, { limit: 100 }),
          NotificationService.getNotificationStats(user.uid),
        ]);

        setNotifications(notificationsData);
        setStats(statsData);
      } catch (err) {
        logger.error('notifications', '알림 로드 실패', err);
        setError('알림을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user?.uid]);

  // 필터링된 알림
  const filteredNotifications = notifications.filter(notification => {
    if (filter !== 'all' && notification.status !== filter) return false;
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
    return true;
  });

  // 알림 읽음 처리
  const handleMarkAsRead = async (notificationId: string) => {
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
  };

  // 모든 알림 읽음 처리
  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;

    try {
      await NotificationService.markAllAsRead(user.uid);
      setNotifications(prev =>
        prev.map(n => ({ ...n, status: 'read' as const, readAt: new Date() }))
      );
    } catch (error) {
      logger.error('notifications', '모든 알림 읽음 처리 실패', error);
    }
  };

  // 알림 삭제
  const handleDeleteNotification = async (notificationId: string) => {
    if (!confirm('이 알림을 삭제하시겠습니까?')) return;

    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      logger.error('notifications', '알림 삭제 실패', error);
    }
  };

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
  const formatDate = (timestamp: any) => {
    try {
      const date = timestamp?.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
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

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" text="알림을 불러오는 중..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <GlassCard variant="medium" className="p-8 text-center max-w-md mx-4">
            <div className="space-y-4">
              <div className="flex justify-center">
                <Bell className="h-16 w-16 text-red-500" />
              </div>
              <Typography.H3 className="text-red-600 font-pretendard tracking-ko-tight">
                오류 발생
              </Typography.H3>
              <Typography.Body className="text-gray-700 font-pretendard leading-ko-normal">
                {error}
              </Typography.Body>
              <WaveButton
                onClick={() => window.location.reload()}
                className="w-full"
              >
                다시 시도
              </WaveButton>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div
        className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 fixed-header-spacing"
        style={{ paddingTop: '120px' }}
      >
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <Typography.H2 className="text-white font-pretendard tracking-ko-tight text-xl sm:text-2xl lg:text-3xl">
                  알림
                </Typography.H2>
                <Typography.Body className="text-white/80 font-pretendard text-sm sm:text-base">
                  {stats?.total || 0}개의 알림이 있습니다
                </Typography.Body>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <WaveButton
                onClick={() => setShowFilters(!showFilters)}
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white"
              >
                <Filter className="w-4 h-4" />
              </WaveButton>

              {stats?.unread && stats.unread > 0 && (
                <WaveButton
                  onClick={handleMarkAllAsRead}
                  variant="ghost"
                  size="sm"
                  className="text-white/80 hover:text-white"
                >
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">모두 읽음</span>
                </WaveButton>
              )}
            </div>
          </div>
        </div>

        {/* 필터 섹션 */}
        {showFilters && (
          <GlassCard variant="light" className="p-4 mb-6">
            <div className="space-y-4">
              <Typography.H4 className="text-white font-pretendard text-lg">
                필터
              </Typography.H4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 상태 필터 */}
                <div>
                  <Typography.Label className="text-white/80 mb-2 block">
                    상태
                  </Typography.Label>
                  <div className="flex gap-2">
                    {[
                      { key: 'all', label: '전체' },
                      { key: 'unread', label: '읽지 않음' },
                      { key: 'read', label: '읽음' },
                    ].map(option => (
                      <button
                        key={option.key}
                        onClick={() => setFilter(option.key as any)}
                        className={cn(
                          'px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200',
                          filter === option.key
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 타입 필터 */}
                <div>
                  <Typography.Label className="text-white/80 mb-2 block">
                    타입
                  </Typography.Label>
                  <div className="flex gap-2">
                    {[
                      { key: 'all', label: '전체' },
                      { key: 'task', label: '할일' },
                      { key: 'group', label: '그룹' },
                      { key: 'system', label: '시스템' },
                      { key: 'reminder', label: '리마인더' },
                    ].map(option => (
                      <button
                        key={option.key}
                        onClick={() => setTypeFilter(option.key)}
                        className={cn(
                          'px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200',
                          typeFilter === option.key
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* 알림 목록 */}
        {filteredNotifications.length === 0 ? (
          <GlassCard variant="light" className="p-12 text-center">
            <div className="space-y-4">
              <div className="flex justify-center">
                <Bell className="h-16 w-16 text-gray-400" />
              </div>
              <Typography.H4 className="text-white font-pretendard text-lg">
                알림이 없습니다
              </Typography.H4>
              <Typography.Body className="text-white/70 font-pretendard">
                새로운 알림이 도착하면 여기에 표시됩니다.
              </Typography.Body>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map(notification => (
              <GlassCard
                key={notification.id}
                variant="light"
                className={cn(
                  'p-4 transition-all duration-200 hover:shadow-lg',
                  notification.status === 'unread' &&
                    'border-l-4 border-blue-400 bg-blue-400/5'
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
                          {notification.title}
                        </Typography.H5>
                        <Typography.Body className="text-white/80 font-pretendard text-sm mt-1 line-clamp-3">
                          {notification.message}
                        </Typography.Body>
                      </div>

                      {/* 액션 버튼들 */}
                      <div className="flex items-center gap-1">
                        {notification.status === 'unread' && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors duration-200"
                            aria-label="읽음 처리"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleDeleteNotification(notification.id)
                          }
                          className="p-1 text-white/60 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors duration-200"
                          aria-label="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
