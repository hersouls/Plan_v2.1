import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const DEFAULT_TAB = 'profile';
const VALID_TABS = ['profile', 'notifications', 'privacy', 'data'];

export const useSettingsTab = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState(() => {
    const tabFromUrl = searchParams.get('tab');
    return tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : DEFAULT_TAB;
  });

  // URL에서 탭 변경 감지
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTabState(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  // 탭 변경 시 URL 업데이트 및 localStorage 저장
  const setActiveTab = useCallback((tab: string) => {
    if (VALID_TABS.includes(tab)) {
      setActiveTabState(tab);
      setSearchParams({ tab }, { replace: true });
      localStorage.setItem('moonwave-settings-tab', tab);
    }
  }, [setSearchParams]);

  // 초기 로드 시 localStorage에서 탭 복원
  useEffect(() => {
    const savedTab = localStorage.getItem('moonwave-settings-tab');
    if (savedTab && VALID_TABS.includes(savedTab) && !searchParams.get('tab')) {
      setActiveTab(savedTab);
    }
  }, [setActiveTab, searchParams]);

  return {
    activeTab,
    setActiveTab,
    isValidTab: (tab: string) => VALID_TABS.includes(tab),
  };
};
