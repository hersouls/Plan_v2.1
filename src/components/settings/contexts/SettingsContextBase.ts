import { createContext, useContext } from 'react';
import type {
  DataSettings,
  NotificationPreferences,
  PrivacySettings,
  SettingsAction,
  SettingsState,
  UserProfile,
} from '../types';

export interface SettingsContextType {
  settings: SettingsState;
  updateSettings: (action: SettingsAction) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateNotifications: (updates: Partial<NotificationPreferences>) => void;
  updatePrivacy: (updates: Partial<PrivacySettings>) => void;
  updateData: (updates: Partial<DataSettings>) => void;
  saveSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
  resetToDefaults: () => void;
  uploadAvatar: (
    file: File,
    onProgress?: (progress: number) => void
  ) => Promise<string>;
  deleteAvatar: () => Promise<void>;
  loading: boolean;
  saving: boolean;
  uploadingAvatar: boolean;
  error: string | null;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};

