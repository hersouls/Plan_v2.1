import { useState } from 'react';
import { Bell, Settings, Filter, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { GlassCard } from '../components/ui/GlassCard';
import { WaveButton } from '../components/ui/WaveButton';
import { Typography } from '../components/ui/typography';

// 고도화된 훅들
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
import { useNotificationBadge } from '../hooks/useNotificationBadge';
import { useInfiniteNotifications } from '../hooks/useInfiniteNotifications';

// 고도화된 컴포넌트들
import { AdvancedFilterPanel } from '../components/notifications/AdvancedFilterPanel';
import { NotificationGroup } from '../components/notifications/NotificationGroup';
import { NotificationItem } from '../components/notifications/NotificationItem';
import { VirtualizedNotificationList } from '../components/notifications/VirtualizedNotificationList';
import { NotificationStats } from '../components/notifications/NotificationStats';
import { NotificationSettings } from '../components/notifications/NotificationSettings';
import { AccessibleNotificationItem } from '../components/notifications/AccessibleNotificationItem';

// 유틸리티
import { NotificationFilterUtils } from '../utils/notificationFilters';
import { AdvancedFilters } from '../types/notification';

function NotificationsEnhanced() {
  const { user } = useAuth();

  // 상태 관리
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [groupBy, setGroupBy] = useState<'none' | 'date' | 'type' | 'priority'>('none');
  const [useVirtualization, setUseVirtualization] = useState(false);
  const [useAccessibility, setUseAccessibility] = useState(true);

  // 고급 필터
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    dateRange: { start: null, end: null },
    priority: [],
    type: [],
    status: [],
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // 실시간 알림 구독
  const {
    notifications: realtimeNotifications,
    loading: realtimeLoading,
    error: realtimeError,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useRealtimeNotifications(user?.uid, {
    limit: 100,
  });

  // 무한 스크롤 (대용량 데이터용)
  const {
    notifications: infiniteNotifications,
    loading: infiniteLoading,
    loadingMore,
    hasMore,
    error: infiniteError,
    loadMore,
    markMultipleAsRead,
    deleteMultipleNotifications,
  } = useInfiniteNotifications(user?.uid, {
    limit: 20,
  });

  // 현재 사용할 알림 데이터 선택
  const currentNotifications = useVirtualization ? infiniteNotifications : realtimeNotifications;
  const currentLoading = useVirtualization ? infiniteLoading : realtimeLoading;
  const currentError = useVirtualization ? infiniteError : realtimeError;

  // 알림 배지 관리
  const unreadCount = currentNotifications.filter(n => n.status === 'unread').length;
  useNotificationBadge(unreadCount);

  // 필터링된 알림
  const filteredNotifications = NotificationFilterUtils.filterNotifications(
    currentNotifications,
    advancedFilters
  );

  // 그룹화된 알림
  const groupedNotifications = groupBy !== 'none' 
    ? NotificationFilterUtils.groupNotifications(filteredNotifications, groupBy)
    : [];

  // 통계 계산
  const stats = {
    total: currentNotifications.length,
    unread: unreadCount,
    read: currentNotifications.filter(n => n.status === 'read').length,
    byType: {
      task: currentNotifications.filter(n => n.type === 'task').length,
      group: currentNotifications.filter(n => n.type === 'group').length,
      system: currentNotifications.filter(n => n.type === 'system').length,
      reminder: currentNotifications.filter(n => n.type === 'reminder').length,
    },
  };

  // 필터 초기화
  const handleClearFilters = () => {
    setAdvancedFilters({
      dateRange: { start: null, end: null },
      priority: [],
      type: [],
      status: [],
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  // 일괄 작업 핸들러
  const handleMarkGroupAsRead = async (notificationIds: string[]) => {
    if (useVirtualization) {
      await markMultipleAsRead(notificationIds);
    } else {
      await Promise.all(notificationIds.map(id => markAsRead(id)));
    }
  };

  const handleDeleteGroup = async (notificationIds: string[]) => {
    if (useVirtualization) {
      await deleteMultipleNotifications(notificationIds);
    } else {
      await Promise.all(notificationIds.map(id => deleteNotification(id)));
    }
  };

  // 스크롤 이벤트 (무한 스크롤)
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!useVirtualization || !hasMore || loadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadMore();
    }
  };

  if (currentLoading) {
    return (
      <div className="min-h-screen">
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" text="알림을 불러오는 중..." />
        </div>
      </div>
    );
  }

  if (currentError) {
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
                {currentError}
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
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 fixed-header-spacing"
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
                  {stats.total}개의 알림이 있습니다
                </Typography.Body>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* 통계 토글 */}
              <WaveButton
                onClick={() => setShowStats(!showStats)}
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white"
              >
                📊
              </WaveButton>

              {/* 필터 토글 */}
              <WaveButton
                onClick={() => setShowFilters(!showFilters)}
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white"
              >
                <Filter className="w-4 h-4" />
              </WaveButton>

              {/* 설정 */}
              <WaveButton
                onClick={() => setShowSettings(true)}
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white"
              >
                <Settings className="w-4 h-4" />
              </WaveButton>

              {/* 모두 읽음 */}
              {unreadCount > 0 && (
                <WaveButton
                  onClick={markAllAsRead}
                  variant="ghost"
                  size="sm"
                  className="text-white/80 hover:text-white"
                >
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">모두 읽음</span>
                </WaveButton>
              )}

              {/* 새로고침 */}
              <WaveButton
                onClick={() => window.location.reload()}
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </WaveButton>
            </div>
          </div>
        </div>

        {/* 통계 대시보드 */}
        {showStats && (
          <div className="mb-6">
            <NotificationStats stats={stats} />
          </div>
        )}

        {/* 고급 필터 */}
        <AdvancedFilterPanel
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          onClearFilters={handleClearFilters}
          isOpen={showFilters}
          onToggle={() => setShowFilters(!showFilters)}
        />

        {/* 뷰 옵션 */}
        <GlassCard variant="light" className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Typography.Label className="text-white/80">그룹화:</Typography.Label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="bg-white/10 border border-white/20 text-white rounded-md px-3 py-1 text-sm"
              >
                <option value="none">그룹화 없음</option>
                <option value="date">날짜별</option>
                <option value="type">타입별</option>
                <option value="priority">우선순위별</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useVirtualization}
                  onChange={(e) => setUseVirtualization(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-white/80 text-sm">가상화 (대용량)</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useAccessibility}
                  onChange={(e) => setUseAccessibility(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-white/80 text-sm">접근성 모드</span>
              </label>
            </div>
          </div>
        </GlassCard>

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
                {advancedFilters.search || advancedFilters.priority.length > 0 || advancedFilters.type.length > 0
                  ? '필터 조건에 맞는 알림이 없습니다.'
                  : '새로운 알림이 도착하면 여기에 표시됩니다.'}
              </Typography.Body>
            </div>
          </GlassCard>
        ) : (
          <div onScroll={handleScroll} className="space-y-4">
            {groupBy !== 'none' ? (
              // 그룹화된 뷰
              groupedNotifications.map((group) => (
                <NotificationGroup
                  key={group.key}
                  group={group}
                  onMarkAsRead={markAsRead}
                  onDeleteNotification={deleteNotification}
                  onMarkGroupAsRead={handleMarkGroupAsRead}
                  onDeleteGroup={handleDeleteGroup}
                  searchTerm={advancedFilters.search}
                />
              ))
            ) : useVirtualization ? (
              // 가상화된 뷰
              <VirtualizedNotificationList
                notifications={filteredNotifications}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                searchTerm={advancedFilters.search}
                height={600}
              />
            ) : (
              // 일반 뷰
              filteredNotifications.map((notification, index) => 
                useAccessibility ? (
                  <AccessibleNotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    searchTerm={advancedFilters.search}
                    index={index}
                    totalCount={filteredNotifications.length}
                  />
                ) : (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    searchTerm={advancedFilters.search}
                  />
                )
              )
            )}

            {/* 무한 스크롤 로딩 */}
            {useVirtualization && loadingMore && (
              <div className="text-center py-4">
                <LoadingSpinner size="md" text="더 많은 알림을 불러오는 중..." />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 알림 설정 모달 */}
      <NotificationSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

export default NotificationsEnhanced;
