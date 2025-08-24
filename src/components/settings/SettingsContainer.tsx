import logger from '@/lib/logger';
import { Save } from 'lucide-react';
import React from 'react';
import { InlineLoading, LoadingSpinner } from '../common/LoadingSpinner';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';
import { SettingsContent, SettingsNavigation } from './components';
import { useSettingsContext } from './contexts/SettingsContext';
import { useSettingsTab } from './hooks/useSettingsTab';
import type { SettingsContainerProps } from './types';

export const SettingsContainer: React.FC<SettingsContainerProps> = ({
  mode = 'page',
}) => {
  const { activeTab, setActiveTab } = useSettingsTab();
  const { settings, saveSettings, loading, saving, error } = useSettingsContext();

  // 로딩 중일 때
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

  // 에러 처리
  if (error) {
    return (
      <div className="min-h-screen">
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <GlassCard variant="light" className="p-8 max-w-md">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-red-600 mb-2">
                설정 로드 실패
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <WaveButton onClick={() => window.location.reload()}>
                다시 시도
              </WaveButton>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  // 페이지 모드 렌더링
  if (mode === 'page') {
    return (
      <div className="min-h-screen">
        <div
          className="relative z-10 max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-12 xl:py-16 fixed-header-spacing"
          style={{ paddingTop: '120px' }}
        >
          {/* Header Section - family/tasks/create와 유사한 스타일 */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
              <div className="flex-1 min-w-0">
                <Typography.H2 className="text-white mb-2 text-xl sm:text-2xl lg:text-3xl break-keep-ko">
                  설정
                </Typography.H2>
                <Typography.Body className="text-white/90 text-sm sm:text-base break-keep-ko">
                  앱 설정 및 개인 정보를 관리하세요
                </Typography.Body>
              </div>

              <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                <WaveButton
                  onClick={() => {
                    logger.info('settings', 'Global save button clicked');
                    logger.debug('settings', 'Current settings', settings);
                    saveSettings();
                  }}
                  disabled={saving}
                  size="lg"
                  variant="primary"
                  className="font-pretendard text-lg px-8 py-4 min-h-[60px] flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 ease-out"
                  aria-label="설정 저장"
                >
                  {saving ? (
                    <LoadingSpinner size="lg" />
                  ) : (
                    <>
                      <Save size={24} className="text-white" />
                      <span className="ml-2 text-white">저장</span>
                    </>
                  )}
                </WaveButton>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mb-8">
            <GlassCard variant="light" className="p-6 lg:p-8">
              <SettingsNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
                mode="page"
              />
            </GlassCard>
          </div>

          {/* Content */}
          <div className="space-y-6 lg:space-y-8">
            <SettingsContent
              activeTab={activeTab}
              settings={settings}
              saving={saving}
            />
          </div>
        </div>
      </div>
    );
  }

  // 모달 모드는 SettingsModal에서 처리
  return (
    <div className="settings-container-content">
      {/* Header for Modal Mode */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white font-pretendard">
            설정
          </h2>
          <WaveButton
            onClick={() => {
              logger.info('settings', 'Modal save button clicked');
              logger.debug('settings', 'Current settings', settings);
              saveSettings();
            }}
            disabled={saving}
            size="sm"
            variant="ghost"
            className="font-pretendard"
          >
            {saving ? (
              <InlineLoading />
            ) : (
              <>
                <Save size={16} />
                저장
              </>
            )}
          </WaveButton>
        </div>

        {/* Navigation for Modal */}
        <SettingsNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          mode="modal"
        />
      </div>

      {/* Content */}
      <SettingsContent
        activeTab={activeTab}
        settings={settings}
        saving={saving}
      />
    </div>
  );
};
