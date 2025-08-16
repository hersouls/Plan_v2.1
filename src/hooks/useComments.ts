import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  parentId?: string; // For reply comments
  reactions: Record<string, string[]>; // emoji -> [userId...]
  mentions: string[]; // mentioned user IDs
  isEdited: boolean;
  editedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateCommentInput {
  taskId: string;
  content: string;
  parentId?: string;
  mentions?: string[];
}

export interface UpdateCommentInput {
  content?: string;
  reactions?: Record<string, string[]>;
}

export interface UseCommentsOptions {
  taskId: string;
  realtime?: boolean;
}

export interface UseCommentsReturn {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  addComment: (data: CreateCommentInput) => Promise<string>;
  updateComment: (commentId: string, updates: UpdateCommentInput) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  addReaction: (commentId: string, emoji: string) => Promise<void>;
  removeReaction: (commentId: string, emoji: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useComments = ({ taskId, realtime = true }: UseCommentsOptions): UseCommentsReturn => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!user || !taskId) return;

    try {
      setLoading(true);
      setError(null);

      const q = query(
        collection(db, 'comments'),
        where('taskId', '==', taskId),
        orderBy('createdAt', 'asc')
      );

      if (realtime) {
        // Real-time subscription
        const unsubscribe = onSnapshot(q,
          (snapshot) => {
            const commentList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            })) as Comment[];
            
            setComments(commentList);
            setLoading(false);
          },
          (err) => {
            console.error('Comments subscription error:', err);
            setError('댓글을 불러오는 중 오류가 발생했습니다.');
            setLoading(false);
          }
        );

        return unsubscribe;
      }
    } catch (err) {
      console.error('Fetch comments error:', err);
      setError('댓글을 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }, [user, taskId, realtime]);

  const addComment = useCallback(async (data: CreateCommentInput): Promise<string> => {
    if (!user) throw new Error('인증이 필요합니다.');

    try {
      const commentDoc = {
        ...data,
        userId: user.uid,
        userName: user.displayName || user.email || 'Anonymous',
        userAvatar: user.photoURL || undefined,
        reactions: {},
        mentions: data.mentions || [],
        isEdited: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'comments'), commentDoc);
      
      // Create activity log
      await addDoc(collection(db, 'activities'), {
        type: 'comment_added',
        taskId: data.taskId,
        userId: user.uid,
        userName: user.displayName || user.email || 'Anonymous',
        metadata: {
          commentId: docRef.id,
          preview: data.content.substring(0, 100),
        },
        createdAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (err) {
      console.error('Add comment error:', err);
      throw new Error('댓글 추가 중 오류가 발생했습니다.');
    }
  }, [user]);

  const updateComment = useCallback(async (commentId: string, updates: UpdateCommentInput): Promise<void> => {
    if (!user) throw new Error('인증이 필요합니다.');

    try {
      const commentRef = doc(db, 'comments', commentId);
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      if (updates.content) {
        updateData.isEdited = true;
        updateData.editedAt = serverTimestamp();
      }

      await updateDoc(commentRef, updateData);
    } catch (err) {
      console.error('Update comment error:', err);
      throw new Error('댓글 수정 중 오류가 발생했습니다.');
    }
  }, [user]);

  const deleteComment = useCallback(async (commentId: string): Promise<void> => {
    if (!user) throw new Error('인증이 필요합니다.');

    try {
      const commentRef = doc(db, 'comments', commentId);
      await deleteDoc(commentRef);
    } catch (err) {
      console.error('Delete comment error:', err);
      throw new Error('댓글 삭제 중 오류가 발생했습니다.');
    }
  }, [user]);

  const addReaction = useCallback(async (commentId: string, emoji: string): Promise<void> => {
    if (!user) throw new Error('인증이 필요합니다.');

    try {
      const comment = comments.find(c => c.id === commentId);
      if (!comment) throw new Error('댓글을 찾을 수 없습니다.');

      const reactions = { ...comment.reactions };
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }
      
      if (!reactions[emoji].includes(user.uid)) {
        reactions[emoji].push(user.uid);
      }

      await updateComment(commentId, { reactions });
    } catch (err) {
      console.error('Add reaction error:', err);
      throw new Error('반응 추가 중 오류가 발생했습니다.');
    }
  }, [user, comments, updateComment]);

  const removeReaction = useCallback(async (commentId: string, emoji: string): Promise<void> => {
    if (!user) throw new Error('인증이 필요합니다.');

    try {
      const comment = comments.find(c => c.id === commentId);
      if (!comment) throw new Error('댓글을 찾을 수 없습니다.');

      const reactions = { ...comment.reactions };
      if (reactions[emoji]) {
        reactions[emoji] = reactions[emoji].filter(uid => uid !== user.uid);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      }

      await updateComment(commentId, { reactions });
    } catch (err) {
      console.error('Remove reaction error:', err);
      throw new Error('반응 제거 중 오류가 발생했습니다.');
    }
  }, [user, comments, updateComment]);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      unsubscribe = await fetchComments();
    };

    if (user && taskId) {
      setupSubscription();
    } else {
      setComments([]);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, taskId, fetchComments]);

  return {
    comments,
    loading,
    error,
    addComment,
    updateComment,
    deleteComment,
    addReaction,
    removeReaction,
    refresh,
  };
};