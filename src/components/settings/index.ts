// Settings Module - Main Exports

// Main Components
export { SettingsContainer } from './SettingsContainer';
export { SettingsModal } from './SettingsModal';

// Context
export { SettingsProvider } from './contexts/SettingsContext';
export { useSettingsContext } from './contexts/SettingsContextBase';

// Hooks
export { useSettingsTab } from './hooks/useSettingsTab';

// Types
export type {
  AppearanceSettings,
  DataSettings,
  NotificationPreferences,
  PrivacySettings,
  SettingsAction,
  SettingsContainerProps,
  SettingsGroupProps,
  SettingsModalProps,
  SettingsSectionProps,
  SettingsState,
  SettingsTab,
  SettingsToggleProps,
  UserProfile,
} from './types';

// UI Components
export {
  SettingsContent,
  SettingsGroup,
  SettingsNavigation,
  SettingsToggle,
} from './components';

// Section Components
export {
  DataSection,
  NotificationSection,
  PrivacySection,
  ProfileSection,
} from './sections';

// Backward Compatibility Aliases
export { SettingsContainer as Settings } from './SettingsContainer';
export { SettingsModal as SettingsModalComponent } from './SettingsModal';
