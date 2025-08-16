import { renderHook, act, waitFor } from '@testing-library/react';
import { useTasks } from '../useTasks';
import { taskService } from '../../lib/firestore';
import { useAuth } from '../../contexts/AuthContext';

// Mock dependencies
jest.mock('../../lib/firestore');
jest.mock('../../contexts/AuthContext');

const mockTaskService = taskService as jest.Mocked<typeof taskService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock task data
const mockTasks = [
  {
    id: 'task-1',
    title: 'Task 1',
    description: 'Description 1',
    status: 'pending' as const,
    priority: 'high' as const,
    category: 'work',
    assigneeId: 'user-1',
    groupId: 'group-1',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
    dueDate: new Date('2024-01-02T10:00:00Z'),
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
    title: 'Task 2',
    description: 'Description 2',
    status: 'completed' as const,
    priority: 'medium' as const,
    category: 'personal',
    assigneeId: 'user-1',
    groupId: 'group-1',
    createdAt: new Date('2024-01-01T09:00:00Z'),
    updatedAt: new Date('2024-01-01T15:00:00Z'),
    dueDate: new Date('2024-01-01T18:00:00Z'),
    tags: ['home'],
    watchers: [],
    mentionedUsers: [],
    attachments: [],
    reminders: [],
    completedAt: new Date('2024-01-01T15:00:00Z'),
    completedBy: 'user-1',
    completionNotes: null,
  },
];

const mockUser = {
  uid: 'user-1',
  email: 'test@example.com',
  displayName: 'Test User',
};

describe('useTasks', () => {
  let unsubscribeMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    unsubscribeMock = jest.fn();

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

    // Default successful mock implementations
    mockTaskService.subscribeToUserTasks.mockImplementation((userId, callback, onError) => {
      setTimeout(() => callback(mockTasks), 0);
      return unsubscribeMock;
    });

    mockTaskService.subscribeToGroupTasks.mockImplementation((groupId, callback, onError) => {
      setTimeout(() => callback(mockTasks), 0);
      return unsubscribeMock;
    });

    mockTaskService.createTask.mockResolvedValue('new-task-id');
    mockTaskService.updateTask.mockResolvedValue(undefined);
    mockTaskService.deleteTask.mockResolvedValue(undefined);
    mockTaskService.getGroupTasks.mockResolvedValue(mockTasks);
  });

  describe('초기 상태', () => {
    it('사용자가 로그인하지 않은 경우 빈 상태를 반환해야 한다', async () => {
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

      const { result } = renderHook(() => useTasks());

      expect(result.current.tasks).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('로딩 중일 때 loading 상태가 true여야 한다', () => {
      const { result } = renderHook(() => useTasks());

      expect(result.current.loading).toBe(true);
    });
  });

  describe('실시간 구독', () => {
    it('사용자 할일을 구독해야 한다', async () => {
      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(mockTaskService.subscribeToUserTasks).toHaveBeenCalledWith(
          mockUser.uid,
          expect.any(Function),
          expect.any(Function)
        );
      });

      await waitFor(() => {
        expect(result.current.tasks).toEqual(mockTasks);
        expect(result.current.loading).toBe(false);
      });
    });

    it('그룹 ID가 제공된 경우 그룹 할일을 구독해야 한다', async () => {
      const { result } = renderHook(() => useTasks({ groupId: 'group-1' }));

      await waitFor(() => {
        expect(mockTaskService.subscribeToGroupTasks).toHaveBeenCalledWith(
          'group-1',
          expect.any(Function),
          expect.any(Function)
        );
      });

      await waitFor(() => {
        expect(result.current.tasks).toEqual(mockTasks);
        expect(result.current.loading).toBe(false);
      });
    });

    it('컴포넌트 언마운트 시 구독을 해제해야 한다', () => {
      const { unmount } = renderHook(() => useTasks());

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe('할일 생성', () => {
    it('할일을 생성할 수 있어야 한다', async () => {
      const { result } = renderHook(() => useTasks());

      const newTask = {
        title: 'New Task',
        description: 'New Description',
        priority: 'medium' as const,
        category: 'work',
        assigneeId: 'user-1',
        groupId: 'group-1',
        dueDate: new Date('2024-01-03T10:00:00Z'),
        tags: ['new'],
      };

      await act(async () => {
        const taskId = await result.current.createTask(newTask);
        expect(taskId).toBe('new-task-id');
      });

      expect(mockTaskService.createTask).toHaveBeenCalledWith(newTask);
    });

    it('사용자가 로그인하지 않은 경우 에러를 던져야 한다', async () => {
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

      const { result } = renderHook(() => useTasks());

      await expect(
        result.current.createTask({
          title: 'Test',
          description: 'Test',
          priority: 'medium',
          category: 'work',
          assigneeId: 'user-1',
          groupId: 'group-1',
        })
      ).rejects.toThrow('인증이 필요합니다.');
    });
  });

  describe('할일 업데이트', () => {
    it('할일을 업데이트할 수 있어야 한다', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.updateTask('task-1', { title: 'Updated Task' });
      });

      expect(mockTaskService.updateTask).toHaveBeenCalledWith('task-1', { title: 'Updated Task' });
    });
  });

  describe('할일 삭제', () => {
    it('할일을 삭제할 수 있어야 한다', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.deleteTask('task-1');
      });

      expect(mockTaskService.deleteTask).toHaveBeenCalledWith('task-1');
    });
  });

  describe('할일 완료 토글', () => {
    it('할일의 완료 상태를 토글할 수 있어야 한다', async () => {
      const { result } = renderHook(() => useTasks());

      // Wait for initial tasks to load
      await waitFor(() => {
        expect(result.current.tasks.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.toggleTaskComplete('task-1');
      });

      expect(mockTaskService.updateTask).toHaveBeenCalledWith('task-1', {
        status: 'completed',
        completedAt: expect.any(Date),
        completedBy: mockUser.uid,
      });
    });

    it('완료된 할일을 미완료로 변경할 수 있어야 한다', async () => {
      const { result } = renderHook(() => useTasks());

      // Wait for initial tasks to load
      await waitFor(() => {
        expect(result.current.tasks.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.toggleTaskComplete('task-2'); // This is completed task
      });

      expect(mockTaskService.updateTask).toHaveBeenCalledWith('task-2', {
        status: 'pending',
        completedAt: null,
        completedBy: null,
      });
    });

    it('낙관적 업데이트를 수행해야 한다', async () => {
      const { result } = renderHook(() => useTasks());

      // Wait for initial tasks to load
      await waitFor(() => {
        expect(result.current.tasks.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.toggleTaskComplete('task-1');
      });

      // Should immediately update the local state
      const updatedTask = result.current.tasks.find(task => task.id === 'task-1');
      expect(updatedTask?.status).toBe('completed');
    });
  });

  describe('통계 계산', () => {
    it('할일 통계를 올바르게 계산해야 한다', async () => {
      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.tasks.length).toBeGreaterThan(0);
      });

      const { stats } = result.current;

      expect(stats.total).toBe(2);
      expect(stats.completed).toBe(1);
      expect(stats.pending).toBe(1);
      expect(stats.inProgress).toBe(0);
      expect(stats.completionRate).toBe(50); // 1/2 * 100 = 50%
    });

    it('카테고리별 통계를 계산해야 한다', async () => {
      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.tasks.length).toBeGreaterThan(0);
      });

      const { stats } = result.current;

      expect(stats.byCategory['work']).toBe(1);
      expect(stats.byCategory['personal']).toBe(1);
    });

    it('우선순위별 통계를 계산해야 한다', async () => {
      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.tasks.length).toBeGreaterThan(0);
      });

      const { stats } = result.current;

      expect(stats.byPriority['high']).toBe(1);
      expect(stats.byPriority['medium']).toBe(1);
    });
  });

  describe('에러 처리', () => {
    it('구독 에러를 처리해야 한다', async () => {
      const errorMessage = 'Subscription failed';
      mockTaskService.subscribeToUserTasks.mockImplementation((userId, callback, onError) => {
        setTimeout(() => onError!(new Error(errorMessage)), 0);
        return unsubscribeMock;
      });

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.error).toBe('할일을 불러오는 중 오류가 발생했습니다.');
        expect(result.current.loading).toBe(false);
      });
    });

    it('할일 생성 에러를 처리해야 한다', async () => {
      mockTaskService.createTask.mockRejectedValue(new Error('Creation failed'));

      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await expect(
          result.current.createTask({
            title: 'Test',
            description: 'Test',
            priority: 'medium',
            category: 'work',
            assigneeId: 'user-1',
            groupId: 'group-1',
          })
        ).rejects.toThrow('할일 생성 중 오류가 발생했습니다.');
      });
    });
  });
});