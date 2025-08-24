// Timestamp 모킹 정의가 먼저 필요하므로, pointsService import는 맨 아래에서 수행

// In-memory stores to simulate Firestore
const store = {
  users: new Map<string, any>(),
  pointHistory: new Map<string, any>(),
  pointRules: new Map<string, any>(),
  pointStats: new Map<string, any>(),
};

let idSeq = 0;
const genId = () => `id_${++idSeq}`;

// Minimal Timestamp mock compatible with toDate() usage
class MockTimestamp {
  private d: Date;
  constructor(d: Date) {
    this.d = d;
  }
  static now() {
    return new MockTimestamp(new Date());
  }
  static fromDate(d: Date) {
    return new MockTimestamp(new Date(d));
  }
  toDate() {
    return new Date(this.d);
  }
}

jest.mock('firebase/firestore', () => {
  return {
    Timestamp: MockTimestamp,
    // Collection/query helpers are no-ops for our in-memory model
    collection: (_db: any, name: string) => ({ name }),
    doc: (_db: any, name: string, id: string) => ({ name, id }),
    addDoc: async (colRef: any, data: any) => {
      const id = genId();
      if (colRef.name === 'pointHistory') {
        store.pointHistory.set(id, { ...data, id });
      } else if (colRef.name === 'pointRules') {
        store.pointRules.set(id, { ...data, id });
      }
      return { id } as any;
    },
    getDoc: async (docRef: any) => {
      const { name, id } = docRef;
      let data: any | undefined;
      if (name === 'users') data = store.users.get(id);
      if (name === 'pointHistory') data = store.pointHistory.get(id);
      if (name === 'pointStats') data = store.pointStats.get(id);
      return {
        exists: () => !!data,
        data: () => data,
        id,
      } as any;
    },
    setDoc: async (docRef: any, data: any) => {
      const { name, id } = docRef;
      if (name === 'users') store.users.set(id, { ...data, id });
      if (name === 'pointStats') store.pointStats.set(id, { ...data, id });
      return;
    },
    updateDoc: async (docRef: any, data: any) => {
      const { name, id } = docRef;
      if (name === 'users') {
        const prev = store.users.get(id) || {};
        store.users.set(id, { ...prev, ...data, id });
      }
      if (name === 'pointHistory') {
        const prev = store.pointHistory.get(id) || {};
        store.pointHistory.set(id, { ...prev, ...data, id });
      }
      if (name === 'pointRules') {
        const prev = store.pointRules.get(id) || {};
        store.pointRules.set(id, { ...prev, ...data, id });
      }
      if (name === 'pointStats') {
        const prev = store.pointStats.get(id) || {};
        store.pointStats.set(id, { ...prev, ...data, id });
      }
      return;
    },
    getDocs: async (q: any) => {
      // The query builder composes a plain object we ignore here.
      // We will emulate collections based on q._colName if set, else infer from internal key.
      const colName = q?.__colName || q?.name || (q?.from && q.from[0]) || '';
      let list: any[] = [];
      if (colName === 'pointHistory')
        list = Array.from(store.pointHistory.values());
      if (colName === 'pointRules')
        list = Array.from(store.pointRules.values());
      if (colName === 'pointStats')
        list = Array.from(store.pointStats.values());
      // Emulate where filters when present
      if (Array.isArray(q?.__wheres)) {
        for (const w of q.__wheres) {
          const [field, , value] = w;
          list = list.filter((it: any) => it?.[field] === value);
        }
      }
      // Emulate orderBy/limit lightly
      if (q?.__orderBy) {
        const [field, dir] = q.__orderBy;
        list = [...list].sort((a, b) => {
          const av = a?.[field];
          const bv = b?.[field];
          if (av === bv) return 0;
          return (av > bv ? 1 : -1) * (dir === 'desc' ? -1 : 1);
        });
      }
      if (typeof q?.__limit === 'number') {
        list = list.slice(0, q.__limit);
      }
      return {
        docs: list.map((d: any) => ({ id: d.id, data: () => d })),
      } as any;
    },
    query: (colRef: any, ...clauses: any[]) => {
      const q: any = { __colName: colRef.name };
      q.__wheres = [];
      for (const c of clauses) {
        if (c?.__where) q.__wheres.push(c.__where);
        if (c?.__orderBy) q.__orderBy = c.__orderBy;
        if (typeof c?.__limit === 'number') q.__limit = c.__limit;
      }
      return q;
    },
    where: (field: string, op: any, value: any) => ({
      __where: [field, op, value],
    }),
    orderBy: (field: string, dir: 'asc' | 'desc' = 'asc') => ({
      __orderBy: [field, dir],
    }),
    limit: (n: number) => ({ __limit: n }),
    writeBatch: () => ({ update: () => {}, commit: async () => {} }),
  };
});

// Mock app firebase db import used by pointsService
jest.mock('../firebase', () => ({ db: {} }));

// 이제 pointsService를 가져온다 (모킹 이후)

const { pointsService } = require('../points');

describe('pointsService', () => {
  const userId = 'user_1';
  const groupId = 'group_1';

  beforeEach(() => {
    store.users.clear();
    store.pointHistory.clear();
    store.pointRules.clear();
    store.pointStats.clear();
    idSeq = 0;
    // Seed user with initial points 100
    store.users.set(userId, { id: userId, points: 100 });
  });

  test('getApprovedPointHistory returns only approved items', async () => {
    // Seed histories
    const approvedId = genId();
    store.pointHistory.set(approvedId, {
      id: approvedId,
      userId,
      groupId,
      type: 'earned',
      amount: 10,
      description: '완료',
      isApproved: true,
      createdAt: MockTimestamp.now(),
    });
    const unapprovedId = genId();
    store.pointHistory.set(unapprovedId, {
      id: unapprovedId,
      userId,
      groupId,
      type: 'earned',
      amount: 5,
      description: '대기',
      isApproved: false,
      createdAt: MockTimestamp.now(),
    });

    const result = await pointsService.getApprovedPointHistory(
      userId,
      groupId,
      50
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(approvedId);
  });

  test('getUnapprovedPointHistory returns items with isApproved false or undefined', async () => {
    const a = genId();
    store.pointHistory.set(a, {
      id: a,
      userId,
      groupId,
      type: 'earned',
      amount: 10,
      isApproved: false,
      createdAt: MockTimestamp.now(),
    });
    const b = genId();
    store.pointHistory.set(b, {
      id: b,
      userId,
      groupId,
      type: 'bonus',
      amount: 3,
      // isApproved undefined
      createdAt: MockTimestamp.now(),
    });
    const c = genId();
    store.pointHistory.set(c, {
      id: c,
      userId,
      groupId,
      type: 'deducted',
      amount: 2,
      isApproved: true,
      createdAt: MockTimestamp.now(),
    });

    const result = await pointsService.getUnapprovedPointHistory(
      userId,
      groupId,
      50
    );
    expect(result.map(r => r.id).sort()).toEqual([a, b].sort());
  });

  test('approvePointHistory marks approved and updates user points with correct sign for earned/bonus', async () => {
    // Seed a pending earned history
    const hid = genId();
    store.pointHistory.set(hid, {
      id: hid,
      userId,
      groupId,
      type: 'earned',
      amount: 15,
      isApproved: false,
      createdAt: MockTimestamp.now(),
    });

    await pointsService.approvePointHistory(hid, 'approver_1');

    const approved = store.pointHistory.get(hid);
    expect(approved.isApproved).toBe(true);
    expect(approved.approvedBy).toBe('approver_1');

    const user = store.users.get(userId);
    expect(user.points).toBe(115); // 100 + 15
  });

  test('approvePointHistory subtracts points for deducted/penalty/manual_deduct', async () => {
    const hid = genId();
    store.pointHistory.set(hid, {
      id: hid,
      userId,
      groupId,
      type: 'deducted',
      amount: 20,
      isApproved: false,
      createdAt: MockTimestamp.now(),
    });

    await pointsService.approvePointHistory(hid, 'approver_2');

    const user = store.users.get(userId);
    expect(user.points).toBe(80); // 100 - 20
  });

  test('rejectPointHistory sets isApproved to false without changing user points', async () => {
    const hid = genId();
    store.pointHistory.set(hid, {
      id: hid,
      userId,
      groupId,
      type: 'earned',
      amount: 5,
      isApproved: false,
      createdAt: MockTimestamp.now(),
    });
    await pointsService.rejectPointHistory(hid, 'approver_3');
    const history = store.pointHistory.get(hid);
    expect(history.isApproved).toBe(false);
    expect(history.approvedBy).toBe('approver_3');
    const user = store.users.get(userId);
    expect(user.points).toBe(100);
  });

  test('updatePointHistoryAmount updates amount field', async () => {
    const hid = genId();
    store.pointHistory.set(hid, {
      id: hid,
      userId,
      groupId,
      type: 'bonus',
      amount: 7,
      isApproved: false,
      createdAt: MockTimestamp.now(),
    });
    await pointsService.updatePointHistoryAmount(hid, 11);
    expect(store.pointHistory.get(hid).amount).toBe(11);
  });

  test('addPointHistory adds pending history and getPointHistory retrieves ordered list', async () => {
    // Add two histories
    const id1 = await pointsService.addPointHistory({
      userId,
      groupId,
      type: 'earned',
      amount: 1,
      reason: 'r1',
      description: 'd1',
    } as any);
    const id2 = await pointsService.addPointHistory({
      userId,
      groupId,
      type: 'bonus',
      amount: 2,
      reason: 'r2',
      description: 'd2',
    } as any);

    expect(store.pointHistory.get(id1).isApproved).toBe(false);
    expect(store.pointHistory.get(id2).isApproved).toBe(false);

    const list = await pointsService.getPointHistory(userId, groupId, 10);
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  test('create/get/update point rules flow', async () => {
    const ruleId = await pointsService.createPointRule({
      groupId,
      name: 'streak 3',
      type: 'streak_bonus',
      points: 5,
      conditions: { minStreak: 3 },
      description: 'desc',
      isActive: true,
    } as any);
    expect(ruleId).toBeTruthy();

    let rules = await pointsService.getPointRules(groupId);
    expect(rules.length).toBe(1);
    expect(rules[0].id).toBe(ruleId);

    await pointsService.updatePointRule(ruleId, { points: 7, isActive: true });
    rules = await pointsService.getPointRules(groupId);
    expect(rules[0].points).toBe(7);
  });

  test('getPointStats null when missing, then cached when present', async () => {
    const res1 = await pointsService.getPointStats(userId, groupId);
    expect(res1).toBeNull();

    // Seed stats doc
    const key = `${userId}_${groupId}`;
    store.pointStats.set(key, {
      userId,
      groupId,
      totalPoints: 100,
      earnedPoints: 100,
      deductedPoints: 0,
      bonusPoints: 0,
      currentStreak: 1,
      longestStreak: 1,
      completionRate: 100,
      rank: 1,
      totalMembers: 1,
      lastUpdated: MockTimestamp.now(),
      id: key,
    });

    const res2 = await pointsService.getPointStats(userId, groupId);
    expect(res2?.totalPoints).toBe(100);

    // Second call should hit cache and return same
    const res3 = await pointsService.getPointStats(userId, groupId);
    expect(res3?.totalPoints).toBe(100);
  });

  test('getGroupPointStats computes rank and totalMembers and updates docs', async () => {
    // Seed two stats
    const key1 = `${userId}_${groupId}`;
    const key2 = `user_2_${groupId}`;
    store.pointStats.set(key1, {
      userId,
      groupId,
      totalPoints: 50,
      earnedPoints: 50,
      deductedPoints: 0,
      bonusPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
      rank: 0,
      totalMembers: 0,
      lastUpdated: MockTimestamp.now(),
      id: key1,
    });
    store.pointStats.set(key2, {
      userId: 'user_2',
      groupId,
      totalPoints: 80,
      earnedPoints: 80,
      deductedPoints: 0,
      bonusPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
      rank: 0,
      totalMembers: 0,
      lastUpdated: MockTimestamp.now(),
      id: key2,
    });

    const list = await pointsService.getGroupPointStats(groupId);
    expect(list.map(s => s.userId)).toEqual(['user_2', userId]);
    expect(list[0].rank).toBe(1);
    expect(list[0].totalMembers).toBe(2);
  });

  test('checkAndAwardBonusPoints adds bonus when conditions satisfied', async () => {
    // ensure fresh caches for this test
    try {
      (pointsService as any).statsCache?.clear?.();
      (pointsService as any).groupStatsCache?.clear?.();
    } catch {
      /* noop */
    }
    // Seed stats doc with high streak and completionRate
    const key = `${userId}_${groupId}`;
    store.pointStats.set(key, {
      userId,
      groupId,
      totalPoints: 0,
      earnedPoints: 0,
      deductedPoints: 0,
      bonusPoints: 0,
      currentStreak: 5,
      longestStreak: 5,
      completionRate: 90,
      rank: 1,
      totalMembers: 1,
      lastUpdated: MockTimestamp.now(),
      id: key,
    });

    // Seed two active rules
    await pointsService.createPointRule({
      groupId,
      name: 'streak >= 3',
      type: 'streak_bonus',
      points: 4,
      conditions: { minStreak: 3 },
      description: '',
      isActive: true,
    } as any);
    await pointsService.createPointRule({
      groupId,
      name: 'rate >= 80',
      type: 'completion_rate',
      points: 6,
      conditions: { minCompletionRate: 80 },
      description: '',
      isActive: true,
    } as any);

    await pointsService.checkAndAwardBonusPoints(userId, groupId);
    // Should have at least two new history entries
    const all = Array.from(store.pointHistory.values());
    const bonusCount = all.filter(
      h => h.type === 'bonus' && h.userId === userId
    ).length;
    expect(bonusCount).toBeGreaterThanOrEqual(2);
  });

  test('manuallyAdjustPoints approves immediately and updates stats', async () => {
    // Seed stats so that updatePointStats can overwrite
    const key = `${userId}_${groupId}`;
    store.pointStats.set(key, {
      userId,
      groupId,
      totalPoints: 0,
      earnedPoints: 0,
      deductedPoints: 0,
      bonusPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
      rank: 1,
      totalMembers: 1,
      lastUpdated: MockTimestamp.now(),
      id: key,
    });

    await pointsService.manuallyAdjustPoints(userId, groupId, 12, 'manual add');

    const user = store.users.get(userId);
    expect(user.points).toBe(112);
  });
});
