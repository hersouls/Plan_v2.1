import {
  AlertTriangle,
  Bell,
  Check,
  Download,
  Edit3,
  Key,
  LogOut,
  Save,
  Settings as SettingsIcon,
  Shield,
  User,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  InlineLoading,
  LoadingSpinner,
} from '../components/common/LoadingSpinner';
import { GlassCard } from '../components/ui/GlassCard';
import { WaveButton } from '../components/ui/WaveButton';
import { Typography } from '../components/ui/typography';
import { useAuth } from '../contexts/AuthContext';
import logger from '../lib/logger';

interface UserSettings {
  notifications: {
    push: boolean;
    email: boolean;
    sound: boolean;
    taskReminders: boolean;
    groupUpdates: boolean;
    weeklyDigest: boolean;
  };
  privacy: {
    profileVisible: boolean;
    statsVisible: boolean;
    activityVisible: boolean;
  };
  language: string;
  timezone: string;
  dateFormat: string;
  weekStartsOn: number; // 0 = Sunday, 1 = Monday
}

function Settings() {
  const { user, signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    'profile' | 'notifications' | 'privacy' | 'data'
  >('profile');
  const [isEditing, setIsEditing] = useState(false);

  // User profile edit state
  const [editProfile, setEditProfile] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
  });

  // Settings state
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      push: true,
      email: true,
      sound: true,
      taskReminders: true,
      groupUpdates: true,
      weeklyDigest: false,
    },
    privacy: {
      profileVisible: true,
      statsVisible: true,
      activityVisible: false,
    },
    language: 'ko',
    timezone: 'Asia/Seoul',
    dateFormat: 'YYYY-MM-DD',
    weekStartsOn: 1,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);

    // Simulate loading settings from API
    setTimeout(() => {
      // Load user preferences (would be from API)
      const savedSettings = localStorage.getItem('moonwave-settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...settings, ...parsed });
        } catch (error) {
          logger.error(
            'Settings_backup',
            'Failed to parse saved settings',
            error
          );
        }
      }

      setEditProfile({
        displayName: user?.displayName || '',
        email: user?.email || '',
      });

      setLoading(false);
    }, 800);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save to localStorage (would be API call)
      localStorage.setItem('moonwave-settings', JSON.stringify(settings));

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (import.meta.env.DEV) {
        logger.info('Settings_backup', 'Settings saved', settings);
      }
    } catch (error) {
      logger.error('Settings_backup', 'Failed to save settings', error);
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      // Update user profile (would be Firebase auth call)
      if (import.meta.env.DEV) {
        logger.info('Settings_backup', 'Update profile', editProfile);
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsEditing(false);
    } catch (error) {
      logger.error('Settings_backup', 'Failed to update profile', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      logger.error('Settings_backup', 'Failed to sign out', error);
    }
  };

  const exportData = async () => {
    try {
      // Export user data
      const data = {
        profile: { displayName: user?.displayName, email: user?.email },
        settings,
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `moonwave-data-${
        new Date().toISOString().split('T')[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Settings_backup', 'Failed to export data', error);
    }
  };

  const tabs = [
    { key: 'profile', label: '프로필', icon: User },
    { key: 'notifications', label: '알림', icon: Bell },
    { key: 'privacy', label: '프라이버시', icon: Shield },
    { key: 'data', label: '데이터', icon: Download },
  ];

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <LoadingSpinner
            size="lg"
            variant="wave"
            text="설정을 불러오는 중..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600">
      <div className="relative z-10 max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-12 xl:py-16">
        {/* Header */}
        <div className="mb-8 lg:mb-12 xl:mb-16">
          <GlassCard
            variant="medium"
            className="p-6 sm:p-8 lg:p-10 xl:p-12 2xl:p-16"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-8 xl:gap-12">
              <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 xl:gap-10">
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <SettingsIcon
                    size={20}
                    className="sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-10 xl:h-10 text-white"
                  />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 lg:mb-3 xl:mb-4 font-pretendard tracking-ko-tight">
                    설정
                  </h1>
                  <Typography.Body className="text-white/80 font-pretendard text-sm sm:text-base lg:text-lg xl:text-xl">
                    앱 설정 및 개인 정보를 관리하세요
                  </Typography.Body>
                </div>
              </div>

              <div className="flex items-center gap-3 lg:gap-4 xl:gap-6">
                <WaveButton
                  onClick={saveSettings}
                  disabled={saving}
                  size="lg"
                  className="font-pretendard px-4 sm:px-6 lg:px-8 xl:px-10 py-2 sm:py-3 lg:py-4 xl:py-5 text-sm sm:text-base lg:text-lg xl:text-xl"
                >
                  {saving ? (
                    <InlineLoading />
                  ) : (
                    <>
                      <Save
                        size={16}
                        className="sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 mr-2"
                      />
                      저장
                    </>
                  )}
                </WaveButton>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 lg:mb-12 xl:mb-16">
          <div className="flex glass-light rounded-xl lg:rounded-2xl xl:rounded-3xl p-1 sm:p-2 lg:p-3 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as any)}
                className={`
                  flex items-center gap-2 sm:gap-3 lg:gap-4 px-3 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 lg:py-4 xl:py-5 rounded-lg lg:rounded-xl xl:rounded-2xl text-sm sm:text-base lg:text-lg xl:text-xl font-medium transition-all duration-200 whitespace-nowrap font-pretendard
                  ${
                    selectedTab === tab.key
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <tab.icon
                  size={14}
                  className="sm:w-4 sm:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6"
                />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6 lg:space-y-8">
          {/* Profile Tab */}
          {selectedTab === 'profile' && (
            <div className="space-y-6 lg:space-y-8">
              <GlassCard variant="light" className="p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
                  <Typography.H3 className="text-white font-pretendard">
                    계정 정보
                  </Typography.H3>
                  <WaveButton
                    variant="ghost"
                    size="lg"
                    onClick={() => setIsEditing(!isEditing)}
                    className="font-pretendard"
                  >
                    {isEditing ? (
                      <>
                        <X size={18} className="lg:w-5 lg:h-5" />
                        취소
                      </>
                    ) : (
                      <>
                        <Edit3 size={18} className="lg:w-5 lg:h-5" />
                        편집
                      </>
                    )}
                  </WaveButton>
                </div>

                <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl lg:text-3xl font-bold shadow-lg">
                    {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                  </div>

                  <div className="flex-1 space-y-6">
                    <div>
                      <Typography.Label className="block text-white mb-3 font-pretendard">
                        이름
                      </Typography.Label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editProfile.displayName}
                          onChange={e =>
                            setEditProfile(prev => ({
                              ...prev,
                              displayName: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 lg:py-4 glass-light rounded-xl lg:rounded-2xl text-base lg:text-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 font-pretendard"
                          placeholder="이름을 입력하세요"
                        />
                      ) : (
                        <Typography.Body className="text-white font-pretendard">
                          {user?.displayName || '설정되지 않음'}
                        </Typography.Body>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm lg:text-base font-semibold text-white mb-3 font-pretendard">
                        이메일
                      </label>
                      <p className="text-white text-base lg:text-lg font-pretendard">
                        {user?.email}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm lg:text-base font-semibold text-white mb-3 font-pretendard">
                        가입일
                      </label>
                      <p className="text-white/80 text-base lg:text-lg font-pretendard">
                        {user?.metadata?.creationTime
                          ? new Date(
                              user.metadata.creationTime
                            ).toLocaleDateString()
                          : '정보 없음'}
                      </p>
                    </div>

                    {isEditing && (
                      <div className="flex gap-3 pt-4">
                        <WaveButton
                          onClick={handleProfileSave}
                          disabled={saving}
                          size="lg"
                          className="font-pretendard"
                        >
                          {saving ? (
                            <InlineLoading />
                          ) : (
                            <>
                              <Check size={18} className="lg:w-5 lg:h-5" />
                              저장
                            </>
                          )}
                        </WaveButton>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>

              <GlassCard variant="light" className="p-6 lg:p-8">
                <h3 className="text-lg lg:text-xl font-semibold text-white mb-6 font-pretendard tracking-ko-tight">
                  계정 관리
                </h3>
                <div className="space-y-4">
                  <WaveButton
                    variant="ghost"
                    className="w-full justify-start font-pretendard text-base lg:text-lg"
                  >
                    <Key size={18} className="lg:w-5 lg:h-5" />
                    비밀번호 변경
                  </WaveButton>
                  <WaveButton
                    variant="ghost"
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 font-pretendard text-base lg:text-lg"
                  >
                    <LogOut size={18} className="lg:w-5 lg:h-5" />
                    로그아웃
                  </WaveButton>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Notifications Tab */}
          {selectedTab === 'notifications' && (
            <GlassCard variant="light" className="p-6 lg:p-8">
              <h2 className="text-xl lg:text-2xl font-semibold text-white mb-8 font-pretendard tracking-ko-tight">
                알림 설정
              </h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-lg lg:text-xl font-semibold text-white mb-6 font-pretendard">
                    알림 방법
                  </h3>
                  <div className="space-y-4">
                    {Object.entries({
                      push: '푸시 알림',
                      email: '이메일 알림',
                      sound: '소리 알림',
                    }).map(([key, label]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 glass-light rounded-xl"
                      >
                        <span className="text-white text-base lg:text-lg font-pretendard">
                          {label}
                        </span>
                        <button
                          onClick={() =>
                            setSettings(prev => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                [key]:
                                  !prev.notifications[
                                    key as keyof typeof prev.notifications
                                  ],
                              },
                            }))
                          }
                          className={`
                            relative w-14 h-7 rounded-full transition-all duration-200
                            ${
                              settings.notifications[
                                key as keyof typeof settings.notifications
                              ]
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                                : 'bg-background/30'
                            }
                          `}
                        >
                          <div
                            className={`
                            absolute w-6 h-6 bg-background rounded-full shadow-md transition-transform duration-200 top-0.5
                            ${
                              settings.notifications[
                                key as keyof typeof settings.notifications
                              ]
                                ? 'translate-x-7'
                                : 'translate-x-0.5'
                            }
                          `}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg lg:text-xl font-semibold text-white mb-6 font-pretendard">
                    알림 유형
                  </h3>
                  <div className="space-y-4">
                    {Object.entries({
                      taskReminders: '할일 리마인더',
                      groupUpdates: '그룹 업데이트',
                      weeklyDigest: '주간 요약',
                    }).map(([key, label]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 glass-light rounded-xl"
                      >
                        <span className="text-white text-base lg:text-lg font-pretendard">
                          {label}
                        </span>
                        <button
                          onClick={() =>
                            setSettings(prev => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                [key]:
                                  !prev.notifications[
                                    key as keyof typeof prev.notifications
                                  ],
                              },
                            }))
                          }
                          className={`
                            relative w-14 h-7 rounded-full transition-all duration-200
                            ${
                              settings.notifications[
                                key as keyof typeof settings.notifications
                              ]
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                                : 'bg-background/30'
                            }
                          `}
                        >
                          <div
                            className={`
                            absolute w-6 h-6 bg-background rounded-full shadow-md transition-transform duration-200 top-0.5
                            ${
                              settings.notifications[
                                key as keyof typeof settings.notifications
                              ]
                                ? 'translate-x-7'
                                : 'translate-x-0.5'
                            }
                          `}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Privacy Tab */}
          {selectedTab === 'privacy' && (
            <GlassCard variant="light" className="p-6 lg:p-8">
              <h2 className="text-xl lg:text-2xl font-semibold text-white mb-8 font-pretendard tracking-ko-tight">
                프라이버시 설정
              </h2>

              <div className="space-y-6">
                {Object.entries({
                  profileVisible: '프로필 공개',
                  statsVisible: '통계 공개',
                  activityVisible: '활동 공개',
                }).map(([key, label]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 glass-light rounded-xl"
                  >
                    <div>
                      <span className="text-white font-semibold text-base lg:text-lg font-pretendard">
                        {label}
                      </span>
                      <p className="text-white/70 text-sm lg:text-base font-pretendard">
                        그룹 멤버에게 {label.toLowerCase()}합니다
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setSettings(prev => ({
                          ...prev,
                          privacy: {
                            ...prev.privacy,
                            [key]:
                              !prev.privacy[key as keyof typeof prev.privacy],
                          },
                        }))
                      }
                      className={`
                        relative w-14 h-7 rounded-full transition-all duration-200
                        ${
                          settings.privacy[key as keyof typeof settings.privacy]
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                            : 'bg-background/30'
                        }
                      `}
                    >
                      <div
                        className={`
                        absolute w-6 h-6 bg-background rounded-full shadow-md transition-transform duration-200 top-0.5
                        ${
                          settings.privacy[key as keyof typeof settings.privacy]
                            ? 'translate-x-7'
                            : 'translate-x-0.5'
                        }
                      `}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Data Tab */}
          {selectedTab === 'data' && (
            <div className="space-y-6 lg:space-y-8">
              <GlassCard variant="light" className="p-6 lg:p-8">
                <h2 className="text-xl lg:text-2xl font-semibold text-white mb-8 font-pretendard tracking-ko-tight">
                  데이터 관리
                </h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg lg:text-xl font-semibold text-white mb-4 font-pretendard">
                      내보내기
                    </h3>
                    <p className="text-white/80 text-base lg:text-lg mb-6 font-pretendard leading-ko-normal">
                      내 할일 데이터와 설정을 JSON 파일로 내보냅니다.
                    </p>
                    <WaveButton
                      onClick={exportData}
                      variant="ghost"
                      className="font-pretendard text-base lg:text-lg"
                    >
                      <Download size={18} className="lg:w-5 lg:h-5" />
                      데이터 내보내기
                    </WaveButton>
                  </div>

                  <hr className="my-8 border-white/20" />

                  <div>
                    <h3 className="text-lg lg:text-xl font-semibold text-red-400 mb-4 font-pretendard">
                      위험 구역
                    </h3>
                    <p className="text-white/80 text-base lg:text-lg mb-6 font-pretendard leading-ko-normal">
                      아래 작업들은 되돌릴 수 없습니다. 신중히 결정하세요.
                    </p>
                    <div className="space-y-4">
                      <WaveButton
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 font-pretendard text-base lg:text-lg"
                      >
                        <AlertTriangle size={18} className="lg:w-5 lg:h-5" />
                        모든 데이터 삭제
                      </WaveButton>
                      <WaveButton
                        onClick={handleSignOut}
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 font-pretendard text-base lg:text-lg"
                      >
                        <LogOut size={18} className="lg:w-5 lg:h-5" />
                        계정 로그아웃
                      </WaveButton>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </div>

        {/* Bottom Save Button */}
        <div className="mt-8 lg:mt-12 flex justify-end">
          <WaveButton
            onClick={saveSettings}
            disabled={saving}
            size="lg"
            className="font-pretendard"
          >
            {saving ? (
              <InlineLoading />
            ) : (
              <>
                <Save size={18} className="lg:w-5 lg:h-5" />
                모든 설정 저장
              </>
            )}
          </WaveButton>
        </div>
      </div>
    </div>
  );
}

export default Settings;
