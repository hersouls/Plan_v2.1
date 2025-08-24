import {
  AlertCircle,
  Bell,
  BellOff,
  Clock,
  Smartphone,
  Volume2,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '../../../lib/utils';
import { WaveButton } from '../../ui/WaveButton';
import { Typography } from '../../ui/typography';
import type { SettingsSectionProps } from '../types';

export function NotificationSection({
  isActive,
  settings,
  onUpdate,
}: SettingsSectionProps) {
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        new Notification('알림이 활성화되었습니다!', {
          body: 'Moonwave Plan의 알림을 받을 수 있습니다.',
          icon: '/Moonwave.png',
        });
      }
    }
  };

  const toggleChannel = (
    channel: keyof typeof settings.notifications.channels
  ) => {
    onUpdate({
      type: 'UPDATE_NOTIFICATIONS',
      payload: {
        channels: {
          ...settings.notifications.channels,
          [channel]: !settings.notifications.channels[channel],
        },
      },
    });
  };

  const toggleType = (type: keyof typeof settings.notifications.types) => {
    onUpdate({
      type: 'UPDATE_NOTIFICATIONS',
      payload: {
        types: {
          ...settings.notifications.types,
          [type]: !settings.notifications.types[type],
        },
      },
    });
  };

  const updateTiming = (field: string, value: boolean | string | number) => {
    onUpdate({
      type: 'UPDATE_NOTIFICATIONS',
      payload: {
        timing: {
          ...settings.notifications.timing,
          [field]: value,
        },
      },
    });
  };

  const updateSound = (field: string, value: boolean | number) => {
    onUpdate({
      type: 'UPDATE_NOTIFICATIONS',
      payload: {
        sound: {
          ...settings.notifications.sound,
          [field]: value,
        },
      },
    });
  };

  const testNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('테스트 알림', {
        body: '알림이 정상적으로 작동합니다!',
        icon: '/Moonwave.png',
        badge: '/Moonwave.png',
        tag: 'test-notification',
        requireInteraction: false,
      });
    }
  };

  if (!isActive) return null;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Notification Permission Warning */}
      {notificationPermission !== 'granted' && (
        <div className="p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl border-2 border-amber-400/30 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="text-amber-400 mt-0.5 flex-shrink-0"
              size={20}
            />
            <div className="flex-1">
              <Typography.Body className="text-amber-200 font-semibold">
                알림 권한이 필요합니다
              </Typography.Body>
              <Typography.Caption className="text-amber-300/80 mt-1">
                브라우저 알림을 받으려면 권한을 허용해주세요.
              </Typography.Caption>
              <WaveButton
                size="sm"
                variant="ghost"
                onClick={requestNotificationPermission}
                className="mt-3 text-amber-200 hover:text-amber-100 border border-amber-400/30 hover:border-amber-400/50"
              >
                알림 권한 요청
              </WaveButton>
            </div>
          </div>
        </div>
      )}

      {/* Notification Channels Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Typography.H4 className="text-white font-pretendard">
            알림 채널
          </Typography.H4>
          <WaveButton
            size="sm"
            variant="ghost"
            onClick={testNotification}
            disabled={notificationPermission !== 'granted'}
            className="text-white/70 hover:text-white border border-white/20 hover:border-white/40"
          >
            <Zap size={16} className="mr-2" />
            테스트 알림
          </WaveButton>
        </div>

        <Typography.Caption className="text-white/80">
          알림을 받을 방법을 선택하세요
        </Typography.Caption>

        <div className="space-y-4">
          {[
            {
              key: 'push' as const,
              label: '푸시 알림',
              desc: '브라우저 푸시 알림',
              icon: Bell,
              color: 'from-blue-500 to-blue-600',
              bgColor: 'bg-blue-500/20',
              iconColor: 'text-blue-400',
            },
            {
              key: 'inApp' as const,
              label: '인앱 알림',
              desc: '앱 내에서 알림 표시',
              icon: Smartphone,
              color: 'from-orange-500 to-orange-600',
              bgColor: 'bg-orange-500/20',
              iconColor: 'text-orange-400',
            },
          ].map(
            ({ key, label, desc, icon: Icon, bgColor, iconColor }) => (
              <div
                key={key}
                className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-black/40 transition-all duration-200 hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center shadow-md',
                      bgColor
                    )}
                  >
                    <Icon size={20} className={iconColor} />
                  </div>
                  <div>
                    <Typography.Body className="text-white font-semibold">
                      {label}
                    </Typography.Body>
                    <Typography.Caption className="text-white/70">
                      {desc}
                    </Typography.Caption>
                  </div>
                </div>
                <button
                  onClick={() => toggleChannel(key)}
                  className={cn(
                    'relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-400/30',
                    settings.notifications.channels[key]
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg'
                      : 'bg-white/20 border border-white/30 hover:bg-white/30'
                  )}
                  role="switch"
                  aria-checked={settings.notifications.channels[key]}
                >
                  <div
                    className={cn(
                      'absolute w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 top-1',
                      settings.notifications.channels[key]
                        ? 'translate-x-7'
                        : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Notification Types Section */}
      <div className="space-y-6">
        <Typography.H4 className="text-white font-pretendard">
          알림 유형
        </Typography.H4>

        <Typography.Caption className="text-white/80">
          받고 싶은 알림의 종류를 선택하세요
        </Typography.Caption>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              key: 'taskReminders',
              label: '할일 리마인더',
              desc: '마감일 전 알림',
            },
            {
              key: 'taskAssigned',
              label: '할일 할당',
              desc: '새 할일이 할당됨',
            },
            { key: 'taskCompleted', label: '할일 완료', desc: '할일이 완료됨' },
            { key: 'taskComments', label: '댓글 알림', desc: '새 댓글이 달림' },
            { key: 'groupInvites', label: '그룹 초대', desc: '그룹 초대 받음' },
            {
              key: 'groupUpdates',
              label: '그룹 업데이트',
              desc: '그룹 활동 알림',
            },
            { key: 'weeklyDigest', label: '주간 요약', desc: '매주 활동 요약' },
            {
              key: 'dailySummary',
              label: '일일 요약',
              desc: '매일 아침 브리핑',
            },
          ].map(item => (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-black/40 transition-all duration-200 hover:shadow-lg"
            >
              <div>
                <Typography.Body className="text-white font-semibold">
                  {item.label}
                </Typography.Body>
                <Typography.Caption className="text-white/70">
                  {item.desc}
                </Typography.Caption>
              </div>
              <button
                onClick={() =>
                  toggleType(
                    item.key as keyof typeof settings.notifications.types
                  )
                }
                className={cn(
                  'relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-400/30',
                  settings.notifications.types[
                    item.key as keyof typeof settings.notifications.types
                  ]
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg'
                    : 'bg-white/20 border border-white/30 hover:bg-white/30'
                )}
                role="switch"
                aria-checked={
                  settings.notifications.types[
                    item.key as keyof typeof settings.notifications.types
                  ]
                }
              >
                <div
                  className={cn(
                    'absolute w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 top-1',
                    settings.notifications.types[
                      item.key as keyof typeof settings.notifications.types
                    ]
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Timing Section */}
      <div className="space-y-6">
        <Typography.H4 className="text-white font-pretendard">
          알림 시간 설정
        </Typography.H4>

        <Typography.Caption className="text-white/80">
          알림을 받을 시간을 설정하세요
        </Typography.Caption>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <BellOff size={20} className="text-white/60" />
              </div>
              <div>
                <Typography.Body className="text-white font-semibold">
                  방해 금지 모드
                </Typography.Body>
                <Typography.Caption className="text-white/70">
                  설정한 시간 동안 알림 중지
                </Typography.Caption>
              </div>
            </div>
            <button
              onClick={() =>
                updateTiming(
                  'doNotDisturb',
                  !settings.notifications.timing.doNotDisturb
                )
              }
              className={cn(
                'relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-400/30',
                settings.notifications.timing.doNotDisturb
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg'
                  : 'bg-white/20 border border-white/30 hover:bg-white/30'
              )}
              role="switch"
              aria-checked={settings.notifications.timing.doNotDisturb}
            >
              <div
                className={cn(
                  'absolute w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 top-1',
                  settings.notifications.timing.doNotDisturb
                    ? 'translate-x-7'
                    : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {settings.notifications.timing.doNotDisturb && (
            <div className="ml-8 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <Typography.Label className="text-white/90 mb-2 block">
                    시작 시간
                  </Typography.Label>
                  <input
                    type="time"
                    value={settings.notifications.timing.doNotDisturbStart}
                    onChange={e =>
                      updateTiming('doNotDisturbStart', e.target.value)
                    }
                    className={cn(
                      'w-full px-4 py-3 border-2 rounded-xl',
                      'bg-background/95 backdrop-blur-sm',
                      'text-foreground',
                      'transition-all duration-200',
                      'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                      'group-hover:shadow-md'
                    )}
                  />
                </div>
                <div className="group">
                  <Typography.Label className="text-white/90 mb-2 block">
                    종료 시간
                  </Typography.Label>
                  <input
                    type="time"
                    value={settings.notifications.timing.doNotDisturbEnd}
                    onChange={e =>
                      updateTiming('doNotDisturbEnd', e.target.value)
                    }
                    className={cn(
                      'w-full px-4 py-3 border-2 rounded-xl',
                      'bg-background/95 backdrop-blur-sm',
                      'text-foreground',
                      'transition-all duration-200',
                      'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                      'group-hover:shadow-md'
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="group">
            <Typography.Label className="text-white/90 mb-3 flex items-center gap-2">
              <Clock size={16} />
              리마인더 타이밍
            </Typography.Label>
            <select
              value={settings.notifications.timing.reminderTiming}
              onChange={e => updateTiming('reminderTiming', e.target.value)}
              className={cn(
                'w-full px-4 py-3 border-2 rounded-xl',
                'bg-background/95 backdrop-blur-sm',
                'text-foreground',
                'transition-all duration-200',
                'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                'group-hover:shadow-md'
              )}
            >
              <option value="immediate">즉시</option>
              <option value="5min">5분 전</option>
              <option value="15min">15분 전</option>
              <option value="30min">30분 전</option>
              <option value="1hour">1시간 전</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sound and Vibration Section */}
      <div className="space-y-6">
        <Typography.H4 className="text-white font-pretendard">
          소리 및 진동
        </Typography.H4>

        <Typography.Caption className="text-white/80">
          알림음과 진동을 설정하세요
        </Typography.Caption>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Volume2 size={20} className="text-white/60" />
              </div>
              <div>
                <Typography.Body className="text-white font-semibold">
                  알림음
                </Typography.Body>
              </div>
            </div>
            <button
              onClick={() =>
                updateSound('enabled', !settings.notifications.sound.enabled)
              }
              className={cn(
                'relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-400/30',
                settings.notifications.sound.enabled
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg'
                  : 'bg-white/20 border border-white/30 hover:bg-white/30'
              )}
              role="switch"
              aria-checked={settings.notifications.sound.enabled}
            >
              <div
                className={cn(
                  'absolute w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 top-1',
                  settings.notifications.sound.enabled
                    ? 'translate-x-7'
                    : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {settings.notifications.sound.enabled && (
            <div className="ml-8 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <Typography.Label className="text-white/90 mb-3 block">
                볼륨: {settings.notifications.sound.volume}%
              </Typography.Label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.notifications.sound.volume}
                onChange={e => updateSound('volume', parseInt(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Smartphone size={20} className="text-white/60" />
              </div>
              <div>
                <Typography.Body className="text-white font-semibold">
                  진동
                </Typography.Body>
              </div>
            </div>
            <button
              onClick={() =>
                updateSound(
                  'vibration',
                  !settings.notifications.sound.vibration
                )
              }
              className={cn(
                'relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-400/30',
                settings.notifications.sound.vibration
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg'
                  : 'bg-white/20 border border-white/30 hover:bg-white/30'
              )}
              role="switch"
              aria-checked={settings.notifications.sound.vibration}
            >
              <div
                className={cn(
                  'absolute w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 top-1',
                  settings.notifications.sound.vibration
                    ? 'translate-x-7'
                    : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
