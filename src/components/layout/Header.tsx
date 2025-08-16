import {
  Award,
  BarChart3,
  Bell,
  Home,
  Plus,
  Settings,
  Users,
} from 'lucide-react';
import { memo, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '../../lib/utils';

// Types
interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  ariaLabel: string;
  position: 'left' | 'right';
}

// Constants
const LEFT_NAV_ITEMS: NavItem[] = [
  {
    path: '/',
    label: '홈',
    icon: Home,
    ariaLabel: '홈으로 이동',
    position: 'left',
  },
] as const;

const RIGHT_NAV_ITEMS: NavItem[] = [
  {
    path: '/notifications',
    label: '알림',
    icon: Bell,
    ariaLabel: '알림 페이지로 이동',
    position: 'right',
  },
  {
    path: '/tasks/create',
    label: '할일추가',
    icon: Plus,
    ariaLabel: '새 할일 추가',
    position: 'right',
  },
  {
    path: '/family',
    label: '가족관리',
    icon: Users,
    ariaLabel: '가족 관리 페이지로 이동',
    position: 'right',
  },
  {
    path: '/points',
    label: '포인트',
    icon: Award,
    ariaLabel: '포인트 관리 페이지로 이동',
    position: 'right',
  },
  {
    path: '/statistics',
    label: '통계보기',
    icon: BarChart3,
    ariaLabel: '통계 페이지로 이동',
    position: 'right',
  },
  {
    path: '/settings',
    label: '설정',
    icon: Settings,
    ariaLabel: '설정 페이지로 이동',
    position: 'right',
  },
] as const;

// Sub-components
const IconButton = memo<{
  item: NavItem;
  isActive: boolean;
  showBadge?: boolean;
  badgeCount?: number;
}>(({ item, isActive, showBadge = false, badgeCount = 0 }) => {
  const Icon = item.icon;

  return (
    <Link to={item.path} className="group touch-optimized">
      <button
        aria-label={item.ariaLabel}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'relative rounded-xl transition-all duration-300 ease-out',
          'hover:bg-white/15 active:bg-white/25 hover:scale-105 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-slate-900',
          'touch-target flex items-center justify-center',
          // 반응형 패딩 - Mobile은 작게, 나머지는 크게
          'p-1.5 sm:p-3 md:p-4 lg:p-5 xl:p-6',
          // 반응형 최소 크기 - Mobile은 작게, 나머지는 크게
          'min-w-8 min-h-8 sm:min-w-12 sm:min-h-12 md:min-w-14 md:min-h-14 lg:min-w-16 lg:min-h-16 xl:min-w-18 xl:min-h-18',
          isActive && 'bg-white/20 shadow-lg shadow-white/10'
        )}
      >
        <Icon
          className={cn(
            'transition-all duration-300 ease-out',
            // 반응형 아이콘 크기 - Mobile은 작게, 나머지는 크게
            'w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9',
            isActive
              ? 'text-yellow-300 drop-shadow-sm'
              : 'text-white/90 group-hover:text-white'
          )}
          strokeWidth={isActive ? 2.5 : 2}
        />

        {/* 알림 배지 */}
        {showBadge && badgeCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1 shadow-lg">
            {badgeCount > 99 ? '99+' : badgeCount}
          </div>
        )}

        {/* Active indicator */}
        {isActive && (
          <div
            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-yellow-300 rounded-full shadow-lg shadow-yellow-300/50"
            aria-hidden="true"
          />
        )}

        {/* Hover effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>
    </Link>
  );
});

IconButton.displayName = 'IconButton';

export const Header = memo(() => {
  const location = useLocation();
  const { stats } = useNotifications();

  // Memoize active path checks for all nav items
  const activeStates = useMemo(() => {
    const pathname = location.pathname;
    const allItems = [...LEFT_NAV_ITEMS, ...RIGHT_NAV_ITEMS];
    return allItems.reduce((acc, item) => {
      acc[item.path] =
        item.path === '/'
          ? pathname === '/' || pathname === '/todo'
          : pathname.startsWith(item.path);
      return acc;
    }, {} as Record<string, boolean>);
  }, [location.pathname]);

  return (
    <header
      className="fixed top-0 left-0 right-0 w-full z-50 header-with-spacing bg-transparent"
      role="banner"
      aria-label="메인 네비게이션"
    >
      {/* 반응형 컨테이너 - TodoHome과 동일한 max-width */}
      <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto w-full">
        {/* 헤더 내부 컨테이너 - 좌우 끝으로 아이콘 배치 */}
        <div className="flex items-center justify-between h-12 sm:h-20 md:h-24 lg:h-28 xl:h-32 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
          {/* 왼쪽 홈 아이콘 - 좌측 끝 */}
          <nav className="flex items-center" aria-label="왼쪽 메뉴">
            {LEFT_NAV_ITEMS.map(item => (
              <IconButton
                key={item.path + item.label}
                item={item}
                isActive={activeStates[item.path]}
              />
            ))}
          </nav>

          {/* 오른쪽 아이콘들 - 우측 끝 */}
          <nav
            className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 xl:gap-4"
            aria-label="오른쪽 메뉴"
          >
            {RIGHT_NAV_ITEMS.map(item => (
              <IconButton
                key={item.path + item.label}
                item={item}
                isActive={activeStates[item.path]}
                showBadge={item.path === '/notifications'}
                badgeCount={
                  item.path === '/notifications' ? stats?.unread || 0 : 0
                }
              />
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
