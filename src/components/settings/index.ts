// Settings Module - Main Exports

// Main Components
export { SettingsContainer } from './SettingsContainer';
export { SettingsModal } from './SettingsModal';

// Hooks
export { useSettings } from './hooks/useSettings';
export type { UseSettingsReturn } from './hooks/useSettings';

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
