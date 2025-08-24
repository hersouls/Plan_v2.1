import { useCallback, useEffect, useState } from 'react';
import type { PointStats } from '../lib/points';
import { pointsService } from '../lib/points';
import { logger } from '../lib/utils';

export interface UseMemberStatsOptions {
  groupId?: string | null;
  memberIds?: string[];
}

export interface UseMemberStatsResult {
  statsByUserId: Record<string, PointStats>;
  refresh: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useMemberStats(
  options: UseMemberStatsOptions
): UseMemberStatsResult {
  const { groupId } = options;
  const [statsByUserId, setStatsByUserId] = useState<
    Record<string, PointStats>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const stats = await pointsService.getGroupPointStats(groupId);
      const map: Record<string, PointStats> = {};
      for (const s of stats) {
        map[s.userId] = s;
      }
      setStatsByUserId(map);
    } catch (e) {
      logger.error('points', 'Failed to load member stats', { groupId }, e);
      setError('멤버 통계 로드 실패');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    refresh();
  }, [groupId, refresh]);

  return {
    statsByUserId,
    refresh,
    loading,
    error,
  };
}
