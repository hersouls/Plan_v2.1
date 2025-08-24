import { Bell, RefreshCw, Settings, TestTube } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fcmManager } from '../../lib/fcmManager';
import logger from '../../lib/logger';
import { NotificationService } from '../../lib/notifications';
import { NotificationSettings as NotificationSettingsType } from '../../types/notification';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Typography } from '../ui/typography';
import { useToast } from '../ui/useToast';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettings = ({
  isOpen,
  onClose,
}: NotificationSettingsProps) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [settings, setSettings] = useState<NotificationSettingsType | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testingNotification, setTestingNotification] = useState(false);
  const [fcmStatus, setFcmStatus] = useState<{
    isReady: boolean;
    token: string | null;
    permission: NotificationPermission;
  }>({
    isReady: false,
    token: null,
    permission: 'default',
  });

  // FCM 상태 확인
  useEffect(() => {
    const checkFCMStatus = () => {
      setFcmStatus({
        isReady: fcmManager.isReady(),
        token: fcmManager.getCurrentToken(),
        permission: Notification.permission,
      });
    };

    checkFCMStatus();
    const interval = setInterval(checkFCMStatus, 5000); // 5초마다 상태 확인

    return () => clearInterval(interval);
  }, []);

  // 설정 로드
  useEffect(() => {
    if (!user?.uid || !isOpen) return;

    const loadSettings = async () => {
      setLoading(true);
      setError(null);

      try {
        let userSettings = await NotificationService.getNotificationSettings(
          user.uid
        );

        if (!userSettings) {
          // 기본 설정 생성
          await NotificationService.createDefaultNotificationSettings(user.uid);
          userSettings = await NotificationService.getNotificationSettings(
            user.uid
          );
        }

        setSettings(userSettings);
      } catch (err) {
        logger.error('notifications', '설정 로드 실패', err);
        setError('알림 설정을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user?.uid, isOpen]);

  // 설정 저장
  const saveSettings = async () => {
    if (!user?.uid || !settings) return;

    setSaving(true);
    setError(null);

    try {
      await NotificationService.saveNotificationSettings(settings);
      success('알림 설정이 저장되었습니다.');
    } catch (err) {
      logger.error('notifications', '설정 저장 실패', err);
      setError('설정을 저장할 수 없습니다.');
    } finally {
      setSaving(false);
    }
  };

  // FCM 초기화
  const initializeFCM = async () => {
    try {
      await fcmManager.initialize();
      success('FCM이 초기화되었습니다.');
    } catch (err) {
      toastError('FCM 초기화에 실패했습니다.');
      logger.error('FCM initialization failed:', err);
    }
  };

  // 알림 권한 요청
  const requestNotificationPermission = async () => {
    try {
      const permission = await fcmManager.requestNotificationPermission();
      if (permission) {
        success('알림 권한이 허용되었습니다.');
        await initializeFCM();
      } else {
        toastError('알림 권한이 거부되었습니다.');
      }
    } catch (err) {
      toastError('알림 권한 요청에 실패했습니다.');
      logger.error('Notification permission request failed:', err);
    }
  };

  // 테스트 알림 전송
  const sendTestNotification = async () => {
    if (!user?.uid) return;

    setTestingNotification(true);
    try {
      await NotificationService.sendTestNotification(user.uid);
      success('테스트 알림이 전송되었습니다.');
    } catch (err) {
      toastError('테스트 알림 전송에 실패했습니다.');
      logger.error('Test notification failed:', err);
    } finally {
      setTestingNotification(false);
    }
  };

  // 설정 변경 핸들러
  const handleSettingChange = (
    key: keyof NotificationSettingsType,
    value: boolean | string | { enabled?: boolean; startTime?: string; endTime?: string }
  ) => {
    if (!settings) return;

    setSettings(prev => {
      if (!prev) return prev;

      if (key === 'quietHours') {
        return {
          ...prev,
          quietHours: { ...prev.quietHours, ...value },
        };
      }

      return {
        ...prev,
        [key]: value,
      };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-blue-600" />
              <Typography.H3>알림 설정</Typography.H3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">설정을 불러오는 중...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <Typography.Body className="text-red-600 mb-4">
                {error}
              </Typography.Body>
              <Button onClick={() => window.location.reload()}>
                다시 시도
              </Button>
            </div>
          ) : settings ? (
            <div className="space-y-6">
              {/* FCM 상태 섹션 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <Typography.H4 className="text-blue-900 mb-3">
                  FCM 상태
                </Typography.H4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">
                      FCM 준비 상태:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        fcmStatus.isReady ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {fcmStatus.isReady ? '준비됨' : '준비되지 않음'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">알림 권한:</span>
                    <span
                      className={`text-sm font-medium ${
                        fcmStatus.permission === 'granted'
                          ? 'text-green-600'
                          : fcmStatus.permission === 'denied'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {fcmStatus.permission === 'granted'
                        ? '허용됨'
                        : fcmStatus.permission === 'denied'
                        ? '거부됨'
                        : '요청 필요'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">FCM 토큰:</span>
                    <span className="text-sm font-medium text-blue-600">
                      {fcmStatus.token ? '설정됨' : '설정되지 않음'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {fcmStatus.permission !== 'granted' && (
                    <Button
                      onClick={requestNotificationPermission}
                      size="sm"
                      variant="outline"
                    >
                      권한 요청
                    </Button>
                  )}
                  {fcmStatus.permission === 'granted' && !fcmStatus.isReady && (
                    <Button onClick={initializeFCM} size="sm" variant="outline">
                      FCM 초기화
                    </Button>
                  )}
                  <Button
                    onClick={sendTestNotification}
                    disabled={testingNotification || !fcmStatus.isReady}
                    size="sm"
                    variant="outline"
                  >
                    {testingNotification ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        전송 중...
                      </>
                    ) : (
                      <>
                        <TestTube className="w-4 h-4 mr-2" />
                        테스트 알림
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* 기본 알림 설정 */}
              <div>
                <Typography.H4 className="mb-4">기본 알림 설정</Typography.H4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Typography.Body className="font-medium">
                        푸시 알림
                      </Typography.Body>
                      <Typography.Small className="text-gray-600">
                        브라우저 푸시 알림을 받습니다
                      </Typography.Small>
                    </div>
                    <Switch
                      checked={settings.push}
                      onCheckedChange={checked =>
                        handleSettingChange('push', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Typography.Body className="font-medium">
                        이메일 알림
                      </Typography.Body>
                      <Typography.Small className="text-gray-600">
                        이메일로 알림을 받습니다
                      </Typography.Small>
                    </div>
                    <Switch
                      checked={settings.email}
                      onCheckedChange={checked =>
                        handleSettingChange('email', checked)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* 알림 유형별 설정 */}
              <div>
                <Typography.H4 className="mb-4">알림 유형별 설정</Typography.H4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Typography.Body className="font-medium">
                        할일 알림
                      </Typography.Body>
                      <Typography.Small className="text-gray-600">
                        할일 관련 알림을 받습니다
                      </Typography.Small>
                    </div>
                    <Switch
                      checked={settings.taskReminders}
                      onCheckedChange={checked =>
                        handleSettingChange('taskReminders', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Typography.Body className="font-medium">
                        할일 할당
                      </Typography.Body>
                      <Typography.Small className="text-gray-600">
                        새로운 할일이 할당될 때 알림을 받습니다
                      </Typography.Small>
                    </div>
                    <Switch
                      checked={settings.taskAssignments}
                      onCheckedChange={checked =>
                        handleSettingChange('taskAssignments', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Typography.Body className="font-medium">
                        할일 완료
                      </Typography.Body>
                      <Typography.Small className="text-gray-600">
                        할일이 완료될 때 알림을 받습니다
                      </Typography.Small>
                    </div>
                    <Switch
                      checked={settings.taskCompletions}
                      onCheckedChange={checked =>
                        handleSettingChange('taskCompletions', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Typography.Body className="font-medium">
                        댓글 알림
                      </Typography.Body>
                      <Typography.Small className="text-gray-600">
                        새로운 댓글이 달릴 때 알림을 받습니다
                      </Typography.Small>
                    </div>
                    <Switch
                      checked={settings.taskComments}
                      onCheckedChange={checked =>
                        handleSettingChange('taskComments', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Typography.Body className="font-medium">
                        일일 요약
                      </Typography.Body>
                      <Typography.Small className="text-gray-600">
                        매일 할일 요약을 받습니다
                      </Typography.Small>
                    </div>
                    <Switch
                      checked={settings.dailySummary}
                      onCheckedChange={checked =>
                        handleSettingChange('dailySummary', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Typography.Body className="font-medium">
                        주간 리포트
                      </Typography.Body>
                      <Typography.Small className="text-gray-600">
                        매주 진행 상황 리포트를 받습니다
                      </Typography.Small>
                    </div>
                    <Switch
                      checked={settings.weeklyReport}
                      onCheckedChange={checked =>
                        handleSettingChange('weeklyReport', checked)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* 방해 금지 시간 */}
              <div>
                <Typography.H4 className="mb-4">방해 금지 시간</Typography.H4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Typography.Body className="font-medium">
                        방해 금지 모드
                      </Typography.Body>
                      <Typography.Small className="text-gray-600">
                        지정된 시간 동안 알림을 받지 않습니다
                      </Typography.Small>
                    </div>
                    <Switch
                      checked={settings.quietHours.enabled}
                      onCheckedChange={checked =>
                        handleSettingChange('quietHours', {
                          ...settings.quietHours,
                          enabled: checked,
                        })
                      }
                    />
                  </div>

                  {settings.quietHours.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Typography.Label>시작 시간</Typography.Label>
                        <Input
                          type="time"
                          value={settings.quietHours.startTime}
                          onChange={e =>
                            handleSettingChange('quietHours', {
                              ...settings.quietHours,
                              startTime: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Typography.Label>종료 시간</Typography.Label>
                        <Input
                          type="time"
                          value={settings.quietHours.endTime}
                          onChange={e =>
                            handleSettingChange('quietHours', {
                              ...settings.quietHours,
                              endTime: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={saveSettings}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? '저장 중...' : '설정 저장'}
                </Button>
                <Button onClick={onClose} variant="outline" className="flex-1">
                  취소
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </GlassCard>
    </div>
  );
};
