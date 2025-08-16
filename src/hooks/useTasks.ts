import { Timestamp } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../lib/firestore';
import { pointsService } from '../lib/points';
import {
  CreateTaskInput,
  Task,
  TaskFilters,
  TaskStats,
  UpdateTaskInput,
} from '../types/task';
import { toDate } from '../utils/dateHelpers';

export interface UseTasksOptions {
  groupId?: string;
  assigneeId?: string;
  limit?: number;
  filters?: TaskFilters;
  realtime?: boolean;
}

export interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  stats: TaskStats;
  createTask: (taskData: CreateTaskInput) => Promise<string>;
  updateTask: (taskId: string, updates: UpdateTaskInput) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskComplete: (taskId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useTasks = (options: UseTasksOptions = {}): UseTasksReturn => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateStats = useCallback((taskList: Task[]): TaskStats => {
    const total = taskList.length;
    const completed = taskList.filter(
      task => task.status === 'completed'
    ).length;
    const pending = taskList.filter(task => task.status === 'pending').length;
    const inProgress = taskList.filter(
      task => task.status === 'in_progress'
    ).length;

    const now = new Date();
    const overdue = taskList.filter(
      task =>
        task.dueDate &&
        toDate(task.dueDate) < now &&
        task.status !== 'completed'
    ).length;

    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    const byCategory = taskList.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = taskList.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byAssignee = taskList.reduce((acc, task) => {
      acc[task.assigneeId] = (acc[task.assigneeId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      completed,
      pending,
      inProgress,
      overdue,
      completionRate,
      byCategory,
      byPriority,
      byAssignee,
    };
  }, []);

  const createTask = useCallback(
    async (taskData: CreateTaskInput): Promise<string> => {
      if (!user) throw new Error('인증이 필요합니다.');

      try {
        setError(null);
        return await taskService.createTask(taskData);
      } catch (err) {
        const errorMessage = '할일 생성 중 오류가 발생했습니다.';
        console.error('Create task error:', err);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [user]
  );

  const updateTask = useCallback(
    async (taskId: string, updates: UpdateTaskInput): Promise<void> => {
      if (!user) throw new Error('인증이 필요합니다.');

      try {
        setError(null);
        await taskService.updateTask(taskId, updates);
      } catch (err) {
        const errorMessage = '할일 수정 중 오류가 발생했습니다.';
        console.error('Update task error:', err);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [user]
  );

  const deleteTask = useCallback(
    async (taskId: string): Promise<void> => {
      if (!user) throw new Error('인증이 필요합니다.');

      try {
        setError(null);
        await taskService.deleteTask(taskId);
      } catch (err) {
        const errorMessage = '할일 삭제 중 오류가 발생했습니다.';
        console.error('Delete task error:', err);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [user]
  );

  const toggleTaskComplete = useCallback(
    async (taskId: string): Promise<void> => {
      if (!user) throw new Error('인증이 필요합니다.');

      try {
        const task = tasks.find(t => t.id === taskId);
        if (!task) throw new Error('할일을 찾을 수 없습니다.');

        const isCompleted = task.status === 'completed';
        const newStatus = isCompleted ? 'pending' : 'completed';

        setError(null);

        // Optimistic update - immediately update local state
        setTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === taskId
              ? {
                  ...t,
                  status: newStatus,
                  completedAt: isCompleted ? undefined : Timestamp.now(),
                  completedBy: isCompleted ? undefined : user.uid,
                }
              : t
          )
        );

        try {
          await taskService.updateTask(taskId, {
            status: newStatus,
            completedAt: isCompleted ? undefined : Timestamp.now(),
            completedBy: isCompleted ? undefined : user.uid,
          });

          // 할일 완료 시 포인트 지급
          if (!isCompleted && task.groupId) {
            try {
              await pointsService.awardPointsForTaskCompletion(
                task.assigneeId,
                task.groupId,
                taskId,
                task.title
              );
            } catch (pointsError) {
              console.error('포인트 지급 실패:', pointsError);
              // 포인트 지급 실패는 할일 완료를 막지 않음
            }
          }
        } catch (updateError) {
          // Revert optimistic update on error
          setTasks(prevTasks =>
            prevTasks.map(t => (t.id === taskId ? task : t))
          );
          throw updateError;
        }
      } catch (err) {
        const errorMessage = '할일 상태 변경 중 오류가 발생했습니다.';
        console.error('Toggle task complete error:', err);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [user, tasks]
  );

  const refresh = useCallback(async (): Promise<void> => {
    if (!user || !options.groupId) return;

    try {
      setLoading(true);
      setError(null);
      const taskList = await taskService.getGroupTasks(options.groupId);
      setTasks(taskList);
    } catch (err) {
      const errorMessage = '할일을 새로고침하는 중 오류가 발생했습니다.';
      console.error('Refresh tasks error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, options.groupId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // realtime이 false인 경우 초기 데이터만 가져오기
    if (options.realtime === false) {
      const loadInitialData = async () => {
        try {
          let taskList: Task[] = [];

          if (options.groupId) {
            taskList = await taskService.getGroupTasks(options.groupId);
          } else {
            // 개인 할일 가져오기
            taskList = await taskService.getUserTasks(user.uid);
          }

          // 클라이언트 사이드 필터링 적용
          let filteredTasks = taskList;

          if (options.filters?.status) {
            filteredTasks = filteredTasks.filter(task =>
              options.filters!.status!.includes(task.status)
            );
          }

          if (options.filters?.priority) {
            filteredTasks = filteredTasks.filter(task =>
              options.filters!.priority!.includes(task.priority)
            );
          }

          if (options.filters?.category) {
            filteredTasks = filteredTasks.filter(task =>
              options.filters!.category!.includes(task.category)
            );
          }

          if (options.filters?.assigneeId) {
            filteredTasks = filteredTasks.filter(task =>
              options.filters!.assigneeId!.includes(task.assigneeId)
            );
          }

          if (options.limit && filteredTasks.length > options.limit) {
            filteredTasks = filteredTasks.slice(0, options.limit);
          }

          setTasks(filteredTasks);
        } catch (err) {
          console.error('Load initial data error:', err);
          setError('할일을 불러오는 중 오류가 발생했습니다.');
        } finally {
          setLoading(false);
        }
      };

      loadInitialData();
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const handleError = (error: Error) => {
      console.error('Tasks subscription error:', error);
      setError('할일을 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    };

    const handleTasks = (taskList: Task[]) => {
      // Apply client-side filtering if needed
      let filteredTasks = taskList;

      if (options.filters?.status) {
        filteredTasks = filteredTasks.filter(task =>
          options.filters!.status!.includes(task.status)
        );
      }

      if (options.filters?.priority) {
        filteredTasks = filteredTasks.filter(task =>
          options.filters!.priority!.includes(task.priority)
        );
      }

      if (options.filters?.category) {
        filteredTasks = filteredTasks.filter(task =>
          options.filters!.category!.includes(task.category)
        );
      }

      if (options.filters?.assigneeId) {
        filteredTasks = filteredTasks.filter(task =>
          options.filters!.assigneeId!.includes(task.assigneeId)
        );
      }

      if (options.limit && filteredTasks.length > options.limit) {
        filteredTasks = filteredTasks.slice(0, options.limit);
      }

      setTasks(filteredTasks);
      setLoading(false);
    };

    try {
      if (options.groupId) {
        // Subscribe to group tasks
        unsubscribe = taskService.subscribeToGroupTasks(
          options.groupId,
          handleTasks,
          handleError
        );
      } else {
        // Subscribe to all user tasks (개인 + 그룹 할일 모두 가져오기)
        unsubscribe = taskService.subscribeToUserTasks(
          user.uid,
          handleTasks,
          handleError
        );
      }
    } catch (err) {
      handleError(err as Error);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, options.groupId, options.filters, options.limit, options.realtime]);

  const stats = calculateStats(tasks);

  return {
    tasks,
    loading,
    error,
    stats,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    refresh,
  };
};

export default useTasks;
