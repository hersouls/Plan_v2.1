import type React from 'react';
// Settings 모듈 전용 타입 정의
export interface SettingsTab {
  id: string;
  label: string;
  icon: React.ComponentType<unknown>;
}

export interface UserProfile {
  displayName: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar?: string;
}

export interface NotificationPreferences {
  channels: {
    push: boolean;
    inApp: boolean;
  };
  types: {
    taskReminders: boolean;
    taskAssigned: boolean;
    taskCompleted: boolean;
    taskComments: boolean;
    groupInvites: boolean;
    groupUpdates: boolean;
    weeklyDigest: boolean;
    dailySummary: boolean;
  };
  timing: {
    doNotDisturb: boolean;
    doNotDisturbStart: string;
    doNotDisturbEnd: string;
    reminderTiming: string;
  };
  sound: {
    enabled: boolean;
    volume: number;
    vibration: boolean;
  };
}

export interface AppearanceSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  weekStartsOn: number; // 0 = Sunday, 1 = Monday
}

export interface PrivacySettings {
  profileVisible: boolean;
  statsVisible: boolean;
  activityVisible: boolean;
}

export interface DataSettings {
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  dataRetention: number; // days
}

// 통합된 Settings 상태
export interface SettingsState {
  profile: UserProfile;
  notifications: NotificationPreferences;
  appearance: AppearanceSettings;
  privacy: PrivacySettings;
  data: DataSettings;
}

// Settings 액션 타입
export type SettingsAction =
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'UPDATE_NOTIFICATIONS'; payload: Partial<NotificationPreferences> }
  | { type: 'UPDATE_APPEARANCE'; payload: Partial<AppearanceSettings> }
  | { type: 'UPDATE_PRIVACY'; payload: Partial<PrivacySettings> }
  | { type: 'UPDATE_DATA'; payload: Partial<DataSettings> }
  | { type: 'RESET_TO_DEFAULTS' }
  | { type: 'LOAD_SETTINGS'; payload: SettingsState };

// 설정 컨테이너 props
export interface SettingsContainerProps {
  mode?: 'page' | 'modal';
  initialTab?: string;
  onClose?: () => void;
  enableCallback?: boolean;
}

// 설정 모달 props
export interface SettingsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  title?: string;
}

// 설정 섹션 공통 props
export interface SettingsSectionProps {
  isActive: boolean;
  settings: SettingsState;
  onUpdate: (action: SettingsAction) => void;
  onSave?: () => Promise<void>;
  saving?: boolean;
}

// 스위치 컴포넌트 props
export interface SettingsToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

// 설정 그룹 props
export interface SettingsGroupProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}
