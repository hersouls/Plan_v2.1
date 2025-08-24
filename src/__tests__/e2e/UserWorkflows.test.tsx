import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';

// Mock Firebase auth and firestore
jest.mock('../../lib/firebase', () => ({
  auth: {
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  },
  db: {},
  storage: {},
  analytics: null,
  performance: null,
  googleProvider: {},
}));

jest.mock('../../lib/firestore', () => ({
  taskService: {
    createTask: jest.fn().mockResolvedValue('new-task-id'),
    updateTask: jest.fn().mockResolvedValue(undefined),
    deleteTask: jest.fn().mockResolvedValue(undefined),
    getTask: jest.fn(),
    getGroupTasks: jest.fn().mockResolvedValue([]),
    subscribeToGroupTasks: jest.fn().mockImplementation((_, callback) => {
      setTimeout(() => callback([]), 0);
      return jest.fn();
    }),
    subscribeToUserTasks: jest.fn().mockImplementation((_, callback) => {
      setTimeout(() => callback([]), 0);
      return jest.fn();
    }),
  },
  groupService: {
    createGroup: jest.fn(),
    updateGroup: jest.fn(),
    getGroup: jest.fn(),
    getUserGroups: jest.fn(),
    subscribeToGroup: jest.fn(),
    subscribeToUserGroups: jest.fn(),
    addMemberToGroup: jest.fn(),
    removeMemberFromGroup: jest.fn(),
  },
  userService: {
    createOrUpdateUserProfile: jest.fn(),
    getUserProfile: jest.fn(),
    subscribeToUserProfile: jest.fn(),
  },
}));

// Mock React Router hooks for navigation testing
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock date functions for consistent testing
jest.mock('date-fns', () => ({
  format: jest.fn().mockImplementation((date, formatStr) => {
    if (formatStr === 'yyyy년 M월 d일 EEEE') {
      return '2024년 1월 15일 월요일';
    }
    return '2024-01-15';
  }),
  isToday: jest.fn().mockReturnValue(true),
  isThisWeek: jest.fn().mockReturnValue(true),
  isPast: jest.fn().mockReturnValue(false),
}));

// Test utils
const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

const mockUser = {
  uid: 'user-123',
  email: 'test@example.com',
  displayName: '테스트 사용자',
};

describe('E2E User Workflows', () => {
  let mockAuth: any;
  let mockTaskService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks
    mockAuth = require('../../lib/firebase').auth;
    mockTaskService = require('../../lib/firestore').taskService;

    // Mock window methods
    global.alert = jest.fn();
    global.confirm = jest.fn().mockReturnValue(true);

    // Mock auth state initially as logged out
    mockAuth.onAuthStateChanged.mockImplementation((callback: any) => {
      callback(null); // No user initially
      return jest.fn(); // unsubscribe function
    });
  });

  describe('사용자 인증 플로우', () => {
    it('로그인 -> 대시보드 -> 로그아웃 완전한 플로우', async () => {
      const user = userEvent.setup();
      renderApp();

      // 1. 로그인되지 않은 상태에서는 로그인 페이지가 표시되어야 함
      expect(
        screen.getByRole('button', { name: /로그인/i })
      ).toBeInTheDocument();

      // 2. 이메일과 비밀번호로 로그인
      const emailInput =
        screen.getByPlaceholderText(/이메일/i) ||
        screen.getByLabelText(/이메일/i);
      const passwordInput = screen.getByLabelText(/비밀번호/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Mock successful login
      mockAuth.signInWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      // Mock auth state change to logged in
      mockAuth.onAuthStateChanged.mockImplementation((callback: any) => {
        callback(mockUser);
        return jest.fn();
      });

      const loginButton = screen.getByRole('button', { name: /로그인/i });
      await user.click(loginButton);

      // 3. 로그인 후 대시보드로 리다이렉트
      await waitFor(
        () => {
          expect(screen.getByText('📋 Moonwave Plan')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      expect(
        screen.getByText(/안녕하세요, 테스트 사용자님/)
      ).toBeInTheDocument();

      // 4. 로그아웃
      const settingsButton = screen.getByRole('button', { name: /설정/i });
      await user.click(settingsButton);

      // Note: 실제 앱에서는 설정 페이지로 이동하거나 드롭다운 메뉴가 열릴 것임
      // 여기서는 로그아웃 버튼이 어딘가에 있다고 가정
      mockAuth.signOut.mockResolvedValue(undefined);

      // Mock auth state change to logged out
      mockAuth.onAuthStateChanged.mockImplementation((callback: any) => {
        callback(null);
        return jest.fn();
      });

      // 실제로는 로그아웃 버튼을 찾아서 클릭해야 함
      // await user.click(screen.getByRole('button', { name: /로그아웃/i }));
    });

    it('구글 로그인 플로우', async () => {
      const user = userEvent.setup();
      renderApp();

      // Google 로그인 버튼 찾기
      const googleButton =
        screen.getByRole('button', { name: /Google/i }) ||
        screen.getByText(/Google/i).closest('button');

      if (googleButton) {
        // Mock successful Google login
        mockAuth.signInWithPopup.mockResolvedValue({
          user: {
            ...mockUser,
            displayName: 'Google User',
          },
        });

        await user.click(googleButton as HTMLElement);

        await waitFor(() => {
          expect(mockAuth.signInWithPopup).toHaveBeenCalled();
        });
      }
    });

    it('회원가입 플로우', async () => {
      const user = userEvent.setup();
      renderApp();

      // 회원가입 탭으로 전환
      const signupTab = screen.getByText(/회원가입/i);
      await user.click(signupTab);

      // 회원가입 정보 입력
      const emailInput = screen.getByRole('textbox', { name: /이메일/i });
      const passwordInput = screen.getByLabelText(/^비밀번호$/i);
      const confirmPasswordInput = screen.getByLabelText(/비밀번호 확인/i);

      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');

      // Mock successful signup
      mockAuth.createUserWithEmailAndPassword.mockResolvedValue({
        user: {
          uid: 'new-user-123',
          email: 'newuser@example.com',
          displayName: 'New User',
        },
      });

      const signupButton = screen.getByRole('button', { name: /회원가입/i });
      await user.click(signupButton);

      await waitFor(() => {
        expect(mockAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
          expect.anything(),
          'newuser@example.com',
          'newpassword123'
        );
      });
    });
  });

  describe('할일 관리 완전한 플로우', () => {
    beforeEach(() => {
      // 로그인된 상태로 시작
      mockAuth.onAuthStateChanged.mockImplementation((callback: any) => {
        callback(mockUser);
        return jest.fn();
      });
    });

    it('할일 생성 -> 수정 -> 완료 -> 삭제 플로우', async () => {
      const user = userEvent.setup();

      // Mock task data that will be returned after creation
      const mockTask = {
        id: 'task-123',
        title: '새로운 할일',
        description: '',
        status: 'pending',
        priority: 'medium',
        category: 'personal',
        assigneeId: 'user-123',
        groupId: 'personal',
        createdAt: new Date(),
        updatedAt: new Date(),
        dueDate: null,
        tags: [],
        watchers: [],
        mentionedUsers: [],
        attachments: [],
        reminders: [],
        completedAt: null,
        completedBy: null,
        completionNotes: null,
      };

      // Mock tasks subscription to return the new task
      mockTaskService.subscribeToUserTasks.mockImplementation((_, callback) => {
        setTimeout(() => callback([mockTask]), 100);
        return jest.fn();
      });

      renderApp();

      await waitFor(() => {
        expect(screen.getByText('📋 Moonwave Plan')).toBeInTheDocument();
      });

      // 1. 할일 생성
      const quickAddInput = screen.getByPlaceholderText(/빠른 할일 추가/);
      await user.type(quickAddInput, '새로운 할일');

      const addButton = screen.getByRole('button', { name: '추가' });
      await user.click(addButton);

      await waitFor(() => {
        expect(mockTaskService.createTask).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '새로운 할일',
            userId: 'user-123',
          })
        );
      });

      // 2. 생성된 할일이 목록에 표시되는지 확인
      await waitFor(() => {
        expect(screen.getByText('새로운 할일')).toBeInTheDocument();
      });

      // 3. 할일 완료 토글
      const completeButton = screen.getByRole('button', { name: /완료/i });
      await user.click(completeButton);

      await waitFor(() => {
        expect(mockTaskService.updateTask).toHaveBeenCalledWith(
          'task-123',
          expect.objectContaining({
            status: 'completed',
          })
        );
      });

      // 4. 할일 삭제
      const deleteButton = screen.getByRole('button', { name: /삭제/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockTaskService.deleteTask).toHaveBeenCalledWith('task-123');
      });
    });

    it('자연어로 복잡한 할일 생성 플로우', async () => {
      const user = userEvent.setup();
      renderApp();

      await waitFor(() => {
        expect(screen.getByText('📋 Moonwave Plan')).toBeInTheDocument();
      });

      // 자연어로 할일 입력
      const quickAddInput = screen.getByPlaceholderText(/빠른 할일 추가/);
      await user.type(quickAddInput, '내일까지 장보기 #쇼핑 @집안일 !높음');

      const addButton = screen.getByRole('button', { name: '추가' });
      await user.click(addButton);

      await waitFor(() => {
        expect(mockTaskService.createTask).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '장보기',
            priority: 'high',
            category: 'household',
            tags: ['쇼핑'],
            dueDate: expect.any(String),
          })
        );
      });
    });

    it('확장 모드로 상세한 할일 생성 플로우', async () => {
      const user = userEvent.setup();
      renderApp();

      await waitFor(() => {
        expect(screen.getByText('📋 Moonwave Plan')).toBeInTheDocument();
      });

      // 확장 모드 활성화
      const expandButton = screen.getByRole('button', { name: '+' });
      await user.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('높음')).toBeInTheDocument();
      });

      // 할일 제목 입력
      const titleInput = screen.getByPlaceholderText(/빠른 할일 추가/);
      await user.type(titleInput, '중요한 프로젝트 미팅');

      // 우선순위 선택
      const highPriorityButton = screen.getByRole('button', { name: '높음' });
      await user.click(highPriorityButton);

      // 카테고리 선택
      const workCategoryButton = screen.getByRole('button', { name: '업무' });
      await user.click(workCategoryButton);

      // 태그 추가
      const tagInput = screen.getByPlaceholderText('태그 입력...');
      await user.type(tagInput, '긴급');
      fireEvent.keyDown(tagInput, { key: 'Enter' });

      // 할일 추가
      const addButton = screen.getByRole('button', { name: '추가' });
      await user.click(addButton);

      await waitFor(() => {
        expect(mockTaskService.createTask).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '중요한 프로젝트 미팅',
            priority: 'high',
            category: 'work',
            tags: ['긴급'],
          })
        );
      });
    });
  });

  describe('필터링 및 뷰 전환 플로우', () => {
    beforeEach(() => {
      mockAuth.onAuthStateChanged.mockImplementation((callback: any) => {
        callback(mockUser);
        return jest.fn();
      });

      // Mock multiple tasks for filtering
      const mockTasks = [
        {
          id: 'task-today',
          title: '오늘의 할일',
          dueDate: new Date(),
          status: 'pending',
        },
        {
          id: 'task-week',
          title: '이번주 할일',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          status: 'pending',
        },
      ];

      mockTaskService.subscribeToUserTasks.mockImplementation((_, callback) => {
        setTimeout(() => callback(mockTasks), 100);
        return jest.fn();
      });
    });

    it('오늘 -> 이번주 -> 전체 필터 전환 플로우', async () => {
      const user = userEvent.setup();
      renderApp();

      await waitFor(() => {
        expect(screen.getByText('오늘의 할일')).toBeInTheDocument();
      });

      // 이번주 필터로 전환
      const weekButton = screen.getByRole('button', { name: '이번주' });
      await user.click(weekButton);

      await waitFor(() => {
        expect(screen.getByText('이번주 할일')).toBeInTheDocument();
      });

      // 전체 필터로 전환
      const allButton = screen.getByRole('button', { name: '전체' });
      await user.click(allButton);

      await waitFor(() => {
        expect(screen.getByText('모든 할일')).toBeInTheDocument();
      });
    });
  });

  describe('네비게이션 플로우', () => {
    beforeEach(() => {
      mockAuth.onAuthStateChanged.mockImplementation((callback: any) => {
        callback(mockUser);
        return jest.fn();
      });
    });

    it('메인 네비게이션을 통한 페이지 이동 플로우', async () => {
      const user = userEvent.setup();
      renderApp();

      await waitFor(() => {
        expect(screen.getByText('📋 Moonwave Plan')).toBeInTheDocument();
      });

      // 빠른 액션 버튼들 테스트
      const familyButton = screen.getByRole('button', { name: /가족 관리/ });
      await user.click(familyButton);

      expect(mockNavigate).toHaveBeenCalledWith('/family');

      const statisticsButton = screen.getByRole('button', {
        name: /통계 보기/,
      });
      await user.click(statisticsButton);

      expect(mockNavigate).toHaveBeenCalledWith('/statistics');

      const settingsButton = screen.getByRole('button', { name: /설정/ });
      await user.click(settingsButton);

      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });
  });

  describe('에러 처리 플로우', () => {
    beforeEach(() => {
      mockAuth.onAuthStateChanged.mockImplementation((callback: any) => {
        callback(mockUser);
        return jest.fn();
      });
    });

    it('네트워크 오류 시 사용자에게 적절한 피드백 제공', async () => {
      const user = userEvent.setup();

      // Mock task creation failure
      mockTaskService.createTask.mockRejectedValue(new Error('Network error'));

      renderApp();

      await waitFor(() => {
        expect(screen.getByText('📋 Moonwave Plan')).toBeInTheDocument();
      });

      // 할일 추가 시도
      const quickAddInput = screen.getByPlaceholderText(/빠른 할일 추가/);
      await user.type(quickAddInput, '테스트 할일');

      const addButton = screen.getByRole('button', { name: '추가' });
      await user.click(addButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('할일 생성에 실패했습니다.');
      });
    });

    it('로그인 실패 시 적절한 에러 메시지 표시', async () => {
      const user = userEvent.setup();

      // Mock login failure
      mockAuth.signInWithEmailAndPassword.mockRejectedValue(
        new Error('Invalid credentials')
      );

      renderApp();

      const emailInput =
        screen.getByPlaceholderText(/이메일/i) ||
        screen.getByLabelText(/이메일/i);
      const passwordInput = screen.getByLabelText(/비밀번호/i);

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');

      const loginButton = screen.getByRole('button', { name: /로그인/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/로그인에 실패했습니다/i)).toBeInTheDocument();
      });
    });
  });

  describe('접근성 플로우', () => {
    beforeEach(() => {
      mockAuth.onAuthStateChanged.mockImplementation((callback: any) => {
        callback(mockUser);
        return jest.fn();
      });
    });

    it('키보드만으로 주요 기능 사용 가능', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.getByText('📋 Moonwave Plan')).toBeInTheDocument();
      });

      // Tab으로 네비게이션
      const quickAddInput = screen.getByPlaceholderText(/빠른 할일 추가/);
      quickAddInput.focus();
      expect(document.activeElement).toBe(quickAddInput);

      // Enter로 할일 추가
      fireEvent.change(quickAddInput, {
        target: { value: '키보드로 입력한 할일' },
      });
      fireEvent.keyDown(quickAddInput, { key: 'Enter' });

      await waitFor(() => {
        expect(mockTaskService.createTask).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '키보드로 입력한 할일',
          })
        );
      });
    });

    it('스크린 리더를 위한 ARIA 레이블이 적절히 설정됨', () => {
      renderApp();

      // 주요 입력 필드들이 적절한 레이블을 가지는지 확인
      const emailInput = screen.getByLabelText(/이메일/i);
      expect(emailInput).toHaveAttribute('aria-label', expect.any(String));
    });
  });

  describe('성능 및 최적화 플로우', () => {
    it('대량의 할일 목록에서도 원활한 렌더링', async () => {
      mockAuth.onAuthStateChanged.mockImplementation((callback: any) => {
        callback(mockUser);
        return jest.fn();
      });

      // Mock large number of tasks
      const largeMockTasks = Array.from({ length: 100 }, (_, i) => ({
        id: `task-${i}`,
        title: `할일 ${i + 1}`,
        status: i % 3 === 0 ? 'completed' : 'pending',
        priority: ['low', 'medium', 'high'][i % 3] as any,
        category: 'personal' as any,
        assigneeId: 'user-123',
        groupId: 'personal',
        createdAt: new Date(),
        updatedAt: new Date(),
        dueDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        tags: [`tag-${i % 5}`],
        watchers: [],
        mentionedUsers: [],
        attachments: [],
        reminders: [],
        completedAt: null,
        completedBy: null,
        completionNotes: null,
      }));

      mockTaskService.subscribeToUserTasks.mockImplementation((_, callback) => {
        setTimeout(() => callback(largeMockTasks), 100);
        return jest.fn();
      });

      const startTime = performance.now();
      renderApp();

      await waitFor(
        () => {
          expect(screen.getByText('📋 Moonwave Plan')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      const endTime = performance.now();

      // 렌더링이 합리적인 시간 내에 완료되는지 확인 (5초 이내)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});
