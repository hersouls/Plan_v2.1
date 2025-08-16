# Vercel 배포 가이드

## 환경변수 설정

Vercel 대시보드에서 다음 환경변수들을 설정해야 합니다:

### Firebase 설정 (필수)
```
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
VITE_FCM_VAPID_KEY=your-fcm-vapid-key
```

### 애플리케이션 설정 (필수)
```
VITE_APP_NAME=Moonwave Plan
VITE_APP_VERSION=1.0.0
VITE_APP_URL=https://your-vercel-app-url.vercel.app
VITE_NODE_ENV=production
VITE_DEBUG=false
VITE_API_BASE_URL=https://api.moonwave.kr
```

### 기능 플래그 (선택사항)
```
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_CLAUDE_AI=true
```

### Claude AI 설정 (선택사항)
```
VITE_CLAUDE_API_KEY=your-claude-api-key
CLAUDE_API_KEY=your-claude-api-key
VITE_CLAUDE_MODEL=claude-3-5-sonnet-20241022
VITE_CLAUDE_MAX_TOKENS=4096
VITE_CLAUDE_TASK_ASSISTANT=true
VITE_CLAUDE_SMART_SUGGESTIONS=true
VITE_CLAUDE_AUTO_CATEGORIZE=true
```

### 분석 및 모니터링 (선택사항)
```
VITE_GOOGLE_ANALYTICS_ID=your-ga-id
VITE_SENTRY_DSN=your-sentry-dsn
```

## 배포 설정

### 빌드 명령어
```json
{
  "buildCommand": "npm run build:vercel"
}
```

### 출력 디렉토리
```
dist
```

### 노드 버전
```
18.x
```

## 배포 체크리스트

1. ✅ Firebase 프로젝트 설정 완료
2. ✅ Vercel 환경변수 설정 완료
3. ✅ 빌드 테스트 성공
4. ✅ 환경변수 참조 확인
5. ✅ 라우팅 설정 확인
6. ✅ PWA 설정 확인
7. ✅ Claude AI 통합 확인

## 배포 후 확인사항

1. 홈페이지 로딩 확인
2. Firebase 인증 작동 확인
3. 데이터베이스 연결 확인
4. PWA 기능 확인
5. Claude AI 기능 확인 (API 키 설정 시)
6. 푸시 알림 기능 확인

## 문제 해결

### 빌드 실패 시
- 환경변수 설정 확인
- TypeScript 오류 확인
- 의존성 설치 확인

### 런타임 오류 시
- Firebase 설정 확인
- 환경변수 값 확인
- 브라우저 콘솔 로그 확인

### Claude AI 작동 안함
- VITE_ENABLE_CLAUDE_AI=true 설정 확인
- VITE_CLAUDE_API_KEY 값 확인
- API 키 권한 확인

## 성능 최적화

### 번들 크기 최적화
- 코드 스플리팅 적용됨
- 동적 임포트 사용
- Tree shaking 적용

### 캐싱 설정
- 정적 파일: 1년 캐시
- Service Worker: 캐시 안함
- Manifest: 1시간 캐시

### 보안 헤더
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin