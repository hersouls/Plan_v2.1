import React, { useReducer, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../lib/firebase';
import StorageService from '../../../lib/storage';
import logger from '../../../lib/logger';
import type { DataSettings, NotificationPreferences, PrivacySettings, SettingsAction, SettingsState, UserProfile } from '../types';
import { SettingsContext, type SettingsContextType } from './SettingsContextBase';

// 기본 설정값
const getDefaultSettings = (user: { displayName?: string; email?: string; photoURL?: string } | null): SettingsState => {
  try {
    return {
      profile: {
        displayName: user?.displayName || '',
        email: user?.email || '',
        phone: '',
        location: 'Seoul, South Korea',
        bio: '',
        avatar: user?.photoURL || undefined,
      },
      notifications: {
        channels: {
          push: true,
          inApp: true,
        },
        types: {
          taskReminders: true,
          taskAssigned: true,
          taskCompleted: false,
          taskComments: true,
          groupInvites: true,
          groupUpdates: true,
          weeklyDigest: false,
          dailySummary: true,
        },
        timing: {
          doNotDisturb: false,
          doNotDisturbStart: '22:00',
          doNotDisturbEnd: '08:00',
          reminderTiming: '15min',
        },
        sound: {
          enabled: true,
          volume: 70,
          vibration: true,
        },
      },
      appearance: {
        language: 'ko',
        timezone: 'Asia/Seoul',
        dateFormat: 'yyyy-MM-dd',
        weekStartsOn: 1,
      },
      privacy: {
        profileVisible: true,
        statsVisible: true,
        activityVisible: false,
      },
      data: {
        autoBackup: true,
        backupFrequency: 'weekly',
        dataRetention: 90,
      },
    };
  } catch (error) {
    logger.error('SettingsContext', 'create default settings failed', error);
    return {
      profile: {
        displayName: '',
        email: '',
        phone: '',
        location: 'Seoul, South Korea',
        bio: '',
        avatar: undefined,
      },
      notifications: {
        channels: {
          push: true,
          inApp: true,
        },
        types: {
          taskReminders: true,
          taskAssigned: true,
          taskCompleted: false,
          taskComments: true,
          groupInvites: true,
          groupUpdates: true,
          weeklyDigest: false,
          dailySummary: true,
        },
        timing: {
          doNotDisturb: false,
          doNotDisturbStart: '22:00',
          doNotDisturbEnd: '08:00',
          reminderTiming: '15min',
        },
        sound: {
          enabled: true,
          volume: 70,
          vibration: true,
        },
      },
      appearance: {
        language: 'ko',
        timezone: 'Asia/Seoul',
        dateFormat: 'yyyy-MM-dd',
        weekStartsOn: 1,
      },
      privacy: {
        profileVisible: true,
        statsVisible: true,
        activityVisible: false,
      },
      data: {
        autoBackup: true,
        backupFrequency: 'weekly',
        dataRetention: 90,
      },
    };
  }
};

// Settings Reducer
function settingsReducer(
  state: SettingsState,
  action: SettingsAction
): SettingsState {
  switch (action.type) {
    case 'UPDATE_PROFILE':
      return {
        ...state,
        profile: { ...state.profile, ...action.payload },
      };

    case 'UPDATE_NOTIFICATIONS':
      return {
        ...state,
        notifications: {
          ...state.notifications,
          ...action.payload,
          channels: {
            ...state.notifications.channels,
            ...action.payload.channels,
          },
          types: { ...state.notifications.types, ...action.payload.types },
          timing: { ...state.notifications.timing, ...action.payload.timing },
          sound: { ...state.notifications.sound, ...action.payload.sound },
        },
      };

    case 'UPDATE_APPEARANCE':
      logger.debug('SettingsContext', 'UPDATE_APPEARANCE', action.payload);
      return {
        ...state,
        appearance: { ...state.appearance, ...action.payload },
      };

    case 'UPDATE_PRIVACY':
      return {
        ...state,
        privacy: { ...state.privacy, ...action.payload },
      };

    case 'UPDATE_DATA':
      return {
        ...state,
        data: { ...state.data, ...action.payload },
      };

    case 'LOAD_SETTINGS':
      return action.payload;

    case 'RESET_TO_DEFAULTS':
      return getDefaultSettings(null);

    default:
      return state;
  }
}
interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, dispatch] = useReducer(
    settingsReducer,
    getDefaultSettings(null)
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSyncRef = useRef<number>(0);
  const isInitializedRef = useRef(false);

  const authContext = useAuth();
  const currentUser = useMemo(() => {
    try {
      return authContext.user;
    } catch (error) {
      logger.error('SettingsContext', 'Error accessing auth context', error);
      return null;
    }
  }, [authContext.user]);

  const STORAGE_KEY = 'moonwave-settings' as const;

  const loadSettingsInternal = useCallback(async () => {
    const userId = currentUser?.uid;

    if (!userId) {
      const defaultSettings = getDefaultSettings(null);
      dispatch({ type: 'LOAD_SETTINGS', payload: defaultSettings });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      if (now - lastSyncRef.current < oneHour) {
        const savedSettings = localStorage.getItem(STORAGE_KEY);
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          dispatch({ type: 'LOAD_SETTINGS', payload: settings });
        } else {
          const defaultSettings = getDefaultSettings(currentUser);
          dispatch({ type: 'LOAD_SETTINGS', payload: defaultSettings });
        }
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, 'users', userId);
      const docSnapshot = await getDoc(userDocRef);

      try {
        if (docSnapshot.exists()) {
          const userProfile = docSnapshot.data();
          const savedSettings = localStorage.getItem(STORAGE_KEY);
          let settings;

          if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            settings = {
              ...parsed,
              profile: {
                ...parsed.profile,
                displayName:
                  userProfile.displayName ||
                  authContext.user?.displayName ||
                  parsed.profile.displayName,
                email:
                  userProfile.email ||
                  authContext.user?.email ||
                  parsed.profile.email,
                phone: userProfile.phoneNumber || parsed.profile.phone,
                location:
                  userProfile.location ||
                  parsed.profile.location ||
                  'Seoul, South Korea',
                bio: userProfile.bio || parsed.profile.bio,
                avatar:
                  userProfile.photoURL ||
                  authContext.user?.photoURL ||
                  parsed.profile.avatar,
              },
              notifications:
                userProfile.settings?.notifications || parsed.notifications,
              appearance: userProfile.settings?.appearance || parsed.appearance,
              privacy: userProfile.settings?.privacy || parsed.privacy,
              data: userProfile.settings?.data || parsed.data,
            };
          } else {
            settings = {
              ...getDefaultSettings(currentUser),
              profile: {
                ...getDefaultSettings(currentUser).profile,
                displayName:
                  userProfile.displayName ||
                  authContext.user?.displayName ||
                  getDefaultSettings(currentUser).profile.displayName,
                email:
                  userProfile.email ||
                  authContext.user?.email ||
                  getDefaultSettings(currentUser).profile.email,
                phone:
                  userProfile.phoneNumber ||
                  getDefaultSettings(currentUser).profile.phone,
                location:
                  userProfile.location ||
                  getDefaultSettings(currentUser).profile.location ||
                  'Seoul, South Korea',
                bio:
                  userProfile.bio ||
                  getDefaultSettings(currentUser).profile.bio,
                avatar:
                  userProfile.photoURL ||
                  authContext.user?.photoURL ||
                  getDefaultSettings(currentUser).profile.avatar,
              },
              notifications:
                userProfile.settings?.notifications ||
                getDefaultSettings(currentUser).notifications,
              appearance:
                userProfile.settings?.appearance ||
                getDefaultSettings(currentUser).appearance,
              privacy:
                userProfile.settings?.privacy ||
                getDefaultSettings(currentUser).privacy,
              data:
                userProfile.settings?.data ||
                getDefaultSettings(currentUser).data,
            };
          }

          dispatch({ type: 'LOAD_SETTINGS', payload: settings });
          lastSyncRef.current = now;
        } else {
          const defaultSettings = getDefaultSettings(currentUser);
          dispatch({ type: 'LOAD_SETTINGS', payload: defaultSettings });
          lastSyncRef.current = now;
        }
      } catch (error) {
        logger.error('SettingsContext', 'process user profile failed', error);
        setError('사용자 프로필을 처리하는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      logger.error('SettingsContext', 'load user profile failed', error);
      setError('사용자 프로필을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, authContext.user]);

  const loadSettings = useCallback(async () => {
    await loadSettingsInternal();
  }, [loadSettingsInternal]);

  const saveSettings = useCallback(async () => {
    const userId = currentUser?.uid;
    if (import.meta.env.DEV) logger.debug('SettingsContext', 'save called');
    setSaving(true);
    setError(null);

    try {
      const currentSettings = settings;
      if (import.meta.env.DEV)
        logger.debug('SettingsContext', 'saving settings', currentSettings);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));

      if (userId) {
        const { userService } = await import('../../../lib/firestore');

        const userData = {
          displayName: currentSettings.profile.displayName,
          email: currentSettings.profile.email,
          phoneNumber: currentSettings.profile.phone,
          location: currentSettings.profile.location,
          bio: currentSettings.profile.bio,
          photoURL: currentSettings.profile.avatar,
          settings: {
            notifications: currentSettings.notifications,
            appearance: currentSettings.appearance,
            privacy: currentSettings.privacy,
            data: currentSettings.data,
          },
          updatedAt: Timestamp.now(),
        };

        const filteredData = Object.fromEntries(
          Object.entries(userData).filter(
            ([_, value]) => value !== undefined && value !== ''
          )
        );

        await userService.createOrUpdateUserProfile(userId, filteredData);
      }

      if (import.meta.env.DEV) logger.debug('SettingsContext', 'saved', settings);
    } catch (err) {
      logger.error('SettingsContext', 'save failed', err);
      setError('설정을 저장하는데 실패했습니다.');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [currentUser?.uid, settings]);

  const uploadAvatar = useCallback(
    async (
      file: File,
      onProgress?: (progress: number) => void
    ): Promise<string> => {
      const userId = currentUser?.uid;
      if (!userId) {
        throw new Error('로그인이 필요합니다.');
      }

      setUploadingAvatar(true);
      setError(null);

      try {
        if (
          settings.profile.avatar &&
          settings.profile.avatar.includes('firebase')
        ) {
          try {
            const url = new URL(settings.profile.avatar);
            const pathMatch = url.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)\?/);
            if (pathMatch) {
              const decodedPath = decodeURIComponent(pathMatch[1]);
              await StorageService.deleteFile({
                storageUrl: decodedPath,
              });
            }
          } catch (deleteError) {
            logger.warn('SettingsContext', 'delete old avatar failed', deleteError);
          }
        }

        const fileAttachment = await StorageService.uploadFile(
          file,
          `avatars/${userId}`,
          undefined,
          {
            onProgress: onProgress
              ? progress => onProgress(progress.progress)
              : undefined,
          }
        );

        if (!fileAttachment.downloadUrl) {
          throw new Error('파일 업로드 후 다운로드 URL을 가져올 수 없습니다.');
        }

        const result = {
          downloadURL: fileAttachment.downloadUrl,
        };

        dispatch({
          type: 'UPDATE_PROFILE',
          payload: { avatar: result.downloadURL },
        });

        const updatedSettings = {
          ...settings,
          profile: {
            ...settings.profile,
            avatar: result.downloadURL,
          },
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));

        if (userId) {
          const { userService } = await import('../../../lib/firestore');
          await userService.createOrUpdateUserProfile(userId, {
            photoURL: result.downloadURL || undefined,
            updatedAt: Timestamp.now(),
          });
        }

        return result.downloadURL;
      } catch (error) {
        logger.error('SettingsContext', 'upload avatar failed', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : '아바타 업로드에 실패했습니다.';
        setError(errorMessage);
        throw error;
      } finally {
        setUploadingAvatar(false);
      }
    },
    [currentUser?.uid, settings]
  );

  const deleteAvatar = useCallback(async (): Promise<void> => {
    const userId = currentUser?.uid;
    if (!userId) {
      throw new Error('로그인이 필요합니다.');
    }

    setUploadingAvatar(true);
    setError(null);

    try {
      if (
        settings.profile.avatar &&
        settings.profile.avatar.includes('firebase')
      ) {
        try {
          const url = new URL(settings.profile.avatar);
          const pathMatch = url.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)\?/);
          if (pathMatch) {
            const decodedPath = decodeURIComponent(pathMatch[1]);
            await StorageService.deleteFile({ storageUrl: decodedPath });
          }
        } catch (deleteError) {
          logger.warn(
            'SettingsContext',
            'Failed to delete avatar from storage',
            deleteError
          );
        }
      }

      dispatch({
        type: 'UPDATE_PROFILE',
        payload: { avatar: undefined },
      });

      const updatedSettings = {
        ...settings,
        profile: {
          ...settings.profile,
          avatar: undefined,
        },
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));

      if (userId) {
        const { userService } = await import('../../../lib/firestore');
        await userService.createOrUpdateUserProfile(userId, {
          photoURL: undefined,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      logger.error('SettingsContext', 'delete avatar failed', error);
      const errorMessage =
        error instanceof Error ? error.message : '아바타 삭제에 실패했습니다.';
      setError(errorMessage);
      throw error;
    } finally {
      setUploadingAvatar(false);
    }
  }, [currentUser?.uid, settings]);

  useEffect(() => {
    if (currentUser?.uid && !isInitializedRef.current) {
      isInitializedRef.current = true;
      loadSettingsInternal();
    }
  }, [currentUser?.uid, loadSettingsInternal]);

  useEffect(() => {
    if (currentUser?.uid) {
      const syncInterval = setInterval(() => {
        loadSettingsInternal();
      }, 60 * 60 * 1000);

      syncIntervalRef.current = syncInterval;

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [currentUser?.uid, loadSettingsInternal]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: updates });
  }, []);

  const updateNotifications = useCallback(
    (updates: Partial<NotificationPreferences>) => {
      dispatch({ type: 'UPDATE_NOTIFICATIONS', payload: updates });
    },
    []
  );

  const updatePrivacy = useCallback((updates: Partial<PrivacySettings>) => {
    dispatch({ type: 'UPDATE_PRIVACY', payload: updates });
  }, []);

  const updateData = useCallback((updates: Partial<DataSettings>) => {
    dispatch({ type: 'UPDATE_DATA', payload: updates });
  }, []);

  const resetToDefaults = useCallback(() => {
    dispatch({ type: 'RESET_TO_DEFAULTS' });
  }, []);

  const updateSettings = useCallback((action: SettingsAction) => {
    if (import.meta.env.DEV)
      logger.debug('SettingsContext', 'updateSettings', action);
    dispatch(action);
  }, []);

  const contextValue: SettingsContextType = {
    settings,
    updateSettings,
    updateProfile,
    updateNotifications,
    updatePrivacy,
    updateData,
    saveSettings,
    loadSettings,
    resetToDefaults,
    uploadAvatar,
    deleteAvatar,
    loading,
    saving,
    uploadingAvatar,
    error,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;
