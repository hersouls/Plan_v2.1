# 문제 해결 가이드

## 🚨 주요 문제 및 해결 방법

### 1. 3005 포트 점유 문제

#### 증상

- `Port 3005 is already in use` 오류
- Vite 개발 서버가 시작되지 않음

#### 해결 방법

**자동 해결 (권장)**

```bash
npm run dev:clean
```

**수동 해결**

```bash
# Windows
netstat -ano | findstr :3005
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3005
kill -9 <PID>
```

### 2. Pretendard 폰트 400 오류

#### 증상

- Google Fonts에서 Pretendard 폰트 로딩 실패
- 콘솔에 400 오류 메시지

#### 해결 방법

- ✅ **해결됨**: 성능 최적화된 로컬 CSS 사용
- `src/styles/fonts.css`에서 필요한 가중치만 로드
- `main.tsx`에서 import하여 사용

### 3. Vite 모듈 MIME 타입 오류

#### 증상

- `Failed to load module script` 오류
- TypeScript 파일이 HTML로 응답됨

#### 해결 방법

**1단계: Vite 캐시 정리**

```bash
npm run clean:vite
```

**2단계: 포트 정리 후 재시작**

```bash
npm run dev:fresh
```

**3단계: 브라우저 캐시 정리**

- 개발자 도구 → Network 탭 → "Disable cache" 체크
- 또는 Ctrl+Shift+R (강제 새로고침)

**4단계: Vite 응답 확인**

```bash
npm run check:vite
```

- `http://localhost:3005/@vite/client` → JS 모듈 응답이어야 함
- `http://localhost:3005/src/pages/TodoHome.tsx` → JS 모듈 응답이어야 함
- HTML이 오면 프록시/서버가 가로채는 중

### 4. FCM "not supported" 오류

#### 증상

- Firebase Cloud Messaging 초기화 실패
- 서비스워커 등록 오류

#### 해결 방법

**1단계: 서비스워커 확인**

- `public/firebase-messaging-sw.js` 파일 존재 확인
- 브라우저 개발자 도구 → Application → Service Workers

**2단계: 브라우저 권한 확인**

- HTTPS 환경에서만 작동
- 브라우저 알림 권한 허용

**3단계: 환경변수 확인**

```bash
# .env 파일에 VAPID 키 설정
VITE_FCM_VAPID_KEY=your_vapid_key_here
```

### 5. 컴포넌트 import 오류

#### 증상

- `Module not found` 오류
- 대소문자 불일치 오류

#### 해결 방법

**파일명 확인**

```bash
# Windows PowerShell
dir src\components\layout\WaveBackground.tsx
dir src\components\ui\GlassCard.tsx
dir src\components\ui\WaveButton.tsx
dir src\pages\TodoHome.tsx
```

**Import 경로 수정**

```typescript
// ✅ 올바른 import
import { WaveBackground } from '@/components/layout/WaveBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { WaveButton } from '@/components/ui/WaveButton';

// ❌ 잘못된 import (대소문자 주의)
import { wavebackground } from '@/components/layout/wavebackground';
```

## 🛠️ 유용한 스크립트

### 개발 서버 관련

```bash
# 기본 개발 서버
npm run dev

# 포트 정리 후 개발 서버
npm run dev:clean

# Vite 캐시 정리
npm run clean:vite

# 완전 초기화 후 개발 서버
npm run dev:fresh

# Vite 응답 확인
npm run check:vite
```

### 빌드 관련

```bash
# 개발 빌드
npm run build

# 프로덕션 빌드
npm run build:production

# 빌드 분석
npm run build:analyze
```

### 테스트 관련

```bash
# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 테스트 환경 설정
npm run test:setup:full
```

## 🔍 디버깅 팁

### 1. Vite 개발 서버 상태 확인

```bash
# 3005 포트 사용 중인 프로세스 확인
netstat -ano | findstr :3005  # Windows
lsof -i :3005                 # macOS/Linux
```

### 2. 브라우저에서 Vite 응답 확인

- `http://localhost:3005/@vite/client` → JS 모듈 응답이어야 함
- `http://localhost:3005/src/pages/TodoHome.tsx` → JS 모듈 응답이어야 함
- HTML이 오면 프록시/서버가 가로채는 중

### 3. 네트워크 요청 확인

- 브라우저 개발자 도구 → Network 탭
- 실패한 요청의 Response 확인
- MIME 타입이 올바른지 확인

### 4. 콘솔 오류 분석

- JavaScript 오류 메시지 확인
- 모듈 로딩 실패 원인 파악
- CORS 오류 여부 확인

### 5. 폰트 로딩 확인

- 브라우저 개발자 도구 → Network 탭
- Pretendard 폰트 파일들이 정상적으로 로드되는지 확인
- 400 오류가 없는지 확인

## 📞 추가 지원

문제가 지속되면 다음을 확인하세요:

1. **Node.js 버전**: 18.x 이상 권장
2. **npm 버전**: 최신 버전 사용
3. **브라우저**: Chrome, Firefox, Safari 최신 버전
4. **방화벽**: 3005 포트 차단 여부
5. **프록시**: 회사/학교 네트워크 프록시 설정

## 🔄 문제 해결 체크리스트

- [ ] 3005 포트 점유 프로세스 종료
- [ ] Vite 캐시 정리 (`npm run clean:vite`)
- [ ] 브라우저 캐시 정리
- [ ] Pretendard 폰트 로컬 CSS 사용 확인
- [ ] 컴포넌트 import 경로 대소문자 확인
- [ ] FCM 환경변수 설정 확인
- [ ] 서비스워커 등록 상태 확인
- [ ] HTTPS 환경에서 FCM 테스트
- [ ] Vite 응답이 JS 모듈인지 확인 (`npm run check:vite`)

## 🎯 최적화 완료 사항

### ✅ Pretendard 폰트 최적화

- Google Fonts → jsDelivr → 로컬 CSS로 단계적 최적화
- 필요한 가중치(400, 500, 600, 700)만 로드
- `font-display: swap`으로 성능 향상

### ✅ Vite 설정 최적화

- 프록시 완전 제거로 단독 실행 보장
- `strictPort: true`로 포트 충돌 방지
- HMR 설정 최적화

### ✅ 스크립트 최적화

- ES 모듈 형식으로 통일
- 포트 정리 및 캐시 정리 자동화
- 사용자 친화적인 인터페이스
- Vite 응답 확인 스크립트 추가

### ✅ 컴포넌트 import 경로 확인

- 모든 import 경로가 올바른 대소문자로 설정됨
- `WaveBackground`, `GlassCard`, `WaveButton` 컴포넌트 정상 확인

## 🚀 빠른 시작 가이드

1. **개발 서버 시작**:
   ```bash
   npm run dev:clean
   ```

2. **Vite 응답 확인**:
   ```bash
   npm run check:vite
   ```

3. **문제 발생 시**:
   ```bash
   npm run dev:fresh
   ```

모든 설정이 완료되었으며, 이제 안정적으로 개발을 진행할 수 있습니다! 🎉
