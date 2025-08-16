import React, { createContext, useContext, useEffect, useReducer } from 'react';
import * as firestoreServices from '../lib/firestore';
import { FamilyGroup } from '../types/group';
import { useAuth } from './AuthContext';

// App State Interface
export interface AppState {
  // Current group
  currentGroup: FamilyGroup | null;
  currentGroupId: string | null;

  // UI State
  sidebarOpen: boolean;
  darkMode: boolean;

  // Notifications
  notifications: AppNotification[];
  unreadCount: number;

  // Loading states
  loading: {
    groups: boolean;
    tasks: boolean;
    profile: boolean;
  };

  // Error states
  errors: {
    groups: string | null;
    tasks: string | null;
    profile: string | null;
  };
}

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

// Action Types
export type AppAction =
  | {
      type: 'SET_CURRENT_GROUP';
      payload: { group: FamilyGroup | null; groupId: string | null };
    }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'SET_DARK_MODE'; payload: boolean }
  | {
      type: 'ADD_NOTIFICATION';
      payload: Omit<AppNotification, 'id' | 'timestamp'>;
    }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | {
      type: 'SET_LOADING';
      payload: { key: keyof AppState['loading']; loading: boolean };
    }
  | {
      type: 'SET_ERROR';
      payload: { key: keyof AppState['errors']; error: string | null };
    }
  | { type: 'CLEAR_ERRORS' };

// Initial State
const initialState: AppState = {
  currentGroup: null,
  currentGroupId: null,
  sidebarOpen: false,
  darkMode: false,
  notifications: [],
  unreadCount: 0,
  loading: {
    groups: false,
    tasks: false,
    profile: false,
  },
  errors: {
    groups: null,
    tasks: null,
    profile: null,
  },
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_GROUP':
      return {
        ...state,
        currentGroup: action.payload.group,
        currentGroupId: action.payload.groupId,
      };

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen,
      };

    case 'SET_SIDEBAR_OPEN':
      return {
        ...state,
        sidebarOpen: action.payload,
      };

    case 'TOGGLE_DARK_MODE':
      return {
        ...state,
        darkMode: !state.darkMode,
      };

    case 'SET_DARK_MODE':
      return {
        ...state,
        darkMode: action.payload,
      };

    case 'ADD_NOTIFICATION': {
      const newNotification: AppNotification = {
        ...action.payload,
        id: Date.now().toString() + Math.random(),
        timestamp: new Date(),
        read: false,
      };

      const notifications = [
        newNotification,
        ...state.notifications.slice(0, 49),
      ]; // Keep last 50
      const unreadCount = notifications.filter(n => !n.read).length;

      return {
        ...state,
        notifications,
        unreadCount,
      };
    }

    case 'REMOVE_NOTIFICATION': {
      const notifications = state.notifications.filter(
        n => n.id !== action.payload
      );
      const unreadCount = notifications.filter(n => !n.read).length;

      return {
        ...state,
        notifications,
        unreadCount,
      };
    }

    case 'MARK_NOTIFICATION_READ': {
      const notifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, read: true } : n
      );
      const unreadCount = notifications.filter(n => !n.read).length;

      return {
        ...state,
        notifications,
        unreadCount,
      };
    }

    case 'MARK_ALL_NOTIFICATIONS_READ': {
      const notifications = state.notifications.map(n => ({
        ...n,
        read: true,
      }));

      return {
        ...state,
        notifications,
        unreadCount: 0,
      };
    }

    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.loading,
        },
      };

    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.error,
        },
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: {
          groups: null,
          tasks: null,
          profile: null,
        },
      };

    default:
      return state;
  }
}

// Context Interface
export interface AppContextType {
  state: AppState;

  // Actions
  setCurrentGroup: (group: FamilyGroup | null, groupId?: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleDarkMode: () => void;
  setDarkMode: (enabled: boolean) => void;

  // Notifications
  addNotification: (
    notification: Omit<AppNotification, 'id' | 'timestamp'>
  ) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;

  // Loading and Error handling
  setLoading: (key: keyof AppState['loading'], loading: boolean) => void;
  setError: (key: keyof AppState['errors'], error: string | null) => void;
  clearErrors: () => void;

  // Utility functions
  showSuccessMessage: (message: string) => void;
  showErrorMessage: (message: string) => void;
  showInfoMessage: (message: string) => void;
  showWarningMessage: (message: string) => void;
}

// Create Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Hook to use App Context
export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// App Provider Component
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user } = useAuth();

  // Load user preferences from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('moonwave-dark-mode');
    if (savedDarkMode !== null) {
      dispatch({ type: 'SET_DARK_MODE', payload: JSON.parse(savedDarkMode) });
    }

    const savedSidebarOpen = localStorage.getItem('moonwave-sidebar-open');
    if (savedSidebarOpen !== null) {
      dispatch({
        type: 'SET_SIDEBAR_OPEN',
        payload: JSON.parse(savedSidebarOpen),
      });
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('moonwave-dark-mode', JSON.stringify(state.darkMode));
  }, [state.darkMode]);

  useEffect(() => {
    localStorage.setItem(
      'moonwave-sidebar-open',
      JSON.stringify(state.sidebarOpen)
    );
  }, [state.sidebarOpen]);

  // Apply dark mode to HTML document
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (state.darkMode) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  // Load user's default group when user changes
  useEffect(() => {
    if (!user) {
      dispatch({
        type: 'SET_CURRENT_GROUP',
        payload: { group: null, groupId: null },
      });
      return;
    }

    const loadDefaultGroup = async () => {
      try {
        dispatch({
          type: 'SET_LOADING',
          payload: { key: 'groups', loading: true },
        });
        dispatch({
          type: 'SET_ERROR',
          payload: { key: 'groups', error: null },
        });

        // Check if groupService and getUserGroups method exist
        if (
          !firestoreServices.groupService ||
          typeof firestoreServices.groupService.getUserGroups !== 'function'
        ) {
          console.error('groupService or getUserGroups method not available');
          throw new Error('groupService is not properly loaded');
        }

        // Get user's groups and set the first one as current
        const userGroups = await firestoreServices.groupService.getUserGroups(
          user.uid
        );

        if (userGroups.length > 0) {
          const defaultGroup = userGroups[0];
          dispatch({
            type: 'SET_CURRENT_GROUP',
            payload: { group: defaultGroup, groupId: defaultGroup.id },
          });
        }
      } catch (error) {
        console.error('Error loading default group:', error);
        dispatch({
          type: 'SET_ERROR',
          payload: {
            key: 'groups',
            error: '그룹을 불러오는 중 오류가 발생했습니다.',
          },
        });
      } finally {
        dispatch({
          type: 'SET_LOADING',
          payload: { key: 'groups', loading: false },
        });
      }
    };

    loadDefaultGroup();
  }, [user]);

  // Action creators
  const setCurrentGroup = (
    group: FamilyGroup | null,
    groupId?: string | null
  ) => {
    dispatch({
      type: 'SET_CURRENT_GROUP',
      payload: { group, groupId: groupId ?? group?.id ?? null },
    });
  };

  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  const setSidebarOpen = (open: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open });
  };

  const toggleDarkMode = () => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  };

  const setDarkMode = (enabled: boolean) => {
    dispatch({ type: 'SET_DARK_MODE', payload: enabled });
  };

  const addNotification = (
    notification: Omit<AppNotification, 'id' | 'timestamp'>
  ) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const markNotificationRead = (id: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
  };

  const markAllNotificationsRead = () => {
    dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' });
  };

  const clearNotifications = () => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  };

  const setLoading = (key: keyof AppState['loading'], loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { key, loading } });
  };

  const setError = (key: keyof AppState['errors'], error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: { key, error } });
  };

  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  // Utility notification methods
  const showSuccessMessage = (message: string) => {
    addNotification({
      type: 'success',
      title: '성공',
      message,
      read: false,
    });
  };

  const showErrorMessage = (message: string) => {
    addNotification({
      type: 'error',
      title: '오류',
      message,
      read: false,
    });
  };

  const showInfoMessage = (message: string) => {
    addNotification({
      type: 'info',
      title: '정보',
      message,
      read: false,
    });
  };

  const showWarningMessage = (message: string) => {
    addNotification({
      type: 'warning',
      title: '주의',
      message,
      read: false,
    });
  };

  const value: AppContextType = {
    state,

    // Actions
    setCurrentGroup,
    toggleSidebar,
    setSidebarOpen,
    toggleDarkMode,
    setDarkMode,

    // Notifications
    addNotification,
    removeNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,

    // Loading and Error handling
    setLoading,
    setError,
    clearErrors,

    // Utility functions
    showSuccessMessage,
    showErrorMessage,
    showInfoMessage,
    showWarningMessage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppProvider;
