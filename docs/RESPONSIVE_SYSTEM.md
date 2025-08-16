# 📱 Moonwave Plan 반응형 전역 시스템

## 🎯 **개요**

Moonwave Plan의 반응형 전역 시스템은 모든 화면 크기에서 일관되고 최적화된 사용자 경험을 제공하기 위해 구축되었습니다.

## 📋 **브레이크포인트**

```typescript
const BREAKPOINTS = {
  xs: 320,   // 최소 모바일 (iPhone SE 1st gen)
  sm: 360,   // 갤럭시 시리즈
  md: 375,   // 일반 모바일 (iPhone SE 2nd gen, iPhone 12/13/14)
  lg: 768,   // 태블릿 (iPad)
  xl: 1024,  // 데스크톱 (iPad Pro)
  '2xl': 1440, // 대형 화면
  '3xl': 1920, // 초대형 화면
}
```

## 🛠️ **핵심 컴포넌트**

### **ResponsiveContainer**
```tsx
import { ResponsiveContainer } from '@/components/ui/responsive';

<ResponsiveContainer
  padding="container"
  spacing="section"
  maxWidth="xl"
  center={true}
>
  <h1>반응형 컨테이너</h1>
</ResponsiveContainer>
```

### **ResponsiveText**
```tsx
import { ResponsiveText } from '@/components/ui/responsive';

<ResponsiveText
  type="title"
  weight="bold"
  color="text-white"
  align="center"
  lineClamp={2}
>
  반응형 텍스트
</ResponsiveText>
```

### **ResponsiveButton**
```tsx
import { ResponsiveButton } from '@/components/ui/responsive';

<ResponsiveButton
  variant="primary"
  padding="button"
  touchTarget="button"
  layout="auto"
  icon={<User className="w-4 h-4" />}
>
  반응형 버튼
</ResponsiveButton>
```

### **ResponsiveGrid**
```tsx
import { ResponsiveGrid } from '@/components/ui/responsive';

<ResponsiveGrid type="stats" gap="md">
  <div>통계 카드 1</div>
  <div>통계 카드 2</div>
  <div>통계 카드 3</div>
  <div>통계 카드 4</div>
</ResponsiveGrid>
```

## 🎨 **프리셋 컴포넌트**

### **ResponsiveHero**
```tsx
import { ResponsiveHero } from '@/components/ui/responsive';

<ResponsiveHero
  title="Moonwave Plan"
  version="v1.0"
  greeting="안녕하세요, 사용자님! 오늘도 화이팅! 💪"
  date="2025년 1월 13일 월요일"
  buttons={[
    {
      label: '개인',
      icon: <User className="w-4 h-4" />,
      onClick: () => setTaskVisibility('personal'),
      isActive: taskVisibility === 'personal'
    },
    {
      label: '전체',
      icon: <List className="w-4 h-4" />,
      onClick: () => setTaskVisibility('all'),
      isActive: taskVisibility === 'all'
    }
  ]}
  onLogout={handleLogout}
/>
```

### **ResponsiveStats**
```tsx
import { ResponsiveStats } from '@/components/ui/responsive';

<ResponsiveStats
  stats={[
    {
      label: '전체 할일',
      value: stats.total,
      color: 'text-blue-600'
    },
    {
      label: '완료',
      value: stats.completed,
      color: 'text-green-600',
      borderColor: 'border-green-500'
    },
    {
      label: '진행중',
      value: stats.inProgress,
      color: 'text-blue-600',
      borderColor: 'border-blue-500'
    },
    {
      label: '지연',
      value: stats.overdue,
      color: 'text-red-600',
      borderColor: 'border-red-500'
    }
  ]}
  showProgress={true}
  progressValue={stats.completionRate}
/>
```

### **ResponsiveFilterButtons**
```tsx
import { ResponsiveFilterButtons } from '@/components/ui/responsive';

<ResponsiveFilterButtons
  options={[
    { key: 'today', label: '오늘', icon: <Calendar className="w-4 h-4" /> },
    { key: 'week', label: '이번주', icon: <CalendarRange className="w-4 h-4" /> },
    { key: 'all', label: '전체', icon: <List className="w-4 h-4" /> }
  ]}
  value={viewFilter}
  onChange={setViewFilter}
  layout="auto"
  size="md"
/>
```

## 🔧 **유틸리티 함수**

### **반응형 클래스 생성**
```tsx
import { 
  responsiveText, 
  responsivePadding, 
  responsiveGrid,
  responsiveTouchTarget 
} from '@/lib/responsive';

// 텍스트 크기
const titleClasses = responsiveText('title');

// 패딩
const containerClasses = responsivePadding('container');

// 그리드
const gridClasses = responsiveGrid('stats');

// 터치 타겟
const buttonClasses = responsiveTouchTarget('button');
```

### **조건부 클래스**
```tsx
import { responsiveConditional } from '@/lib/responsive';

const layoutClasses = responsiveConditional(
  'flex-col',    // 모바일
  'flex-row',    // 태블릿
  'flex-row'     // 데스크톱
);
```

## 📱 **반응형 훅**

### **useResponsive**
```tsx
import { useResponsive } from '@/hooks/useResponsive';

function MyComponent() {
  const { breakpoint, isMobile, isTablet, isDesktop, width, height } = useResponsive();
  
  return (
    <div>
      <p>현재 브레이크포인트: {breakpoint}</p>
      <p>모바일 여부: {isMobile ? '예' : '아니오'}</p>
      <p>화면 크기: {width} x {height}</p>
    </div>
  );
}
```

### **특정 브레이크포인트 확인**
```tsx
import { useBreakpoint, useMobile, useTablet, useDesktop } from '@/hooks/useResponsive';

function MyComponent() {
  const isLargeScreen = useBreakpoint('lg');
  const isMobileDevice = useMobile();
  const isTabletDevice = useTablet();
  const isDesktopDevice = useDesktop();
  
  return (
    <div>
      {isMobileDevice && <MobileLayout />}
      {isTabletDevice && <TabletLayout />}
      {isDesktopDevice && <DesktopLayout />}
    </div>
  );
}
```

## 🎯 **사용 가이드라인**

### **1. 모바일 우선 설계**
- 모든 컴포넌트는 모바일에서 시작하여 점진적으로 향상
- 터치 타겟은 최소 44px × 44px 보장

### **2. 일관된 간격**
- `ResponsiveSpacing` 유틸리티 사용
- 화면 크기별 적절한 여백 적용

### **3. 텍스트 가독성**
- `ResponsiveText` 컴포넌트 사용
- 화면 크기별 적절한 폰트 크기 적용

### **4. 터치 친화적**
- `ResponsiveButton` 컴포넌트 사용
- 충분한 터치 영역 보장

### **5. 성능 최적화**
- 불필요한 리렌더링 방지
- 적절한 메모이제이션 사용

## 🔄 **마이그레이션 가이드**

### **기존 코드를 새로운 시스템으로 변경**

#### **Before (기존)**
```tsx
<div className="px-4 py-6 lg:px-8 lg:py-10">
  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">
    제목
  </h1>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {/* 카드들 */}
  </div>
</div>
```

#### **After (새로운 시스템)**
```tsx
<ResponsiveContainer padding="container" spacing="section">
  <ResponsiveText type="title" weight="bold">
    제목
  </ResponsiveText>
  <ResponsiveGrid type="stats" gap="md">
    {/* 카드들 */}
  </ResponsiveGrid>
</ResponsiveContainer>
```

## 📊 **성능 최적화**

### **1. 번들 크기 최적화**
- 필요한 컴포넌트만 import
- Tree shaking 활용

### **2. 런타임 성능**
- 불필요한 계산 방지
- 메모이제이션 적절히 사용

### **3. 접근성**
- 스크린 리더 지원
- 키보드 네비게이션 지원

## 🧪 **테스트**

### **브레이크포인트별 테스트**
```tsx
import { render, screen } from '@testing-library/react';
import { useResponsive } from '@/hooks/useResponsive';

// 모킹 예시
jest.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => ({
    breakpoint: 'md',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: 1024,
    height: 768,
  }),
}));
```

## 📚 **참고 자료**

- [Tailwind CSS 반응형 디자인](https://tailwindcss.com/docs/responsive-design)
- [모바일 터치 타겟 가이드라인](https://material.io/design/usability/accessibility.html#layout-typography)
- [웹 접근성 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)

---

**이 문서는 Moonwave Plan 반응형 시스템과 함께 지속적으로 업데이트됩니다.**
