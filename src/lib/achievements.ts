import { toDate } from '@/utils/dateHelpers';
import { Task } from '@/types/task';
import { PointStats } from '@/lib/points';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  points: number;
  check: (ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  tasks: Task[];
  pointStats?: PointStats | null;
  now?: Date;
}

export interface EvaluatedAchievement {
  id: string;
  title: string;
  description: string;
  points: number;
  unlocked: boolean;
}

export function getAchievementCatalog(): AchievementDefinition[] {
  const catalog: AchievementDefinition[] = [];

  const add = (
    id: string,
    title: string,
    description: string,
    points: number,
    check: (ctx: AchievementContext) => boolean
  ) => {
    catalog.push({ id, title, description, points, check });
  };

  // Helpers
  const getCompleted = (tasks: Task[]) =>
    tasks.filter(t => t.status === 'completed');
  const getOnTime = (tasks: Task[]) =>
    getCompleted(tasks).filter(t => {
      if (!t.completedAt) return false;
      if (!t.dueDate) return true;
      try {
        return toDate(t.completedAt) <= toDate(t.dueDate);
      } catch {
        return false;
      }
    });
  const getMonthCompleted = (tasks: Task[], now: Date) =>
    getCompleted(tasks).filter(t => {
      if (!t.completedAt) return false;
      const d = toDate(t.completedAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  const countByCategory = (tasks: Task[]) =>
    getCompleted(tasks).reduce((acc, t) => {
      const k = t.category || '기타';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  // 1~6: 누적 완료 수
  add('COMPLETE_1', '첫 걸음', '할일 1개 완료', 10, ({ tasks }) => getCompleted(tasks).length >= 1);
  add('COMPLETE_5', '워밍업', '할일 5개 완료', 20, ({ tasks }) => getCompleted(tasks).length >= 5);
  add('COMPLETE_10', '출발선 통과', '할일 10개 완료', 30, ({ tasks }) => getCompleted(tasks).length >= 10);
  add('COMPLETE_25', '꾸준함의 시작', '할일 25개 완료', 40, ({ tasks }) => getCompleted(tasks).length >= 25);
  add('COMPLETE_50', '반백 달성', '할일 50개 완료', 60, ({ tasks }) => getCompleted(tasks).length >= 50);
  add('COMPLETE_100', '세자리의 벽', '할일 100개 완료', 100, ({ tasks }) => getCompleted(tasks).length >= 100);

  // 7~10: 정시 완료
  add('ONTIME_10', '시간 약속', '제시간에 10개 완료', 40, ({ tasks }) => getOnTime(tasks).length >= 10);
  add('ONTIME_30', '시간의 달인', '제시간에 30개 완료', 80, ({ tasks }) => getOnTime(tasks).length >= 30);
  add('ONTIME_50', '타임키퍼', '제시간에 50개 완료', 120, ({ tasks }) => getOnTime(tasks).length >= 50);
  add('NO_OVERDUE_20', '지연 제로', '지연 없이 20개 완료', 60, ({ tasks }) => getOnTime(tasks).length >= 20);

  // 11~14: 월간 성과
  add('MONTH_20', '월간 루키', '이번 달 20개 완료', 40, ({ tasks, now = new Date() }) => getMonthCompleted(tasks, now).length >= 20);
  add('MONTH_50', '월간 에이스', '이번 달 50개 완료', 80, ({ tasks, now = new Date() }) => getMonthCompleted(tasks, now).length >= 50);
  add('MONTH_100', '월간 레전드', '이번 달 100개 완료', 150, ({ tasks, now = new Date() }) => getMonthCompleted(tasks, now).length >= 100);
  add('MONTH_150', '월간 괴물', '이번 달 150개 완료', 200, ({ tasks, now = new Date() }) => getMonthCompleted(tasks, now).length >= 150);

  // 15~18: 스트릭/완료율 (pointStats 활용)
  add('STREAK_3', '3일 연속', '3일 연속 완료 달성', 30, ({ pointStats }) => (pointStats?.currentStreak || 0) >= 3);
  add('STREAK_7', '7일 연속', '7일 연속 완료 달성', 60, ({ pointStats }) => (pointStats?.currentStreak || 0) >= 7);
  add('STREAK_14', '2주 연속', '14일 연속 완료 달성', 120, ({ pointStats }) => (pointStats?.currentStreak || 0) >= 14);
  add('RATE_80', '완료율 80%', '완료율 80% 달성', 80, ({ pointStats }) => (pointStats?.completionRate || 0) >= 80);

  // 19~24: 카테고리 마스터
  add('CAT_HOME_20', '집안일 마스터', '집안일 20개 완료', 60, ({ tasks }) => (countByCategory(tasks)['집안일'] || 0) >= 20);
  add('CAT_STUDY_20', '공부 마스터', '공부 20개 완료', 60, ({ tasks }) => (countByCategory(tasks)['공부'] || 0) >= 20);
  add('CAT_HEALTH_20', '건강 마스터', '건강 20개 완료', 60, ({ tasks }) => (countByCategory(tasks)['건강'] || 0) >= 20);
  add('CAT_WORK_20', '업무 마스터', '업무 20개 완료', 60, ({ tasks }) => (countByCategory(tasks)['업무'] || 0) >= 20);
  add('CAT_ETC_20', '다재다능', '기타/여러 분야 20개 완료', 60, ({ tasks }) => (countByCategory(tasks)['기타'] || 0) >= 20);
  add('CAT_BALANCED_5', '균형 잡힌 일상', '서로 다른 카테고리 5개 이상 완료', 80, ({ tasks }) => Object.keys(countByCategory(tasks)).length >= 5);

  // 25~30: 기타 습관/볼륨
  add('DAY_10', '10일 활동', '10일 이상 활동 기록', 40, ({ tasks }) => new Set(getCompleted(tasks).map(t => toDate(t.completedAt as any).toDateString())).size >= 10);
  add('DAY_30', '한 달 활동', '30일 이상 활동 기록', 100, ({ tasks }) => new Set(getCompleted(tasks).map(t => toDate(t.completedAt as any).toDateString())).size >= 30);
  add('WEEKEND_15', '주말 전사', '주말 완료 15개 달성', 60, ({ tasks }) => getCompleted(tasks).filter(t => { if (!t.completedAt) return false; const d = toDate(t.completedAt as any).getDay(); return d === 0 || d === 6; }).length >= 15);
  add('MORNING_20', '아침형 인간', '오전 9시 이전 20개 완료', 80, ({ tasks }) => getCompleted(tasks).filter(t => { if (!t.completedAt) return false; const h = toDate(t.completedAt as any).getHours(); return h < 9; }).length >= 20);
  add('EVENING_20', '야행성', '오후 9시 이후 20개 완료', 80, ({ tasks }) => getCompleted(tasks).filter(t => { if (!t.completedAt) return false; const h = toDate(t.completedAt as any).getHours(); return h >= 21; }).length >= 20);
  add('BULK_DAY_15', '집중의 날', '하루 15개 완료', 120, ({ tasks }) => {
    const map = new Map<string, number>();
    for (const t of getCompleted(tasks)) {
      if (!t.completedAt) continue;
      const key = toDate(t.completedAt as any).toISOString().slice(0, 10);
      map.set(key, (map.get(key) || 0) + 1);
    }
    for (const v of map.values()) if (v >= 15) return true;
    return false;
  });

  return catalog;
}

export function evaluateAchievements(
  ctx: AchievementContext
): EvaluatedAchievement[] {
  const catalog = getAchievementCatalog();
  return catalog.map(a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    points: a.points,
    unlocked: !!a.check(ctx),
  }));
}


