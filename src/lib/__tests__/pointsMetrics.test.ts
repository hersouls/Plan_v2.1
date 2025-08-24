import {
  addDays,
  computeCompletionRate,
  computeStreaks,
  toDayString,
} from '../pointsMetrics';

describe('pointsMetrics', () => {
  test('computeStreaks: current and longest with no holidays', () => {
    const now = new Date('2025-08-20T10:00:00Z');
    const d = (n: number) => addDays(new Date(now), -n);
    const completed = [0, 1, 2, 4, 5, 10].map(n => d(n));
    const { currentStreak, longestStreak } = computeStreaks(completed, {
      now,
      periodDays: 30,
    });
    expect(currentStreak).toBe(3); // 20,19,18
    expect(longestStreak).toBe(2); // 16,15 (4,5 days ago)
  });

  test('computeStreaks: holidays do not break streak', () => {
    const now = new Date('2025-08-20T10:00:00Z');
    const d = (n: number) => addDays(new Date(now), -n);
    const completed = [1, 3].map(n => d(n)); // 19,17 완료, 18은 휴일로 간주
    const holidays = new Set([toDayString(d(2))]); // 18일 휴일
    const { currentStreak, longestStreak } = computeStreaks(completed, {
      now,
      periodDays: 7,
      holidays,
    });
    expect(currentStreak).toBe(2); // 19(완료)-18(휴일)-17(완료)
    expect(longestStreak).toBe(2);
  });

  test('computeCompletionRate: period filter and rounding', () => {
    const end = new Date('2025-08-31T00:00:00Z');
    const start = new Date('2025-08-01T00:00:00Z');
    const assigned = [
      new Date('2025-07-31T10:00:00Z'),
      new Date('2025-08-05T10:00:00Z'),
      new Date('2025-08-10T10:00:00Z'),
      new Date('2025-08-20T10:00:00Z'),
    ];
    const completed = [
      new Date('2025-08-05T12:00:00Z'),
      new Date('2025-08-21T12:00:00Z'),
    ];
    const rate = computeCompletionRate(assigned, completed, {
      periodStart: start,
      periodEnd: end,
    });
    // assigned in range: 3 (Aug 5,10,20). completed in range: 2
    expect(rate).toBeCloseTo(66.67, 2);
  });
});
