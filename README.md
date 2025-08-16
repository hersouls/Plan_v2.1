# 🌊 Moonwave Plan - 가족 할일 관리

> 가족과 함께하는 스마트한 할일 관리 앱

[![PWA Score](https://img.shields.io/badge/PWA-97%25-green.svg)](https://plan.moonwave.kr)
[![Security](https://img.shields.io/badge/Security-100%25-brightgreen.svg)](docs/DEPLOYMENT.md#security)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Integrated-orange.svg)](https://firebase.google.com/)

## ✨ 주요 기능

### 🎯 **핵심 할일 관리**

- **실시간 할일 관리**: 생성, 편집, 삭제가 모든 가족 구성원에게 즉시 반영
- **우선순위 설정**: 긴급/중요/일반으로 할일의 중요도 관리
- **카테고리 분류**: 집안일, 업무, 개인, 쇼핑, 기타로 체계적 분류
- **마감일 관리**: 마감일 설정 및 지연 알림 기능
- **할일 할당**: 가족 구성원에게 할일 배정 및 추적
- **완료된 할일 추적**: 1차 그룹과 2차 그룹의 완료된 할일을 포인트와 함께 확인

### 👥 **실시간 가족 협업**

- **실시간 동기화**: 모든 할일 변경사항이 즉시 동기화
- **댓글 시스템**: 할일에 대한 실시간 소통
- **활동 피드**: 가족 구성원의 할일 진행상황 실시간 확인
- **사용자 상태**: 온라인/오프라인 상태 표시
- **푸시 알림**: 할일 배정, 완료, 댓글 등 실시간 알림
- **프로필 아바타**: Firebase Storage를 통한 개인 아바타 이미지 업로드 및 관리

### 🖼️ **프로필 & 아바타 관리**

- **아바타 업로드**: 설정에서 개인 프로필 이미지 업로드 (JPG, PNG, GIF, WebP 지원)
- **Firebase Storage 연동**: 안전한 이미지 저장 및 CDN을 통한 빠른 로딩
- **실시간 동기화**: 아바타 변경 시 모든 화면에서 즉시 반영
- **자동 최적화**: 이미지 크기 및 형식 자동 검증 (최대 5MB)
- **기본 이니셜**: 아바타 없을 시 이름 기반 이니셜 자동 생성

### 📱 **PWA & 오프라인 지원**

- **앱 설치**: 모바일에서 네이티브 앱처럼 설치 가능
- **오프라인 작업**: 네트워크 없이도 할일 관리 가능
- **자동 동기화**: 연결 복구 시 자동으로 데이터 동기화
- **빠른 액세스**: 홈 화면 바로가기로 즉시 접근

### 🔐 **보안 & 성능**

- **프로덕션급 보안**: Firebase 보안 규칙로 사용자 데이터 보호
- **최적화된 성능**: React.memo, 코드 분할로 빠른 로딩
- **HTTPS 전용**: 모든 통신이 암호화된 연결을 통해 진행

### 🏆 **포인트 시스템**

- **동기부여 시스템**: 할일 완료 시 포인트 획득으로 동기부여 제공
- **그룹별 포인트 관리**: 1차 그룹(선택된 그룹)과 2차 그룹(다른 그룹)의 완료된 할일 분류
- **포인트 계산 상세**: 우선순위, 예상 시간, 카테고리에 따른 포인트 계산 로직
- **완료된 할일 상세 보기**: 각 할일의 상세 정보와 포인트 획득 내역 확인

## 🚀 빠른 시작

### 환경 설정

```bash
# 의존성 설치
npm install
```

프로젝트 루트에 `.env.local` 파일을 생성하고 아래 값을 설정하세요.

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

# 선택: Analytics 활성화 (프로덕션에서만 동적 로딩)
VITE_ENABLE_ANALYTICS=false

# 선택: Claude AI 연동
VITE_ENABLE_CLAUDE_AI=false
VITE_CLAUDE_API_KEY=
VITE_CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

주의: Firebase 설정이 비어있거나 플레이스홀더일 경우 앱이 실행 중 에러를 발생시킬 수 있습니다. 올바른 값을 반드시 입력하세요.

### 개발 서버 실행

```bash
npm run dev
```

### 프로덕션 빌드

```bash
npm run build:prod
# 또는 품질 검사 + 테스트까지 포함한 빌드
npm run build:production
```

### 배포 검증

```bash
# 배포 전 전체 검증
npm run deploy:check

# PWA 설정 검증
npm run pwa:check

# 보안 설정 검증
npm run security:check
```

## 📁 프로젝트 구조

```
src/
├── components/          # UI 컴포넌트
│   ├── common/         # 공통 컴포넌트
│   ├── task/           # 할일 관련 컴포넌트
│   ├── family/         # 가족 관리 컴포넌트
│   └── ui/             # 기본 UI 컴포넌트
├── contexts/           # React Context 관리
├── hooks/              # 커스텀 훅
│   ├── useComments.ts  # 실시간 댓글
│   ├── useOffline.ts   # 오프라인 지원
│   └── useActivity.ts  # 활동 추적
├── lib/                # 라이브러리 설정
├── pages/              # 페이지 컴포넌트
├── types/              # TypeScript 타입 정의
└── utils/              # 유틸리티 함수

functions/               # Firebase Functions
scripts/                 # 배포 및 검증 스크립트
docs/                   # 문서
```

## 🛠️ 기술 스택

### **Frontend**

- **React 18** - 최신 안정 버전 활용
- **TypeScript** - 타입 안전성과 개발 효율성 (TS 5.x)
- **Tailwind CSS** - 유틸리티 우선 스타일링
- **Vite 7** - 빠른 개발 빌드 도구

### **Backend & Services**

- **Firebase Firestore** - 실시간 NoSQL 데이터베이스
- **Firebase Functions** - 서버리스 백엔드 로직
- **Firebase Auth** - 사용자 인증 관리
- **Firebase Storage** - 파일 저장소
- **Firebase Cloud Messaging** - 푸시 알림
- **Claude AI (옵션)** - 작업 제안/분류/서브태스크 생성 지원

### **Deployment & Infrastructure**

- **Vercel** - 프론트엔드 배포 및 도메인
- **Firebase Hosting** - 정적 자산 서빙
- **plan.moonwave.kr** - 커스텀 도메인

## 📋 개발 명령어

```bash
# 개발
npm run dev                # 개발 서버 실행
npm run type-check         # TypeScript 타입 검사
npm run lint               # Lint 검사
npm run lint:fix           # 자동 수정

# 테스트
npm run test               # 단위 테스트 실행
npm run test:e2e           # E2E 테스트 실행
npm run test:coverage      # 테스트 커버리지
npm run test:e2e:ui        # Playwright UI 모드
npm run test:e2e:smoke     # 스모크 테스트

# 빌드 & 분석
npm run build              # 프로덕션 빌드
npm run build:analyze      # 빌드 결과 분석
npm run analyze            # 번들 사이즈 분석
npm run build:check        # 빌드 유효성 검사

# 배포
npm run deploy:check       # 배포 사전 검증
npm run deploy:prod        # 프로덕션 배포
npm run deploy:ready       # 린트/타입/테스트/사전 점검 일괄 실행
npm run pre-deploy         # 배포 전 점검 스크립트
npm run functions:deploy   # Firebase Functions 배포

# Firebase 유틸리티
npm run firebase:deploy           # Firestore/Functions/Storage 동시 배포
npm run firebase:deploy:rules     # 보안 규칙만 배포
npm run firebase:setup-test-data  # 테스트 데이터 세팅
npm run firebase:setup-cors       # Storage CORS 설정

# 검증
npm run pwa:check          # PWA 설정 검증
npm run security:check     # 보안 설정 검증

# 개발 편의
npm run dev:fresh          # Vite 캐시 정리 후 개발 서버
npm run check:vite         # Vite 응답 체크
```

## 🌐 라이브 데모

**프로덕션**: [https://plan.moonwave.kr](https://plan.moonwave.kr)

## 📖 문서

- [배포 가이드](docs/DEPLOYMENT.md) - 완전한 배포 및 설정 가이드
- [개발 체크리스트](docs/개발체크리스트.md) - 개발 진행상황 체크리스트
- [Firebase 구조](docs/firestore-structure.md) - 데이터베이스 구조 설명
- [AI 컴포넌트](docs/AI_COMPONENTS.md) - Claude AI 통합 지침

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`
