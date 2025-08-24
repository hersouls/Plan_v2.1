import React from 'react';
import { GlassCard } from '../../ui/GlassCard';
import { Typography } from '../../ui/typography';
import { useSettingsContext } from '../contexts/SettingsContext';
import {
  DataSection,
  NotificationSection,
  PrivacySection,
  ProfileSection,
} from '../sections';
import type { SettingsState } from '../types';

interface SettingsContentProps {
  activeTab: string;
  settings: SettingsState;
  saving?: boolean;
}

export const SettingsContent: React.FC<SettingsContentProps> = ({
  activeTab,
  settings,
  saving,
}) => {
  const { updateSettings } = useSettingsContext();

  return (
    <div className="space-y-6 lg:space-y-8">
      {activeTab === 'profile' && (
        <ProfileSection
          isActive={true}
          settings={settings}
          onUpdate={updateSettings}
          saving={saving}
        />
      )}

      {activeTab === 'notifications' && (
        <GlassCard
          variant="medium"
          className="p-6 lg:p-8 xl:p-10 transition-all duration-300 hover:shadow-xl"
          hover
        >
          <Typography.H3 className="text-white mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full" />
            </div>
            알림 설정
          </Typography.H3>
          <NotificationSection
            isActive={true}
            settings={settings}
            onUpdate={updateSettings}
            saving={saving}
          />
        </GlassCard>
      )}

      {activeTab === 'privacy' && (
        <GlassCard
          variant="medium"
          className="p-6 lg:p-8 xl:p-10 transition-all duration-300 hover:shadow-xl"
          hover
        >
          <Typography.H3 className="text-white mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full" />
            </div>
            프라이버시 설정
          </Typography.H3>
          <PrivacySection
            isActive={true}
            settings={settings}
            onUpdate={updateSettings}
            saving={saving}
          />
        </GlassCard>
      )}

      {activeTab === 'data' && (
        <GlassCard
          variant="medium"
          className="p-6 lg:p-8 xl:p-10 transition-all duration-300 hover:shadow-xl"
          hover
        >
          <Typography.H3 className="text-white mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full" />
            </div>
            데이터 관리
          </Typography.H3>
          <DataSection
            isActive={true}
            settings={settings}
            onUpdate={updateSettings}
            saving={saving}
          />
        </GlassCard>
      )}
    </div>
  );
};
