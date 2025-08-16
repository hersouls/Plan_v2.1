# Claude AI Quick Start Guide

Moonwave Plan에서 Claude AI 기능을 빠르게 시작하는 방법을 안내합니다.

## 🚀 5분만에 시작하기

### 1단계: API 키 설정

1. **Claude API 키 발급**
   - [Anthropic Console](https://console.anthropic.com) 접속
   - 계정 생성 및 로그인
   - API 키 생성

2. **환경 변수 설정**
   ```bash
   # .env 파일 생성 (.env.example 복사)
   cp .env.example .env
   ```

   ```bash
   # .env 파일에서 Claude API 키 설정
   VITE_CLAUDE_API_KEY=your-actual-api-key-here
   CLAUDE_API_KEY=your-actual-api-key-here
   VITE_ENABLE_CLAUDE_AI=true
   ```

### 2단계: 연결 테스트

```bash
# Claude API 연결 테스트
npm run test:claude-api

# 또는 직접 실행
node scripts/test-claude-api.js
```

**성공 시 출력:**
```
🤖 Testing Claude API Integration...
✅ API Key found
✅ Anthropic client initialized
✅ API Response: API test successful! Hello from Claude!
✅ Task suggestions generated:
   1. 주방 정리하기 (household, medium)
   2. 세탁물 널기 (household, low)
```

### 3단계: 개발 서버 실행

```bash
# 개발 서버 시작
npm run dev
```

브라우저에서 `http://localhost:3001` 접속

## ✨ 첫 번째 AI 기능 사용

### 1. 할일 페이지에서 AI 어시스턴트 사용

1. **TodoHome 페이지** (`/`) 접속
2. **AI 어시스턴트 버튼** 클릭 (Sparkles 아이콘)
3. **자연어로 요청**: "주말에 할 가족 활동을 추천해줘"
4. **제안 선택**: AI가 제안한 할일 중 하나 선택
5. **자동 생성**: 할일이 자동으로 생성됨

### 2. 스마트 할일 입력 사용

1. **새 할일 만들기** (`/tasks/create`) 페이지 접속
2. **할일 제목 입력**: "방 청소"
3. **AI 자동 분석**: 1.5초 후 자동으로 AI가 분석
4. **향상된 제안 확인**: 카테고리, 우선순위, 예상시간 자동 설정
5. **제안 적용**: "적용하기" 버튼 클릭

### 3. 상황별 할일 제안 활용

1. **대시보드**에서 AI 제안 위젯 확인
2. **상황 선택**: 아침, 저녁, 주말 등
3. **제안 확인**: 상황에 맞는 할일 목록 표시
4. **즉시 추가**: 마음에 드는 할일 클릭으로 추가

## 🛠️ 기본 사용법

### AI 어시스턴트 대화 예시

```
👤 사용자: "아이와 함께 할 수 있는 교육적인 활동을 추천해줘"

🤖 Claude: 다음과 같은 활동들을 추천해드려요:

1. 📚 함께 책 읽고 독후감 쓰기
   - 카테고리: education
   - 우선순위: medium
   - 예상시간: 45분

2. 🧪 간단한 과학실험 하기
   - 카테고리: education
   - 우선순위: high  
   - 예상시간: 60분

3. 🎨 창의적인 그림 그리기
   - 카테고리: education
   - 우선순위: low
   - 예상시간: 30분
```

### 스마트 입력 활용 팁

**입력 예시:**
- "아침 운동" → AI가 건강 카테고리, 높은 우선순위, 30분 예상으로 분석
- "장보기" → AI가 쇼핑 카테고리, 보통 우선순위, 60분 예상으로 분석
- "아이 숙제 도와주기" → AI가 교육 카테고리, 높은 우선순위, 45분 예상으로 분석

## 📱 컴포넌트 통합

### 기존 컴포넌트에 AI 기능 추가

```tsx
// 1. Import AI 컴포넌트
import { ClaudeAssistant, SmartTaskInput } from '@/components/ai';

// 2. 상태 관리
const [showAI, setShowAI] = useState(false);
const [taskInput, setTaskInput] = useState('');

// 3. UI에 통합
<div className="task-form">
  {/* 기존 입력 필드를 SmartTaskInput으로 교체 */}
  <SmartTaskInput
    value={taskInput}
    onChange={setTaskInput}
    onSmartSuggestion={handleAISuggestion}
  />
  
  {/* AI 어시스턴트 토글 버튼 */}
  <button onClick={() => setShowAI(true)}>
    <Sparkles size={16} />
    AI 도움받기
  </button>
  
  {/* AI 어시스턴트 모달 */}
  <ClaudeAssistant
    isOpen={showAI}
    onClose={() => setShowAI(false)}
    onTaskSuggestion={handleTaskFromAI}
  />
</div>
```

## 🎯 실용적인 활용 시나리오

### 시나리오 1: 바쁜 아침 일정 관리

1. **AI에게 요청**: "바쁜 월요일 아침 준비할 것들"
2. **AI 제안 받기**: 
   - 아침식사 준비 (15분)
   - 아이 등교 준비 (20분)
   - 출근 준비 (25분)
3. **우선순위 조정**: AI가 시간순으로 자동 정렬
4. **가족 배분**: 각 할일을 적절한 가족 구성원에게 할당

### 시나리오 2: 주말 가족 계획

1. **컨텍스트 선택**: "주말" 상황 선택
2. **가족 정보 반영**: 구성원 나이/성향 고려한 제안
3. **다양한 활동**: 실내/실외, 교육/오락 균형잡힌 제안
4. **시간 계획**: 각 활동의 소요시간으로 일정 계획

### 시나리오 3: 집안일 효율화

1. **현재 상황 분석**: "집이 너무 어수선해"
2. **체계적 제안**: 
   - 정리 순서 (거실 → 침실 → 주방)
   - 각 공간별 세부 작업
   - 소요시간과 난이도
3. **가족 협업**: 연령대별 적절한 역할 분담

## 🔧 고급 활용

### 커스텀 프롬프트 작성

```typescript
// 특정 상황에 맞는 커스텀 요청
const customRequest = async () => {
  const suggestions = await generateTaskSuggestions(`
    우리 가족은 부모 2명, 초등학생 1명입니다.
    이번 주말에 비가 올 예정이에요.
    실내에서 할 수 있는 의미있는 활동을 추천해주세요.
    교육적이면서도 재미있었으면 좋겠어요.
  `);
  
  return suggestions;
};
```

### 배치 작업 최적화

```typescript
// 여러 할일을 한번에 AI로 향상
const enhanceAllTasks = async (tasks) => {
  const enhanced = await Promise.all(
    tasks.map(async (task) => {
      const [category, priority, duration] = await Promise.all([
        categorizeTask(task.title),
        suggestTaskPriority(task.title, task.description),
        estimateTaskDuration(task.title, task.description)
      ]);
      
      return { ...task, category, priority, estimatedMinutes: duration };
    })
  );
  
  return enhanced;
};
```

## 🚨 주의사항

### 1. API 사용량 관리
- **무료 사용량**: 월 5달러 크레딧
- **모니터링**: Anthropic Console에서 사용량 확인
- **효율적 사용**: 불필요한 요청 최소화

### 2. 네트워크 의존성
- **오프라인 모드**: AI 기능 비활성화
- **느린 연결**: 타임아웃 처리
- **사용자 피드백**: 로딩 상태 표시

### 3. 데이터 프라이버시
- **민감 정보**: 개인정보 전송 주의
- **로컬 처리**: 가능한 한 클라이언트에서 처리
- **사용자 동의**: AI 기능 사용 전 안내

## 🆘 문제 해결

### 자주 묻는 질문

**Q: AI 기능이 작동하지 않아요**
```bash
# 1. API 키 확인
echo $CLAUDE_API_KEY

# 2. 연결 테스트
npm run test:claude-api

# 3. 브라우저 콘솔 확인
# 개발자 도구 > Console 탭에서 에러 메시지 확인
```

**Q: AI 응답이 이상해요**
- 프롬프트가 명확한지 확인
- 한국어로 자연스럽게 요청
- 구체적인 상황 정보 제공

**Q: 응답이 너무 느려요**
- 인터넷 연결 상태 확인
- API 사용량 한도 확인
- 간단한 요청부터 시작

### 로그 확인

```bash
# 디버그 모드로 실행
VITE_DEBUG=true npm run dev

# Claude API 로그 확인
DEBUG=claude:* npm run dev
```

## 📞 지원

문제가 지속되면:

1. **이슈 리포트**: [GitHub Issues](https://github.com/your-repo/issues)
2. **문서 확인**: [상세 문서](./CLAUDE_INTEGRATION.md)
3. **커뮤니티**: [Discord/Slack 채널]

---

**🎉 축하합니다!** 이제 Claude AI가 탑재된 스마트한 할일 관리를 경험해보세요!