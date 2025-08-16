import { BarChart3, Eye, EyeOff, Shield, Users } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { WaveButton } from '../../ui/WaveButton';
import { Typography } from '../../ui/typography';
import type { SettingsSectionProps } from '../types';

export function PrivacySection({
  isActive,
  settings,
  onUpdate,
}: SettingsSectionProps) {
  const updatePrivacy = (
    field: keyof typeof settings.privacy,
    value: boolean
  ) => {
    onUpdate({
      type: 'UPDATE_PRIVACY',
      payload: {
        [field]: value,
      },
    });
  };

  if (!isActive) return null;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Privacy Settings Section */}
      <div className="space-y-6">
        <Typography.H4 className="text-white font-pretendard">
          개인정보 보호
        </Typography.H4>

        <Typography.Caption className="text-white/80">
          다른 사용자에게 공개할 정보를 설정하세요
        </Typography.Caption>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-black/40 transition-all duration-200 hover:shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users size={20} className="text-blue-400" />
              </div>
              <div>
                <Typography.Body className="text-white font-semibold">
                  프로필 공개
                </Typography.Body>
                <Typography.Caption className="text-white/70">
                  그룹 멤버에게 프로필 정보를 공개합니다
                </Typography.Caption>
              </div>
            </div>
            <button
              onClick={() =>
                updatePrivacy(
                  'profileVisible',
                  !settings.privacy.profileVisible
                )
              }
              className={cn(
                'relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-400/30',
                settings.privacy.profileVisible
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg'
                  : 'bg-white/20 border border-white/30 hover:bg-white/30'
              )}
              role="switch"
              aria-checked={settings.privacy.profileVisible}
            >
              <div
                className={cn(
                  'absolute w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 top-1',
                  settings.privacy.profileVisible
                    ? 'translate-x-7'
                    : 'translate-x-1'
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-black/40 transition-all duration-200 hover:shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <BarChart3 size={20} className="text-green-400" />
              </div>
              <div>
                <Typography.Body className="text-white font-semibold">
                  통계 공개
                </Typography.Body>
                <Typography.Caption className="text-white/70">
                  그룹 멤버에게 활동 통계를 공개합니다
                </Typography.Caption>
              </div>
            </div>
            <button
              onClick={() =>
                updatePrivacy('statsVisible', !settings.privacy.statsVisible)
              }
              className={cn(
                'relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-400/30',
                settings.privacy.statsVisible
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg'
                  : 'bg-white/20 border border-white/30 hover:bg-white/30'
              )}
              role="switch"
              aria-checked={settings.privacy.statsVisible}
            >
              <div
                className={cn(
                  'absolute w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 top-1',
                  settings.privacy.statsVisible
                    ? 'translate-x-7'
                    : 'translate-x-1'
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-black/40 transition-all duration-200 hover:shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Eye size={20} className="text-purple-400" />
              </div>
              <div>
                <Typography.Body className="text-white font-semibold">
                  활동 공개
                </Typography.Body>
                <Typography.Caption className="text-white/70">
                  그룹 멤버에게 실시간 활동을 공개합니다
                </Typography.Caption>
              </div>
            </div>
            <button
              onClick={() =>
                updatePrivacy(
                  'activityVisible',
                  !settings.privacy.activityVisible
                )
              }
              className={cn(
                'relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-400/30',
                settings.privacy.activityVisible
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg'
                  : 'bg-white/20 border border-white/30 hover:bg-white/30'
              )}
              role="switch"
              aria-checked={settings.privacy.activityVisible}
            >
              <div
                className={cn(
                  'absolute w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 top-1',
                  settings.privacy.activityVisible
                    ? 'translate-x-7'
                    : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Security Information Section */}
      <div className="space-y-6">
        <Typography.H4 className="text-white font-pretendard">
          보안 정보
        </Typography.H4>

        <Typography.Caption className="text-white/80">
          계정 보안과 데이터 보호에 대한 정보입니다
        </Typography.Caption>

        <div className="space-y-4">
          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Shield size={20} className="text-green-400" />
              </div>
              <Typography.Body className="text-white font-semibold">
                데이터 보호
              </Typography.Body>
            </div>
            <Typography.Caption className="text-white/70">
              모든 개인정보는 안전하게 암호화되어 저장됩니다. Firebase의 최신
              보안 기술을 사용하여 데이터를 보호하고 있습니다.
            </Typography.Caption>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Shield size={20} className="text-blue-400" />
              </div>
              <Typography.Body className="text-white font-semibold">
                계정 보안
              </Typography.Body>
            </div>
            <Typography.Caption className="text-white/70">
              Firebase Authentication을 통해 안전하게 관리됩니다. 2단계 인증을
              활성화하여 계정 보안을 강화할 수 있습니다.
            </Typography.Caption>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <EyeOff size={20} className="text-purple-400" />
              </div>
              <Typography.Body className="text-white font-semibold">
                개인정보 처리방침
              </Typography.Body>
            </div>
            <Typography.Caption className="text-white/70 mb-3 block">
              우리는 사용자의 개인정보를 소중히 여기며, 관련 법규를 준수합니다.
              개인정보는 서비스 제공 목적으로만 사용됩니다.
            </Typography.Caption>
            <WaveButton
              variant="ghost"
              size="sm"
              className="text-blue-400 hover:text-blue-300 underline"
              onClick={() => alert('개인정보 처리방침 페이지로 이동합니다.')}
            >
              개인정보 처리방침 전문 보기
            </WaveButton>
          </div>
        </div>
      </div>

      {/* Privacy Summary Section */}
      <div className="space-y-6">
        <Typography.H4 className="text-white font-pretendard">
          공개 설정 요약
        </Typography.H4>

        <Typography.Caption className="text-white/80">
          현재 개인정보 공개 설정 상태입니다
        </Typography.Caption>

        <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Typography.Caption className="text-white/70">
                프로필 정보
              </Typography.Caption>
              <span
                className={cn(
                  'text-sm font-semibold',
                  settings.privacy.profileVisible
                    ? 'text-green-400'
                    : 'text-red-400'
                )}
              >
                {settings.privacy.profileVisible ? '공개' : '비공개'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <Typography.Caption className="text-white/70">
                활동 통계
              </Typography.Caption>
              <span
                className={cn(
                  'text-sm font-semibold',
                  settings.privacy.statsVisible
                    ? 'text-green-400'
                    : 'text-red-400'
                )}
              >
                {settings.privacy.statsVisible ? '공개' : '비공개'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <Typography.Caption className="text-white/70">
                실시간 활동
              </Typography.Caption>
              <span
                className={cn(
                  'text-sm font-semibold',
                  settings.privacy.activityVisible
                    ? 'text-green-400'
                    : 'text-red-400'
                )}
              >
                {settings.privacy.activityVisible ? '공개' : '비공개'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10">
            <Typography.Caption className="text-white/60">
              이 설정은 언제든지 변경할 수 있습니다. 변경사항은 즉시 적용됩니다.
            </Typography.Caption>
          </div>
        </div>
      </div>
    </div>
  );
}
