import { Bell, Download, Shield, User } from 'lucide-react';
import React from 'react';
import { cn } from '../../../lib/utils';
import { WaveButton } from '../../ui/WaveButton';
import { Typography } from '../../ui/typography';
import type { SettingsTab } from '../types';

interface SettingsNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  mode?: 'page' | 'modal';
}

// 기본 탭 설정
const defaultTabs: SettingsTab[] = [
  { id: 'profile', label: '프로필', icon: User },
  { id: 'notifications', label: '알림', icon: Bell },
  { id: 'privacy', label: '프라이버시', icon: Shield },
  { id: 'data', label: '데이터', icon: Download },
];

export const SettingsNavigation: React.FC<SettingsNavigationProps> = ({
  activeTab,
  onTabChange,
  mode = 'page',
}) => {
  if (mode === 'modal') {
    // 모달 모드: 가로 탭
    return (
      <div className="flex space-x-1 p-1 bg-white/10 rounded-lg mb-6">
        {defaultTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
              ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }
            `}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
    );
  }

  // 페이지 모드: family/tasks/create와 유사한 스타일
  return (
    <div className="space-y-4">
      <Typography.H4 className="text-white font-pretendard mb-4">
        설정 카테고리
      </Typography.H4>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {defaultTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <WaveButton
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'ghost'}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative p-4 h-auto justify-start border-2 transition-all duration-300',
                activeTab === tab.id
                  ? 'border-primary-400 bg-gradient-to-br from-primary-50 to-primary-100 shadow-lg'
                  : 'border-slate-300 hover:border-slate-400 bg-white/95 backdrop-blur-sm shadow-md hover:shadow-lg'
              )}
              aria-label={`${tab.label} 설정`}
            >
              <div className="flex items-center gap-3 w-full">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md',
                    'bg-gradient-to-br',
                    activeTab === tab.id
                      ? 'from-primary-500 to-primary-700'
                      : 'from-slate-200 to-slate-300'
                  )}
                >
                  <Icon
                    size={20}
                    className={cn(
                      activeTab === tab.id ? 'text-white' : 'text-slate-700'
                    )}
                  />
                </div>
                <div className="flex-1 text-left">
                  <Typography.BodySmall
                    className={cn(
                      'font-semibold',
                      activeTab === tab.id
                        ? 'text-primary-700'
                        : 'text-slate-800'
                    )}
                  >
                    {tab.label}
                  </Typography.BodySmall>
                  <Typography.Caption
                    className={cn(
                      activeTab === tab.id
                        ? 'text-primary-600'
                        : 'text-slate-600'
                    )}
                  >
                    {tab.id === 'profile' && '개인 정보 관리'}
                    {tab.id === 'notifications' && '알림 설정'}
                    {tab.id === 'privacy' && '개인정보 보호'}
                    {tab.id === 'data' && '데이터 관리'}
                  </Typography.Caption>
                </div>
                {activeTab === tab.id && (
                  <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </WaveButton>
          );
        })}
      </div>
    </div>
  );
};
