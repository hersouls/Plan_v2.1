import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import logger from '@/lib/logger';
import {
  Timestamp,
  addDoc,
  collection,
  limit as firestoreLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

export interface Activity {
  id: string;
  type:
    | 'task_created'
    | 'task_completed'
    | 'task_assigned'
    | 'task_updated'
    | 'comment_added'
    | 'member_joined'
    | 'status_changed';
  taskId?: string;
  groupId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  targetUserId?: string; // For assignments
  targetUserName?: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
}

export interface CreateActivityInput {
  type: Activity['type'];
  taskId?: string;
  groupId: string;
  targetUserId?: string;
  targetUserName?: string;
  metadata?: Record<string, unknown>;
}

export interface UseActivityOptions {
  groupId?: string;
  taskId?: string;
  limit?: number;
  realtime?: boolean;
}

export interface UseActivityReturn {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  logActivity: (data: CreateActivityInput) => Promise<void>;
  refresh: () => Promise<void>;
}

// Real-time user presence tracking
export interface UserPresence {
  userId: string;
  userName: string;
  userAvatar?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Timestamp;
  currentTask?: string;
  currentPage?: string;
}

export interface UsePresenceReturn {
  presence: UserPresence[];
  updatePresence: (
    status: UserPresence['status'],
    metadata?: Partial<UserPresence>
  ) => Promise<void>;
}

export const useActivity = (
  options: UseActivityOptions = {}
): UseActivityReturn => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildQuery = useCallback(() => {
    if (!user) return null;

    const constraints = [];

    if (options.groupId) {
      constraints.push(where('groupId', '==', options.groupId));
    }

    if (options.taskId) {
      constraints.push(where('taskId', '==', options.taskId));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (options.limit) {
      constraints.push(firestoreLimit(options.limit));
    }

    return query(collection(db, 'activities'), ...constraints);
  }, [user, options]);

  const fetchActivities = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const q = buildQuery();
      if (!q) return;

      if (options.realtime !== false) {
        // Real-time subscription
        const unsubscribe = onSnapshot(
          q,
          snapshot => {
            const activityList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            })) as Activity[];

            setActivities(activityList);
            setLoading(false);
          },
          err => {
            logger.error('useActivity', 'subscription error', err);
            setError('활동 정보를 불러오는 중 오류가 발생했습니다.');
            setLoading(false);
          }
        );

        return unsubscribe;
      }
    } catch (err) {
      logger.error('useActivity', 'fetch activities failed', err);
      setError('활동 정보를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }, [user, buildQuery, options.realtime]);

  const logActivity = useCallback(
    async (data: CreateActivityInput): Promise<void> => {
      if (!user) throw new Error('인증이 필요합니다.');

      try {
        const activityDoc = {
          ...data,
          userId: user.uid,
          userName: user.displayName || user.email || 'Anonymous',
          userAvatar: user.photoURL || undefined,
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'activities'), activityDoc);
      } catch (err) {
        logger.error('useActivity', 'logActivity failed', err);
        // Don't throw error to prevent disrupting main functionality
      }
    },
    [user]
  );

  const refresh = useCallback(async (): Promise<void> => {
    await fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      unsubscribe = await fetchActivities();
    };

    if (user) {
      setupSubscription();
    } else {
      setActivities([]);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, fetchActivities]);

  return {
    activities,
    loading,
    error,
    logActivity,
    refresh,
  };
};

// Real-time presence tracking
export const usePresence = (groupId: string): UsePresenceReturn => {
  const { user } = useAuth();
  const [presence, setPresence] = useState<UserPresence[]>([]);

  const updatePresence = useCallback(
    async (
      status: UserPresence['status'],
      metadata?: Partial<UserPresence>
    ): Promise<void> => {
      if (!user || !groupId) return;

      try {
        const presenceDoc = {
          userId: user.uid,
          userName: user.displayName || user.email || 'Anonymous',
          userAvatar: user.photoURL || undefined,
          status,
          lastSeen: serverTimestamp(),
          groupId,
          ...metadata,
        };

        await addDoc(collection(db, 'presence'), presenceDoc);
      } catch (err) {
        logger.error('useActivity', 'updatePresence failed', err);
      }
    },
    [user, groupId]
  );

  useEffect(() => {
    if (!user || !groupId) return;

    let unsubscribe: (() => void) | undefined;
    let heartbeatInterval: NodeJS.Timeout;

    const setupPresenceTracking = () => {
      // Track presence changes
      const q = query(
        collection(db, 'presence'),
        where('groupId', '==', groupId),
        orderBy('lastSeen', 'desc'),
        firestoreLimit(20)
      );

      unsubscribe = onSnapshot(q, snapshot => {
        const presenceList = snapshot.docs.map(doc =>
          doc.data()
        ) as UserPresence[];

        // Deduplicate by userId, keeping the latest
        const uniquePresence = presenceList.reduce((acc, current) => {
          const existing = acc.find(p => p.userId === current.userId);
          if (!existing || current.lastSeen > existing.lastSeen) {
            return [...acc.filter(p => p.userId !== current.userId), current];
          }
          return acc;
        }, [] as UserPresence[]);

        setPresence(uniquePresence);
      });

      // Send heartbeat every 30 seconds
      updatePresence('online');
      heartbeatInterval = setInterval(() => {
        updatePresence('online');
      }, 30000);
    };

    setupPresenceTracking();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      // Mark user as offline when component unmounts
      updatePresence('offline');
    };
  }, [user, groupId, updatePresence]);

  return {
    presence,
    updatePresence,
  };
};
