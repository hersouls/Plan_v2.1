# CORS 오류 해결 가이드

## 문제 설명

Firebase Storage에 파일을 업로드할 때 다음과 같은 CORS 오류가 발생할 수 있습니다:

```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/v0/b/plan-e7bc6.firebasestorage.app/o?name=...' from origin 'http://localhost:3018' has been blocked by CORS policy
```

## 원인

1. **Firebase Storage CORS 설정 누락**: Firebase Storage 버킷에 CORS 설정이 제대로 구성되지 않음
2. **로컬 개발 환경**: `localhost`에서의 요청이 허용되지 않음
3. **브라우저 보안 정책**: 브라우저의 Same-Origin Policy에 의해 차단됨
4. **Firebase Storage 미활성화**: Firebase Storage가 아직 활성화되지 않음

## 해결 방법

### 1. Firebase Storage 활성화 (필수)

먼저 Firebase Storage가 활성화되어 있는지 확인하세요:

1. [Firebase Console](https://console.firebase.google.com/project/plan-e7bc6/storage)에 접속
2. **Storage** 탭 클릭
3. **Get Started** 버튼 클릭하여 Storage 활성화
4. 보안 규칙 선택 (테스트 모드 또는 프로덕션 모드)

### 2. 자동 CORS 설정 (권장)

Firebase Storage가 활성화된 후, 프로젝트 루트에서 다음 명령어를 실행하세요:

```bash
npm run firebase:setup-cors
```

이 명령어는 Firebase Storage의 CORS 설정을 자동으로 업데이트합니다.

### 3. 수동 해결

#### 방법 1: Google Cloud Console 사용

1. [Google Cloud Console](https://console.cloud.google.com/)에 로그인
2. Firebase 프로젝트 선택 (`plan-e7bc6`)
3. **Cloud Storage** > **Browser**로 이동
4. **CORS** 탭 클릭
5. 다음 설정 추가:

```json
[
  {
    "origin": [
      "http://localhost:3000",
      "http://localhost:3018",
      "http://localhost:5173",
      "https://plan-e7bc6.web.app",
      "https://plan-e7bc6.firebaseapp.com"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": [
      "Content-Type",
      "Authorization",
      "Content-Length",
      "User-Agent",
      "x-goog-*"
    ]
  }
]
```

#### 방법 2: gsutil 명령어 사용

1. Google Cloud SDK 설치 (아직 설치하지 않은 경우)
2. 다음 명령어 실행:

```bash
# CORS 설정 파일 생성
cat > cors.json << EOF
[
  {
    "origin": [
      "http://localhost:3000",
      "http://localhost:3018",
      "http://localhost:5173",
      "https://plan-e7bc6.web.app",
      "https://plan-e7bc6.firebaseapp.com"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": [
      "Content-Type",
      "Authorization",
      "Content-Length",
      "User-Agent",
      "x-goog-*"
    ]
  }
]
EOF

# CORS 설정 적용
gsutil cors set cors.json gs://plan-e7bc6.firebasestorage.app

# 임시 파일 삭제
rm cors.json
```

### 4. 개발 환경에서 임시 해결

#### 브라우저 확장 프로그램 사용

Chrome에서 CORS를 비활성화하는 확장 프로그램을 사용할 수 있습니다:

- "CORS Unblock" 또는 "Allow CORS: Access-Control-Allow-Origin"

#### 개발 서버 프록시 설정 (이미 적용됨)

`vite.config.ts`에 프록시 설정이 이미 추가되어 있습니다:

```typescript
server: {
  proxy: {
    '/storage': {
      target: 'https://firebasestorage.googleapis.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/storage/, ''),
    },
  },
}
```

## 확인 방법

CORS 설정이 제대로 적용되었는지 확인하려면:

1. 브라우저 개발자 도구 열기 (F12)
2. **Network** 탭에서 파일 업로드 시도
3. CORS 오류가 더 이상 발생하지 않는지 확인

## 추가 문제 해결

### 인증 문제

Firebase 인증이 제대로 설정되지 않은 경우:

```typescript
// firebase.ts에서 인증 상태 확인
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const auth = getAuth();
onAuthStateChanged(auth, user => {
  if (user) {
    console.log('사용자 인증됨:', user.uid);
  } else {
    console.log('사용자 인증되지 않음');
  }
});
```

### Storage Rules 확인

`storage.rules` 파일에서 업로드 권한이 올바르게 설정되어 있는지 확인:

```javascript
// tasks/{taskId}/files/{fileName} 경로에 대한 쓰기 권한
match /tasks/{taskId}/files/{fileName} {
  allow write: if request.auth != null &&
    request.resource.size < 10 * 1024 * 1024; // 10MB 제한
}
```

## 예방 조치

1. **환경별 CORS 설정**: 개발, 스테이징, 프로덕션 환경에 맞는 CORS 설정
2. **정기적인 확인**: 배포 후 CORS 설정이 올바르게 적용되었는지 확인
3. **에러 로깅**: CORS 오류 발생 시 적절한 로깅 및 모니터링

## 관련 파일

- `scripts/setup-storage-cors.js`: CORS 설정 자동화 스크립트
- `firebase.json`: Firebase 프로젝트 설정
- `storage.rules`: Firebase Storage 보안 규칙
- `src/lib/storage.ts`: 파일 업로드 서비스
- `src/components/task/FileAttachment.tsx`: 파일 첨부 컴포넌트
- `vite.config.ts`: 개발 서버 프록시 설정

## 지원

문제가 지속되는 경우:

1. Firebase Console에서 Storage 설정 확인
2. 브라우저 개발자 도구의 Network 탭에서 상세 오류 확인
3. 프로젝트 관리자에게 문의

## 빠른 해결 순서

1. **Firebase Storage 활성화** (가장 중요!)
2. **CORS 설정 적용**: `npm run firebase:setup-cors`
3. **개발 서버 재시작**: `npm run dev`
4. **브라우저 캐시 삭제** 후 다시 시도
