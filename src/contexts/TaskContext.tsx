import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from '../types/task';
import { taskService } from '../lib/firestore';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';

// Task State Interface
export interface TaskState {
  // Tasks data
  tasks: Task[];
  filteredTasks: Task[];
  
  // Current task details
  selectedTask: Task | null;
  selectedTaskId: string | null;
  
  // Filters and sorting
  filters: TaskFilters;
  sortBy: TaskSortBy;
  sortOrder: 'asc' | 'desc';
  
  // UI state
  viewMode: 'list' | 'grid' | 'calendar';
  showCompleted: boolean;
  
  // Loading and error states
  loading: boolean;
  error: string | null;
  
  // Statistics
  stats: TaskStats;
}

export interface TaskFilters {
  status?: TaskStatus[];
  assigneeId?: string[];
  priority?: string[];
  category?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery: string;
  tags?: string[];
}

export type TaskSortBy = 'dueDate' | 'priority' | 'createdAt' | 'title' | 'status';

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  completionRate: number;
}

// Action Types
export type TaskAction =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'REMOVE_TASK'; payload: string }
  | { type: 'SET_SELECTED_TASK'; payload: { task: Task | null; taskId?: string | null } }
  | { type: 'SET_FILTERS'; payload: Partial<TaskFilters> }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_SORT'; payload: { sortBy: TaskSortBy; sortOrder?: 'asc' | 'desc' } }
  | { type: 'SET_VIEW_MODE'; payload: 'list' | 'grid' | 'calendar' }
  | { type: 'TOGGLE_SHOW_COMPLETED' }
  | { type: 'SET_SHOW_COMPLETED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'APPLY_FILTERS_AND_SORT' };

// Initial State
const initialFilters: TaskFilters = {
  searchQuery: '',
};

const initialState: TaskState = {
  tasks: [],
  filteredTasks: [],
  selectedTask: null,
  selectedTaskId: null,
  filters: initialFilters,
  sortBy: 'dueDate',
  sortOrder: 'asc',
  viewMode: 'list',
  showCompleted: true,
  loading: false,
  error: null,
  stats: {
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    overdue: 0,
    dueToday: 0,
    dueThisWeek: 0,
    completionRate: 0,
  },
};

// Helper function to calculate stats
const calculateStats = (tasks: Task[]): TaskStats => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const total = tasks.length;
  const completed = tasks.filter(task => task.status === 'completed').length;
  const pending = tasks.filter(task => task.status === 'pending').length;
  const inProgress = tasks.filter(task => task.status === 'in_progress').length;
  
  const overdue = tasks.filter(task => 
    task.dueDate && 
    new Date(task.dueDate) < today && 
    task.status !== 'completed'
  ).length;
  
  const dueToday = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate.toDateString() === today.toDateString();
  }).length;
  
  const dueThisWeek = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate <= weekFromNow;
  }).length;
  
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    pending,
    inProgress,
    overdue,
    dueToday,
    dueThisWeek,
    completionRate,
  };
};

// Helper function to filter and sort tasks
const applyFiltersAndSort = (
  tasks: Task[],
  filters: TaskFilters,
  sortBy: TaskSortBy,
  sortOrder: 'asc' | 'desc',
  showCompleted: boolean
): Task[] => {
  let filteredTasks = [...tasks];

  // Apply show completed filter
  if (!showCompleted) {
    filteredTasks = filteredTasks.filter(task => task.status !== 'completed');
  }

  // Apply status filter
  if (filters.status && filters.status.length > 0) {
    filteredTasks = filteredTasks.filter(task => filters.status!.includes(task.status));
  }

  // Apply assignee filter
  if (filters.assigneeId && filters.assigneeId.length > 0) {
    filteredTasks = filteredTasks.filter(task => filters.assigneeId!.includes(task.assigneeId));
  }

  // Apply priority filter
  if (filters.priority && filters.priority.length > 0) {
    filteredTasks = filteredTasks.filter(task => filters.priority!.includes(task.priority));
  }

  // Apply category filter
  if (filters.category && filters.category.length > 0) {
    filteredTasks = filteredTasks.filter(task => filters.category!.includes(task.category));
  }

  // Apply date range filter
  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    filteredTasks = filteredTasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= start && dueDate <= end;
    });
  }

  // Apply search query filter
  if (filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase();
    filteredTasks = filteredTasks.filter(task =>
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Apply tags filter
  if (filters.tags && filters.tags.length > 0) {
    filteredTasks = filteredTasks.filter(task =>
      filters.tags!.some(tag => task.tags.includes(tag))
    );
  }

  // Apply sorting
  filteredTasks.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'dueDate':
        aValue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        bValue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        break;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority] || 0;
        bValue = priorityOrder[b.priority] || 0;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'status':
        const statusOrder = { pending: 1, in_progress: 2, completed: 3 };
        aValue = statusOrder[a.status] || 0;
        bValue = statusOrder[b.status] || 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return filteredTasks;
};

// Reducer
function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'SET_TASKS': {
      const tasks = action.payload;
      const filteredTasks = applyFiltersAndSort(
        tasks,
        state.filters,
        state.sortBy,
        state.sortOrder,
        state.showCompleted
      );
      const stats = calculateStats(tasks);

      return {
        ...state,
        tasks,
        filteredTasks,
        stats,
      };
    }

    case 'ADD_TASK': {
      const tasks = [...state.tasks, action.payload];
      const filteredTasks = applyFiltersAndSort(
        tasks,
        state.filters,
        state.sortBy,
        state.sortOrder,
        state.showCompleted
      );
      const stats = calculateStats(tasks);

      return {
        ...state,
        tasks,
        filteredTasks,
        stats,
      };
    }

    case 'UPDATE_TASK': {
      const tasks = state.tasks.map(task =>
        task.id === action.payload.id
          ? { ...task, ...action.payload.updates }
          : task
      );
      const filteredTasks = applyFiltersAndSort(
        tasks,
        state.filters,
        state.sortBy,
        state.sortOrder,
        state.showCompleted
      );
      const stats = calculateStats(tasks);

      // Update selected task if it was the one that changed
      const selectedTask = state.selectedTask && state.selectedTask.id === action.payload.id
        ? { ...state.selectedTask, ...action.payload.updates }
        : state.selectedTask;

      return {
        ...state,
        tasks,
        filteredTasks,
        stats,
        selectedTask,
      };
    }

    case 'REMOVE_TASK': {
      const tasks = state.tasks.filter(task => task.id !== action.payload);
      const filteredTasks = applyFiltersAndSort(
        tasks,
        state.filters,
        state.sortBy,
        state.sortOrder,
        state.showCompleted
      );
      const stats = calculateStats(tasks);

      // Clear selected task if it was the one that was removed
      const selectedTask = state.selectedTask && state.selectedTask.id === action.payload
        ? null
        : state.selectedTask;
      const selectedTaskId = state.selectedTaskId === action.payload
        ? null
        : state.selectedTaskId;

      return {
        ...state,
        tasks,
        filteredTasks,
        stats,
        selectedTask,
        selectedTaskId,
      };
    }

    case 'SET_SELECTED_TASK':
      return {
        ...state,
        selectedTask: action.payload.task,
        selectedTaskId: action.payload.taskId ?? action.payload.task?.id ?? null,
      };

    case 'SET_FILTERS': {
      const filters = { ...state.filters, ...action.payload };
      const filteredTasks = applyFiltersAndSort(
        state.tasks,
        filters,
        state.sortBy,
        state.sortOrder,
        state.showCompleted
      );

      return {
        ...state,
        filters,
        filteredTasks,
      };
    }

    case 'CLEAR_FILTERS': {
      const filters = initialFilters;
      const filteredTasks = applyFiltersAndSort(
        state.tasks,
        filters,
        state.sortBy,
        state.sortOrder,
        state.showCompleted
      );

      return {
        ...state,
        filters,
        filteredTasks,
      };
    }

    case 'SET_SORT': {
      const { sortBy, sortOrder = state.sortOrder } = action.payload;
      const filteredTasks = applyFiltersAndSort(
        state.tasks,
        state.filters,
        sortBy,
        sortOrder,
        state.showCompleted
      );

      return {
        ...state,
        sortBy,
        sortOrder,
        filteredTasks,
      };
    }

    case 'SET_VIEW_MODE':
      return {
        ...state,
        viewMode: action.payload,
      };

    case 'TOGGLE_SHOW_COMPLETED': {
      const showCompleted = !state.showCompleted;
      const filteredTasks = applyFiltersAndSort(
        state.tasks,
        state.filters,
        state.sortBy,
        state.sortOrder,
        showCompleted
      );

      return {
        ...state,
        showCompleted,
        filteredTasks,
      };
    }

    case 'SET_SHOW_COMPLETED': {
      const showCompleted = action.payload;
      const filteredTasks = applyFiltersAndSort(
        state.tasks,
        state.filters,
        state.sortBy,
        state.sortOrder,
        showCompleted
      );

      return {
        ...state,
        showCompleted,
        filteredTasks,
      };
    }

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'APPLY_FILTERS_AND_SORT': {
      const filteredTasks = applyFiltersAndSort(
        state.tasks,
        state.filters,
        state.sortBy,
        state.sortOrder,
        state.showCompleted
      );

      return {
        ...state,
        filteredTasks,
      };
    }

    default:
      return state;
  }
}

// Context Interface
export interface TaskContextType {
  state: TaskState;
  
  // Task operations
  createTask: (data: Omit<CreateTaskInput, 'userId' | 'groupId'>) => Promise<void>;
  updateTask: (taskId: string, updates: UpdateTaskInput) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskStatus: (taskId: string) => Promise<void>;
  
  // Task selection
  selectTask: (task: Task | null, taskId?: string) => void;
  
  // Filtering and sorting
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  setSort: (sortBy: TaskSortBy, sortOrder?: 'asc' | 'desc') => void;
  
  // View options
  setViewMode: (mode: 'list' | 'grid' | 'calendar') => void;
  toggleShowCompleted: () => void;
  setShowCompleted: (show: boolean) => void;
  
  // Utility functions
  getTodayTasks: () => Task[];
  getUpcomingTasks: (days?: number) => Task[];
  getOverdueTasks: () => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  refreshTasks: () => Promise<void>;
}

// Create Context
const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Hook to use Task Context
export function useTask(): TaskContextType {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
}

// Task Provider Component
export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const { user } = useAuth();
  const { state: appState, setLoading: setAppLoading, setError: setAppError } = useApp();

  // Subscribe to tasks for current group
  useEffect(() => {
    if (!user || !appState.currentGroupId) {
      dispatch({ type: 'SET_TASKS', payload: [] });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    const unsubscribe = taskService.subscribeToGroupTasks(appState.currentGroupId, (tasks) => {
      try {
        dispatch({ type: 'SET_TASKS', payload: tasks });
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        console.error('Error processing tasks:', error);
        dispatch({ type: 'SET_ERROR', payload: '할일 목록을 처리하는 중 오류가 발생했습니다.' });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    });

    return unsubscribe;
  }, [user, appState.currentGroupId]);

  // Task operations
  const createTask = async (data: Omit<CreateTaskInput, 'userId' | 'groupId'>) => {
    if (!user || !appState.currentGroupId) {
      throw new Error('사용자 정보 또는 그룹 정보가 없습니다.');
    }

    try {
      const fullTaskData: CreateTaskInput = {
        ...data,
        userId: user.uid,
        groupId: appState.currentGroupId,
        assigneeId: data.assigneeId || user.uid
      };
      
      await taskService.createTask(fullTaskData);
    } catch (error) {
      console.error('Error creating task:', error);
      dispatch({ type: 'SET_ERROR', payload: '할일을 생성하는 중 오류가 발생했습니다.' });
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: UpdateTaskInput) => {
    try {
      await taskService.updateTask(taskId, updates);
    } catch (error) {
      console.error('Error updating task:', error);
      dispatch({ type: 'SET_ERROR', payload: '할일을 업데이트하는 중 오류가 발생했습니다.' });
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
      dispatch({ type: 'SET_ERROR', payload: '할일을 삭제하는 중 오류가 발생했습니다.' });
      throw error;
    }
  };

  const toggleTaskStatus = async (taskId: string) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || !user) return;

    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    const updates: UpdateTaskInput = {
      status: newStatus,
      ...(newStatus === 'completed' && {
        completedAt: new Date(),
        completedBy: user.uid
      }),
      ...(newStatus === 'pending' && {
        completedAt: undefined,
        completedBy: undefined
      })
    };

    try {
      await updateTask(taskId, updates);
    } catch (error) {
      console.error('Error toggling task status:', error);
      dispatch({ type: 'SET_ERROR', payload: '할일 상태를 변경하는 중 오류가 발생했습니다.' });
    }
  };

  // Task selection
  const selectTask = (task: Task | null, taskId?: string) => {
    dispatch({ type: 'SET_SELECTED_TASK', payload: { task, taskId } });
  };

  // Filtering and sorting
  const setFilters = (filters: Partial<TaskFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const clearFilters = () => {
    dispatch({ type: 'CLEAR_FILTERS' });
  };

  const setSort = (sortBy: TaskSortBy, sortOrder?: 'asc' | 'desc') => {
    dispatch({ type: 'SET_SORT', payload: { sortBy, sortOrder } });
  };

  // View options
  const setViewMode = (mode: 'list' | 'grid' | 'calendar') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  };

  const toggleShowCompleted = () => {
    dispatch({ type: 'TOGGLE_SHOW_COMPLETED' });
  };

  const setShowCompleted = (show: boolean) => {
    dispatch({ type: 'SET_SHOW_COMPLETED', payload: show });
  };

  // Utility functions
  const getTodayTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return state.tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
      return taskDate === today;
    });
  };

  const getUpcomingTasks = (days: number = 7) => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return state.tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate > now && taskDate <= futureDate;
    });
  };

  const getOverdueTasks = () => {
    const now = new Date();
    return state.tasks.filter(task => {
      if (!task.dueDate || task.status === 'completed') return false;
      return new Date(task.dueDate) < now;
    });
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return state.tasks.filter(task => task.status === status);
  };

  const refreshTasks = async () => {
    if (!user || !appState.currentGroupId) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      // The subscription will automatically refresh the data
    } catch (error) {
      console.error('Error refreshing tasks:', error);
      dispatch({ type: 'SET_ERROR', payload: '할일 목록을 새로고침하는 중 오류가 발생했습니다.' });
    }
  };

  const value: TaskContextType = {
    state,
    
    // Task operations
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    
    // Task selection
    selectTask,
    
    // Filtering and sorting
    setFilters,
    clearFilters,
    setSort,
    
    // View options
    setViewMode,
    toggleShowCompleted,
    setShowCompleted,
    
    // Utility functions
    getTodayTasks,
    getUpcomingTasks,
    getOverdueTasks,
    getTasksByStatus,
    refreshTasks,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

export default TaskProvider;