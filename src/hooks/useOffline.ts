import { db } from '@/lib/firebase';
import logger from '@/lib/logger';
import { disableNetwork, enableNetwork } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId?: string;
  data: Record<string, unknown>;
  timestamp: number;
  retry: number;
}

export interface UseOfflineReturn {
  isOnline: boolean;
  isConnected: boolean;
  pendingActions: OfflineAction[];
  queueOfflineAction: (
    action: Omit<OfflineAction, 'id' | 'timestamp' | 'retry'>
  ) => void;
  syncPendingActions: () => Promise<void>;
  clearPendingActions: () => void;
  enableOfflineMode: () => Promise<void>;
  disableOfflineMode: () => Promise<void>;
}

const OFFLINE_QUEUE_KEY = 'moonwave_offline_queue';
const MAX_RETRY_ATTEMPTS = 3;

export const useOffline = (): UseOfflineReturn => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnected, setIsConnected] = useState(true);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);

  // Load pending actions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (saved) {
      try {
        const actions = JSON.parse(saved);
        setPendingActions(actions);
      } catch (error) {
        logger.error('useOffline', 'load queue failed', error);
        localStorage.removeItem(OFFLINE_QUEUE_KEY);
      }
    }
  }, []);

  // Save pending actions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(pendingActions));
  }, [pendingActions]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setIsConnected(true);

      // Re-enable Firestore network
      try {
        await enableNetwork(db);
        logger.info('useOffline', 'firestore network re-enabled');
      } catch (error) {
        logger.error('useOffline', 'enable network failed', error);
      }

      // Sync pending actions when coming back online
      if (pendingActions.length > 0) {
        syncPendingActions();
      }
    };

    const handleOffline = async () => {
      setIsOnline(false);
      logger.warn('useOffline', 'device offline');
    };

    // Check Firestore connection status
    const checkFirestoreConnection = () => {
      // Simple connectivity test - you might want to implement a more sophisticated check
      fetch('https://www.google.com/favicon.ico', {
        mode: 'no-cors',
        cache: 'no-cache',
      })
        .then(() => setIsConnected(true))
        .catch(() => setIsConnected(false));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection periodically
    const connectionCheck = setInterval(checkFirestoreConnection, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectionCheck);
    };
  }, [pendingActions.length, syncPendingActions]);

  const queueOfflineAction = useCallback(
    (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retry'>) => {
      const offlineAction: OfflineAction = {
        ...action,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        retry: 0,
      };

      setPendingActions(prev => [...prev, offlineAction]);
      logger.info('useOffline', 'queued action', offlineAction);
    },
    []
  );

  const syncPendingActions = useCallback(async (): Promise<void> => {
    if (!isOnline || pendingActions.length === 0) return;

    logger.info('useOffline', `syncing ${pendingActions.length} actions`);

    for (const action of pendingActions) {
      try {
        // Attempt to execute the action
        await executeAction(action);

        // Remove successful action from queue
        setPendingActions(prev => prev.filter(a => a.id !== action.id));

        logger.info('useOffline', 'synced action', action.id);
      } catch (error) {
        logger.error('useOffline', 'sync action failed', {
          id: action.id,
          error,
        });

        // Increment retry count
        const updatedAction = { ...action, retry: action.retry + 1 };

        if (updatedAction.retry >= MAX_RETRY_ATTEMPTS) {
          // Remove failed action after max retries
          setPendingActions(prev => prev.filter(a => a.id !== action.id));
          logger.error('useOffline', 'action failed permanently', action.id);
        } else {
          // Update retry count
          setPendingActions(prev =>
            prev.map(a => (a.id === action.id ? updatedAction : a))
          );
        }
      }
    }
  }, [isOnline, pendingActions]);

  const executeAction = async (action: OfflineAction): Promise<void> => {
    const { collection: collectionName, type, docId, data } = action;

    // Import Firestore functions dynamically to avoid circular dependencies
    const { collection, addDoc, updateDoc, deleteDoc, doc } = await import(
      'firebase/firestore'
    );

    switch (type) {
      case 'create':
        await addDoc(collection(db, collectionName), data);
        break;

      case 'update':
        if (!docId) throw new Error('Document ID required for update');
        await updateDoc(doc(db, collectionName, docId), data);
        break;

      case 'delete':
        if (!docId) throw new Error('Document ID required for delete');
        await deleteDoc(doc(db, collectionName, docId));
        break;

      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  };

  const clearPendingActions = useCallback(() => {
    setPendingActions([]);
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }, []);

  const enableOfflineMode = useCallback(async (): Promise<void> => {
    try {
      await disableNetwork(db);
      setIsConnected(false);
      logger.info('useOffline', 'offline mode enabled');
    } catch (error) {
      logger.error('useOffline', 'enable offline mode failed', error);
    }
  }, []);

  const disableOfflineMode = useCallback(async (): Promise<void> => {
    try {
      await enableNetwork(db);
      setIsConnected(true);
      logger.info('useOffline', 'offline mode disabled');
    } catch (error) {
      logger.error('useOffline', 'disable offline mode failed', error);
    }
  }, []);

  return {
    isOnline,
    isConnected,
    pendingActions,
    queueOfflineAction,
    syncPendingActions,
    clearPendingActions,
    enableOfflineMode,
    disableOfflineMode,
  };
};

// Higher-order component to wrap operations with offline support
export const withOfflineSupport = <
  T extends (...args: unknown[]) => Promise<unknown>
>(
  operation: T,
  offlineAction: Omit<OfflineAction, 'id' | 'timestamp' | 'retry'>
): T => {
  return ((...args: unknown[]) => {
    const { isOnline, queueOfflineAction } = useOffline();

    if (!isOnline) {
      // Queue action for later execution
      queueOfflineAction(offlineAction);
      return Promise.resolve();
    }

    return operation(...(args as Parameters<T>));
  }) as T;
};
