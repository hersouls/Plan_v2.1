# 🔥 Firebase 테스트 데이터 설정 가이드

이 문서는 Moonwave Plan 프로젝트의 Firebase 테스트 계정과 가상 데이터를 설정하는 방법을 설명합니다.

## 📋 테스트 계정 정보

다음 테스트 계정들이 생성됩니다:

### 👨‍👩‍👧‍👦 Kim 가족 (Family Group: `family-kim-2024`)

| 역할 | 이름 | 이메일 | 비밀번호 |
|------|------|---------|----------|
| 👑 소유자 (부모) | 김아빠 | `dad@moonwave.test` | `test123456` |
| 👥 부모 | 박엄마 | `mom@moonwave.test` | `test123456` |
| 👶 자녀 | 김수현 | `suhyun@moonwave.test` | `test123456` |
| 👶 자녀 | 김도현 | `dohyun@moonwave.test` | `test123456` |

**가족 그룹 초대 코드:** `MOON2024`

---

## 🚀 설정 방법

### 1. Firebase 프로젝트 설정

먼저 Firebase 설정을 업데이트해야 합니다:

1. **Firebase 설정 파일 수정**
   ```bash
   # scripts/setupTestData.js 파일에서 Firebase 설정을 실제 값으로 변경
   ```

   ```javascript
   const firebaseConfig = {
     apiKey: "your-actual-api-key",
     authDomain: "plan-e7bc6.firebaseapp.com",
     projectId: "plan-e7bc6",
     storageBucket: "plan-e7bc6.appspot.com",
     messagingSenderId: "your-actual-sender-id",
     appId: "your-actual-app-id"
   };
   ```

2. **인증 설정 확인**
   - Firebase Console > Authentication > Sign-in method
   - Email/Password 인증 활성화
   - 테스트 도메인에 대한 승인된 도메인 추가 (필요시)

### 2. 테스트 데이터 생성

```bash
# 테스트 데이터 설정 스크립트 실행
npm run firebase:setup-test-data
```

이 명령어는 다음을 생성합니다:
- ✅ 4명의 테스트 사용자 계정
- ✅ Kim 가족 그룹
- ✅ 8개의 샘플 할일 (다양한 상태)
- ✅ 댓글 및 이모지 반응
- ✅ 활동 로그
- ✅ 사용자 업적
- ✅ 알림 데이터

### 3. 데이터 초기화 (필요시)

기존 데이터를 모두 삭제하고 싶다면:

```bash
# 모든 Firestore 데이터 삭제
npm run firebase:clear-data

# 다시 테스트 데이터 생성
npm run firebase:setup-test-data
```

---

## 📊 생성되는 샘플 데이터

### 할일 (Tasks) - 총 8개

1. **식료품 장보기** 
   - 📅 2일 후 마감 / 🏪 쇼핑 / ⚡ 보통 / 📍 이마트
   - 상태: 대기중

2. **방 청소하기**
   - 📅 내일 마감 / 🏠 집안일 / 🔥 높음
   - 상태: 진행중

3. **수학 숙제 완료**
   - 📅 3일 후 마감 / 💼 업무 / 🔥 높음
   - 상태: 대기중

4. **운동하기**
   - 📅 어제 (완료됨) / 👤 개인 / ⚡ 보통
   - 상태: ✅ 완료

5. **책 읽기**
   - 🔄 매일 반복 / 👤 개인 / 🟢 낮음
   - 상태: 대기중

6. **설거지하기**
   - 🔄 매일 반복 / 🏠 집안일 / ⚡ 보통
   - 상태: ✅ 완료

7. **친구 만나기**
   - 📅 5일 후 마감 / 👤 개인 / 🟢 낮음 / 📍 스타벅스 강남점
   - 상태: 대기중

8. **프로젝트 완료**
   - 📅 1주일 후 마감 / 💼 업무 / 🔥 높음
   - 상태: 대기중

### 기타 데이터

- **댓글**: 첫 3개 할일에 댓글과 이모지 반응
- **활동 로그**: 할일 생성, 상태 변경, 완료, 댓글 활동
- **알림**: 할일 할당 및 마감 임박 알림
- **업적**: 첫 할일 완료, 일주일 연속 등

---

## 🧪 테스트 시나리오

### 기본 기능 테스트

1. **로그인 테스트**
   ```
   Email: dad@moonwave.test
   Password: test123456
   ```

2. **대시보드 확인**
   - 할일 통계 확인
   - 오늘/이번주/전체 필터 테스트
   - 완료율 프로그레스 바 확인

3. **할일 관리**
   - 할일 생성/수정/삭제
   - 상태 변경 (대기→진행중→완료)
   - 댓글 추가 및 이모지 반응

4. **가족 기능**
   - 가족 구성원 목록 확인
   - 역할 및 통계 확인
   - 초대 코드 복사

5. **통계 화면**
   - 차트 데이터 확인
   - 기간별 필터링
   - 업적 시스템

### 다중 사용자 테스트

각각 다른 브라우저/시크릿 모드에서 로그인하여 실시간 동기화 확인:

1. **김아빠** 계정으로 할일 생성
2. **박엄마** 계정에서 실시간 업데이트 확인
3. **김수현** 계정으로 할일 완료
4. 다른 사용자들에게 활동 알림 확인

---

## ⚠️ 주의사항

1. **테스트 환경 전용**
   - 이 데이터는 개발 및 테스트용입니다
   - 프로덕션 환경에서는 사용하지 마세요

2. **데이터 보안**
   - 실제 개인정보나 민감한 데이터는 사용하지 마세요
   - 모든 비밀번호는 테스트용입니다

3. **Firebase 규칙**
   - 현재 보안 규칙이 적용되어 있습니다
   - 테스트 시 권한 관련 오류가 발생할 수 있습니다

---

## 🛠️ 문제 해결

### 일반적인 오류

1. **인증 실패**
   ```
   Error: Firebase config not found
   ```
   ➡️ `scripts/setupTestData.js`에서 Firebase 설정 확인

2. **권한 거부**
   ```
   Error: Missing or insufficient permissions
   ```
   ➡️ Firestore 보안 규칙 확인

3. **이메일 이미 사용 중**
   ```
   Error: auth/email-already-in-use
   ```
   ➡️ 정상적인 동작 (기존 계정으로 로그인 시도)

### Firebase 콘솔에서 확인

1. **Authentication** → Users 탭에서 생성된 사용자 확인
2. **Firestore Database** → 데이터 컬렉션 확인
3. **Functions** → 로그에서 오류 메시지 확인 (해당시)

---

## 📞 지원

테스트 데이터 설정에 문제가 있다면:
1. Firebase 콘솔에서 프로젝트 상태 확인
2. 브라우저 개발자 도구 콘솔 확인
3. 네트워크 연결 및 방화벽 설정 확인

---

**🎉 설정 완료 후 Moonwave Plan의 모든 기능을 테스트할 수 있습니다!**