# 성능 최적화 계획서

## 📊 현재 번들 분석 결과 (2025-08-14)

### 현재 번들 크기
| 번들 | 크기 | Gzip | 비율 | 우선순위 |
|------|------|------|------|----------|
| firebase-CdzeGWFL.js | 459.98 KB | 107.41 KB | 27.8% | **높음** |
| charts-Dh4PYIM5.js | 327.59 KB | 98.59 KB | 19.8% | **높음** |
| index-WoWsFnVx.js | 173.93 KB | 42.05 KB | 10.5% | 중간 |
| vendor-DgTrhVr3.js | 141.72 KB | 45.48 KB | 8.6% | 낮음 |
| ui-BoSEFrtC.js | 112.00 KB | 34.57 KB | 6.8% | 중간 |
| TodoHome-6n-hcyJW.js | 83.30 KB | 23.96 KB | 5.0% | 중간 |
| Settings-CguynuIA.js | 44.14 KB | 10.38 KB | 2.7% | 낮음 |

**총 번들 크기: 1.65MB (압축 후: 462KB)**

## 🎯 최적화 목표

### 단기 목표 (1-2주)
- 총 번들 크기를 30% 감소 (1.65MB → 1.15MB)
- 초기 로딩 시간 40% 단축
- Firebase 번들 50% 감소
- Charts 번들 lazy loading으로 초기 로드에서 제외

### 장기 목표 (1개월)
- 총 번들 크기를 50% 감소
- Lighthouse 성능 점수 90+ 달성
- First Contentful Paint < 1.5초
- Time to Interactive < 3초

## 🛠 우선순위별 최적화 전략

### 1순위: Firebase 번들 최적화 (460KB → 230KB 목표)

#### 문제점
- Firebase SDK 전체가 번들에 포함됨
- 사용하지 않는 Firebase 서비스들도 포함

#### 해결방안
```javascript
// Before: 전체 Firebase import
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';

// After: 필요한 모듈만 tree-shaking
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
```

#### 추가 최적화
- Firebase 모듈을 동적 import로 lazy loading
- 개발/프로덕션 환경별 Firebase 설정 분리
- Firebase Function 호출을 필요 시점에만 로드

### 2순위: Charts 번들 최적화 (327KB → 0KB 초기, 필요시 로드)

#### 문제점
- Recharts 라이브러리가 매우 큼 (327KB)
- 모든 사용자가 차트를 보지 않음
- 초기 로딩에 불필요한 리소스

#### 해결방안
```javascript
// 차트 컴포넌트를 lazy loading으로 분리
const StatisticsChart = lazy(() => import('./charts/StatisticsChart'));
const ProgressChart = lazy(() => import('./charts/ProgressChart'));
const FamilyChart = lazy(() => import('./charts/FamilyChart'));

// 차트 페이지 진입 시에만 로드
const Statistics = lazy(() => import('../pages/Statistics'));
```

#### 차트 최적화 전략
- Recharts 대신 경량 차트 라이브러리 검토
- Chart.js (더 가벼움) 또는 자체 SVG 차트 구현
- 차트 데이터를 서버에서 사전 처리하여 클라이언트 부담 감소

### 3순위: 컴포넌트 Lazy Loading (173KB → 100KB 목표)

#### 페이지별 코드 분할
```javascript
// 페이지 컴포넌트들을 동적 import
const Settings = lazy(() => import('./pages/Settings'));
const FamilyManage = lazy(() => import('./pages/FamilyManage'));
const TaskDetailPage = lazy(() => import('./pages/TaskDetailPage'));
const Statistics = lazy(() => import('./pages/Statistics'));
```

#### 컴포넌트 최적화
- 큰 컴포넌트들 (Settings, FamilyManage 등) 지연 로딩
- React.memo와 useMemo를 활용한 불필요한 리렌더링 방지
- Context 분할로 불필요한 provider 구독 방지

### 4순위: UI 번들 최적화 (112KB → 80KB 목표)

#### Radix UI 최적화
```javascript
// Before: 전체 패키지 import
import * as Dialog from '@radix-ui/react-dialog';

// After: 필요한 컴포넌트만 import
import { Dialog, DialogContent, DialogTrigger } from '@radix-ui/react-dialog';
```

#### UI 컴포넌트 전략
- 사용하지 않는 Radix UI 컴포넌트 제거
- 자주 사용하지 않는 UI 컴포넌트는 lazy loading
- Tailwind CSS 최적화 (사용하지 않는 클래스 제거)

## 🔄 구현 계획

### Phase 1: Firebase & Charts 최적화 (1주차)
- [ ] Firebase SDK v9+ 모듈러 import로 마이그레이션
- [ ] Charts 컴포넌트 lazy loading 구현
- [ ] vite.config.ts 번들 분할 설정 최적화

### Phase 2: 컴포넌트 분할 (2주차)  
- [ ] 페이지 단위 lazy loading 구현
- [ ] Suspense fallback UI 개선
- [ ] Route-based code splitting 적용

### Phase 3: 최적화 검증 (3주차)
- [ ] 번들 사이즈 측정 및 비교
- [ ] Lighthouse 성능 측정
- [ ] 실제 사용자 경험 테스트

### Phase 4: 미세 조정 (4주차)
- [ ] 사용하지 않는 코드 제거 (Tree shaking)
- [ ] CSS 최적화 (PurgeCSS)
- [ ] 이미지 최적화 및 WebP 전환

## ⚡ 즉시 적용 가능한 최적화

### 1. Vite 설정 개선
```javascript
// vite.config.ts 최적화
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Firebase를 별도 청크로 분리
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          // Charts를 별도 청크로 분리 (lazy loading 시 사용)
          charts: ['recharts'],
          // React 관련을 vendor로 통합
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI 라이브러리들을 별도 청크로
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', 'lucide-react'],
        },
      },
    },
    // 압축 최적화
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 프로덕션에서 console.log 제거
        drop_debugger: true,
      },
    },
  },
});
```

### 2. Import 최적화
```javascript
// Before: 전체 라이브러리 import
import * as Icons from 'lucide-react';

// After: 필요한 아이콘만 import  
import { Plus, Edit, Trash, Settings } from 'lucide-react';
```

### 3. 컴포넌트 메모이제이션 강화
```javascript
// 이미 구현된 것들 검증 및 개선
const TaskCard = memo(TaskCardComponent, (prev, next) => {
  return prev.task.id === next.task.id && 
         prev.task.updatedAt === next.task.updatedAt;
});
```

## 📈 성능 측정 지표

### 번들 크기 KPI
- 총 번들 크기: 1.65MB → 1.15MB (30% 감소)
- Gzip 압축 크기: 462KB → 323KB (30% 감소)  
- 초기 로드 번들: 800KB → 400KB (50% 감소)

### 로딩 성능 KPI
- First Contentful Paint: 목표 < 1.5s
- Largest Contentful Paint: 목표 < 2.5s
- Time to Interactive: 목표 < 3.0s
- First Input Delay: 목표 < 100ms

### 사용자 경험 KPI
- Lighthouse Performance Score: 목표 90+
- Core Web Vitals 통과율: 목표 95%
- 페이지 전환 속도: 목표 < 200ms

## 🔧 도구 및 모니터링

### 성능 측정 도구
- Lighthouse CI 통합
- webpack-bundle-analyzer / vite-bundle-analyzer
- Chrome DevTools Performance 탭
- Web Vitals 라이브러리

### 지속적 모니터링
- GitHub Actions에 성능 회귀 테스트 추가
- 번들 크기 변화 알림 설정
- 주기적 성능 감사 (월 1회)

---

**작성일**: 2025-08-14  
**작성자**: Frontend Performance Team  
**상태**: 구현 준비 완료  
**예상 완료일**: 2025-09-14