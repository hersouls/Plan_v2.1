import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Award,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { PointHistory } from '../../lib/points';
import { User as UserType } from '../../types/user';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';

interface PointHistoryListProps {
  histories: PointHistory[];
  userProfiles: Record<string, UserType>;
  loading?: boolean;
  title?: string;
  showFilters?: boolean;
  maxItems?: number;
  onRefresh?: () => void;
  onViewDetail?: (history: PointHistory) => void;
}

type FilterType = 'all' | 'earned' | 'deducted' | 'manual';
type SortType = 'date' | 'amount' | 'user';

export function PointHistoryList({
  histories,
  userProfiles,
  loading = false,
  title = '포인트 내역',
  showFilters = true,
  maxItems,
  onRefresh,
  onViewDetail,
}: PointHistoryListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // 필터링된 및 정렬된 내역
  const filteredAndSortedHistories = useMemo(() => {
    let filtered = histories;

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(history => {
        const user = userProfiles[history.userId];
        const userName =
          user?.displayName || `사용자 ${history.userId.slice(-4)}`;
        const reason = history.reason || '';
        const taskName = history.taskName || '';

        return (
          userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
          taskName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // 타입 필터
    if (filterType !== 'all') {
      filtered = filtered.filter(history => {
        if (filterType === 'earned') {
          return history.type === 'earned' || history.type === 'bonus';
        } else if (filterType === 'deducted') {
          return history.type === 'deducted' || history.type === 'penalty';
        } else if (filterType === 'manual') {
          return (
            history.type === 'manual_add' || history.type === 'manual_deduct'
          );
        }
        return true;
      });
    }

    // 정렬
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortType) {
        case 'date':
          comparison =
            new Date(b.createdAt.seconds * 1000).getTime() -
            new Date(a.createdAt.seconds * 1000).getTime();
          break;
        case 'amount':
          comparison = Math.abs(b.points) - Math.abs(a.points);
          break;
        case 'user':
          const userA = userProfiles[a.userId]?.displayName || a.userId;
          const userB = userProfiles[b.userId]?.displayName || b.userId;
          comparison = userA.localeCompare(userB, 'ko');
          break;
      }

      return sortDirection === 'asc' ? -comparison : comparison;
    });

    return maxItems ? filtered.slice(0, maxItems) : filtered;
  }, [
    histories,
    userProfiles,
    searchTerm,
    filterType,
    sortType,
    sortDirection,
    maxItems,
  ]);

  // 통계 계산
  const stats = useMemo(() => {
    const total = filteredAndSortedHistories.length;
    const earned = filteredAndSortedHistories.filter(
      h => h.type === 'earned' || h.type === 'bonus'
    ).length;
    const deducted = filteredAndSortedHistories.filter(
      h => h.type === 'deducted' || h.type === 'penalty'
    ).length;
    const manual = filteredAndSortedHistories.filter(
      h => h.type === 'manual_add' || h.type === 'manual_deduct'
    ).length;

    return { total, earned, deducted, manual };
  }, [filteredAndSortedHistories]);

  // 날짜 포맷팅
  const formatDate = (timestamp: any) => {
    try {
      const date = new Date(timestamp.seconds * 1000);
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

  // 포인트 타입별 스타일 - 모든 타입에 대해 동일한 밝은 초록색 배경 사용
  const getPointStyle = (history: PointHistory) => {
    const isEarned = history.type === 'earned' || history.type === 'bonus';
    const isDeducted =
      history.type === 'deducted' || history.type === 'penalty';
    const isManual =
      history.type === 'manual_add' || history.type === 'manual_deduct';

    // 모든 포인트 타입에 대해 동일한 스타일 적용
    return {
      icon: Plus,
      label: '포인트',
    };
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Typography.H2 className="typography-h2 text-white mb-2 font-pretendard">
            {title}
          </Typography.H2>
          <Typography.Body className="typography-body text-white/80 font-pretendard">
            총 {stats.total}건의 포인트 내역
          </Typography.Body>
        </div>

        {onRefresh && (
          <WaveButton
            onClick={onRefresh}
            variant="ghost"
            size="sm"
            disabled={loading}
            className="wave-button wave-button-ghost wave-button-sm text-white border-white/30 hover:bg-white/10 font-pretendard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </WaveButton>
        )}
      </div>

      {/* 필터 및 검색 */}
      {showFilters && (
        <div className="space-y-4">
          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
            <input
              type="text"
              placeholder="사용자명, 사유, 할일명으로 검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-default w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-pretendard"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 필터 및 정렬 */}
          <div className="flex flex-wrap gap-3">
            {/* 타입 필터 */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: '전체', count: stats.total },
                { key: 'earned', label: '획득', count: stats.earned },
                { key: 'deducted', label: '차감', count: stats.deducted },
                { key: 'manual', label: '수동', count: stats.manual },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key as FilterType)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 font-pretendard ${
                    filterType === key
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 hover:shadow-md'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>

            {/* 정렬 */}
            <div className="flex gap-2">
              <select
                value={sortType}
                onChange={e => setSortType(e.target.value as SortType)}
                className="modal-dropdown px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-pretendard"
              >
                <option value="date">날짜순</option>
                <option value="amount">금액순</option>
                <option value="user">사용자순</option>
              </select>
              <button
                onClick={() =>
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                }
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm hover:bg-white/20 transition-all duration-200 font-pretendard"
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 로딩 상태 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : filteredAndSortedHistories.length === 0 ? (
        /* 빈 상태 */
        <GlassCard
          variant="medium"
          className="glass-medium p-12 text-center rounded-xl"
        >
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-white/60" />
          </div>
          <Typography.H3 className="typography-h3 text-white mb-2 font-pretendard">
            포인트 내역이 없습니다
          </Typography.H3>
          <Typography.Body className="typography-body text-white/80 font-pretendard">
            {searchTerm || filterType !== 'all'
              ? '검색 조건에 맞는 포인트 내역이 없습니다.'
              : '아직 포인트 내역이 기록되지 않았습니다.'}
          </Typography.Body>
        </GlassCard>
      ) : (
        /* 포인트 내역 목록 */
        <div className="space-y-3">
          {filteredAndSortedHistories.map(history => {
            const user = userProfiles[history.userId];
            const userName =
              user?.displayName || `사용자 ${history.userId.slice(-4)}`;
            const userAvatar = user?.photoURL;
            const style = getPointStyle(history);
            const Icon = style.icon;

            return (
              <div
                key={history.id}
                className="bg-green-100 dark:bg-green-900/30 p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer border border-green-200 dark:border-green-700/50"
                onClick={() => onViewDetail?.(history)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* 포인트 아이콘 */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm bg-teal-500">
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    {/* 포인트 정보 */}
                    <div className="flex-1">
                      <Typography.Body className="typography-body font-bold text-gray-800 dark:text-gray-200 font-pretendard mb-1">
                        {history.taskName
                          ? `할일 완료: ${history.taskName}`
                          : history.reason || '포인트 내역'}
                      </Typography.Body>
                      <Typography.Body className="typography-body text-gray-600 dark:text-gray-300 text-sm font-pretendard">
                        {formatDate(history.createdAt)} 승인 완료
                      </Typography.Body>
                    </div>
                  </div>

                  {/* 포인트 금액 - 오른쪽에 표시 */}
                  <div className="flex items-center gap-3">
                    <Typography.Body className="typography-body font-bold text-green-600 dark:text-green-400 font-pretendard">
                      {history.points > 0 ? '+' : ''}
                      {history.points} 포인트
                    </Typography.Body>
                    <MoreHorizontal className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
