/* eslint-disable react-refresh/only-export-components */
import {
  createUserWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword as firebaseUpdatePassword,
  GithubAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { serverTimestamp } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { cleanupFCM, initializeFCM } from '../lib/fcmManager';
import { auth, checkFirebaseConnection } from '../lib/firebase';
import { userService } from '../lib/firestore';
import logger from '../lib/logger';
import { AuthContextType, ExtendedUser } from '../types/auth';
import { User } from '../types/user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Create initial user profile
  const createUserProfile = async (user: ExtendedUser) => {
    try {
      try {
        const viteEnv = (globalThis as any)?.import?.meta?.env;
        if (viteEnv?.DEV) {
          logger.debug('Creating/updating user profile for:', user.uid);
        }
      } catch {
        /* noop */
      }

      // Add safety check for userService
      if (!userService || typeof userService.getUserProfile !== 'function') {
        logger.error('userService is not properly loaded');
        return;
      }

      const existingProfile = await userService.getUserProfile(user.uid);
      try {
        const viteEnv = (globalThis as any)?.import?.meta?.env;
        if (viteEnv?.DEV) {
          logger.debug('Existing profile:', existingProfile);
        }
      } catch {
        /* noop */
      }

      if (!existingProfile) {
        const initialProfile: Partial<User> = {
          displayName: user.displayName || user.email || 'Unknown User',
          email: user.email || '',
          // Only include avatar if photoURL exists and is not null/undefined
          ...(user.photoURL ? { photoURL: user.photoURL } : {}),
          groupIds: [],
          preferences: {
            theme: 'system',
            language: 'ko',
            timezone: 'Asia/Seoul',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: '24h',
            weekStartsOn: 1,
            notifications: {
              push: true,
              taskReminders: true,
              taskAssignments: true,
              taskCompletions: true,
              taskComments: true,
              dailySummary: true,
              weeklyReport: true,
            },
            defaultTaskSettings: {
              priority: 'medium',
              category: 'household',
              reminderTime: '1h',
            },
            privacy: {
              profileVisible: true,
              activityVisible: true,
              statsVisible: true,
              showOnlineStatus: true,
              showLastSeen: true,
              showTaskActivity: true,
            },
          },
          stats: {
            totalTasksCreated: 0,
            totalTasksCompleted: 0,
            totalTasksAssigned: 0,
            currentStreak: 0,
            longestStreak: 0,
            completionRate: 0,
          },
          badges: [],
          achievements: [],
          points: 0,
          level: 1,
          loginCount: 1,
        };

        // 디버그: 전달 키만 로깅
        try {
          const keys = Object.keys(initialProfile || {});
          logger.debug('auth', 'create profile keys', {
            userId: user.uid,
            keys,
          });
        } catch {
          /* noop */
        }

        // 토큰 갱신으로 만료 토큰 이슈 방지
        try {
          await auth.currentUser?.getIdToken(true);
        } catch {
          /* noop */
        }
        await userService.createOrUpdateUserProfile(user.uid, initialProfile);
      } else {
        // Update login count and last login with safe data
        const updateData: any = {
          loginCount: ((existingProfile as any).loginCount || 0) + 1,
          lastLoginAt: serverTimestamp(),
          lastLoginTime: serverTimestamp(), // 추가: 최근 로그인 시간
          lastSignInTime: serverTimestamp(), // 추가: 최근 로그인 시간 (다른 필드명)
          updatedAt: serverTimestamp(), // 추가: 업데이트 시간
          // Only update photoURL if it's not undefined/null
          ...(user.photoURL && { photoURL: user.photoURL }),
        };

        // 디버그: 전달 키만 로깅
        try {
          const keys = Object.keys(updateData || {});
          logger.debug('auth', 'update profile keys', {
            userId: user.uid,
            keys,
          });
        } catch {
          /* noop */
        }

        // 토큰 갱신으로 만료 토큰 이슈 방지
        try {
          await auth.currentUser?.getIdToken(true);
        } catch {
          /* noop */
        }
        await userService.createOrUpdateUserProfile(user.uid, updateData);
      }
    } catch (error) {
      logger.error('Error creating/updating user profile:', error);
    }
  };

  useEffect(() => {
    // Firebase auth 객체가 제대로 초기화되었는지 확인
    if (!auth) {
      logger.error('Firebase auth is not initialized');
      setLoading(false);
      setError('Firebase 인증 서비스를 초기화할 수 없습니다.');
      return;
    }

    // Firebase 연결 상태 확인 (Auth 초기화만 확인)
    const checkConnection = async () => {
      try {
        const isConnected = await checkFirebaseConnection();
        if (!isConnected) {
          logger.error('Firebase connection failed');
          // 연결 실패 시에도 계속 진행 (오프라인 지원)
          logger.warn('Continuing with offline support');
        } else {
          logger.info('Firebase connection successful');
        }
      } catch (error) {
        logger.error('Firebase connection check failed:', error);
        // 연결 확인 실패 시에도 계속 진행
        logger.warn('Continuing despite connection check failure');
      }
    };

    checkConnection();
    setAuthInitialized(true);
    let profileUnsubscribe: (() => void) | null = null;
    let isSubscribed = true;
    let authUnsubscribe: (() => void) | null = null;

    const setupAuthListener = () => {
      try {
        authUnsubscribe = onAuthStateChanged(
          auth,
          async (user: ExtendedUser | null) => {
            try {
              const viteEnv = (globalThis as any)?.import?.meta?.env;
              if (viteEnv?.DEV) {
                logger.debug(
                  'Auth state changed:',
                  user ? 'User logged in' : 'User logged out'
                );
              }
            } catch {
              /* noop */
            }

            if (!isSubscribed) return;

            setUser(user);

            if (user) {
              try {
                // Create or update user profile
                await createUserProfile(user);

                if (!isSubscribed) return;

                // Initialize FCM for notifications (only if VAPID key is configured)
                if (import.meta.env.VITE_FCM_VAPID_KEY) {
                  try {
                    await initializeFCM();
                    try {
                      const viteEnv = (globalThis as any)?.import?.meta?.env;
                      if (viteEnv?.DEV) {
                        logger.debug('FCM initialized for user:', user.uid);
                      }
                    } catch {
                      /* noop */
                    }
                  } catch (error) {
                    logger.error('Failed to initialize FCM:', error);
                  }
                } else {
                  logger.warn('FCM not initialized: VAPID key not configured');
                }

                if (!isSubscribed) return;

                // 실시간 구독 대신 일회성 데이터 읽기 사용 (assertion 에러 방지)
                try {
                  const profile = await userService.getUserProfile(user.uid);
                  if (isSubscribed) {
                    try {
                      const viteEnv = (globalThis as any)?.import?.meta?.env;
                      if (viteEnv?.DEV) {
                        logger.debug('Profile loaded:', profile);
                      }
                    } catch {
                      /* noop */
                    }
                    setUserProfile(profile);
                  }
                } catch (profileError) {
                  logger.error('Profile loading error:', profileError);
                  if (isSubscribed) {
                    setUserProfile(null);
                  }
                }

                // 실시간 프로필 구독 추가
                try {
                  profileUnsubscribe = userService.subscribeToUserProfile(
                    user.uid,
                    profile => {
                      if (isSubscribed) {
                        try {
                          const viteEnv = (globalThis as any)?.import?.meta
                            ?.env;
                          if (viteEnv?.DEV) {
                            logger.debug(
                              'Profile updated via subscription:',
                              profile
                            );
                          }
                        } catch {
                          /* noop */
                        }
                        setUserProfile(profile);
                      }
                    },
                    error => {
                      logger.error('Profile subscription error:', error);
                    }
                  );
                } catch (subscriptionError) {
                  logger.error(
                    'Failed to subscribe to profile:',
                    subscriptionError
                  );
                }
              } catch (error) {
                logger.error('Error in auth state change:', error);
              }
            } else {
              setUserProfile(null);
              // Cleanup FCM on logout
              try {
                await cleanupFCM();
              } catch (error) {
                logger.warn('Error cleaning up FCM on logout:', error);
              }
              if (profileUnsubscribe) {
                try {
                  profileUnsubscribe();
                } catch (error) {
                  logger.warn(
                    'Error unsubscribing from profile on logout:',
                    error
                  );
                }
                profileUnsubscribe = null;
              }
            }

            if (isSubscribed) {
              setLoading(false);
            }
          }
        );
      } catch (error) {
        logger.error('Error setting up auth listener:', error);
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    setupAuthListener();

    return () => {
      isSubscribed = false;

      if (authUnsubscribe) {
        try {
          authUnsubscribe();
        } catch (error) {
          logger.warn('Error unsubscribing from auth:', error);
        }
      }

      if (profileUnsubscribe) {
        try {
          profileUnsubscribe();
        } catch (error) {
          logger.warn('Error unsubscribing from profile:', error);
        }
      }
    };
  }, []);

  const signInAnonymously = async () => {
    try {
      setError(null);
      setLoading(true);
      await firebaseSignInAnonymously(auth);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '익명 로그인에 실패했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmailAndPassword = async (
    email: string,
    password: string
  ) => {
    try {
      setError(null);
      setLoading(true);
      await firebaseSignInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '이메일 로그인에 실패했습니다.'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmailAndPassword = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    try {
      setError(null);
      setLoading(true);
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 사용자 프로필에 displayName 설정
      if (displayName && result.user) {
        await updateProfile(result.user, {
          displayName: displayName,
        });
      }

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '비밀번호 재설정에 실패했습니다.'
      );
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Google 로그인에 실패했습니다.'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGithub = async () => {
    try {
      setError(null);
      setLoading(true);
      const provider = new GithubAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'GitHub 로그인에 실패했습니다.'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '로그아웃에 실패했습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await userService.createOrUpdateUserProfile(user.uid, updates);
      // 프로필 업데이트 후 사용자 프로필 새로고침
      await refreshUserProfile();
    } catch (error) {
      logger.error('Failed to update user profile:', error);
      throw error;
    }
  };

  // Refresh user profile from Firestore
  const refreshUserProfile = async () => {
    if (!user?.uid) return;

    try {
      const profile = await userService.getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (error) {
      logger.error('Failed to refresh user profile:', error);
    }
  };

  // Update user password
  const updatePassword = async (newPassword: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      setLoading(true);
      await firebaseUpdatePassword(user, newPassword);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : '비밀번호 업데이트에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    error,
    signInAnonymously,
    signInWithEmailAndPassword,
    signUpWithEmailAndPassword,
    signInWithGoogle,
    signInWithGithub,
    resetPassword,
    updatePassword,
    signOut,
    updateUserProfile,
    refreshUserProfile,
  };

  // Firebase auth가 초기화되지 않은 경우 로딩 화면 표시
  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-blue-600 mb-2">초기화 중...</h1>
          <p style={{ color: 'var(--semantic-text-secondary)' }}>
            Firebase 인증 서비스를 초기화하고 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
