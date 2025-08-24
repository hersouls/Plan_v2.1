import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import type { PointHistory } from '../lib/points';
import { pointsService } from '../lib/points';
import { logger } from '../lib/utils';

export interface UsePointHistoryOptions {
  groupId?: string | null;
  userId?: string | null;
  realtime?: boolean;
}

export interface UsePointHistoryResult {
  approved: PointHistory[];
  unapproved: PointHistory[];
  loading: {
    approved: boolean;
    unapproved: boolean;
    overall: boolean;
  };
  error: string | null;
  refreshApproved: () => Promise<void>;
  refreshUnapproved: () => Promise<void>;
}

export function usePointHistory(
  options: UsePointHistoryOptions
): UsePointHistoryResult {
  const { groupId, userId, realtime = true } = options;
  const [approved, setApproved] = useState<PointHistory[]>([]);
  const [unapproved, setUnapproved] = useState<PointHistory[]>([]);
  const [loadingApproved, setLoadingApproved] = useState(false);
  const [loadingUnapproved, setLoadingUnapproved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 실시간 구독 설정
  useEffect(() => {
    if (!groupId || !userId || !realtime) return;

    setLoadingApproved(true);
    setLoadingUnapproved(true);
    setError(null);

    // 승인된 내역 실시간 구독
    const approvedQuery = query(
      collection(db, 'pointHistory'),
      where('userId', '==', userId),
      where('groupId', '==', groupId),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const approvedUnsubscribe = onSnapshot(
      approvedQuery,
      snapshot => {
        const approvedHistory = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as PointHistory[];
        setApproved(approvedHistory);
        setLoadingApproved(false);
      },
      error => {
        logger.error(
          'usePointHistory',
          'Approved history subscription error',
          error
        );
        setError('승인된 포인트 내역 로드 실패');
        setLoadingApproved(false);
      }
    );

    // 미승인 내역 실시간 구독
    const unapprovedQuery = query(
      collection(db, 'pointHistory'),
      where('userId', '==', userId),
      where('groupId', '==', groupId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unapprovedUnsubscribe = onSnapshot(
      unapprovedQuery,
      snapshot => {
        const unapprovedHistory = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as PointHistory[];
        setUnapproved(unapprovedHistory);
        setLoadingUnapproved(false);
      },
      error => {
        logger.error(
          'usePointHistory',
          'Unapproved history subscription error',
          error
        );
        setError('미승인 포인트 내역 로드 실패');
        setLoadingUnapproved(false);
      }
    );

    // 정리 함수
    return () => {
      approvedUnsubscribe();
      unapprovedUnsubscribe();
    };
  }, [groupId, userId, realtime]);

  // 수동 새로고침 함수들 (실시간이 비활성화된 경우 사용)
  const refreshUnapproved = useCallback(async () => {
    if (!groupId || !userId || realtime) return;
    setLoadingUnapproved(true);
    setError(null);
    try {
      const data = await pointsService.getUnapprovedPointHistory(
        userId,
        groupId
      );
      setUnapproved(data);
    } catch (e) {
      logger.error(
        'points',
        'Failed to load unapproved history',
        { groupId, userId },
        e
      );
      setError('미승인 포인트 내역 로드 실패');
    } finally {
      setLoadingUnapproved(false);
    }
  }, [groupId, userId, realtime]);

  const refreshApproved = useCallback(async () => {
    if (!groupId || !userId || realtime) return;
    setLoadingApproved(true);
    setError(null);
    try {
      const data = await pointsService.getApprovedPointHistory(userId, groupId);
      setApproved(data);
    } catch (e) {
      logger.error(
        'points',
        'Failed to load approved history',
        { groupId, userId },
        e
      );
      setError('승인된 포인트 내역 로드 실패');
    } finally {
      setLoadingApproved(false);
    }
  }, [groupId, userId, realtime]);

  // 실시간이 비활성화된 경우 초기 로드
  useEffect(() => {
    if (!groupId || !userId || realtime) return;
    refreshUnapproved();
    refreshApproved();
  }, [groupId, userId, realtime, refreshUnapproved, refreshApproved]);

  return {
    approved,
    unapproved,
    loading: {
      approved: loadingApproved,
      unapproved: loadingUnapproved,
      overall: loadingApproved || loadingUnapproved,
    },
    error,
    refreshApproved,
    refreshUnapproved,
  };
}
