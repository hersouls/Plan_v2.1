// Main entry point for all exports

// Export all types (keep first to avoid circular ambiguities)
export * from './types';

// Export all contexts and providers (avoid re-exporting types already exported by './types')
export { AppProvider, useApp } from './contexts/AppContext';
export { AuthProvider, useAuth } from './contexts/AuthContext';
export { DataProvider, useData } from './contexts/DataContext';
export { TaskProvider, useTask } from './contexts/TaskContext';

// Export essential hooks (avoid wildcard to prevent name collisions)
export { useActivity } from './hooks/useActivity';
export { useComments } from './hooks/useComments';
export { useDebounce } from './hooks/useDebounce';
export { useGroup } from './hooks/useGroup';
export { useLocalStorage } from './hooks/useLocalStorage';
export { useNotifications } from './hooks/useNotifications';
export { useOffline } from './hooks/useOffline';
export { usePagination } from './hooks/usePagination';
export { useTasks } from './hooks/useTasks';
export { useUser } from './hooks/useUser';

// Export all components
export * from './components/layout/WaveBackground';
export * from './components/ui/GlassCard';
export * from './components/ui/WaveButton';

// Export utilities
export * from './lib/fcm';
export * from './lib/firebase';
export * from './lib/firestore';
// Avoid duplicate exported type names (e.g., Coordinates) – export selected utils only
export * from './utils/analytics';
export * from './utils/dateHelpers';
export * from './utils/firebaseCleanup';
export * from './utils/navigationCallback';
export * from './utils/performance';
export * from './utils/pwa';
export * from './utils/youtube';

// Export version info
export const VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString();
export const APP_NAME = 'Moonwave Plan';
