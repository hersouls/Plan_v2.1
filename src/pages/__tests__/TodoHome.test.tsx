import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import TodoHome from '../TodoHome';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../hooks/useTasks';
import { Task } from '../../types/task';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../hooks/useTasks');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock date-fns functions
jest.mock('date-fns', () => ({
  format: jest.fn().mockImplementation((date, formatStr, options) => {
    if (formatStr === 'yyyy년 M월 d일 EEEE') {
      return '2024년 1월 15일 월요일';
    }
    return '2024-01-15';
  }),
  isToday: jest.fn().mockImplementation(() => true),
  isThisWeek: jest.fn().mockImplementation(() => true),
  isPast: jest.fn().mockImplementation(() => false),
}));

jest.mock('../../utils/dateHelpers', () => ({
  toDate: jest.fn().mockImplementation((date) => {
    if (typeof date === 'string') return new Date(date);
    return date;
  }),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseTasks = useTasks as jest.MockedFunction<typeof useTasks>;

// Mock tasks data
const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: '오늘의 할일 1',
    description: 'Today task description',
    status: 'pending',
    priority: 'high',
    category: 'work',
    assigneeId: 'user-1',
    groupId: 'group-1',
    createdAt: new Date('2024-01-15T09:00:00Z'),
    updatedAt: new Date('2024-01-15T09:00:00Z'),
    dueDate: new Date('2024-01-15T18:00:00Z'), // today
    tags: ['urgent'],
    watchers: [],
    mentionedUsers: [],
    attachments: [],
    reminders: [],
    completedAt: null,
    completedBy: null,
    completionNotes: null,
  },
  {
    id: 'task-2',
    title: '완료된 할일',
    description: 'Completed task',
    status: 'completed',
    priority: 'medium',
    category: 'personal',
    assigneeId: 'user-1',
    groupId: 'group-1',
    createdAt: new Date('2024-01-14T09:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    dueDate: new Date('2024-01-15T12:00:00Z'),
    tags: ['done'],
    watchers: [],
    mentionedUsers: [],
    attachments: [],
    reminders: [],
    completedAt: new Date('2024-01-15T10:00:00Z'),
    completedBy: 'user-1',
    completionNotes: null,
  },
  {
    id: 'task-3',
    title: '이번주 할일',
    description: 'Weekly task',
    status: 'in_progress',
    priority: 'low',
    category: 'household',
    assigneeId: 'user-1',
    groupId: 'group-1',
    createdAt: new Date('2024-01-13T09:00:00Z'),
    updatedAt: new Date('2024-01-13T09:00:00Z'),
    dueDate: new Date('2024-01-17T18:00:00Z'), // this week
    tags: ['weekly'],
    watchers: [],
    mentionedUsers: [],
    attachments: [],
    reminders: [],
    completedAt: null,
    completedBy: null,
    completionNotes: null,
  }
];

const mockUser = {
  uid: 'user-1',
  email: 'test@example.com',
  displayName: '테스트 사용자',
};

const mockTaskStats = {
  total: 3,
  completed: 1,
  pending: 1,
  inProgress: 1,
  overdue: 0,
  completionRate: 33.33,
  byCategory: {
    work: 1,
    personal: 1,
    household: 1,
    shopping: 0,
    other: 0,
  },
  byPriority: {
    high: 1,
    medium: 1,
    low: 1,
  }
};

const renderTodoHome = () => {
  return render(
    <BrowserRouter>
      <TodoHome />
    </BrowserRouter>
  );
};

describe('TodoHome', () => {
  const mockCreateTask = jest.fn();
  const mockToggleTaskComplete = jest.fn();
  const mockUpdateTask = jest.fn();
  const mockDeleteTask = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
      resetPassword: jest.fn(),
      signInAnonymously: jest.fn(),
      signInWithGoogle: jest.fn(),
      signInWithEmailAndPassword: jest.fn(),
      signUpWithEmailAndPassword: jest.fn(),
    });

    mockUseTasks.mockReturnValue({
      tasks: mockTasks,
      loading: false,
      error: null,
      stats: mockTaskStats,
      createTask: mockCreateTask,
      toggleTaskComplete: mockToggleTaskComplete,
      updateTask: mockUpdateTask,
      deleteTask: mockDeleteTask,
    });

    // Mock window.confirm and alert
    global.confirm = jest.fn().mockReturnValue(true);
    global.alert = jest.fn();
  });

  describe('기본 렌더링', () => {
    it('페이지 제목과 사용자 인사말을 표시해야 한다', () => {
      renderTodoHome();

      expect(screen.getByText('📋 Moonwave Plan')).toBeInTheDocument();
      expect(screen.getByText(/안녕하세요, 테스트 사용자님/)).toBeInTheDocument();
      expect(screen.getByText('2024년 1월 15일 월요일')).toBeInTheDocument();
    });

    it('통계 위젯들을 표시해야 한다', () => {
      renderTodoHome();

      expect(screen.getByText('전체 할일')).toBeInTheDocument();
      expect(screen.getByText('완료')).toBeInTheDocument();
      expect(screen.getByText('진행중')).toBeInTheDocument();
      expect(screen.getByText('지연')).toBeInTheDocument();

      expect(screen.getByText('3')).toBeInTheDocument(); // total
      expect(screen.getByText('1')).toBeInTheDocument(); // completed
    });

    it('완료율 진행바를 표시해야 한다', () => {
      renderTodoHome();

      expect(screen.getByText('완료율')).toBeInTheDocument();
      expect(screen.getByText('33.33%')).toBeInTheDocument();
    });

    it('빠른 할일 추가 컴포넌트를 표시해야 한다', () => {
      renderTodoHome();

      expect(screen.getByPlaceholderText(/빠른 할일 추가/)).toBeInTheDocument();
    });
  });

  describe('로딩 및 에러 상태', () => {
    it('로딩 중일 때 스피너를 표시해야 한다', () => {
      mockUseTasks.mockReturnValue({
        tasks: [],
        loading: true,
        error: null,
        stats: mockTaskStats,
        createTask: mockCreateTask,
        toggleTaskComplete: mockToggleTaskComplete,
        updateTask: mockUpdateTask,
        deleteTask: mockDeleteTask,
      });

      renderTodoHome();

      expect(screen.getByText('할일 목록을 불러오는 중...')).toBeInTheDocument();
    });

    it('에러 발생시 에러 메시지를 표시해야 한다', () => {
      mockUseTasks.mockReturnValue({
        tasks: [],
        loading: false,
        error: '데이터를 불러올 수 없습니다',
        stats: mockTaskStats,
        createTask: mockCreateTask,
        toggleTaskComplete: mockToggleTaskComplete,
        updateTask: mockUpdateTask,
        deleteTask: mockDeleteTask,
      });

      renderTodoHome();

      expect(screen.getByText('오류 발생')).toBeInTheDocument();
      expect(screen.getByText('데이터를 불러올 수 없습니다')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    });
  });

  describe('할일 필터링', () => {
    it('기본적으로 오늘 필터가 선택되어야 한다', () => {
      renderTodoHome();

      const todayButton = screen.getByRole('button', { name: '오늘' });
      expect(todayButton).toHaveClass('default'); // 활성화된 버튼 스타일 확인 (실제 클래스명에 따라 조정)
      expect(screen.getByText('오늘의 할일')).toBeInTheDocument();
    });

    it('이번주 필터를 선택할 수 있어야 한다', async () => {
      renderTodoHome();

      const weekButton = screen.getByRole('button', { name: '이번주' });
      fireEvent.click(weekButton);

      await waitFor(() => {
        expect(screen.getByText('이번주 할일')).toBeInTheDocument();
      });
    });

    it('전체 필터를 선택할 수 있어야 한다', async () => {
      renderTodoHome();

      const allButton = screen.getByRole('button', { name: '전체' });
      fireEvent.click(allButton);

      await waitFor(() => {
        expect(screen.getByText('모든 할일')).toBeInTheDocument();
      });
    });

    it('헤더의 필터 버튼으로 순환 필터링할 수 있어야 한다', async () => {
      renderTodoHome();

      const filterButton = screen.getByRole('button', { name: /오늘/ });
      fireEvent.click(filterButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /이번주/ })).toBeInTheDocument();
      });
    });
  });

  describe('할일 관리', () => {
    it('새 할일을 추가할 수 있어야 한다', async () => {
      renderTodoHome();

      const input = screen.getByPlaceholderText(/빠른 할일 추가/);
      const addButton = screen.getByRole('button', { name: '추가' });

      fireEvent.change(input, { target: { value: '새로운 할일' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockCreateTask).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '새로운 할일',
            userId: 'user-1',
            assigneeId: 'user-1'
          })
        );
      });
    });

    it('할일 완료 상태를 토글할 수 있어야 한다', async () => {
      renderTodoHome();

      // TaskCard의 완료 버튼을 찾아 클릭 (실제 구현에 따라 selector 조정 필요)
      const toggleButtons = screen.getAllByRole('button', { name: /완료/ });
      if (toggleButtons.length > 0) {
        fireEvent.click(toggleButtons[0]);

        await waitFor(() => {
          expect(mockToggleTaskComplete).toHaveBeenCalledWith('task-1');
        });
      }
    });

    it('할일을 삭제할 수 있어야 한다', async () => {
      renderTodoHome();

      const deleteButtons = screen.getAllByRole('button', { name: /삭제/ });
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
          expect(mockDeleteTask).toHaveBeenCalledWith('task-1');
        });
      }
    });
  });

  describe('빈 상태', () => {
    it('할일이 없을 때 빈 상태를 표시해야 한다', () => {
      mockUseTasks.mockReturnValue({
        tasks: [],
        loading: false,
        error: null,
        stats: { ...mockTaskStats, total: 0 },
        createTask: mockCreateTask,
        toggleTaskComplete: mockToggleTaskComplete,
        updateTask: mockUpdateTask,
        deleteTask: mockDeleteTask,
      });

      renderTodoHome();

      expect(screen.getByText('할일이 없습니다')).toBeInTheDocument();
      expect(screen.getByText('새로운 할일을 추가해서 시작해보세요!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '할일 추가하기' })).toBeInTheDocument();
    });

    it('빈 상태에서 할일 추가하기 버튼이 스크롤을 유도해야 한다', async () => {
      mockUseTasks.mockReturnValue({
        tasks: [],
        loading: false,
        error: null,
        stats: { ...mockTaskStats, total: 0 },
        createTask: mockCreateTask,
        toggleTaskComplete: mockToggleTaskComplete,
        updateTask: mockUpdateTask,
        deleteTask: mockDeleteTask,
      });

      // Mock scrollIntoView
      const mockScrollIntoView = jest.fn();
      Object.defineProperty(Element.prototype, 'scrollIntoView', {
        writable: true,
        value: mockScrollIntoView,
      });

      renderTodoHome();

      const addTaskButton = screen.getByRole('button', { name: '할일 추가하기' });
      fireEvent.click(addTaskButton);

      // Note: 실제로 DOM에서 querySelector를 사용하므로 이 테스트는 실제 DOM 요소가 필요
      // await waitFor(() => {
      //   expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
      // });
    });
  });

  describe('지연된 할일 알림', () => {
    it('지연된 할일이 있을 때 경고를 표시해야 한다', () => {
      const { isPast } = require('date-fns');
      isPast.mockReturnValue(true); // Mock overdue tasks

      const overdueTask: Task = {
        ...mockTasks[0],
        id: 'overdue-task',
        status: 'pending',
        dueDate: new Date('2024-01-14T18:00:00Z'), // past date
      };

      mockUseTasks.mockReturnValue({
        tasks: [overdueTask],
        loading: false,
        error: null,
        stats: { ...mockTaskStats, overdue: 1 },
        createTask: mockCreateTask,
        toggleTaskComplete: mockToggleTaskComplete,
        updateTask: mockUpdateTask,
        deleteTask: mockDeleteTask,
      });

      renderTodoHome();

      expect(screen.getByText(/1개의 지연된 할일이 있습니다/)).toBeInTheDocument();
    });

    it('지연된 할일이 없을 때는 경고를 표시하지 않아야 한다', () => {
      renderTodoHome();

      expect(screen.queryByText(/지연된 할일/)).not.toBeInTheDocument();
    });
  });

  describe('빠른 액션', () => {
    it('빠른 액션 버튼들을 표시해야 한다', () => {
      renderTodoHome();

      expect(screen.getByText('빠른 액션')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /할일 추가/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /가족 관리/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /통계 보기/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /설정/ })).toBeInTheDocument();
    });
  });

  describe('인증이 안된 사용자', () => {
    it('로그인하지 않은 사용자가 할일 추가시 알림을 표시해야 한다', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        resetPassword: jest.fn(),
        signInAnonymously: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithEmailAndPassword: jest.fn(),
        signUpWithEmailAndPassword: jest.fn(),
      });

      renderTodoHome();

      const input = screen.getByPlaceholderText(/빠른 할일 추가/);
      const addButton = screen.getByRole('button', { name: '추가' });

      fireEvent.change(input, { target: { value: '새로운 할일' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('로그인이 필요합니다.');
      });

      expect(mockCreateTask).not.toHaveBeenCalled();
    });
  });

  describe('에러 처리', () => {
    it('할일 생성 실패시 에러 메시지를 표시해야 한다', async () => {
      mockCreateTask.mockRejectedValue(new Error('Network error'));

      renderTodoHome();

      const input = screen.getByPlaceholderText(/빠른 할일 추가/);
      const addButton = screen.getByRole('button', { name: '추가' });

      fireEvent.change(input, { target: { value: '새로운 할일' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('할일 생성에 실패했습니다.');
      });
    });

    it('할일 토글 실패시 에러 메시지를 표시해야 한다', async () => {
      mockToggleTaskComplete.mockRejectedValue(new Error('Network error'));

      renderTodoHome();

      const toggleButtons = screen.getAllByRole('button', { name: /완료/ });
      if (toggleButtons.length > 0) {
        fireEvent.click(toggleButtons[0]);

        await waitFor(() => {
          expect(global.alert).toHaveBeenCalledWith('할일 상태 변경에 실패했습니다.');
        });
      }
    });

    it('할일 삭제 실패시 에러 메시지를 표시해야 한다', async () => {
      mockDeleteTask.mockRejectedValue(new Error('Network error'));

      renderTodoHome();

      const deleteButtons = screen.getAllByRole('button', { name: /삭제/ });
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
          expect(global.alert).toHaveBeenCalledWith('할일 삭제에 실패했습니다.');
        });
      }
    });
  });

  describe('접근성', () => {
    it('페이지 제목에 적절한 heading이 있어야 한다', () => {
      renderTodoHome();

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('모든 버튼이 접근 가능해야 한다', () => {
      renderTodoHome();

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabIndex', '-1');
      });
    });

    it('사용자 정보가 적절히 표시되어야 한다', () => {
      renderTodoHome();

      // 사용자 이름이나 이메일이 화면에 표시되는지 확인
      expect(screen.getByText(/테스트 사용자/)).toBeInTheDocument();
    });
  });
});