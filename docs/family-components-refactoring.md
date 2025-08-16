# Family 컴포넌트 리팩토링 계획

## 📊 현재 상황 분석

### 컴포넌트 구조
1. **FamilyActivityWidget** (327줄)
   - 가족 활동 타임라인 표시
   - 최근 활동 목록
   - 활동 통계

2. **FamilyStats** (213줄)
   - 가족/그룹 통계 표시
   - 완료율, 참여도 등

3. **LeaderBoard** (209줄)
   - 순위표 및 경쟁 요소
   - 포인트/배지 시스템

4. **MemberCard** (204줄)
   - 멤버 정보 카드
   - 개별 통계 표시

5. **InviteModal** (330줄)
   - 가족/그룹 초대 기능
   - 초대 링크 생성

## 🎯 개선 목표

### 1. 컴포넌트 책임 명확화
- 각 컴포넌트가 단일 책임 원칙을 따르도록 개선
- 공통 로직 추출 및 재사용

### 2. 성능 최적화
- 불필요한 리렌더링 방지
- 메모이제이션 적용
- 번들 크기 최적화

### 3. 타입 안정성 강화
- 공통 타입 정의 통합
- 엄격한 타입 체크

## 🛠 리팩토링 전략

### Phase 1: 공통 요소 추출

#### 1. Family 타입 정의 통합
```typescript
// src/types/family.ts
export interface FamilyMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'parent' | 'child' | 'guardian' | 'member';
  email?: string;
  lastActive?: Date;
  stats?: MemberStats;
}

export interface MemberStats {
  tasksCompleted: number;
  tasksAssigned: number;
  completionRate: number;
  streak: number;
  points: number;
  badges: Badge[];
}

export interface FamilyActivity {
  id: string;
  type: 'task' | 'achievement' | 'milestone';
  action: string;
  userId: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface FamilyGroup {
  id: string;
  name: string;
  members: FamilyMember[];
  createdAt: Date;
  settings: GroupSettings;
}
```

#### 2. 공통 유틸리티 함수
```typescript
// src/utils/family.ts
export const calculateFamilyStats = (members: FamilyMember[]) => {
  // 통계 계산 로직
};

export const sortMembersByPerformance = (members: FamilyMember[]) => {
  // 순위 정렬 로직
};

export const formatActivityMessage = (activity: FamilyActivity) => {
  // 활동 메시지 포맷팅
};
```

### Phase 2: 컴포넌트 리팩토링

#### 1. FamilyDashboard (통합 컨테이너)
```typescript
// 새로운 통합 대시보드 컴포넌트
interface FamilyDashboardProps {
  groupId: string;
  view: 'overview' | 'activity' | 'stats' | 'leaderboard';
  compact?: boolean;
}

export const FamilyDashboard: React.FC<FamilyDashboardProps> = ({
  groupId,
  view = 'overview',
  compact = false
}) => {
  // 통합된 가족 대시보드 로직
};
```

#### 2. ActivityFeed (리팩토링된 FamilyActivityWidget)
```typescript
interface ActivityFeedProps {
  activities: FamilyActivity[];
  members: Map<string, FamilyMember>;
  limit?: number;
  compact?: boolean;
}

export const ActivityFeed = memo(({ 
  activities, 
  members, 
  limit = 10,
  compact 
}: ActivityFeedProps) => {
  // 최적화된 활동 피드
});
```

#### 3. MemberGrid (통합된 멤버 표시)
```typescript
interface MemberGridProps {
  members: FamilyMember[];
  layout: 'grid' | 'list' | 'compact';
  showStats?: boolean;
  onMemberClick?: (member: FamilyMember) => void;
}

export const MemberGrid = memo(({ 
  members, 
  layout, 
  showStats 
}: MemberGridProps) => {
  // 유연한 멤버 표시 컴포넌트
});
```

### Phase 3: 성능 최적화

#### 1. 가상 스크롤링 적용
```typescript
// 긴 활동 목록에 가상 스크롤링 적용
import { VirtualList } from '@tanstack/react-virtual';

export const VirtualActivityFeed = () => {
  // 가상 스크롤링으로 성능 개선
};
```

#### 2. 상태 관리 최적화
```typescript
// Zustand 또는 Jotai를 활용한 상태 관리
interface FamilyStore {
  members: FamilyMember[];
  activities: FamilyActivity[];
  stats: FamilyStats;
  
  // Actions
  fetchFamilyData: () => Promise<void>;
  updateMemberStats: (memberId: string, stats: MemberStats) => void;
}
```

## 📈 예상 효과

### 정량적 개선
- **코드 중복 제거**: 약 300줄 감소 예상
- **번들 크기**: 20-25% 감소
- **렌더링 성능**: 30% 개선

### 정성적 개선
- **유지보수성**: 컴포넌트 책임 명확화
- **확장성**: 새로운 기능 추가 용이
- **일관성**: 통일된 UI/UX 패턴

## 🗓 구현 일정

### Week 1: 공통 요소 추출
- [ ] Family 타입 정의 통합
- [ ] 공통 유틸리티 함수 작성
- [ ] 스토어 구조 설계

### Week 2: 컴포넌트 리팩토링
- [ ] FamilyDashboard 구현
- [ ] ActivityFeed 리팩토링
- [ ] MemberGrid 구현
- [ ] LeaderBoard 개선

### Week 3: 최적화 및 테스트
- [ ] 성능 최적화 적용
- [ ] 단위 테스트 작성
- [ ] 통합 테스트
- [ ] 문서화

## 🔄 마이그레이션 가이드

### Before
```typescript
import { FamilyActivityWidget } from './FamilyActivityWidget';
import { FamilyStats } from './FamilyStats';
import { LeaderBoard } from './LeaderBoard';

// 각각 독립적으로 사용
<FamilyActivityWidget {...props} />
<FamilyStats {...props} />
<LeaderBoard {...props} />
```

### After
```typescript
import { FamilyDashboard } from './family';

// 통합된 대시보드 사용
<FamilyDashboard 
  groupId={groupId}
  view="overview"
/>

// 또는 개별 컴포넌트 사용
import { ActivityFeed, MemberGrid } from './family';

<ActivityFeed activities={activities} />
<MemberGrid members={members} />
```

## ✅ 완료 기준

1. 모든 Family 컴포넌트가 새로운 구조로 마이그레이션
2. 테스트 커버리지 90% 이상
3. 번들 크기 20% 이상 감소
4. Lighthouse 성능 점수 개선
5. 타입 안정성 100%

---

**작성일**: 2025-08-14  
**작성자**: Claude Code Assistant  
**상태**: 계획 수립 완료