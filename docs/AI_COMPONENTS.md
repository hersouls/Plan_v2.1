# AI Components Documentation

Moonwave Plan의 AI 기능을 제공하는 React 컴포넌트들에 대한 상세 문서입니다.

## 📦 Components Overview

```
src/components/ai/
├── ClaudeAssistant.tsx      # AI 어시스턴트 대화 인터페이스
├── SmartTaskInput.tsx       # 스마트 할일 입력 필드
├── AITaskSuggestions.tsx    # AI 할일 제안 위젯
└── index.ts                 # 컴포넌트 내보내기
```

## 🎯 ClaudeAssistant

AI와의 대화를 통해 할일을 생성하고 관리할 수 있는 모달 컴포넌트입니다.

### Props

```typescript
interface ClaudeAssistantProps {
  isOpen: boolean;                    // 모달 열림/닫힘 상태
  onClose: () => void;               // 모달 닫기 콜백
  onTaskSuggestion?: (suggestion: any) => void; // 할일 제안 선택 시 콜백
  placeholder?: string;              // 입력 필드 플레이스홀더
  className?: string;                // 추가 CSS 클래스
}
```

### 사용 예시

```tsx
import { ClaudeAssistant } from '@/components/ai';

function TaskManagement() {
  const [assistantOpen, setAssistantOpen] = useState(false);

  const handleTaskSuggestion = (suggestion) => {
    // 제안된 할일을 처리
    createTask({
      title: suggestion.title,
      description: suggestion.description,
      category: suggestion.category,
      priority: suggestion.priority,
      estimatedMinutes: suggestion.estimatedMinutes
    });
    setAssistantOpen(false);
  };

  return (
    <>
      <button onClick={() => setAssistantOpen(true)}>
        AI 어시스턴트 열기
      </button>
      
      <ClaudeAssistant
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        onTaskSuggestion={handleTaskSuggestion}
        placeholder="어떤 할일을 도와드릴까요?"
      />
    </>
  );
}
```

### Features

- **자연어 입력**: 사용자가 편하게 요청 가능
- **실시간 제안**: AI가 즉시 할일 제안 생성
- **상세 정보**: 카테고리, 우선순위, 예상 시간 포함
- **반응형 디자인**: 모바일/데스크톱 최적화

## 🧠 SmartTaskInput

할일 입력 시 AI가 자동으로 내용을 분석하고 향상시켜주는 입력 필드입니다.

### Props

```typescript
interface SmartTaskInputProps {
  value: string;                     // 입력 값
  onChange: (value: string) => void; // 값 변경 콜백
  onSmartSuggestion?: (suggestion: {
    title: string;
    description?: string;
    category: TaskCategory;
    priority: TaskPriority;
    estimatedMinutes?: number;
  }) => void;                        // AI 제안 콜백
  placeholder?: string;              // 플레이스홀더
  disabled?: boolean;                // 비활성화 상태
  className?: string;                // 추가 CSS 클래스
}
```

### 사용 예시

```tsx
import { SmartTaskInput } from '@/components/ai';

function CreateTaskForm() {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskData, setTaskData] = useState({});

  const handleSmartSuggestion = (suggestion) => {
    // AI 제안을 폼 데이터에 적용
    setTaskData(prev => ({
      ...prev,
      title: suggestion.title,
      description: suggestion.description,
      category: suggestion.category,
      priority: suggestion.priority,
      estimatedMinutes: suggestion.estimatedMinutes
    }));
  };

  return (
    <form>
      <SmartTaskInput
        value={taskTitle}
        onChange={setTaskTitle}
        onSmartSuggestion={handleSmartSuggestion}
        placeholder="할일을 입력하세요..."
      />
      {/* 다른 폼 필드들... */}
    </form>
  );
}
```

### Features

- **자동 분석**: 1.5초 후 자동으로 AI 분석 시작
- **실시간 향상**: 타이핑이 끝나면 자동 제안
- **선택적 적용**: 사용자가 제안을 선택하거나 무시 가능
- **시각적 피드백**: 분석 중 로딩 표시

## 💡 AITaskSuggestions

상황별로 적절한 할일을 AI가 제안해주는 위젯 컴포넌트입니다.

### Props

```typescript
interface AITaskSuggestionsProps {
  context?: string;                  // 컨텍스트 (기본값: 'general')
  familyMembers?: Array<{           // 가족 구성원 정보
    id: string; 
    name: string;
  }>;
  onTaskSelect?: (suggestion: TaskSuggestion) => void; // 할일 선택 콜백
  onClose?: () => void;             // 닫기 콜백
  maxSuggestions?: number;          // 최대 제안 수 (기본값: 5)
  className?: string;               // 추가 CSS 클래스
}
```

### 사용 예시

```tsx
import { AITaskSuggestions } from '@/components/ai';

function Dashboard() {
  const familyMembers = [
    { id: 'user1', name: '아빠' },
    { id: 'user2', name: '엄마' },
    { id: 'user3', name: '아이' }
  ];

  const handleTaskSelect = (suggestion) => {
    // 제안된 할일을 할일 목록에 추가
    addTaskToList({
      ...suggestion,
      assigneeId: getCurrentUserId() // 현재 사용자에게 할당
    });
  };

  return (
    <div className="dashboard">
      <AITaskSuggestions
        context="morning"
        familyMembers={familyMembers}
        onTaskSelect={handleTaskSelect}
        maxSuggestions={3}
      />
    </div>
  );
}
```

### Context Options

컨텍스트에 따른 제안 유형:

```typescript
const contextPrompts = {
  morning: "아침에 할 수 있는 가족 할일들",
  evening: "저녁에 할 수 있는 가족 할일들", 
  weekend: "주말에 가족이 함께할 수 있는 활동들",
  household: "집안 관리와 정리를 위한 할일들",
  health: "가족 건강과 운동을 위한 할일들",
  education: "학습과 교육을 위한 할일들",
  fun: "재미있고 창의적인 가족 활동들"
};
```

### Features

- **컨텍스트 기반**: 시간대/상황별 맞춤 제안
- **가족 고려**: 구성원 정보를 반영한 할일 생성
- **카테고리 필터**: 다양한 상황별 프롬프트
- **즉시 추가**: 클릭 한 번으로 할일 추가

## 🎨 Styling & Theming

### CSS 클래스 구조

```css
/* ClaudeAssistant */
.claude-assistant-modal { /* 모달 컨테이너 */ }
.claude-assistant-header { /* 헤더 영역 */ }
.claude-assistant-input { /* 입력 영역 */ }
.claude-assistant-suggestions { /* 제안 목록 */ }

/* SmartTaskInput */
.smart-task-input-container { /* 컨테이너 */ }
.smart-task-input-field { /* 입력 필드 */ }
.smart-task-input-enhance-btn { /* 향상 버튼 */ }
.smart-task-input-popup { /* 제안 팝업 */ }

/* AITaskSuggestions */
.ai-suggestions-widget { /* 위젯 컨테이너 */ }
.ai-suggestions-context { /* 컨텍스트 선택 */ }
.ai-suggestions-list { /* 제안 목록 */ }
.ai-suggestions-item { /* 개별 제안 */ }
```

### 커스텀 테마 적용

```tsx
// 테마 오버라이드
<ClaudeAssistant
  className="custom-ai-assistant"
  // ... 다른 props
/>

// CSS
.custom-ai-assistant {
  --ai-primary-color: #your-color;
  --ai-background: #your-bg;
  --ai-text-color: #your-text;
}
```

## 🔧 API Integration

### Claude API 호출 구조

```typescript
// lib/claude.ts에서 제공하는 메서드들
interface ClaudeAIService {
  generateTaskSuggestions(input: string): Promise<TaskSuggestion[]>;
  categorizeTask(title: string, description?: string): Promise<string>;
  improveTaskDescription(title: string, description?: string): Promise<string>;
  generateSubtasks(taskTitle: string, description?: string): Promise<string[]>;
  estimateTaskDuration(title: string, description?: string): Promise<number>;
  suggestTaskPriority(title: string, description?: string, dueDate?: Date): Promise<'low' | 'medium' | 'high'>;
}
```

### 사용 패턴

```typescript
import { useClaudeAI } from '@/lib/claude';

function MyComponent() {
  const { 
    isAvailable,           // API 사용 가능 여부
    generateTaskSuggestions,
    categorizeTask,
    // ... 다른 메서드들
  } = useClaudeAI();

  // 사용 가능 여부 확인 후 호출
  if (isAvailable) {
    const suggestions = await generateTaskSuggestions("주말 계획");
  }
}
```

## 🚨 Error Handling

### 에러 처리 패턴

```typescript
const handleAIRequest = async () => {
  try {
    setLoading(true);
    const result = await claudeAIService.generateTaskSuggestions(input);
    setSuggestions(result);
  } catch (error) {
    console.error('AI request failed:', error);
    setError('AI 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
  } finally {
    setLoading(false);
  }
};
```

### 사용자 피드백

```tsx
// 로딩 상태
{loading && (
  <div className="ai-loading">
    <Loader2 className="animate-spin" />
    <span>AI가 분석 중...</span>
  </div>
)}

// 오류 상태
{error && (
  <div className="ai-error">
    <AlertTriangle />
    <span>{error}</span>
  </div>
)}

// 사용 불가능 상태
{!isAvailable && (
  <div className="ai-unavailable">
    <MessageSquare />
    <span>AI 서비스를 사용할 수 없습니다</span>
  </div>
)}
```

## 🔍 Testing

### 컴포넌트 테스트

```typescript
// SmartTaskInput.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartTaskInput } from '@/components/ai';

describe('SmartTaskInput', () => {
  it('should trigger AI suggestion after typing delay', async () => {
    const mockSuggestion = jest.fn();
    
    render(
      <SmartTaskInput
        value=""
        onChange={jest.fn()}
        onSmartSuggestion={mockSuggestion}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '방 청소하기' } });

    await waitFor(() => {
      expect(mockSuggestion).toHaveBeenCalled();
    }, { timeout: 2000 });
  });
});
```

### Mock 데이터

```typescript
// test-utils/mockClaudeAPI.ts
export const mockTaskSuggestions = [
  {
    title: "방 청소하기",
    description: "침실과 거실 정리정돈",
    category: "household",
    priority: "medium",
    estimatedMinutes: 45
  }
];

export const mockClaudeAI = {
  isAvailable: true,
  generateTaskSuggestions: jest.fn().mockResolvedValue(mockTaskSuggestions),
  categorizeTask: jest.fn().mockResolvedValue("household"),
  // ... 다른 메서드들
};
```

## 📱 Accessibility

### ARIA 레이블

모든 AI 컴포넌트는 접근성을 고려하여 설계되었습니다:

```tsx
<WaveButton
  aria-label="AI로 할일 향상시키기"
  onClick={handleEnhance}
>
  <Sparkles />
</WaveButton>

<div role="dialog" aria-labelledby="ai-assistant-title">
  <h2 id="ai-assistant-title">Claude AI 어시스턴트</h2>
  {/* 컨텐츠 */}
</div>
```

### 키보드 탐색

- `Tab`: 포커스 이동
- `Enter`: 제안 선택/실행
- `Escape`: 모달/팝업 닫기
- `Space`: 버튼 활성화

## 🚀 Performance Tips

### 1. 요청 최적화

```typescript
// 디바운스를 사용한 요청 제한
const debouncedEnhance = useCallback(
  debounce(async (input: string) => {
    await handleAutoEnhance(input);
  }, 1500),
  [handleAutoEnhance]
);
```

### 2. 메모이제이션

```typescript
// 결과 캐싱
const memoizedSuggestions = useMemo(() => {
  return suggestions.map(suggestion => ({
    ...suggestion,
    id: generateId(suggestion)
  }));
}, [suggestions]);
```

### 3. 조건부 렌더링

```typescript
// 필요할 때만 컴포넌트 렌더링
{isAvailable && (
  <SmartTaskInput {...props} />
)}
```

## 📚 추가 정보

- [Claude API 문서](https://docs.anthropic.com/claude/docs)
- [React Hook 패턴](./HOOK_PATTERNS.md)
- [성능 최적화 가이드](./PERFORMANCE_GUIDE.md)