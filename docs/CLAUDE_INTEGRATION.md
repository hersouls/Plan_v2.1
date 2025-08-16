# Claude AI Integration Guide

Moonwave Plan에 Claude AI 기능이 통합되어 스마트한 할일 관리를 제공합니다.

## 🚀 기능 개요

### 1. **AI 할일 어시스턴트**
- 자연어로 할일 생성 및 관리
- 컨텍스트 기반 할일 제안
- 스마트한 카테고리 자동 분류

### 2. **스마트 입력 향상**
- 실시간 할일 분석 및 향상
- 자동 우선순위 제안
- 예상 소요시간 계산

### 3. **AI 기반 제안**
- 상황별 맞춤 할일 추천
- 가족 구성원 기반 할일 배분
- 효율적인 할일 순서 제안

## 📋 설정 방법

### 1. 환경 변수 설정

`.env` 파일에 Claude API 키를 추가하세요:

```bash
# Claude AI Configuration
VITE_CLAUDE_API_KEY=your-claude-api-key
CLAUDE_API_KEY=your-claude-api-key
VITE_CLAUDE_MODEL=claude-3-5-sonnet-20241022
VITE_CLAUDE_MAX_TOKENS=4096
VITE_ENABLE_CLAUDE_AI=true

# Claude Features
VITE_CLAUDE_TASK_ASSISTANT=true
VITE_CLAUDE_SMART_SUGGESTIONS=true
VITE_CLAUDE_AUTO_CATEGORIZE=true
```

### 2. API 키 발급

1. [Anthropic Console](https://console.anthropic.com)에 접속
2. API 키 생성
3. 환경 변수에 추가

### 3. 기능 테스트

```bash
# Claude API 연결 테스트
npm run claude:test-api

# MCP 서버 테스트
node scripts/mcp-task-server.js
```

## 🛠️ 사용 방법

### 1. Claude 어시스턴트 사용

```tsx
import { ClaudeAssistant } from '@/components/ai';

function TaskPage() {
  const [assistantOpen, setAssistantOpen] = useState(false);

  const handleTaskSuggestion = (suggestion) => {
    // 제안된 할일을 처리
    console.log('AI 제안:', suggestion);
  };

  return (
    <div>
      <button onClick={() => setAssistantOpen(true)}>
        AI 어시스턴트 열기
      </button>
      
      <ClaudeAssistant
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        onTaskSuggestion={handleTaskSuggestion}
      />
    </div>
  );
}
```

### 2. 스마트 입력 필드 사용

```tsx
import { SmartTaskInput } from '@/components/ai';

function CreateTask() {
  const [taskTitle, setTaskTitle] = useState('');

  const handleSmartSuggestion = (suggestion) => {
    // AI 향상 제안 적용
    setTaskData({
      ...taskData,
      ...suggestion
    });
  };

  return (
    <SmartTaskInput
      value={taskTitle}
      onChange={setTaskTitle}
      onSmartSuggestion={handleSmartSuggestion}
      placeholder="할일을 입력하세요..."
    />
  );
}
```

### 3. AI 할일 제안 위젯

```tsx
import { AITaskSuggestions } from '@/components/ai';

function Dashboard() {
  const handleTaskSelect = (suggestion) => {
    // 제안된 할일을 할일 목록에 추가
    addTask(suggestion);
  };

  return (
    <AITaskSuggestions
      context="morning"
      familyMembers={familyMembers}
      onTaskSelect={handleTaskSelect}
      maxSuggestions={5}
    />
  );
}
```

## 🔧 고급 사용법

### 1. 커스텀 프롬프트

```typescript
import { useClaudeAI } from '@/lib/claude';

function CustomAIFeature() {
  const { generateTaskSuggestions, categorizeTask } = useClaudeAI();

  const generateWeeklyPlan = async () => {
    const suggestions = await generateTaskSuggestions(
      "이번 주 가족 일정을 위한 할일 계획을 세워주세요"
    );
    return suggestions;
  };
}
```

### 2. 배치 처리

```typescript
const enhanceMultipleTasks = async (tasks) => {
  const enhanced = await Promise.all(
    tasks.map(async (task) => ({
      ...task,
      category: await categorizeTask(task.title, task.description),
      priority: await suggestTaskPriority(task.title, task.description),
      estimatedMinutes: await estimateTaskDuration(task.title, task.description)
    }))
  );
  return enhanced;
};
```

## 🔍 MCP Integration

### MCP 서버 실행

```bash
node scripts/mcp-task-server.js
```

### 사용 가능한 도구들

- `create_task`: 새 할일 생성
- `list_tasks`: 할일 목록 조회
- `update_task`: 할일 수정
- `delete_task`: 할일 삭제
- `get_task_stats`: 통계 조회
- `suggest_task_improvements`: 개선 제안

### MCP 클라이언트 연결

```json
{
  "mcpServers": {
    "moonwave-tasks": {
      "command": "node",
      "args": ["scripts/mcp-task-server.js"],
      "env": {
        "FIREBASE_PROJECT_ID": "your-project-id"
      }
    }
  }
}
```

## 🎨 컴포넌트 커스터마이징

### 테마 설정

```tsx
// AI 컴포넌트 스타일 커스터마이징
<ClaudeAssistant
  className="custom-ai-assistant"
  placeholder="맞춤형 플레이스홀더"
/>
```

### 이벤트 핸들링

```tsx
const handleAIInteraction = {
  onSuggestionReceived: (suggestion) => {
    // 제안 받았을 때
  },
  onError: (error) => {
    // 오류 발생 시
  },
  onSuccess: (result) => {
    // 성공 시
  }
};
```

## 🚨 주의사항

### 1. API 사용량 관리
- Claude API는 토큰 기반 과금
- 요청 빈도 제한 고려
- 캐싱 전략 구현 권장

### 2. 보안 고려사항
- API 키는 환경 변수로 관리
- 클라이언트 사이드에서는 제한적 노출
- 민감한 데이터 전송 주의

### 3. 오프라인 대응
- 네트워크 연결 상태 확인
- 기본 동작 모드 제공
- 사용자 피드백 표시

## 🔧 문제 해결

### 자주 발생하는 문제

1. **API 키 오류**
   ```bash
   Error: Invalid API key
   ```
   - `.env` 파일의 API 키 확인
   - 환경 변수 로딩 확인

2. **네트워크 오류**
   ```bash
   Error: Network request failed
   ```
   - 인터넷 연결 확인
   - 방화벽 설정 확인

3. **응답 파싱 오류**
   ```bash
   Error: Failed to parse AI response
   ```
   - 프롬프트 형식 확인
   - JSON 스키마 검증

### 디버깅 도구

```bash
# API 연결 테스트
npm run claude:test-api

# 디버그 모드 실행
VITE_DEBUG=true npm run dev

# MCP 서버 디버그
DEBUG=mcp:* node scripts/mcp-task-server.js
```

## 📚 추가 리소스

- [Claude API 문서](https://docs.anthropic.com/claude/docs)
- [MCP 사양](https://modelcontextprotocol.io/introduction)
- [React 컴포넌트 가이드](./COMPONENT_GUIDE.md)
- [개발 워크플로우](./DEVELOPMENT_WORKFLOW.md)

## 🤝 기여하기

Claude AI 기능 개선에 기여하고 싶으시면:

1. 이슈 리포트
2. 기능 제안
3. 코드 개선
4. 문서 업데이트

프로젝트 [기여 가이드](../CONTRIBUTING.md)를 참고해주세요.