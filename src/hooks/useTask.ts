import { Timestamp } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { commentService, taskService } from '../lib/firestore';
import logger from '../lib/logger';
import { Task, TaskActivity, TaskComment } from '../types/task';

export interface UseTaskOptions {
  taskId: string;
  realtime?: boolean;
  includeComments?: boolean;
  includeActivities?: boolean;
}

export interface UseTaskReturn {
  task: Task | null;
  comments: TaskComment[];
  activities: TaskActivity[];
  loading: boolean;
  error: string | null;
  addComment: (content: string, attachments?: unknown[]) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  toggleReaction: (commentId: string, emoji: string) => Promise<void>;
  logActivity: (
    action: TaskActivity['action'],
    details?: Record<string, unknown>
  ) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useTask = (options: UseTaskOptions): UseTaskReturn => {
  const { user } = useAuth();
  const {
    taskId,
    includeComments = true,
    realtime = true,
  } = options as {
    taskId: string;
    includeComments?: boolean;
    realtime?: boolean;
  };

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const addComment = useCallback(
    async (content: string, attachments?: unknown[]): Promise<void> => {
      if (!user || !taskId) throw new Error('인증이 필요합니다.');
      if (!content.trim() && (!attachments || attachments.length === 0)) {
        throw new Error('댓글 내용이나 첨부파일을 입력해주세요.');
      }

      try {
        setError(null);
        // undefined 값 필터링
        const validAttachments = attachments
          ? attachments.filter(att => att !== undefined && att !== null)
          : [];

        // 모든 필드에서 undefined 값 제거
        const commentData = {
          taskId: taskId || '',
          userId: user.uid || '',
          userName: user.displayName || user.email || '익명',
          userAvatar: user.photoURL || null,
          content: content.trim() || '',
          attachments: validAttachments,
          reactions: {},
        };

        // 최종 검증: undefined 값이 있는지 확인
        const sanitizedData = Object.fromEntries(
          Object.entries(commentData).filter(
            ([_, value]) => value !== undefined && value !== null
          )
        );

        // 추가 검증: 모든 필드가 유효한지 확인
        const finalData = {
          taskId: sanitizedData.taskId || '',
          userId: sanitizedData.userId || '',
          userName: sanitizedData.userName || '익명',
          userAvatar: sanitizedData.userAvatar || null,
          content: sanitizedData.content || '',
          attachments: Array.isArray(sanitizedData.attachments)
            ? sanitizedData.attachments
            : [],
          reactions: sanitizedData.reactions || {},
        };

        logger.debug('useTask', 'final comment data', finalData);
        logger.debug('useTask', 'data validation', {
          taskId: typeof finalData.taskId,
          userId: typeof finalData.userId,
          userName: typeof finalData.userName,
          userAvatar: typeof finalData.userAvatar,
          content: typeof finalData.content,
          attachments: Array.isArray(finalData.attachments),
          reactions: typeof finalData.reactions,
        });

        await commentService.addComment(taskId, finalData);
      } catch (err) {
        const errorMessage = '댓글 추가 중 오류가 발생했습니다.';
        logger.error('useTask', 'addComment failed', err);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [user, taskId]
  );

  const deleteComment = useCallback(
    async (commentId: string): Promise<void> => {
      if (!user || !taskId) throw new Error('인증이 필요합니다.');

      try {
        setError(null);
        await commentService.deleteComment(taskId, commentId);
      } catch (err) {
        const errorMessage = '댓글 삭제 중 오류가 발생했습니다.';
        logger.error('useTask', 'deleteComment failed', err);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [user, taskId]
  );

  const toggleReaction = useCallback(
    async (commentId: string, emoji: string): Promise<void> => {
      if (!user || !taskId) throw new Error('인증이 필요합니다.');

      try {
        setError(null);
        await commentService.addReaction(taskId, commentId, user.uid, emoji);
      } catch (err) {
        const errorMessage = '반응 추가 중 오류가 발생했습니다.';
        logger.error('useTask', 'toggleReaction failed', err);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [user, taskId]
  );

  const logActivity = useCallback(
    async (
      action: TaskActivity['action'],
      details?: Record<string, unknown>
    ): Promise<void> => {
      if (!user || !taskId) return;

      try {
        // Activity logging would need to be implemented in the Firestore service
        // For now, just log to console as a placeholder
        logger.info('useTask', 'activity logged', {
          taskId,
          userId: user.uid,
          action,
          details,
        });
      } catch (err) {
        logger.error('useTask', 'logActivity failed', err);
        // Don't throw error for activity logging failures
      }
    },
    [user, taskId]
  );

  const refresh = useCallback(async (): Promise<void> => {
    if (!taskId) return;

    try {
      setLoading(true);
      setError(null);

      // Refresh task data
      const taskData = await taskService.getTask(taskId);
      if (taskData) {
        // Validate and sanitize date fields
        const sanitizedTask = {
          ...taskData,
          createdAt: taskData.createdAt || null,
          updatedAt: taskData.updatedAt || null,
          // Task 타입은 undefined 허용이므로 null은 제거
          dueDate:
            (taskData.dueDate as unknown as Timestamp | undefined) || undefined,
          completedAt:
            (taskData.completedAt as unknown as Timestamp | undefined) ||
            undefined,
        };
        setTask(sanitizedTask);
      } else {
        setTask(null);
      }
    } catch (err) {
      const errorMessage = '할일을 새로고침하는 중 오류가 발생했습니다.';
      logger.error('useTask', 'refresh failed', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  // Set up subscriptions
  useEffect(() => {
    if (!taskId || !user) {
      setTask(null);
      setComments([]);
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let taskUnsubscribe: (() => void) | undefined;
    let commentsUnsubscribe: (() => void) | undefined;

    const handleError = (error: Error) => {
      logger.error('useTask', 'subscription error', error);
      setError('할일을 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    };

    try {
      if (realtime) {
        // Realtime subscription to a single task
        taskUnsubscribe = taskService.subscribeToTask(
          taskId,
          taskData => {
            if (taskData) {
              const sanitizedTask = {
                ...taskData,
                createdAt: (taskData as any).createdAt || null,
                updatedAt: (taskData as any).updatedAt || null,
                dueDate:
                  ((taskData as any).dueDate as unknown as
                    | Timestamp
                    | undefined) || undefined,
                completedAt:
                  ((taskData as any).completedAt as unknown as
                    | Timestamp
                    | undefined) || undefined,
              } as any;
              setTask(sanitizedTask);
            } else {
              setTask(null);
            }
            setLoading(false);
          },
          handleError
        );
      } else {
        // One-time fetch
        const loadTask = async () => {
          try {
            const taskData = await taskService.getTask(taskId);
            if (taskData) {
              const sanitizedTask = {
                ...taskData,
                createdAt: taskData.createdAt || null,
                updatedAt: taskData.updatedAt || null,
                dueDate:
                  (taskData.dueDate as unknown as Timestamp | undefined) ||
                  undefined,
                completedAt:
                  (taskData.completedAt as unknown as Timestamp | undefined) ||
                  undefined,
              };
              setTask(sanitizedTask);
            } else {
              setTask(null);
            }
            setLoading(false);
          } catch (err) {
            handleError(err as Error);
          }
        };
        loadTask();
      }

      // Subscribe to comments if needed
      if (includeComments) {
        commentsUnsubscribe = commentService.subscribeToTaskComments(
          taskId,
          (commentList: TaskComment[]) => {
            setComments(commentList);
          },
          handleError
        );
      }
    } catch (err) {
      handleError(err as Error);
    }

    return () => {
      if (taskUnsubscribe) taskUnsubscribe();
      if (commentsUnsubscribe) commentsUnsubscribe();
    };
  }, [taskId, user, includeComments, realtime]);

  return {
    task,
    comments,
    activities,
    loading,
    error,
    addComment,
    deleteComment,
    toggleReaction,
    logActivity,
    refresh,
  };
};

export default useTask;
