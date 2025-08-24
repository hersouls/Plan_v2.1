import logger from '@/lib/logger';
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { computeCompletionRate, computeStreaks } from './pointsMetrics';

// 포인트 내역 인터페이스
export interface PointHistory {
  id: string;
  userId: string;
  groupId: string;
  type:
    | 'earned'
    | 'deducted'
    | 'bonus'
    | 'penalty'
    | 'manual_add'
    | 'manual_deduct';
  amount: number;
  reason: string;
  taskId?: string;
  taskTitle?: string;
  createdAt: Timestamp;
  description?: string;
  // 상태 관리 정규화
  status: 'pending' | 'approved' | 'rejected';
  // 승인/거부 정보
  approvedAt?: Timestamp;
  approvedBy?: string;
  rejectedAt?: Timestamp;
  rejectedBy?: string;
  // 기존 호환성을 위한 필드 (deprecated)
  isApproved?: boolean;
}

// 포인트 규칙 인터페이스
export interface PointRule {
  id: string;
  groupId: string;
  name: string;
  type:
    | 'task_completion'
    | 'streak_bonus'
    | 'completion_rate'
    | 'manual'
    | 'custom';
  points: number;
  conditions?: {
    minTasks?: number;
    minStreak?: number;
    minCompletionRate?: number;
    categories?: string[];
  };
  description: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 포인트 통계 인터페이스
export interface PointStats {
  userId: string;
  groupId: string;
  totalPoints: number;
  earnedPoints: number;
  deductedPoints: number;
  bonusPoints: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  rank: number;
  totalMembers: number;
  lastUpdated: Timestamp;
}

// 포인트 서비스 클래스
class PointsService {
  private statsCache: Map<string, { data: PointStats; ts: number }> = new Map();
  private groupStatsCache: Map<string, { data: PointStats[]; ts: number }> =
    new Map();
  private readonly cacheTtlMs = 30_000;
  private historyCache: Map<string, { data: PointHistory[]; ts: number }> =
    new Map();
  private inflightRequests: Map<string, Promise<unknown>> = new Map();

  private buildHistoryKey(
    scope: 'approved' | 'pending' | 'all',
    userId: string,
    groupId: string,
    limitCount: number
  ): string {
    return `${scope}:${userId}:${groupId}:${limitCount}`;
  }

  private invalidateHistoryCache(userId: string, groupId: string) {
    for (const key of this.historyCache.keys()) {
      if (key.includes(`:${userId}:${groupId}:`)) {
        this.historyCache.delete(key);
      }
    }
  }
  // 포인트 내역 추가
  async addPointHistory(
    history: Omit<PointHistory, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const historyData = {
        ...history,
        createdAt: Timestamp.now(),
        status: 'pending', // 기본적으로 승인되지 않은 상태
      };

      const docRef = await addDoc(collection(db, 'pointHistory'), historyData);
      this.invalidateHistoryCache(history.userId, history.groupId);

      // 포인트 통계 업데이트 (승인된 경우에만)
      // await this.updatePointStats(history.userId, history.groupId);

      return docRef.id;
    } catch (error) {
      logger.error('points', '포인트 내역 추가 실패', error);
      throw error;
    }
  }

  // 포인트 내역 조회
  async getPointHistory(
    userId: string,
    groupId: string,
    limitCount: number = 50
  ): Promise<PointHistory[]> {
    try {
      const q = query(
        collection(db, 'pointHistory'),
        where('userId', '==', userId),
        where('groupId', '==', groupId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as PointHistory[];
    } catch (error) {
      logger.error(
        'points',
        '포인트 내역 조회 실패',
        { userId, groupId },
        error
      );
      throw error;
    }
  }

  // 그룹의 모든 멤버 포인트 내역 조회
  async getGroupPointHistory(groupId: string): Promise<PointHistory[]> {
    try {
      const q = query(
        collection(db, 'pointHistory'),
        where('groupId', '==', groupId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as PointHistory[];
    } catch (error) {
      logger.error('points', '그룹 포인트 내역 조회 실패', { groupId }, error);
      throw error;
    }
  }

  // 포인트 규칙 생성
  async createPointRule(
    rule: Omit<PointRule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const ruleData = {
        ...rule,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'pointRules'), ruleData);
      return docRef.id;
    } catch (error) {
      logger.error('points', '포인트 규칙 생성 실패', error);
      throw error;
    }
  }

  // 포인트 규칙 조회
  async getPointRules(groupId: string): Promise<PointRule[]> {
    try {
      const q = query(
        collection(db, 'pointRules'),
        where('groupId', '==', groupId),
        where('isActive', '==', true),
        orderBy('createdAt', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as PointRule[];
    } catch (error) {
      logger.error('points', '포인트 규칙 조회 실패', { groupId }, error);
      throw error;
    }
  }

  // 포인트 규칙 업데이트
  async updatePointRule(
    ruleId: string,
    updates: Partial<PointRule>
  ): Promise<void> {
    try {
      const ruleRef = doc(db, 'pointRules', ruleId);
      await updateDoc(ruleRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      logger.error('points', '포인트 규칙 업데이트 실패', { ruleId }, error);
      throw error;
    }
  }

  // 포인트 통계 조회
  async getPointStats(
    userId: string,
    groupId: string
  ): Promise<PointStats | null> {
    try {
      const cacheKey = `${userId}_${groupId}`;
      const cached = this.statsCache.get(cacheKey);
      const now = Date.now();
      if (cached && now - cached.ts < this.cacheTtlMs) {
        return cached.data;
      }

      const statsRef = doc(db, 'pointStats', cacheKey);
      const statsDoc = await getDoc(statsRef);

      if (statsDoc.exists()) {
        const data = statsDoc.data() as PointStats;
        this.statsCache.set(cacheKey, { data, ts: now });
        return data;
      }

      return null;
    } catch (error) {
      logger.error(
        'points',
        '포인트 통계 조회 실패',
        { userId, groupId },
        error
      );
      throw error;
    }
  }

  // 포인트 통계 업데이트
  async updatePointStats(userId: string, groupId: string): Promise<void> {
    try {
      // 해당 사용자의 승인된 포인트 내역만 조회
      const history = await this.getApprovedPointHistory(userId, groupId, 1000);

      // 통계 계산 (승인된 포인트만)
      const earned = history
        .filter(h => h.type === 'earned')
        .reduce((sum, h) => sum + h.amount, 0);
      const manualAdd = history
        .filter(h => h.type === 'manual_add')
        .reduce((sum, h) => sum + h.amount, 0);
      const deducted = history
        .filter(
          h =>
            h.type === 'deducted' ||
            h.type === 'penalty' ||
            h.type === 'manual_deduct'
        )
        .reduce((sum, h) => sum + h.amount, 0);
      const bonus = history
        .filter(h => h.type === 'bonus')
        .reduce((sum, h) => sum + h.amount, 0);

      // 기간 설정 (완료율/스트릭 계산용): 최근 90일
      const periodEnd = new Date();
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - 90);

      // 작업 데이터 경량 조회: 기간 내 생성/완료 중심, 사용자/그룹 스코프
      // 1) 기간 내 생성된 할당(assigned)
      const assignedQuery = query(
        collection(db, 'tasks'),
        where('groupId', '==', groupId),
        where('assigneeId', '==', userId),
        where('createdAt', '>=', Timestamp.fromDate(periodStart)),
        orderBy('createdAt', 'desc'),
        limit(1000)
      );
      const assignedSnap = await getDocs(assignedQuery);
      const assignedCreatedAt = assignedSnap.docs
        .map(d => d.data()?.createdAt)
        .filter(Boolean) as Timestamp[];

      // 2) 기간 내 완료된 작업(완료 시각 기반)
      const completedQuery = query(
        collection(db, 'tasks'),
        where('groupId', '==', groupId),
        where('assigneeId', '==', userId),
        where('status', '==', 'completed'),
        where('completedAt', '>=', Timestamp.fromDate(periodStart)),
        orderBy('completedAt', 'desc'),
        limit(1000)
      );
      const completedSnap = await getDocs(completedQuery);
      const completedAtList = completedSnap.docs
        .map(d => d.data()?.completedAt)
        .filter(Boolean) as Timestamp[];

      // 스트릭 계산 (휴일 집합은 현재 비어있음; 테스트에서 주입 가능)
      const { currentStreak, longestStreak } = computeStreaks(completedAtList, {
        periodDays: 90,
      });

      // 완료율 계산 (기간 내 할당 대비 완료)
      const completionRate = computeCompletionRate(
        assignedCreatedAt,
        completedAtList,
        { periodStart, periodEnd }
      );

      // 임시 랭크/총원 계산: 현재 그룹 통계 스냅샷을 기반으로 자체 랭크 산정
      const groupStatsSnap = await getDocs(
        query(
          collection(db, 'pointStats'),
          where('groupId', '==', groupId),
          orderBy('totalPoints', 'desc')
        )
      );
      const existingStats = groupStatsSnap.docs.map(
        d => d.data() as PointStats
      );
      const merged = [
        ...existingStats.filter(s => s.userId !== userId),
        {
          userId,
          groupId,
          totalPoints: earned + manualAdd - deducted,
          earnedPoints: earned + manualAdd,
          deductedPoints: deducted,
          bonusPoints: bonus,
          currentStreak,
          longestStreak,
          completionRate,
          rank: 0,
          totalMembers: 0,
          lastUpdated: Timestamp.now(),
        },
      ].sort((a, b) => b.totalPoints - a.totalPoints);
      const totalMembers = merged.length;
      const rank = merged.findIndex(s => s.userId === userId) + 1;

      const stats: PointStats = {
        userId,
        groupId,
        totalPoints: earned + manualAdd - deducted,
        earnedPoints: earned + manualAdd,
        deductedPoints: deducted,
        bonusPoints: bonus,
        currentStreak,
        longestStreak,
        completionRate,
        rank,
        totalMembers,
        lastUpdated: Timestamp.now(),
      };

      // Firestore에 저장
      const statsRef = doc(db, 'pointStats', `${userId}_${groupId}`);
      await setDoc(statsRef, stats);

      // 캐시 무효화
      this.statsCache.delete(`${userId}_${groupId}`);
      this.groupStatsCache.delete(groupId);
    } catch (error) {
      logger.error('points', '포인트 통계 업데이트 실패', error);
      throw error;
    }
  }

  // 그룹의 모든 멤버 포인트 통계 조회
  async getGroupPointStats(groupId: string): Promise<PointStats[]> {
    try {
      const cached = this.groupStatsCache.get(groupId);
      const now = Date.now();
      if (cached && now - cached.ts < this.cacheTtlMs) {
        return cached.data;
      }

      const q = query(
        collection(db, 'pointStats'),
        where('groupId', '==', groupId),
        orderBy('totalPoints', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const stats = querySnapshot.docs.map(doc => doc.data() as PointStats);

      // 순위를 메모리에서만 계산 (쓰기 금지)
      const rankedStats = stats.map((stat, index) => ({
        ...stat,
        rank: index + 1,
        totalMembers: stats.length,
      }));

      this.groupStatsCache.set(groupId, { data: rankedStats, ts: now });
      return rankedStats;
    } catch (error) {
      logger.error('points', '그룹 포인트 통계 조회 실패', { groupId }, error);
      throw error;
    }
  }

  // 업적 달성 포인트 지급 및 즉시 반영
  async awardPointsForAchievement(
    userId: string,
    groupId: string,
    achievementId: string,
    achievementTitle: string,
    amount: number,
    approvedBy?: string
  ): Promise<void> {
    try {
      // 중복 지급 방지: 이미 승인된 업적 포인트가 있는지 확인
      const approved = await this.getApprovedPointHistory(userId, groupId, 1000);
      const alreadyAwarded = approved.some(
        h =>
          h.reason === 'achievement' &&
          typeof h.description === 'string' &&
          h.description.includes(`(${achievementId})`)
      );
      if (alreadyAwarded) {
        return;
      }

      // 포인트 내역 추가 (업적은 보너스 유형으로 기록)
      const historyId = await this.addPointHistory({
        userId,
        groupId,
        type: 'bonus',
        amount: Math.max(0, Math.floor(amount)),
        reason: 'achievement',
        description: `업적 달성: ${achievementTitle} (${achievementId})`,
        status: 'pending',
      });

      // 업적 포인트는 자동 승인 처리하여 즉시 반영되도록 함
      await this.approvePointHistory(historyId, approvedBy || userId);

      // 통계 즉시 업데이트 (이중 보장은 approvePointHistory 내부에서도 수행됨)
      await this.updatePointStats(userId, groupId);
    } catch (error) {
      logger.error(
        'points',
        '업적 포인트 지급 실패',
        { userId, groupId, achievementId, amount },
        error
      );
      throw error;
    }
  }

  // 할일 완료 시 포인트 지급
  async awardPointsForTaskCompletion(
    userId: string,
    groupId: string,
    taskId: string,
    taskTitle: string
  ): Promise<void> {
    try {
      // 그룹 설정에서 기본 포인트 규칙을 조회 (없으면 10점 기본값)
      let basePoints = 10;
      try {
        const rules = await this.getPointRules(groupId);
        const baseRule = rules.find(
          r => r.type === 'task_completion' && r.isActive
        );
        if (baseRule && typeof baseRule.points === 'number') {
          basePoints = Math.max(0, Math.floor(baseRule.points));
        }
      } catch {
        logger.warn('points', '기본 포인트 규칙 조회 실패 - 기본값 사용(10)', {
          groupId,
        });
      }

      // 기본 포인트 지급 (승인 대기 상태)
      await this.addPointHistory({
        userId,
        groupId,
        type: 'earned',
        amount: basePoints,
        reason: 'task_completion',
        taskId,
        taskTitle,
        description: `할일 완료: ${taskTitle}`,
        status: 'pending',
      });

      // 추가 보너스 포인트 규칙 확인 (승인 대기 상태)
      await this.checkAndAwardBonusPoints(userId, groupId);
    } catch (error) {
      logger.error(
        'points',
        '할일 완료 포인트 지급 실패',
        { userId, groupId, taskId },
        error
      );
      throw error;
    }
  }

  // 보너스 포인트 확인 및 지급 (안정화)
  async checkAndAwardBonusPoints(
    userId: string,
    groupId: string
  ): Promise<void> {
    try {
      const rules = await this.getPointRules(groupId);
      let stats = await this.getPointStats(userId, groupId);

      // 통계가 없으면 초기 통계 생성
      if (!stats) {
        logger.debug('points', '초기 통계 없음 - 통계 생성 후 보너스 확인', {
          userId,
          groupId,
        });
        await this.updatePointStats(userId, groupId);
        stats = await this.getPointStats(userId, groupId);

        if (!stats) {
          logger.warn(
            'points',
            '통계 생성 후에도 데이터 없음 - 보너스 확인 건너뜀',
            {
              userId,
              groupId,
            }
          );
          return;
        }
      }

      for (const rule of rules) {
        if (rule.type === 'streak_bonus' && rule.conditions?.minStreak) {
          if (stats.currentStreak >= rule.conditions.minStreak) {
            logger.debug('points', '스트릭 보너스 지급', {
              userId,
              groupId,
              currentStreak: stats.currentStreak,
              requiredStreak: rule.conditions.minStreak,
              points: rule.points,
            });
            await this.addPointHistory({
              userId,
              groupId,
              type: 'bonus',
              amount: rule.points,
              reason: 'streak_bonus',
              description: `연속 완료 보너스 (${stats.currentStreak}일)`,
              status: 'pending',
            });
          }
        }

        if (
          rule.type === 'completion_rate' &&
          rule.conditions?.minCompletionRate
        ) {
          if (stats.completionRate >= rule.conditions.minCompletionRate) {
            logger.debug('points', '완료율 보너스 지급', {
              userId,
              groupId,
              completionRate: stats.completionRate,
              requiredRate: rule.conditions.minCompletionRate,
              points: rule.points,
            });
            await this.addPointHistory({
              userId,
              groupId,
              type: 'bonus',
              amount: rule.points,
              reason: 'completion_rate',
              description: `완료율 보너스 (${stats.completionRate}%)`,
              status: 'pending',
            });
          }
        }
      }
    } catch (error) {
      logger.error(
        'points',
        '보너스 포인트 확인 실패',
        { userId, groupId },
        error
      );
      throw error;
    }
  }

  // 수동 포인트 추가/차감
  async manuallyAdjustPoints(
    userId: string,
    groupId: string,
    amount: number,
    reason: string,
    description?: string
  ): Promise<void> {
    try {
      const type = amount > 0 ? 'manual_add' : 'manual_deduct';
      const absAmount = Math.abs(amount);

      // 포인트 내역 추가
      const historyId = await this.addPointHistory({
        userId,
        groupId,
        type,
        amount: absAmount,
        reason: reason,
        description: description || reason,
        status: 'pending',
      });

      // 즉시 승인하여 포인트 반영
      await this.approvePointHistory(historyId, userId);

      // 포인트 통계 업데이트
      await this.updatePointStats(userId, groupId);
    } catch (error) {
      logger.error(
        'points',
        '수동 포인트 조정 실패',
        { userId, groupId, amount },
        error
      );
      throw error;
    }
  }

  // 포인트 내역 승인 (트랜잭션화)
  async approvePointHistory(
    historyId: string,
    approvedBy: string
  ): Promise<void> {
    try {
      logger.debug('points', '포인트 내역 승인 시작', {
        historyId,
        approvedBy,
      });

      const historyRef = doc(db, 'pointHistory', historyId);

      // 현재 내역 조회
      const historyDoc = await getDoc(historyRef);
      if (!historyDoc.exists()) {
        throw new Error('포인트 내역을 찾을 수 없습니다.');
      }

      const history = historyDoc.data() as PointHistory;

      // 이미 승인된 경우 처리하지 않음
      if (history.status === 'approved') {
        logger.debug('points', '이미 승인된 포인트 내역', { historyId });
        return;
      }

      logger.debug('points', '승인할 포인트 내역', {
        id: historyId,
        userId: history.userId,
        groupId: history.groupId,
        type: history.type,
        amount: history.amount,
      });

      // 승인 상태 업데이트
      await updateDoc(historyRef, {
        status: 'approved',
        approvedAt: Timestamp.now(),
        approvedBy: approvedBy,
      });

      logger.debug('points', '포인트 내역 승인 완료', { historyId });

      // 포인트 통계 즉시 업데이트 (트랜잭션 보장)
      await this.updatePointStats(history.userId, history.groupId);

      // 캐시 무효화
      this.invalidateHistoryCache(history.userId, history.groupId);
      this.statsCache.delete(`${history.userId}_${history.groupId}`);
      this.groupStatsCache.delete(history.groupId);

      logger.debug('points', '포인트 통계 업데이트 완료', {
        userId: history.userId,
        groupId: history.groupId,
      });
    } catch (error) {
      logger.error(
        'points',
        '포인트 내역 승인 실패',
        { historyId, approvedBy },
        error
      );
      throw error;
    }
  }

  // 포인트 내역 거부 (롤백 로직 포함)
  async rejectPointHistory(
    historyId: string,
    rejectedBy: string
  ): Promise<void> {
    try {
      logger.debug('points', '포인트 내역 거부 시작', {
        historyId,
        rejectedBy,
      });

      const historyRef = doc(db, 'pointHistory', historyId);

      // 현재 내역 조회
      const historyDoc = await getDoc(historyRef);
      if (!historyDoc.exists()) {
        throw new Error('포인트 내역을 찾을 수 없습니다.');
      }

      const history = historyDoc.data() as PointHistory;

      // 이미 거부된 경우 처리하지 않음
      if (history.status === 'rejected') {
        logger.debug('points', '이미 거부된 포인트 내역', { historyId });
        return;
      }

      // 거부 상태 업데이트
      await updateDoc(historyRef, {
        status: 'rejected',
        rejectedAt: Timestamp.now(),
        rejectedBy: rejectedBy,
      });

      logger.debug('points', '포인트 내역 거부 완료', { historyId });

      // 이미 승인된 내역을 거부하는 경우 포인트 롤백
      if (history.status === 'approved') {
        logger.debug('points', '승인된 내역 거부 - 포인트 롤백 필요', {
          historyId,
          userId: history.userId,
          groupId: history.groupId,
        });

        // 포인트 통계 재계산 (롤백 반영)
        await this.updatePointStats(history.userId, history.groupId);
      }

      // 캐시 무효화
      this.invalidateHistoryCache(history.userId, history.groupId);
      this.statsCache.delete(`${history.userId}_${history.groupId}`);
      this.groupStatsCache.delete(history.groupId);

      logger.debug('points', '포인트 거부 처리 완료', {
        userId: history.userId,
        groupId: history.groupId,
      });
    } catch (error) {
      logger.error(
        'points',
        '포인트 내역 거부 실패',
        { historyId, rejectedBy },
        error
      );
      throw error;
    }
  }

  // 승인되지 않은 포인트 내역 조회 (DB 레벨 필터링)
  async getUnapprovedPointHistory(
    userId: string,
    groupId: string,
    limitCount: number = 50
  ): Promise<PointHistory[]> {
    try {
      const cacheKey = this.buildHistoryKey(
        'pending',
        userId,
        groupId,
        limitCount
      );
      const cached = this.historyCache.get(cacheKey);
      const now = Date.now();
      if (cached && now - cached.ts < this.cacheTtlMs) return cached.data;

      if (this.inflightRequests.has(cacheKey)) {
        await this.inflightRequests.get(cacheKey);
        const after = this.historyCache.get(cacheKey);
        return after?.data || [];
      }

      // DB 레벨에서 필터링하여 성능 최적화
      const q = query(
        collection(db, 'pointHistory'),
        where('userId', '==', userId),
        where('groupId', '==', groupId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const p = getDocs(q)
        .then(querySnapshot => {
          const unapprovedHistory = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as PointHistory[];

          this.historyCache.set(cacheKey, {
            data: unapprovedHistory,
            ts: Date.now(),
          });
          return unapprovedHistory;
        })
        .finally(() => {
          this.inflightRequests.delete(cacheKey);
        });
      this.inflightRequests.set(cacheKey, p);
      return await p;
    } catch (error) {
      logger.error(
        'points',
        '미승인 포인트 내역 조회 실패',
        { userId, groupId },
        error
      );
      throw error;
    }
  }

  // 승인된 포인트 내역 조회 (DB 레벨 필터링)
  async getApprovedPointHistory(
    userId: string,
    groupId: string,
    limitCount: number = 50
  ): Promise<PointHistory[]> {
    try {
      const cacheKey = this.buildHistoryKey(
        'approved',
        userId,
        groupId,
        limitCount
      );
      const cached = this.historyCache.get(cacheKey);
      const now = Date.now();
      if (cached && now - cached.ts < this.cacheTtlMs) return cached.data;

      if (this.inflightRequests.has(cacheKey)) {
        await this.inflightRequests.get(cacheKey);
        const after = this.historyCache.get(cacheKey);
        return after?.data || [];
      }

      // DB 레벨에서 필터링하여 성능 최적화
      const q = query(
        collection(db, 'pointHistory'),
        where('userId', '==', userId),
        where('groupId', '==', groupId),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const p = getDocs(q)
        .then(querySnapshot => {
          const approvedHistory = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as PointHistory[];

          this.historyCache.set(cacheKey, {
            data: approvedHistory,
            ts: Date.now(),
          });
          return approvedHistory;
        })
        .finally(() => {
          this.inflightRequests.delete(cacheKey);
        });
      this.inflightRequests.set(cacheKey, p);
      return await p;
    } catch (error) {
      logger.error(
        'points',
        '승인된 포인트 내역 조회 실패',
        { userId, groupId },
        error
      );
      throw error;
    }
  }

  // 포인트 내역 금액 수정
  async updatePointHistoryAmount(
    historyId: string,
    newAmount: number
  ): Promise<void> {
    try {
      const historyRef = doc(db, 'pointHistory', historyId);
      await updateDoc(historyRef, {
        amount: newAmount,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      logger.error(
        'points',
        '포인트 내역 금액 수정 실패',
        { historyId },
        error
      );
      throw error;
    }
  }

  // 사용자 포인트 업데이트 (deprecated - pointStats를 단일 진실원천으로 사용)
  private async updateUserPoints(
    userId: string,
    groupId: string,
    amount: number
  ): Promise<void> {
    try {
      // pointStats를 단일 진실원천으로 사용하므로 users.points는 더 이상 업데이트하지 않음
      // 향후 users.points 필드는 제거 예정
      logger.debug(
        'points',
        'updateUserPoints deprecated - using pointStats as single source of truth',
        {
          userId,
          groupId,
          amount,
        }
      );
    } catch (error) {
      logger.error(
        'points',
        '사용자 포인트 업데이트 실패',
        { userId, groupId },
        error
      );
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성
export const pointsService = new PointsService();
