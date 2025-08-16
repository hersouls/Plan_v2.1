import { doc, getDoc, Timestamp } from 'firebase/firestore';
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../lib/firebase';
import StorageService from '../../../lib/storage';
import type {
  DataSettings,
  NotificationPreferences,
  PrivacySettings,
  SettingsAction,
  SettingsState,
  UserProfile,
} from '../types';

// 기본 설정값
const getDefaultSettings = (user: any): SettingsState => {
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
    console.error('Error creating default settings:', error);
    // 기본값 반환
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
          // Deep merge for nested objects
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
      console.log('settingsReducer - UPDATE_APPEARANCE:', action.payload);
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
      return getDefaultSettings(null); // Will be updated with current user

    default:
      return state;
  }
}

export interface UseSettingsReturn {
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

// Settings Hook
export function useSettings(): UseSettingsReturn {
  const [settings, dispatch] = useReducer(
    settingsReducer,
    getDefaultSettings(null)
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<number>(0);
  const isInitializedRef = useRef(false);

  // AuthContext 접근을 안전하게 처리
  const authContext = useAuth();

  // user 객체를 메모이제이션하여 불필요한 리렌더링 방지
  const currentUser = useMemo(() => {
    try {
      return authContext.user;
    } catch (error) {
      console.error('Error accessing auth context:', error);
      return null;
    }
  }, [authContext.user?.uid]); // uid만 의존

  // LocalStorage 키 (상수로 정의)
  const STORAGE_KEY = 'moonwave-settings' as const;

  // 설정 로드 함수 (의존성 없이 정의)
  const loadSettingsInternal = useCallback(async () => {
    const userId = currentUser?.uid;

    if (!userId) {
      // 사용자가 없으면 기본 설정만 로드
      const defaultSettings = getDefaultSettings(null);
      dispatch({ type: 'LOAD_SETTINGS', payload: defaultSettings });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 마지막 동기화로부터 1시간이 지났는지 확인
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1시간 (밀리초)

      if (now - lastSyncRef.current < oneHour) {
        // 1시간이 지나지 않았으면 localStorage에서만 로드
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

      // Firebase에서 사용자 프로필 로드
      const userDocRef = doc(db, 'users', userId);
      const docSnapshot = await getDoc(userDocRef);

      try {
        if (docSnapshot.exists()) {
          const userProfile = docSnapshot.data();

          // localStorage에서 설정 로드
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
              // Firestore에서 저장된 설정 데이터 복원
              notifications:
                userProfile.settings?.notifications || parsed.notifications,
              appearance: userProfile.settings?.appearance || parsed.appearance,
              privacy: userProfile.settings?.privacy || parsed.privacy,
              data: userProfile.settings?.data || parsed.data,
            };
          } else {
            // 기본값 사용하되 Firebase 데이터 반영
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
              // Firestore에서 저장된 설정 데이터 복원
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
          lastSyncRef.current = now; // 동기화 시간 업데이트
        } else {
          // 사용자 문서가 없으면 기본 설정 사용
          const defaultSettings = getDefaultSettings(currentUser);

          dispatch({ type: 'LOAD_SETTINGS', payload: defaultSettings });
          lastSyncRef.current = now; // 동기화 시간 업데이트
        }
      } catch (error) {
        console.error('Error processing user profile:', error);
        setError('사용자 프로필을 처리하는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError('사용자 프로필을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, authContext.user]);

  // 외부에서 호출할 수 있는 loadSettings 함수
  const loadSettings = useCallback(async () => {
    await loadSettingsInternal();
  }, [loadSettingsInternal]);

  // 설정 저장
  const saveSettings = useCallback(async () => {
    const userId = currentUser?.uid;
    console.log('useSettings - saveSettings called');
    console.log('useSettings - current settings:', settings);
    setSaving(true);
    setError(null);

    try {
      // 현재 settings 상태를 안전하게 참조
      const currentSettings = settings;
      console.log('useSettings - saving current settings:', currentSettings);

      // localStorage에 저장
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));

      // Firebase에 사용자 프로필 업데이트
      if (userId) {
        const { userService } = await import('../../../lib/firestore');

        // undefined 값을 필터링하여 Firestore에 전달할 데이터 준비
        const userData = {
          displayName: currentSettings.profile.displayName,
          email: currentSettings.profile.email,
          phoneNumber: currentSettings.profile.phone,
          location: currentSettings.profile.location,
          bio: currentSettings.profile.bio,
          photoURL: currentSettings.profile.avatar,
          // 설정 데이터도 함께 저장
          settings: {
            notifications: currentSettings.notifications,
            appearance: currentSettings.appearance,
            privacy: currentSettings.privacy,
            data: currentSettings.data,
          },
          updatedAt: Timestamp.now(),
        };

        // undefined와 빈 문자열 값 제거
        const filteredData = Object.fromEntries(
          Object.entries(userData).filter(
            ([_, value]) => value !== undefined && value !== ''
          )
        );

        await userService.createOrUpdateUserProfile(userId, filteredData);
      }

      if (import.meta.env.DEV) {
        console.log('Settings saved successfully:', settings);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('설정을 저장하는데 실패했습니다.');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [currentUser?.uid, settings]); // uid와 settings에만 의존

  // 아바타 업로드
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
        // 이전 아바타 삭제 (선택적)
        if (
          settings.profile.avatar &&
          settings.profile.avatar.includes('firebase')
        ) {
          try {
            // Extract file path from URL to delete old avatar
            const url = new URL(settings.profile.avatar);
            const pathMatch = url.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)\?/);
            if (pathMatch) {
              const decodedPath = decodeURIComponent(pathMatch[1]);
              await StorageService.deleteFile({
                storageUrl: decodedPath,
              } as any);
            }
          } catch (deleteError) {
            console.warn('Failed to delete old avatar:', deleteError);
            // 이전 아바타 삭제 실패는 무시하고 계속 진행
          }
        }

        // 새 아바타 업로드
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

        // 프로필 업데이트
        dispatch({
          type: 'UPDATE_PROFILE',
          payload: { avatar: result.downloadURL },
        });

        // 즉시 저장
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
        console.error('Failed to upload avatar:', error);
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

  // 아바타 삭제
  const deleteAvatar = useCallback(async (): Promise<void> => {
    const userId = currentUser?.uid;
    if (!userId) {
      throw new Error('로그인이 필요합니다.');
    }

    setUploadingAvatar(true);
    setError(null);

    try {
      // Firebase Storage에서 아바타 삭제
      if (
        settings.profile.avatar &&
        settings.profile.avatar.includes('firebase')
      ) {
        try {
          const url = new URL(settings.profile.avatar);
          const pathMatch = url.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)\?/);
          if (pathMatch) {
            const decodedPath = decodeURIComponent(pathMatch[1]);
            await StorageService.deleteFile({ storageUrl: decodedPath } as any);
          }
        } catch (deleteError) {
          console.warn('Failed to delete avatar from storage:', deleteError);
        }
      }

      // 프로필에서 아바타 제거
      dispatch({
        type: 'UPDATE_PROFILE',
        payload: { avatar: undefined },
      });

      // 즉시 저장
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
      console.error('Failed to delete avatar:', error);
      const errorMessage =
        error instanceof Error ? error.message : '아바타 삭제에 실패했습니다.';
      setError(errorMessage);
      throw error;
    } finally {
      setUploadingAvatar(false);
    }
  }, [currentUser?.uid, settings]);

  // user 상태가 변경될 때마다 설정 로드 (한 번만 실행)
  useEffect(() => {
    if (currentUser?.uid && !isInitializedRef.current) {
      isInitializedRef.current = true;
      loadSettingsInternal();
    }
  }, [currentUser?.uid]); // loadSettingsInternal을 의존성에서 제거

  // 1시간마다 자동 동기화 설정
  useEffect(() => {
    if (currentUser?.uid) {
      // 1시간마다 자동 동기화
      const syncInterval = setInterval(() => {
        loadSettingsInternal();
      }, 60 * 60 * 1000); // 1시간 (밀리초)

      syncIntervalRef.current = syncInterval;

      // 컴포넌트 언마운트 시 인터벌 정리
      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [currentUser?.uid]); // loadSettingsInternal을 의존성에서 제거

  // 편의 함수들
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
    console.log('useSettings - updateSettings called with action:', action);
    dispatch(action);
  }, []);

  return {
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
}
