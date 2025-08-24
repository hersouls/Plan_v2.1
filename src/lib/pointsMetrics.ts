// Avoid importing firebase types in test/runtime to reduce memory footprint
export type Timestamp = { toDate: () => Date };

export interface StreakOptions {
  now?: Date;
  periodDays?: number; // 분석 기간 (최대 일수)
  holidays?: Set<string>; // 'YYYY-MM-DD' 형식의 휴일 집합 (스트릭 단절로 간주하지 않음)
}

export interface CompletionRateOptions {
  periodStart?: Date;
  periodEnd?: Date;
}

export type DateLike = Date | string | Timestamp | number;

export function toDate(value: DateLike): Date {
  if (value instanceof Date) return value;
  const anyVal: any = value as any;
  if (anyVal?.toDate) return anyVal.toDate();
  if (typeof value === 'string' || typeof value === 'number')
    return new Date(value);
  return new Date();
}

export function toDayString(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(base: Date, delta: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  return d;
}

// 스트릭 계산: 완료된 날짜 배열과 옵션(휴일, 기간) 기반
export function computeStreaks(
  completedAtList: DateLike[],
  options?: StreakOptions
): { currentStreak: number; longestStreak: number } {
  const now = options?.now ? new Date(options.now) : new Date();
  const periodDays =
    typeof options?.periodDays === 'number' ? options!.periodDays! : 90;
  const holidays = options?.holidays || new Set<string>();

  // 완료 날짜 -> 일 문자열 집합
  const daySet = new Set<string>();
  for (const raw of completedAtList) {
    const d = toDate(raw);
    const key = toDayString(d);
    daySet.add(key);
  }

  // 기준일(anchor): 오늘이 미완료이면서 휴일이 아니면 어제로 이동
  const todayKey = toDayString(now);
  let anchor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!daySet.has(todayKey) && !holidays.has(todayKey)) {
    anchor = addDays(anchor, -1);
  }

  // currentStreak 계산: anchor에서 과거로 진행, 휴일은 단절로 보지 않음
  let currentStreak = 0;
  for (let i = 0; i < periodDays; ) {
    const dayKey = toDayString(addDays(anchor, -i));
    if (holidays.has(dayKey)) {
      i += 1; // 휴일은 카운트 증가 없이 넘어감
      continue;
    }
    if (daySet.has(dayKey)) {
      currentStreak += 1;
      i += 1;
    } else {
      break;
    }
  }

  // longestStreak 계산: 오늘을 제외한 상태로 최장 연속 완료를 계산
  const daySetForLongest = new Set(daySet);
  daySetForLongest.delete(todayKey);

  const start = addDays(now, -Math.max(periodDays - 1, 0));
  let longestStreak = 0;
  let run = 0;
  for (
    let cursor = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate()
    );
    cursor <= now;
    cursor = addDays(cursor, 1)
  ) {
    const key = toDayString(cursor);
    if (holidays.has(key)) {
      // 휴일은 연속성 판단에서 제외 (연속 카운트를 유지하되 증가시키지 않음)
      continue;
    }
    if (daySetForLongest.has(key)) {
      run += 1;
      if (run > longestStreak) longestStreak = run;
    } else {
      run = 0;
    }
  }

  return { currentStreak, longestStreak };
}

// 완료율 계산: 기간 내 완료/할당 비율
export function computeCompletionRate(
  assignedCreatedAtList: DateLike[],
  completedAtList: DateLike[],
  options?: CompletionRateOptions
): number {
  const end = options?.periodEnd ? new Date(options.periodEnd) : new Date();
  const start = options?.periodStart
    ? new Date(options.periodStart)
    : addDays(end, -30);

  const inRange = (d: Date) => d >= start && d <= end;

  const assigned = assignedCreatedAtList
    .map(toDate)
    .filter(d => !isNaN(d.getTime()))
    .filter(inRange).length;

  if (assigned === 0) return 0;

  const completed = completedAtList
    .map(toDate)
    .filter(d => !isNaN(d.getTime()))
    .filter(inRange).length;

  const rate = (completed / assigned) * 100;
  // 소수점 2자리 고정 (UI 일관성)
  return Math.round(rate * 100) / 100;
}
